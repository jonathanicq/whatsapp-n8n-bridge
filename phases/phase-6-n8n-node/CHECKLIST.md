# Phase 6 Checklist: Custom n8n Node

**Phase:** 6 - Custom n8n Node
**Directory:** `phases/phase-6-n8n-node/`
**Target Completion:** 2026-03-08

---

## Setup & Structure

- [ ] **1.1** Create `n8n-nodes-whatsapp-bridge/` directory inside main project
- [ ] **1.2** Create subdirectories:
  - `credentials/`
  - `nodes/WhatsAppBridge/`
  - `tests/`
  - `dist/`
- [ ] **1.3** Create `n8n-nodes-whatsapp-bridge/.npmignore` (exclude src, tests, tsconfig, etc)
- [ ] **1.4** Create `.gitignore` entries for dist/, node_modules/, *.d.ts
- [ ] **1.5** Task #1 complete: Mark COMPLETE in TaskUpdate

---

## Core Package Files

- [ ] **2.1** Create `n8n-nodes-whatsapp-bridge/package.json`
  - Fields: name, version, description, main, types, scripts, dependencies, devDependencies
  - n8n metadata: `"n8n"` object with `n8nNodesApiVersion: 1`, credentials array, nodes array
  - Scripts: `"build": "tsc"`, `"test": "jest"`
  - peerDependencies: `"n8n-workflow": "*"`
  - Test result: `npm install` succeeds

- [ ] **2.2** Create `n8n-nodes-whatsapp-bridge/tsconfig.json`
  - Target: ES2020
  - Module: commonjs
  - Strict: true
  - Declaration: true
  - Exclude: node_modules, dist, tests

- [ ] **2.3** Create `n8n-nodes-whatsapp-bridge/.eslintrc.json` (if using shared eslint config)
  - Or reference parent project config

- [ ] **2.4** Create `n8n-nodes-whatsapp-bridge/index.ts`
  - Export array of credential classes
  - Export array of node classes
  - Syntax: `export const CREDENTIALS: ICredentialType[] = [WhatsAppBridgeApi]`
  - Syntax: `export const NODES: INodeType[] = [WhatsAppBridge, WhatsAppBridgeTrigger]`

- [ ] **2.5** Task #2 complete: Mark COMPLETE in TaskUpdate

---

## Credentials Implementation

- [ ] **3.1** Create `credentials/WhatsAppBridgeApi.credentials.ts`
  - Implement `ICredentialType` interface
  - Class name: `WhatsAppBridgeApi`
  - Properties:
    - `name`: 'whatsappBridgeApi'
    - `displayName`: 'WhatsApp Bridge API'
    - `properties[]`: baseUrl (string), apiKey (string, password type)
  - Test: TypeScript compiles without errors

- [ ] **3.2** Verify credential appears in n8n UI after installation
  - No syntax errors in implementation

- [ ] **3.3** Task #3 complete: Mark COMPLETE in TaskUpdate

---

## Helper Functions

- [ ] **4.1** Create `nodes/WhatsAppBridge/GenericFunctions.ts`
  - Function: `whatsappBridgeApiRequest()`
  - Parameters: `this`, `method`, `endpoint`, `body`, `query`
  - Retrieve credentials via `this.getCredentials('whatsappBridgeApi')`
  - Build options: URL, headers (x-api-key, Content-Type), body, qs, json: true
  - Call `this.helpers.request(options)`
  - Handle and throw errors appropriately
  - Return parsed JSON response

- [ ] **4.2** Test helper with mock credentials
  - Helper builds correct request object
  - Correct headers included

- [ ] **4.3** Task #3 (continued)

---

## Action Node Implementation

- [ ] **5.1** Create `nodes/WhatsAppBridge/WhatsAppBridge.node.ts`
  - Implement `INodeType` interface
  - Class: `WhatsAppBridge`
  - Properties:
    - `description.name`: 'WhatsApp Bridge'
    - `description.displayName`: 'WhatsApp Bridge'
    - `description.group`: ['send']
    - `description.inputs`: [INodeInputConfiguration with type 'main']
    - `description.outputs`: [INodeOutputConfiguration with type 'main']
    - `description.credentials`: [{ name: 'whatsappBridgeApi', required: true }]

- [ ] **5.2** Implement node properties (inputs)
  - Main property: `operation` select with options:
    - `sendMessage`: Send message immediately
    - `queueMessage`: Queue message for delivery
    - `getStatus`: Get WhatsApp connection status
    - `getWebhooks`: List registered webhooks

  - SendMessage fields:
    - `to`: Phone number (E.164 format)
    - `text`: Message text

  - QueueMessage fields:
    - `to`: Phone number (E.164 format)
    - `text`: Message text

  - GetStatus: (no additional fields)
  - GetWebhooks: (no additional fields)

- [ ] **5.3** Implement execute() method
  - Loop: `for (let i = 0; i < items.length; i++)`
  - Get `operation` from `this.getNodeParameter('operation', i)`
  - Call appropriate API endpoint via helper
  - Handle errors: catch and format as node error
  - Return: `[returnData]` where returnData is array of output items

- [ ] **5.4** Implement sendMessage operation
  - Endpoint: POST /whatsapp/send
  - Body: `{ to, text }`
  - Response: `{ messageId, status, timestamp }`

- [ ] **5.5** Implement queueMessage operation
  - Endpoint: POST /queue/send
  - Body: `{ to, text }`
  - Response: `{ messageId, status, queuedAt }`

- [ ] **5.6** Implement getStatus operation
  - Endpoint: GET /whatsapp/status
  - Response: `{ connected, qrRequired, sessionId }`

- [ ] **5.7** Implement getWebhooks operation
  - Endpoint: GET /webhooks
  - Response: `{ webhooks: [...] }`

- [ ] **5.8** Test WhatsAppBridge node
  - TypeScript compiles
  - Mock API calls in tests
  - Each operation calls correct endpoint

- [ ] **5.9** Task #4 complete: Mark COMPLETE in TaskUpdate

---

## Trigger Node Implementation

- [ ] **6.1** Create `nodes/WhatsAppBridge/WhatsAppBridgeTrigger.node.ts`
  - Implement `INodeType` interface
  - Class: `WhatsAppBridgeTrigger`
  - Properties:
    - `description.name`: 'WhatsApp Bridge Trigger'
    - `description.displayName`: 'WhatsApp Bridge Trigger'
    - `description.group`: ['trigger']
    - `description.inputs`: [] (triggers have no inputs)
    - `description.outputs`: [{ type: 'main' }]
    - `description.credentials`: [{ name: 'whatsappBridgeApi', required: true }]
    - `description.webhookIdQuery`: 'webhookId' (for URL parsing)

- [ ] **6.2** Implement trigger properties
  - No input properties needed
  - Webhook URL generated by n8n

- [ ] **6.3** Implement activate() method
  - Called when workflow with trigger is activated
  - Get credentials and webhook URL:
    ```typescript
    const webhookUrl = this.getWebhookUrl();
    const webhookId = webhookUrl.split('/').pop();
    ```
  - Call API: `POST /webhooks`
    ```json
    {
      "name": `n8n-${workflowId}`,
      "url": webhookUrl,
      "secret": webhookSecret (generate random string)
    }
    ```
  - Store response webhook ID in static data:
    ```typescript
    this.saveStaticData({ webhookId: response.id, webhookSecret: response.secret });
    ```

- [ ] **6.4** Implement deactivate() method
  - Load webhook ID from static data
  - Call API: `DELETE /webhooks/{webhookId}`
  - Clear static data

- [ ] **6.5** Implement webhook() handler
  - Receives incoming message from bridge
  - Extract HMAC signature from headers: `X-Webhook-Signature`
  - Verify signature:
    ```typescript
    const crypto = require('crypto');
    const body = JSON.stringify(req.body);
    const secret = this.getStaticData().webhookSecret;
    const expectedSig = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== expectedSig) return { noWebhookResponse: true };
    ```
  - If invalid signature: return `{ noWebhookResponse: true }`
  - If valid: parse message data and emit:
    ```typescript
    return { workflowData: [[{ json: req.body.data }]] };
    ```

- [ ] **6.6** Test WhatsAppBridgeTrigger node
  - TypeScript compiles
  - Mock API calls
  - activate() calls POST /webhooks correctly
  - deactivate() calls DELETE correctly
  - webhook() handler verifies HMAC
  - webhook() rejects invalid signatures

- [ ] **6.7** Task #5 complete: Mark COMPLETE in TaskUpdate

---

## Node Icon

- [ ] **7.1** Create `nodes/WhatsAppBridge/whatsapp.svg`
  - Use standard WhatsApp icon (green background, white chat bubble)
  - Size: 256x256 recommended
  - Format: Valid SVG
  - Save to correct location

- [ ] **7.2** Verify icon displays in n8n UI
  - Update `WhatsAppBridge.node.ts` description:
    ```typescript
    description.icon = 'file:whatsapp.svg';
    ```
  - Update `WhatsAppBridgeTrigger.node.ts` similarly

---

## Unit Tests

### WhatsAppBridge.node.test.ts

- [ ] **8.1** Setup test file
  - Import jest, mock helpers, IExecuteFunctions
  - Mock `this.getCredentials`, `this.getNodeParameter`, `this.helpers.request`

- [ ] **8.2** Test sendMessage operation
  - Mock credentials: baseUrl, apiKey
  - Call with phone and text
  - Verify POST /whatsapp/send called
  - Verify body contains `{ to, text }`
  - Verify headers contain `x-api-key`

- [ ] **8.3** Test queueMessage operation
  - Mock credentials
  - Call with phone and text
  - Verify POST /queue/send called
  - Verify body correct

- [ ] **8.4** Test getStatus operation
  - Verify GET /whatsapp/status called
  - No body required

- [ ] **8.5** Test getWebhooks operation
  - Verify GET /webhooks called
  - Returns webhooks array

- [ ] **8.6** Test error handling
  - API returns error → node throws error
  - Missing credentials → caught and handled

- [ ] **8.7** Test response parsing
  - API returns JSON → parsed and returned to n8n
  - Result formatted as n8n output

- [ ] **8.8** Test multiple items
  - Input: array of 2 items
  - Output: array of 2 results

### WhatsAppBridgeTrigger.node.test.ts

- [ ] **8.9** Setup test file
  - Import jest, crypto, mock IWebhookFunctions
  - Mock `this.getCredentials`, `this.getWebhookUrl`, `this.helpers.request`, `this.saveStaticData`, `this.getStaticData`

- [ ] **8.10** Test activate() method
  - Calls POST /webhooks with correct payload
  - Stores webhook ID in static data
  - Returns undefined (n8n standard)

- [ ] **8.11** Test deactivate() method
  - Loads webhook ID from static data
  - Calls DELETE /webhooks/{id}
  - Clears static data

- [ ] **8.12** Test webhook() handler - valid signature
  - Mock valid HMAC-SHA256 signature
  - Handler verifies signature matches
  - Returns message data in correct format

- [ ] **8.13** Test webhook() handler - invalid signature
  - Mock invalid signature
  - Handler rejects request
  - Returns `{ noWebhookResponse: true }`

- [ ] **8.14** Test webhook() handler - missing webhook ID on deactivate
  - Static data empty or missing
  - Handle gracefully without throwing

- [ ] **8.15** Test static data persistence
  - activate() stores ID
  - deactivate() reads ID
  - Data persists across calls

- [ ] **8.16** Run full test suite
  - `npm test` from n8n-nodes-whatsapp-bridge directory
  - All ~20 tests passing
  - Test coverage > 80%

- [ ] **8.17** Task #6 complete: Mark COMPLETE in TaskUpdate

---

## Build & Compilation

- [ ] **9.1** Install dependencies
  - `cd n8n-nodes-whatsapp-bridge && npm install`
  - All dependencies resolved without warnings

- [ ] **9.2** Build TypeScript
  - `npm run build`
  - Zero TypeScript errors
  - dist/ directory created
  - dist/ contains compiled .js and .d.ts files

- [ ] **9.3** Verify build output
  - dist/credentials/WhatsAppBridgeApi.credentials.js exists
  - dist/nodes/WhatsAppBridge/WhatsAppBridge.node.js exists
  - dist/nodes/WhatsAppBridge/WhatsAppBridgeTrigger.node.js exists
  - dist/nodes/WhatsAppBridge/GenericFunctions.js exists
  - dist/index.js exists with correct exports

- [ ] **9.4** Verify no hardcoded secrets in dist/
  - Search dist/ for credentials, passwords, API keys
  - All should come from credentials at runtime

- [ ] **9.5** Task #7 complete: Mark COMPLETE in TaskUpdate

---

## Manual Verification in n8n

- [ ] **10.1** Copy package to n8n custom nodes
  - Option 1: `npm publish` to npm (public or private)
  - Option 2: Copy `dist/` to `~/.n8n/custom/` on Docker host
  - Restart n8n container: `docker compose restart n8n`

- [ ] **10.2** Verify nodes appear in n8n UI
  - Open n8n at http://192.168.0.116:5678
  - Create new workflow
  - Click + to add node
  - Search "WhatsApp Bridge"
  - Both WhatsAppBridge and WhatsAppBridgeTrigger should appear

- [ ] **10.3** Test SendMessage operation
  - Add WhatsAppBridge node to workflow
  - Select operation: sendMessage
  - Configure credentials (set base URL and API key)
  - Set `to` field: test phone number
  - Set `text` field: test message
  - Execute workflow
  - Verify message sent (check bridge logs or WhatsApp)

- [ ] **10.4** Test QueueMessage operation
  - Add WhatsAppBridge node
  - Select operation: queueMessage
  - Execute
  - Verify message queued in bridge

- [ ] **10.5** Test GetStatus operation
  - Add WhatsAppBridge node
  - Select operation: getStatus
  - Execute
  - Verify status returned (should show WhatsApp connected)

- [ ] **10.6** Test GetWebhooks operation
  - Execute
  - Verify list of webhooks returned

- [ ] **10.7** Test WhatsAppBridgeTrigger activation
  - Create new workflow
  - Add WhatsAppBridgeTrigger node
  - Configure credentials
  - **Activate** workflow
  - Verify webhook registered:
    - Check bridge logs or call `GET /webhooks`
    - Should show new webhook with n8n URL

- [ ] **10.8** Test WhatsAppBridgeTrigger webhook delivery
  - From external device: send WhatsApp message to connected number
  - Trigger workflow receives message
  - Verify message data in n8n execution output
  - Check message structure: event, timestamp, data { messageId, sender, text, ... }

- [ ] **10.9** Test WhatsAppBridgeTrigger deactivation
  - Deactivate trigger workflow
  - Verify webhook unregistered from bridge
  - Call `GET /webhooks` → webhook should be gone

- [ ] **10.10** Verify error handling in n8n UI
  - Test with invalid credentials
  - Test with invalid phone number
  - Verify error messages clear and helpful

- [ ] **10.11** Task #7 (continued) - tests passing

---

## Documentation

- [ ] **11.1** Update CHANGELOG.md
  - Add entry for Phase 6 completion
  - List deliverables: n8n node package, tests, documentation
  - Include version bump (suggest 0.1.0)

- [ ] **11.2** Update MASTER_PLAN.md
  - Phase 6 status: ✅ Complete (2026-03-08)
  - Update current phase to Phase 7

- [ ] **11.3** Create README in n8n-nodes-whatsapp-bridge/
  - Installation instructions (npm or manual)
  - Node descriptions: WhatsAppBridge and WhatsAppBridgeTrigger
  - Configuration: API key and base URL
  - Usage examples: screenshots or workflow snippets
  - Troubleshooting: common issues

- [ ] **11.4** Add inline code comments
  - Credential type: document properties
  - Action node: document operations and parameters
  - Trigger node: document webhook flow
  - Helper: document request building

- [ ] **11.5** Task #8 complete: Mark COMPLETE in TaskUpdate

---

## Final Verification

- [ ] **12.1** Code review
  - All TypeScript strict mode compliant
  - No `any` types unless unavoidable
  - Proper error handling throughout
  - Security checks (no hardcoded secrets, proper auth)

- [ ] **12.2** Security checklist
  - [ ] API key stored in credentials, never logged
  - [ ] Webhook signature verified on trigger
  - [ ] No HMAC secrets hardcoded
  - [ ] All user inputs validated before API calls
  - [ ] HTTPS enforced for webhook URLs (n8n standard)

- [ ] **12.3** Performance check
  - [ ] Send operation completes < 2 seconds
  - [ ] Queue operation completes < 1 second
  - [ ] Status check completes < 1 second
  - [ ] No memory leaks in tests

- [ ] **12.4** Final build and test
  - `npm run build` → 0 errors
  - `npm test` → all tests pass
  - `npm run lint` → 0 errors (if applicable)

- [ ] **12.5** Sign off
  - All tasks complete
  - Manual testing successful
  - Ready to move to Phase 7

---

## Summary

**Total Tasks:** 5 major deliverables × ~8-10 subtasks = ~40-50 items
**Estimated Hours:** 8-12 hours
**Status:** ⏳ Not Started → In Progress → Complete

**Key Milestones:**
- ✅ Phase directory + PROMPT/CHECKLIST created
- 🔄 Package structure + core files
- 🔄 Credentials and helpers
- 🔄 Action node
- 🔄 Trigger node
- ⬜ Unit tests (~20 tests)
- ⬜ Build and manual verification
- ⬜ Documentation updates

**Sign-off Ready When:**
- npm build succeeds with 0 errors
- npm test passes 100%
- Manual workflow testing confirmed
- CHANGELOG and MASTER_PLAN updated
