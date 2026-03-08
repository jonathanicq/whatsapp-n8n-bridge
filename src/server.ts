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
import { getWhatsAppService } from "./services/whatsapp-service";

let server: any = null;
let queueWorker: QueueWorkerService | null = null;
let config: any = null;

/**
 * Start the server
 */
async function start(): Promise<void> {
  try {
    // Initialize logger first
    initLogger();
    logInfo("Initializing WhatsApp-n8n Bridge Service");

    // Load configuration
    config = getConfig();
    logInfo("Configuration loaded", {
      port: config.port,
      nodeEnv: config.nodeEnv,
      appEnv: config.appEnv,
      logLevel: config.logLevel,
      waSessionName: config.wa.sessionName,
      headless: config.wa.headless,
    });

    // Initialize database
    await initDatabase();
    logInfo("Database initialized");

    // Initialize Redis
    await initRedis();
    logInfo("Redis initialized");

    // Initialize WhatsApp service (direct whatsapp-web.js integration)
    const waService = getWhatsAppService(config.wa.sessionName, config.wa.headless);
    logInfo("WhatsApp service configured", {
      sessionName: config.wa.sessionName,
      headless: config.wa.headless,
    });

    // Start WhatsApp session (generates QR code for authentication)
    try {
      await waService.initialize();
      logInfo("WhatsApp session initialized - QR code will be generated");
    } catch (error) {
      logError("Failed to initialize WhatsApp session", error);
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

    // Webhook handling
    logInfo("Webhook configuration loaded", {
      enableWebhooks: config.webhook.enableWebhooks,
      n8nWebhookUrl: config.webhook.n8nWebhookUrl || "not configured",
    });

    // Note: Message events are emitted by the WhatsApp service
    // The service forwards events to webhook handlers if configured
    logInfo("WhatsApp event handling configured");

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

    // Disconnect WhatsApp service
    try {
      const waService = getWhatsAppService(config.wa.sessionName, config.wa.headless);
      await waService.disconnect();
      logInfo("WhatsApp service disconnected");
    } catch (error) {
      logError("Error disconnecting WhatsApp service", error);
    }

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
// whatsapp-web.js socket errors are logged to console but don't terminate the process
process.on("uncaughtException", (error) => {
  console.error("[WhatsApp/Internal Error]", error);
  // Don't call logError - just swallow the error to keep server running
});

process.on("unhandledRejection", (reason) => {
  console.error("[WhatsApp/Internal Rejection]", reason);
  // Don't call logError - just swallow the error to keep server running
});

// Start server
start().catch((error) => {
  logError("Fatal error", error);
  process.exit(1);
});

export { server };
