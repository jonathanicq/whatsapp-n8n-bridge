/**
 * MySQL database connection pool configuration
 */

import mysql from "mysql2/promise";
import { Pool, PoolConnection } from "mysql2/promise";
import { getConfig } from "./environment";
import { logInfo, logError, logWarn } from "./logger";

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export async function initDatabase(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  const config = getConfig();

  logInfo("Initializing MySQL connection pool", {
    host: config.db.host,
    database: config.db.database,
    poolSize: config.db.poolSize,
  });

  try {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: config.db.poolSize,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logInfo("MySQL connection pool initialized successfully");
    return pool;
  } catch (error) {
    logError("Failed to initialize MySQL connection pool", error, {
      host: config.db.host,
      database: config.db.database,
    });
    throw error;
  }
}

/**
 * Get database connection from pool
 */
export async function getConnection(): Promise<PoolConnection> {
  if (!pool) {
    await initDatabase();
  }

  if (!pool) {
    throw new Error("Database pool not initialized");
  }

  try {
    return await pool.getConnection();
  } catch (error) {
    logError("Failed to get database connection", error);
    throw error;
  }
}

/**
 * Execute a query
 */
export async function query<T = unknown>(
  sql: string,
  values?: (string | number | boolean | null)[]
): Promise<T> {
  const connection = await getConnection();

  try {
    const [rows] = await connection.execute(sql, values);
    return rows as T;
  } catch (error) {
    logError("Database query failed", error, { sql });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    logInfo("Closing MySQL connection pool");
    try {
      await pool.end();
      pool = null;
      logInfo("MySQL connection pool closed successfully");
    } catch (error) {
      logError("Error closing MySQL connection pool", error);
      throw error;
    }
  }
}

/**
 * Get pool status
 */
export async function getPoolStatus(): Promise<{
  connected: boolean;
  activeConnections: number;
}> {
  if (!pool) {
    return { connected: false, activeConnections: 0 };
  }

  try {
    const connection = await pool.getConnection();
    connection.release();
    return { connected: true, activeConnections: 1 };
  } catch (error) {
    logWarn("Database pool status check failed", { error });
    return { connected: false, activeConnections: 0 };
  }
}
