/**
 * WhatsApp Service - Adapter that exposes provider interface
 * Can use any provider implementation (Baileys, WAHA, Official API, etc)
 */

import type { IWhatsAppProvider, ConnectionStatus, ProviderEventType } from "../providers/types";
import { BaileysProvider } from "../providers/baileys-provider";

export class WhatsAppService implements IWhatsAppProvider {
  private provider: IWhatsAppProvider;

  constructor(sessionName = "whatsapp-bridge") {
    // Currently using Baileys provider
    // Can be swapped to WAHA or Official API in the future
    this.provider = new BaileysProvider(sessionName);
  }

  /**
   * Initialize the WhatsApp service
   */
  async initialize(): Promise<void> {
    return this.provider.initialize();
  }

  /**
   * Get current QR code
   */
  getQRCode(): string | null {
    return this.provider.getQRCode();
  }

  /**
   * Get connection status
   */
  getStatus(): ConnectionStatus {
    return this.provider.getStatus();
  }

  /**
   * Send a message
   */
  async sendMessage(to: string, text: string): Promise<string> {
    return this.provider.sendMessage(to, text);
  }

  /**
   * Logout from WhatsApp
   */
  async logout(): Promise<void> {
    return this.provider.logout();
  }

  /**
   * Disconnect the service
   */
  async disconnect(): Promise<void> {
    return this.provider.disconnect();
  }

  /**
   * Listen to events
   */
  on(event: ProviderEventType, callback: (data?: unknown) => void): this {
    this.provider.on(event, callback);
    return this;
  }

  /**
   * Remove event listener
   */
  off(event: ProviderEventType, callback: (data?: unknown) => void): this {
    this.provider.off(event, callback);
    return this;
  }

  /**
   * Emit event (used internally)
   */
  emit(event: ProviderEventType, data?: unknown): boolean {
    return this.provider.emit(event, data);
  }

  /**
   * Get the underlying provider (for advanced usage)
   */
  getProvider(): IWhatsAppProvider {
    return this.provider;
  }
}

// Singleton instance
let serviceInstance: WhatsAppService | null = null;

/**
 * Get or create WhatsApp service instance
 */
export function getWhatsAppService(sessionName = "whatsapp-bridge"): WhatsAppService {
  if (!serviceInstance) {
    serviceInstance = new WhatsAppService(sessionName);
  }
  return serviceInstance;
}
