# WhatsApp-n8n Bridge Service

A Docker-containerized service that bridges WhatsApp (via Baileys) with n8n workflows. Send and receive WhatsApp messages (text, audio, images) through REST APIs and a custom n8n node.

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
- Docker & docker compose (v2)
- Node.js 20+ (for local development)
- MySQL 8.0+
- Redis 7.0+
- n8n instance (for webhook integration)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jonathanicq/whatsapp-n8n-bridge.git
   cd whatsapp-n8n-bridge
   ```

2. **Copy environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start with Docker**
   ```bash
   docker compose up -d
   ```

4. **Authenticate WhatsApp**
   - Get QR code: `curl http://localhost:3000/api/qr`
   - Scan with WhatsApp app
   - Service will automatically save session

5. **Verify health**
   ```bash
   curl http://localhost:3000/health
   ```

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

Private repository

## Support

For issues, questions, or contributions, contact the development team.

---

**Status:** In Development
**Current Phase:** 0 - Planning & Setup
**Last Updated:** 2026-03-07
