/**
 * Unit tests for webhook repository
 */

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-123"),
}));

jest.mock("../../../src/config/logger");

import { Pool, PoolConnection } from "mysql2/promise";
import { WebhookRepository } from "../../../src/services/webhook-repository";
import {
  WebhookFilters,
  DeliveryStatus,
  AttemptStatus,
} from "../../../src/models/webhook";

describe("WebhookRepository", () => {
  let mockPool: jest.Mocked<Pool>;
  let mockConnection: jest.Mocked<PoolConnection>;
  let repository: WebhookRepository;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup connection mock
    mockConnection = {
      execute: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<PoolConnection>;

    // Setup pool mock
    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection),
    } as unknown as jest.Mocked<Pool>;

    repository = new WebhookRepository(mockPool);
  });

  describe("createWebhook", () => {
    it("should create a webhook with auto-generated secret", async () => {
      const mockResult = { affectedRows: 1 };

      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([
        mockResult,
      ]);

      const webhook = await repository.createWebhook(
        "Test Webhook",
        "https://example.com/webhook",
        "secret123"
      );

      expect(webhook).toMatchObject({
        id: "test-uuid-123",
        name: "Test Webhook",
        url: "https://example.com/webhook",
        secret: "secret123",
        active: true,
      });

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO webhook_configs"),
        expect.arrayContaining([
          "test-uuid-123",
          "Test Webhook",
          "https://example.com/webhook",
          "secret123",
          true,
          null,
        ])
      );

      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should create webhook with filters", async () => {
      const filters: WebhookFilters = {
        messageTypes: ["text"],
        fromMe: false,
      };

      (mockConnection.execute as jest.Mock).mockResolvedValueOnce({
        affectedRows: 1,
      });

      const webhook = await repository.createWebhook(
        "Filtered Webhook",
        "https://example.com/webhook",
        "secret123",
        filters
      );

      expect(webhook.filters).toEqual(filters);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO webhook_configs"),
        expect.arrayContaining([JSON.stringify(filters)])
      );
    });
  });

  describe("getWebhookById", () => {
    it("should return webhook if found", async () => {
      const mockRow = {
        id: "webhook-123",
        name: "Test Webhook",
        url: "https://example.com/webhook",
        secret: "secret123",
        active: 1,
        filters: null,
        created_at: "2026-03-07T00:00:00.000Z",
        updated_at: "2026-03-07T00:00:00.000Z",
      };

      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([
        [mockRow],
      ]);

      const webhook = await repository.getWebhookById("webhook-123");

      expect(webhook).toMatchObject({
        id: "webhook-123",
        name: "Test Webhook",
        url: "https://example.com/webhook",
        secret: "secret123",
        active: true,
      });
    });

    it("should return null if webhook not found", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([[]]);

      const webhook = await repository.getWebhookById("non-existent");

      expect(webhook).toBeNull();
    });
  });

  describe("getWebhookByUrl", () => {
    it("should return webhook by URL", async () => {
      const mockRow = {
        id: "webhook-123",
        name: "Test Webhook",
        url: "https://example.com/webhook",
        secret: "secret123",
        active: 1,
        filters: null,
        created_at: "2026-03-07T00:00:00.000Z",
        updated_at: "2026-03-07T00:00:00.000Z",
      };

      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([
        [mockRow],
      ]);

      const webhook = await repository.getWebhookByUrl(
        "https://example.com/webhook"
      );

      expect(webhook?.url).toBe("https://example.com/webhook");
    });
  });

  describe("listWebhooks", () => {
    it("should return all webhooks", async () => {
      const mockRows = [
        {
          id: "webhook-1",
          name: "Webhook 1",
          url: "https://example1.com",
          secret: "secret1",
          active: 1,
          filters: null,
          created_at: "2026-03-07T00:00:00.000Z",
          updated_at: "2026-03-07T00:00:00.000Z",
        },
        {
          id: "webhook-2",
          name: "Webhook 2",
          url: "https://example2.com",
          secret: "secret2",
          active: 1,
          filters: null,
          created_at: "2026-03-07T01:00:00.000Z",
          updated_at: "2026-03-07T01:00:00.000Z",
        },
      ];

      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([mockRows]);

      const webhooks = await repository.listWebhooks();

      expect(webhooks).toHaveLength(2);
      expect(webhooks[0].id).toBe("webhook-1");
      expect(webhooks[1].id).toBe("webhook-2");
    });

    it("should return empty array if no webhooks", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([[]]);

      const webhooks = await repository.listWebhooks();

      expect(webhooks).toEqual([]);
    });
  });

  describe("listActiveWebhooks", () => {
    it("should return only active webhooks", async () => {
      const mockRows = [
        {
          id: "webhook-1",
          name: "Active Webhook",
          url: "https://example1.com",
          secret: "secret1",
          active: 1,
          filters: null,
          created_at: "2026-03-07T00:00:00.000Z",
          updated_at: "2026-03-07T00:00:00.000Z",
        },
      ];

      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([mockRows]);

      const webhooks = await repository.listActiveWebhooks();

      expect(webhooks).toHaveLength(1);
      expect(webhooks[0].active).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("WHERE active = 1")
      );
    });
  });

  describe("updateWebhook", () => {
    it("should update webhook fields", async () => {
      const mockRow = {
        id: "webhook-123",
        name: "Updated Webhook",
        url: "https://updated.com",
        secret: "secret123",
        active: 1,
        filters: null,
        created_at: "2026-03-07T00:00:00.000Z",
        updated_at: "2026-03-07T00:00:00.000Z",
      };

      (mockConnection.execute as jest.Mock)
        .mockResolvedValueOnce({ affectedRows: 1 }) // UPDATE query
        .mockResolvedValueOnce([[mockRow]]); // SELECT query (getWebhookById)

      const updated = await repository.updateWebhook("webhook-123", {
        name: "Updated Webhook",
        url: "https://updated.com",
      });

      expect(updated?.name).toBe("Updated Webhook");
      expect(updated?.url).toBe("https://updated.com");
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE webhook_configs SET"),
        expect.any(Array)
      );
    });

    it("should update active status", async () => {
      const mockRow = {
        id: "webhook-123",
        name: "Test",
        url: "https://example.com",
        secret: "secret",
        active: 0,
        filters: null,
        created_at: "2026-03-07T00:00:00.000Z",
        updated_at: "2026-03-07T00:00:00.000Z",
      };

      (mockConnection.execute as jest.Mock)
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce([[mockRow]]);

      const updated = await repository.updateWebhook("webhook-123", {
        active: false,
      });

      expect(updated?.active).toBe(false);
    });
  });

  describe("deleteWebhook", () => {
    it("should delete webhook", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValueOnce({
        affectedRows: 1,
      });

      const deleted = await repository.deleteWebhook("webhook-123");

      expect(deleted).toBe(true);
      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining("DELETE FROM webhook_configs"),
        ["webhook-123"]
      );
    });

    it("should return false if webhook not found", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValueOnce({
        affectedRows: 0,
      });

      const deleted = await repository.deleteWebhook("non-existent");

      expect(deleted).toBe(false);
    });
  });

  describe("createDelivery", () => {
    it("should create delivery record", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValueOnce({
        affectedRows: 1,
      });

      const delivery = await repository.createDelivery(
        "webhook-123",
        "message-456"
      );

      expect(delivery).toMatchObject({
        id: "test-uuid-123",
        webhookId: "webhook-123",
        messageId: "message-456",
        status: DeliveryStatus.PENDING,
        attemptCount: 0,
      });
    });
  });

  describe("getDeliveryById", () => {
    it("should return delivery if found", async () => {
      const mockRow = {
        id: "delivery-123",
        webhook_id: "webhook-123",
        message_id: "message-456",
        status: "pending",
        attempt_count: 0,
        last_error: null,
        created_at: "2026-03-07T00:00:00.000Z",
        completed_at: null,
        updated_at: "2026-03-07T00:00:00.000Z",
      };

      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([
        [mockRow],
      ]);

      const delivery = await repository.getDeliveryById("delivery-123");

      expect(delivery).toMatchObject({
        id: "delivery-123",
        webhookId: "webhook-123",
        messageId: "message-456",
        status: DeliveryStatus.PENDING,
      });
    });
  });

  describe("recordDeliveryAttempt", () => {
    it("should record successful attempt", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValueOnce({
        affectedRows: 1,
      });

      const attempt = await repository.recordDeliveryAttempt(
        "delivery-123",
        1,
        AttemptStatus.SUCCESS,
        200
      );

      expect(attempt).toMatchObject({
        deliveryId: "delivery-123",
        attemptNumber: 1,
        status: AttemptStatus.SUCCESS,
        httpStatusCode: 200,
      });
    });

    it("should record failed attempt with error details", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValueOnce({
        affectedRows: 1,
      });

      const attempt = await repository.recordDeliveryAttempt(
        "delivery-123",
        1,
        AttemptStatus.FAILED,
        500,
        "HTTP_SERVER_ERROR",
        "Internal Server Error"
      );

      expect(attempt).toMatchObject({
        deliveryId: "delivery-123",
        attemptNumber: 1,
        status: AttemptStatus.FAILED,
        httpStatusCode: 500,
        errorCode: "HTTP_SERVER_ERROR",
        errorMessage: "Internal Server Error",
      });
    });
  });

  describe("getDeliveryAttempts", () => {
    it("should return all attempts for a delivery", async () => {
      const mockRows = [
        {
          id: 1,
          delivery_id: "delivery-123",
          attempt_number: 1,
          status: "failed",
          http_status_code: 500,
          error_code: "SERVER_ERROR",
          error_message: "Error",
          backoff_delay_ms: 1000,
          attempted_at: "2026-03-07T00:00:00.000Z",
        },
        {
          id: 2,
          delivery_id: "delivery-123",
          attempt_number: 2,
          status: "success",
          http_status_code: 200,
          error_code: null,
          error_message: null,
          backoff_delay_ms: null,
          attempted_at: "2026-03-07T00:01:00.000Z",
        },
      ];

      (mockConnection.execute as jest.Mock).mockResolvedValueOnce([mockRows]);

      const attempts = await repository.getDeliveryAttempts("delivery-123");

      expect(attempts).toHaveLength(2);
      expect(attempts[0].attemptNumber).toBe(1);
      expect(attempts[1].attemptNumber).toBe(2);
    });
  });
});
