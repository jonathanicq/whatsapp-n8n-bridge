/**
 * Unit tests for health service
 */

import { getHealthStatus, getMetrics } from "../../../src/services/health-service";
import * as database from "../../../src/config/database";
import * as redis from "../../../src/config/redis";

jest.mock("../../../src/config/database");
jest.mock("../../../src/config/redis");

describe("Health Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getHealthStatus", () => {
    it("should return healthy status when all services are up", async () => {
      jest.mocked(database.getPoolStatus).mockResolvedValue({
        connected: true,
        activeConnections: 5,
      });
      jest.mocked(redis.checkRedisStatus).mockResolvedValue(true);

      const health = await getHealthStatus();

      expect(health.status).toBe("healthy");
      expect(health.services.mysql).toBe(true);
      expect(health.services.redis).toBe(true);
      expect(health.uptime).toBeGreaterThanOrEqual(0);
      expect(health.timestamp).toBeDefined();
    });

    it("should return unhealthy status when database is down", async () => {
      jest.mocked(database.getPoolStatus).mockResolvedValue({
        connected: false,
        activeConnections: 0,
      });
      jest.mocked(redis.checkRedisStatus).mockResolvedValue(true);

      const health = await getHealthStatus();

      expect(health.status).toBe("unhealthy");
      expect(health.services.mysql).toBe(false);
      expect(health.services.redis).toBe(true);
    });

    it("should return unhealthy status when Redis is down", async () => {
      jest.mocked(database.getPoolStatus).mockResolvedValue({
        connected: true,
        activeConnections: 5,
      });
      jest.mocked(redis.checkRedisStatus).mockResolvedValue(false);

      const health = await getHealthStatus();

      expect(health.status).toBe("unhealthy");
      expect(health.services.mysql).toBe(true);
      expect(health.services.redis).toBe(false);
    });

    it("should return unhealthy when both services are down", async () => {
      jest.mocked(database.getPoolStatus).mockResolvedValue({
        connected: false,
        activeConnections: 0,
      });
      jest.mocked(redis.checkRedisStatus).mockResolvedValue(false);

      const health = await getHealthStatus();

      expect(health.status).toBe("unhealthy");
      expect(health.services.mysql).toBe(false);
      expect(health.services.redis).toBe(false);
    });

    it("should handle errors gracefully", async () => {
      jest.mocked(database.getPoolStatus).mockRejectedValue(new Error("Database error"));
      jest.mocked(redis.checkRedisStatus).mockResolvedValue(false);

      const health = await getHealthStatus();

      expect(health.status).toBe("unhealthy");
      expect(health.services.mysql).toBe(false);
      expect(health.services.redis).toBe(false);
    });
  });

  describe("getMetrics", () => {
    it("should return valid metrics", () => {
      const metrics = getMetrics();

      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
      expect(metrics.version).toBe("0.0.1");
      expect(metrics.timestamp).toBeDefined();
      expect(metrics.memory).toBeDefined();
      expect(metrics.memory.heapUsed).toBeGreaterThanOrEqual(0);
      expect(metrics.memory.heapTotal).toBeGreaterThanOrEqual(0);
    });

    it("should have valid timestamp format", () => {
      const metrics = getMetrics();

      expect(() => new Date(metrics.timestamp)).not.toThrow();
    });
  });
});
