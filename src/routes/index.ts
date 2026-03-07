/**
 * Route aggregation
 */

import { Router } from "express";
import { Pool } from "mysql2/promise";
import healthRoutes from "./health";
import whatsappRoutes from "./whatsapp";
import queueRoutes from "./queue";
import { createWebhookRoutes } from "./webhooks";
import { getPool } from "../config/database";

export function createRouter(pool: Pool): Router {
  const router = Router();

  /**
   * Health check routes
   */
  router.use("/health", healthRoutes);

  /**
   * WhatsApp routes
   */
  router.use("/whatsapp", whatsappRoutes);

  /**
   * Message queue routes
   */
  router.use("/queue", queueRoutes);

  /**
   * Webhook routes
   */
  router.use("/webhooks", createWebhookRoutes(pool));

  return router;
}

// Default export for backward compatibility
const pool = getPool();
export default createRouter(pool);
