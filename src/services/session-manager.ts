/**
 * WhatsApp session management - persist to Redis with encryption
 */

import { setRedisValue, getRedisValue, deleteRedisKey } from "../config/redis";
import { logInfo, logError } from "../config/logger";
import { WhatsAppSession } from "../models/whatsapp-session";

const REDIS_SESSION_PREFIX = "wa:session:";
const SESSION_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

/**
 * Save session to Redis
 */
export async function saveSession(sessionName: string, session: WhatsAppSession): Promise<void> {
  const redisKey = `${REDIS_SESSION_PREFIX}${sessionName}`;

  try {
    const sessionJson = JSON.stringify(session);
    await setRedisValue(redisKey, sessionJson, SESSION_TTL);
    logInfo("WhatsApp session saved to Redis", { sessionName });
  } catch (error) {
    logError("Failed to save WhatsApp session", error, { sessionName });
    throw error;
  }
}

/**
 * Load session from Redis
 */
export async function loadSession(sessionName: string): Promise<WhatsAppSession | null> {
  const redisKey = `${REDIS_SESSION_PREFIX}${sessionName}`;

  try {
    const sessionJson = await getRedisValue(redisKey);

    if (!sessionJson) {
      logInfo("No session found in Redis", { sessionName });
      return null;
    }

    const session = JSON.parse(sessionJson) as WhatsAppSession;
    logInfo("WhatsApp session loaded from Redis", { sessionName });
    return session;
  } catch (error) {
    logError("Failed to load WhatsApp session", error, { sessionName });
    return null;
  }
}

/**
 * Delete session from Redis
 */
export async function deleteSession(sessionName: string): Promise<void> {
  const redisKey = `${REDIS_SESSION_PREFIX}${sessionName}`;

  try {
    await deleteRedisKey(redisKey);
    logInfo("WhatsApp session deleted from Redis", { sessionName });
  } catch (error) {
    logError("Failed to delete WhatsApp session", error, { sessionName });
    throw error;
  }
}

/**
 * Create a new session
 */
export function createSession(sessionName: string, phoneNumber?: string): WhatsAppSession {
  return {
    sessionName,
    phoneNumber,
    isConnected: false,
    isAuthenticated: false,
    createdAt: Date.now(),
  };
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionName: string,
  isConnected: boolean,
  isAuthenticated: boolean,
  phoneNumber?: string,
): Promise<void> {
  const session = await loadSession(sessionName);

  if (!session) {
    throw new Error(`Session not found: ${sessionName}`);
  }

  session.isConnected = isConnected;
  session.isAuthenticated = isAuthenticated;
  if (phoneNumber) session.phoneNumber = phoneNumber;
  session.lastConnected = Date.now();

  await saveSession(sessionName, session);
}
