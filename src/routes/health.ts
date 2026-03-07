/**
 * Health check routes
 */

import { Router } from "express";
import { getHealth, getMetricsEndpoint } from "../controllers/health-controller";

const router = Router();

/**
 * GET /health - Health check endpoint
 * Returns service health status
 */
router.get("/", getHealth);

/**
 * GET /metrics - Metrics endpoint
 * Returns service metrics (uptime, memory usage, etc.)
 */
router.get("/metrics", getMetricsEndpoint);

export default router;
