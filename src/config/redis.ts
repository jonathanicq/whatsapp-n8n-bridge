/**
 * Redis client configuration
 */

import { createClient } from "redis";
import { getConfig } from "./environment";
import { logInfo, logError, logWarn } from "./logger";

type RedisClientType = ReturnType<typeof createClient>;

let client: RedisClientType | null = null;

/**
 * Initialize Redis client
 */
export async function initRedis(): Promise<RedisClientType> {
  if (client) {
    return client;
  }

  const config = getConfig();

  logInfo("Initializing Redis client", {
    host: config.redis.host,
    port: config.redis.port,
  });

  try {
    client = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password || undefined,
      database: config.redis.db,
    });

    client.on("error", (error) => {
      logError("Redis client error", error);
    });

    client.on("connect", () => {
      logInfo("Redis client connected");
    });

    client.on("ready", () => {
      logInfo("Redis client ready");
    });

    client.on("reconnecting", () => {
      logWarn("Redis client reconnecting");
    });

    // Connect to Redis
    await client.connect();

    // Test connection with ping
    const pong = await client.ping();
    logInfo("Redis ping successful", { reply: pong });

    return client;
  } catch (error) {
    logError("Failed to initialize Redis client", error, {
      host: config.redis.host,
      port: config.redis.port,
    });
    throw error;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): RedisClientType {
  if (!client) {
    throw new Error("Redis client not initialized. Call initRedis first.");
  }
  return client;
}

/**
 * Alias for getRedisClient for compatibility
 */
export function getRedis(): RedisClientType {
  return getRedisClient();
}

export type { RedisClientType };

/**
 * Set a key-value pair
 */
export async function setRedisValue(key: string, value: string, ttl?: number): Promise<void> {
  const redisClient = getRedisClient();

  try {
    if (ttl) {
      await redisClient.setEx(key, ttl, value);
    } else {
      await redisClient.set(key, value);
    }
  } catch (error) {
    logError("Redis SET failed", error, { key });
    throw error;
  }
}

/**
 * Get a value by key
 */
export async function getRedisValue(key: string): Promise<string | null> {
  const redisClient = getRedisClient();

  try {
    return await redisClient.get(key);
  } catch (error) {
    logError("Redis GET failed", error, { key });
    throw error;
  }
}

/**
 * Delete a key
 */
export async function deleteRedisKey(key: string): Promise<void> {
  const redisClient = getRedisClient();

  try {
    await redisClient.del(key);
  } catch (error) {
    logError("Redis DEL failed", error, { key });
    throw error;
  }
}

/**
 * Check Redis connection status
 */
export async function checkRedisStatus(): Promise<boolean> {
  if (!client) {
    return false;
  }

  try {
    const pong = await client.ping();
    return pong === "PONG";
  } catch (error) {
    logWarn("Redis status check failed");
    return false;
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (client) {
    logInfo("Closing Redis connection");
    try {
      await client.quit();
      logInfo("Redis connection closed successfully");
      client = null;
    } catch (error) {
      logError("Error closing Redis connection", error);
      throw error;
    }
  }
}
