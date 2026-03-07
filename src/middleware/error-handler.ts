/**
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from "express";
import { logError } from "../config/logger";
import { HTTP_CODES, API_MESSAGES, API_ERRORS } from "../utils/constants";
import { ApiResponse } from "../utils/types";

/**
 * Error object for typed error handling
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code: string = API_ERRORS.INTERNAL_ERROR
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode: number = HTTP_CODES.INTERNAL_SERVER_ERROR;
  let message: string = API_MESSAGES.SERVER_ERROR;
  let code: string = API_ERRORS.INTERNAL_ERROR;

  // Handle AppError instances
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code;
  }
  // Handle standard Error instances
  else if (error instanceof Error) {
    message = error.message;
  }
  // Handle any other value
  else {
    message = String(error);
  }

  // Log the error
  logError("Unhandled error", error, {
    statusCode,
    code,
    message,
    path: _req.path,
    method: _req.method,
  });

  // Send error response
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(statusCode).json(response);
}

/**
 * Not found handler middleware
 */
export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const response: ApiResponse<null> = {
    success: false,
    error: {
      code: API_ERRORS.INVALID_REQUEST,
      message: `Route ${_req.method} ${_req.path} not found`,
    },
    timestamp: new Date().toISOString(),
  };

  res.status(HTTP_CODES.NOT_FOUND).json(response);
}
