-- Initial database setup for WhatsApp-n8n Bridge
-- This file is automatically executed when MySQL container starts

-- Ensure we're using the correct database
USE whatsapp_bridge;

-- Create tables for Phase 3+ (schema design)
-- For now, just verify the database exists
SELECT 'Database initialized for WhatsApp-n8n Bridge' as status;
