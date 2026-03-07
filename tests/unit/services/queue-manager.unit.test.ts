/**
 * Queue manager unit tests
 */

jest.mock("../../../src/config/logger");

import { RedisQueueManager } from "../../../src/services/queue-manager";
import type { RedisClientType } from "../../../src/config/redis";

// Mock Redis client
const mockRedis = {
  zAdd: jest.fn(),
  zRange: jest.fn(),
  zRangeByScore: jest.fn(),
  zRem: jest.fn(),
  zCard: jest.fn(),
  del: jest.fn(),
} as unknown as RedisClientType;

describe("RedisQueueManager", () => {
  let queueManager: RedisQueueManager;

  beforeEach(() => {
    jest.clearAllMocks();
    queueManager = new RedisQueueManager(mockRedis);
  });

  describe("enqueueMessage", () => {
    it("should enqueue a message with default delay", async () => {
      (mockRedis.zAdd as jest.Mock).mockResolvedValue(1);

      await queueManager.enqueueMessage("msg-123");

      expect(mockRedis.zAdd).toHaveBeenCalled();
      const call = (mockRedis.zAdd as jest.Mock).mock.calls[0];
      expect(call[0]).toBe("whatsapp:queue:messages");
      expect(call[1]).toHaveProperty("score");
      expect(call[1]).toHaveProperty("value");

      const entry = JSON.parse(call[1].value);
      expect(entry.messageId).toBe("msg-123");
      expect(entry.attemptNumber).toBe(1);
    });

    it("should enqueue a message with custom delay", async () => {
      (mockRedis.zAdd as jest.Mock).mockResolvedValue(1);
      const now = Date.now();

      await queueManager.enqueueMessage("msg-456", 5000);

      const call = (mockRedis.zAdd as jest.Mock).mock.calls[0];
      const entry = JSON.parse(call[1].value);
      // Score should be approximately now + 5000
      expect(entry.nextRetryAt).toBeGreaterThanOrEqual(now + 5000 - 100);
      expect(entry.nextRetryAt).toBeLessThanOrEqual(now + 5000 + 100);
    });
  });

  describe("getNextMessage", () => {
    it("should return null when no messages are ready", async () => {
      (mockRedis.zRangeByScore as jest.Mock).mockResolvedValue([]);

      const result = await queueManager.getNextMessage();

      expect(result).toBeNull();
    });

    it("should return next ready message and move to processing", async () => {
      const entry = {
        messageId: "msg-789",
        attemptNumber: 1,
        nextRetryAt: Date.now(),
      };
      const entryString = JSON.stringify(entry);

      (mockRedis.zRangeByScore as jest.Mock).mockResolvedValue([entryString]);
      (mockRedis.zAdd as jest.Mock).mockResolvedValue(1);
      (mockRedis.zRem as jest.Mock).mockResolvedValue(1);

      const result = await queueManager.getNextMessage();

      expect(result).toEqual(entry);
      expect(mockRedis.zAdd).toHaveBeenCalledWith(
        "whatsapp:queue:processing",
        expect.objectContaining({ value: entryString })
      );
      expect(mockRedis.zRem).toHaveBeenCalledWith(
        "whatsapp:queue:messages",
        entryString
      );
    });
  });

  describe("markProcessed", () => {
    it("should remove message from processing queue", async () => {
      const entry = {
        messageId: "msg-111",
        attemptNumber: 1,
        nextRetryAt: Date.now(),
      };
      const entryString = JSON.stringify(entry);

      (mockRedis.zRange as jest.Mock).mockResolvedValue([entryString]);
      (mockRedis.zRem as jest.Mock).mockResolvedValue(1);

      await queueManager.markProcessed("msg-111");

      expect(mockRedis.zRem).toHaveBeenCalledWith(
        "whatsapp:queue:processing",
        entryString
      );
    });

    it("should handle message not found in processing", async () => {
      (mockRedis.zRange as jest.Mock).mockResolvedValue([]);

      await queueManager.markProcessed("msg-not-found");

      expect(mockRedis.zRem).not.toHaveBeenCalled();
    });
  });

  describe("scheduleRetry", () => {
    it("should schedule retry with exponential backoff", async () => {
      const entry = {
        messageId: "msg-222",
        attemptNumber: 1,
        nextRetryAt: Date.now(),
      };
      const entryString = JSON.stringify(entry);

      (mockRedis.zRange as jest.Mock).mockResolvedValue([entryString]);
      (mockRedis.zRem as jest.Mock).mockResolvedValue(1);
      (mockRedis.zAdd as jest.Mock).mockResolvedValue(1);

      const delayMs = await queueManager.scheduleRetry("msg-222", 1);

      expect(delayMs).toBe(1000); // First retry delay is 1000ms
      expect(mockRedis.zAdd).toHaveBeenCalled();

      const call = (mockRedis.zAdd as jest.Mock).mock.calls[0];
      const newEntry = JSON.parse(call[1].value);
      expect(newEntry.attemptNumber).toBe(2);
    });

    it("should use max backoff delay for attempts > 5", async () => {
      const entry = {
        messageId: "msg-333",
        attemptNumber: 10,
        nextRetryAt: Date.now(),
      };
      const entryString = JSON.stringify(entry);

      (mockRedis.zRange as jest.Mock).mockResolvedValue([entryString]);
      (mockRedis.zRem as jest.Mock).mockResolvedValue(1);
      (mockRedis.zAdd as jest.Mock).mockResolvedValue(1);

      const delayMs = await queueManager.scheduleRetry("msg-333", 10);

      expect(delayMs).toBe(30000); // Max backoff is 30000ms
    });
  });

  describe("getPendingMessages", () => {
    it("should return all pending messages", async () => {
      const entries = [
        JSON.stringify({
          messageId: "msg-1",
          attemptNumber: 1,
          nextRetryAt: Date.now(),
        }),
        JSON.stringify({
          messageId: "msg-2",
          attemptNumber: 1,
          nextRetryAt: Date.now(),
        }),
      ];

      (mockRedis.zRange as jest.Mock).mockResolvedValue(entries);

      const result = await queueManager.getPendingMessages();

      expect(result).toHaveLength(2);
      expect(result[0].messageId).toBe("msg-1");
      expect(result[1].messageId).toBe("msg-2");
    });

    it("should return empty array when no messages", async () => {
      (mockRedis.zRange as jest.Mock).mockResolvedValue([]);

      const result = await queueManager.getPendingMessages();

      expect(result).toEqual([]);
    });
  });

  describe("getQueueStats", () => {
    it("should return queue statistics", async () => {
      const entry = JSON.stringify({
        messageId: "msg-old",
        attemptNumber: 1,
        nextRetryAt: Date.now() - 60000, // 1 minute ago
      });

      (mockRedis.zCard as jest.Mock)
        .mockResolvedValueOnce(5) // pending count
        .mockResolvedValueOnce(2); // processing count
      (mockRedis.zRange as jest.Mock).mockResolvedValue([entry]);

      const stats = await queueManager.getQueueStats();

      expect(stats.pendingCount).toBe(5);
      expect(stats.processingCount).toBe(2);
      expect(stats.oldestMessageAge).toBeGreaterThan(59000);
    });
  });

  describe("removeMessage", () => {
    it("should remove message from both queues", async () => {
      const entry = JSON.stringify({
        messageId: "msg-remove",
        attemptNumber: 1,
        nextRetryAt: Date.now(),
      });

      (mockRedis.zRange as jest.Mock)
        .mockResolvedValueOnce([entry]) // queue
        .mockResolvedValueOnce([]); // processing
      (mockRedis.zRem as jest.Mock).mockResolvedValue(1);

      const result = await queueManager.removeMessage("msg-remove");

      expect(result).toBe(true);
      expect(mockRedis.zRem).toHaveBeenCalled();
    });

    it("should return false if message not found", async () => {
      (mockRedis.zRange as jest.Mock)
        .mockResolvedValueOnce([]) // queue
        .mockResolvedValueOnce([]); // processing

      const result = await queueManager.removeMessage("msg-notfound");

      expect(result).toBe(false);
      expect(mockRedis.zRem).not.toHaveBeenCalled();
    });
  });

  describe("clearAllQueues", () => {
    it("should clear all queue keys", async () => {
      (mockRedis.del as jest.Mock).mockResolvedValue(3);

      await queueManager.clearAllQueues();

      expect(mockRedis.del).toHaveBeenCalledTimes(3);
      expect(mockRedis.del).toHaveBeenCalledWith("whatsapp:queue:messages");
      expect(mockRedis.del).toHaveBeenCalledWith("whatsapp:queue:processing");
      expect(mockRedis.del).toHaveBeenCalledWith("whatsapp:queue:lock");
    });
  });
});
