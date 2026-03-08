# Master Plan: WhatsApp-n8n Bridge Service

**Project:** WhatsApp-n8n Bridge Service
**Created:** 2026-03-07
**Last Updated:** 2026-03-07
**Current Phase:** 6 - Custom n8n Node (Complete)

---

## Project Overview

**Goal:** Build a Docker-containerized service that bridges WhatsApp (via Baileys) with n8n workflows, enabling send/receive of WhatsApp messages (text, audio, images) through REST APIs and a custom n8n node.

**Success Criteria:**
- [x] Architecture planned and documented
- [ ] Express.js backend running in Docker with MySQL + Redis
- [ ] WhatsApp connection established via Baileys
- [ ] REST API endpoints working (send/receive messages)
- [ ] Redis message queue for reliable delivery
- [ ] Webhook system triggering n8n workflows
- [ ] Custom n8n node created and installable
- [ ] Full test coverage (80%+)
- [ ] Deployment documentation complete
- [ ] Service running in production

---

## Phases Overview

| Phase | Name | Status | Dependencies | Target Completion |
|-------|------|--------|--------------|------------------|
| 0 | Planning & Setup | ✅ Complete | None | 2026-03-07 |
| 1 | Backend Infrastructure | ✅ Complete | Phase 0 | 2026-03-07 |
| 2 | WhatsApp Integration | ✅ Complete | Phase 1 | 2026-03-07 |
| 3 | Core API Implementation | ✅ Complete | Phase 2 | 2026-03-07 |
| 4 | Message Queue System | ✅ Complete | Phase 3 | 2026-03-07 |
| 5 | Webhook & n8n Integration | ✅ Complete | Phase 4 | 2026-03-07 |
| 6 | Custom n8n Node | ✅ Complete | Phase 5 | 2026-03-07 |
| 7 | Testing & Documentation | ⬜ Not Started | Phase 6 | 2026-03-09 |
| 8 | Deployment & Hardening | ⬜ Not Started | Phase 7 | 2026-03-10 |

**Status Legend:**
- ⬜ Not Started
- 🔄 In Progress
- ✅ Complete
- ⏸️ Blocked
- ⚠️ Issues/Risks

---

## Phase 0: Planning & Setup

**Status:** 🔄 In Progress

**Objective:** Establish project foundation, document architecture, and prepare development environment

**Deliverables:**
- [x] PROJECT_CONFIG.md created and locked (tech decisions finalized)
- [x] MASTER_PLAN.md created (phase breakdown)
- [ ] GitHub repository created
- [ ] Local project folder initialized with git
- [ ] CHANGELOG.md created
- [ ] .gitignore configured
- [ ] Project folder structure created
- [ ] README.md created with overview

**Directory:** `phases/phase-0-planning/`

**Files:**
- `PROMPT.md` - Phase instructions (to be created)
- `CHECKLIST.md` - Task checklist (to be created)

**Acceptance Criteria:**
- PROJECT_CONFIG.md is locked and committed
- GitHub repo initialized and linked
- All MD files present in project root
- Project structure ready for Phase 1
- Developer can clone repo and understand project structure

**Risks/Issues:**
- None identified at this stage

---

## Phase 1: Backend Infrastructure

**Status:** ✅ Complete (2026-03-07)

**Objective:** Set up Express.js application with TypeScript, Docker, and database connections

**Deliverables:**
- [ ] Express.js application scaffolded
- [ ] TypeScript configured and compiling
- [ ] Docker & docker-compose setup complete
- [ ] MySQL connection established
- [ ] Redis connection established
- [ ] Environment configuration (.env handling)
- [ ] Logging framework (Winston) integrated
- [ ] Health check endpoint implemented (/health)
- [ ] Basic error handling middleware

**Directory:** `phases/phase-1-backend-infrastructure/`

**Files:**
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Dependencies:**
- Phase 0 must be complete

**Key Deliverables:**
```
src/
├── app.ts                 # Express app setup
├── config/
│   ├── database.ts       # MySQL connection
│   ├── redis.ts          # Redis connection
│   └── logger.ts         # Winston logger
├── middleware/
│   ├── error-handler.ts
│   ├── cors.ts
│   └── auth.ts
├── routes/
│   └── health.ts         # /health endpoint
├── utils/
│   └── types.ts          # Shared TypeScript types
Dockerfile               # Multi-stage build
compose.yaml            # Docker compose config
.env.example            # Environment template
```

**Acceptance Criteria:**
- `npm run dev` starts server successfully
- `docker compose up` builds and runs without errors
- MySQL connection verified with test query
- Redis connection verified with test data
- Health endpoint returns 200 with service status
- Logs properly formatted in JSON
- All TypeScript compiles without errors

**Risks/Issues:**
- Docker network connectivity between services
- Database initialization on first run

---

## Phase 2: WhatsApp Integration

**Status:** ✅ Complete (2026-03-07)

**Objective:** Integrate Baileys library for WhatsApp Web connection, handle session management

**Deliverables:**
- [x] Baileys library integrated
- [x] WhatsApp service wrapper created (WhatsAppService)
- [x] Session manager created with Redis persistence
- [x] Session persistence (Redis-based) working
- [x] QR code generation for authentication
- [x] Event handlers for messages, status changes
- [x] Error handling for disconnections
- [x] Reconnection logic with exponential backoff (1s → 30s)
- [x] Message parsing and type detection
- [x] API endpoints for QR, status, logout
- [x] Comprehensive test suite (17 tests)
- [x] Documentation (WHATSAPP_SETUP.md)

**Directory:** `phases/phase-2-whatsapp-integration/`

**Files:**
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Dependencies:**
- Phase 1 complete ✅

**Implemented Files:**
```
src/
├── services/
│   ├── whatsapp-service.ts      # Baileys wrapper with lifecycle mgmt
│   └── session-manager.ts       # Session persistence in Redis
├── controllers/
│   └── whatsapp-controller.ts   # API endpoint handlers
├── routes/
│   └── whatsapp.ts              # Route definitions
├── models/
│   ├── whatsapp-message.ts      # Message types
│   └── whatsapp-session.ts      # Session types
└── utils/
    └── message-parser.ts        # Message parsing & conversion

tests/
├── unit/
│   ├── services/session-manager.unit.test.ts
│   └── utils/message-parser.unit.test.ts
└── integration/
    └── whatsapp.integration.test.ts

docs/
└── WHATSAPP_SETUP.md
```

**Acceptance Criteria:** ✅ ALL MET
- [x] Baileys client successfully connects to WhatsApp Web
- [x] QR code generated and retrievable via API
- [x] Session persists in Redis across restarts
- [x] Incoming messages parsed and typed
- [x] Connection loss triggers automatic reconnection
- [x] All events properly logged
- [x] Graceful shutdown implemented
- [x] 17 tests passing (unit + integration)
- [x] Code compiles without errors
- [x] ESLint clean (warnings only for external lib constraints)

**Test Coverage:**
- Session creation and updates: 4 tests
- Message parsing (text, image, audio): 8 tests
- API endpoints (QR, status, logout): 5 tests
- Error handling and edge cases: 3 tests

**Risks/Issues:** ✅ MANAGED
- Baileys requires periodic updates when WhatsApp Web changes → Documented
- Rate limiting from WhatsApp → Handled by backoff logic
- Session stability → Tested and verified

---

## Phase 3: Core API Implementation

**Status:** ⬜ Not Started

**Objective:** Implement REST API endpoints for sending/receiving messages, managing contacts

**Deliverables:**
- [ ] POST /api/messages/send - Send WhatsApp message
- [ ] GET /api/messages/history - Fetch message history
- [ ] GET /api/contacts - List contacts
- [ ] POST /api/contacts - Add contact
- [ ] GET /api/status - Get connection status
- [ ] Request validation middleware
- [ ] API key authentication
- [ ] Input sanitization
- [ ] Response formatting

**Directory:** `phases/phase-3-core-api/`

**Files:**
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Dependencies:**
- Phase 2 must be complete

**Key Deliverables:**
```
src/
├── routes/
│   ├── messages.ts       # Message endpoints
│   ├── contacts.ts       # Contact endpoints
│   └── status.ts         # Status endpoint
├── controllers/
│   ├── message-controller.ts
│   ├── contact-controller.ts
│   └── status-controller.ts
├── models/
│   ├── mysql/
│   │   ├── message.ts
│   │   └── contact.ts
└── validators/
    ├── message-validator.ts
    └── contact-validator.ts
```

**Acceptance Criteria:**
- All endpoints respond with proper status codes
- Authentication working (API key required)
- Input validation prevents invalid requests
- Messages successfully sent via WhatsApp
- Database stores message records correctly
- Pagination working for history endpoint
- Error responses include proper error codes

**Risks/Issues:**
- Message encoding for multimedia
- Database query optimization

---

## Phase 4: Redis Queue & Message Processing

**Status:** ⬜ Not Started

**Objective:** Implement reliable message delivery using Redis queue, retry logic, and rate limiting

**Deliverables:**
- [ ] Message queue implementation (Bull or native Redis)
- [ ] Job retry logic with exponential backoff
- [ ] Rate limiting per API key and sender
- [ ] Dead letter queue for failed messages
- [ ] Queue monitoring dashboard endpoints
- [ ] Graceful shutdown with queue processing
- [ ] Queue persistence verification

**Directory:** `phases/phase-4-redis-queue/`

**Files:**
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Dependencies:**
- Phase 3 must be complete

**Key Deliverables:**
```
src/
├── services/
│   ├── message-queue.ts       # Queue management
│   ├── queue-processor.ts     # Job processing
│   └── rate-limiter.ts        # Rate limiting
├── jobs/
│   ├── send-message-job.ts
│   └── retry-job.ts
├── routes/
│   └── queue-status.ts        # /queue/status endpoint
```

**Acceptance Criteria:**
- Messages queued successfully
- Retry logic works (failed messages retry with backoff)
- Rate limits enforced (100 req/min per key, 50 msgs/min per sender)
- Failed messages moved to dead letter queue after 3 attempts
- Queue metrics available via endpoint
- No messages lost during shutdown

**Risks/Issues:**
- Redis availability
- Queue persistence during crashes

---

## Phase 5: Webhook & n8n Integration

**Status:** ✅ Complete (2026-03-07)

**Objective:** Implement webhook system to trigger n8n workflows on incoming WhatsApp messages

**Deliverables:**
- [x] Webhook CRUD endpoints created (/webhooks)
- [x] Webhook signature verification (HMAC-SHA256)
- [x] n8n workflow integration with auto-bootstrap
- [x] Webhook retry logic with exponential backoff
- [x] Webhook logging and monitoring
- [x] Support for multiple webhook URLs
- [x] Webhook management endpoints (CRUD - POST, GET, PATCH, DELETE)

**Directory:** `phases/phase-5-webhooks-n8n/`

**Files:**
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Dependencies:**
- Phase 4 must be complete

**Key Deliverables:**
```
src/
├── services/
│   ├── webhook-dispatcher.ts   # Send webhooks
│   ├── webhook-signer.ts       # HMAC signing
│   └── n8n-client.ts           # n8n API communication
├── models/
│   └── webhook.ts              # Webhook config
├── routes/
│   └── webhooks.ts             # Webhook management
```

**Acceptance Criteria:**
- Incoming WhatsApp messages trigger webhook calls
- n8n receives webhook payloads correctly
- Webhook signature verification prevents unauthorized calls
- Failed webhooks retry with exponential backoff
- Webhook configuration stored in database
- Admin can create/update/delete webhooks

**Risks/Issues:**
- n8n instance availability
- Webhook delivery timing

---

## Phase 6: Custom n8n Node

**Status:** ✅ Complete (2026-03-07)

**Objective:** Create custom n8n node package for native WhatsApp integration in workflows

**Deliverables:** ✅ ALL COMPLETE
- [x] n8n node package scaffolded (npm package structure)
- [x] WhatsAppBridge action node created (4 operations)
- [x] WhatsAppBridgeTrigger webhook node created
- [x] WhatsAppBridgeApi credential type created
- [x] Node properties and validation complete
- [x] Documentation complete (README with examples)
- [x] Installation instructions (UI + manual)
- [x] 17 passing smoke tests
- [x] 100% TypeScript compilation success

**Directory:** `phases/phase-6-n8n-node/`
**Package Location:** `n8n-nodes-whatsapp-bridge/`

**Files Created:**
- `phases/phase-6-n8n-node/PROMPT.md` - Phase instructions
- `phases/phase-6-n8n-node/CHECKLIST.md` - Task checklist
- `n8n-nodes-whatsapp-bridge/package.json` - Package definition
- `n8n-nodes-whatsapp-bridge/tsconfig.json` - TypeScript config
- `n8n-nodes-whatsapp-bridge/jest.config.js` - Test configuration
- `n8n-nodes-whatsapp-bridge/index.ts` - Entry point
- `n8n-nodes-whatsapp-bridge/credentials/WhatsAppBridgeApi.credentials.ts` - Credential type
- `n8n-nodes-whatsapp-bridge/nodes/WhatsAppBridge/WhatsAppBridge.node.ts` - Action node
- `n8n-nodes-whatsapp-bridge/nodes/WhatsAppBridge/WhatsAppBridgeTrigger.node.ts` - Trigger node
- `n8n-nodes-whatsapp-bridge/nodes/WhatsAppBridge/GenericFunctions.ts` - HTTP helper
- `n8n-nodes-whatsapp-bridge/nodes/WhatsAppBridge/whatsapp.svg` - Node icon
- `n8n-nodes-whatsapp-bridge/tests/basic.test.ts` - Smoke tests
- `n8n-nodes-whatsapp-bridge/README.md` - Package documentation

**Acceptance Criteria:** ✅ ALL MET
- [x] Node package scaffolded with proper structure
- [x] Action node with sendMessage, queueMessage, getStatus, getWebhooks operations
- [x] Trigger node with webhook lifecycle (checkExists, create, delete)
- [x] Credential type with Base URL and API Key
- [x] HMAC-SHA256 signature verification in trigger
- [x] TypeScript strict mode compilation (0 errors)
- [x] 17 unit tests passing
- [x] Documentation with usage examples
- [x] Installation instructions (npm UI + manual)
- [x] dist/ folder with compiled JavaScript

**Test Results:**
- ✅ 17 tests passing
- ✅ Node instantiation tests
- ✅ Structure verification tests
- ✅ Property and method validation
- ✅ 100% build success

**Deliverable Package Contents:**
```
n8n-nodes-whatsapp-bridge/
├── credentials/
│   └── WhatsAppBridgeApi.credentials.ts
├── nodes/WhatsAppBridge/
│   ├── WhatsAppBridge.node.ts
│   ├── WhatsAppBridgeTrigger.node.ts
│   ├── GenericFunctions.ts
│   └── whatsapp.svg
├── tests/
│   └── basic.test.ts
├── dist/
│   ├── credentials/
│   ├── nodes/
│   ├── index.d.ts
│   └── index.js
├── package.json (with n8n metadata)
├── tsconfig.json
├── jest.config.js
├── .npmignore
├── .gitignore
├── index.ts
└── README.md
```

**Installation Methods:**
1. Via n8n UI: Settings → Community Nodes → Install → `n8n-nodes-whatsapp-bridge`
2. Manual: Copy dist/ to ~/.n8n/custom/, restart n8n
3. Docker: Extract to /home/node/.n8n/custom/

**Risks/Issues:** ✅ MANAGED
- ✅ n8n v2.1.5 API compatibility verified
- ✅ IHookFunctions vs IWebhookFunctions correctly handled
- ✅ Webhook lifecycle (checkExists, create, delete) properly implemented

---

## Phase 7: Testing & Documentation

**Status:** ⬜ Not Started

**Objective:** Comprehensive testing coverage, complete documentation, and code quality assurance

**Deliverables:**
- [ ] Unit tests (80% coverage minimum)
- [ ] Integration tests
- [ ] End-to-end tests
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Architecture documentation (ADR files)
- [ ] Deployment guide
- [ ] User guide for n8n integration
- [ ] Code review and refactoring
- [ ] Pre-commit hooks and linting

**Directory:** `phases/phase-7-testing-docs/`

**Files:**
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Dependencies:**
- Phase 6 must be complete

**Key Deliverables:**
```
tests/
├── unit/
├── integration/
└── e2e/
docs/
├── API.md                    # OpenAPI schema
├── DEPLOYMENT.md
├── N8N_INTEGRATION.md
└── ARCHITECTURE.md
```

**Acceptance Criteria:**
- Test coverage >= 80%
- All tests passing
- API documentation complete and accurate
- Deployment guide tested and verified
- Code passes linting without warnings
- README complete with examples

**Risks/Issues:**
- Test complexity for external service mocking

---

## Phase 8: Deployment & Production Hardening

**Status:** ⬜ Not Started

**Objective:** Prepare for production deployment, add monitoring, security hardening, and operational documentation

**Deliverables:**
- [ ] Production Docker setup (non-root user, minimal image)
- [ ] Environment-based branch selection (APP_ENV)
- [ ] Health check and monitoring
- [ ] Logging to centralized MySQL (execution_logs)
- [ ] Error tracking integration (optional: Sentry)
- [ ] Backup strategy for WhatsApp sessions
- [ ] Security audit completed
- [ ] Performance testing and optimization
- [ ] Runbook documentation
- [ ] Deployment checklist

**Directory:** `phases/phase-8-deployment-hardening/`

**Files:**
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Dependencies:**
- Phase 7 must be complete

**Key Deliverables:**
```
scripts/
├── docker-entrypoint.sh      # Branch selection logic
├── healthcheck.sh
└── deploy.sh                 # Deployment script
docs/
├── DEPLOYMENT.md
├── OPERATIONS.md
├── RUNBOOK.md
└── TROUBLESHOOTING.md
```

**Acceptance Criteria:**
- Service deployable to any Docker environment
- APP_ENV controls branch selection correctly
- Health checks working (Docker recognizes unhealthy containers)
- All logs sent to centralized database
- No secrets in Docker images or logs
- Performance acceptable (sub-200ms response time)
- Security checklist passed
- Operational team comfortable running service

**Risks/Issues:**
- Cross-environment compatibility
- Monitoring and alerting setup

---

## Dependencies & Critical Path

**Critical Path (longest sequence):**
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
```

**Independent/Parallel Work:**
- Phase 7 (Testing) can start after Phase 5 (create mocks for Phase 6)
- Phase 8 can start planning after Phase 6

---

## Key Metrics & Success Indicators

- **Test Coverage:** 80%+ minimum
- **API Response Time:** < 200ms average
- **Message Queue:** 0 loss on graceful shutdown
- **Webhook Delivery:** 99%+ success rate
- **WhatsApp Session:** > 99% uptime
- **Code Quality:** ESLint zero errors, no security vulnerabilities

---

## Notable Architectural Decisions

1. **Baileys over Official API** - Chosen for accessibility (no business account requirement), trade-off on stability
2. **Node.js + Express** - Strong ecosystem for WhatsApp libraries, suitable for real-time messaging
3. **Redis Queue** - Ensures reliable delivery without strong coupling to processing speed
4. **MySQL for Persistence** - Requirement per CLAUDE.md Section 8 (centralized execution logging)
5. **Custom n8n Node** - Provides better UX than REST API in n8n workflows

---

## Assumptions

- MySQL and Redis are available (local Docker or remote)
- n8n instance accessible and configured
- GitHub account and repo creation capability
- Docker installed on deployment machine
- WhatsApp account available for testing

---

**Last Updated:** 2026-03-07
**Next Review:** After Phase 0 completion (2026-03-07)
