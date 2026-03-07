# Phase 5 Checklist: Webhook & n8n Integration

**Phase:** Phase 5 - Webhook & n8n Integration
**Status:** Not Started
**Started:** N/A
**Completed:** N/A

---

## Quick Reference

**Current Task:** Phase 5 Setup
**Last Checkpoint:** None (starting)
**Blockers:** None

---

## Setup & Prerequisites

- [ ] Read PROMPT.md for this phase
- [ ] Review PROJECT_CONFIG.md for relevant standards
- [ ] Verify Phase 4 completion and all tests passing
- [ ] Create feature branch: `feature/phase-5-webhook-n8n-integration`
- [ ] Pull latest code from main/dev
- [ ] Install dependencies (npm install): `npm install` if needed
- [ ] Verify existing tests pass: `npm test` (should show 100+ tests)

---

## Implementation Tasks

### Task Group 1: Database Schema & Configuration

- [ ] **Task 1.1:** Create database migration reference file
  - File: `migrations/002_create_webhook_tables.sql`
  - Acceptance: File contains CREATE TABLE blocks for webhook_configs, webhook_deliveries, webhook_delivery_attempts with proper ForeignKey constraints

- [ ] **Task 1.2:** Append migration to init-db.sql
  - File: `init-db.sql`
  - Acceptance: Three new CREATE TABLE IF NOT EXISTS blocks appended (can copy from migration file)

- [ ] **Task 1.3:** Update AppConfig type definition
  - File: `src/utils/types.ts`
  - Acceptance: Add webhook block with enableWebhooks, n8nWebhookUrl, n8nApiUrl, n8nApiKey, defaultSecret properties

- [ ] **Task 1.4:** Load webhook environment variables
  - File: `src/config/environment.ts`
  - Acceptance: Load ENABLE_WEBHOOKS, N8N_WEBHOOK_URL, N8N_API_URL, N8N_API_KEY, WEBHOOK_SECRET from process.env

- [ ] **Task 1.5:** Add webhook constants
  - File: `src/utils/constants.ts`
  - Acceptance: Add WEBHOOK_CONFIG (queue keys, retry delays) and WEBHOOK_ERRORS; add HTTP_CODES.CREATED = 201

---

### Task Group 2: Models & Repository

- [ ] **Task 2.1:** Create webhook models and enums
  - File: `src/models/webhook.ts`
  - Acceptance: Export WebhookConfig, WebhookDelivery, WebhookDeliveryAttempt interfaces; WebhookStatus, DeliveryStatus, AttemptStatus enums; WebhookPayload type

- [ ] **Task 2.2:** Implement webhook repository (CRUD)
  - File: `src/services/webhook-repository.ts`
  - Acceptance: Implement createWebhook, updateWebhook, deleteWebhook, getWebhookById, listWebhooks, listActiveWebhooks methods; create delivery + attempt log methods

- [ ] **Task 2.3:** Write repository unit tests
  - File: `tests/unit/services/webhook-repository.unit.test.ts`
  - Acceptance: ~15 tests covering CRUD operations, filtering, error handling; all passing

---

### Task Group 3: Dispatcher Service

- [ ] **Task 3.1:** Implement webhook dispatcher service
  - File: `src/services/webhook-dispatcher.ts`
  - Acceptance: Implement dispatch(message), dispatchToOne(webhook, payload), attemptDelivery(deliveryId, webhook, payload, attemptNumber); HMAC signing, payload caching, retry enqueuing

- [ ] **Task 3.2:** Write dispatcher unit tests
  - File: `tests/unit/services/webhook-dispatcher.unit.test.ts`
  - Acceptance: ~15 tests covering fan-out, filtering, signing, retry enqueue, error handling; all passing

---

### Task Group 4: Queue Worker & Retry System

- [ ] **Task 4.1:** Implement webhook queue worker
  - File: `src/services/webhook-queue-worker.ts`
  - Acceptance: Implement worker loop (5s polling), Redis sorted set operations, retry with exponential backoff, status updates

- [ ] **Task 4.2:** Add worker lifecycle management
  - File: `src/services/webhook-queue-worker.ts`
  - Acceptance: start(), stop(), isRunning() methods; graceful shutdown

---

### Task Group 5: REST Controller & Routes

- [ ] **Task 5.1:** Implement webhook controller
  - File: `src/controllers/webhook-controller.ts`
  - Acceptance: Implement POST (create), GET (list), GET/:id (single), PATCH/:id (update), DELETE/:id (delete) handlers with validation

- [ ] **Task 5.2:** Create webhook routes
  - File: `src/routes/webhooks.ts`
  - Acceptance: Route definitions for /webhooks endpoints (POST, GET, GET/:id, PATCH, DELETE) with proper middleware

- [ ] **Task 5.3:** Register webhook routes in main router
  - File: `src/routes/index.ts`
  - Acceptance: Import and mount `/webhooks` route handler

---

### Task Group 6: Server Integration & Bootstrap

- [ ] **Task 6.1:** Wire up dispatcher in message handler
  - File: `src/server.ts`
  - Acceptance: Replace TODO (line 60-68) with `webhookDispatcher.dispatch(message)` call

- [ ] **Task 6.2:** Implement n8n auto-bootstrap
  - File: `src/server.ts`
  - Acceptance: On startup, if ENABLE_WEBHOOKS && N8N_WEBHOOK_URL: check if webhook exists, if not create it (errors non-fatal)

- [ ] **Task 6.3:** Initialize and start webhook worker
  - File: `src/server.ts`
  - Acceptance: Create webhookQueueWorker instance, start on server init, stop on graceful shutdown

- [ ] **Task 6.4:** Update .env.example
  - File: `.env.example`
  - Acceptance: Add ENABLE_WEBHOOKS, N8N_WEBHOOK_URL, N8N_API_URL, N8N_API_KEY, WEBHOOK_SECRET entries with descriptions

---

### Task Group 7: Testing & Verification

- [ ] **Task 7.1:** Run all unit tests
  - Command: `npm test`
  - Acceptance: All tests passing (expect ~130+ tests total); no test regressions

- [ ] **Task 7.2:** Build TypeScript
  - Command: `npm run build`
  - Acceptance: Zero TypeScript errors, successful build

- [ ] **Task 7.3:** Run linter
  - Command: `npm run lint`
  - Acceptance: No linting errors (warnings acceptable if intentional)

- [ ] **Task 7.4:** Verify no console.log statements
  - Command: `grep -r "console\\.log" src/ | grep -v "test"`
  - Acceptance: No results (or only in test files)

- [ ] **Task 7.5:** Verify no hardcoded secrets
  - Command: `grep -r "WEBHOOK_SECRET\\|API_KEY\\|secret" src/ | grep -v "env\\|config\\|types\\|test"`
  - Acceptance: No hardcoded secret values in source

---

### Task Group 8: Integration Testing

- [ ] **Task 8.1:** Manual test: Create webhook via API
  - Steps: POST /webhooks with { name: "test", url: "http://localhost:3000/test-webhook" }
  - Acceptance: Returns 201 with webhook ID, secret is NOT included in response

- [ ] **Task 8.2:** Manual test: List webhooks
  - Steps: GET /webhooks
  - Acceptance: Returns all registered webhooks (secrets redacted)

- [ ] **Task 8.3:** Manual test: Update webhook
  - Steps: PATCH /webhooks/:id with { active: false }
  - Acceptance: Returns 200 with updated webhook

- [ ] **Task 8.4:** Manual test: Delete webhook
  - Steps: DELETE /webhooks/:id
  - Acceptance: Returns 204, webhook removed from list

- [ ] **Task 8.5:** Manual test: Message dispatch to webhook
  - Steps: Register webhook, send WhatsApp message, verify webhook receives POST
  - Acceptance: n8n receives POST with X-Webhook-Signature header, payload matches signature

- [ ] **Task 8.6:** Manual test: Webhook retry on failure
  - Steps: Register webhook pointing to failing endpoint, send message, wait 5s, observe MySQL shows retries
  - Acceptance: webhook_deliveries shows status transitions, webhook_delivery_attempts has multiple rows

- [ ] **Task 8.7:** Manual test: n8n auto-bootstrap
  - Steps: Start service with ENABLE_WEBHOOKS=true + N8N_WEBHOOK_URL set, check GET /webhooks
  - Acceptance: Auto-created webhook present with name "n8n Auto-registered"

---

### Task Group 9: Documentation

- [ ] **Task 9.1:** Update CHANGELOG.md
  - File: `CHANGELOG.md`
  - Acceptance: Add Phase 5 section with new features, changes, and fixed items; update version

- [ ] **Task 9.2:** Update MASTER_PLAN.md
  - File: `MASTER_PLAN.md`
  - Acceptance: Mark Phase 5 as Complete (✅), update overall progress

- [ ] **Task 9.3:** Add inline code comments
  - Files: `src/services/webhook-dispatcher.ts`, `src/services/webhook-queue-worker.ts`
  - Acceptance: Complex logic has explanatory comments (HMAC signing, retry calculation, Redis operations)

- [ ] **Task 9.4:** Document webhook payload format (inline)
  - File: `src/models/webhook.ts` or JSDoc comment in dispatcher
  - Acceptance: Clear example of webhook JSON payload that n8n receives

---

## Code Quality Checks

- [ ] Run linter: `npm run lint`
  - Result: Pass (no errors)

- [ ] Run formatter: `npm run format` or `npm run prettier:fix`
  - Result: Pass (code formatted)

- [ ] Code follows naming conventions (PROJECT_CONFIG.md)
  - Check: camelCase for variables/functions, PascalCase for classes/types

- [ ] No hardcoded credentials or secrets
  - Check: All secrets loaded from environment variables

- [ ] All TODO comments addressed or tracked
  - Check: Main TODO on line 60-68 of server.ts replaced with dispatch call

- [ ] Complex logic has explanatory comments
  - Check: HMAC signing, retry delay calculation, Redis sorted set operations

---

## Security Checklist

- [ ] All external inputs validated
  - Check: URL validation (try `new URL(url)`), name validation (non-empty string, max 100 chars)

- [ ] No SQL injection vulnerabilities
  - Check: Using parameterized queries in repository: `db.query(sql, [params])`

- [ ] No XSS vulnerabilities
  - Check: No user input rendered in HTML (REST API only)

- [ ] Authentication/authorization properly implemented
  - Check: Webhook endpoints have no auth (public registration); if needed, add in future phase

- [ ] Secrets stored in environment variables only
  - Check: WEBHOOK_SECRET, N8N_API_KEY from process.env

- [ ] No sensitive data in logs
  - Check: Webhook dispatch/retry logs don't include secrets or payloads

- [ ] HTTPS enforced (if applicable)
  - Check: Webhook URLs validated, n8n uses HTTPS (external)

- [ ] Rate limiting implemented (if applicable)
  - Check: Not required for Phase 5 (defer to future phase if needed)

---

## Database Tasks

- [ ] Create migration file
  - File: `migrations/002_create_webhook_tables.sql`
  - Description: Creates three webhook tables with proper indexes and constraints

- [ ] Append to init-db.sql
  - File: `init-db.sql`
  - Description: Adds three CREATE TABLE blocks (can be run multiple times safely with IF NOT EXISTS)

- [ ] Test schema locally (optional)
  - Command: `mysql -u user -p database < migrations/002_create_webhook_tables.sql`
  - Result: Tables created successfully (or already exist)

---

## Integration Checks

- [ ] Verify integration with Phase 4 queue system
  - Check: Message repository still works, queue manager still functional

- [ ] Verify integration with server.ts message event
  - Check: Message event fires, dispatcher called, no exceptions

- [ ] Verify Redis keys don't conflict
  - Check: Phase 4 uses `queue:*`, Phase 5 uses `webhook:queue:*` (distinct)

- [ ] Test end-to-end workflow manually
  - Steps: (See Task 8.5-8.7 above)

- [ ] Verify no breaking changes to existing functionality
  - Check: Run full test suite, all 100+ existing tests pass

---

## Pre-Commit Checklist

- [ ] All tasks in this checklist completed
  - Check: Review all completed checkboxes above

- [ ] All tests passing
  - Command: `npm test` → ~130+ tests passing

- [ ] Linter passing
  - Command: `npm run lint` → no errors

- [ ] Code coverage meets threshold
  - Command: `npm test -- --coverage`
  - Target: Maintain or improve existing coverage

- [ ] Documentation updated
  - Files: CHANGELOG.md, MASTER_PLAN.md, .env.example all updated

- [ ] No console.log / debug statements left in code
  - Check: Only in test files and critical logging paths

- [ ] No commented-out code blocks (unless documented why)
  - Check: No large blocks of dead code

- [ ] Branch up to date with main/dev
  - Command: `git pull origin dev` (or main)

---

## Git & Version Control

- [ ] Create feature branch
  - Command: `git checkout -b feature/phase-5-webhook-n8n-integration`
  - Acceptance: Branch created and checked out

- [ ] Stage all relevant files
  - Command: `git add -A` (or specific files)
  - Acceptance: Verify with `git status`

- [ ] Commit with meaningful message
  - Message: `Phase 5: Webhook & n8n Integration - Inbound message dispatch with retry`
  - Command: `git commit -m "[message]"`

- [ ] Push to remote
  - Command: `git push origin feature/phase-5-webhook-n8n-integration`

---

## Review & Approval

- [ ] Self-review: Code review your own changes
  - Check: Read through key files (dispatcher, repository, controller)

- [ ] Create Pull Request
  - Title: `Phase 5: Webhook & n8n Integration`
  - Description: Summary of changes, test coverage, manual test results

- [ ] All CI/CD checks passing
  - Check: GitHub Actions (if configured) passes all checks

- [ ] Code review completed (if applicable)
  - Status: Approved

- [ ] PR approved and merged
  - Status: Merged to dev/main

---

## Deployment (if applicable)

- [ ] Merge to dev branch
  - Command: `git checkout dev && git merge feature/phase-5-webhook-n8n-integration`

- [ ] Run migrations on test database
  - Command: `npm run db:migrate` (if script exists)
  - Acceptance: Three new tables created

- [ ] Deploy to staging environment
  - Command: `docker-compose -f compose.yaml up` (or deployment script)

- [ ] Verify deployment successful
  - Check: Service starts without errors, logs show webhook worker active

- [ ] Smoke test in staging
  - Check: GET /health returns 200, GET /webhooks returns 200

---

## Phase Completion

- [ ] All acceptance criteria from PROMPT.md met
  - Review: PROMPT.md "Acceptance Criteria" section

- [ ] Update MASTER_PLAN.md with phase status
  - Status: Mark Phase 5 as ✅ Complete

- [ ] Update this checklist status to "Complete"
  - Field: Status at top of file

- [ ] Archive phase directory (optional)
  - Action: Can keep for historical reference

---

## Rollback Plan (in case of failure)

**If something goes wrong:**
1. [ ] Revert last commit: `git revert [commit-hash]`
2. [ ] Rollback database migration: `DROP TABLE webhook_delivery_attempts, webhook_deliveries, webhook_configs;`
3. [ ] Clear Redis keys: `FLUSHDB` (or selective `DEL webhook:*`)
4. [ ] Redeploy previous stable version
5. [ ] Document what went wrong
6. [ ] Create new issue/task to fix problem

---

## Notes & Issues

**Issues encountered:**
- (None yet - to be filled in during implementation)

**Decisions made:**
- (To be filled in during implementation)

**Technical debt created:**
- (None anticipated for Phase 5)

**Time tracking:**
- Started: [Date/Time]
- Completed: [Date/Time]
- Total time: [Duration]

---

## Checkpoint Resume Guide

**If interrupted, resume from:**
- Last completed task: [Task X.Y]
- Current blocker: [None or describe]
- Next action: [Specific next step to take]
