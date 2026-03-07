/**
 * WhatsApp send message integration tests
 */

jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-test-123-456"),
}));

import request from "supertest";
import { createApp } from "../../src/app";

jest.mock("../../src/services/whatsapp-service", () => ({
  getWhatsAppService: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    getQRCode: jest.fn().mockReturnValue("test-qr-code"),
    getStatus: jest.fn().mockReturnValue({
      connected: true,
      authenticated: true,
      phoneNumber: "5511999999999",
      reconnectAttempts: 0,
    }),
    sendMessage: jest.fn().mockResolvedValue("msg-12345"),
    logout: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    emit: jest.fn(),
  })),
}));

jest.mock("../../src/config/database");
jest.mock("../../src/config/redis");
jest.mock("../../src/config/logger");

describe("WhatsApp Send Message Integration Tests", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /whatsapp/send - Valid Requests", () => {
    it("should send message successfully", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: "Hello World",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messageId).toBe("msg-12345");
      expect(response.body.data.to).toBe("5511999999999");
      expect(response.body.timestamp).toBeDefined();
    });

    it("should send message with + prefix phone", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "+5511999999999",
        text: "Test message",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messageId).toBeDefined();
    });

    it("should send message with unicode characters", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: "Olá Mundo! 👋",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should send message at maximum valid length", async () => {
      const maxText = "a".repeat(4096);
      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: maxText,
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /whatsapp/send - Validation Errors", () => {
    it("should reject empty phone number", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "",
        text: "Hello",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject invalid phone format", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "invalid123",
        text: "Hello",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject empty message", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: "",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("EMPTY_MESSAGE");
    });

    it("should reject whitespace-only message", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: "   ",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("EMPTY_MESSAGE");
    });

    it("should reject message exceeding max length", async () => {
      const tooLongText = "a".repeat(4097);
      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: tooLongText,
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("MESSAGE_TOO_LONG");
    });

    it("should reject phone with letters", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "123abc456",
        text: "Hello",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should reject phone starting with 0", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "01234567890",
        text: "Hello",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("INVALID_PHONE_NUMBER");
    });
  });

  describe("POST /whatsapp/send - Provider Errors", () => {
    it("should return 503 if provider not connected", async () => {
      const { getWhatsAppService } = require("../../src/services/whatsapp-service");
      getWhatsAppService.mockReturnValueOnce({
        initialize: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getQRCode: jest.fn().mockReturnValue(null),
        getStatus: jest.fn().mockReturnValue({
          connected: false,
          authenticated: false,
          phoneNumber: undefined,
          reconnectAttempts: 0,
        }),
        sendMessage: jest.fn().mockResolvedValue("msg-12345"),
        logout: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        emit: jest.fn(),
      });

      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: "Hello",
      });

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("PROVIDER_NOT_CONNECTED");
    });

    it("should return 503 if provider not authenticated", async () => {
      const { getWhatsAppService } = require("../../src/services/whatsapp-service");
      getWhatsAppService.mockReturnValueOnce({
        initialize: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getQRCode: jest.fn().mockReturnValue("test-qr"),
        getStatus: jest.fn().mockReturnValue({
          connected: true,
          authenticated: false,
          phoneNumber: undefined,
          reconnectAttempts: 0,
        }),
        sendMessage: jest.fn().mockResolvedValue("msg-12345"),
        logout: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        emit: jest.fn(),
      });

      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: "Hello",
      });

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("PROVIDER_NOT_AUTHENTICATED");
    });

    it("should return 500 if sendMessage throws error", async () => {
      const { getWhatsAppService } = require("../../src/services/whatsapp-service");
      getWhatsAppService.mockReturnValueOnce({
        initialize: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getQRCode: jest.fn().mockReturnValue("test-qr"),
        getStatus: jest.fn().mockReturnValue({
          connected: true,
          authenticated: true,
          phoneNumber: "5511999999999",
          reconnectAttempts: 0,
        }),
        sendMessage: jest.fn().mockRejectedValueOnce(new Error("Send failed")),
        logout: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        emit: jest.fn(),
      });

      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: "Hello",
      });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("SEND_FAILED");
    });
  });

  describe("POST /whatsapp/send - Edge Cases", () => {
    it("should accept phone with maximum valid length (15 digits)", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "123456789012345",
        text: "Hello",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should reject phone with 16 digits", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "1234567890123456",
        text: "Hello",
      });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("INVALID_PHONE_NUMBER");
    });

    it("should handle missing 'to' field", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        text: "Hello",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should handle missing 'text' field", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it("should include correct timestamp in response", async () => {
      const response = await request(app).post("/whatsapp/send").send({
        to: "5511999999999",
        text: "Hello",
      });

      expect(response.status).toBe(200);
      expect(response.body.data.timestamp).toBeDefined();
      expect(typeof response.body.data.timestamp).toBe("string");
    });
  });
});
