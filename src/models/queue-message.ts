/**
 * Queue message models for Phase 4 message queuing system
 */

export enum MessageStatus {
  PENDING = "pending",
  SENT = "sent",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum AttemptStatus {
  PENDING = "pending",
  SUCCESS = "success",
  RETRYING = "retrying",
  FAILED = "failed",
}

export interface QueueMessage {
  id: string; // UUID v4
  toPhoneNumber: string; // E.164 format
  text: string;
  status: MessageStatus;
  messageId?: string; // Provider message ID
  providerError?: string;
  createdAt: Date;
  sentAt?: Date;
  completedAt?: Date;
  updatedAt: Date;
}

export interface MessageAttempt {
  id: number;
  messageId: string;
  attemptNumber: number;
  status: AttemptStatus;
  errorCode?: string;
  errorMessage?: string;
  backoffDelayMs?: number;
  attemptedAt: Date;
}

export interface SendQueueRequest {
  to: string;
  text: string;
}

export interface MessageStatusResponse {
  id: string;
  to: string;
  text: string;
  status: MessageStatus;
  messageId?: string;
  attempts: number;
  lastError?: string;
  createdAt: string;
  sentAt?: string;
  completedAt?: string;
}

export interface PendingMessagesResponse {
  count: number;
  messages: Array<{
    id: string;
    to: string;
    text: string;
    attemptNumber: number;
    nextRetryIn?: number; // milliseconds
    createdAt: string;
  }>;
}
