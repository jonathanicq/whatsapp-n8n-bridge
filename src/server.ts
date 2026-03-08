import express, { Request, Response } from "express";
import { Client, LocalAuth, Message as WAMessage } from "whatsapp-web.js";
import dotenv from "dotenv";
import path from "path";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const qrcode = require("qrcode-terminal");

dotenv.config();

const app = express();
app.use(express.json());

// ==================== REAL WHATSAPP CLIENT ====================

class RealWhatsAppClient {
  private client: Client | null = null;
  private isReady = false;
  private lastQR = "";

  async initialize() {
    console.log("[→] Initializing Real WhatsApp Client...");

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "lightwaha",
        dataPath: path.resolve("./sessions"),
      }),
      puppeteer: {
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-gpu",
          "--disable-dev-shm-usage",
        ],
      },
    });

    // QR Code event - Display QR for authentication
    this.client.on("qr", (qr: string) => {
      this.lastQR = qr;
      console.log("\n" + "=".repeat(60));
      console.log("📱 SCAN THIS QR CODE WITH YOUR WHATSAPP:");
      console.log("=".repeat(60) + "\n");

      // Display QR in terminal
      qrcode.generate(qr, { small: true });

      console.log(
        "\n" + "=".repeat(60)
      );
      console.log("Instructions:");
      console.log("  1. Open WhatsApp on your phone");
      console.log("  2. Go to Settings > Linked Devices");
      console.log("  3. Tap 'Link a device'");
      console.log("  4. Scan the QR code above");
      console.log("=".repeat(60) + "\n");
    });

    // Ready event - Client authenticated and ready
    this.client.on("ready", () => {
      this.isReady = true;
      console.log("\n" + "=".repeat(60));
      console.log("✅ WHATSAPP AUTHENTICATED AND READY!");
      console.log("=".repeat(60) + "\n");
    });

    // Incoming message event
    this.client.on("message", (msg: WAMessage) => {
      console.log(`[MSG] ${msg.from}: ${msg.body}`);
    });

    // Disconnected event
    this.client.on("disconnected", (reason: string) => {
      this.isReady = false;
      console.log(`[✗] WhatsApp disconnected: ${reason}`);
    });

    // Error event
    this.client.on("error", (error: Error) => {
      console.error("[ERROR]", error.message);
    });

    // Initialize client
    await this.client.initialize();
  }

  getQR() {
    return this.lastQR;
  }

  isClientReady() {
    return this.isReady;
  }

  async sendMessage(to: string, text: string) {
    if (!this.client || !this.isReady) {
      throw new Error("WhatsApp client not ready");
    }

    // Format phone number without + prefix for chat ID
    const phoneNumber = to.replace(/\D/g, '');
    const chatId = `${phoneNumber}@c.us`;

    try {
      console.log(`[SEND] Attempting to send message to ${phoneNumber} (chatId: ${chatId})`);
      console.log(`[SEND] Message content: "${text}"`);

      // Try sending directly - whatsapp-web.js will handle the chat
      const response = await this.client.sendMessage(chatId, text);

      console.log(`[SEND] Message sent successfully. ID: ${response.id}`);
      return { id: response.id };
    } catch (error) {
      // Detailed error logging to understand the failure
      if (error instanceof Error) {
        console.error(`[SEND] Error message: ${error.message}`);
        console.error(`[SEND] Error stack: ${error.stack}`);
      } else {
        console.error(`[SEND] Unknown error type: ${typeof error}`);
        console.error(`[SEND] Error value: ${JSON.stringify(error)}`);
      }

      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to send message: ${errorMsg}`);
    }
  }

  async logout() {
    if (!this.client) throw new Error("Client not initialized");
    await this.client.logout();
    this.isReady = false;
    this.lastQR = "";
  }

  async destroy() {
    if (!this.client) return;
    await this.client.destroy();
    this.client = null;
    this.isReady = false;
    this.lastQR = "";
  }

  getStatus() {
    if (!this.client) {
      return { connected: false, authenticated: false };
    }

    if (!this.isReady || !(this.client as any).info) {
      return {
        connected: true,
        authenticated: false,
      };
    }

    return {
      connected: true,
      authenticated: true,
      me: {
        id: (this.client as any).info.wid._serialized,
        number: (this.client as any).info.wid.user,
      },
    };
  }
}

const PORT = process.env.PORT || 4000;

// Initialize client
const client = new RealWhatsAppClient();

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
  const qr = client.getQR();
  if (!qr) {
    return res.status(400).json({
      error: "No QR code available. Already authenticated?",
      hint: "Check the server terminal for the QR code display",
    });
  }

  return res.json({
    qr,
    message: "QR code generated. Check server terminal for visual display.",
  });
});

/**
 * GET /qr.html - Get QR code as HTML page
 */
app.get("/qr.html", (_req: Request, res: Response) => {
  const qr = client.getQR();
  if (!qr) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>lightWaha - QR Code</title>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f0f0f0;
            font-family: Arial, sans-serif;
          }
          .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ No QR Code Available</h1>
          <p>The WhatsApp session is already authenticated or not initialized.</p>
          <p><a href="/status">Check Status</a></p>
        </div>
      </body>
      </html>
    `);
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>lightWaha - QR Code</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        .container {
          text-align: center;
          background: white;
          padding: 50px;
          border-radius: 15px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          max-width: 500px;
          width: 90%;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 28px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .qr-container {
          margin: 30px 0;
          background: #f9f9f9;
          padding: 20px;
          border-radius: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .instructions {
          background: #f0f8ff;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          text-align: left;
          border-radius: 5px;
        }
        .instructions h3 {
          color: #333;
          margin-bottom: 10px;
          font-size: 16px;
        }
        .instructions ol {
          margin-left: 20px;
          color: #666;
          line-height: 1.8;
        }
        .instructions li {
          margin-bottom: 8px;
        }
        .status {
          color: #999;
          font-size: 12px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱 lightWaha</h1>
        <p class="subtitle">WhatsApp Web.js Integration</p>

        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qr)}"
               alt="WhatsApp QR Code"
               title="Scan with WhatsApp">
        </div>

        <div class="instructions">
          <h3>How to authenticate:</h3>
          <ol>
            <li>Open <strong>WhatsApp</strong> on your mobile device</li>
            <li>Go to <strong>Settings</strong></li>
            <li>Select <strong>Linked Devices</strong></li>
            <li>Tap <strong>Link a device</strong></li>
            <li>Point your camera at the QR code above</li>
          </ol>
        </div>

        <div class="status">
          <p>Server: lightWaha v1.0</p>
          <p><a href="/status" style="color: #667eea; text-decoration: none;">Check Connection Status</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.send(html);
});

/**
 * GET /status - Get WhatsApp connection status
 */
app.get("/status", (_req: Request, res: Response) => {
  const status = client.getStatus();
  return res.json(status);
});

/**
 * POST /send - Send a message
 */
app.post("/send", async (_req: Request, res: Response) => {
  if (!client.isClientReady()) {
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
    const response = await client.sendMessage(to, text);

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
    // Initialize WhatsApp
    await client.initialize();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`\n✅ Server listening on port ${PORT}`);
      console.log(`\n📋 Available endpoints:\n`);
      console.log(`  GET  /health         - Health check`);
      console.log(`  GET  /status         - WhatsApp status`);
      console.log(`  GET  /qr             - Get QR code (JSON)`);
      console.log(`  GET  /qr.html        - Get QR code (HTML page)`);
      console.log(`  POST /send           - Send message`);
      console.log(`  POST /logout         - Logout WhatsApp`);
      console.log(`  POST /destroy        - Destroy client\n`);
      console.log(`🔧 Using: Real WhatsApp Web.js Client\n`);
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n[→] Shutting down...");
      await client.destroy();
      server.close(() => process.exit(0));
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
