#!/bin/bash

# lightWaha - Deployment Script
# Usage: ./deploy.sh [target-host] [branch]

set -e

TARGET_HOST="${1:-192.168.0.116}"
BRANCH="${2:-feature/phase-1-express-whatsapp}"
PORT=4000

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           lightWaha - Docker Deployment Script              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Target Host: $TARGET_HOST"
echo "🔀 Branch: $BRANCH"
echo "🔌 Port: $PORT"
echo ""

# Confirm
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "📋 Deployment steps:"
echo "1. Clone/update repository"
echo "2. Checkout branch"
echo "3. Copy .env.example to .env"
echo "4. Build Docker image"
echo "5. Start container"
echo "6. Verify deployment"
echo ""

# Deploy
ssh sysadmin@$TARGET_HOST << 'DEPLOY_SCRIPT'
set -e

echo "[1/6] Cloning repository..."
if [ -d lightWaha ]; then
    cd lightWaha
    git fetch origin
    git checkout feature/phase-1-express-whatsapp
    git pull origin feature/phase-1-express-whatsapp
else
    git clone https://github.com/yourusername/lightWaha.git
    cd lightWaha
    git checkout feature/phase-1-express-whatsapp
fi

echo "[2/6] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env from template"
else
    echo "✓ .env already exists"
fi

echo "[3/6] Building Docker image..."
docker compose build

echo "[4/6] Starting container..."
docker compose down 2>/dev/null || true
docker compose up -d

echo "[5/6] Waiting for startup..."
sleep 5

echo "[6/6] Verifying deployment..."
CONTAINER_STATUS=$(docker compose ps --format "{{.State}}")
if [[ $CONTAINER_STATUS == "Up"* ]]; then
    echo "✅ Container is running!"
    echo ""
    echo "📊 Container Status:"
    docker compose ps
    echo ""
    echo "🔗 Access points:"
    echo "  - Health: curl http://localhost:4000/health"
    echo "  - Status: curl http://localhost:4000/status"
    echo "  - QR Code Web: http://localhost:4000/qr.html"
    echo ""
    echo "📋 View logs:"
    echo "  - Real-time: docker compose logs -f"
    echo "  - Last 50 lines: docker compose logs --tail=50"
else
    echo "❌ Container failed to start"
    echo "Logs:"
    docker compose logs
    exit 1
fi

DEPLOY_SCRIPT

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Scan QR code from http://$TARGET_HOST:4000/qr.html"
echo "2. WhatsApp should authenticate"
echo "3. Run: curl http://$TARGET_HOST:4000/status"
echo ""
echo "📚 Full documentation: DEPLOY.md"
