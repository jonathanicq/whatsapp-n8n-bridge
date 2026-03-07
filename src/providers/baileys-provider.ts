/**
 * Baileys implementation of WhatsApp provider
 */

import { EventEmitter } from "events";
import * as Baileys from "baileys";
import { parseMessage, toWhatsAppMessage } from "../utils/message-parser";
import { loadSession, updateSessionStatus, deleteSession } from "../services/session-manager";
import { logInfo, logError, logWarn } from "../config/logger";
import type { IWhatsAppProvider, ConnectionStatus, ProviderEventType } from "./types";

const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // Progressive backoff

export class BaileysProvider extends EventEmitter implements IWhatsAppProvider {
  private sessionName: string;
  private socket: Baileys.WASocket | null = null;
  private currentQR: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isInitializing = false;

  constructor(sessionName: string) {
    super();
    this.sessionName = sessionName;
  }

  /**
   * Initialize WhatsApp connection
   */
  async initialize(): Promise<void> {
    if (this.isInitializing || this.socket) {
      return;
    }

    this.isInitializing = true;

    try {
      logInfo("Initializing Baileys provider", { sessionName: this.sessionName });

      // Try to load existing session
      const existingSession = await loadSession(this.sessionName);

      // Initialize Baileys socket
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket = Baileys.default({
        auth: {
          creds: existingSession?.authState?.creds || undefined,
          keys: existingSession?.authState?.keys || undefined,
        } as any,
        printQRInTerminal: false,
        browser: Baileys.Browsers.ubuntu("Chrome"),
      });

      // Set up event handlers
      this.setupEventHandlers();

      logInfo("Baileys provider initialized", {
        sessionName: this.sessionName,
      });
      this.isInitializing = false;
    } catch (error) {
      logError("Failed to initialize Baileys provider", error, {
        sessionName: this.sessionName,
      });
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * Set up Baileys event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection update
    this.socket.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.currentQR = qr;
        this.emit("qr");
        logInfo("QR code generated", { sessionName: this.sessionName });
      }

      if (connection === "close") {
        const reason = (lastDisconnect?.error as unknown as Record<string, any>)?.output
          ?.statusCode;
        logWarn("Baileys disconnected", {
          sessionName: this.sessionName,
          reason,
        });

        // Logout if authentication error
        if (reason === 401) {
          await this.logout();
        } else {
          // Try to reconnect
          this.scheduleReconnect();
        }
      }

      if (connection === "open") {
        logInfo("Baileys connected", { sessionName: this.sessionName });
        this.reconnectAttempts = 0;
        this.emit("connected");
      }
    });

    // Authentication update
    this.socket.ev.on("creds.update", async () => {
      // Save credentials to Redis
      const phoneNumber = this.socket?.user?.id?.split(":")?.[0];
      await updateSessionStatus(this.sessionName, true, true, phoneNumber);
    });

    // Message upsert
    this.socket.ev.on("messages.upsert", async (msg) => {
      const { messages } = msg;

      for (const message of messages) {
        // Skip if from me
        if (message.key.fromMe) continue;

        // Parse and emit message
        const parsed = parseMessage(message as unknown as Record<string, unknown>);
        if (parsed) {
          const whatsAppMsg = toWhatsAppMessage(parsed);
          this.emit("message", whatsAppMsg);
          logInfo("Message received", {
            from: whatsAppMsg.sender,
            type: whatsAppMsg.type,
          });
        }
      }
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

    logInfo("Scheduling Baileys reconnection", {
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
    if (!this.socket) {
      throw new Error("WhatsApp not connected");
    }

    try {
      const response = await this.socket.sendMessage(to, { text });
      if (!response || !response.key?.id) {
        throw new Error("Failed to get message ID from response");
      }
      logInfo("Message sent", { to, messageId: response.key.id });
      return response.key.id;
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
    return {
      connected: this.socket?.user !== undefined,
      authenticated: this.socket?.user !== undefined,
      phoneNumber: this.socket?.user?.id?.split(":")?.[0],
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.socket) {
        await this.socket.logout();
        this.socket = null;
      }
      await deleteSession(this.sessionName);
      logInfo("Baileys logged out", { sessionName: this.sessionName });
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

    if (this.socket) {
      try {
        this.socket.end(new Error("Provider shutdown"));
      } catch (error) {
        logError("Error closing socket", error);
      }
      this.socket = null;
    }

    logInfo("Baileys provider disconnected", { sessionName: this.sessionName });
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
