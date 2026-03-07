/**
 * Server startup and initialization
 */

import { createApp } from "./app";
import { getConfig } from "./config/environment";
import { initLogger, logInfo, logError } from "./config/logger";
import { initDatabase, closeDatabase, getPool } from "./config/database";
import { initRedis, closeRedis, getRedis } from "./config/redis";
import { getWhatsAppService } from "./services/whatsapp-service";
import { WhatsAppMessage } from "./models/whatsapp-message";
import { QueueWorkerService } from "./services/queue-worker";
import { RedisQueueManager } from "./services/queue-manager";
import { MessageRepository } from "./services/message-repository";

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

    // Initialize WhatsApp service
    const whatsAppService = getWhatsAppService();
    await whatsAppService.initialize();
    logInfo("WhatsApp service initialized");

    // Initialize queue worker
    const pool = getPool();
    const redis = getRedis();
    const messageRepository = new MessageRepository(pool);
    const queueManager = new RedisQueueManager(redis);
    queueWorker = new QueueWorkerService(queueManager, messageRepository);
    await queueWorker.start();
    logInfo("Queue worker started");

    // Subscribe to WhatsApp events
    whatsAppService.on("message", (data: unknown) => {
      const message = data as WhatsAppMessage;
      logInfo("WhatsApp message received", {
        sender: message.sender,
        messageId: message.messageId,
        type: message.type,
      });
      // TODO: Emit to n8n or trigger workflow
    });

    whatsAppService.on("qr", () => {
      logInfo("WhatsApp QR code generated");
      // TODO: Store in cache or emit to frontend
    });

    whatsAppService.on("connected", () => {
      logInfo("WhatsApp connected");
    });

    whatsAppService.on("logout", () => {
      logInfo("WhatsApp logged out");
    });

    whatsAppService.on("reconnect_failed", () => {
      logError("WhatsApp reconnection failed");
    });

    // Create Express app
    const app = createApp();

    // Start HTTP server
    server = app.listen(config.port, () => {
      logInfo("Server started", {
        port: config.port,
        environment: config.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    });

    // Handle graceful shutdown
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    process.on("unhandledRejection", (reason: unknown) => {
      logError("Unhandled Promise rejection", reason);
      shutdown();
    });

    process.on("uncaughtException", (error: Error) => {
      logError("Uncaught Exception", error);
      shutdown();
    });
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
    const whatsAppService = getWhatsAppService();
    await whatsAppService.disconnect();
    logInfo("WhatsApp service disconnected");

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

// Start server
start().catch((error) => {
  logError("Fatal error", error);
  process.exit(1);
});

export { server };
