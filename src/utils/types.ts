/**
 * Shared TypeScript types and interfaces
 */

export interface AppConfig {
  port: number;
  nodeEnv: string;
  appEnv: string;
  logLevel: string;
  logFormat: string;
  logToFile: boolean;
  logDir: string;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    poolSize: number;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
  };
  wa: {
    sessionName: string;
    phoneNumber?: string;
  };
  webhook: {
    enableWebhooks: boolean;
    n8nWebhookUrl: string;
    n8nApiUrl: string;
    n8nApiKey: string;
    defaultSecret: string;
  };
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  services: {
    mysql: boolean;
    redis: boolean;
  };
}

export interface MetricsData {
  uptime: number;
  timestamp: string;
  memory: {
    heapUsed: number;
    heapTotal: number;
  };
  version: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface SendMessageRequest {
  to: string;
  text: string;
}

export interface SendMessageResponse {
  messageId: string;
  timestamp: string;
  to: string;
}
