/**
 * whatsapp-web.js implementation of WhatsApp provider
 * Direct integration with whatsapp-web.js library
 */

import { EventEmitter } from "events";
import { Client, LocalAuth, Message as WaMessage } from "whatsapp-web.js";
import * as qrcode from "qrcode-terminal";
import { logInfo, logError, logWarn } from "../config/logger";
import type { IWhatsAppProvider, ConnectionStatus, ProviderEventType } from "./types";

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];

export class WhatsAppWebProvider extends EventEmitter implements IWhatsAppProvider {
  private sessionName: string;
  private client: Client | null = null;
  private currentQR: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isInitializing = false;
  private isAuthenticated = false;
  private headless: boolean;

  constructor(sessionName: string, headless = true) {
    super();
    this.sessionName = sessionName;
    this.headless = headless;
  }

  /**
   * Initialize WhatsApp connection
   */
  async initialize(): Promise<void> {
    if (this.isInitializing || this.client) {
      return;
    }

    this.isInitializing = true;

    try {
      logInfo("Initializing whatsapp-web.js provider", { sessionName: this.sessionName });

      this.client = new Client({
        authStrategy: new LocalAuth({ clientId: this.sessionName }),
        puppeteer: {
          headless: this.headless,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      });

      this.setupEventHandlers();

      await this.client.initialize();

      logInfo("whatsapp-web.js provider initialized", {
        sessionName: this.sessionName,
      });
      this.isInitializing = false;
    } catch (error) {
      logError("Failed to initialize whatsapp-web.js provider", error, {
        sessionName: this.sessionName,
      });
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * Set up whatsapp-web.js event handlers
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on("qr", (qr: string) => {
      this.currentQR = qr;
      logInfo("QR code generated", { sessionName: this.sessionName });

      // Display QR in terminal if not headless
      if (!this.headless) {
        qrcode.generate(qr, { small: true });
      }

      this.emit("qr");
    });

    this.client.on("authenticated", () => {
      this.isAuthenticated = true;
      this.currentQR = null;
      this.reconnectAttempts = 0;
      logInfo("WhatsApp authenticated", { sessionName: this.sessionName });
      this.emit("authenticated");
    });

    this.client.on("auth_failure", () => {
      logWarn("WhatsApp authentication failed", {
        sessionName: this.sessionName,
      });
      this.logout().catch((error) => {
        logError("Error during logout on auth failure", error);
      });
    });

    this.client.on("ready", () => {
      logInfo("WhatsApp client ready", { sessionName: this.sessionName });
      this.emit("connected");
    });

    this.client.on("disconnected", (reason: string) => {
      logWarn("WhatsApp disconnected", {
        sessionName: this.sessionName,
        reason,
      });

      this.isAuthenticated = false;
      this.client = null;

      if (reason === "LOGOUT") {
        this.emit("logout");
      } else {
        void this.scheduleReconnect();
      }
    });

    this.client.on("message", async (message: WaMessage) => {
      try {
        if (message.fromMe) return;

        this.emit("message", {
          id: message.id.id || `msg_${Date.now()}`,
          from: message.from,
          text: message.body,
          timestamp: message.timestamp * 1000,
          type: message.hasMedia ? "media" : "text",
        });

        logInfo("Message received", {
          from: message.from,
          type: message.hasMedia ? "media" : "text",
        });
      } catch (error) {
        logError("Error processing incoming message", error);
      }
    });

    this.client.on("error", (error: Error) => {
      logError("WhatsApp client error", error, {
        sessionName: this.sessionName,
      });
      this.emit("error");
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= RECONNECT_DELAYS.length) {
      logError("Max reconnection attempts reached", undefined, {
        sessionName: this.sessionName,
      });
      this.emit("reconnect_failed");
      return;
    }

    const delay = RECONNECT_DELAYS[this.reconnectAttempts];
    this.reconnectAttempts += 1;

    logInfo("Scheduling whatsapp-web.js reconnection", {
      sessionName: this.sessionName,
      attempt: this.reconnectAttempts,
      delayMs: delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.initialize().catch((error) => {
        logError("Reconnection failed", error, {
          sessionName: this.sessionName,
        });
      });
    }, delay);
  }

  /**
   * Send a message
   */
  async sendMessage(to: string, text: string): Promise<string> {
    if (!this.client || !this.isAuthenticated) {
      throw new Error("WhatsApp not connected or authenticated");
    }

    try {
      const chatId = to.includes("@") ? to : `${to}@c.us`;
      const response = await this.client.sendMessage(chatId, text);

      logInfo("Message sent", { to: chatId, messageId: response.id.id });
      return response.id.id || `msg_${Date.now()}`;
    } catch (error) {
      logError("Failed to send message", error, { to });
      throw error;
    }
  }

  /**
   * Get current QR code
   */
  getQRCode(): string | null {
    return this.currentQR;
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    const status: ConnectionStatus = {
      connected: !!this.client && this.isAuthenticated,
      authenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
    };

    if (this.client && this.isAuthenticated) {
      const info = this.client.info?.wid;
      if (info) {
        status.phoneNumber = info.user;
      }
    }

    return status;
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.client) {
        await this.client.logout();
        this.client = null;
      }
      this.isAuthenticated = false;
      this.currentQR = null;
      logInfo("whatsapp-web.js logged out", { sessionName: this.sessionName });
      this.emit("logout");
    } catch (error) {
      logError("Error during logout", error, { sessionName: this.sessionName });
    }
  }

  /**
   * Disconnect provider
   */
  async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.client) {
      try {
        await this.client.destroy();
      } catch (error) {
        logError("Error destroying client", error);
      }
      this.client = null;
    }

    this.isAuthenticated = false;
    logInfo("whatsapp-web.js provider disconnected", {
      sessionName: this.sessionName,
    });
  }

  /**
   * Listen to provider events
   */
  on(event: ProviderEventType, callback: (data?: unknown) => void): this {
    return super.on(event, callback);
  }

  /**
   * Remove event listener
   */
  off(event: ProviderEventType, callback: (data?: unknown) => void): this {
    return super.off(event, callback);
  }

  /**
   * Emit event
   */
  emit(event: ProviderEventType, data?: unknown): boolean {
    return super.emit(event, data);
  }
}
