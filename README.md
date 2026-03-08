# WhatsApp-n8n Bridge Service

A lightweight Docker-containerized service that bridges WhatsApp (via whatsapp-web.js) with n8n workflows. Send and receive WhatsApp messages through REST APIs and a custom n8n node.

**Uses:** Direct whatsapp-web.js integration for simplicity and reliability

## Overview

This service enables:
- **Sending WhatsApp messages** from n8n workflows via REST API
- **Receiving WhatsApp messages** that trigger n8n workflows via webhooks
- **Managing contacts** and conversation history
- **Reliable delivery** with Redis-based message queuing
- **Persistent storage** of messages and metadata in MySQL
- **Custom n8n node** for native workflow integration

## Quick Start

### Prerequisites

**Docker Containers (Required):**
- This service runs in Docker and requires:
  - **Node.js 20+** base image
  - **Chromium/Puppeteer** (for whatsapp-web.js browser automation)
  - **Docker Compose v2** for orchestration

**Services:**
- **MySQL 8.0+** - Message storage and execution logs
- **Redis 7.0+** - Session management and message queue
- **n8n** - Workflow automation (for integration)

**Local Development:**
- Node.js 20+ (to run outside Docker)
- Docker & Docker Compose (to run the full stack)

### Setup

#### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/jonathanicq/whatsapp-n8n-bridge.git
   cd whatsapp-n8n-bridge
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings (API_KEY, DB credentials, etc.)
   ```

3. **Start all services**
   ```bash
   docker compose up -d
   ```

   This starts:
   - ✅ WhatsApp Bridge (port 4000) - Node.js with whatsapp-web.js
   - ✅ MySQL (port 3306) - Message storage
   - ✅ Redis (port 6379) - Session & queue

4. **Authenticate WhatsApp**
   ```bash
   # Get QR code
   curl http://localhost:4000/api/whatsapp/qr

   # Scan with your WhatsApp app
   # Service saves session automatically in Redis
   ```

5. **Verify service is running**
   ```bash
   curl http://localhost:4000/health
   ```

#### Option 2: Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set DB_HOST=localhost, REDIS_HOST=localhost

# Start development server
npm run dev

# Service runs on http://localhost:4000
```

### Docker Requirements

The Docker image includes:
- **Node.js 20** runtime
- **Chromium/Puppeteer** for whatsapp-web.js browser automation
- **Chrome sandbox disabled** for container compatibility
- All dependencies pre-installed

**Minimum Docker specs:**
- RAM: 512MB (1GB recommended)
- CPU: 1 core (2+ cores recommended)
- Disk: 500MB free space

## Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production setup
- **[API Reference](docs/API.md)** - REST endpoints
- **[n8n Integration](docs/N8N_INTEGRATION.md)** - Using custom node
- **[Architecture](docs/ARCHITECTURE.md)** - Design decisions

## Development

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Run tests
npm test

# Format code
npm run format

# Lint
npm run lint

# Build TypeScript
npm run build
```

## Project Structure

```
whatsapp-n8n-bridge/
├── src/
│   ├── app.ts              # Express app entry point
│   ├── config/             # Configuration modules
│   ├── services/           # Business logic
│   ├── routes/             # API endpoints
│   ├── models/             # Data models
│   ├── controllers/        # Route controllers
│   └── utils/              # Utilities
├── tests/                  # Test files
├── docs/                   # Documentation
├── phases/                 # Phase-specific guides
├── Dockerfile              # Docker image
├── compose.yaml            # Docker compose setup
├── PROJECT_CONFIG.md       # Tech stack decisions
├── MASTER_PLAN.md          # Project phases
├── CHANGELOG.md            # Version history
└── .env.example            # Environment template
```

## API Endpoints

### Messages
- `POST /api/messages/send` - Send WhatsApp message
- `GET /api/messages/history` - Get message history
- `GET /api/messages/:id` - Get message details

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Add contact

### Status
- `GET /health` - Health check
- `GET /api/status` - Service status
- `GET /api/qr` - Get WhatsApp QR code

### Webhooks
- `POST /webhooks/whatsapp` - Incoming message webhook (for n8n)

## Security

- ✅ All secrets in environment variables
- ✅ WhatsApp session encrypted in Redis
- ✅ Webhook signature verification (HMAC-SHA256)
- ✅ API key authentication
- ✅ Input validation and sanitization
- ✅ No sensitive data in logs

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit with meaningful message: `git commit -m "Add your feature"`
4. Push to remote: `git push origin feature/your-feature`
5. Open pull request

## Troubleshooting

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for common issues.

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, contact the development team.

---

**Status:** Active Development
**Latest Version:** 1.0.0 (whatsapp-web.js migration)
**Last Updated:** 2026-03-08

## n8n Integration

To use this service with n8n:

1. **Install the n8n node package:**
   ```bash
   npm install n8n-nodes-whatsapp-bridge-xyz@latest
   ```

2. **Configure credentials in n8n:**
   - Node: WhatsApp Bridge API
   - Base URL: `http://localhost:4000`
   - API Key: (leave empty - not required)

3. **Use in workflows:**
   - **WhatsApp Bridge** node: Send messages
   - **WhatsApp Bridge Trigger** node: Receive webhooks

See [n8n-nodes-whatsapp-bridge-xyz](https://www.npmjs.com/package/n8n-nodes-whatsapp-bridge-xyz) on npm
