# Phase 6: Custom n8n Node

**Phase Directory:** `phases/phase-6-n8n-node/`
**Status:** In Progress
**Started:** 2026-03-07
**Completed:** N/A

---

## Phase Objective

Create a self-contained npm package (`n8n-nodes-whatsapp-bridge`) that provides native n8n nodes for interacting with the WhatsApp Bridge service directly from the n8n UI. Users can install the package as a community node and use WhatsApp Send/Queue/Status operations and webhook triggers without manually configuring HTTP Request nodes.

**This phase is complete when:**
Package builds without errors, all tests pass (~20 tests), nodes are installable in n8n v2.1.5, and manual verification confirms Send/Trigger operations work end-to-end.

---

## Context

**What was completed before this phase:**
- Phase 5: Webhook system with dispatch endpoints (GET/POST/PATCH/DELETE /webhooks)
- REST API endpoints for sending messages, queueing, status checks
- Webhook signature verification (HMAC-SHA256)
- MySQL + Redis infrastructure functional

**What depends on this phase:**
- Phase 7: Comprehensive testing and documentation
- Phase 8: Deployment and production hardening

**Related Documentation:**
- PROJECT_CONFIG.md: Node.js + TypeScript, n8n v2.1.5
- MASTER_PLAN.md: Phase 6 overview
- `/opt/aiDeveloper/projects/whatsapp-n8n-bridge/src/` - All API endpoints and webhook system

---

## Requirements

### Functional Requirements
1. **WhatsAppBridge action node** - Expose 4 operations: `sendMessage`, `queueMessage`, `getStatus`, `getWebhooks`
2. **WhatsAppBridgeTrigger webhook node** - Register/deregister webhooks on activate/deactivate, verify HMAC signatures
3. **WhatsAppBridgeApi credential type** - Store base URL and API key
4. **Package structure** - npm package with proper n8n metadata, installable via n8n UI
5. **All operations work end-to-end** - Send message via n8n node → backend → WhatsApp

### Non-Functional Requirements
- **Performance:** Node operations complete in < 2 seconds
- **Security:** HMAC signature verification, API key encryption, no hardcoded secrets
- **Reliability:** Graceful error handling, clear error messages in n8n UI
- **Testability:** ~20 unit tests, mocked API calls

---

## Deliverables

### Code Deliverables
- [ ] **n8n-nodes-whatsapp-bridge/package.json** - Package definition with n8n metadata
- [ ] **n8n-nodes-whatsapp-bridge/tsconfig.json** - TypeScript configuration
- [ ] **n8n-nodes-whatsapp-bridge/index.ts** - Entry point exporting nodes and credentials
- [ ] **n8n-nodes-whatsapp-bridge/credentials/WhatsAppBridgeApi.credentials.ts** - Credential type
- [ ] **n8n-nodes-whatsapp-bridge/nodes/WhatsAppBridge/GenericFunctions.ts** - HTTP helper
- [ ] **n8n-nodes-whatsapp-bridge/nodes/WhatsAppBridge/WhatsAppBridge.node.ts** - Action node
- [ ] **n8n-nodes-whatsapp-bridge/nodes/WhatsAppBridge/WhatsAppBridgeTrigger.node.ts** - Trigger node
- [ ] **n8n-nodes-whatsapp-bridge/nodes/WhatsAppBridge/whatsapp.svg** - Node icon

### Test Deliverables
- [ ] Unit tests for action node (~10 tests)
- [ ] Unit tests for trigger node (~10 tests)
- [ ] All tests passing with `npm test`

### Documentation Deliverables
- [ ] Update CHANGELOG.md with Phase 6 details
- [ ] Update MASTER_PLAN.md: Phase 6 status → Complete
- [ ] README in n8n-nodes package with node usage examples

---

## Technical Approach

### Architecture

The n8n node package is a standalone npm module installed as a community node into n8n. It provides:

1. **Credentials:** WhatsAppBridgeApi stores service URL + API key
2. **Action Node (WhatsAppBridge):** Calls bridge API for send, queue, status, webhooks operations
3. **Trigger Node (WhatsAppBridgeTrigger):** Webhook receiver that registers with bridge on activate, deregisters on deactivate

**Data Flow:**
```
User in n8n UI
  ↓ selects WhatsAppBridge node
  ↓ configures operation (sendMessage, queueMessage, getStatus)
  ↓ connects to credentials
  ↓ execute node
  ↓ GenericFunctions.whatsappBridgeApiRequest()
  ↓ HTTP POST to bridge service (e.g., /whatsapp/send)
  ↓ Bridge returns response
  ↓ Node outputs result to n8n workflow
```

**Trigger Flow:**
```
Activate WhatsAppBridgeTrigger workflow
  ↓ trigger.activate()
  ↓ generate webhook URL from n8n host
  ↓ POST /webhooks { name, url, secret }
  ↓ store webhookId in static data
  ↓
Incoming WhatsApp message
  ↓ WhatsApp Bridge receives message
  ↓ dispatches to registered webhooks
  ↓ n8n trigger.webhook() receives POST
  ↓ verify HMAC-SHA256 signature
  ↓ emit message data
  ↓ n8n workflow executes
```

### Key Components

1. **Credential Type (WhatsAppBridgeApi):** Stores `baseUrl` and `apiKey`
2. **Action Node (WhatsAppBridge):**
   - Properties: `operation` (select), `to` (string), `text` (string), plus operation-specific fields
   - Execute: Loop over items, call API via helper, return results
3. **Trigger Node (WhatsAppBridgeTrigger):**
   - Lifecycle: activate() registers webhook, deactivate() unregisters
   - Handler: webhook() verifies signature and emits message data
4. **Helper (GenericFunctions.ts):** `whatsappBridgeApiRequest()` handles authentication and HTTP calls

### Technologies Used
- **n8n-workflow:** TypeScript types and interfaces for n8n node API
- **TypeScript:** Strict type checking, ES2020 target
- **Jest:** Unit testing with mocked HTTP requests
- **crypto:** HMAC-SHA256 signature verification

---

## Implementation Tasks

See `CHECKLIST.md` for detailed task breakdown.

**High-level steps:**
1. Create package.json with n8n metadata
2. Create tsconfig.json for n8n compatibility
3. Create credentials type (WhatsAppBridgeApi)
4. Create GenericFunctions helper
5. Create action node (WhatsAppBridge)
6. Create trigger node (WhatsAppBridgeTrigger)
7. Create index.ts entry point
8. Create whatsapp.svg icon
9. Write unit tests (~20 total)
10. Run `npm run build` → zero errors
11. Run `npm test` → all passing
12. Manual verification in n8n

---

## Testing Strategy

### Unit Tests

**WhatsAppBridge.node.test.ts (~10 tests):**
- sendMessage: Calls POST /whatsapp/send with correct payload
- queueMessage: Calls POST /queue/send
- getStatus: Calls GET /whatsapp/status
- getWebhooks: Calls GET /webhooks
- Error handling: API failure propagates as node error
- Credential validation: Missing credentials caught
- Response parsing: Results formatted correctly

**WhatsAppBridgeTrigger.node.test.ts (~10 tests):**
- activate(): Creates webhook via POST /webhooks
- deactivate(): Deletes webhook via DELETE /webhooks/:id
- webhook(): Returns message data on valid request
- HMAC signature valid: Request accepted
- HMAC signature invalid: Request rejected
- Missing webhook ID: Handled gracefully on deactivate
- Static data storage: Webhook ID persisted correctly

### Mocking Pattern
Mock `this.helpers.request` to return test payloads, mock `this.getCredentials` to provide test credentials.

---

## Acceptance Criteria

**This phase passes if:**

1. **Functionality:**
   - [ ] WhatsAppBridge node with 4 operations functional
   - [ ] WhatsAppBridgeTrigger webhook registration/deregistration working
   - [ ] Nodes appear in n8n UI after installation
   - [ ] Send message operation successfully calls bridge API
   - [ ] Incoming message triggers webhook handler

2. **Tests:**
   - [ ] All ~20 unit tests passing
   - [ ] Test coverage > 80%
   - [ ] Mocked API calls correctly

3. **Code Quality:**
   - [ ] `npm run build` produces zero TypeScript errors
   - [ ] No hardcoded secrets
   - [ ] Proper error messages for troubleshooting

4. **Documentation:**
   - [ ] CHANGELOG.md updated
   - [ ] MASTER_PLAN.md updated (Phase 6 → Complete)
   - [ ] README in package with node usage examples

5. **Manual Verification:**
   - [ ] Install package in n8n (via UI or copy to ~/.n8n/custom/)
   - [ ] Create workflow with WhatsAppBridge Send node
   - [ ] Execute send → message delivered to WhatsApp
   - [ ] Create trigger workflow with WhatsAppBridgeTrigger
   - [ ] Send WhatsApp message → workflow fires
   - [ ] Verify webhook registered via GET /webhooks

---

## Dependencies

### Prerequisites (Must be complete before starting)
- [x] Phase 5 completed (webhook system + API endpoints all working)
- [x] Bridge service running and accessible

### External Dependencies
- n8n v2.1.5 (running at http://192.168.0.116:5678)
- Bridge service REST API (http://192.168.0.116:3000 or configured URL)

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| n8n node API version incompatibility | Medium | High | Test in n8n v2.1.5, document version constraints in package.json |
| Webhook URL generation fails in n8n | Low | High | Use `this.getWebhookUrl()` which is n8n standard, test with real workflow |
| HMAC verification wrong | Medium | Medium | Unit test signature verification thoroughly, compare with bridge implementation |
| Package installation fails | Low | Medium | Publish to npm for testing, provide manual installation fallback |
| API endpoint changes post-Phase 5 | Low | Low | All endpoints documented in Phase 5, update bridge contract as needed |

---

## Deployment Considerations

**Installation Method (n8n UI):**
1. Settings → Community Nodes → Install
2. Search: `n8n-nodes-whatsapp-bridge`
3. Install → n8n restarts and loads node

**Alternative (Manual):**
Copy `dist/` folder to `~/.n8n/custom/` on Docker host, restart n8n container.

**Environment Variables (in n8n workflow):**
```
WHATSAPP_BRIDGE_URL=http://192.168.0.116:3000
WHATSAPP_BRIDGE_API_KEY=your-api-key-here
```

---

## Rollback Plan

If this phase fails or needs to be reverted:
1. Remove n8n-nodes-whatsapp-bridge package from n8n
2. Restore previous n8n configuration backup
3. Delete webhook.ts and related code if needed
4. Fall back to manual HTTP Request nodes in workflows

---

## Notes & Decisions

**Important decisions made during this phase:**
- Use `this.helpers.request` instead of custom HTTP client for n8n compatibility
- HMAC-SHA256 verification in trigger, matching bridge implementation
- Separate credential type (WhatsAppBridgeApi) for URL + API key
- Generate webhook URLs using `this.getWebhookUrl()` from n8n context

**Lessons learned:**
- n8n node API requires strict interface compliance
- Static data useful for persisting webhook IDs across activation cycles
- Trigger webhooks must be HTTPS-enabled in n8n

---

## Sign-off

**Phase completed by:** Claude Code
**Verified by:** Manual workflow testing in n8n
**Approved by:** (To be filled after manual testing)

**Final status:** ⏳ In Progress → Ready for completion
