/**
 * Database abstraction layer for message queue operations
 */

import { Pool } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import {
  QueueMessage,
  MessageAttempt,
  MessageStatus,
  AttemptStatus,
} from "../models/queue-message";
import { logInfo } from "../config/logger";

export class MessageRepository {
  constructor(private pool: Pool) {}

  /**
   * Create a new queued message
   */
  async createMessage(
    toPhoneNumber: string,
    text: string
  ): Promise<QueueMessage> {
    const conn = await this.pool.getConnection();
    try {
      const messageId = uuidv4();
      const now = new Date();

      const query =
        "INSERT INTO whatsapp_messages (id, to_phone_number, text, status, created_at) VALUES (?, ?, ?, ?, ?)";
      await conn.execute(query, [
        messageId,
        toPhoneNumber,
        text,
        MessageStatus.PENDING,
        now,
      ]);

      return {
        id: messageId,
        toPhoneNumber,
        text,
        status: MessageStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };
    } finally {
      conn.release();
    }
  }

  /**
   * Get message by ID
   */
  async getMessageById(messageId: string): Promise<QueueMessage | null> {
    const conn = await this.pool.getConnection();
    try {
      const query = "SELECT * FROM whatsapp_messages WHERE id = ?";
      const [rows] = await conn.execute(query, [messageId]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }

      const row = rows[0] as Record<string, unknown>;
      return this.mapRowToMessage(row);
    } finally {
      conn.release();
    }
  }

  /**
   * Get all pending messages
   */
  async getPendingMessages(
    limit: number = 100
  ): Promise<QueueMessage[]> {
    const conn = await this.pool.getConnection();
    try {
      const query =
        "SELECT * FROM whatsapp_messages WHERE status = ? ORDER BY created_at ASC LIMIT ?";
      const [rows] = await conn.execute(query, [MessageStatus.PENDING, limit]);

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map((row) => this.mapRowToMessage(row as Record<string, unknown>));
    } finally {
      conn.release();
    }
  }

  /**
   * Update message status
   */
  async updateMessageStatus(
    messageId: string,
    status: MessageStatus,
    providerId?: string,
    error?: string
  ): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      const now = new Date();
      const completedAt = [MessageStatus.SENT, MessageStatus.FAILED, MessageStatus.CANCELLED].includes(status) ? now : null;

      const query =
        "UPDATE whatsapp_messages SET status = ?, message_id = COALESCE(?, message_id), provider_error = COALESCE(?, provider_error), completed_at = COALESCE(?, completed_at), updated_at = ? WHERE id = ?";
      await conn.execute(query, [
        status,
        providerId || null,
        error || null,
        completedAt,
        now,
        messageId,
      ]);

      logInfo("Message status updated", { messageId, status });
    } finally {
      conn.release();
    }
  }

  /**
   * Record a send attempt
   */
  async recordAttempt(
    messageId: string,
    attemptNumber: number,
    status: AttemptStatus,
    errorCode?: string,
    errorMessage?: string,
    backoffDelayMs?: number
  ): Promise<MessageAttempt> {
    const conn = await this.pool.getConnection();
    try {
      const query =
        "INSERT INTO whatsapp_message_attempts (message_id, attempt_number, status, error_code, error_message, backoff_delay_ms) VALUES (?, ?, ?, ?, ?, ?)";
      const result = await conn.execute(query, [
        messageId,
        attemptNumber,
        status,
        errorCode || null,
        errorMessage || null,
        backoffDelayMs || null,
      ]);

      const insertId = (result[0] as { insertId: number }).insertId;

      return {
        id: insertId,
        messageId,
        attemptNumber,
        status,
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
   * Get attempts for a message
   */
  async getMessageAttempts(messageId: string): Promise<MessageAttempt[]> {
    const conn = await this.pool.getConnection();
    try {
      const query =
        "SELECT * FROM whatsapp_message_attempts WHERE message_id = ? ORDER BY attempt_number ASC";
      const [rows] = await conn.execute(query, [messageId]);

      if (!Array.isArray(rows)) {
        return [];
      }

      return rows.map((row) => this.mapRowToAttempt(row as Record<string, unknown>));
    } finally {
      conn.release();
    }
  }

  /**
   * Get count of pending messages
   */
  async getPendingMessageCount(): Promise<number> {
    const conn = await this.pool.getConnection();
    try {
      const query =
        "SELECT COUNT(*) as count FROM whatsapp_messages WHERE status = ?";
      const [rows] = await conn.execute(query, [MessageStatus.PENDING]);

      if (!Array.isArray(rows) || rows.length === 0) {
        return 0;
      }

      return (rows[0] as Record<string, unknown>).count as number;
    } finally {
      conn.release();
    }
  }

  /**
   * Cancel a message (for DELETE endpoint)
   */
  async cancelMessage(messageId: string): Promise<boolean> {
    const conn = await this.pool.getConnection();
    try {
      const now = new Date();
      const query =
        "UPDATE whatsapp_messages SET status = ?, completed_at = ?, updated_at = ? WHERE id = ? AND status = ?";
      const result = await conn.execute(query, [
        MessageStatus.CANCELLED,
        now,
        now,
        messageId,
        MessageStatus.PENDING,
      ]);

      const affectedRows = (result[0] as { affectedRows: number }).affectedRows;
      return affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * Map database row to QueueMessage
   */
  private mapRowToMessage(row: Record<string, unknown>): QueueMessage {
    return {
      id: row.id as string,
      toPhoneNumber: row.to_phone_number as string,
      text: row.text as string,
      status: row.status as MessageStatus,
      messageId: (row.message_id as string) || undefined,
      providerError: (row.provider_error as string) || undefined,
      createdAt: row.created_at as Date,
      sentAt: row.sent_at ? (row.sent_at as Date) : undefined,
      completedAt: row.completed_at ? (row.completed_at as Date) : undefined,
      updatedAt: row.updated_at as Date,
    };
  }

  /**
   * Map database row to MessageAttempt
   */
  private mapRowToAttempt(row: Record<string, unknown>): MessageAttempt {
    return {
      id: row.id as number,
      messageId: row.message_id as string,
      attemptNumber: row.attempt_number as number,
      status: row.status as AttemptStatus,
      errorCode: (row.error_code as string) || undefined,
      errorMessage: (row.error_message as string) || undefined,
      backoffDelayMs: row.backoff_delay_ms ? (row.backoff_delay_ms as number) : undefined,
      attemptedAt: row.attempted_at as Date,
    };
  }
}
