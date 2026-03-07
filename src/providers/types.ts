/**
 * WhatsApp provider interface - abstraction for different implementations
 */

export interface ConnectionStatus extends Record<string, unknown> {
  connected: boolean;
  authenticated: boolean;
  phoneNumber?: string;
  reconnectAttempts: number;
}

export type ProviderEventType =
  | "qr"
  | "connected"
  | "authenticated"
  | "message"
  | "logout"
  | "reconnect_failed"
  | "error";

export interface IWhatsAppProvider {
  /**
   * Initialize the provider connection
   */
  initialize(): Promise<void>;

  /**
   * Get current QR code if available
   */
  getQRCode(): string | null;

  /**
   * Get connection and authentication status
   */
  getStatus(): ConnectionStatus;

  /**
   * Send a message
   */
  sendMessage(to: string, text: string): Promise<string>;

  /**
   * Logout and clear session
   */
  logout(): Promise<void>;

  /**
   * Disconnect from provider
   */
  disconnect(): Promise<void>;

  /**
   * Listen to provider events
   */
  on(event: ProviderEventType, callback: (data?: unknown) => void): this;

  /**
   * Remove event listener
   */
  off(event: ProviderEventType, callback: (data?: unknown) => void): this;

  /**
   * Emit event (used internally)
   */
  emit(event: ProviderEventType, data?: unknown): boolean;
}
