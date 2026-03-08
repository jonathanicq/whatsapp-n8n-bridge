# Project Configuration

**Project Name:** lightWaha - Lightweight WhatsApp HTTP Bridge
**Created:** 2026-03-08
**Last Updated:** 2026-03-08
**Status:** Planning

---

## Overview

**Project Description:**
LightWaha is a lightweight, simplified WhatsApp integration service that uses the whatsapp-web.js library directly instead of complex REST API wrappers. It provides a clean REST API for sending/receiving WhatsApp messages, storing state in MySQL/Redis, and enables easy integration with n8n, webhooks, and external services.

**Project Goals:**
- Eliminate WAHA complexity and REST API limitations
- Provide direct, simple REST API for WhatsApp operations
- Enable real-time event handling and webhooks
- Store all message state in MySQL/Redis for persistence
- Support easy n8n workflow integration
- Reduce Docker container count (app + mysql + redis only)

---

## Technology Stack

### Backend
- **Language:** Node.js
- **Framework:** Express.js
- **Version:** Node.js 20+, Express 4.x

### WhatsApp Library
- **Library:** whatsapp-web.js
- **QR Code Display:** qrcode-terminal (console) + HTTP endpoint option
- **Browser Engine:** Chromium (bundled with puppeteer)

### Database
- **Primary Database:** MySQL 8.0
- **Cache/Queue:** Redis 7.0-alpine
- **Purpose:** Message queue, session state, execution logs

### Infrastructure & Deployment
- **Container Platform:** Docker + Docker Compose
- **Deployment Method:** Docker Compose on 192.168.0.116
- **CI/CD:** GitHub Actions (planned)

### Third-Party Services & APIs
- n8n (webhook triggers and integrations)
- MySQL centralized execution logging (makebdd.execution_logs)

---

## Code Style & Standards

### Naming Conventions
- **Files:** kebab-case (service-handler.ts)
- **Variables:** camelCase
- **Functions:** camelCase
- **Classes:** PascalCase
- **Constants:** SCREAMING_SNAKE_CASE

### Formatting
- **Formatter:** Prettier
- **Max Line Length:** 100 characters
- **Indentation:** 2 spaces
- **Quotes:** Double quotes for strings

### Linting
- **Linter:** ESLint
- **Pre-commit Hooks:** Yes (husky + lint-staged)

---

## Testing Strategy

### Test Types
- [x] Unit Tests
- [x] Integration Tests
- [ ] End-to-End Tests
- [x] API Tests

### Testing Framework
- **Framework:** Jest
- **Coverage Tool:** Istanbul
- **Coverage Threshold:** 80%

### Test Commands
```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Generate coverage report
npm run test:coverage
```

---

## Documentation Requirements

### Required Documentation
- [x] README.md with setup instructions
- [x] API documentation (Swagger/OpenAPI)
- [x] Architecture Decision Records (ADRs)
- [x] CHANGELOG.md
- [x] Inline code comments (where necessary)

### API Documentation
- **Tool:** Swagger/OpenAPI
- **Location:** `/api-docs`

---

## Logging & Monitoring

### Logging
- **Framework:** Winston
- **Format:** JSON
- **Log Levels:** DEBUG, INFO, WARN, ERROR
- **Storage:** File + console
- **Sensitive Data Policy:** Never log passwords, tokens, API keys, or PII

### Centralized Execution Logging
- **Database:** MySQL (makebdd.execution_logs)
- **Connection:** mysql.thecoordinates.xyz
- **Credentials:** Stored in environment variables

---

## Security Standards

### Authentication & Authorization
- **API Key:** Header-based (X-API-Key)
- **Internal Only:** No OAuth/JWT needed (internal service)
- **Validation:** All inputs validated and sanitized

### Security Checklist
- [x] All secrets in environment variables
- [x] .env.example with placeholder values
- [x] .env in .gitignore
- [x] Input validation on all external inputs
- [x] No hardcoded credentials
- [x] CORS properly configured
- [x] Rate limiting on endpoints
- [x] Error messages don't expose sensitive info

---

## Dependency Management

### Package Manager
- **Tool:** npm
- **Lockfile:** package-lock.json

### Dependency Policy
- Commit lockfiles to version control
- Security audits: `npm audit`
- Regular updates: monthly review

---

## Git Workflow

### Branch Strategy
- **Main Branch:** `master` (production-ready code)
- **Development Branch:** `dev` (active development)
- **Feature Branches:** `feature/descriptive-name`
- **Fix Branches:** `fix/descriptive-name`

### Environment-Based Branch Selection (Docker)
All Docker deployments must use `APP_ENV` to control branch:
- `APP_ENV=production` → pulls from `master` branch
- `APP_ENV=development` → pulls from `dev` branch

### Commit Standards
- Meaningful commit messages
- Reference issue numbers when applicable

### Repository
- **Type:** Private GitHub
- **URL:** https://github.com/jonathanicq/lightWaha (to be created)

---

## Environment Variables

### Required Variables
```bash
# Environment Mode (controls Docker branch selection)
APP_ENV=development

# Port Configuration
PORT=3000
WAHA_PORT=3000

# Database
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=whatsapp_bridge

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Centralized Execution Logging
EXEC_LOG_HOST=mysql.thecoordinates.xyz
EXEC_LOG_USER=makeuser
EXEC_LOG_PASSWORD=your_password_here
EXEC_LOG_DATABASE=makebdd

# WhatsApp Session
WA_SESSION_NAME=lightwaha

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

# Build TypeScript
npm run build

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test
```

### Deployment Strategy
- **Environments:** Development (192.168.0.116:3000)
- **Method:** Docker Compose
- **Command:** `docker compose up -d`

---

## Architecture

### Services
1. **lightWaha App** (Node.js Express)
   - REST API endpoints
   - WhatsApp event handling
   - Message queue processor
   - Webhook triggers

2. **MySQL** (Message storage + execution logs)
   - Message queue table
   - Message attempts table
   - Execution logs (centralized)

3. **Redis** (Session state + queue)
   - Session data
   - Rate limiting
   - Message queue state

### Data Flow
```
User Request (REST API)
    ↓
lightWaha App
    ├─→ Validate & enqueue message
    ├─→ Store in MySQL
    ├─→ Add to Redis queue
    └─→ whatsapp-web.js sends via WhatsApp
    ↓
Success/Error
    ├─→ Update MySQL status
    ├─→ Log to execution_logs
    └─→ Trigger webhook (if configured)
```

---

## Performance Considerations
- Message queue with exponential backoff retries
- Redis-based rate limiting (1000 req/hour per API key)
- Connection pooling for MySQL
- Async/await for non-blocking operations
- Message batching for bulk operations

---

## Advantages Over WAHA
1. **Simpler:** No WAHA REST API limitations
2. **Direct:** Full control over whatsapp-web.js
3. **Integrated:** MySQL/Redis writes are direct, not API calls
4. **Fewer Containers:** 3 instead of 4
5. **Better Webhooks:** Easy to trigger n8n workflows
6. **Lower Latency:** No HTTP roundtrips for internal operations
7. **Flexible:** Custom logic without WAHA constraints

---

## Additional Notes
- QR code displays in terminal on first run (can optionally serve via HTTP endpoint)
- Session persistence: Stored in Redis + MySQL
- Fully compatible with existing n8n workflows
- Can handle failover/restart scenarios
- Built-in execution logging for audit trail

---

## Decision Lock
**These decisions are locked for this project.** Any changes require explicit approval and must be documented with rationale in an ADR.

**Locked on:** 2026-03-08
**Approved by:** User
