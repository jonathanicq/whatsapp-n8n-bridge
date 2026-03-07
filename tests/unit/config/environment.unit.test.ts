/**
 * Unit tests for environment configuration
 */

import { loadConfig, isProduction, isDevelopment } from "../../../src/config/environment";

describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("loadConfig", () => {
    it("should throw error if required env vars are missing", () => {
      delete process.env.DB_HOST;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;
      delete process.env.REDIS_HOST;

      expect(() => loadConfig()).toThrow("Missing required environment variables");
    });

    it("should load valid configuration", () => {
      process.env.DB_HOST = "localhost";
      process.env.DB_USER = "user";
      process.env.DB_PASSWORD = "password";
      process.env.DB_NAME = "testdb";
      process.env.REDIS_HOST = "localhost";
      process.env.PORT = "3000";

      const config = loadConfig();

      expect(config.port).toBe(3000);
      expect(config.db.host).toBe("localhost");
      expect(config.redis.host).toBe("localhost");
    });

    it("should use default values for optional variables", () => {
      process.env.DB_HOST = "localhost";
      process.env.DB_USER = "user";
      process.env.DB_PASSWORD = "password";
      process.env.DB_NAME = "testdb";
      process.env.REDIS_HOST = "localhost";

      const config = loadConfig();

      expect(config.port).toBe(3000);
      expect(config.nodeEnv).toBe("development");
      expect(config.logLevel).toBe("info");
    });

    it("should throw error for invalid port", () => {
      process.env.DB_HOST = "localhost";
      process.env.DB_USER = "user";
      process.env.DB_PASSWORD = "password";
      process.env.DB_NAME = "testdb";
      process.env.REDIS_HOST = "localhost";
      process.env.PORT = "99999";

      expect(() => loadConfig()).toThrow("valid port number");
    });
  });

  describe("isProduction", () => {
    it("should return true when NODE_ENV is production", () => {
      process.env.DB_HOST = "localhost";
      process.env.DB_USER = "user";
      process.env.DB_PASSWORD = "password";
      process.env.DB_NAME = "testdb";
      process.env.REDIS_HOST = "localhost";
      process.env.NODE_ENV = "production";

      expect(isProduction()).toBe(true);
    });

    it("should return false when NODE_ENV is not production", () => {
      process.env.DB_HOST = "localhost";
      process.env.DB_USER = "user";
      process.env.DB_PASSWORD = "password";
      process.env.DB_NAME = "testdb";
      process.env.REDIS_HOST = "localhost";
      process.env.NODE_ENV = "development";

      expect(isProduction()).toBe(false);
    });
  });

  describe("isDevelopment", () => {
    it("should return true when NODE_ENV is development", () => {
      process.env.DB_HOST = "localhost";
      process.env.DB_USER = "user";
      process.env.DB_PASSWORD = "password";
      process.env.DB_NAME = "testdb";
      process.env.REDIS_HOST = "localhost";
      process.env.NODE_ENV = "development";

      expect(isDevelopment()).toBe(true);
    });
  });
});
