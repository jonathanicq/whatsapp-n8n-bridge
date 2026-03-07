/**
 * Application-wide constants
 */

export const HTTP_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const LOG_LEVELS = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
} as const;

export const HEALTH_STATUS = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  UNHEALTHY: "unhealthy",
} as const;

export const DB_CONFIG = {
  MAX_POOL_SIZE: 20,
  MIN_POOL_SIZE: 2,
  CONNECTION_TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const REDIS_CONFIG = {
  RECONNECT_INTERVAL: 5000,
  RECONNECT_MAX_ATTEMPTS: 10,
} as const;

export const API_ERRORS = {
  INVALID_REQUEST: "INVALID_REQUEST",
  DATABASE_ERROR: "DATABASE_ERROR",
  CACHE_ERROR: "CACHE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export const API_MESSAGES = {
  SUCCESS: "Request processed successfully",
  SERVER_ERROR: "An internal server error occurred",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable",
} as const;

export const DEFAULT_PORT = 3000;
export const DEFAULT_LOG_LEVEL = "info";
export const DEFAULT_LOG_FORMAT = "json";
export const DEFAULT_REDIS_DB = 0;

export const REQUIRED_ENV_VARS = [
  "DB_HOST",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
  "REDIS_HOST",
];

export const OPTIONAL_ENV_VARS = {
  PORT: DEFAULT_PORT,
  NODE_ENV: "development",
  APP_ENV: "development",
  LOG_LEVEL: DEFAULT_LOG_LEVEL,
  LOG_FORMAT: DEFAULT_LOG_FORMAT,
  LOG_TO_FILE: false,
  LOG_DIR: "./logs",
  DB_PORT: 3306,
  DB_POOL_SIZE: 10,
  REDIS_PORT: 6379,
  REDIS_PASSWORD: "",
  REDIS_DB: DEFAULT_REDIS_DB,
  WA_SESSION_NAME: "whatsapp-bridge",
};
