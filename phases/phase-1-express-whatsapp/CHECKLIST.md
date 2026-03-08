# Phase 1 Checklist: Express Backend & WhatsApp Integration

**Phase:** Phase 1 - Express Backend & WhatsApp Integration
**Status:** Not Started
**Started:** [To be filled]
**Completed:** [To be filled]

---

## Quick Reference

**Current Task:** [Task currently being worked on]
**Last Checkpoint:** [Last completed task - for resuming if interrupted]
**Blockers:** [Any current blockers or issues]

---

## Setup & Prerequisites

- [ ] Read PROMPT.md for Phase 1
- [ ] Review PROJECT_CONFIG.md for code standards
- [ ] Verify Phase 0 is complete (PROJECT_CONFIG.md locked)
- [ ] Create feature branch: `feature/phase-1-express-whatsapp`
  - Command: `git checkout -b feature/phase-1-express-whatsapp`
- [ ] npm dependencies ready: `npm list` shows all packages
- [ ] Node.js 20+ available: `node --version`
- [ ] TypeScript compiler working: `npm run type-check`

---

## Implementation Tasks

### Task Group 1: Project Structure & Configuration

- [ ] **Task 1.1:** Create directory structure
  - Files created:
    - `src/` directory
    - `src/config/` directory
    - `src/services/` directory
    - `src/utils/` directory
    - `tests/unit/` directory
    - `tests/integration/` directory
  - Acceptance: All directories exist and git tracks them

- [ ] **Task 1.2:** Create environment configuration (src/config/environment.ts)
  - Files affected: `src/config/environment.ts`
  - Implementation:
    - Load and validate all required env variables
    - Export validated config object
    - Throw error if required variables missing
  - Acceptance: `import config from './config/environment'` works, no undefined values

- [ ] **Task 1.3:** Create Winston logger (src/config/logger.ts)
  - Files affected: `src/config/logger.ts`
  - Implementation:
    - Initialize Winston with JSON format
    - Support LOG_LEVEL from environment
    - Create console and file transports
    - Use structured logging format
  - Acceptance: Logger exports singleton, logs are valid JSON

- [ ] **Task 1.4:** Update .env.example with Phase 1 variables
  - Files affected: `.env.example`
  - Variables to add:
    - PORT, NODE_ENV, LOG_LEVEL, LOG_FORMAT
    - WA_SESSION_NAME, WA_HEADLESS, WA_SESSION_STORAGE
    - API_KEY, EXEC_LOG_* variables
  - Acceptance: .env.example has all variables documented

---

### Task Group 2: Express Server Setup

- [ ] **Task 2.1:** Create Express server (src/server.ts)
  - Files affected: `src/server.ts`
  - Implementation:
    - Import Express and middleware
    - Create Express app instance
    - Add CORS, Helmet, and logging middleware
    - Implement health check endpoint (GET /health)
    - Start server on configured PORT
    - Add error handling middleware
  - Acceptance: `npm run dev` starts server on port 3000, GET /health returns 200

- [ ] **Task 2.2:** Add middleware configuration
  - Files affected: `src/server.ts`
  - Middleware needed:
    - helmet() for security headers
    - cors() for CORS support
    - express.json() for JSON parsing
    - Morgan or custom logging middleware
  - Acceptance: Server responds with proper headers, logs all requests

- [ ] **Task 2.3:** Implement health check endpoint
  - Files affected: `src/server.ts`
  - Endpoint: `GET /health`
  - Response: `{ "status": "ok", "timestamp": "2026-03-08T..." }`
  - Acceptance: Endpoint returns 200 with valid response

---

### Task Group 3: WhatsApp Service Integration

- [ ] **Task 3.1:** Create WhatsApp service (src/services/whatsapp-service.ts)
  - Files affected: `src/services/whatsapp-service.ts`
  - Implementation:
    - Import whatsapp-web.js Client
    - Create service class with initialize() method
    - Handle session creation/loading from file system
    - Implement session persistence logic
    - Add proper error handling and logging
  - Acceptance: Service initializes without errors, session file created

- [ ] **Task 3.2:** Implement WhatsApp event listeners
  - Files affected: `src/services/whatsapp-service.ts`
  - Events to implement:
    - `ready` - Log authentication success
    - `message` - Log incoming messages (don't process yet)
    - `disconnected` - Log disconnection
    - `auth_failure` - Log auth failure with error
    - `qr` - Emit QR code to handler
  - Acceptance: All events logged properly when tested

- [ ] **Task 3.3:** Implement session persistence
  - Files affected: `src/services/whatsapp-service.ts`
  - Implementation:
    - Save session to file system
    - Load existing session on startup
    - Handle session file deletion for re-authentication
  - Acceptance: Session persists across server restarts

- [ ] **Task 3.4:** Add WhatsApp service to Express server
  - Files affected: `src/server.ts`
  - Implementation:
    - Initialize WhatsApp service on server startup
    - Handle initialization errors gracefully
    - Log service startup status
  - Acceptance: Server waits for WhatsApp service before listening

---

### Task Group 4: QR Code Handling

- [ ] **Task 4.1:** Create QR handler (src/utils/qr-handler.ts)
  - Files affected: `src/utils/qr-handler.ts`
  - Implementation:
    - Import qrcode-terminal
    - Create function to display QR code in terminal
    - Handle QR code refresh if provided new QR
    - Log clear instructions for scanning
  - Acceptance: QR code displays clearly in terminal

- [ ] **Task 4.2:** Integrate QR handler with WhatsApp service
  - Files affected: `src/services/whatsapp-service.ts`
  - Implementation:
    - Listen to 'qr' event from whatsapp-web.js
    - Call QR handler to display code
    - Log QR code status
  - Acceptance: QR displays within 10 seconds of server start

- [ ] **Task 4.3:** Implement QR refresh logic
  - Files affected: `src/utils/qr-handler.ts`
  - Implementation:
    - Handle multiple QR generations
    - Clear terminal and redisplay new QR
    - Log QR refresh attempts
  - Acceptance: New QR displays when authentication fails and retried

---

## Testing Tasks

### Unit Tests

- [ ] **Unit Test 1.1:** Test environment configuration loading
  - Test file: `tests/unit/config/environment.unit.test.ts`
  - What it tests:
    - Loads environment variables correctly
    - Throws error when required variable missing
    - Validates environment variable types
  - Command to run: `npm run test:unit -- environment`

- [ ] **Unit Test 1.2:** Test logger initialization
  - Test file: `tests/unit/config/logger.unit.test.ts`
  - What it tests:
    - Winston logger initializes
    - Logs are in JSON format
    - Log levels work correctly
  - Command to run: `npm run test:unit -- logger`

- [ ] **Unit Test 1.3:** Test QR handler
  - Test file: `tests/unit/utils/qr-handler.unit.test.ts`
  - What it tests:
    - QR code display function works
    - Handles multiple QR displays
    - Logs QR actions
  - Command to run: `npm run test:unit -- qr-handler`

- [ ] **Unit Test 1.4:** Test WhatsApp service initialization
  - Test file: `tests/unit/services/whatsapp-service.unit.test.ts`
  - What it tests:
    - Service initializes with valid config
    - Handles initialization errors
    - Creates session file
  - Command to run: `npm run test:unit -- whatsapp-service`

### Integration Tests

- [ ] **Integration Test 1.1:** Test Express server startup
  - Test file: `tests/integration/server.integration.test.ts`
  - What it tests:
    - Server starts on correct port
    - Health endpoint responds
    - Middleware properly configured
  - Command to run: `npm run test:integration -- server`

- [ ] **Integration Test 1.2:** Test WhatsApp service with Express
  - Test file: `tests/integration/whatsapp-integration.test.ts`
  - What it tests:
    - WhatsApp service initializes with server
    - Events are logged
    - Session persists
  - Command to run: `npm run test:integration -- whatsapp`

### Test Execution

- [ ] Run all unit tests: `npm run test:unit`
  - Result: [Pass/Fail - update when run]

- [ ] Run all integration tests: `npm run test:integration`
  - Result: [Pass/Fail - update when run]

- [ ] Run full test suite: `npm test`
  - Result: [Pass/Fail - update when run]

- [ ] Check test coverage: `npm run test:coverage`
  - Coverage: [X]% (Threshold: 80%)
  - Result: [Pass/Fail - update when run]

---

## Code Quality Checks

- [ ] Run linter: `npm run lint`
  - Result: [Pass/Fail]
  - Errors found: [List any]

- [ ] Run formatter: `npm run format`
  - Result: [Files reformatted/Already formatted]

- [ ] Code follows naming conventions (PROJECT_CONFIG.md)
  - Files: camelCase, Classes: PascalCase, Constants: SCREAMING_SNAKE_CASE
  - Result: ✅ Confirmed

- [ ] No hardcoded credentials or secrets
  - Checked files: src/**/*.ts
  - Result: ✅ No secrets found

- [ ] No console.log statements (use logger instead)
  - Result: ✅ All logs use winston logger

- [ ] Complex logic has explanatory comments
  - Locations: WhatsApp service initialization, QR handler
  - Result: ✅ Comments added

- [ ] Type checking passes: `npm run type-check`
  - Result: [Pass/Fail]

---

## Documentation Tasks

- [ ] Update README.md
  - Section updated: Quick Start, Project Structure, Development
  - What changed: Added Phase 1 setup instructions, architecture diagram
  - Result: ✅ Updated

- [ ] Update API documentation
  - Endpoints documented: GET /health
  - Swagger/OpenAPI updated: Not yet (planned for Phase 3)
  - Result: ✅ Health endpoint documented

- [ ] Create ADR if needed
  - Decision: File-based session storage for Phase 1
  - ADR number: [If created, note it]
  - Result: ✅ Documented in PROMPT.md

- [ ] Update CHANGELOG.md
  - Version: 0.0.1-alpha
  - Changes documented: Express server, WhatsApp integration, QR auth, logging
  - Result: ✅ Updated

- [ ] Inline code comments added where needed
  - Files: whatsapp-service.ts, qr-handler.ts
  - Result: ✅ Comments added for complex logic

- [ ] Update .env.example
  - New variables added: All Phase 1 variables
  - Result: ✅ Updated with documentation

---

## Security Checklist

- [ ] All external inputs validated
  - Environment variables validated in config
  - Result: ✅ Validated

- [ ] No hardcoded credentials
  - Checked: src/**/*.ts, config files
  - Result: ✅ All in environment variables

- [ ] Secrets stored in environment variables only
  - API_KEY, WA_SESSION_NAME, etc.
  - Result: ✅ All sensitive data uses env vars

- [ ] No sensitive data in logs
  - Logger configured to not log secrets
  - Result: ✅ Confirmed

- [ ] CORS properly configured
  - Express server has cors() middleware
  - Result: ✅ Configured

- [ ] Helmet security headers enabled
  - Express server has helmet() middleware
  - Result: ✅ Configured

---

## Manual Testing Checklist

- [ ] Start server: `npm run dev`
  - Result: Server starts without errors within 10 seconds

- [ ] QR code displays in terminal
  - Result: QR code visible and scannable

- [ ] Access health endpoint: `curl http://localhost:3000/health`
  - Result: Returns 200 with JSON response

- [ ] Scan QR code with WhatsApp phone
  - Result: Phone syncs with desktop, server logs "ready" event

- [ ] Stop and restart server: `npm run dev`
  - Result: Session persists, no new QR code needed

- [ ] Send test message to WhatsApp
  - Result: Server logs incoming message event

- [ ] Disconnect phone WhatsApp
  - Result: Server logs "disconnected" event

- [ ] View logs for proper JSON format
  - Command: `tail -f logs/app.log` (if file logging enabled)
  - Result: Logs are valid JSON format

---

## Pre-Commit Checklist

- [ ] All implementation tasks complete
  - Result: ✅ All tasks done

- [ ] All tests passing
  - Command: `npm test`
  - Result: ✅ All tests pass

- [ ] Linter passing
  - Command: `npm run lint`
  - Result: ✅ No errors

- [ ] Code coverage meets threshold (80%+)
  - Result: ✅ Coverage > 80%

- [ ] Documentation updated
  - CHANGELOG.md: ✅ Updated
  - README.md: ✅ Updated
  - Code comments: ✅ Added
  - .env.example: ✅ Updated

- [ ] No console.log / debug statements
  - Result: ✅ All use logger

- [ ] No commented-out code blocks
  - Result: ✅ Clean code

- [ ] Branch up to date with master
  - Command: `git pull origin master`
  - Result: ✅ Up to date

---

## Git & Version Control

- [ ] Stage all relevant files
  - Command: `git add src/ tests/ .env.example CHANGELOG.md README.md`

- [ ] Commit with meaningful message
  - Message: `feat: Implement Express server and WhatsApp Web.js integration with QR auth`
  - Command: `git commit -m "[message]"`

- [ ] Push to remote
  - Command: `git push origin feature/phase-1-express-whatsapp`

---

## Review & Approval

- [ ] Self-review: Code review your own changes
  - Areas reviewed: WhatsApp service, Express setup, error handling
  - Result: ✅ Reviewed

- [ ] Create Pull Request
  - PR title: `Phase 1: Express Backend & WhatsApp Integration`
  - PR description: Lists all changes, testing done, manual tests completed

- [ ] All CI/CD checks passing (if applicable)

- [ ] Code review completed (if applicable)

- [ ] PR approved and merged to feature branch completion

---

## Phase Completion

- [ ] All acceptance criteria from PROMPT.md met
  - Functionality: ✅
  - Tests: ✅
  - Code Quality: ✅
  - Documentation: ✅
  - Security: ✅

- [ ] Update MASTER_PLAN.md with phase status
  - Change Phase 1 status from "Not Started" to "Complete"

- [ ] Update this checklist status to "Complete"

- [ ] Verify Phase 2 dependencies are ready
  - Database schema designed: Yes

- [ ] Document lessons learned in PROMPT.md
  - Notes section: Fill in actual lessons

---

## Rollback Plan (in case of failure)

**If something goes wrong:**
1. [ ] Revert git commits: `git reset --hard origin/master`
2. [ ] Delete session files: `rm -rf ./sessions/`
3. [ ] Reinstall dependencies: `npm install`
4. [ ] Document issue and create task for fix
5. [ ] Resume from failed point after issue resolved

---

## Notes & Issues

**Issues encountered:**
- [Issue 1] - [Status: Resolved/Pending] - [Solution or next steps]
- [Issue 2] - [Status: Resolved/Pending] - [Solution or next steps]

**Decisions made:**
- File-based session storage initially (move to DB in Phase 2)
- Winston logging for structured logs
- QR in terminal (HTTP endpoint optional)

**Technical debt created:**
- Session file location hardcoded (refactor in Phase 2)
- No database integration yet (Phase 2)

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
