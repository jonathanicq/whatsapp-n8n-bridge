/**
 * API authentication middleware
 */

import { Request, Response, NextFunction } from "express";
import { getConfig } from "../config/environment";
import { logWarn } from "../config/logger";
import { AppError } from "./error-handler";
import { HTTP_CODES, API_ERRORS } from "../utils/constants";

/**
 * Extend Express Request to include API key info
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      apiKey?: string;
    }
  }
}

/**
 * API Key authentication middleware
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Get API key from header
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (apiKey) {
    req.apiKey = apiKey;
  } else {
    logWarn("Request missing API key", {
      path: req.path,
      method: req.method,
    });
  }

  next();
}

/**
 * Require API key authentication
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const config = getConfig();
  const configuredApiKey = config.apiKey;

  if (!req.apiKey) {
    throw new AppError(HTTP_CODES.UNAUTHORIZED, "API key required", API_ERRORS.INVALID_REQUEST);
  }

  // Validate against configured API key
  if (configuredApiKey && req.apiKey !== configuredApiKey) {
    throw new AppError(
      HTTP_CODES.UNAUTHORIZED,
      "Invalid API key",
      API_ERRORS.INVALID_REQUEST,
    );
  }

  next();
}
