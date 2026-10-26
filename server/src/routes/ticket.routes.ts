import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { authenticate } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { aiService, BookContext, calculateSlaDeadline } from "../services/ai.service";
import { socketService } from "../services/socket.service";

const router = Router();

const createTicketSchema = z.object({
  bookId: z.string().nullable().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  attachmentUrl: z.string().nullable().optional(),
  attachmentName: z.string().nullable().optional(),
});

const createMessageSchema = z.object({
  message: z.string().min(1, "Message content cannot be empty"),
  isInternalNote: z.boolean().optional().default(false),
  attachmentUrl: z.string().nullable().optional(),
  attachmentName: z.string().nullable().optional(),
});

/**
 * @openapi
 * /api/tickets:
 *   post:
 *     summary: Raise a new support ticket (Author)
 */
router.post("/", authenticate, validateBody(createTicketSchema), async (req, res, next) => {
  try {
    const user = req.user!;
    const { bookId, subject, description, attachmentUrl, attachmentName } = req.body;

    let bookContext: BookContext | null = null;
    if (bookId) {
      const book = await prisma.book.findUnique({ where: { id: bookId } });
      if (book) {
        // Ensure author owns the book
        if (user.role === "AUTHOR" && book.authorId !== user.id) {
          res.status(403).json({
            success: false,
            error: { code: "FORBIDDEN", message: "You cannot raise a ticket for a book that does not belong to you." },
          });
          return;
        }
        bookContext = {
          id: book.id,
          title: book.title,
          isbn: book.isbn,
          status: book.status,
          mrp: book.mrp,
          totalCopiesSold: book.totalCopiesSold,
          totalRoyaltyEarned: book.totalRoyaltyEarned,
          royaltyPaid: book.royaltyPaid,
          royaltyPending: book.royaltyPending,
          lastRoyaltyPayoutDate: book.lastRoyaltyPayoutDate,
          printPartner: book.printPartner,
          availableOn: typeof book.availableOn === "string" ? JSON.parse(book.availableOn) : book.availableOn,
        };
      }
    }

    // 1. AI Classification & Priority Scoring (Graceful degradation built-in)
    const classification = await aiService.classifyTicket(subject, description, bookContext);
    const slaDueAt = calculateSlaDeadline(classification.category);

    // 2. Pre-generate AI Draft Response for Admin
    const authorContext = {
      id: user.id,
      name: user.name,
      email: user.email,
    };
    const draft = await aiService.generateDraftResponse(
      subject,
      description,
      classification.category,
      authorContext,
      bookContext
    );

    // 3. Generate unique ticket number
    const count = await prisma.ticket.count();
    const ticketNumber = `BL-${1001 + count}`;

    // Check potential duplicate open ticket
    const existingActive = await prisma.ticket.findFirst({
      where: {
        authorId: user.id,
        status: { in: ["Open", "In Progress"] },
        ...(bookId ? { bookId } : { category: classification.category }),
      },
      select: { ticketNumber: true, subject: true },
    });

    // 4. Save Ticket & Initial Message in a transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const createdTicket = await tx.ticket.create({
        data: {
          ticketNumber,
          authorId: user.id,
          bookId: bookId || null,
          subject,
          description,
          category: classification.category,
          aiCategory: classification.category,
          priority: classification.priority,
          aiPriority: classification.priority,
          priorityReasoning: classification.priorityReasoning,
          sentiment: classification.sentiment,
          slaDueAt,
          status: "Open",
          aiDraftResponse: draft.draftResponse,
          aiDraftConfidence: draft.confidence,
          aiDraftGeneratedAt: new Date(),
        },
        include: {
          book: true,
          author: {
            select: { id: true, name: true, email: true, phone: true, city: true },
          },
        },
      });

      await tx.ticketMessage.create({
        data: {
          ticketId: createdTicket.id,
          senderId: user.id,
          senderRole: user.role,
          message: description,
          isInternalNote: false,
          attachmentUrl: attachmentUrl || null,
          attachmentName: attachmentName || null,
        },
      });

      return createdTicket;
    });

    // 5. Notify Admins and Author via WebSockets
    socketService.notifyTicketCreated(ticket);

    res.status(201).json({
      success: true,
      data: {
        ticket,
        meta: {
          aiProviderUsed: classification.providerUsed,
          possibleDuplicateOf: existingActive ? existingActive.ticketNumber : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/tickets:
 *   get:
 *     summary: List tickets (Filtered by author if AUTHOR, full queue if ADMIN)
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const user = req.user!;
    const { status, category, priority, search, sortBy } = req.query as {
      status?: string;
      category?: string;
      priority?: string;
      search?: string;
      sortBy?: string;
    };

    const whereClause: any = {};

    // Role filtering: authors only see their own tickets
    if (user.role === "AUTHOR") {
      whereClause.authorId = user.id;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    if (priority && priority !== "ALL") {
      whereClause.priority = priority;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { ticketNumber: { contains: q } },
        { subject: { contains: q } },
        { description: { contains: q } },
        { author: { name: { contains: q } } },
        { author: { email: { contains: q } } },
        { book: { title: { contains: q } } },
      ];
    }

    // Urgency sorting: Critical > High > Medium > Low, and oldest unresolved tickets first
    let orderBy: any = [{ createdAt: "desc" }];
    if (sortBy === "oldest") {
      orderBy = [{ createdAt: "asc" }];
    } else if (sortBy === "urgent") {
      // For urgent sorting, we can prioritize unresolved and sort by priority weight in memory or multiple orders
      orderBy = [{ createdAt: "asc" }];
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        author: {
          select: { id: true, name: true, email: true, phone: true, city: true },
        },
        book: {
          select: { id: true, title: true, isbn: true, status: true, royaltyPending: true },
        },
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          select: { id: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy,
    });

    // Custom sorting helper for urgency if requested
    let resultTickets = tickets;
    if (sortBy === "urgent") {
      const priorityWeights: Record<string, number> = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1,
      };
      const statusWeights: Record<string, number> = {
        Open: 3,
        "In Progress": 2,
        Resolved: 1,
        Closed: 0,
      };

      resultTickets = [...tickets].sort((a, b) => {
        const scoreA = (priorityWeights[a.priority] || 1) * 10 + (statusWeights[a.status] || 0);
        const scoreB = (priorityWeights[b.priority] || 1) * 10 + (statusWeights[b.status] || 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // oldest first
      });
    }

    res.json({
      success: true,
      data: {
        tickets: resultTickets,
        total: resultTickets.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/tickets/:id:
 *   get:
 *     summary: Get single ticket details and conversation thread
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }],
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, phone: true, city: true, joinedDate: true },
        },
        book: true,
        assignedAdmin: {
          select: { id: true, name: true, email: true },
        },
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        auditLogs: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
      return;
    }

    // Role-based access control: Authors can only view their own ticket
    if (user.role === "AUTHOR" && ticket.authorId !== user.id) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have permission to view this ticket." },
      });
      return;
    }

    // CRITICAL: Filter out internal notes for authors!
    let visibleMessages = ticket.messages;
    if (user.role === "AUTHOR") {
      visibleMessages = ticket.messages.filter((m) => !m.isInternalNote);
    }

    const formattedBook = ticket.book
      ? {
          ...ticket.book,
          availableOn: typeof ticket.book.availableOn === "string" ? JSON.parse(ticket.book.availableOn) : ticket.book.availableOn,
        }
      : null;

    res.json({
      success: true,
      data: {
        ticket: {
          ...ticket,
          book: formattedBook,
          messages: visibleMessages,
          // Hide AI draft internals and audit logs from authors
          ...(user.role === "AUTHOR" && {
            aiDraftResponse: undefined,
            aiDraftConfidence: undefined,
            auditLogs: undefined,
          }),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/tickets/:id/messages:
 *   post:
 *     summary: Add a message or response to a ticket thread
 */
router.post("/:id/messages", authenticate, validateBody(createMessageSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;
    const { message, isInternalNote, attachmentUrl, attachmentName } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [{ id }, { ticketNumber: id }],
      },
    });

    if (!ticket) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Ticket not found" },
      });
      return;
    }

    // Role check: Authors can only reply to their own tickets
    if (user.role === "AUTHOR" && ticket.authorId !== user.id) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have permission to post to this ticket." },
      });
      return;
    }

    // Authors CANNOT post internal notes under any circumstance
    const actualIsInternalNote = user.role === "ADMIN" ? Boolean(isInternalNote) : false;

    // Create the message
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: user.id,
        senderRole: user.role,
        message,
        isInternalNote: actualIsInternalNote,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
      },
      include: {
        sender: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Edge Case: Auto-reopen status to "In Progress" if author replies to a Resolved or Closed ticket!
    let updatedTicket = ticket;
    if (user.role === "AUTHOR" && (ticket.status === "Resolved" || ticket.status === "Closed")) {
      updatedTicket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: {
          status: "In Progress",
          authorReopenedCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });

      await prisma.ticketAuditLog.create({
        data: {
          ticketId: ticket.id,
          userId: user.id,
          action: "AUTO_REOPENED",
          oldValue: ticket.status,
          newValue: "In Progress",
        },
      });
      socketService.notifyTicketUpdated(updatedTicket);
    } else if (user.role === "ADMIN" && !actualIsInternalNote && ticket.status === "Open") {
      // Auto-advance status to "In Progress" if an admin posts a public reply to an "Open" ticket
      updatedTicket = await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: "In Progress" },
      });
      socketService.notifyTicketUpdated(updatedTicket);
    } else {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { updatedAt: new Date() },
      });
    }

    // Notify via WebSockets
    socketService.notifyNewMessage(ticket.id, ticket.authorId, newMessage);

    res.status(201).json({
      success: true,
      data: {
        message: newMessage,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/tickets/:id/csat:
 *   post:
 *     summary: Submit Author Satisfaction (CSAT) rating and feedback
 */
router.post("/:id/csat", authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { rating, feedback } = req.body;
    const user = req.user!;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    if (ticket.authorId !== user.id) {
      res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Only the ticket author can submit CSAT feedback." } });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        csatRating: Math.min(5, Math.max(1, Number(rating))),
        csatFeedback: feedback ? String(feedback).trim() : null,
      },
    });

    socketService.notifyTicketUpdated(updated);

    res.json({ success: true, data: { ticket: updated } });
  } catch (error) {
    next(error);
  }
});

export default router;
