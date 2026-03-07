/**
 * Webhook queue worker for Phase 5
 * Background service that polls Redis for failed webhook deliveries and retries them
 * Mirrors the pattern from queue-worker.ts but for webhooks
 */

import type { RedisClientType } from "../config/redis";
import { Pool } from "mysql2/promise";
import { WEBHOOK_CONFIG } from "../utils/constants";
import { logInfo, logError, logWarn } from "../config/logger";
import { WebhookRepository } from "./webhook-repository";
import { WebhookDispatcher } from "./webhook-dispatcher";

export class WebhookQueueWorker {
  private repository: WebhookRepository;
  private dispatcher: WebhookDispatcher;
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(
    pool: Pool,
    private redis: RedisClientType
  ) {
    this.repository = new WebhookRepository(pool);
    this.dispatcher = new WebhookDispatcher(pool, redis);
  }

  /**
   * Start the worker polling loop
   */
  start(): void {
    if (this.isRunning) {
      logWarn("Webhook worker already running");
      return;
    }

    this.isRunning = true;
    logInfo("Starting webhook queue worker");

    // Poll every 5 seconds
    this.pollInterval = setInterval(() => {
      this.pollAndRetry().catch((error) => {
        logError("Error in webhook worker poll cycle", {
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }, 5000);

    // Run first poll immediately
    this.pollAndRetry().catch((error) => {
      logError("Error in initial webhook worker poll", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
  }

  /**
   * Stop the worker
   */
  stop(): void {
    if (!this.isRunning) {
      logWarn("Webhook worker not running");
      return;
    }

    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    logInfo("Webhook queue worker stopped");
  }

  /**
   * Check if worker is running
   */
  running(): boolean {
    return this.isRunning;
  }

  /**
   * Poll Redis for deliveries due for retry
   */
  private async pollAndRetry(): Promise<void> {
    try {
      const now = Date.now();

      // Get one delivery due for retry from sorted set
      // zRangeByScore returns deliveries with score <= now (due)
      const dueDeliveries = await this.redis.zRangeByScore(
        WEBHOOK_CONFIG.QUEUE_KEY,
        "-inf",
        now,
        { LIMIT: { offset: 0, count: 1 } }
      );

      if (dueDeliveries.length === 0) {
        return; // No deliveries due for retry
      }

      const deliveryId = dueDeliveries[0];

      // Move to processing set to prevent concurrent processing
      await this.redis.zAdd(
        WEBHOOK_CONFIG.PROCESSING_SET_KEY,
        { score: now, value: deliveryId }
      );
      await this.redis.zRem(WEBHOOK_CONFIG.QUEUE_KEY, deliveryId);

      try {
        // Get delivery and webhook info
        const delivery = await this.repository.getDeliveryById(deliveryId);
        if (!delivery) {
          logWarn("Delivery not found for retry", { deliveryId });
          await this.redis.zRem(WEBHOOK_CONFIG.PROCESSING_SET_KEY, deliveryId);
          return;
        }

        const webhook = await this.repository.getWebhookById(delivery.webhookId);
        if (!webhook) {
          logWarn("Webhook not found for retry", {
            deliveryId,
            webhookId: delivery.webhookId,
          });
          await this.repository.updateDeliveryStatus(
            deliveryId,
            "failed" as any,
            "Webhook configuration deleted"
          );
          await this.redis.zRem(WEBHOOK_CONFIG.PROCESSING_SET_KEY, deliveryId);
          return;
        }

        // Get cached payload from Redis
        const payloadKey = `${WEBHOOK_CONFIG.PAYLOAD_KEY_PREFIX}${delivery.messageId}`;
        const payloadJson = await this.redis.getEx(payloadKey, { EX: WEBHOOK_CONFIG.PAYLOAD_TTL });

        if (!payloadJson) {
          logWarn("Cached payload not found for retry", {
            deliveryId,
            messageId: delivery.messageId,
          });
          await this.repository.updateDeliveryStatus(
            deliveryId,
            "failed" as any,
            "Message payload not found"
          );
          await this.redis.zRem(WEBHOOK_CONFIG.PROCESSING_SET_KEY, deliveryId);
          return;
        }

        const payload = JSON.parse(payloadJson);
        const nextAttemptNumber = delivery.attemptCount + 1;

        logInfo("Retrying webhook delivery", {
          deliveryId,
          webhookId: webhook.id,
          attempt: nextAttemptNumber,
        });

        // Attempt delivery
        await this.dispatcher.attemptDelivery(
          deliveryId,
          webhook,
          payload,
          nextAttemptNumber
        );
      } finally {
        // Always remove from processing set
        await this.redis.zRem(WEBHOOK_CONFIG.PROCESSING_SET_KEY, deliveryId);
      }
    } catch (error) {
      logError("Error in webhook queue poll cycle", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
