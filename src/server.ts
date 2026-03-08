/**
 * Server startup and initialization
 */

import { createApp } from "./app";
import { getConfig } from "./config/environment";
import { initLogger, logInfo, logError } from "./config/logger";
import { initDatabase, closeDatabase, getPool } from "./config/database";
import { initRedis, closeRedis, getRedis } from "./config/redis";
import { QueueWorkerService } from "./services/queue-worker";
import { RedisQueueManager } from "./services/queue-manager";
import { MessageRepository } from "./services/message-repository";
import { WAHAClient } from "./services/waha-client";

let server: any = null;
let queueWorker: QueueWorkerService | null = null;

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    // Initialize logger first
    initLogger();
    logInfo("Initializing WhatsApp-n8n Bridge Service");

    // Load configuration
    const config = getConfig();
    logInfo("Configuration loaded", {
      port: config.port,
      nodeEnv: config.nodeEnv,
      appEnv: config.appEnv,
      logLevel: config.logLevel,
    });

    // Initialize database
    await initDatabase();
    logInfo("Database initialized");

    // Initialize Redis
    await initRedis();
    logInfo("Redis initialized");

    // Initialize WAHA client (WhatsApp HTTP API)
    const wahaClient = new WAHAClient(
      config.waha?.host || "waha",
      config.waha?.port || 3000,
      config.waha?.apiKey
    );
    logInfo("WAHA client configured", {
      host: config.waha?.host || "waha",
      port: config.waha?.port || 3000,
    });

    // Start WAHA session (generates QR code for authentication)
    try {
      await wahaClient.startSession();
      logInfo("WAHA session started - QR code will be generated");
    } catch (error) {
      logError("Failed to start WAHA session", error);
      // Continue anyway - session might already exist
    }

    // Initialize queue worker
    const pool = getPool();
    const redis = getRedis();
    const messageRepository = new MessageRepository(pool);
    const queueManager = new RedisQueueManager(redis);
    queueWorker = new QueueWorkerService(queueManager, messageRepository);
    await queueWorker.start();
    logInfo("Queue worker started");

    // Webhook handling is delegated to WAHA service
    // WAHA manages incoming message webhooks through its own HTTP endpoints
    logInfo("Webhook configuration loaded", {
      enableWebhooks: config.webhook.enableWebhooks,
      n8nWebhookUrl: config.webhook.n8nWebhookUrl || "not configured",
    });

    // Note: Message events and webhooks are handled through WAHA's polling/webhook system
    // WAHA is responsible for managing WebSocket connections and forwarding events
    logInfo("WAHA configured for WhatsApp event handling");

    // Create Express app
    const app = createApp(pool);

    // Start HTTP server
    server = app.listen(config.port, () => {
      logInfo("Server started", {
        port: config.port,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle graceful shutdown (only for SIGTERM/SIGINT, not for errors)
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  } catch (error) {
    logError("Failed to start server", error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(): Promise<void> {
  logInfo("Shutting down server...");

  try {
    // Stop queue worker
    if (queueWorker) {
      await queueWorker.stop();
      logInfo("Queue worker stopped");
    }

    // Close HTTP server
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error: Error | undefined) => {
          if (error) {
            reject(error);
          } else {
            logInfo("HTTP server closed");
            resolve();
          }
        });
      });
    }

    // Note: WAHA handles WhatsApp connection lifecycle independently
    logInfo("WAHA connection closed");

    // Close database
    await closeDatabase();
    logInfo("Database closed");

    // Close Redis
    await closeRedis();
    logInfo("Redis closed");

    logInfo("Server shutdown complete");
    process.exit(0);
  } catch (error) {
    logError("Error during shutdown", error);
    process.exit(1);
  }
}

// Suppress uncaught exceptions/rejections from crashing the server
// Baileys socket errors are logged to console but don't terminate the process
process.on("uncaughtException", (error) => {
  console.error("[Baileys/Internal Error]", error);
  // Don't call logError - just swallow the error to keep server running
});

process.on("unhandledRejection", (reason) => {
  console.error("[Baileys/Internal Rejection]", reason);
  // Don't call logError - just swallow the error to keep server running
});

// Start server
start().catch((error) => {
  logError("Fatal error", error);
  process.exit(1);
});

export { server };
