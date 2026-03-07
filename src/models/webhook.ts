/**
 * Webhook models for Phase 5 inbound message delivery system
 */

export enum WebhookStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum DeliveryStatus {
  PENDING = "pending",
  DELIVERING = "delivering",
  SUCCESS = "success",
  FAILED = "failed",
}

export enum AttemptStatus {
  SUCCESS = "success",
  FAILED = "failed",
  RETRYING = "retrying",
}

/**
 * Optional message filters for webhook delivery
 */
export interface WebhookFilters {
  messageTypes?: string[]; // e.g., ["text", "image"]
  fromMe?: boolean;
  groupOnly?: boolean;
}

/**
 * Webhook configuration stored in database
 */
export interface WebhookConfig {
  id: string; // UUID v4
  name: string;
  url: string;
  secret: string; // HMAC-SHA256 secret - never exposed in API responses
  active: boolean;
  filters?: WebhookFilters;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook delivery tracking (one row per webhook × message)
 */
export interface WebhookDelivery {
  id: string; // UUID v4
  webhookId: string;
  messageId: string; // Incoming message ID from Baileys
  status: DeliveryStatus;
  attemptCount: number;
  lastError?: string;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

/**
 * Webhook delivery attempt (immutable audit trail)
 */
export interface WebhookDeliveryAttempt {
  id: number;
  deliveryId: string;
  attemptNumber: number;
  status: AttemptStatus;
  httpStatusCode?: number;
  errorCode?: string;
  errorMessage?: string;
  backoffDelayMs?: number;
  attemptedAt: Date;
}

/**
 * Incoming WhatsApp message data to be dispatched to webhooks
 */
export interface IncomingMessage {
  messageId: string;
  sender: string; // Phone number
  timestamp: number; // Unix timestamp
  type: string; // "text", "image", etc.
  text?: string;
  isGroup: boolean;
  fromMe: boolean;
  status: string; // "received", "read", etc.
}

/**
 * Webhook payload sent to registered endpoints
 */
export interface WebhookPayload {
  event: string; // "message.received"
  timestamp: string; // ISO 8601
  data: IncomingMessage;
}

/**
 * Create webhook request body
 */
export interface CreateWebhookRequest {
  name: string;
  url: string;
  secret?: string; // Auto-generated if not provided
  active?: boolean; // Defaults to true
  filters?: WebhookFilters;
}

/**
 * Update webhook request body
 */
export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  active?: boolean;
  filters?: WebhookFilters;
}

/**
 * Webhook response (secret redacted)
 */
export interface WebhookResponse {
  id: string;
  name: string;
  url: string;
  active: boolean;
  filters?: WebhookFilters;
  createdAt: string;
  updatedAt: string;
}

/**
 * List webhooks response
 */
export interface ListWebhooksResponse {
  webhooks: WebhookResponse[];
  total: number;
}

/**
 * Webhook delivery status response
 */
export interface WebhookDeliveryStatusResponse {
  id: string;
  webhookId: string;
  webhookName: string;
  messageId: string;
  status: DeliveryStatus;
  attemptCount: number;
  lastError?: string;
  createdAt: string;
  completedAt?: string;
  attempts: Array<{
    attemptNumber: number;
    status: AttemptStatus;
    httpStatusCode?: number;
    errorCode?: string;
    errorMessage?: string;
    attemptedAt: string;
  }>;
}

/**
 * Retry queue entry (stored in Redis sorted set)
 */
export interface RetryQueueEntry {
  deliveryId: string;
  webhookId: string;
  messageId: string;
  attemptNumber: number;
  nextRetryTime: number; // Unix timestamp (ms) when to retry
}
