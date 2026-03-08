# Master Plan: lightWaha

**Project:** lightWaha - Lightweight WhatsApp HTTP Bridge
**Created:** 2026-03-08
**Last Updated:** 2026-03-08
**Current Phase:** Phase 0 (Planning & Setup)

---

## Project Overview

**Goal:** Build a simplified, lightweight WhatsApp integration service using direct whatsapp-web.js integration instead of WAHA wrapper. Provide clean REST API, direct MySQL/Redis storage, and easy n8n integration.

**Success Criteria:**
- [x] PROJECT_CONFIG.md locked and approved
- [ ] Project repository created on GitHub
- [ ] Local development environment works
- [ ] QR code authentication works
- [ ] REST API endpoints functional
- [ ] Message sending/receiving implemented
- [ ] MySQL/Redis state persistence working
- [ ] Execution logging to centralized database
- [ ] Docker Compose deployment works
- [ ] n8n integration tested
- [ ] Production deployment ready

---

## Phases Overview

| Phase | Name | Status | Dependencies | Estimated Completion |
|-------|------|--------|--------------|---------------------|
| 0 | Planning & Setup | 🔄 In Progress | None | 2026-03-08 |
| 1 | Express Backend & WhatsApp Integration | ⬜ Not Started | Phase 0 | 2026-03-09 |
| 2 | Database & Queueing System | ⬜ Not Started | Phase 1 | 2026-03-10 |
| 3 | REST API Endpoints | ⬜ Not Started | Phase 1, 2 | 2026-03-11 |
| 4 | Testing & Deployment | ⬜ Not Started | Phase 1, 2, 3 | 2026-03-12 |
| 5 | n8n Integration & Webhooks | ⬜ Not Started | Phase 3, 4 | 2026-03-13 |
| 6 | Production Deployment | ⬜ Not Started | Phase 4, 5 | 2026-03-14 |

**Status Legend:**
- ⬜ Not Started
- 🔄 In Progress
- ✅ Complete
- ⏸️ Blocked
- ⚠️ Issues/Risks

---

## Phase 0: Planning & Setup

**Status:** 🔄 In Progress

**Objective:** Establish project foundation, create GitHub repository, and set up development environment

**Deliverables:**
- [x] PROJECT_CONFIG.md created and locked
- [x] MASTER_PLAN.md created
- [ ] GitHub repository created (lightWaha)
- [ ] Local folder structure set up at /opt/aiDeveloper/projects/lightWaha
- [ ] .gitignore, package.json, tsconfig.json created
- [ ] Development environment documented
- [ ] CI/CD pipeline planned

**Directory:** `./` (root)

**Files Created:**
- `PROJECT_CONFIG.md` ✅
- `MASTER_PLAN.md` ✅ (this file)
- `CHANGELOG.md` (todo)

**Acceptance Criteria:**
- GitHub repo created and accessible
- Local git initialized with proper branches (master, dev)
- All team members can clone and set up locally
- Project structure is standard and documented

**Timeline:**
- GitHub setup: 15 minutes
- Initial commit: 15 minutes
- Total: ~30 minutes

---

## Phase 1: Express Backend & WhatsApp Integration

**Status:** ⬜ Not Started

**Objective:** Build Express server with whatsapp-web.js integration, QR code authentication, and basic message handling

**Deliverables:**
- [ ] Express server setup (port 3000)
- [ ] WhatsApp Web.js client initialization
- [ ] QR code generation (terminal + HTTP endpoint)
- [ ] Session management (authentication)
- [ ] Event listeners (messages, status changes)
- [ ] Error handling and logging

**Directory:** `phases/phase-1-express-whatsapp/`

**Key Files:**
- `src/server.ts` - Express server entry point
- `src/services/whatsapp-service.ts` - WhatsApp Web.js wrapper
- `src/utils/qr-handler.ts` - QR code display logic
- `src/config/logger.ts` - Logging configuration
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Technical Stack:**
- Express.js for REST server
- whatsapp-web.js library
- qrcode-terminal for QR code display
- Winston for logging
- TypeScript for type safety

**Key Features:**
1. WhatsApp Web.js client that handles:
   - QR code authentication
   - Message receiving
   - Status change events
   - Connection management

2. QR Code Display:
   - Terminal output on first run
   - Optional HTTP endpoint `/auth/qr` to view via browser
   - Refresh mechanism for expired QR codes

3. Event Handling:
   - `message` event - capture incoming messages
   - `ready` event - session authenticated
   - `disconnected` event - handle disconnection
   - `auth_failure` event - handle auth errors

**Acceptance Criteria:**
- Express server starts without errors
- WhatsApp Web.js client initializes
- QR code displays in terminal
- User can scan QR code and authenticate
- Session persists across restarts
- All events are logged properly
- Error messages are clear and actionable

**Dependencies:**
- Phase 0 must be complete

**Risks/Issues:**
- whatsapp-web.js browser automation can be flaky (need retry logic)
- QR code expiry requires refresh handling
- Chromium startup time (~3-5 seconds)

---

## Phase 2: Database & Queueing System

**Status:** ⬜ Not Started

**Objective:** Set up MySQL for message storage and Redis for message queue/session state

**Deliverables:**
- [ ] MySQL schema with message tables
- [ ] Redis client integration
- [ ] Message queue implementation
- [ ] Exponential backoff retry logic
- [ ] Session persistence in Redis
- [ ] Connection pooling

**Directory:** `phases/phase-2-database-queue/`

**Key Files:**
- `src/db/connection.ts` - MySQL pool
- `src/db/schema.sql` - Database schema
- `src/services/redis-service.ts` - Redis client
- `src/services/queue-service.ts` - Message queue
- `PROMPT.md` - Phase instructions
- `CHECKLIST.md` - Task checklist

**Database Schema:**

### whatsapp_messages Table
```sql
CREATE TABLE whatsapp_messages (
  id VARCHAR(36) PRIMARY KEY,
  to_number VARCHAR(20) NOT NULL,
  text TEXT NOT NULL,
  status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### whatsapp_message_attempts Table
```sql
CREATE TABLE whatsapp_message_attempts (
  id VARCHAR(36) PRIMARY KEY,
  message_id VARCHAR(36) NOT NULL,
  attempt_number INT DEFAULT 1,
  error_message TEXT,
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES whatsapp_messages(id)
);
```

**Queue Features:**
- Exponential backoff: 1s, 2s, 5s, 10s, 30s
- Redis sorted sets for atomic operations
- Background worker with polling
- Graceful shutdown

**Acceptance Criteria:**
- MySQL tables created successfully
- Can insert/update messages
- Redis queue adds/removes messages
- Retry logic works with proper delays
- Session data persists in Redis
- Connection pooling active

**Dependencies:**
- Phase 1 must be complete

---

## Phase 3: REST API Endpoints

**Status:** ⬜ Not Started

**Objective:** Build complete REST API for WhatsApp operations

**Deliverables:**
- [ ] Send message endpoint (`POST /api/whatsapp/send`)
- [ ] Get status endpoint (`GET /api/whatsapp/status`)
- [ ] Get QR code endpoint (`GET /api/auth/qr`)
- [ ] Logout endpoint (`POST /api/whatsapp/logout`)
- [ ] Message history endpoint (`GET /api/messages`)
- [ ] Queue status endpoint (`GET /api/queue/status`)
- [ ] Input validation on all endpoints
- [ ] Error handling with proper status codes

**Directory:** `phases/phase-3-rest-api/`

**API Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/whatsapp/send` | Send message |
| GET | `/api/whatsapp/status` | Get connection status |
| GET | `/api/auth/qr` | Get current QR code |
| POST | `/api/whatsapp/logout` | Logout and disconnect |
| GET | `/api/messages?limit=50` | Get message history |
| GET | `/api/queue/status/:msgId` | Get message queue status |
| GET | `/health` | Health check |

**Request/Response Examples:**

### Send Message
```bash
POST /api/whatsapp/send
Content-Type: application/json
X-API-Key: your-api-key

{
  "to": "+351910270614",
  "text": "Hello from API"
}

Response (200):
{
  "success": true,
  "messageId": "msg-uuid-here",
  "status": "queued",
  "timestamp": "2026-03-08T17:20:00Z"
}
```

**Acceptance Criteria:**
- All endpoints return proper status codes
- Input validation works correctly
- Error messages are descriptive
- API key validation works
- Rate limiting prevents abuse
- Swagger docs generated

**Dependencies:**
- Phase 1 and 2 must be complete

---

## Phase 4: Testing & Deployment

**Status:** ⬜ Not Started

**Objective:** Write tests and package for Docker deployment

**Deliverables:**
- [ ] Unit tests for all services
- [ ] Integration tests for API endpoints
- [ ] Dockerfile created
- [ ] Docker Compose file for local development
- [ ] Compose file for production
- [ ] Health checks configured
- [ ] README with setup instructions

**Directory:** `phases/phase-4-testing-deployment/`

**Key Files:**
- `Dockerfile` - Production Docker image
- `docker-compose.yml` - Development/local setup
- `tests/` - Test files
- `README.md` - Setup instructions

**Docker Services:**
1. `lightwaha-app` - Node.js application (port 3000)
2. `lightwaha-mysql` - MySQL database (port 3306)
3. `lightwaha-redis` - Redis cache (port 6379)

**Acceptance Criteria:**
- All tests pass (80%+ coverage)
- Docker image builds successfully
- Docker Compose deployment works
- Health checks pass
- Logs are captured properly

**Dependencies:**
- Phase 1, 2, 3 must be complete

---

## Phase 5: n8n Integration & Webhooks

**Status:** ⬜ Not Started

**Objective:** Enable webhook triggering for n8n workflows and create example n8n node

**Deliverables:**
- [ ] Webhook endpoint (`POST /api/webhook/:event`)
- [ ] n8n example workflow
- [ ] Webhook trigger on message received
- [ ] Webhook trigger on message sent
- [ ] Custom n8n node (optional)
- [ ] Integration documentation

**Directory:** `phases/phase-5-n8n-integration/`

**Webhook Events:**
- `message.received` - Triggered when message arrives
- `message.sent` - Triggered when message is sent
- `session.authenticated` - Triggered when WhatsApp authenticated
- `session.disconnected` - Triggered on disconnect

**Example Webhook Payload:**
```json
{
  "event": "message.received",
  "data": {
    "from": "+351910270614",
    "text": "Hello",
    "timestamp": "2026-03-08T17:20:00Z",
    "messageId": "msg-id"
  }
}
```

**n8n Integration Points:**
- Receive messages via webhook
- Send messages via REST API
- Check status via REST API
- Trigger automated workflows

**Acceptance Criteria:**
- Webhooks trigger correctly
- n8n can send messages
- Example workflow works end-to-end
- Documentation clear and complete

**Dependencies:**
- Phase 3 and 4 must be complete

---

## Phase 6: Production Deployment

**Status:** ⬜ Not Started

**Objective:** Deploy to production (192.168.0.116) and configure monitoring

**Deliverables:**
- [ ] Production Docker Compose setup
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Health checks enabled
- [ ] Monitoring/logging set up
- [ ] Backup strategy implemented
- [ ] Deployment documented

**Directory:** `phases/phase-6-production/`

**Deployment Steps:**
1. Clone repo to `/home/sysadmin/lightWaha`
2. Set production environment variables
3. Run `docker compose -f docker-compose.prod.yml up -d`
4. Verify health checks
5. Test critical workflows

**Acceptance Criteria:**
- Application runs without errors
- All endpoints accessible
- Logs stored properly
- Backups scheduled
- Monitoring alerts configured

**Dependencies:**
- Phase 4 and 5 must be complete

---

## Critical Path Analysis

**Longest dependency chain (Critical Path):**
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
(1 day) + (1 day) + (1 day) + (1 day) + (1 day) + (1 day) + (1 day) = ~7 days
```

**Parallelizable:**
- Phase 5 can start after Phase 3 (doesn't need Phase 4 complete)
- Testing in Phase 4 can be done incrementally

---

## Resource Requirements

- **Development Machine:** Local with Node.js 20+
- **Docker Host:** 192.168.0.116 (8GB+ RAM)
- **GitHub:** Repository access
- **Database:** MySQL 8.0 (can be Docker)
- **Cache:** Redis 7.0 (can be Docker)

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| whatsapp-web.js instability | High | Implement retry logic, fallback to WAHA if needed |
| Browser startup time | Medium | Pre-warm browser, cache sessions |
| Database performance | Medium | Proper indexing, connection pooling |
| Message delivery failures | High | Exponential backoff, dead letter queue |
| Session loss on restart | Medium | Redis persistence, session backup |

---

## Success Metrics

- **API Response Time:** <500ms p95
- **Message Delivery Rate:** >99%
- **Uptime:** >99.5%
- **Test Coverage:** >80%
- **Deployment Time:** <5 minutes

---

## Additional Notes

This plan replaces the complexity of WAHA with a simpler, more direct integration. Each phase is designed to be completable in 1 day, enabling rapid deployment.

The project will be production-ready by end of Phase 6 (~1 week timeline) and immediately compatible with n8n workflows.

---

## Decision Lock

**These phase decisions are locked.** Changes to phases, deliverables, or acceptance criteria require explicit approval and must be documented in an ADR.

**Locked on:** 2026-03-08
**Locked by:** User
