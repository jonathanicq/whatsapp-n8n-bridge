/**
 * Webhook dispatcher service for Phase 5
 * Handles fan-out delivery of incoming messages to registered webhooks
 */

import { createHmac } from "crypto";
import type { RedisClientType } from "../config/redis";
import { Pool } from "mysql2/promise";
import {
  IncomingMessage,
  WebhookPayload,
  WebhookConfig,
  WebhookFilters,
  DeliveryStatus,
  AttemptStatus,
} from "../models/webhook";
import { WEBHOOK_CONFIG } from "../utils/constants";
import { logInfo, logError, logWarn } from "../config/logger";
import { WebhookRepository } from "./webhook-repository";

export class WebhookDispatcher {
  private repository: WebhookRepository;

  constructor(
    pool: Pool,
    private redis: RedisClientType
  ) {
    this.repository = new WebhookRepository(pool);
  }

  /**
   * Main entry point: Dispatch incoming message to all active webhooks
   * Non-blocking: Returns immediately, retries happen in background
   */
  async dispatch(message: IncomingMessage): Promise<void> {
    try {
      // Get all active webhooks
      const webhooks = await this.repository.listActiveWebhooks();

      if (webhooks.length === 0) {
        logInfo("No active webhooks for message dispatch", {
          messageId: message.messageId,
        });
        return;
      }

      // Build webhook payload once (reused for all webhooks)
      const payload = this.buildPayload(message);
      const payloadJson = JSON.stringify(payload);

      // Cache payload in Redis for retry attempts
      const payloadKey = `${WEBHOOK_CONFIG.PAYLOAD_KEY_PREFIX}${message.messageId}`;
      await this.redis.setEx(
        payloadKey,
        WEBHOOK_CONFIG.PAYLOAD_TTL,
        payloadJson
      );

      // Filter webhooks based on message criteria
      const filteredWebhooks = webhooks.filter((wh) =>
        this.matchesFilters(message, wh.filters)
      );

      logInfo(`Dispatching message to ${filteredWebhooks.length} webhooks`, {
        messageId: message.messageId,
        totalWebhooks: webhooks.length,
      });

      // Fan-out: dispatch to all webhooks in parallel, don't wait for completion
      // Use Promise.allSettled to prevent one failure from affecting others
      Promise.allSettled(
        filteredWebhooks.map((webhook) =>
          this.dispatchToOne(webhook, payload, message.messageId)
        )
      ).catch((error) => {
        logError("Error in webhook dispatch batch", {
          messageId: message.messageId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    } catch (error) {
      logError("Failed to dispatch webhooks", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Dispatch to a single webhook
   * Handles HMAC signing, HTTP request, and retry enqueueing
   */
  private async dispatchToOne(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    messageId: string
  ): Promise<void> {
    try {
      // Create delivery record
      const delivery = await this.repository.createDelivery(webhook.id, messageId);

      // Attempt delivery
      await this.attemptDelivery(delivery.id, webhook, payload, 1);
    } catch (error) {
      logError("Failed to dispatch to webhook", {
        webhookId: webhook.id,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Attempt to deliver a webhook
   * Called initially and on retries
   */
  async attemptDelivery(
    deliveryId: string,
    webhook: WebhookConfig,
    payload: WebhookPayload,
    attemptNumber: number
  ): Promise<void> {
    try {
      const payloadJson = JSON.stringify(payload);
      const signature = this.signPayload(payloadJson, webhook.secret);

      // Make HTTP request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), WEBHOOK_CONFIG.REQUEST_TIMEOUT);

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
          },
          body: payloadJson,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Success: 2xx response
        if (response.ok) {
          await this.repository.recordDeliveryAttempt(
            deliveryId,
            attemptNumber,
            AttemptStatus.SUCCESS,
            response.status
          );
          await this.repository.updateDeliveryStatus(deliveryId, DeliveryStatus.SUCCESS);

          logInfo("Webhook delivered successfully", {
            deliveryId,
            webhookUrl: webhook.url,
            attemptNumber,
            statusCode: response.status,
          });

          return;
        }

        // 4xx: likely a configuration error, fail permanently
        if (response.status >= 400 && response.status < 500) {
          const errorText = await response.text();
          await this.repository.recordDeliveryAttempt(
            deliveryId,
            attemptNumber,
            AttemptStatus.FAILED,
            response.status,
            "HTTP_CLIENT_ERROR",
            `HTTP ${response.status}: ${errorText.substring(0, 200)}`
          );
          await this.repository.updateDeliveryStatus(
            deliveryId,
            DeliveryStatus.FAILED,
            `HTTP ${response.status}`
          );

          logWarn("Webhook failed with client error", {
            deliveryId,
            webhookUrl: webhook.url,
            statusCode: response.status,
          });

          return;
        }

        // 5xx: server error, retry
        await response.text(); // consume response
        await this.enqueueRetry(deliveryId, webhook, attemptNumber, {
          httpStatusCode: response.status,
          errorCode: "HTTP_SERVER_ERROR",
          errorMessage: `HTTP ${response.status}`,
        });

        logWarn("Webhook failed with server error, queued for retry", {
          deliveryId,
          webhookUrl: webhook.url,
          attemptNumber,
          statusCode: response.status,
        });
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Connection error, timeout, or abort
        const errorCode = fetchError instanceof Error && fetchError.name === "AbortError"
          ? "WEBHOOK_TIMEOUT"
          : "WEBHOOK_CONNECTION_ERROR";

        const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);

        await this.enqueueRetry(deliveryId, webhook, attemptNumber, {
          errorCode,
          errorMessage: errorMsg.substring(0, 255),
        });

        logWarn("Webhook connection failed, queued for retry", {
          deliveryId,
          webhookUrl: webhook.url,
          attemptNumber,
          error: errorMsg,
        });
      }
    } catch (error) {
      logError("Unexpected error in webhook attempt", {
        deliveryId,
        attemptNumber,
        error: error instanceof Error ? error.message : String(error),
      });

      // Still try to enqueue retry on unexpected errors
      if (attemptNumber < WEBHOOK_CONFIG.MAX_RETRIES) {
        await this.enqueueRetry(deliveryId, webhook, attemptNumber, {
          errorCode: "INTERNAL_ERROR",
          errorMessage: error instanceof Error ? error.message : String(error),
        });
      } else {
        await this.repository.updateDeliveryStatus(
          deliveryId,
          DeliveryStatus.FAILED,
          "Max retries exceeded"
        );
      }
    }
  }

  /**
   * Enqueue a failed delivery for retry
   * Uses exponential backoff: [1s, 2s, 5s, 10s, 30s]
   */
  private async enqueueRetry(
    deliveryId: string,
    webhook: WebhookConfig,
    attemptNumber: number,
    attemptDetails: {
      httpStatusCode?: number;
      errorCode?: string;
      errorMessage?: string;
    }
  ): Promise<void> {
    try {
      const nextAttemptNumber = attemptNumber + 1;

      // Check if max retries exceeded
      if (nextAttemptNumber > WEBHOOK_CONFIG.MAX_RETRIES) {
        const errorMsg = `Max retries exceeded (${WEBHOOK_CONFIG.MAX_RETRIES})`;

        await this.repository.recordDeliveryAttempt(
          deliveryId,
          attemptNumber,
          AttemptStatus.FAILED,
          attemptDetails.httpStatusCode,
          attemptDetails.errorCode,
          attemptDetails.errorMessage || errorMsg
        );

        await this.repository.updateDeliveryStatus(deliveryId, DeliveryStatus.FAILED, errorMsg);

        logInfo("Webhook exhausted retries", { deliveryId, webhookUrl: webhook.url });
        return;
      }

      // Calculate next retry delay
      const delayMs = WEBHOOK_CONFIG.RETRY_DELAYS[attemptNumber - 1] || WEBHOOK_CONFIG.RETRY_DELAYS[WEBHOOK_CONFIG.RETRY_DELAYS.length - 1];
      const nextRetryTime = Date.now() + delayMs;

      // Record attempt with RETRYING status and backoff delay
      await this.repository.recordDeliveryAttempt(
        deliveryId,
        attemptNumber,
        AttemptStatus.RETRYING,
        attemptDetails.httpStatusCode,
        attemptDetails.errorCode,
        attemptDetails.errorMessage,
        delayMs
      );

      // Update delivery to PENDING to indicate retry is coming
      await this.repository.updateDeliveryStatus(deliveryId, DeliveryStatus.PENDING);

      // Enqueue to Redis sorted set for scheduled retry
      await this.redis.zAdd(WEBHOOK_CONFIG.QUEUE_KEY, { score: nextRetryTime, value: deliveryId });

      await this.repository.incrementAttemptCount(deliveryId);

      logInfo("Webhook retry enqueued", {
        deliveryId,
        nextAttempt: nextAttemptNumber,
        delayMs,
        scheduledTime: new Date(nextRetryTime).toISOString(),
      });
    } catch (error) {
      logError("Failed to enqueue webhook retry", {
        deliveryId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Build webhook payload from incoming message
   */
  private buildPayload(message: IncomingMessage): WebhookPayload {
    return {
      event: "message.received",
      timestamp: new Date().toISOString(),
      data: {
        messageId: message.messageId,
        sender: message.sender,
        timestamp: message.timestamp,
        type: message.type,
        text: message.text,
        isGroup: message.isGroup,
        fromMe: message.fromMe,
        status: message.status,
      },
    };
  }

  /**
   * Sign payload with HMAC-SHA256
   * Format: sha256=<hex>
   */
  private signPayload(payload: string, secret: string): string {
    const signature = createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
    return `sha256=${signature}`;
  }

  /**
   * Check if message matches webhook filters
   */
  private matchesFilters(
    message: IncomingMessage,
    filters?: WebhookFilters
  ): boolean {
    if (!filters) {
      return true; // No filters = match all
    }

    // Check message type filter
    if (filters.messageTypes) {
      if (!filters.messageTypes.includes(message.type)) {
        return false;
      }
    }

    // Check fromMe filter
    if (filters.fromMe !== undefined) {
      if (message.fromMe !== filters.fromMe) {
        return false;
      }
    }

    // Check groupOnly filter
    if (filters.groupOnly !== undefined) {
      if (message.isGroup !== filters.groupOnly) {
        return false;
      }
    }

    return true;
  }
}
