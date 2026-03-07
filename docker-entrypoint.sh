#!/bin/bash
set -e

# Docker entrypoint script for branch selection based on APP_ENV

# Get the APP_ENV variable (default to development)
APP_ENV=${APP_ENV:-development}

echo "=== WhatsApp-n8n Bridge Entrypoint ==="
echo "APP_ENV: $APP_ENV"
echo "Starting application..."

# For now, just start the application directly
# Branch selection would happen in the Dockerfile or docker-compose for CI/CD
node dist/server.js
