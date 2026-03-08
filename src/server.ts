import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ==================== MOCK WHATSAPP CLIENT ====================
// For POC testing without Chromium. In production, use real whatsapp-web.js

class MockWhatsAppClient {
  private isReady = false;
  private lastQR = "";
  private messages: Array<{ from: string; text: string; timestamp: Date }> = [];

  async initialize() {
    console.log("[→] Initializing Mock WhatsApp Client...");
    // Simulate QR generation
    this.lastQR = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=mock_qr_code_" + Date.now();
    console.log("[QR] Mock QR code generated");

    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.isReady = true;
    console.log("[✓] Mock WhatsApp authenticated!");
  }

  getQR() {
    return this.lastQR;
  }

  isClientReady() {
    return this.isReady;
  }

  async sendMessage(to: string, text: string) {
    if (!this.isReady) throw new Error("Client not ready");
    const id = "msg_" + Date.now();
    console.log(`[MSG] Sent to ${to}: ${text}`);
    return { id };
  }

  async logout() {
    this.isReady = false;
    this.lastQR = "";
    this.messages = [];
    console.log("[→] Logged out");
  }

  async destroy() {
    this.isReady = false;
    this.lastQR = "";
    this.messages = [];
    console.log("[→] Destroyed");
  }

  getStatus() {
    return {
      connected: true,
      authenticated: this.isReady,
      me: this.isReady
        ? {
          id: "5511987654321@c.us",
          number: "5511987654321",
        }
        : null,
    };
  }

  receiveMessage(from: string, text: string) {
    this.messages.push({ from, text, timestamp: new Date() });
  }
}

// ==================== REAL WHATSAPP CLIENT ====================
// Uncomment to use real whatsapp-web.js (requires Chromium)

// import { Client, LocalAuth, Message as WAMessage } from "whatsapp-web.js";
// import path from "path";
// class RealWhatsAppClient {
//   private client: Client;
//   private isReady = false;
//   private lastQR = "";
//
//   async initialize() {
//     this.client = new Client({
//       authStrategy: new LocalAuth({
//         clientId: "lightwaha",
//         dataPath: path.resolve("./sessions"),
//       }),
//       puppeteer: {
//         headless: true,
//         args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
//       },
//     });
//
//     this.client.on("qr", (qr: string) => {
//       this.lastQR = qr;
//       console.log("[QR] QR code generated");
//     });
//
//     this.client.on("ready", () => {
//       this.isReady = true;
//       console.log("[✓] WhatsApp ready!");
//     });
//
//     this.client.on("message", (msg: WAMessage) => {
//       console.log(`[MSG] ${msg.from}: ${msg.body}`);
//     });
//
//     await this.client.initialize();
//   }
//
//   // ... same methods as MockWhatsAppClient
// }

const PORT = process.env.PORT || 3000;
const USE_MOCK = process.env.USE_MOCK !== "false";

// Initialize client (mock for POC, real for production)
const client = USE_MOCK ? new MockWhatsAppClient() : null;

if (!client) {
  console.error("Failed to create client");
  process.exit(1);
}

// ==================== ENDPOINTS ====================

/**
 * GET /health - Health check
 */
app.get("/health", (_req: Request, res: Response) => {
  return res.json({ status: "ok" });
});

/**
 * GET /qr - Get QR code for authentication
 */
app.get("/qr", (_req: Request, res: Response) => {
  const qr = client?.getQR();
  if (!qr) {
    return res.status(400).json({
      error: "No QR code available. Already authenticated?",
    });
  }

  return res.json({ qr });
});

/**
 * GET /status - Get WhatsApp connection status
 */
app.get("/status", (_req: Request, res: Response) => {
  const status = client?.getStatus();
  return res.json(status);
});

/**
 * POST /send - Send a message
 */
app.post("/send", async (_req: Request, res: Response) => {
  if (!client?.isClientReady()) {
    return res.status(400).json({
      error: "WhatsApp not authenticated. Scan QR code first.",
    });
  }

  const { to, text } = _req.body;

  if (!to || !text) {
    return res.status(400).json({
      error: "Missing required fields: to, text",
    });
  }

  try {
    const phoneNumber = to.startsWith("+") ? to : `+${to}`;
    const response = await client.sendMessage(phoneNumber, text);

    return res.json({
      success: true,
      messageId: response.id,
      to,
      text,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      error: "Failed to send message",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /logout - Logout from WhatsApp
 */
app.post("/logout", async (_req: Request, res: Response) => {
  if (!client) {
    return res.status(400).json({
      error: "WhatsApp client not initialized",
    });
  }

  try {
    await client.logout();
    console.log("[→] Logged out from WhatsApp");

    return res.json({
      success: true,
      message: "Logged out from WhatsApp",
    });
  } catch (error) {
    console.error("Error logging out:", error);
    return res.status(500).json({
      error: "Failed to logout",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /destroy - Destroy client
 */
app.post("/destroy", async (_req: Request, res: Response) => {
  if (!client) {
    return res.status(400).json({
      error: "WhatsApp client not initialized",
    });
  }

  try {
    await client.destroy();
    console.log("[→] WhatsApp client destroyed");

    return res.json({
      success: true,
      message: "WhatsApp client destroyed",
    });
  } catch (error) {
    console.error("Error destroying client:", error);
    return res.status(500).json({
      error: "Failed to destroy client",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ==================== START SERVER ====================

async function start() {
  try {
    if (!client) {
      throw new Error("Failed to initialize client");
    }

    // Initialize WhatsApp
    await client.initialize();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Server listening on http://localhost:${PORT}`);
      console.log(`\n📋 Available endpoints:\n`);
      console.log(`  GET  /health         - Health check`);
      console.log(`  GET  /status         - WhatsApp status`);
      console.log(`  GET  /qr             - Get QR code`);
      console.log(`  POST /send           - Send message`);
      console.log(`  POST /logout         - Logout WhatsApp`);
      console.log(`  POST /destroy        - Destroy client\n`);
      console.log(`🔧 Using: ${USE_MOCK ? "MOCK Client (for POC)" : "Real WhatsApp Client"}\n`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n[→] Shutting down...");
      if (client) {
        await client.destroy();
      }
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
