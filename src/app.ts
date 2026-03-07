/**
 * Express application factory
 */

import express, { Express } from "express";
import { Pool } from "mysql2/promise";
import { corsMiddleware } from "./middleware/cors";
import { loggingMiddleware } from "./middleware/logging";
import { authMiddleware } from "./middleware/auth";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { createRouter } from "./routes";
import { logInfo } from "./config/logger";

/**
 * Create and configure Express application
 */
export function createApp(pool: Pool): Express {
  const app = express();

  // Middleware: Body parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Middleware: CORS
  app.use(corsMiddleware);

  // Middleware: Logging
  app.use(loggingMiddleware);

  // Middleware: Authentication (stub)
  app.use(authMiddleware);

  // Routes
  app.use(createRouter(pool));

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  logInfo("Express application configured");

  return app;
}
