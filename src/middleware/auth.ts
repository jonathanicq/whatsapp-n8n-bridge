/**
 * API authentication middleware (stub)
 */

import { Request, Response, NextFunction } from "express";
import { logWarn } from "../config/logger";
import { AppError } from "./error-handler";
import { HTTP_CODES, API_ERRORS } from "../utils/constants";

/**
 * Extend Express Request to include API key info
 */
declare global {
  namespace Express {
    interface Request {
      apiKey?: string;
    }
  }
}

/**
 * API Key authentication middleware (stub)
 * To be implemented in Phase 3
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  // Get API key from header
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (apiKey) {
    req.apiKey = apiKey;
    // TODO: Implement actual API key validation in Phase 3
  } else {
    logWarn("Request missing API key", {
      path: req.path,
      method: req.method,
    });
  }

  // For now, allow requests without API key (Phase 1 development)
  // In production, this would throw an error
  next();
}

/**
 * Require API key authentication
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.apiKey) {
    throw new AppError(HTTP_CODES.UNAUTHORIZED, "API key required", API_ERRORS.INVALID_REQUEST);
  }

  // TODO: Validate API key against database in Phase 3
  next();
}
