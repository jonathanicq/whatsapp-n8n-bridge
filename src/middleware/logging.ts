/**
 * Request/response logging middleware
 */

import { Request, Response, NextFunction } from "express";
import { logInfo } from "../config/logger";

/**
 * Logging middleware - logs all HTTP requests and responses
 */
export function loggingMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const { method, path, query, body } = _req;

  // Log response when it's sent
  res.on("finish", () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    logInfo("HTTP request completed", {
      method,
      path,
      statusCode,
      duration,
      query: Object.keys(query).length > 0 ? query : undefined,
      bodySize: body ? JSON.stringify(body).length : 0,
    });
  });

  next();
}
