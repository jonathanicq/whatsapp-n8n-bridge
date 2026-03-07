/**
 * WhatsApp integration tests
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
      connected: false,
      authenticated: false,
      phoneNumber: undefined,
      reconnectAttempts: 0,
    }),
    logout: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    emit: jest.fn(),
  })),
}));

jest.mock("../../src/config/database");
jest.mock("../../src/config/redis");
jest.mock("../../src/config/logger");

import { Pool } from "mysql2/promise";

describe("WhatsApp Integration Tests", () => {
  let app: ReturnType<typeof createApp>;
  let mockPool: Pool;

  beforeAll(() => {
    mockPool = {} as Pool;
    app = createApp(mockPool);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /whatsapp/qr", () => {
    it("should return QR code when available", async () => {
      const response = await request(app).get("/whatsapp/qr");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.qr).toBeDefined();
      expect(response.body.data.qrText).toBe("test-qr-code");
      expect(response.body.timestamp).toBeDefined();
    });

    it("should return error when QR code not available", async () => {
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
        logout: jest.fn().mockResolvedValue(undefined),
        on: jest.fn(),
        emit: jest.fn(),
      });

      const response = await request(app).get("/whatsapp/qr");

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NO_QR_CODE");
    });
  });

  describe("GET /whatsapp/status", () => {
    it("should return WhatsApp status", async () => {
      const response = await request(app).get("/whatsapp/status");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("connected");
      expect(response.body.data).toHaveProperty("authenticated");
      expect(response.body.data).toHaveProperty("reconnectAttempts");
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("POST /whatsapp/logout", () => {
    it("should logout successfully", async () => {
      const response = await request(app).post("/whatsapp/logout");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe("Logged out successfully");
      expect(response.body.timestamp).toBeDefined();
    });

    it("should handle logout errors", async () => {
      const { getWhatsAppService } = require("../../src/services/whatsapp-service");
      getWhatsAppService.mockReturnValueOnce({
        initialize: jest.fn().mockResolvedValue(undefined),
        disconnect: jest.fn().mockResolvedValue(undefined),
        getQRCode: jest.fn().mockReturnValue("test-qr-code"),
        getStatus: jest.fn().mockReturnValue({
          connected: false,
          authenticated: false,
          phoneNumber: undefined,
          reconnectAttempts: 0,
        }),
        logout: jest.fn().mockRejectedValueOnce(new Error("Logout failed")),
        on: jest.fn(),
        emit: jest.fn(),
      });

      const response = await request(app).post("/whatsapp/logout");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("LOGOUT_ERROR");
    });
  });
});
