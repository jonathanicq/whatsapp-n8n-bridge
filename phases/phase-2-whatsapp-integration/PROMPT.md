# Phase 2: WhatsApp Integration

**Phase Directory:** `phases/phase-2-whatsapp-integration/`
**Status:** Not Started
**Started:** [To be filled]
**Completed:** [To be filled]

---

## Phase Objective

Integrate Baileys library to establish WhatsApp Web connection, manage session state, handle QR code authentication, and process incoming messages. This phase enables the service to connect to WhatsApp and receive messages.

**This phase is complete when:** WhatsApp service connects via QR code scan, maintains session across restarts, receives incoming messages, and gracefully handles disconnections with reconnection logic.

---

## Context

**What was completed before this phase:**
- Phase 1: Express backend with database/Redis connections
- Health check endpoints and service structure
- Docker containerization and deployment setup
- Complete TypeScript, testing, and linting infrastructure

**What depends on this phase:**
- Phase 3 (API Implementation) requires WhatsApp service for message sending
- Phase 5 (Webhook System) requires message reception
- Custom n8n node depends on functional WhatsApp bridge

**Related Documentation:**
- PROJECT_CONFIG.md: Technology Stack, Build Commands
- MASTER_PLAN.md: Phase 2 section
- docs/ARCHITECTURE.md: Will need WhatsApp service layer addition

---

## Requirements

### Functional Requirements
1. WhatsApp service connects to WhatsApp Web via Baileys
2. Generate QR code for initial authentication
3. Scan QR code with WhatsApp app to authenticate
4. Persist session in Redis for restart resilience
5. Receive incoming messages (text, images, audio, documents)
6. Parse incoming messages and extract metadata (sender, timestamp, type)
7. Handle message types: text, image, audio, document, video
8. Reconnect automatically on disconnection with exponential backoff
9. Store received messages in database (Phase 3)
10. Emit events for incoming messages

### Non-Functional Requirements
- **Performance:** Message processing < 1 second
- **Reliability:** Automatic reconnection within 30 seconds
- **Security:** Session encrypted in Redis; no credentials in logs
- **Maintainability:** Clear separation between Baileys wrapper and business logic

---

## Deliverables

### Code Deliverables

**WhatsApp Service Structure:**
```
src/
├── services/
│   ├── whatsapp-service.ts      # Main Baileys wrapper
│   └── session-manager.ts       # Session persistence logic
├── models/
│   ├── whatsapp-message.ts      # Message type definitions
│   └── whatsapp-session.ts      # Session interface
├── routes/
│   └── whatsapp.ts              # QR code and auth endpoints
├── controllers/
│   └── whatsapp-controller.ts   # QR code endpoint handler
└── utils/
    └── message-parser.ts        # Parse Baileys messages
```

### Test Deliverables
- [ ] Unit tests for message parsing
- [ ] Unit tests for session manager
- [ ] Integration tests for WhatsApp service (mocked Baileys)
- [ ] Test QR code endpoint

### Documentation Deliverables
- [ ] Update docs/ARCHITECTURE.md with WhatsApp service layer
- [ ] Create docs/WHATSAPP_SETUP.md for local testing
- [ ] Update CHANGELOG.md with Phase 2 completion
- [ ] Document session management strategy

---

## Technical Approach

### Architecture

**WhatsApp Service Layer:**
```
Baileys Client
    ↓
WhatsApp Service (Wrapper)
    ├── Connection Management
    ├── Event Handlers
    ├── Message Processing
    └── Session Persistence ←→ Redis
```

**Message Flow:**
```
Incoming WhatsApp Message
    ↓
Baileys Event Handler
    ↓
Message Parser (extract metadata)
    ↓
Store in Database (Phase 3)
    ↓
Emit Event for Webhooks (Phase 5)
```

### Key Components

1. **WhatsAppService** - Baileys wrapper handling connection, events, message processing
2. **SessionManager** - Persist/restore WhatsApp session in Redis
3. **MessageParser** - Parse Baileys message objects into standard format
4. **QRCodeHandler** - Generate and serve QR code for authentication

### Technologies Used
- **Baileys** - WhatsApp Web reverse engineering library
- **qrcode** - QR code generation
- **uuid** - Generate unique message IDs
- **Redis** - Session storage
- **winston** - Logging (from Phase 1)

---

## Implementation Tasks

See `CHECKLIST.md` for detailed task breakdown.

**High-level steps:**
1. Install Baileys and QR code dependencies
2. Create WhatsApp service wrapper around Baileys
3. Implement session manager (save/load from Redis)
4. Set up QR code generation endpoint
5. Implement message event handlers
6. Add message parser for different message types
7. Implement reconnection logic with exponential backoff
8. Create message models and types
9. Write tests for service and message parsing
10. Update documentation and architecture
11. Commit and push to GitHub

---

## Testing Strategy

### Unit Tests
**What to test:**
- Session manager (encode/decode, encrypt/decrypt)
- Message parser (extract fields from different message types)
- Baileys event handling (mocked)
- Reconnection logic (timing, backoff calculation)

**Test files:**
- `tests/unit/services/session-manager.unit.test.ts`
- `tests/unit/utils/message-parser.unit.test.ts`
- `tests/unit/services/whatsapp-service.unit.test.ts`

### Integration Tests
**What to test:**
- QR code endpoint returns valid QR
- Message event firing and processing
- Session persistence and restoration
- Error handling for connection failures

**Test files:**
- `tests/integration/whatsapp.integration.test.ts`

### Manual Testing Checklist
- [ ] Scan QR code with real WhatsApp
- [ ] Receive message and verify parsing
- [ ] Disconnect WhatsApp and verify reconnection
- [ ] Restart service and verify session restored
- [ ] Test different message types (text, image, audio)

---

## Acceptance Criteria

**This phase passes if:**

1. **Functionality:**
   - [ ] Baileys connects to WhatsApp Web
   - [ ] QR code generated and scannable
   - [ ] Session persisted in Redis after scan
   - [ ] Service reconnects on disconnect
   - [ ] Incoming messages received and parsed
   - [ ] Different message types handled (text, image, audio, etc)

2. **Testing:**
   - [ ] Unit tests for session manager passing
   - [ ] Unit tests for message parser passing
   - [ ] Integration tests for WhatsApp service passing
   - [ ] No mocked test failures

3. **Code Quality:**
   - [ ] Linter passes: `npm run lint`
   - [ ] Code formatted: `npm run format`
   - [ ] TypeScript compiles: `npm run build`
   - [ ] No secrets in code

4. **Integration:**
   - [ ] WhatsApp service exports from config
   - [ ] Message events can be subscribed to
   - [ ] Session manager tested with real Redis
   - [ ] Service gracefully handles errors

5. **Documentation:**
   - [ ] Architecture updated with WhatsApp layer
   - [ ] Setup guide for local testing
   - [ ] Message types documented
   - [ ] CHANGELOG updated

---

## Dependencies

### Prerequisites
- [ ] Phase 1 completed (backend, DB, Redis)
- [ ] npm installed
- [ ] Redis running
- [ ] Real WhatsApp account for testing

### External Dependencies
- **Baileys** (WhatsApp library)
- **qrcode** (QR code generation)
- **uuid** (unique IDs)

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| Baileys breaks with WhatsApp updates | Medium | High | Monitor GitHub issues, update regularly, graceful error handling |
| Session corruption in Redis | Low | Medium | Encrypt session, validate on load, clear on error |
| Rate limiting by WhatsApp | Low | Medium | Implement backoff, queue messages, don't spam |
| Message parsing issues | Medium | Low | Test with real messages, handle unknown types gracefully |
| QR code timeout | Low | Low | Regenerate QR every 5 minutes, notify user |

---

## Environment Variables

**New/Modified Environment Variables:**
```bash
# WhatsApp Configuration
WA_SESSION_NAME=whatsapp-bridge
WA_SESSION_ENCRYPTION_KEY=your_encryption_key_here
WA_RECONNECT_MAX_RETRIES=10
WA_RECONNECT_INITIAL_DELAY=1000

# QR Code
QR_CODE_TIMEOUT=60000  # 60 seconds
QR_CODE_REFRESH_INTERVAL=300000  # 5 minutes
```

**Update `.env.example` with these variables**

---

## Database Changes

**No schema changes in Phase 2** - Session stored in Redis only.

**Phase 3 will add:**
- messages table (after API implementation)
- contacts table

---

## Deployment Considerations

**Configuration Changes:**
- Environment variables for session encryption
- Redis requirement (already in Phase 1)
- No new infrastructure needed

**Deployment Steps:**
1. Build and push Docker image
2. Set environment variables
3. Start service: `docker compose up`
4. Access QR code: `GET /whatsapp/qr`
5. Scan with WhatsApp
6. Service ready for messages

---

## Rollback Plan

**If this phase fails:**
1. Remove WhatsApp service from routes
2. Comment out WhatsApp initialization in server.ts
3. Revert to Phase 1 code: `git reset --hard HEAD~1`
4. Restart service
5. No data loss (Redis session can be cleared)

---

## Notes & Decisions

**Important decisions made during this phase:**
- **Baileys over Official API** - Chosen for accessibility, trade-off on stability
- **Redis for Sessions** - Enables horizontal scaling, automatic cleanup with TTL
- **Encryption for Sessions** - Protect sensitive WhatsApp data
- **Event-based Message Handling** - Decouple WhatsApp from business logic

---

## Sign-off

**Phase started by:** Claude AI Developer
**Started date:** 2026-03-07
**Phase completed by:** [Name/Date]
**Verified by:** [Name/Date]

**Final status:** ⏳ Ready to start implementation

---

## Quick Start for Phase 2

1. Read CHECKLIST.md for detailed tasks
2. Install Baileys: `npm install baileys uuid qrcode`
3. Create WhatsApp service wrapper
4. Implement session manager
5. Add QR code endpoint
6. Set up message handlers
7. Write tests
8. Update documentation
9. Commit and push
10. Mark phase complete
