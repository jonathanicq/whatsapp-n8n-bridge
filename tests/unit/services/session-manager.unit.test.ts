/**
 * Session manager unit tests
 */

import { createSession, updateSessionStatus } from "../../../src/services/session-manager";

jest.mock("../../../src/config/redis", () => ({
  setRedisValue: jest.fn().mockResolvedValue(undefined),
  getRedisValue: jest.fn().mockResolvedValue(null),
  deleteRedisKey: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../../src/config/logger");

describe("Session Manager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSession", () => {
    it("should create a session with correct properties", () => {
      const sessionName = "test-session";
      const phoneNumber = "1234567890";

      const session = createSession(sessionName, phoneNumber);

      expect(session.sessionName).toBe(sessionName);
      expect(session.phoneNumber).toBe(phoneNumber);
      expect(session.isConnected).toBe(false);
      expect(session.isAuthenticated).toBe(false);
      expect(session.createdAt).toBeDefined();
      expect(typeof session.createdAt).toBe("number");
    });

    it("should create a session without phone number", () => {
      const sessionName = "test-session";

      const session = createSession(sessionName);

      expect(session.sessionName).toBe(sessionName);
      expect(session.phoneNumber).toBeUndefined();
      expect(session.isConnected).toBe(false);
      expect(session.isAuthenticated).toBe(false);
    });
  });

  describe("updateSessionStatus", () => {
    it("should throw error when session not found", async () => {
      const { getRedisValue } = require("../../../src/config/redis");
      getRedisValue.mockResolvedValueOnce(null);

      await expect(updateSessionStatus("nonexistent", true, true)).rejects.toThrow(
        "Session not found: nonexistent"
      );
    });

    it("should update session status and phone number", async () => {
      const { getRedisValue, setRedisValue } = require("../../../src/config/redis");

      const existingSession = {
        sessionName: "test-session",
        isConnected: false,
        isAuthenticated: false,
        createdAt: Date.now(),
      };

      getRedisValue.mockResolvedValueOnce(JSON.stringify(existingSession));

      await updateSessionStatus("test-session", true, true, "1234567890");

      expect(setRedisValue).toHaveBeenCalled();
      const savedData = JSON.parse(setRedisValue.mock.calls[0][1]);
      expect(savedData.isConnected).toBe(true);
      expect(savedData.isAuthenticated).toBe(true);
      expect(savedData.phoneNumber).toBe("1234567890");
      expect(savedData.lastConnected).toBeDefined();
    });
  });
});
