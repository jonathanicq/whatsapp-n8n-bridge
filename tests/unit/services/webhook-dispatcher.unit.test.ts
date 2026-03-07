/**
 * Unit tests for webhook dispatcher
 */

jest.mock("uuid", () => ({
  v4: jest.fn(() => "test-uuid-123"),
}));

import { Pool } from "mysql2/promise";
import type { RedisClientType } from "../../../src/config/redis";
import { WebhookDispatcher } from "../../../src/services/webhook-dispatcher";
import {
  WebhookConfig,
  IncomingMessage,
  DeliveryStatus,
} from "../../../src/models/webhook";
import { WEBHOOK_CONFIG } from "../../../src/utils/constants";

// Mock fetch
global.fetch = jest.fn();

jest.mock("../../../src/services/webhook-repository");
jest.mock("../../../src/config/logger");

describe("WebhookDispatcher", () => {
  let mockPool: jest.Mocked<Pool>;
  let mockRedis: jest.Mocked<RedisClientType>;
  let dispatcher: WebhookDispatcher;

  const mockWebhook: WebhookConfig = {
    id: "webhook-123",
    name: "Test Webhook",
    url: "https://example.com/webhook",
    secret: "test-secret",
    active: true,
    filters: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMessage: IncomingMessage = {
    messageId: "msg-123",
    sender: "5511999999999",
    timestamp: Math.floor(Date.now() / 1000),
    type: "text",
    text: "Hello",
    isGroup: false,
    fromMe: false,
    status: "received",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    mockPool = {} as jest.Mocked<Pool>;
    mockRedis = {
      setEx: jest.fn().mockResolvedValue("OK"),
      zAdd: jest.fn().mockResolvedValue(1),
      getEx: jest.fn(),
    } as unknown as jest.Mocked<RedisClientType>;

    (global.fetch as jest.Mock).mockClear();

    dispatcher = new WebhookDispatcher(mockPool, mockRedis);

    // Mock repository methods
    const mockRepository = dispatcher["repository"];
    mockRepository.listActiveWebhooks = jest
      .fn()
      .mockResolvedValue([mockWebhook]);
    mockRepository.createDelivery = jest.fn().mockResolvedValue({
      id: "delivery-123",
      webhookId: mockWebhook.id,
      messageId: mockMessage.messageId,
      status: DeliveryStatus.PENDING,
      attemptCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockRepository.recordDeliveryAttempt = jest.fn().mockResolvedValue({});
    mockRepository.updateDeliveryStatus = jest.fn().mockResolvedValue(undefined);
    mockRepository.getWebhookById = jest.fn().mockResolvedValue(mockWebhook);
    mockRepository.getDeliveryById = jest.fn().mockResolvedValue({
      id: "delivery-123",
      webhookId: mockWebhook.id,
      messageId: mockMessage.messageId,
      status: DeliveryStatus.PENDING,
      attemptCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockRepository.incrementAttemptCount = jest.fn().mockResolvedValue(undefined);
  });

  describe("dispatch", () => {
    it("should dispatch message to active webhooks", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(mockMessage);

      // Wait a bit for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        expect.stringContaining("webhook:payload:"),
        WEBHOOK_CONFIG.PAYLOAD_TTL,
        expect.any(String)
      );
    });

    it("should not dispatch if no active webhooks", async () => {
      const mockRepository = dispatcher["repository"];
      (mockRepository.listActiveWebhooks as jest.Mock).mockResolvedValueOnce(
        []
      );

      await dispatcher.dispatch(mockMessage);

      expect(mockRedis.setEx).not.toHaveBeenCalled();
    });

    it("should cache payload in Redis", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRedis.setEx).toHaveBeenCalledWith(
        `${WEBHOOK_CONFIG.PAYLOAD_KEY_PREFIX}${mockMessage.messageId}`,
        WEBHOOK_CONFIG.PAYLOAD_TTL,
        expect.stringContaining(JSON.stringify(mockMessage.messageId))
      );
    });
  });

  describe("message filtering", () => {
    it("should filter by message type", async () => {
      const filteredWebhook: WebhookConfig = {
        ...mockWebhook,
        filters: { messageTypes: ["image"] },
      };

      const mockRepository = dispatcher["repository"];
      (mockRepository.listActiveWebhooks as jest.Mock).mockResolvedValueOnce([
        filteredWebhook,
      ]);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(mockMessage); // type: "text"

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not call fetch because message doesn't match filter
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should filter by fromMe flag", async () => {
      const filteredWebhook: WebhookConfig = {
        ...mockWebhook,
        filters: { fromMe: true },
      };

      const mockRepository = dispatcher["repository"];
      (mockRepository.listActiveWebhooks as jest.Mock).mockResolvedValueOnce([
        filteredWebhook,
      ]);

      const incomingMsg = { ...mockMessage, fromMe: false };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(incomingMsg);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should filter by group status", async () => {
      const filteredWebhook: WebhookConfig = {
        ...mockWebhook,
        filters: { groupOnly: true },
      };

      const mockRepository = dispatcher["repository"];
      (mockRepository.listActiveWebhooks as jest.Mock).mockResolvedValueOnce([
        filteredWebhook,
      ]);

      const incomingMsg = { ...mockMessage, isGroup: false };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(incomingMsg);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("HMAC signature", () => {
    it("should sign payload with HMAC-SHA256", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(global.fetch).toHaveBeenCalledWith(
        mockWebhook.url,
        expect.objectContaining({
          headers: expect.objectContaining({
            "X-Webhook-Signature": expect.stringMatching(/^sha256=[a-f0-9]{64}$/),
          }),
        })
      );
    });
  });

  describe("delivery status tracking", () => {
    it("should mark delivery as success on 2xx response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      const mockRepository = dispatcher["repository"];
      const updateSpy = mockRepository.updateDeliveryStatus as jest.Mock;

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(updateSpy).toHaveBeenCalledWith(
        expect.any(String),
        DeliveryStatus.SUCCESS
      );
    });

    it("should fail permanently on 4xx response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: jest.fn().mockResolvedValue("Bad Request"),
      });

      const mockRepository = dispatcher["repository"];
      const updateSpy = mockRepository.updateDeliveryStatus as jest.Mock;

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(updateSpy).toHaveBeenCalledWith(
        expect.any(String),
        DeliveryStatus.FAILED,
        expect.stringContaining("400")
      );
    });

    it("should enqueue retry on 5xx response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: jest.fn().mockResolvedValue("Server Error"),
      });

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        WEBHOOK_CONFIG.QUEUE_KEY,
        expect.any(Number),
        expect.any(String)
      );
    });
  });

  describe("retry logic", () => {
    it("should enqueue retry on connection failure", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Connection refused")
      );

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        WEBHOOK_CONFIG.QUEUE_KEY,
        expect.any(Number),
        expect.any(String)
      );
    });

    it("should enqueue retry on timeout", async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        WEBHOOK_CONFIG.QUEUE_KEY,
        expect.any(Number),
        expect.any(String)
      );
    });
  });

  describe("payload format", () => {
    it("should include correct webhook payload structure", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload).toMatchObject({
        event: "message.received",
        timestamp: expect.any(String),
        data: expect.objectContaining({
          messageId: mockMessage.messageId,
          sender: mockMessage.sender,
          type: mockMessage.type,
          text: mockMessage.text,
          isGroup: mockMessage.isGroup,
          fromMe: mockMessage.fromMe,
          status: "received",
        }),
      });
    });
  });

  describe("error handling", () => {
    it("should not crash if webhook repository fails", async () => {
      const mockRepository = dispatcher["repository"];
      (mockRepository.listActiveWebhooks as jest.Mock).mockRejectedValueOnce(
        new Error("DB Error")
      );

      // Should not throw
      await expect(dispatcher.dispatch(mockMessage)).resolves.toBeUndefined();
    });
  });

  describe("request configuration", () => {
    it("should use correct HTTP method and headers", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const config = fetchCall[1];

      expect(config).toMatchObject({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          "X-Webhook-Signature": expect.any(String),
        }),
      });
    });

    it("should set request timeout", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(""),
      });

      await dispatcher.dispatch(mockMessage);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const config = fetchCall[1];

      expect(config.signal).toBeInstanceOf(AbortSignal);
    });
  });
});
