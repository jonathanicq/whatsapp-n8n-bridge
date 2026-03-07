/**
 * Webhook routes for Phase 5
 */

import { Router, Request, Response } from "express";
import { Pool } from "mysql2/promise";
import { WebhookController } from "../controllers/webhook-controller";

export function createWebhookRoutes(pool: Pool): Router {
  const router = Router();
  const controller = new WebhookController(pool);

  /**
   * POST /webhooks
   * Create a new webhook
   */
  router.post("/", (req: Request, res: Response) => {
    controller.createWebhook(req, res);
  });

  /**
   * GET /webhooks
   * List all webhooks
   */
  router.get("/", (req: Request, res: Response) => {
    controller.listWebhooks(req, res);
  });

  /**
   * GET /webhooks/:id
   * Get single webhook
   */
  router.get("/:id", (req: Request, res: Response) => {
    controller.getWebhook(req, res);
  });

  /**
   * PATCH /webhooks/:id
   * Update webhook
   */
  router.patch("/:id", (req: Request, res: Response) => {
    controller.updateWebhook(req, res);
  });

  /**
   * DELETE /webhooks/:id
   * Delete webhook
   */
  router.delete("/:id", (req: Request, res: Response) => {
    controller.deleteWebhook(req, res);
  });

  return router;
}
