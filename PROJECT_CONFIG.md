# Project Configuration

**Project Name:** WhatsApp-n8n Bridge Service
**Created:** 2026-03-07
**Last Updated:** 2026-03-07
**Status:** Planning

---

## Overview

**Project Description:**
A Docker-containerized service that bridges WhatsApp (via Baileys library) with n8n workflows. Enables sending/receiving WhatsApp messages (text, audio, images) programmatically through REST APIs and a custom n8n node. Provides message queuing, persistent storage, and full duplex communication for automation workflows.

**Project Goals:**
- Enable n8n workflows to send WhatsApp messages via REST API
- Handle incoming WhatsApp messages and trigger n8n workflows via webhooks
- Support multimedia messages (text, audio, images, documents)
- Provide reliable message delivery with Redis queuing
- Store message history and conversation metadata in MySQL
- Deploy as a reusable service on any Docker-compatible environment
- Provide custom n8n node for native workflow integration

---

## Technology Stack

### Backend
- **Language:** Node.js (TypeScript)
- **Framework:** Express.js 4.18+
- **Runtime:** Node 20+ (LTS)
- **WhatsApp Library:** Baileys (whatsapp-web.js reverse engineering)

### Frontend (if applicable)
- **Not applicable** - Service-only (API-driven)

### Database
- **Primary Database:** MySQL 8.0+
  - Store messages, contacts, conversation metadata, session state
- **Cache/Queue Datastore:** Redis 7.0+
  - Message queue for reliable delivery
  - Session caching for WhatsApp connection state
  - Rate limiting counters

### Infrastructure & Deployment
- **Container Platform:** Docker (docker compose v2)
- **CI/CD:** GitHub Actions (optional, for automation)
- **Hosting:** Flexible (any Docker-compatible environment)
  - Can run on internal network (192.168.0.116)
  - Can run on cloud providers (AWS, GCP, Azure, etc.)
- **Reverse Proxy:** nginx (for HTTPS/SSL if needed)

### Third-Party Services & APIs
- **Baileys/WhatsApp Web** - WhatsApp connection (reverse-engineered)
- **n8n** - Workflow automation integration (HTTP + custom node)
- **MySQL** - Message and metadata persistence
- **Redis** - Message queuing and caching

---

## Code Style & Standards

### Naming Conventions
- **Files:** kebab-case (e.g., `whatsapp-service.ts`, `message-queue.ts`)
- **Folders:** kebab-case (e.g., `src/services/`, `src/models/`)
- **Variables:** camelCase (e.g., `messageQueue`, `sessionId`)
- **Functions:** camelCase (e.g., `sendMessage()`, `parseWebhookPayload()`)
- **Classes:** PascalCase (e.g., `WhatsAppService`, `MessageQueue`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `MAX_MESSAGE_SIZE`, `WEBHOOK_TIMEOUT`)

### Formatting
- **Formatter:** Prettier 3.x
- **Configuration:** `.prettierrc.json` in project root
- **Max Line Length:** 100 characters
- **Indentation:** 2 spaces
- **Semicolons:** Required
- **Quotes:** Double quotes for strings

### Linting
- **Linter:** ESLint 8.x
- **Configuration:** `.eslintrc.json`
- **Pre-commit Hooks:** Yes (Husky + lint-staged)

---

## Testing Strategy

### Test Types
- [x] Unit Tests - Core service logic, helpers, utilities
- [x] Integration Tests - API endpoints, database interactions, Redis connections
- [x] End-to-End Tests - Full workflows (send/receive message flow)
- [ ] Contract Tests - Optional (n8n node integration)
- [ ] Performance Tests - Optional (future: load testing)

### Testing Framework
- **Framework:** Jest 29.x (with @types/jest)
- **Test Runner:** jest
- **Mocking:** jest.mock() for Baileys, Redis, MySQL
- **Coverage Tool:** Istanbul (built-in with Jest)
- **Coverage Threshold:** 80% minimum

### Test Commands
```bash
# Run all tests
npm test

# Run unit tests only
npm test -- --testPathPattern="\.unit\.test\.ts$"

# Run integration tests only
npm test -- --testPathPattern="\.integration\.test\.ts$"

# Generate coverage report
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Documentation Requirements

### Required Documentation
- [x] README.md with setup instructions
- [x] API documentation (Swagger/OpenAPI)
- [x] Architecture Decision Records (ADRs)
- [x] CHANGELOG.md
- [x] Inline code comments (where necessary)
- [x] Docker setup documentation
- [x] n8n integration guide

### API Documentation
- **Tool:** Swagger/OpenAPI 3.0
- **Location:** `/docs` (Swagger UI) + `openapi.yaml` in project root
- **Generation:** swagger-jsdoc (from JSDoc comments in routes)

---

## Logging & Monitoring

### Logging
- **Framework:** Winston 3.x
- **Format:** JSON (structured logging)
- **Log Levels:** DEBUG, INFO, WARN, ERROR
- **Destination:** Console (development), File + Centralized (production)
- **Sensitive Data Policy:** Never log passwords, API keys, phone numbers, message content without explicit flag
- **Centralized Logging:** All logs also sent to MySQL `execution_logs` table (per CLAUDE.md Section 8)

### Monitoring (if applicable)
- **APM Tool:** Optional (can integrate with DataDog, New Relic)
- **Error Tracking:** Optional (can integrate with Sentry)
- **Health Check:** Endpoint `/health` returns service status
- **Metrics:** Basic metrics (messages sent/received, queue depth) available at `/metrics`

---

## Security Standards

### Authentication & Authorization
- **Method:** API Key + Bearer Token (JWT optional)
- **WhatsApp Session:** Stored securely in Redis (encrypted)
- **n8n Integration:** API key in Authorization header
- **Internal APIs:** Bearer token (generate via admin endpoint)

### Security Checklist
- [x] All secrets in environment variables (never hardcoded)
- [x] .env.example with placeholder values
- [x] .env in .gitignore
- [x] Input validation on all external inputs (message sanitization)
- [x] HTTPS enforced for webhooks (reverse proxy recommended)
- [x] CORS properly configured (whitelist n8n instance)
- [x] SQL injection prevention (parameterized queries via ORM)
- [x] Message content sanitization (prevent XSS in webhook payloads)
- [x] Rate limiting implemented (per sender, per API key)
- [x] Webhook signature verification (SHA256 HMAC)
- [x] WhatsApp session encryption (in Redis)

---

## Dependency Management

### Package Manager
- **Tool:** npm 10.x
- **Lockfile:** package-lock.json (committed to git)

### Dependency Policy
- Commit lockfiles to version control (mandatory)
- Regular dependency updates (monthly)
- Security audit: `npm audit` before each release
- Auto-update vulnerable packages: `npm audit fix`

---

## Git Workflow

### Branch Strategy
- **Main Branch:** `master` (production-ready code)
- **Development Branch:** `dev` (active development)
- **Feature Branches:** `feature/descriptive-name`
- **Fix Branches:** `fix/descriptive-name`
- **Hotfix Branches:** `hotfix/descriptive-name`

### Environment-Based Branch Selection (Docker)
**STANDARD:** All Docker deployments must automatically pull from the correct branch based on `APP_ENV`:

| APP_ENV | Branch | Purpose |
|---------|--------|---------|
| `production` | `master` | Stable, production-ready releases |
| `development` | `dev` | Active development, testing |

**Implementation:** Add this logic to `docker-entrypoint.sh`:
```bash
if [ "$APP_ENV" = "production" ]; then
    BRANCH="master"
elif [ "$APP_ENV" = "development" ]; then
    BRANCH="dev"
else
    BRANCH="dev"  # Default to dev for safety
fi
git checkout "$BRANCH" && git pull origin "$BRANCH"
```

### Commit Standards
- Meaningful commit messages
- Commit on: new module, new feature, new version, bug fix, doc update
- Reference issue numbers when applicable

### Repository
- **Repository Type:** Private
- **Host:** GitHub
- **URL:** https://github.com/jonathanicq/whatsapp-n8n-bridge (to be created)

---

## Environment Variables

### Environment Mode (Required)
```bash
# APP_ENV determines which git branch Docker pulls on startup
# Options: production, development
# - production: pulls from 'master' branch
# - development: pulls from 'dev' branch
APP_ENV=development
NODE_ENV=development
```

### Required Variables
```bash
# Environment & Node
APP_ENV=development
NODE_ENV=development
PORT=3000

# Database (MySQL)
DB_HOST=mysql.thecoordinates.xyz
DB_USER=makeuser
DB_PASSWORD=your_password_here
DB_NAME=makebdd

# Cache/Queue (Redis)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# WhatsApp Session
WA_SESSION_NAME=whatsapp-bridge

# n8n Integration
N8N_WEBHOOK_URL=https://n8n.thecoordinates.xyz/webhook/whatsapp
N8N_API_URL=http://n8n:5678/api

# API Security
API_KEY=your_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## Build & Deployment

### Build Commands
```bash
# Install dependencies
npm install

# Build TypeScript (transpile to JavaScript)
npm run build

# Start development server (with hot reload)
npm run dev

# Start production server
npm start

# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test
```

### Deployment Strategy
- **Environments:** Development (dev branch) | Production (master branch)
- **Deployment Method:** Docker (docker compose v2)
- **Deployment Command:** `docker compose up -d`
- **Branch Selection:** Automatic via APP_ENV in docker-entrypoint.sh

---

## Performance Considerations
- **Database indexing:** Add indexes on `phone_number`, `message_id`, `timestamp` in message table
- **Caching strategy:** Cache WhatsApp session in Redis (encrypted); TTL 24 hours
- **Message queuing:** Redis queue for reliable delivery (FIFO); retry logic with exponential backoff
- **Rate limiting:** Per API key (100 req/min), per sender (50 messages/min)
- **Connection pooling:** MySQL pool size 10; Redis single connection

---

## Docker & Deployment Notes
- **Base Image:** node:20-alpine (lightweight, minimal attack surface)
- **Multi-stage build:** Separate build stage from runtime
- **Network:** Compose service must connect to MySQL and Redis
- **Volumes:** Mount /app/data for persistence; /app/logs for logging
- **Health Check:** Implement /health endpoint for Docker health checks
- **Logging:** Send logs to MySQL execution_logs table (mandatory per CLAUDE.md Section 8)

---

## Additional Notes
- **Baileys Library:** WhatsApp Web reverse engineering - requires periodic updates if Meta changes web client
- **Session Handling:** WhatsApp session stored encrypted in Redis; requires periodic re-authentication
- **Message Limits:** WhatsApp rate limits ~100 messages/min per account; handle gracefully
- **Production Ready:** Before production, implement proper error handling, monitoring, and backup strategy

---

## Decision Lock
**These decisions are locked for this project.** Any changes require explicit approval and must be documented with rationale in an ADR.

**Locked on:** 2026-03-07
**Approved by:** User (Project Creator)
