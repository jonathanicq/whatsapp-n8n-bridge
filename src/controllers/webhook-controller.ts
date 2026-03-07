/**
 * REST controller for webhook endpoints
 */

import { Request, Response } from "express";
import { Pool } from "mysql2/promise";
import { randomBytes } from "crypto";
import {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  WebhookResponse,
  ListWebhooksResponse,
} from "../models/webhook";
import { WebhookRepository } from "../services/webhook-repository";
import { HTTP_CODES, API_ERRORS } from "../utils/constants";
import { ApiResponse } from "../utils/types";
import { logInfo, logError } from "../config/logger";

export class WebhookController {
  private repository: WebhookRepository;

  constructor(pool: Pool) {
    this.repository = new WebhookRepository(pool);
  }

  /**
   * POST /webhooks
   * Create a new webhook
   */
  async createWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { name, url, secret, filters } = req.body as CreateWebhookRequest;

      // Validate required fields
      if (!name || !url) {
        res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            code: API_ERRORS.INVALID_REQUEST,
            message: "name and url are required",
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>);
        return;
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            code: API_ERRORS.INVALID_REQUEST,
            message: "Invalid URL format",
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>);
        return;
      }

      // Validate name length
      if (name.length === 0 || name.length > 100) {
        res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            code: API_ERRORS.INVALID_REQUEST,
            message: "name must be between 1 and 100 characters",
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>);
        return;
      }

      // Check for duplicate URL
      const existing = await this.repository.getWebhookByUrl(url);
      if (existing) {
        res.status(HTTP_CODES.BAD_REQUEST).json({
          success: false,
          error: {
            code: API_ERRORS.INVALID_REQUEST,
            message: "A webhook with this URL already exists",
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>);
        return;
      }

      // Generate secret if not provided
      const webhookSecret = secret || randomBytes(32).toString("hex");

      // Create webhook
      const webhook = await this.repository.createWebhook(
        name,
        url,
        webhookSecret,
        filters
      );

      logInfo("Webhook created", {
        webhookId: webhook.id,
        name,
      });

      const response: WebhookResponse = this.toResponse(webhook);

      res.status(HTTP_CODES.CREATED).json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      } as ApiResponse<WebhookResponse>);
    } catch (error) {
      logError("Failed to create webhook", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: API_ERRORS.INTERNAL_ERROR,
          message: "Failed to create webhook",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }
  }

  /**
   * GET /webhooks
   * List all webhooks
   */
  async listWebhooks(_req: Request, res: Response): Promise<void> {
    try {
      const webhooks = await this.repository.listWebhooks();
      const responses = webhooks.map((wh) => this.toResponse(wh));

      res.json({
        success: true,
        data: {
          webhooks: responses,
          total: responses.length,
        } as ListWebhooksResponse,
        timestamp: new Date().toISOString(),
      } as ApiResponse<ListWebhooksResponse>);
    } catch (error) {
      logError("Failed to list webhooks", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: API_ERRORS.INTERNAL_ERROR,
          message: "Failed to list webhooks",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }
  }

  /**
   * GET /webhooks/:id
   * Get single webhook
   */
  async getWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const webhook = await this.repository.getWebhookById(id);
      if (!webhook) {
        res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          error: {
            code: API_ERRORS.INVALID_REQUEST,
            message: "Webhook not found",
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>);
        return;
      }

      const response: WebhookResponse = this.toResponse(webhook);

      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      } as ApiResponse<WebhookResponse>);
    } catch (error) {
      logError("Failed to get webhook", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: API_ERRORS.INTERNAL_ERROR,
          message: "Failed to get webhook",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }
  }

  /**
   * PATCH /webhooks/:id
   * Update webhook
   */
  async updateWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body as UpdateWebhookRequest;

      // Validate URL if provided
      if (updates.url) {
        try {
          new URL(updates.url);
        } catch {
          res.status(HTTP_CODES.BAD_REQUEST).json({
            success: false,
            error: {
              code: API_ERRORS.INVALID_REQUEST,
              message: "Invalid URL format",
            },
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>);
          return;
        }

        // Check for duplicate URL (excluding current webhook)
        const existing = await this.repository.getWebhookByUrl(updates.url);
        if (existing && existing.id !== id) {
          res.status(HTTP_CODES.BAD_REQUEST).json({
            success: false,
            error: {
              code: API_ERRORS.INVALID_REQUEST,
              message: "A webhook with this URL already exists",
            },
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>);
          return;
        }
      }

      // Validate name if provided
      if (updates.name !== undefined) {
        if (updates.name.length === 0 || updates.name.length > 100) {
          res.status(HTTP_CODES.BAD_REQUEST).json({
            success: false,
            error: {
              code: API_ERRORS.INVALID_REQUEST,
              message: "name must be between 1 and 100 characters",
            },
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>);
          return;
        }
      }

      // Update webhook
      const updated = await this.repository.updateWebhook(id, updates);
      if (!updated) {
        res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          error: {
            code: API_ERRORS.INVALID_REQUEST,
            message: "Webhook not found",
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>);
        return;
      }

      logInfo("Webhook updated", {
        webhookId: id,
      });

      const response: WebhookResponse = this.toResponse(updated);

      res.json({
        success: true,
        data: response,
        timestamp: new Date().toISOString(),
      } as ApiResponse<WebhookResponse>);
    } catch (error) {
      logError("Failed to update webhook", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: API_ERRORS.INTERNAL_ERROR,
          message: "Failed to update webhook",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }
  }

  /**
   * DELETE /webhooks/:id
   * Delete webhook
   */
  async deleteWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.repository.deleteWebhook(id);
      if (!deleted) {
        res.status(HTTP_CODES.NOT_FOUND).json({
          success: false,
          error: {
            code: API_ERRORS.INVALID_REQUEST,
            message: "Webhook not found",
          },
          timestamp: new Date().toISOString(),
        } as ApiResponse<null>);
        return;
      }

      logInfo("Webhook deleted", { webhookId: id });

      res.status(204).send();
    } catch (error) {
      logError("Failed to delete webhook", {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: {
          code: API_ERRORS.INTERNAL_ERROR,
          message: "Failed to delete webhook",
        },
        timestamp: new Date().toISOString(),
      } as ApiResponse<null>);
    }
  }

  /**
   * Helper: Convert WebhookConfig to WebhookResponse (redact secret)
   */
  private toResponse(webhook: any): WebhookResponse {
    return {
      id: webhook.id,
      name: webhook.name,
      url: webhook.url,
      active: webhook.active,
      filters: webhook.filters,
      createdAt: webhook.createdAt.toISOString(),
      updatedAt: webhook.updatedAt.toISOString(),
    };
  }
}
