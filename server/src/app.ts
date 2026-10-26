import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "./docs/swagger";
import authRoutes from "./routes/auth.routes";
import bookRoutes from "./routes/book.routes";
import ticketRoutes from "./routes/ticket.routes";
import adminRoutes from "./routes/admin.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { BOOKLEAF_KNOWLEDGE_BASE } from "./knowledge/bookleaf_kb";

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and standard origins
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Interactive Swagger UI & OpenAPI Specification
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get("/api/docs.json", (req, res) => {
  res.json(openApiSpec);
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "BookLeaf Author Support Portal API",
  });
});

// Knowledge Base Read Endpoint
app.get("/api/knowledge-base", (req, res) => {
  res.json({
    success: true,
    data: {
      content: BOOKLEAF_KNOWLEDGE_BASE,
    },
  });
});

// Mount Routes
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/admin", adminRoutes);

// Serve frontend if client/dist exists
const clientDistPath = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDistPath)) {
  // Static assets with aggressive caching
  app.use(
    express.static(clientDistPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("index.html")) {
          // Never cache index.html so new Vite chunk hashes are picked up immediately
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
        }
      },
    })
  );

  // Missing static asset files must return 404, NOT index.html (which causes MIME type errors)
  app.get("/assets/*", (req, res) => {
    res.status(404).type("text/plain").send("Asset not found");
  });

  // SPA fallback for HTML pages with no-cache headers
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
      return next();
    }
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Global Error Handler
app.use(errorHandler);

