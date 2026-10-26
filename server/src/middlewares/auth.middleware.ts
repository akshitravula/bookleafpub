import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "AUTHOR" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication token missing or invalid",
        },
      });
      return;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "bookleaf_super_secret_jwt_key_2026_secure";
    const decoded = jwt.verify(token, secret) as { id: string; role: "AUTHOR" | "ADMIN" };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User session expired or invalid",
        },
      });
      return;
    }

    req.user = user as AuthenticatedUser;
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Token has expired or is invalid",
        details: error?.message,
      },
    });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Access denied. Admin privileges required.",
      },
    });
    return;
  }
  next();
};

export const requireAuthor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "AUTHOR") {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Access denied. Author privileges required.",
      },
    });
    return;
  }
  next();
};
