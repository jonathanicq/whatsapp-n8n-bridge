# lightWaha - Setup & Installation Guide

**Complete Docker & npm Configuration Reference**

---

## 📋 Quick Start (Docker - Recommended)

```bash
# Clone the repository
git clone https://github.com/jonathanicq/whatsapp-n8n-bridge.git
cd whatsapp-n8n-bridge

# Copy environment template
cp .env.example .env

# Build and start with Docker
docker compose build
docker compose up -d

# Access the server
curl http://localhost:4000/health
```

**Server will be available at:** `http://localhost:4000`

---

## 🐳 Docker Setup

### Docker Compose Configuration

**File:** `docker-compose.yml`

```yaml
version: "3.8"

services:
  lightwaha:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      NODE_ENV: production
      PORT: 4000
      LOG_LEVEL: info
      WA_HEADLESS: "true"
    volumes:
      - ./sessions:/app/sessions          # WhatsApp session persistence
      - ./logs:/app/logs                   # Application logs
    restart: unless-stopped
    container_name: lightwaha-app
    networks:
      - lightwaha-network

networks:
  lightwaha-network:
    driver: bridge
```

### Dockerfile

**File:** `Dockerfile`

```dockerfile
FROM node:20-slim

# Install Chromium and dependencies (required for WhatsApp Web automation)
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libharfbuzz0b \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxinerama1 \
    libxrandr2 \
    libxrender1 \
    libxshmfence1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY swagger.yaml ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src

# Create required directories
RUN mkdir -p sessions logs

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 4000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000
ENV WA_HEADLESS=true
ENV LOG_LEVEL=info

# Start application
CMD ["node", "dist/server.js"]
```

### Docker Commands Reference

```bash
# Build image
docker compose build

# Build without cache (force rebuild)
docker compose build --no-cache

# Start services (background)
docker compose up -d

# Stop services
docker compose down

# View logs (real-time)
docker compose logs -f lightwaha

# View last 50 lines of logs
docker compose logs --tail=50

# Restart container
docker compose restart

# Remove everything (including volumes)
docker compose down -v

# Check container status
docker compose ps

# Execute command in container
docker exec lightwaha-app npm run build
```

### Environment Variables (Docker)

Set in `docker-compose.yml`:

```
NODE_ENV=production        # Always 'production' in Docker
PORT=4000                  # Express server port
LOG_LEVEL=info            # Logging level: debug, info, warn, error
WA_HEADLESS=true          # Run Chrome headless (required)
```

---

## 📦 NPM Setup (Local Development)

### Node Version

**Required:** Node.js 20.0.0 or higher
**Recommended:** Node.js 20.10.5 or newer

```bash
# Check Node version
node --version

# Check npm version
npm --version
```

### NPM Scripts

**File:** `package.json`

```json
{
  "scripts": {
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "clean": "rm -rf dist",
    "test": "jest",
    "test:unit": "jest --testPathPattern='\\.unit\\.test\\.ts$'",
    "test:integration": "jest --testPathPattern='\\.integration\\.test\\.ts$'",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "type-check": "tsc --noEmit"
  }
}
```

### Common NPM Commands

```bash
# Install dependencies
npm install

# Run development server (with auto-reload via ts-node)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Clean build artifacts
npm run clean

# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Generate test coverage report
npm run test:coverage

# Lint code
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Type check (without emitting files)
npm run type-check
```

### Dependencies

**Core:**
- `express` ^4.18.2 - Web framework
- `whatsapp-web.js` ^1.26.1 - WhatsApp Web automation
- `dotenv` ^16.3.1 - Environment variables

**Browser Automation:**
- Puppeteer (included with whatsapp-web.js)
- Chromium (installed in Docker)

**Utilities:**
- `qrcode-terminal` ^0.12.0 - Terminal QR display
- `js-yaml` ^4.1.0 - YAML parsing for Swagger
- `uuid` ^9.0.1 - ID generation
- `axios` ^1.6.2 - HTTP client

**Development:**
- `typescript` ^5.3.3 - TypeScript compiler
- `ts-node` ^10.9.2 - Run TS directly
- `eslint` ^8.56.0 - Code linting
- `prettier` ^3.1.1 - Code formatting
- `jest` ^29.7.0 - Testing framework

---

## 🚀 Local Development Setup

### Prerequisites

1. **Node.js 20+** installed
2. **npm 10+** or **yarn**
3. **Git** for version control

### Installation Steps

```bash
# 1. Clone repository
git clone https://github.com/jonathanicq/whatsapp-n8n-bridge.git
cd whatsapp-n8n-bridge

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Build TypeScript
npm run build

# 5. Start development server
npm run dev

# Server will start on http://localhost:4000
```

### Environment File (.env)

```
# Server Configuration
PORT=4000
NODE_ENV=development
LOG_LEVEL=debug

# WhatsApp Configuration
WA_SESSION_NAME=lightwaha
WA_HEADLESS=false

# Optional: n8n Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/whatsapp
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode (re-run on file changes)
npm test -- --watch
```

---

## 🔧 Local vs Docker Comparison

| Feature | Local | Docker |
|---------|-------|--------|
| **Setup Time** | 10-15 min | 5 min (after first build) |
| **Dependencies** | Install locally | Auto in container |
| **Chromium** | Auto download | Pre-installed |
| **Database** | Manual setup | Can add services |
| **Port Binding** | localhost:4000 | Configurable |
| **Isolation** | System-wide | Container isolated |
| **Production** | Not recommended | ✅ Recommended |
| **Development** | ✅ Better for debugging | Slower iteration |

---

## 📊 Directory Structure

```
whatsapp-n8n-bridge/
├── src/
│   ├── server.ts              # Main server file
│   ├── messageQueue.ts        # Message storage (Phase 2)
│   └── ...
├── dist/                      # Compiled JavaScript (generated by npm run build)
├── sessions/                  # WhatsApp session data (created by Docker)
├── logs/                      # Application logs (created by Docker)
├── Dockerfile                 # Docker image definition
├── docker-compose.yml         # Docker Compose configuration
├── package.json               # NPM dependencies and scripts
├── package-lock.json          # NPM dependency lock file
├── tsconfig.json              # TypeScript configuration
├── swagger.yaml               # API documentation
├── .env.example               # Environment template
├── .dockerignore               # Files to exclude from Docker build
├── SETUP.md                   # This file
├── CHANGELOG.md               # Version history
└── docs/
    ├── IMPROVEMENT-MESSAGE-WEBHOOK.md  # Phase 3/4 roadmap
    └── ...
```

---

## 🐛 Troubleshooting

### Docker Issues

**Issue:** "Port 4000 already in use"
```bash
# Change port in docker-compose.yml:
ports:
  - "3000:4000"  # Map 3000 to container's 4000

# Or kill existing process:
lsof -i :4000
kill -9 <PID>
```

**Issue:** "Chromium failed to launch"
```bash
# Rebuild without cache:
docker compose build --no-cache
docker compose up -d

# Check logs:
docker compose logs lightwaha
```

**Issue:** "Session files permission denied"
```bash
# Docker creates files as root, fix permissions:
sudo chown -R $USER:$USER sessions/
```

### NPM Issues

**Issue:** "npm: command not found"
```bash
# Install Node.js from https://nodejs.org/
# Or use nvm (Node Version Manager):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Issue:** "Module not found" errors
```bash
# Clear cache and reinstall:
rm -rf node_modules package-lock.json
npm install
```

**Issue:** "TypeScript compilation errors"
```bash
# Type check without emitting:
npm run type-check

# Fix issues in src/
npm run lint:fix
npm run format
```

---

## 📡 API Endpoints Reference

**Base URL:** `http://localhost:4000`

### Health & Status
```
GET /health               - Server health check
GET /status              - WhatsApp connection status
GET /api-docs            - Interactive Swagger UI
```

### Authentication
```
GET /qr                  - Get QR code (JSON)
GET /qr.html             - Get QR code (HTML page)
```

### Messaging
```
POST /send               - Send WhatsApp message
GET /messages/new        - Poll for new messages
GET /messages            - Get message history
GET /messages/stats      - Queue statistics
```

### Session
```
POST /logout             - Logout from WhatsApp
POST /destroy            - Destroy client
```

---

## 🔗 Integration with n8n

If using with n8n workflow automation:

```
n8n Workflow
    ↓
Webhook → POST http://lightwaha:4000/send
    ↓
WhatsApp Message Sent
```

**Configuration:**
1. Deploy lightWaha via Docker Compose
2. In n8n, use HTTP request node pointing to `http://lightwaha:4000/send`
3. Pass JSON: `{"to": "PHONE_NUMBER", "text": "MESSAGE"}`

---

## 📚 Additional Resources

- **Swagger UI:** `http://localhost:4000/api-docs`
- **GitHub:** https://github.com/jonathanicq/whatsapp-n8n-bridge
- **WhatsApp Web.js Docs:** https://docs.wwebjs.dev/
- **Docker Docs:** https://docs.docker.com/
- **n8n Docs:** https://docs.n8n.io/

---

## ✅ Verification Checklist

After setup, verify everything works:

```bash
# 1. Server is running
curl http://localhost:4000/health
# Expected: {"status":"ok"}

# 2. WhatsApp can authenticate
curl http://localhost:4000/status
# Expected: {"connected": true, "authenticated": true, "me": {...}}

# 3. Can access API docs
curl http://localhost:4000/swagger.json | jq .info
# Expected: API info from Swagger spec

# 4. Can send messages
curl -X POST http://localhost:4000/send \
  -H "Content-Type: application/json" \
  -d '{"to":"PHONE_NUMBER","text":"Test"}'
# Expected: {"success":true,...}
```

---

**Last Updated:** 2026-03-08
**Version:** 2.0.0 (Phase 1 + Phase 2)
**Maintained by:** Jonathan (jonathanicq)
