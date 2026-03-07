/**
 * Environment variable configuration and validation
 */

import dotenv from "dotenv";
import { AppConfig } from "../utils/types";
import {
  REQUIRED_ENV_VARS,
  OPTIONAL_ENV_VARS,
  DEFAULT_PORT,
  DEFAULT_LOG_LEVEL,
  DEFAULT_LOG_FORMAT,
  DEFAULT_REDIS_DB,
} from "../utils/constants";

// Load .env file
dotenv.config();

/**
 * Parse environment variables and return app config
 * @throws Error if required variables are missing
 */
export function loadConfig(): AppConfig {
  // Validate required environment variables
  const missingVars = REQUIRED_ENV_VARS.filter((envVar) => !process.env[envVar]);
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  const config: AppConfig = {
    port: parseInt(process.env.PORT || String(DEFAULT_PORT), 10),
    nodeEnv: process.env.NODE_ENV || OPTIONAL_ENV_VARS.NODE_ENV,
    appEnv: process.env.APP_ENV || OPTIONAL_ENV_VARS.APP_ENV,
    logLevel: process.env.LOG_LEVEL || DEFAULT_LOG_LEVEL,
    logFormat: process.env.LOG_FORMAT || DEFAULT_LOG_FORMAT,
    logToFile: process.env.LOG_TO_FILE === "true",
    logDir: process.env.LOG_DIR || OPTIONAL_ENV_VARS.LOG_DIR,
    db: {
      host: process.env.DB_HOST || "",
      port: parseInt(process.env.DB_PORT || "3306", 10),
      user: process.env.DB_USER || "",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "",
      poolSize: parseInt(process.env.DB_POOL_SIZE || "10", 10),
    },
    redis: {
      host: process.env.REDIS_HOST || "",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || "",
      db: parseInt(process.env.REDIS_DB || String(DEFAULT_REDIS_DB), 10),
    },
    wa: {
      sessionName: process.env.WA_SESSION_NAME || "whatsapp-bridge",
      phoneNumber: process.env.WA_PHONE_NUMBER,
    },
  };

  // Validate parsed values
  if (config.port <= 0 || config.port > 65535) {
    throw new Error("PORT must be a valid port number (1-65535)");
  }

  if (config.db.poolSize <= 0) {
    throw new Error("DB_POOL_SIZE must be greater than 0");
  }

  if (config.redis.port <= 0 || config.redis.port > 65535) {
    throw new Error("REDIS_PORT must be a valid port number (1-65535)");
  }

  return config;
}

/**
 * Get environment config (lazy loaded)
 */
let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = loadConfig();
  }
  return cachedConfig;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getConfig().nodeEnv === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getConfig().nodeEnv === "development";
}
