import { Request, Response, NextFunction } from "express";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Internal server error:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected internal server error occurred.";
  const code = err.code || "INTERNAL_SERVER_ERROR";

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    },
  });
};
