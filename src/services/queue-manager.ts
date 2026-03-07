/**
 * Redis-backed queue manager for atomic message queue operations
 */

import type { RedisClientType } from "../config/redis";
import { logInfo, logError, logDebug } from "../config/logger";

interface QueueEntry {
  messageId: string;
  attemptNumber: number;
  nextRetryAt: number; // timestamp in ms
}

/**
 * Exponential backoff delays in milliseconds
 * Attempt 1: wait 1s, Attempt 2: wait 2s, Attempt 3: wait 5s, etc.
 */
const BACKOFF_DELAYS = [1000, 2000, 5000, 10000, 30000];

export class RedisQueueManager {
  private readonly queueKey = "whatsapp:queue:messages";
  private readonly processingKey = "whatsapp:queue:processing";
  private readonly lockKey = "whatsapp:queue:lock";

  constructor(private redis: RedisClientType) {}

  /**
   * Enqueue a message for sending
   */
  async enqueueMessage(
    messageId: string,
    delayMs: number = 0
  ): Promise<void> {
    try {
      const nextRetryAt = Date.now() + delayMs;
      const entry: QueueEntry = {
        messageId,
        attemptNumber: 1,
        nextRetryAt,
      };

      // Add to sorted set for ordered retrieval
      await this.redis.zAdd(
        this.queueKey,
        { score: nextRetryAt, value: JSON.stringify(entry) }
      );

      logDebug("Message enqueued", { messageId, nextRetryAt, delayMs });
    } catch (error) {
      logError("Failed to enqueue message", error);
      throw error;
    }
  }

  /**
   * Get the next message to process
   * Returns null if no messages are ready
   */
  async getNextMessage(): Promise<QueueEntry | null> {
    try {
      const now = Date.now();

      // Get messages ready for processing (score <= now)
      const messages = await this.redis.zRangeByScore(
        this.queueKey,
        "-inf",
        now,
        { LIMIT: { offset: 0, count: 1 } }
      );

      if (messages.length === 0) {
        return null;
      }

      const entry = JSON.parse(messages[0]) as QueueEntry;

      // Move to processing set to prevent duplicate processing
      await this.redis.zAdd(
        this.processingKey,
        { score: Date.now(), value: JSON.stringify(entry) }
      );

      // Remove from queue
      await this.redis.zRem(this.queueKey, messages[0]);

      logDebug("Message retrieved for processing", {
        messageId: entry.messageId,
        attempt: entry.attemptNumber,
      });
      return entry;
    } catch (error) {
      logError("Failed to get next message", error);
      throw error;
    }
  }

  /**
   * Mark message as successfully sent and remove from queue
   */
  async markProcessed(messageId: string): Promise<void> {
    try {
      // Remove from processing
      const processingEntries = await this.redis.zRange(
        this.processingKey,
        0,
        -1
      );

      for (const entry of processingEntries) {
        const parsed = JSON.parse(entry) as QueueEntry;
        if (parsed.messageId === messageId) {
          await this.redis.zRem(this.processingKey, entry);
          logDebug("Message marked as processed", { messageId });
          return;
        }
      }
    } catch (error) {
      logError("Failed to mark message as processed", error);
      throw error;
    }
  }

  /**
   * Schedule a message for retry
   */
  async scheduleRetry(messageId: string, attemptNumber: number): Promise<number> {
    try {
      // Remove from processing
      const processingEntries = await this.redis.zRange(
        this.processingKey,
        0,
        -1
      );

      for (const entry of processingEntries) {
        const parsed = JSON.parse(entry) as QueueEntry;
        if (parsed.messageId === messageId) {
          await this.redis.zRem(this.processingKey, entry);
          break;
        }
      }

      // Calculate backoff delay
      const delayIndex = Math.min(
        attemptNumber - 1,
        BACKOFF_DELAYS.length - 1
      );
      const delayMs = BACKOFF_DELAYS[delayIndex];
      const nextRetryAt = Date.now() + delayMs;

      // Create new queue entry with incremented attempt number
      const entry: QueueEntry = {
        messageId,
        attemptNumber: attemptNumber + 1,
        nextRetryAt,
      };

      // Re-enqueue
      await this.redis.zAdd(
        this.queueKey,
        { score: nextRetryAt, value: JSON.stringify(entry) }
      );

      logInfo("Message scheduled for retry", {
        messageId,
        nextAttempt: attemptNumber + 1,
        delayMs,
        nextRetryAt,
      });

      return delayMs;
    } catch (error) {
      logError("Failed to schedule retry", error);
      throw error;
    }
  }

  /**
   * Get all pending messages (for /queue/pending endpoint)
   */
  async getPendingMessages(): Promise<QueueEntry[]> {
    try {
      const messages = await this.redis.zRange(this.queueKey, 0, -1);
      return messages.map((msg: string) => JSON.parse(msg) as QueueEntry);
    } catch (error) {
      logError("Failed to get pending messages", error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    pendingCount: number;
    processingCount: number;
    oldestMessageAge?: number;
  }> {
    try {
      const [pendingCount, processingCount, oldestEntries] = await Promise.all([
        this.redis.zCard(this.queueKey),
        this.redis.zCard(this.processingKey),
        this.redis.zRange(this.queueKey, 0, 0),
      ]);

      let oldestMessageAge: number | undefined;
      if (oldestEntries.length > 0) {
        const oldest = JSON.parse(oldestEntries[0]) as QueueEntry;
        oldestMessageAge = Date.now() - oldest.nextRetryAt;
      }

      return {
        pendingCount,
        processingCount,
        oldestMessageAge,
      };
    } catch (error) {
      logError("Failed to get queue stats", error);
      throw error;
    }
  }

  /**
   * Remove a message from queue (for DELETE endpoint)
   */
  async removeMessage(messageId: string): Promise<boolean> {
    try {
      let removed = false;

      // Remove from pending queue
      const queueEntries = await this.redis.zRange(this.queueKey, 0, -1);
      for (const entry of queueEntries) {
        const parsed = JSON.parse(entry) as QueueEntry;
        if (parsed.messageId === messageId) {
          await this.redis.zRem(this.queueKey, entry);
          removed = true;
          break;
        }
      }

      // Remove from processing
      const processingEntries = await this.redis.zRange(
        this.processingKey,
        0,
        -1
      );
      for (const entry of processingEntries) {
        const parsed = JSON.parse(entry) as QueueEntry;
        if (parsed.messageId === messageId) {
          await this.redis.zRem(this.processingKey, entry);
          removed = true;
          break;
        }
      }

      if (removed) {
        logInfo("Message removed from queue", { messageId });
      }

      return removed;
    } catch (error) {
      logError("Failed to remove message from queue", error);
      throw error;
    }
  }

  /**
   * Clear all queues (use with caution - for testing/maintenance)
   */
  async clearAllQueues(): Promise<void> {
    try {
      await Promise.all([
        this.redis.del(this.queueKey),
        this.redis.del(this.processingKey),
        this.redis.del(this.lockKey),
      ]);
      logInfo("All queues cleared");
    } catch (error) {
      logError("Failed to clear queues", error);
      throw error;
    }
  }
}
