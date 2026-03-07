/**
 * Background worker service for processing queued WhatsApp messages
 */

import { getWhatsAppService } from "./whatsapp-service";
import { RedisQueueManager } from "./queue-manager";
import { MessageRepository } from "./message-repository";
import { MessageStatus, AttemptStatus } from "../models/queue-message";
import { logInfo, logError, logDebug } from "../config/logger";

const MAX_ATTEMPTS = 5;
const PROCESSING_INTERVAL_MS = 5000; // Check queue every 5 seconds

export class QueueWorkerService {
  private isRunning = false;
  private processingInterval?: NodeJS.Timeout;

  constructor(
    private queueManager: RedisQueueManager,
    private messageRepository: MessageRepository
  ) {}

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logInfo("Worker already running");
      return;
    }

    this.isRunning = true;
    logInfo("Queue worker starting");

    // Process messages in a loop
    this.processingInterval = setInterval(
      () => {
        this.processNextMessage().catch((error) => {
          logError("Error in queue worker loop", error);
        });
      },
      PROCESSING_INTERVAL_MS
    );
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    logInfo("Queue worker stopped");
  }

  /**
   * Process the next message in queue
   */
  private async processNextMessage(): Promise<void> {
    try {
      // Get next message ready for processing
      const entry = await this.queueManager.getNextMessage();
      if (!entry) {
        logDebug("No messages ready for processing");
        return;
      }

      logDebug("Processing message", {
        messageId: entry.messageId,
        attempt: entry.attemptNumber,
      });

      // Get message details from database
      const message = await this.messageRepository.getMessageById(
        entry.messageId
      );
      if (!message) {
        logError("Message not found in database", { messageId: entry.messageId });
        await this.queueManager.markProcessed(entry.messageId);
        return;
      }

      // Check if max attempts exceeded
      if (entry.attemptNumber > MAX_ATTEMPTS) {
        logError("Max attempts exceeded for message", {
          messageId: entry.messageId,
          maxAttempts: MAX_ATTEMPTS,
        });

        await this.messageRepository.updateMessageStatus(
          entry.messageId,
          MessageStatus.FAILED,
          undefined,
          `Failed after ${MAX_ATTEMPTS} attempts`
        );

        await this.messageRepository.recordAttempt(
          entry.messageId,
          entry.attemptNumber,
          AttemptStatus.FAILED,
          "MAX_ATTEMPTS_EXCEEDED",
          `Message failed after ${MAX_ATTEMPTS} attempts`
        );

        await this.queueManager.markProcessed(entry.messageId);
        return;
      }

      try {
        // Attempt to send message
        const whatsappService = getWhatsAppService();
        const status = whatsappService.getStatus();

        if (!status.connected || !status.authenticated) {
          // Provider not ready, retry
          logInfo("Provider not ready, scheduling retry", {
            messageId: entry.messageId,
            connected: status.connected,
            authenticated: status.authenticated,
          });

          const delayMs = await this.queueManager.scheduleRetry(
            entry.messageId,
            entry.attemptNumber
          );

          await this.messageRepository.recordAttempt(
            entry.messageId,
            entry.attemptNumber,
            AttemptStatus.RETRYING,
            "PROVIDER_NOT_READY",
            undefined,
            delayMs
          );

          return;
        }

        // Send message
        const messageId = await whatsappService.sendMessage(
          message.toPhoneNumber,
          message.text
        );

        // Success
        await this.messageRepository.updateMessageStatus(
          entry.messageId,
          MessageStatus.SENT,
          messageId
        );

        await this.messageRepository.recordAttempt(
          entry.messageId,
          entry.attemptNumber,
          AttemptStatus.SUCCESS
        );

        await this.queueManager.markProcessed(entry.messageId);

        logInfo("Message sent successfully", {
          messageId: entry.messageId,
          providerId: messageId,
        });
      } catch (error) {
        // Send failed, check if retryable
        const errorMsg = error instanceof Error ? error.message : String(error);
        const isRetryable = this.isRetryableError(errorMsg);

        if (isRetryable && entry.attemptNumber < MAX_ATTEMPTS) {
          logInfo("Send failed, scheduling retry", {
            messageId: entry.messageId,
            error: errorMsg,
            attempt: entry.attemptNumber,
          });

          const delayMs = await this.queueManager.scheduleRetry(
            entry.messageId,
            entry.attemptNumber
          );

          await this.messageRepository.recordAttempt(
            entry.messageId,
            entry.attemptNumber,
            AttemptStatus.RETRYING,
            "SEND_ERROR",
            errorMsg,
            delayMs
          );
        } else {
          // Not retryable or max attempts reached
          logError("Message send failed permanently", {
            messageId: entry.messageId,
            error: errorMsg,
            isRetryable,
            attempt: entry.attemptNumber,
          });

          await this.messageRepository.updateMessageStatus(
            entry.messageId,
            MessageStatus.FAILED,
            undefined,
            errorMsg
          );

          await this.messageRepository.recordAttempt(
            entry.messageId,
            entry.attemptNumber,
            AttemptStatus.FAILED,
            "SEND_ERROR",
            errorMsg
          );

          await this.queueManager.markProcessed(entry.messageId);
        }
      }
    } catch (error) {
      logError("Unexpected error in processNextMessage", error);
      // Continue processing despite errors
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(errorMsg: string): boolean {
    // Non-retryable errors
    const nonRetryable = [
      "INVALID_PHONE",
      "PHONE_NOT_FOUND",
      "AUTHENTICATION_FAILED",
      "INVALID_MESSAGE",
    ];

    for (const pattern of nonRetryable) {
      if (errorMsg.includes(pattern)) {
        return false;
      }
    }

    // Network and transient errors are retryable
    return true;
  }
}
