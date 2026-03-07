/**
 * Health check service
 */

import { getPoolStatus } from "../config/database";
import { checkRedisStatus } from "../config/redis";
import { logInfo, logError } from "../config/logger";
import { HealthStatus, MetricsData } from "../utils/types";
import { HEALTH_STATUS } from "../utils/constants";

const startTime = Date.now();

/**
 * Get application health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  try {
    // Check database connection
    const dbStatus = await getPoolStatus();
    const dbHealthy = dbStatus.connected;

    // Check Redis connection
    const redisHealthy = await checkRedisStatus();

    // Determine overall health status
    let status: HealthStatus["status"] = HEALTH_STATUS.HEALTHY;
    if (!dbHealthy || !redisHealthy) {
      status = !dbHealthy || !redisHealthy
        ? HEALTH_STATUS.UNHEALTHY
        : HEALTH_STATUS.DEGRADED;
    }

    const healthStatus: HealthStatus = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        mysql: dbHealthy,
        redis: redisHealthy,
      },
    };

    logInfo("Health status retrieved", { status });
    return healthStatus;
  } catch (error) {
    logError("Error checking health status", error);

    return {
      status: HEALTH_STATUS.UNHEALTHY,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      services: {
        mysql: false,
        redis: false,
      },
    };
  }
}

/**
 * Get application metrics
 */
export function getMetrics(): MetricsData {
  const memUsage = process.memoryUsage();

  const metrics: MetricsData = {
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    },
    version: "0.0.1",
  };

  return metrics;
}
