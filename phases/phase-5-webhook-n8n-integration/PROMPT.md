# Phase 5: Webhook & n8n Integration

**Phase Directory:** `phases/phase-5-webhook-n8n-integration/`
**Status:** Not Started
**Started:** N/A
**Completed:** N/A

---

## Phase Objective

Implement inbound webhook delivery for incoming WhatsApp messages. When a message arrives from Baileys, the service fan-outs to all registered webhook endpoints (with HMAC-SHA256 signatures), tracks delivery in MySQL, and retries failures with exponential backoff using the same Redis sorted-set pattern established in Phase 4. This enables n8n workflows to trigger on incoming WhatsApp messages.

**This phase is complete when:**
Incoming WhatsApp messages are dispatched to registered webhook endpoints with HMAC signatures, retried on failure, and fully tracked in the database. n8n can receive and verify incoming messages.

---

## Context

**What was completed before this phase:**
- Phase 1: Express backend infrastructure (health checks, logging, error handling)
- Phase 2: WhatsApp Baileys integration with provider abstraction (QR auth, reconnect logic)
- Phase 3: Send message API endpoint with validation (49 tests)
- Phase 4: Message queue system with Redis + MySQL (28 tests, exponential backoff)

**What depends on this phase:**
- Phase 6: n8n custom node creation
- Phase 7: End-to-end testing
- Phase 8: Production deployment

**Related Documentation:**
- PROJECT_CONFIG.md: Technology stack, security standards, testing requirements
- MASTER_PLAN.md: Overall project phases and dependencies
- Phase 4 completion: Queue worker pattern, Redis sorted sets, exponential backoff implementation

---

## Requirements

### Functional Requirements
1. Register webhook endpoints via REST API (CRUD operations)
2. Dispatch incoming WhatsApp messages to all active webhooks with filtering support
3. Sign all webhook payloads with HMAC-SHA256 using webhook-specific secrets
4. Track webhook delivery status in MySQL (pending, delivering, success, failed)
5. Automatically retry failed deliveries with exponential backoff (1s, 2s, 5s, 10s, 30s)
6. Auto-bootstrap n8n webhook on startup (if configured)
7. Payload caching in Redis during retries

### Non-Functional Requirements
- **Performance:** Webhook fan-out non-blocking (Promise.allSettled)
- **Security:** HMAC signatures mandatory, no secrets in API responses, valid URL validation
- **Reliability:** Graceful retry with backoff, persistent audit trail in database
- **Maintainability:** Mirror Phase 4 queue patterns, 30+ new unit tests

---

## Deliverables

### Code Deliverables
- [ ] Database models: `src/models/webhook.ts` (enums, interfaces)
- [ ] Repository layer: `src/services/webhook-repository.ts` (CRUD for webhooks)
- [ ] Dispatcher service: `src/services/webhook-dispatcher.ts` (fan-out, signing)
- [ ] Queue worker: `src/services/webhook-queue-worker.ts` (retry polling)
- [ ] Controller: `src/controllers/webhook-controller.ts` (endpoint handlers)
- [ ] Routes: `src/routes/webhooks.ts` (route definitions)
- [ ] Server integration: Updated `src/server.ts` (dispatcher + worker bootstrap)
- [ ] Config updates: Environment loading, type definitions, constants

### Test Deliverables
- [ ] Unit tests: `tests/unit/services/webhook-repository.unit.test.ts` (~15 tests)
- [ ] Unit tests: `tests/unit/services/webhook-dispatcher.unit.test.ts` (~15 tests)
- [ ] All 100+ existing tests still passing
- [ ] Total expected: ~130+ tests passing

### Database Deliverables
- [ ] Migration reference: `migrations/002_create_webhook_tables.sql`
- [ ] Three new tables: webhook_configs, webhook_deliveries, webhook_delivery_attempts

### Documentation Deliverables
- [ ] Update .env.example with new env vars
- [ ] Update CHANGELOG.md with Phase 5 changes
- [ ] Update MASTER_PLAN.md with Phase 5 status

---

## Technical Approach

### Architecture Overview
The webhook system extends Phase 4's queue architecture:
- **Dispatch Phase:** Incoming message → list active webhooks → fan-out async POSTs → enqueue failures
- **Retry Phase:** Scheduled worker polls Redis sorted sets → attempts delivery → update status
- **Signing:** All payloads signed with HMAC-SHA256 using per-webhook secrets
- **Filtering:** Optional JSON filters on message type, group status, sender

### Key Components

1. **WebhookConfig Model:** Webhook registration with URL, secret, filters, active status
2. **WebhookDispatcher:** Entry point for dispatch flow, handles signing and enqueuing
3. **WebhookRepository:** MySQL CRUD for configs, deliveries, attempts
4. **WebhookQueueWorker:** Background worker polling Redis for retries
5. **WebhookController:** REST endpoint handlers (POST, GET, PATCH, DELETE)

### Data Flow
```
Incoming WhatsApp Message (server.ts line 60-68)
  ↓
WebhookDispatcher.dispatch(message)
  ├─ List active webhooks from DB
  ├─ Filter by message type/group/sender criteria
  ├─ Create delivery record per webhook (status: pending)
  ├─ For each webhook:
  │  ├─ Cache payload in Redis
  │  ├─ POST to webhook.url with HMAC signature
  │  ├─ Success: mark delivery completed, remove from queue
  │  └─ Failure: enqueue to Redis sorted set with retry timestamp
  └─ Return Promise.allSettled results

WebhookQueueWorker (every 5 seconds)
  ├─ Poll Redis: zRangeByScore for due deliveries
  ├─ Move to processing set
  ├─ GET delivery record + webhook config + cached payload
  ├─ Attempt delivery (10s timeout, AbortController)
  ├─ Record attempt in DB
  ├─ On success: mark completed
  └─ On failure: re-enqueue with next backoff delay
```

### Technologies Used
- **Node.js fetch (native):** No new dependencies, built-in HTTP requests
- **Node.js crypto:** HMAC-SHA256 signing (built-in)
- **Redis sorted sets:** Retry queue (existing)
- **MySQL:** Delivery tracking and audit trail
- **TypeScript:** Full type safety for webhooks

---

## Implementation Tasks

See `CHECKLIST.md` for detailed task breakdown.

**High-level steps:**
1. Create database schema and migration reference
2. Update config types and environment variables
3. Implement webhook models and repository
4. Implement dispatcher service with signing
5. Implement queue worker and retry loop
6. Implement REST controller and routes
7. Wire up server integration and bootstrap
8. Write unit tests (repository + dispatcher)
9. Integration testing and verification
10. Code quality checks (lint, build, tests)
11. Documentation updates
12. Git commit and cleanup

---

## Testing Strategy

### Unit Tests

**webhook-repository.unit.test.ts** (~15 tests):
- Create webhook config
- Update webhook (url, name, active, filters)
- Delete webhook
- List all webhooks
- Get single webhook
- Filter by active status
- Database error handling

**webhook-dispatcher.unit.test.ts** (~15 tests):
- Dispatch to single webhook (success)
- Dispatch to multiple webhooks (fan-out)
- Filter messages by type (text only)
- Filter by group status
- Filter by fromMe flag
- HMAC signature generation
- Payload caching in Redis
- Enqueue failed delivery to Redis
- Retry delay calculation
- Handling webhook errors gracefully
- Non-blocking dispatch (Promise.allSettled)

### Integration Tests
- End-to-end message arrival → webhook delivery
- Retry workflow with actual Redis
- Database persistence of delivery attempts

### Manual Testing Checklist
- [ ] POST /webhooks with valid URL → returns webhook ID
- [ ] GET /webhooks → lists all registered webhooks
- [ ] PATCH /webhooks/:id → updates webhook config
- [ ] DELETE /webhooks/:id → removes webhook
- [ ] Send WhatsApp message → webhook receives POST with valid HMAC
- [ ] Webhook endpoint returns 500 → message queued and retried
- [ ] n8n auto-bootstrap on startup with ENABLE_WEBHOOKS=true

---

## Acceptance Criteria

**This phase passes if:**

1. **Functionality:**
   - [ ] Webhook CRUD endpoints working
   - [ ] Incoming messages dispatch to all webhooks
   - [ ] HMAC signatures valid and verifiable
   - [ ] Failed deliveries retry with exponential backoff
   - [ ] Delivery status tracked in database
   - [ ] Webhook filtering works (by message type, group, sender)
   - [ ] n8n auto-bootstrap on startup

2. **Tests:**
   - [ ] All unit tests passing (30+ new)
   - [ ] All existing tests still passing (100+)
   - [ ] Total: 130+ tests passing
   - [ ] No test coverage regression

3. **Code Quality:**
   - [ ] `npm run build` → zero TypeScript errors
   - [ ] `npm run lint` → no errors
   - [ ] No hardcoded credentials or secrets
   - [ ] HMAC secret never exposed in API responses

4. **Documentation:**
   - [ ] .env.example updated with ENABLE_WEBHOOKS, N8N_WEBHOOK_URL, WEBHOOK_SECRET
   - [ ] CHANGELOG.md updated with Phase 5 changes
   - [ ] MASTER_PLAN.md Phase 5 marked complete
   - [ ] Code comments explain signing logic and retry pattern

5. **Security:**
   - [ ] URL validation (must parse as valid URL)
   - [ ] Secrets generated securely (crypto.randomBytes)
   - [ ] No sensitive data in logs
   - [ ] Webhook failures don't crash main service
   - [ ] Timeout on webhook requests (10s)

---

## Dependencies

### Prerequisites (Must be complete before starting)
- [x] Phase 1 completed (Express infrastructure)
- [x] Phase 2 completed (Baileys integration)
- [x] Phase 3 completed (Send API)
- [x] Phase 4 completed (Queue system)

### External Dependencies
- None (uses native Node.js fetch + crypto)

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| Webhook dispatch blocks message handling | High | High | Use Promise.allSettled, no await on webhook completion |
| HMAC signature mismatch in n8n | Medium | Medium | Document signing algorithm, provide n8n Code node example |
| Redis key conflicts with Phase 4 queue | Low | High | Use distinct prefix: `webhook:queue:*` vs `queue:*` |
| Webhook secrets leaked in logs | Medium | Critical | Never log secrets, strip from API responses, use env vars only |
| Retry loop gets stuck | Low | Medium | Add max attempt limit (5), log retry state, implement circuit breaker |

---

## Environment Variables

**New/Modified Environment Variables:**
```bash
# Enable webhook delivery system
ENABLE_WEBHOOKS=true

# n8n webhook endpoint (if auto-bootstrap enabled)
N8N_WEBHOOK_URL=https://n8n.thecoordinates.app/webhook/whatsapp-incoming

# n8n API access (for future Phase 6 custom node)
N8N_API_URL=http://192.168.0.116:5678
N8N_API_KEY=your_n8n_api_key_here

# Webhook secret for HMAC signing
WEBHOOK_SECRET=your_shared_secret_here
```

**Update `.env.example` with these variables**

---

## Database Changes (if applicable)

**Migrations:**
- [ ] Migration 002: Create webhook_configs, webhook_deliveries, webhook_delivery_attempts tables
  - File: `migrations/002_create_webhook_tables.sql`
  - Schema changes: Three new tables with ForeignKey constraints

**Rollback Plan:**
- Drop webhook_delivery_attempts table (references webhook_deliveries)
- Drop webhook_deliveries table (references webhook_configs)
- Drop webhook_configs table
- Clear Redis keys: `webhook:queue:*`, `webhook:payload:*`

---

## Deployment Considerations

**Configuration Changes:**
- Add ENABLE_WEBHOOKS, N8N_WEBHOOK_URL, WEBHOOK_SECRET to environment
- Update docker-entrypoint.sh to pass env vars (if applicable)
- Ensure MySQL user has CREATE TABLE permissions for migrations

**Infrastructure Changes:**
- No new infrastructure needed (uses existing Redis + MySQL)
- NGINX routing: If webhooks need external access, configure reverse proxy

**Deployment Steps:**
1. Pull latest code (Phase 5 branch)
2. Update .env.example and set real env vars
3. Run database migration: `npm run db:migrate` (if script exists)
4. Run full test suite: `npm test`
5. Build TypeScript: `npm run build`
6. Start service with ENABLE_WEBHOOKS=true
7. Verify n8n webhook auto-bootstrapped: GET /webhooks
8. Send test WhatsApp message, verify n8n receives webhook

---

## Rollback Plan

**If this phase fails or needs to be reverted:**
1. Revert last commit: `git revert [commit-hash]`
2. Drop webhook tables: `DROP TABLE webhook_delivery_attempts; DROP TABLE webhook_deliveries; DROP TABLE webhook_configs;`
3. Clear Redis webhook keys: `KEYS webhook:*` → `DEL` each
4. Restart service
5. Verify Phase 4 functionality still works

---

## Notes & Decisions

**Important decisions made during this phase:**
- HMAC-SHA256 chosen for signature verification (industry standard, available in Node.js built-in crypto)
- Redis sorted sets reused from Phase 4 with distinct key prefix
- Webhook dispatch non-blocking via Promise.allSettled (don't wait for completion)
- Max 5 retry attempts per delivery (prevents infinite retry loops)
- Secrets auto-generated if not provided in request (cryptographically secure)

**Lessons learned:**
- (To be filled in during implementation)

**Technical debt created (if any):**
- (To be filled in during implementation)

---

## Sign-off

**Phase completed by:** [Claude Code - AI Assistant]
**Verified by:** [Pending]
**Approved by:** [Pending]

**Final status:** ⏳ In Progress
