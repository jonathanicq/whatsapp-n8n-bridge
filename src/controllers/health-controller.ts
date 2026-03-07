/**
 * Health check controller
 */

import { Request, Response } from "express";
import { getHealthStatus, getMetrics } from "../services/health-service";
import { logInfo } from "../config/logger";
import { ApiResponse } from "../utils/types";

/**
 * GET /health - Health check endpoint
 */
export async function getHealth(_req: Request, res: Response<ApiResponse<unknown>>): Promise<void> {
  try {
    const health = await getHealthStatus();
    const statusCode = health.status === "healthy" ? 200 : 503;

    logInfo("Health endpoint accessed", { status: health.status });

    res.status(statusCode).json({
      success: health.status === "healthy",
      data: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logInfo("Health check error", { error });
    res.status(503).json({
      success: false,
      error: {
        code: "HEALTH_CHECK_ERROR",
        message: "Unable to determine service health",
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * GET /metrics - Metrics endpoint
 */
export async function getMetricsEndpoint(
  _req: Request,
  res: Response<ApiResponse<unknown>>,
): Promise<void> {
  try {
    const metrics = getMetrics();

    logInfo("Metrics endpoint accessed");

    res.status(200).json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logInfo("Metrics endpoint error", { error });
    res.status(500).json({
      success: false,
      error: {
        code: "METRICS_ERROR",
        message: "Unable to retrieve metrics",
      },
      timestamp: new Date().toISOString(),
    });
  }
}
