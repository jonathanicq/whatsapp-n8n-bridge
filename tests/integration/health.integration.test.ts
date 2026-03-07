/**
 * Integration tests for health endpoints
 */

// Mock dependencies BEFORE imports
jest.mock("../../src/config/database");
jest.mock("../../src/config/redis");
jest.mock("../../src/config/logger");
jest.mock("uuid", () => ({
  v4: jest.fn(() => "uuid-test-123-456"),
}));
jest.mock("../../src/services/whatsapp-service", () => ({
  getWhatsAppService: jest.fn(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    getQRCode: jest.fn().mockReturnValue(null),
    getStatus: jest.fn().mockReturnValue({
      connected: false,
      authenticated: false,
      phoneNumber: undefined,
      reconnectAttempts: 0,
    }),
    on: jest.fn(),
    emit: jest.fn(),
  })),
}));

import { createApp } from "../../src/app";
import { Express } from "express";
import { Pool } from "mysql2/promise";

import * as database from "../../src/config/database";
import * as redis from "../../src/config/redis";

describe("Health Endpoints Integration Tests", () => {
  let app: Express;
  let mockPool: Pool;

  beforeAll(() => {
    mockPool = {} as Pool;
    app = createApp(mockPool);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    jest.mocked(database.getPoolStatus).mockResolvedValue({
      connected: true,
      activeConnections: 5,
    });
    jest.mocked(redis.checkRedisStatus).mockResolvedValue(true);
  });

  describe("GET /health", () => {
    it("should return 200 with healthy status when all services are up", async () => {
      const response = await (app as any)._testRequest("GET", "/health").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("healthy");
      expect(response.body.data.services).toBeDefined();
      expect(response.body.data.services.mysql).toBe(true);
      expect(response.body.data.services.redis).toBe(true);
    });

    it("should return 503 with unhealthy status when services are down", async () => {
      jest.mocked(database.getPoolStatus).mockResolvedValue({
        connected: false,
        activeConnections: 0,
      });
      jest.mocked(redis.checkRedisStatus).mockResolvedValue(false);

      const response = await (app as any)._testRequest("GET", "/health").expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe("unhealthy");
    });

    it("should return valid timestamp", async () => {
      const response = await (app as any)._testRequest("GET", "/health").expect(200);

      expect(response.body.data.timestamp).toBeDefined();
      expect(() => new Date(response.body.data.timestamp)).not.toThrow();
    });
  });

  describe("GET /health/metrics", () => {
    it("should return 200 with metrics data", async () => {
      const response = await (app as any)._testRequest("GET", "/health/metrics").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
      expect(response.body.data.version).toBeDefined();
      expect(response.body.data.memory).toBeDefined();
    });

    it("should return memory usage data", async () => {
      const response = await (app as any)._testRequest("GET", "/health/metrics").expect(200);

      const metrics = response.body.data;
      expect(metrics.memory.heapUsed).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.heapTotal).toBeGreaterThanOrEqual(0);
    });
  });

  describe("404 Not Found", () => {
    it("should return 404 for non-existent route", async () => {
      const response = await (app as any)._testRequest("GET", "/nonexistent").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
