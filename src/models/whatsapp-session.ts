/**
 * WhatsApp session types and interfaces
 */

export interface WhatsAppSession {
  sessionName: string;
  phoneNumber?: string;
  isConnected: boolean;
  isAuthenticated: boolean;
  createdAt: number;
  lastConnected?: number;
  authState?: Record<string, unknown>;
}

export interface QRCodeData {
  qr: string;
  generatedAt: number;
  expiresAt: number;
  isExpired: boolean;
}

export interface ConnectionStatus {
  connected: boolean;
  authenticated: boolean;
  phoneNumber?: string;
  lastError?: string;
  reconnectAttempts: number;
  lastReconnectTime?: number;
}
