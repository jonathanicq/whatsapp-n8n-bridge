/**
 * Queue controller - handle message queue API endpoints
 */

import { Request, Response } from "express";
import { getPool } from "../config/database";
import { getRedis } from "../config/redis";
import { logInfo, logError } from "../config/logger";
import { ApiResponse } from "../utils/types";
import { HTTP_CODES, API_ERRORS } from "../utils/constants";
import {
  validatePhoneNumber,
  validateMessageText,
} from "../utils/validators";
import { MessageRepository } from "../services/message-repository";
import { RedisQueueManager } from "../services/queue-manager";
import {
  SendQueueRequest,
  MessageStatusResponse,
  PendingMessagesResponse,
} from "../models/queue-message";

/**
 * POST /queue/send - Queue a message for sending
 */
export async function queueSendMessage(
  req: Request<unknown, unknown, SendQueueRequest>,
  res: Response<ApiResponse<{ messageId: string }>>
): Promise<void> {
  try {
    // Validate request
    const phoneValidation = validatePhoneNumber(req.body.to);
    if (!phoneValidation.valid) {
      res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: {
          code: phoneValidation.error?.code || API_ERRORS.INVALID_PHONE_NUMBER,
          message:
            phoneValidation.error?.message ||
            "Invalid phone number format",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const textValidation = validateMessageText(req.body.text);
    if (!textValidation.valid) {
      res.status(HTTP_CODES.BAD_REQUEST).json({
        success: false,
        error: {
          code: textValidation.error?.code || API_ERRORS.EMPTY_MESSAGE,
          message: textValidation.error?.message || "Invalid message text",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Create message in database
    const pool = getPool();
    const messageRepository = new MessageRepository(pool);
    const message = await messageRepository.createMessage(
      req.body.to,
      req.body.text
    );

    // Enqueue for processing
    const redis = getRedis();
    const queueManager = new RedisQueueManager(redis);
    await queueManager.enqueueMessage(message.id);

    logInfo("Message queued for sending", {
      messageId: message.id,
      to: req.body.to,
    });

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: {
        messageId: message.id,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to queue message", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "QUEUE_ERROR",
        message: "Failed to queue message",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /queue/status/:messageId - Get message status and attempt history
 */
export async function getMessageStatus(
  req: Request<{ messageId: string }>,
  res: Response<ApiResponse<MessageStatusResponse>>
): Promise<void> {
  try {
    const { messageId } = req.params;

    const pool = getPool();
    const messageRepository = new MessageRepository(pool);
    const message = await messageRepository.getMessageById(messageId);

    if (!message) {
      res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: {
          code: "MESSAGE_NOT_FOUND",
          message: "Message not found",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Get attempt history
    const attempts = await messageRepository.getMessageAttempts(messageId);

    const response: MessageStatusResponse = {
      id: message.id,
      to: message.toPhoneNumber,
      text: message.text,
      status: message.status,
      messageId: message.messageId,
      attempts: attempts.length,
      lastError: message.providerError,
      createdAt: message.createdAt.toISOString(),
      sentAt: message.sentAt?.toISOString(),
      completedAt: message.completedAt?.toISOString(),
    };

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to get message status", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "STATUS_ERROR",
        message: "Failed to get message status",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /queue/pending - Get all pending messages in queue
 */
export async function getPendingMessages(
  _req: Request,
  res: Response<ApiResponse<PendingMessagesResponse>>
): Promise<void> {
  try {
    const redis = getRedis();
    const queueManager = new RedisQueueManager(redis);
    const pendingEntries = await queueManager.getPendingMessages();

    const messages = pendingEntries.map((entry) => ({
      id: entry.messageId,
      to: "unknown", // We'd need to fetch from DB to include this
      text: "unknown",
      attemptNumber: entry.attemptNumber,
      nextRetryIn: Math.max(0, entry.nextRetryAt - Date.now()),
      createdAt: new Date(entry.nextRetryAt).toISOString(),
    }));

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: {
        count: messages.length,
        messages,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to get pending messages", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "PENDING_ERROR",
        message: "Failed to get pending messages",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * DELETE /queue/:messageId - Cancel a pending message
 */
export async function cancelMessage(
  req: Request<{ messageId: string }>,
  res: Response<ApiResponse<{ cancelled: boolean }>>
): Promise<void> {
  try {
    const { messageId } = req.params;

    // Try to cancel in database
    const pool = getPool();
    const messageRepository = new MessageRepository(pool);
    const cancelled = await messageRepository.cancelMessage(messageId);

    // Also remove from Redis queue
    const redis = getRedis();
    const queueManager = new RedisQueueManager(redis);
    await queueManager.removeMessage(messageId);

    if (!cancelled) {
      logInfo("Message not found or already processed", { messageId });
      res.status(HTTP_CODES.NOT_FOUND).json({
        success: false,
        error: {
          code: "MESSAGE_NOT_FOUND",
          message: "Message not found or already processed",
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    logInfo("Message cancelled", { messageId });

    res.status(HTTP_CODES.OK).json({
      success: true,
      data: {
        cancelled: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError("Failed to cancel message", error);

    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "CANCEL_ERROR",
        message: "Failed to cancel message",
      },
      timestamp: new Date().toISOString(),
    });
  }
}
