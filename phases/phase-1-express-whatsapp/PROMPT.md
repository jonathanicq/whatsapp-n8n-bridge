# Phase 1: Express Backend & WhatsApp Integration

**Phase Directory:** `phases/phase-1-express-whatsapp/`
**Status:** Not Started
**Started:** [To be filled]
**Completed:** [To be filled]

---

## Phase Objective

Build Express server with whatsapp-web.js integration, QR code authentication, and basic message handling. Set up the foundation for all message processing and WhatsApp communication.

**This phase is complete when:**
Express server starts without errors, WhatsApp Web.js client initializes successfully, QR code displays in terminal, user can scan QR code and authenticate, session persists across restarts, and all events are logged properly.

---

## Context

**What was completed before this phase:**
- Phase 0: Project planning, configuration locked, development environment documented
- Technology stack decided: Express.js, TypeScript, whatsapp-web.js, Winston logging
- Project structure created with package.json and tsconfig.json

**What depends on this phase:**
- Phase 2: Database & Redis implementation needs WhatsApp service layer
- Phase 3: REST API endpoints need WhatsApp service to send/receive messages
- All downstream phases depend on this foundation

**Related Documentation:**
- PROJECT_CONFIG.md: Technology stack, code standards
- MASTER_PLAN.md: Phase 1 detailed description

---

## Requirements

### Functional Requirements
1. Express.js server that listens on port 3000
2. WhatsApp Web.js client initialization with Chromium browser automation
3. QR code generation and display in terminal on first authentication
4. Session management - maintain authentication across server restarts
5. Event listeners for critical WhatsApp events:
   - `ready` - When session is authenticated
   - `message` - When message is received
   - `disconnected` - When connection is lost
   - `auth_failure` - When authentication fails
6. Error handling for all WhatsApp operations
7. Logging all events and errors with Winston

### Non-Functional Requirements
- **Performance:** Server startup < 10 seconds, WebSocket ready < 5 seconds
- **Reliability:** Session persists across restarts, graceful disconnect handling
- **Maintainability:** Clear service separation, testable code structure
- **Security:** No hardcoded credentials, environment-based configuration

---

## Deliverables

### Code Deliverables
- [ ] **src/server.ts** - Express server entry point
  - Location: `src/server.ts`
  - Description: Express app initialization, middleware setup, server startup

- [ ] **src/services/whatsapp-service.ts** - WhatsApp Web.js wrapper
  - Location: `src/services/whatsapp-service.ts`
  - Description: Handles client initialization, event listeners, message operations

- [ ] **src/utils/qr-handler.ts** - QR code display logic
  - Location: `src/utils/qr-handler.ts`
  - Description: Displays QR code in terminal, manages QR refresh

- [ ] **src/config/logger.ts** - Winston logging setup
  - Location: `src/config/logger.ts`
  - Description: Configures Winston logger with JSON format and log levels

- [ ] **src/config/environment.ts** - Environment configuration
  - Location: `src/config/environment.ts`
  - Description: Loads and validates environment variables

- [ ] **.env.example** - Updated with new variables
  - Location: `.env.example`
  - Description: Documented environment variables for Phase 1

### Test Deliverables
- [ ] Unit tests for WhatsApp service initialization
- [ ] Unit tests for QR handler
- [ ] Integration tests for Express server startup
- [ ] Integration tests for WhatsApp event listeners

### Documentation Deliverables
- [ ] Update README.md with Phase 1 setup instructions
- [ ] Document WhatsApp service architecture in inline comments
- [ ] Update CHANGELOG.md with Phase 1 changes
- [ ] Create this PROMPT.md with detailed instructions

---

## Technical Approach

### Architecture

The Express server acts as the main orchestrator. WhatsApp Web.js runs as a browser automation client that communicates with WhatsApp Web. All events are captured and logged through Winston. The QR code is displayed in the terminal for initial authentication.

**Key Components:**

1. **Express Server** - RESTful API server, middleware setup, health checks
2. **WhatsApp Service** - Wrapper around whatsapp-web.js client, manages lifecycle
3. **QR Handler** - Terminal-based QR code display and management
4. **Logger** - Winston-based JSON logging for all operations
5. **Environment Config** - Centralized configuration management

### Data Flow

```
Server Startup
    ↓
Load Config & Logger
    ↓
Initialize WhatsApp Service
    ├─→ Start Chromium browser
    ├─→ Load or create session
    └─→ Display QR code (if new session)
    ↓
User scans QR code
    ↓
Session authenticated
    ↓
Set up event listeners
    ├─→ message events
    ├─→ status changes
    └─→ connection changes
    ↓
Express server ready on port 3000
```

### Technologies Used
- **Express.js** - Web server framework for REST API foundation
- **whatsapp-web.js** - Browser automation library for WhatsApp Web
- **Puppeteer/Chromium** - Browser engine for WhatsApp Web automation
- **qrcode-terminal** - Terminal-based QR code display
- **Winston** - Structured logging with JSON format
- **TypeScript** - Type safety and better developer experience
- **dotenv** - Environment variable management

---

## Implementation Tasks

See `CHECKLIST.md` for detailed task breakdown.

**High-level steps:**

1. **Setup Express Server**
   - Create src/server.ts with Express app
   - Add middleware (CORS, helmet, logging)
   - Implement health check endpoint

2. **Configure Environment & Logging**
   - Create src/config/environment.ts for env var validation
   - Create src/config/logger.ts with Winston setup
   - Update .env.example with required variables

3. **Implement WhatsApp Service**
   - Create src/services/whatsapp-service.ts
   - Initialize whatsapp-web.js client
   - Implement session persistence in file system
   - Add event listeners for all critical events

4. **Implement QR Code Handler**
   - Create src/utils/qr-handler.ts
   - Display QR code in terminal on first run
   - Handle QR refresh if authentication fails
   - Implement optional HTTP endpoint for QR viewing

5. **Write Tests & Documentation**
   - Unit tests for each service
   - Integration tests for server startup
   - Update README and CHANGELOG

---

## Testing Strategy

### Unit Tests
**What to test:**
- WhatsApp service initialization with valid/invalid configs
- QR code generation and display logic
- Environment variable validation
- Logger initialization and message formatting
- Error handling in service methods

**Test files:**
- `tests/unit/services/whatsapp-service.unit.test.ts`
- `tests/unit/utils/qr-handler.unit.test.ts`
- `tests/unit/config/environment.unit.test.ts`
- `tests/unit/config/logger.unit.test.ts`

### Integration Tests
**What to test:**
- Express server starts successfully
- Server responds to health check
- WhatsApp service initializes without errors
- Event listeners are properly attached
- QR code displays when service initializes
- Session persists across restarts

**Test files:**
- `tests/integration/server.integration.test.ts`
- `tests/integration/whatsapp-integration.test.ts`

### Manual Testing Checklist
- [ ] Start server with `npm run dev`
- [ ] QR code displays in terminal within 10 seconds
- [ ] Can access http://localhost:3000/health
- [ ] Scan QR code with phone and authenticate
- [ ] Server logs "ready" event after authentication
- [ ] Stop server and restart - session persists
- [ ] Disconnect phone WhatsApp and see disconnection event

---

## Acceptance Criteria

**This phase passes if:**

1. **Functionality:**
   - [ ] Express server starts on port 3000 without errors
   - [ ] WhatsApp Web.js client initializes successfully
   - [ ] QR code displays in terminal
   - [ ] User can scan QR code and authenticate
   - [ ] Session persists after server restart
   - [ ] All WhatsApp events logged (message, ready, disconnect, etc.)
   - [ ] Server responds to health check endpoint

2. **Tests:**
   - [ ] All unit tests passing (npm test:unit)
   - [ ] All integration tests passing (npm test:integration)
   - [ ] Test coverage > 80% for services
   - [ ] No test warnings or errors

3. **Code Quality:**
   - [ ] ESLint passes with no errors (npm run lint)
   - [ ] Code follows naming conventions from PROJECT_CONFIG.md
   - [ ] No hardcoded credentials or secrets
   - [ ] No console.log statements (use logger instead)
   - [ ] TypeScript compiles without errors (npm run type-check)

4. **Documentation:**
   - [ ] Code comments explain complex WhatsApp initialization logic
   - [ ] README.md updated with Phase 1 setup instructions
   - [ ] API documentation started (health endpoint documented)
   - [ ] CHANGELOG.md updated with Phase 1 changes
   - [ ] .env.example updated with all new variables

5. **Security:**
   - [ ] All environment variables validated
   - [ ] No credentials in code or logs
   - [ ] Helmet security headers configured
   - [ ] CORS properly configured
   - [ ] Error messages don't expose sensitive information

---

## Dependencies

### Prerequisites (Must be complete before starting)
- [x] Phase 0 completed
- [x] PROJECT_CONFIG.md locked
- [x] package.json created with dependencies
- [x] Node.js 20+ installed locally
- [x] TypeScript configured

### External Dependencies
- [ ] Chromium/Chrome browser (required by puppeteer)
- [ ] Internet connection for WhatsApp Web
- [ ] Valid WhatsApp account for testing

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| whatsapp-web.js browser automation flaky | High | High | Implement retry logic, timeout handling, graceful degradation |
| QR code expiry during testing | Medium | Medium | Auto-refresh QR, clear instructions in logs |
| Chromium startup slow | Medium | Low | Pre-warm browser, document startup time in logs |
| Session file permission issues | Low | Medium | Use proper file permissions, add error handling for file access |
| Browser crash on disconnect | Medium | High | Implement reconnection logic, health checks, restart handling |

---

## Environment Variables

**New/Modified Environment Variables:**
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# WhatsApp Session
WA_SESSION_NAME=lightwaha
WA_HEADLESS=true
WA_SESSION_STORAGE=./sessions

# API Key (for future API endpoints)
API_KEY=your-secret-key-here

# Centralized Execution Logging (prepared for Phase 2)
EXEC_LOG_ENABLED=false
EXEC_LOG_HOST=mysql.thecoordinates.xyz
EXEC_LOG_USER=makeuser
EXEC_LOG_PASSWORD=your_password_here
EXEC_LOG_DATABASE=makebdd
```

**Update `.env.example` with these variables**

---

## Database Changes

Not applicable for Phase 1. Database integration happens in Phase 2.

---

## Deployment Considerations

**Configuration Changes:**
- PORT environment variable must be set before server start
- WA_SESSION_NAME controls session file naming
- LOG_LEVEL affects verbosity (debug for development, info for production)

**Infrastructure Changes:**
- None for Phase 1 (Docker comes in Phase 4)
- Requires Chromium/browser binary available on system

**Deployment Steps:**
1. Install dependencies: `npm install`
2. Create .env from .env.example
3. Start development: `npm run dev`
4. Scan QR code with phone
5. Monitor logs for "ready" event

---

## Rollback Plan

**If this phase fails or needs to be reverted:**
1. Delete session file: `rm -rf ./sessions/`
2. Revert git commits for Phase 1
3. Reinstall dependencies: `npm install`
4. Return to Phase 0 setup

---

## Notes & Decisions

**Important decisions made:**
- Using file-based session storage initially (easier for development)
- Winston for logging instead of console (structured logs for future centralization)
- QR code in terminal by default (no HTTP endpoint required)

**Lessons learned:**
- [Will be filled during implementation]

**Technical debt created (if any):**
- Session file location hardcoded (move to config in Phase 2)
- No database persistence yet (added in Phase 2)

---

## Sign-off

**Phase completed by:** [Name/Date - To be filled]
**Verified by:** [Name/Date - To be filled]
**Approved by:** [Name/Date - To be filled]

**Final status:** ⬜ Not Started (Ready to begin)
