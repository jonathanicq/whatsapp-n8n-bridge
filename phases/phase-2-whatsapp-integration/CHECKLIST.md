# Phase 2 Checklist: WhatsApp Integration

**Phase:** Phase 2 - WhatsApp Integration
**Status:** Not Started
**Started:** [Date]
**Completed:** [Date or N/A]

---

## Quick Reference

**Current Task:** [Task currently being worked on]
**Last Checkpoint:** [Last completed task]
**Blockers:** [Any blockers or issues]

---

## Setup & Prerequisites

- [ ] Read PROMPT.md for this phase
- [ ] Review Phase 1 code structure
- [ ] Verify Phase 1 backend running locally
- [ ] Create feature branch: `git checkout -b feature/phase-2-whatsapp-integration`
- [ ] Have WhatsApp app installed on phone for testing
- [ ] Verify Redis is accessible

---

## Section 1: Dependencies

### Task 1.1: Install Baileys and related packages
- [ ] Install Baileys: `npm install baileys@latest`
- [ ] Install QR code: `npm install qrcode`
- [ ] Install UUID: `npm install uuid`
- [ ] Install Baileys types: `npm install --save-dev @types/node`
- [ ] Files affected: `package.json`, `package-lock.json`
- [ ] Acceptance: All packages in node_modules; no install errors

### Task 1.2: Update TypeScript types
- [ ] Ensure Baileys types are available
- [ ] Verify no type errors with `npm run build`
- [ ] Files affected: `tsconfig.json` (may need skipLibCheck)
- [ ] Acceptance: No type errors after build

---

## Section 2: Core WhatsApp Service

### Task 2.1: Create WhatsApp service wrapper
- [ ] Create `src/services/whatsapp-service.ts`
  - Initialize Baileys with proper socket config
  - Handle connection events (ready, close, error)
  - Expose methods: connect(), disconnect(), getStatus()
  - Log all major events

- [ ] Create WhatsApp client initialization with proper error handling
- [ ] Files affected: `src/services/whatsapp-service.ts`
- [ ] Acceptance: Service exports and has proper TypeScript types

### Task 2.2: Implement session manager
- [ ] Create `src/services/session-manager.ts`
  - Serialize session to JSON
  - Encrypt session for Redis storage
  - Decrypt and restore from Redis
  - Handle session expiration

- [ ] Create encryption utilities for session data
- [ ] Methods: saveSession(), loadSession(), clearSession()
- [ ] Files affected: `src/services/session-manager.ts`
- [ ] Acceptance: Session can be saved to and loaded from Redis

### Task 2.3: Create message types and models
- [ ] Create `src/models/whatsapp-message.ts`
  - Define message interface with all fields
  - Support text, image, audio, document, video types
  - Include sender, timestamp, messageId, etc

- [ ] Create `src/models/whatsapp-session.ts`
  - Define session structure
  - Include auth state, device info

- [ ] Files affected: `src/models/whatsapp-*.ts`
- [ ] Acceptance: Types compile with no errors

---

## Section 3: Message Handling

### Task 3.1: Implement message parser
- [ ] Create `src/utils/message-parser.ts`
  - Parse Baileys message objects
  - Extract text content
  - Handle media messages (image, audio, document, video)
  - Extract sender phone number
  - Extract timestamp
  - Generate unique message ID

- [ ] Create helper functions for different message types
- [ ] Files affected: `src/utils/message-parser.ts`
- [ ] Acceptance: Parser correctly extracts fields from test messages

### Task 3.2: Set up message event handlers
- [ ] In WhatsApp service, add handlers for:
  - `messages.upsert` - new messages
  - `connection.update` - connection state changes
  - `creds.update` - authentication updates

- [ ] Emit parsed messages to event emitter
- [ ] Log all received messages (without content for privacy)
- [ ] Files affected: `src/services/whatsapp-service.ts`
- [ ] Acceptance: Handlers fire correctly on events

### Task 3.3: Implement reconnection logic
- [ ] Add exponential backoff retry logic
  - Initial delay: 1 second
  - Max delay: 30 seconds
  - Max retries: 10

- [ ] Automatically reconnect on unexpected disconnect
- [ ] Clear session on authentication failure
- [ ] Log reconnection attempts

- [ ] Files affected: `src/services/whatsapp-service.ts`
- [ ] Acceptance: Service reconnects after disconnect

---

## Section 4: QR Code & Authentication

### Task 4.1: Create QR code endpoint
- [ ] Create `src/routes/whatsapp.ts`
  - GET `/whatsapp/qr` - returns current QR code
  - POST `/whatsapp/logout` - logout WhatsApp

- [ ] Create `src/controllers/whatsapp-controller.ts`
  - Handle QR code request
  - Generate QR as data URI or PNG
  - Return JSON response

- [ ] Files affected: `src/routes/whatsapp.ts`, `src/controllers/whatsapp-controller.ts`
- [ ] Acceptance: QR endpoint returns scannable QR code

### Task 4.2: Integrate QR code with service
- [ ] WhatsApp service emits QR code when ready
- [ ] Store current QR in memory/Redis
- [ ] QR endpoint retrieves and returns it
- [ ] QR refreshes every 5 minutes (for security)

- [ ] Files affected: `src/services/whatsapp-service.ts`, `src/controllers/whatsapp-controller.ts`
- [ ] Acceptance: QR code updates and is retrievable

---

## Section 5: Service Integration

### Task 5.1: Initialize WhatsApp service in server startup
- [ ] In `src/server.ts`, initialize WhatsApp service after Redis/DB
- [ ] Handle initialization errors gracefully
- [ ] Subscribe to WhatsApp events
- [ ] Log connection status

- [ ] Files affected: `src/server.ts`
- [ ] Acceptance: Service initializes on server start

### Task 5.2: Add WhatsApp routes to app
- [ ] Mount WhatsApp routes in `src/routes/index.ts`
- [ ] Path: `/whatsapp/`
- [ ] QR code accessible at `/whatsapp/qr`

- [ ] Files affected: `src/routes/index.ts`
- [ ] Acceptance: Routes accessible via Express

### Task 5.3: Add message event subscription
- [ ] Create event listener for incoming messages
- [ ] Handler parses message and logs it
- [ ] Handler will trigger webhooks in Phase 5

- [ ] Files affected: `src/services/whatsapp-service.ts`, `src/server.ts`
- [ ] Acceptance: Messages trigger event on receipt

---

## Section 6: Error Handling

### Task 6.1: Handle WhatsApp disconnections
- [ ] Detect unexpected disconnect
- [ ] Log error with details
- [ ] Trigger automatic reconnection
- [ ] Don't lose session data on disconnect

- [ ] Files affected: `src/services/whatsapp-service.ts`
- [ ] Acceptance: Service recovers from disconnections

### Task 6.2: Handle authentication failures
- [ ] Detect when auth fails (invalid session)
- [ ] Clear corrupted session from Redis
- [ ] Generate new QR code
- [ ] Log auth error details

- [ ] Files affected: `src/services/whatsapp-service.ts`, `src/services/session-manager.ts`
- [ ] Acceptance: Service recovers from auth failures

---

## Section 7: Testing

### Task 7.1: Write unit tests for session manager
- [ ] Create `tests/unit/services/session-manager.unit.test.ts`
  - Test session serialization
  - Test encryption/decryption
  - Test Redis operations (mocked)
  - Test session validation

- [ ] Files affected: `tests/unit/services/session-manager.unit.test.ts`
- [ ] Acceptance: All tests pass

### Task 7.2: Write unit tests for message parser
- [ ] Create `tests/unit/utils/message-parser.unit.test.ts`
  - Test parsing text messages
  - Test parsing media messages
  - Test extracting metadata
  - Test error handling

- [ ] Files affected: `tests/unit/utils/message-parser.unit.test.ts`
- [ ] Acceptance: Parser tests pass

### Task 7.3: Write integration tests
- [ ] Create `tests/integration/whatsapp.integration.test.ts`
  - Test WhatsApp service initialization (mocked)
  - Test QR endpoint
  - Test message event emission (mocked)
  - Test reconnection logic (mocked)

- [ ] Files affected: `tests/integration/whatsapp.integration.test.ts`
- [ ] Acceptance: Integration tests pass

---

## Section 8: Code Quality

### Task 8.1: Run linter and fix issues
- [ ] Run `npm run lint`
- [ ] Fix all ESLint errors
- [ ] No hardcoded secrets

- [ ] Files affected: All src/ files
- [ ] Acceptance: `npm run lint` shows zero errors

### Task 8.2: Format code
- [ ] Run `npm run format`
- [ ] Verify consistent styling

- [ ] Files affected: All src/ files
- [ ] Acceptance: Code properly formatted

### Task 8.3: Compile TypeScript
- [ ] Run `npm run build`
- [ ] No type errors
- [ ] dist/ files generated

- [ ] Files affected: dist/ directory
- [ ] Acceptance: `npm run build` succeeds

### Task 8.4: Run tests
- [ ] Run `npm test`
- [ ] All tests passing
- [ ] No skipped tests without reason

- [ ] Files affected: N/A
- [ ] Acceptance: `npm test` passes

---

## Section 9: Documentation

### Task 9.1: Update architecture documentation
- [ ] Update `docs/ARCHITECTURE.md`
  - Add WhatsApp service layer
  - Explain message flow
  - Document session management
  - Add data flow diagrams

- [ ] Files affected: `docs/ARCHITECTURE.md`
- [ ] Acceptance: Architecture includes WhatsApp section

### Task 9.2: Create WhatsApp setup guide
- [ ] Create `docs/WHATSAPP_SETUP.md`
  - How to run locally
  - How to scan QR code
  - How to test with real messages
  - Troubleshooting guide

- [ ] Files affected: `docs/WHATSAPP_SETUP.md`
- [ ] Acceptance: Guide is clear and complete

### Task 9.3: Update CHANGELOG
- [ ] Add Phase 2 entry to `CHANGELOG.md`
  - List new features
  - List new dependencies
  - Reference commits

- [ ] Files affected: `CHANGELOG.md`
- [ ] Acceptance: CHANGELOG updated

---

## Section 10: Integration Testing

### Task 10.1: Test with real WhatsApp (if possible)
- [ ] Start service locally: `npm run dev`
- [ ] Access QR code: `curl http://localhost:3000/whatsapp/qr`
- [ ] Scan QR code with WhatsApp
- [ ] Send message from WhatsApp to number
- [ ] Verify message received and logged

- [ ] Acceptance: Service receives real WhatsApp messages

### Task 10.2: Test Docker setup
- [ ] Run `docker compose build`
- [ ] Run `docker compose up`
- [ ] Access QR code in container
- [ ] Test message receipt in container

- [ ] Acceptance: Docker setup works

---

## Section 11: Git & Commit

### Task 11.1: Review changes
- [ ] Run `git status` to see all changes
- [ ] Review `git diff` for accuracy
- [ ] Ensure no secrets in code
- [ ] All tests passing

- [ ] Acceptance: Clean diff, no unintended changes

### Task 11.2: Create feature branch commits
- [ ] Commit 1: Install dependencies and types
- [ ] Commit 2: Add WhatsApp service and session manager
- [ ] Commit 3: Add message parsing and types
- [ ] Commit 4: Add QR code endpoint
- [ ] Commit 5: Add reconnection logic and error handling
- [ ] Commit 6: Add unit and integration tests
- [ ] Commit 7: Update documentation

- [ ] Acceptance: Each commit is atomic and buildable

### Task 11.3: Push feature branch
- [ ] Push branch: `git push -u origin feature/phase-2-whatsapp-integration`
- [ ] Create pull request on GitHub

- [ ] Acceptance: PR visible on GitHub

### Task 11.4: Merge to dev branch
- [ ] After approval, merge to dev: `git checkout dev && git merge feature/phase-2-whatsapp-integration`
- [ ] Push dev: `git push origin dev`

- [ ] Acceptance: Changes in dev branch

---

## Section 12: Phase Completion

### Task 12.1: Verify acceptance criteria
- [ ] All criteria from PROMPT.md met
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Code reviewed and linted

- [ ] Acceptance: All criteria verified ✅

### Task 12.2: Update master plan
- [ ] Mark Phase 2 complete in MASTER_PLAN.md
- [ ] Update status in table

- [ ] Files affected: `MASTER_PLAN.md` (root)
- [ ] Acceptance: Master plan updated

### Task 12.3: Sign off Phase 2
- [ ] Update this CHECKLIST.md: mark as Complete
- [ ] Update PROMPT.md: mark as Complete
- [ ] Set completion date

- [ ] Files affected: `PROMPT.md`, `CHECKLIST.md`
- [ ] Acceptance: Phase 2 marked complete

---

## Notes & Observations

[To be filled during implementation]

---

## Issues Encountered

[To be filled during implementation]

---

**Last Updated:** 2026-03-07
**Phase Status:** Ready to Start ⏳
