/**
 * WAHA (WhatsApp HTTP API) Client
 * Communicates with the WAHA service for WhatsApp operations
 */

import axios, { AxiosInstance } from "axios";
import { logInfo, logError } from "../config/logger";

export interface WAHAStatus {
  connected: boolean;
  authenticated: boolean;
  me?: {
    id: string;
    pushName: string;
  };
}

export interface WAHASessionStatus {
  status: "CONNECTED" | "DISCONNECTED" | "STARTING" | "STOPPING" | "FAILED";
  me?: {
    id: string;
    pushName: string;
  };
}

export class WAHAClient {
  private client: AxiosInstance;
  private baseUrl: string;
  private sessionName: string = "whatsapp-bridge";
  private qrCode: string | null = null;
  private apiKey: string | null = null;

  constructor(host: string, port: number, apiKey?: string) {
    this.baseUrl = `http://${host}:${port}`;
    this.apiKey = apiKey || null;

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
    });

    logInfo("WAHA client initialized", {
      baseUrl: this.baseUrl,
    });
  }

  /**
   * Check if WAHA is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.get("/api/health");
      return response.status === 200;
    } catch (error) {
      logError("WAHA health check failed", error);
      return false;
    }
  }

  /**
   * Start a WhatsApp session
   */
  async startSession(): Promise<void> {
    try {
      await this.client.post(`/api/sessions/${this.sessionName}`, {
        sessionName: this.sessionName,
      });
      logInfo("WAHA session started", { sessionName: this.sessionName });
    } catch (error) {
      logError("Failed to start WAHA session", error);
      throw error;
    }
  }

  /**
   * Get session status
   */
  async getSessionStatus(): Promise<WAHASessionStatus> {
    try {
      const response = await this.client.get<WAHASessionStatus>(
        `/api/sessions/${this.sessionName}/status`
      );
      return response.data;
    } catch (error) {
      logError("Failed to get WAHA session status", error);
      return { status: "FAILED" };
    }
  }

  /**
   * Get QR code for authentication
   */
  async getQRCode(): Promise<string | null> {
    try {
      const response = await this.client.get<{ qr: string }>(
        `/api/sessions/${this.sessionName}/qr`
      );
      this.qrCode = response.data.qr;
      return this.qrCode;
    } catch (error) {
      logError("Failed to get WAHA QR code", error);
      return null;
    }
  }

  /**
   * Get current QR code (cached)
   */
  getCachedQRCode(): string | null {
    return this.qrCode;
  }

  /**
   * Send a message via WAHA
   */
  async sendMessage(to: string, text: string): Promise<string> {
    try {
      const response = await this.client.post(
        `/api/sessions/${this.sessionName}/messages`,
        {
          chatId: `${to}@c.us`,
          text: text,
        }
      );
      logInfo("Message sent via WAHA", {
        to,
        messageId: response.data.id,
      });
      return response.data.id || `msg_${Date.now()}`;
    } catch (error) {
      logError("Failed to send message via WAHA", error);
      throw error;
    }
  }

  /**
   * Stop session (logout)
   */
  async stopSession(): Promise<void> {
    try {
      await this.client.delete(`/api/sessions/${this.sessionName}`);
      this.qrCode = null;
      logInfo("WAHA session stopped", { sessionName: this.sessionName });
    } catch (error) {
      logError("Failed to stop WAHA session", error);
      throw error;
    }
  }

  /**
   * Get WAHA status
   */
  async getStatus(): Promise<WAHAStatus> {
    try {
      const sessionStatus = await this.getSessionStatus();
      const isConnected = sessionStatus.status === "CONNECTED";
      const isAuthenticated = isConnected && !!sessionStatus.me;

      return {
        connected: isConnected,
        authenticated: isAuthenticated,
        me: sessionStatus.me,
      };
    } catch (error) {
      logError("Failed to get WAHA status", error);
      return {
        connected: false,
        authenticated: false,
      };
    }
  }
}
