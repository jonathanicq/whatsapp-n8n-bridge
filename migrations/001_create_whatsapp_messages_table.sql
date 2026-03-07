-- WhatsApp Message Queue Tables
-- Phase 4: Message Queuing and Retry System

-- Main messages table for tracking all sent/queued messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID v4',
  to_phone_number VARCHAR(15) NOT NULL COMMENT 'E.164 format recipient phone',
  text TEXT NOT NULL COMMENT 'Message content',
  status ENUM('pending', 'sent', 'failed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT 'Current message status',
  message_id VARCHAR(100) COMMENT 'Provider message ID (Baileys)',
  provider_error TEXT COMMENT 'Last provider error message',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'Queue creation time',
  sent_at TIMESTAMP NULL COMMENT 'Actual send time',
  completed_at TIMESTAMP NULL COMMENT 'Final resolution time',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,

  KEY idx_status (status) COMMENT 'For filtering by status',
  KEY idx_created_at (created_at) COMMENT 'For time-based queries',
  KEY idx_sent_at (sent_at) COMMENT 'For analytics',
  KEY idx_phone (to_phone_number) COMMENT 'For phone-based queries'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Queue of WhatsApp messages to send';

-- Retry attempts tracking table for debugging and analytics
CREATE TABLE IF NOT EXISTS whatsapp_message_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL COMMENT 'FK to whatsapp_messages',
  attempt_number INT NOT NULL COMMENT 'Attempt sequence',
  status ENUM('pending', 'success', 'retrying', 'failed') NOT NULL DEFAULT 'pending' COMMENT 'Attempt outcome',
  error_code VARCHAR(50) COMMENT 'Error classification',
  error_message TEXT COMMENT 'Full error details',
  backoff_delay_ms INT COMMENT 'Next retry delay in milliseconds',
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT 'When this attempt occurred',

  FOREIGN KEY (message_id) REFERENCES whatsapp_messages(id) ON DELETE CASCADE,
  KEY idx_message_id (message_id) COMMENT 'For finding attempts by message',
  KEY idx_attempted_at (attempted_at) COMMENT 'For time-based analysis'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail of all send attempts';
