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
import { WebhookDispatcher } from "./services/webhook-dispatcher";
import { WebhookQueueWorker } from "./services/webhook-queue-worker";
import { WebhookRepository } from "./services/webhook-repository";
import { IncomingMessage } from "./models/webhook";

let server: any = null;
let queueWorker: QueueWorkerService | null = null;
let webhookDispatcher: WebhookDispatcher | null = null;
let webhookQueueWorker: WebhookQueueWorker | null = null;

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

    // Initialize WhatsApp service (non-blocking - server starts even if initialization fails)
    const whatsAppService = getWhatsAppService();
    whatsAppService.initialize().catch((error) => {
      logError("WhatsApp service initialization failed (will retry on demand)", {
        error: error instanceof Error ? error.message : String(error),
      });
    });
    logInfo("WhatsApp service initialization started (non-blocking)");

    // Initialize queue worker
    const pool = getPool();
    const redis = getRedis();
    const messageRepository = new MessageRepository(pool);
    const queueManager = new RedisQueueManager(redis);
    queueWorker = new QueueWorkerService(queueManager, messageRepository);
    await queueWorker.start();
    logInfo("Queue worker started");

    // Initialize webhook dispatcher and worker (Phase 5)
    if (config.webhook.enableWebhooks) {
      webhookDispatcher = new WebhookDispatcher(pool, redis);
      webhookQueueWorker = new WebhookQueueWorker(pool, redis);
      webhookQueueWorker.start();
      logInfo("Webhook dispatcher and queue worker initialized");

      // Bootstrap n8n webhook if configured
      if (config.webhook.n8nWebhookUrl) {
        try {
          const webhookRepo = new WebhookRepository(pool);
          const existing = await webhookRepo.getWebhookByUrl(
            config.webhook.n8nWebhookUrl
          );
          if (!existing) {
            await webhookRepo.createWebhook(
              "n8n Auto-registered",
              config.webhook.n8nWebhookUrl,
              config.webhook.defaultSecret || ""
            );
            logInfo("n8n webhook auto-bootstrapped", {
              url: config.webhook.n8nWebhookUrl,
            });
          }
        } catch (error) {
          logError("Failed to auto-bootstrap n8n webhook", {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Subscribe to WhatsApp events
    whatsAppService.on("message", (data: unknown) => {
      const message = data as WhatsAppMessage;
      logInfo("WhatsApp message received", {
        sender: message.sender,
        messageId: message.messageId,
        type: message.type,
      });

      // Dispatch to webhooks (Phase 5)
      if (webhookDispatcher && config.webhook.enableWebhooks) {
        const incomingMessage: IncomingMessage = {
          messageId: message.messageId,
          sender: message.sender,
          timestamp: Math.floor(Date.now() / 1000), // Unix timestamp
          type: message.type || "text",
          text: message.text,
          isGroup: message.isGroup || false,
          fromMe: message.fromMe || false,
          status: "received",
        };
        webhookDispatcher.dispatch(incomingMessage).catch((error) => {
          logError("Failed to dispatch webhook", {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
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

    // Stop webhook queue worker
    if (webhookQueueWorker) {
      webhookQueueWorker.stop();
      logInfo("Webhook queue worker stopped");
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

// Global error handlers (prevent Baileys errors from crashing the server)
process.on("uncaughtException", (error) => {
  logError("Uncaught Exception (server continues)", error);
});

process.on("unhandledRejection", (reason) => {
  logError("Unhandled Rejection (server continues)", {
    error: reason instanceof Error ? reason.message : String(reason),
  });
});

// Start server
start().catch((error) => {
  logError("Fatal error", error);
  process.exit(1);
});

export { server };
