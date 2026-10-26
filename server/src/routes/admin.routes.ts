import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { authenticate, requireAdmin } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { aiService, BookContext } from "../services/ai.service";
import { socketService } from "../services/socket.service";
import { VALID_CATEGORIES, VALID_PRIORITIES } from "../knowledge/bookleaf_kb";

const router = Router();

// Protect all admin routes with authentication and requireAdmin middleware
router.use(authenticate, requireAdmin);

const updateStatusSchema = z.object({
  status: z.enum(["Open", "In Progress", "Resolved", "Closed"]),
});

const overrideCategorySchema = z.object({
  category: z.enum(VALID_CATEGORIES as any),
  reason: z.string().optional(),
});

const overridePrioritySchema = z.object({
  priority: z.enum(VALID_PRIORITIES as any),
  reason: z.string().optional(),
});

const assignTicketSchema = z.object({
  adminId: z.string().nullable(),
});

/**
 * @openapi
 * /api/admin/tickets/:id/status:
 *   patch:
 *     summary: Update ticket status
 */
router.patch("/tickets/:id/status", validateBody(updateStatusSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    const admin = req.user!;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    const oldStatus = ticket.status;
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { status },
      include: {
        author: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true } },
        assignedAdmin: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.ticketAuditLog.create({
      data: {
        ticketId: ticket.id,
        userId: admin.id,
        action: "STATUS_CHANGE",
        oldValue: oldStatus,
        newValue: status,
      },
    });

    socketService.notifyTicketUpdated(updated);

    res.json({ success: true, data: { ticket: updated } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/admin/tickets/:id/classification:
 *   patch:
 *     summary: Override AI category classification
 */
router.patch("/tickets/:id/classification", validateBody(overrideCategorySchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { category, reason } = req.body;
    const admin = req.user!;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    const oldCategory = ticket.category;
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        category,
        isCategoryOverridden: true,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true } },
        assignedAdmin: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.ticketAuditLog.create({
      data: {
        ticketId: ticket.id,
        userId: admin.id,
        action: "CATEGORY_OVERRIDE",
        oldValue: oldCategory,
        newValue: `${category}${reason ? ` (Reason: ${reason})` : ""}`,
      },
    });

    socketService.notifyTicketUpdated(updated);

    res.json({ success: true, data: { ticket: updated } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/admin/tickets/:id/priority:
 *   patch:
 *     summary: Override AI priority score
 */
router.patch("/tickets/:id/priority", validateBody(overridePrioritySchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { priority, reason } = req.body;
    const admin = req.user!;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    const oldPriority = ticket.priority;
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        priority,
        isPriorityOverridden: true,
        priorityReasoning: reason || `Manual override by Admin (${admin.name})`,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true } },
        assignedAdmin: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.ticketAuditLog.create({
      data: {
        ticketId: ticket.id,
        userId: admin.id,
        action: "PRIORITY_OVERRIDE",
        oldValue: oldPriority,
        newValue: `${priority}${reason ? ` (Reason: ${reason})` : ""}`,
      },
    });

    socketService.notifyTicketUpdated(updated);

    res.json({ success: true, data: { ticket: updated } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/admin/tickets/:id/assign:
 *   patch:
 *     summary: Assign ticket to an admin
 */
router.patch("/tickets/:id/assign", validateBody(assignTicketSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { adminId } = req.body;
    const currentAdmin = req.user!;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    const oldAssigned = ticket.assignedAdminId;
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedAdminId: adminId || null,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true } },
        assignedAdmin: { select: { id: true, name: true, email: true } },
      },
    });

    await prisma.ticketAuditLog.create({
      data: {
        ticketId: ticket.id,
        userId: currentAdmin.id,
        action: "ASSIGNED",
        oldValue: oldAssigned || "Unassigned",
        newValue: adminId || "Unassigned",
      },
    });

    socketService.notifyTicketUpdated(updated);

    res.json({ success: true, data: { ticket: updated } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/admin/tickets/:id/generate-draft:
 *   post:
 *     summary: Regenerate AI draft response for a ticket with latest thread context
 */
router.post("/tickets/:id/generate-draft", async (req, res, next) => {
  try {
    const id = req.params.id as string;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
      include: {
        author: true,
        book: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: { senderRole: true, message: true, isInternalNote: true },
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    // Only pass non-internal messages to AI draft generator
    const conversation = ticket.messages
      .filter((m) => !m.isInternalNote)
      .map((m) => ({ senderRole: m.senderRole, message: m.message }));

    let bookContext: BookContext | null = null;
    if (ticket.book) {
      bookContext = {
        id: ticket.book.id,
        title: ticket.book.title,
        isbn: ticket.book.isbn,
        status: ticket.book.status,
        mrp: ticket.book.mrp,
        totalCopiesSold: ticket.book.totalCopiesSold,
        totalRoyaltyEarned: ticket.book.totalRoyaltyEarned,
        royaltyPaid: ticket.book.royaltyPaid,
        royaltyPending: ticket.book.royaltyPending,
        lastRoyaltyPayoutDate: ticket.book.lastRoyaltyPayoutDate,
        printPartner: ticket.book.printPartner,
        availableOn: typeof ticket.book.availableOn === "string" ? JSON.parse(ticket.book.availableOn) : ticket.book.availableOn,
      };
    }

    const draft = await aiService.generateDraftResponse(
      ticket.subject,
      ticket.description,
      ticket.category as any,
      { id: ticket.author.id, name: ticket.author.name, email: ticket.author.email, city: ticket.author.city },
      bookContext,
      conversation
    );

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        aiDraftResponse: draft.draftResponse,
        aiDraftConfidence: draft.confidence,
        aiDraftGeneratedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        draftResponse: draft.draftResponse,
        confidence: draft.confidence,
        providerUsed: draft.providerUsed,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/admin/tickets/:id/calibrate-tone:
 *   post:
 *     summary: Calibrate the tone of a draft response (Empathetic, Concise, Formal, De-escalation)
 */
router.post("/tickets/:id/calibrate-tone", async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { draftText, tone } = req.body;

    const ticket = await prisma.ticket.findFirst({
      where: { OR: [{ id }, { ticketNumber: id }] },
      include: { author: true },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Ticket not found" } });
      return;
    }

    const validTones = ["empathetic", "concise", "formal", "de-escalation"] as const;
    const chosenTone = validTones.includes(tone) ? tone : "empathetic";

    const calibratedDraft = await aiService.calibrateDraftTone(
      draftText || ticket.aiDraftResponse || "",
      chosenTone,
      ticket.author.name
    );

    res.json({
      success: true,
      data: {
        calibratedDraft,
        tone: chosenTone,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/admin/analytics:
 *   get:
 *     summary: Get dashboard analytics metrics
 */
router.get("/analytics", async (req, res, next) => {
  try {
    const [total, open, inProgress, resolved, closed, criticalCount, highCount] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: "Open" } }),
      prisma.ticket.count({ where: { status: "In Progress" } }),
      prisma.ticket.count({ where: { status: "Resolved" } }),
      prisma.ticket.count({ where: { status: "Closed" } }),
      prisma.ticket.count({ where: { priority: "Critical", status: { in: ["Open", "In Progress"] } } }),
      prisma.ticket.count({ where: { priority: "High", status: { in: ["Open", "In Progress"] } } }),
    ]);

    const categories = await prisma.ticket.groupBy({
      by: ["category"],
      _count: { category: true },
    });

    res.json({
      success: true,
      data: {
        overview: {
          total,
          open,
          inProgress,
          resolved,
          closed,
          criticalCount,
          highCount,
        },
        categoryBreakdown: categories.map((c) => ({
          category: c.category,
          count: c._count.category,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
