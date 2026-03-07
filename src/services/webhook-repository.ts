/**
 * Database abstraction layer for webhook operations
 */

import { Pool } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import {
  WebhookConfig,
  WebhookDelivery,
  WebhookDeliveryAttempt,
  DeliveryStatus,
  AttemptStatus,
  WebhookFilters,
} from "../models/webhook";
import { logInfo } from "../config/logger";

export class WebhookRepository {
  constructor(private pool: Pool) {}

  /**
   * Create a new webhook configuration
   */
  async createWebhook(
    name: string,
    url: string,
    secret: string,
    filters?: WebhookFilters
  ): Promise<WebhookConfig> {
    const conn = await this.pool.getConnection();
    try {
      const webhookId = uuidv4();
      const now = new Date();

      const query =
        "INSERT INTO webhook_configs (id, name, url, secret, active, filters, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
      await conn.execute(query, [
        webhookId,
        name,
        url,
        secret,
        true, // active by default
        filters ? JSON.stringify(filters) : null,
        now,
        now,
      ]);

      logInfo(`Webhook created: ${webhookId}`, {
        name,
        url,
      });

      return {
        id: webhookId,
        name,
        url,
        secret,
        active: true,
        filters,
        createdAt: now,
        updatedAt: now,
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Get webhook by ID
   */
  async getWebhookById(webhookId: string): Promise<WebhookConfig | null> {
    const conn = await this.pool.getConnection();
    try {
      const query = "SELECT * FROM webhook_configs WHERE id = ?";
      const [rows] = await conn.execute(query, [webhookId]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapRowToWebhook(rows[0] as Record<string, unknown>);
    } finally {
      conn.release();
    }
  }

  /**
   * Get webhook by URL
   */
  async getWebhookByUrl(url: string): Promise<WebhookConfig | null> {
    const conn = await this.pool.getConnection();
    try {
      const query = "SELECT * FROM webhook_configs WHERE url = ?";
      const [rows] = await conn.execute(query, [url]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapRowToWebhook(rows[0] as Record<string, unknown>);
    } finally {
      conn.release();
    }
  }

  /**
   * List all webhooks
   */
  async listWebhooks(): Promise<WebhookConfig[]> {
    const conn = await this.pool.getConnection();
    try {
      const query = "SELECT * FROM webhook_configs ORDER BY created_at DESC";
      const [rows] = await conn.execute(query);

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map((row) =>
        this.mapRowToWebhook(row as Record<string, unknown>)
      );
    } finally {
      conn.release();
    }
  }

  /**
   * List only active webhooks
   */
  async listActiveWebhooks(): Promise<WebhookConfig[]> {
    const conn = await this.pool.getConnection();
    try {
      const query = "SELECT * FROM webhook_configs WHERE active = 1 ORDER BY created_at DESC";
      const [rows] = await conn.execute(query);

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map((row) =>
        this.mapRowToWebhook(row as Record<string, unknown>)
      );
    } finally {
      conn.release();
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<{
      name: string;
      url: string;
      active: boolean;
      filters: WebhookFilters;
    }>
  ): Promise<WebhookConfig | null> {
    const conn = await this.pool.getConnection();
    try {
      // Build dynamic update query
      const fields: string[] = [];
      const values: unknown[] = [];

      if (updates.name !== undefined) {
        fields.push("name = ?");
        values.push(updates.name);
      }
      if (updates.url !== undefined) {
        fields.push("url = ?");
        values.push(updates.url);
      }
      if (updates.active !== undefined) {
        fields.push("active = ?");
        values.push(updates.active ? 1 : 0);
      }
      if (updates.filters !== undefined) {
        fields.push("filters = ?");
        values.push(JSON.stringify(updates.filters));
      }

      if (fields.length === 0) {
        return this.getWebhookById(webhookId);
      }

      fields.push("updated_at = ?");
      values.push(new Date());
      values.push(webhookId);

      const query = `UPDATE webhook_configs SET ${fields.join(", ")} WHERE id = ?`;
      await conn.execute(query, values as any);

      logInfo(`Webhook updated: ${webhookId}`, { updates });

      return this.getWebhookById(webhookId);
    } finally {
      conn.release();
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    const conn = await this.pool.getConnection();
    try {
      const query = "DELETE FROM webhook_configs WHERE id = ?";
      const [result] = await conn.execute(query, [webhookId]);

      const deleteResult = result as { affectedRows: number };
      const deleted = deleteResult.affectedRows > 0;

      if (deleted) {
        logInfo(`Webhook deleted: ${webhookId}`);
      }

      return deleted;
    } finally {
      conn.release();
    }
  }

  /**
   * Create a delivery record for a webhook × message pair
   */
  async createDelivery(
    webhookId: string,
    messageId: string
  ): Promise<WebhookDelivery> {
    const conn = await this.pool.getConnection();
    try {
      const deliveryId = uuidv4();
      const now = new Date();

      const query =
        "INSERT INTO webhook_deliveries (id, webhook_id, message_id, status, attempt_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
      await conn.execute(query, [
        deliveryId,
        webhookId,
        messageId,
        DeliveryStatus.PENDING,
        0,
        now,
        now,
      ]);

      return {
        id: deliveryId,
        webhookId,
        messageId,
        status: DeliveryStatus.PENDING,
        attemptCount: 0,
        createdAt: now,
        updatedAt: now,
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Get delivery by ID
   */
  async getDeliveryById(deliveryId: string): Promise<WebhookDelivery | null> {
    const conn = await this.pool.getConnection();
    try {
      const query = "SELECT * FROM webhook_deliveries WHERE id = ?";
      const [rows] = await conn.execute(query, [deliveryId]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      return this.mapRowToDelivery(rows[0] as Record<string, unknown>);
    } finally {
      conn.release();
    }
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    deliveryId: string,
    status: DeliveryStatus,
    error?: string
  ): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      const now = new Date();
      const completedAt = status === DeliveryStatus.SUCCESS || status === DeliveryStatus.FAILED ? now : null;

      const query =
        "UPDATE webhook_deliveries SET status = ?, last_error = ?, completed_at = ?, updated_at = ? WHERE id = ?";
      await conn.execute(query, [status, error || null, completedAt, now, deliveryId]);
    } finally {
      conn.release();
    }
  }

  /**
   * Increment delivery attempt count
   */
  async incrementAttemptCount(deliveryId: string): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      const query =
        "UPDATE webhook_deliveries SET attempt_count = attempt_count + 1, updated_at = ? WHERE id = ?";
      await conn.execute(query, [new Date(), deliveryId]);
    } finally {
      conn.release();
    }
  }

  /**
   * Record a delivery attempt
   */
  async recordDeliveryAttempt(
    deliveryId: string,
    attemptNumber: number,
    status: AttemptStatus,
    httpStatusCode?: number,
    errorCode?: string,
    errorMessage?: string,
    backoffDelayMs?: number
  ): Promise<WebhookDeliveryAttempt> {
    const conn = await this.pool.getConnection();
    try {
      const query =
        "INSERT INTO webhook_delivery_attempts (delivery_id, attempt_number, status, http_status_code, error_code, error_message, backoff_delay_ms, attempted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

      await conn.execute(query, [
        deliveryId,
        attemptNumber,
        status,
        httpStatusCode || null,
        errorCode || null,
        errorMessage || null,
        backoffDelayMs || null,
        new Date(),
      ]);

      return {
        id: 0, // Will be auto-generated
        deliveryId,
        attemptNumber,
        status,
        httpStatusCode,
        errorCode,
        errorMessage,
        backoffDelayMs,
        attemptedAt: new Date(),
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Get all attempts for a delivery
   */
  async getDeliveryAttempts(deliveryId: string): Promise<WebhookDeliveryAttempt[]> {
    const conn = await this.pool.getConnection();
    try {
      const query = "SELECT * FROM webhook_delivery_attempts WHERE delivery_id = ? ORDER BY attempt_number ASC";
      const [rows] = await conn.execute(query, [deliveryId]);

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map((row) =>
        this.mapRowToAttempt(row as Record<string, unknown>)
      );
    } finally {
      conn.release();
    }
  }

  /**
   * Helper: Map database row to WebhookConfig
   */
  private mapRowToWebhook(row: Record<string, unknown>): WebhookConfig {
    const filters = row.filters ? JSON.parse(row.filters as string) : undefined;

    return {
      id: row.id as string,
      name: row.name as string,
      url: row.url as string,
      secret: row.secret as string,
      active: (row.active as number) === 1,
      filters,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  /**
   * Helper: Map database row to WebhookDelivery
   */
  private mapRowToDelivery(row: Record<string, unknown>): WebhookDelivery {
    return {
      id: row.id as string,
      webhookId: row.webhook_id as string,
      messageId: row.message_id as string,
      status: row.status as DeliveryStatus,
      attemptCount: row.attempt_count as number,
      lastError: row.last_error as string | undefined,
      createdAt: new Date(row.created_at as string),
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
      updatedAt: new Date(row.updated_at as string),
    };
  }

  /**
   * Helper: Map database row to WebhookDeliveryAttempt
   */
  private mapRowToAttempt(row: Record<string, unknown>): WebhookDeliveryAttempt {
    return {
      id: row.id as number,
      deliveryId: row.delivery_id as string,
      attemptNumber: row.attempt_number as number,
      status: row.status as AttemptStatus,
      httpStatusCode: row.http_status_code as number | undefined,
      errorCode: row.error_code as string | undefined,
      errorMessage: row.error_message as string | undefined,
      backoffDelayMs: row.backoff_delay_ms as number | undefined,
      attemptedAt: new Date(row.attempted_at as string),
    };
  }
}
