import { Router } from "express";
import { prisma } from "../prisma";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @openapi
 * /api/books:
 *   get:
 *     summary: Get books for the logged-in author or all books for admin
 */
router.get("/", authenticate, async (req, res, next) => {
  try {
    const user = req.user!;

    let books;
    if (user.role === "ADMIN") {
      const authorId = req.query.authorId as string | undefined;
      books = await prisma.book.findMany({
        where: authorId ? { authorId } : undefined,
        include: {
          author: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { title: "asc" },
      });
    } else {
      // Authors can only see their own books
      books = await prisma.book.findMany({
        where: { authorId: user.id },
        orderBy: { createdAt: "desc" },
      });
    }

    const formattedBooks = books.map((b) => ({
      ...b,
      availableOn: typeof b.availableOn === "string" ? JSON.parse(b.availableOn) : b.availableOn,
    }));

    res.json({
      success: true,
      data: {
        books: formattedBooks,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/books/:id:
 *   get:
 *     summary: Get single book details
 */
router.get("/:id", authenticate, async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const user = req.user!;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, phone: true, city: true },
        },
      },
    });

    if (!book) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Book not found" },
      });
      return;
    }

    // Role-based access: authors can only view their own book
    if (user.role === "AUTHOR" && book.authorId !== user.id) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "You do not have access to this book record." },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        book: {
          ...book,
          availableOn: typeof book.availableOn === "string" ? JSON.parse(book.availableOn) : book.availableOn,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
