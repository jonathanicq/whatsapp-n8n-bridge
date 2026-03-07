-- Phase 5: Webhook & n8n Integration Tables
-- Stores webhook configurations and delivery tracking

USE whatsapp_bridge;

-- Webhook configurations for inbound message delivery
CREATE TABLE IF NOT EXISTS webhook_configs (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID v4 unique webhook ID',
  name VARCHAR(100) NOT NULL COMMENT 'User-friendly webhook name',
  url VARCHAR(2048) NOT NULL COMMENT 'HTTPS endpoint to POST messages to',
  secret VARCHAR(255) NOT NULL COMMENT 'HMAC-SHA256 secret for signing payloads',
  active TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Whether this webhook is enabled',
  filters JSON NULL COMMENT 'Optional message filters: {"messageTypes":["text"],"fromMe":false,"groupOnly":false}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'When webhook was registered',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'Last update time',

  KEY idx_active (active) COMMENT 'For filtering active webhooks',
  CONSTRAINT uc_webhook_url UNIQUE (url) COMMENT 'Prevent duplicate webhook URLs'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registered webhook endpoints for message delivery';

-- Webhook delivery tracking (one row per webhook × incoming message)
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID v4 unique delivery ID',
  webhook_id VARCHAR(36) NOT NULL COMMENT 'FK to webhook_configs',
  message_id VARCHAR(255) NOT NULL COMMENT 'Incoming message ID from Baileys',
  status ENUM('pending', 'delivering', 'success', 'failed') NOT NULL DEFAULT 'pending' COMMENT 'Current delivery status',
  attempt_count INT NOT NULL DEFAULT 0 COMMENT 'Number of delivery attempts made',
  last_error TEXT NULL COMMENT 'Most recent error message',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'When delivery was created',
  completed_at TIMESTAMP NULL COMMENT 'When delivery completed (success or final failure)',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL COMMENT 'Last status update',

  FOREIGN KEY (webhook_id) REFERENCES webhook_configs(id) ON DELETE CASCADE,
  KEY idx_status (status) COMMENT 'For querying by delivery status',
  KEY idx_webhook_id (webhook_id) COMMENT 'For finding deliveries by webhook',
  KEY idx_message_id (message_id) COMMENT 'For finding all deliveries of a message',
  KEY idx_created_at (created_at) COMMENT 'For time-based queries'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Webhook delivery attempts and status tracking';

-- Webhook delivery attempts audit log (immutable, one row per attempt)
CREATE TABLE IF NOT EXISTS webhook_delivery_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  delivery_id VARCHAR(36) NOT NULL COMMENT 'FK to webhook_deliveries',
  attempt_number INT NOT NULL COMMENT 'Attempt sequence (1, 2, 3, ...)',
  status ENUM('success', 'failed', 'retrying') NOT NULL DEFAULT 'failed' COMMENT 'How this attempt ended',
  http_status_code INT NULL COMMENT 'HTTP response code (e.g., 200, 500, null if connection failed)',
  error_code VARCHAR(50) NULL COMMENT 'Error classification (TIMEOUT, REFUSED, HTTP_ERROR, etc.)',
  error_message TEXT NULL COMMENT 'Detailed error description',
  backoff_delay_ms INT NULL COMMENT 'Milliseconds to wait before next retry (for retrying status)',
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'When this attempt was made',

  FOREIGN KEY (delivery_id) REFERENCES webhook_deliveries(id) ON DELETE CASCADE,
  KEY idx_delivery_id (delivery_id) COMMENT 'For finding attempts by delivery',
  KEY idx_attempted_at (attempted_at) COMMENT 'For time-series analysis'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Immutable audit trail of webhook delivery attempts';

SELECT 'Webhook tables created for Phase 5' as status;
