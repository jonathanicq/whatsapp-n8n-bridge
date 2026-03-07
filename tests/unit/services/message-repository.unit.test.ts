/**
 * Message repository unit tests
 */

jest.mock("../../../src/config/logger");
jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-test-123-456"),
}));

import { MessageRepository } from "../../../src/services/message-repository";
import { MessageStatus, AttemptStatus } from "../../../src/models/queue-message";
import type { Pool } from "mysql2/promise";

// Mock database pool
const mockConnection = {
  execute: jest.fn(),
  release: jest.fn(),
};

const mockPool = {
  getConnection: jest.fn().mockResolvedValue(mockConnection),
} as unknown as Pool;

describe("MessageRepository", () => {
  let repository: MessageRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new MessageRepository(mockPool);
  });

  describe("createMessage", () => {
    it("should create a new message", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([
        { affectedRows: 1 },
      ]);

      const message = await repository.createMessage(
        "5511999999999",
        "Hello World"
      );

      expect(message.toPhoneNumber).toBe("5511999999999");
      expect(message.text).toBe("Hello World");
      expect(message.status).toBe(MessageStatus.PENDING);
      expect(message.id).toBeDefined();
      expect(mockConnection.execute).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe("getMessageById", () => {
    it("should retrieve a message by ID", async () => {
      const mockRow = {
        id: "msg-123",
        to_phone_number: "5511999999999",
        text: "Test message",
        status: MessageStatus.PENDING,
        message_id: null,
        provider_error: null,
        created_at: new Date(),
        sent_at: null,
        completed_at: null,
        updated_at: new Date(),
      };

      (mockConnection.execute as jest.Mock).mockResolvedValue([[mockRow]]);

      const message = await repository.getMessageById("msg-123");

      expect(message).toBeDefined();
      expect(message?.id).toBe("msg-123");
      expect(message?.toPhoneNumber).toBe("5511999999999");
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should return null if message not found", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([[]]);

      const message = await repository.getMessageById("msg-notfound");

      expect(message).toBeNull();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe("getPendingMessages", () => {
    it("should retrieve pending messages", async () => {
      const mockRows = [
        {
          id: "msg-1",
          to_phone_number: "5511999999999",
          text: "Message 1",
          status: MessageStatus.PENDING,
          message_id: null,
          provider_error: null,
          created_at: new Date(),
          sent_at: null,
          completed_at: null,
          updated_at: new Date(),
        },
        {
          id: "msg-2",
          to_phone_number: "5511988888888",
          text: "Message 2",
          status: MessageStatus.PENDING,
          message_id: null,
          provider_error: null,
          created_at: new Date(),
          sent_at: null,
          completed_at: null,
          updated_at: new Date(),
        },
      ];

      (mockConnection.execute as jest.Mock).mockResolvedValue([mockRows]);

      const messages = await repository.getPendingMessages(100);

      expect(messages).toHaveLength(2);
      expect(messages[0].id).toBe("msg-1");
      expect(messages[1].id).toBe("msg-2");
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should return empty array when no pending messages", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([[]]);

      const messages = await repository.getPendingMessages(100);

      expect(messages).toEqual([]);
    });
  });

  describe("updateMessageStatus", () => {
    it("should update message status to sent", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([
        { affectedRows: 1 },
      ]);

      await repository.updateMessageStatus(
        "msg-123",
        MessageStatus.SENT,
        "provider-msg-456"
      );

      expect(mockConnection.execute).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should set completed_at for terminal statuses", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([
        { affectedRows: 1 },
      ]);

      await repository.updateMessageStatus(
        "msg-123",
        MessageStatus.FAILED,
        undefined,
        "Send failed"
      );

      const call = (mockConnection.execute as jest.Mock).mock.calls[0];
      const query = call[0];

      // Check that completed_at is being set (it should not be null)
      expect(query).toContain("completed_at");
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe("recordAttempt", () => {
    it("should record a successful attempt", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([
        { insertId: 1 },
      ]);

      const attempt = await repository.recordAttempt(
        "msg-123",
        1,
        AttemptStatus.SUCCESS
      );

      expect(attempt.id).toBe(1);
      expect(attempt.messageId).toBe("msg-123");
      expect(attempt.attemptNumber).toBe(1);
      expect(attempt.status).toBe(AttemptStatus.SUCCESS);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should record a failed attempt with error details", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([
        { insertId: 2 },
      ]);

      const attempt = await repository.recordAttempt(
        "msg-123",
        2,
        AttemptStatus.RETRYING,
        "NETWORK_ERROR",
        "Connection timeout",
        2000
      );

      expect(attempt.id).toBe(2);
      expect(attempt.errorCode).toBe("NETWORK_ERROR");
      expect(attempt.errorMessage).toBe("Connection timeout");
      expect(attempt.backoffDelayMs).toBe(2000);
    });
  });

  describe("getMessageAttempts", () => {
    it("should retrieve all attempts for a message", async () => {
      const mockAttempts = [
        {
          id: 1,
          message_id: "msg-123",
          attempt_number: 1,
          status: AttemptStatus.RETRYING,
          error_code: "NETWORK_ERROR",
          error_message: "Connection timeout",
          backoff_delay_ms: 1000,
          attempted_at: new Date(),
        },
        {
          id: 2,
          message_id: "msg-123",
          attempt_number: 2,
          status: AttemptStatus.SUCCESS,
          error_code: null,
          error_message: null,
          backoff_delay_ms: null,
          attempted_at: new Date(),
        },
      ];

      (mockConnection.execute as jest.Mock).mockResolvedValue([mockAttempts]);

      const attempts = await repository.getMessageAttempts("msg-123");

      expect(attempts).toHaveLength(2);
      expect(attempts[0].attemptNumber).toBe(1);
      expect(attempts[1].status).toBe(AttemptStatus.SUCCESS);
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe("getPendingMessageCount", () => {
    it("should return count of pending messages", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([
        [{ count: 42 }],
      ]);

      const count = await repository.getPendingMessageCount();

      expect(count).toBe(42);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should return 0 when no results", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([[]]);

      const count = await repository.getPendingMessageCount();

      expect(count).toBe(0);
    });
  });

  describe("cancelMessage", () => {
    it("should cancel a pending message", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([
        { affectedRows: 1 },
      ]);

      const cancelled = await repository.cancelMessage("msg-123");

      expect(cancelled).toBe(true);
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should return false if message already processed", async () => {
      (mockConnection.execute as jest.Mock).mockResolvedValue([
        { affectedRows: 0 },
      ]);

      const cancelled = await repository.cancelMessage("msg-sent");

      expect(cancelled).toBe(false);
    });
  });
});
