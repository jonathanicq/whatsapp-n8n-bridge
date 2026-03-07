/**
 * Winston logger configuration
 */

import winston, { Logger, format } from "winston";
import { getConfig } from "./environment";

let logger: Logger | null = null;

/**
 * Initialize and return Winston logger
 */
export function initLogger(): Logger {
  if (logger) {
    return logger;
  }

  const config = getConfig();

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        config.logFormat === "json" ? format.json() : format.simple(),
      ),
    }),
  ];

  // Add file transport if enabled
  if (config.logToFile) {
    transports.push(
      new winston.transports.File({
        filename: `${config.logDir}/error.log`,
        level: "error",
        format: format.combine(format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), format.json()),
      }),
      new winston.transports.File({
        filename: `${config.logDir}/combined.log`,
        format: format.combine(format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), format.json()),
      }),
    );
  }

  logger = winston.createLogger({
    level: config.logLevel,
    format: format.combine(
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      format.errors({ stack: true }),
      config.logFormat === "json" ? format.json() : format.simple(),
    ),
    defaultMeta: { service: "whatsapp-bridge" },
    transports,
  });

  return logger;
}

/**
 * Get logger instance
 */
export function getLogger(): Logger {
  if (!logger) {
    return initLogger();
  }
  return logger;
}

/**
 * Log info message
 */
export function logInfo(message: string, meta?: Record<string, unknown>): void {
  getLogger().info(message, meta);
}

/**
 * Log error message
 */
export function logError(
  message: string,
  error?: Error | unknown,
  meta?: Record<string, unknown>,
): void {
  getLogger().error(message, {
    ...meta,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

/**
 * Log warning message
 */
export function logWarn(message: string, meta?: Record<string, unknown>): void {
  getLogger().warn(message, meta);
}

/**
 * Log debug message
 */
export function logDebug(message: string, meta?: Record<string, unknown>): void {
  getLogger().debug(message, meta);
}
