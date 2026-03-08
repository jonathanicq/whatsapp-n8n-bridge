# [IMPROVEMENT] Migrate Message Reception from Polling to Webhook Architecture

**Status:** Planned for Phase 2
**Priority:** High
**Type:** Enhancement
**Complexity:** Medium
**Estimated Effort:** 3-4 hours

---

## 📋 Summary

Migrate the message reception system from **Option 4 (Polling via REST API)** to **Option 3 (Webhook/Callback architecture)** while maintaining backwards compatibility with the polling endpoint for existing integrations.

This improvement addresses the performance and scalability limitations of the polling model by transitioning to an event-driven, push-based message delivery system.

---

## 🎯 Current State (Phase 1)

### Architecture Overview
The lightWaha project currently implements a **complete WhatsApp REST API bridge** with the following capabilities:

**What It Does:**
```
WhatsApp Web.js Client ─────→ Browser Automation (Puppeteer/Chromium)
        ↓
    Receives messages via event listener
        ↓
    Logs to console
        ↓
    NO API endpoint to retrieve messages (MESSAGE GAP)
        ↓
    Sends messages via POST /send ✅
```

**Current Endpoints (Phase 1):**
- ✅ `GET /health` - Server health check
- ✅ `GET /status` - WhatsApp authentication status
- ✅ `GET /qr` - QR code (JSON)
- ✅ `GET /qr.html` - QR code (HTML UI)
- ✅ `POST /send` - Send WhatsApp messages
- ✅ `POST /logout` - Logout session
- ✅ `POST /destroy` - Destroy client
- ❌ **Missing**: Endpoint to retrieve received messages

### Current Limitation
Messages arrive at the server but cannot be accessed via the API. The message reception is **one-way and internal only**.

Example: When a WhatsApp user sends "Hello" to the authenticated account:
```
[MSG] 212244549910628@lid: Hello
```
This appears in server logs but has **no API access point**.

---

## 🔄 Phase 2: Option 4 Implementation (Polling - Starting Point)

### Why Start with Option 4?
1. **Simplicity**: Minimal implementation complexity
2. **Testing**: Easy to verify with curl commands
3. **No external dependencies**: Doesn't require client webhook URLs
4. **Learning opportunity**: Understand the message flow before adding complexity
5. **Quick POC**: Get message reception working in Phase 2
6. **Safe baseline**: Foundation for later webhook migration

### Architecture
```
WhatsApp Message
    ↓
whatsapp-web.js detects event
    ↓
Message stored in in-memory queue with timestamp
    ↓
Client polls: GET /messages/new?since=timestamp
    ↓
Returns: {messages: [{from, text, timestamp}], nextCursor}
    ↓
Client processes and marks as read
```

### Implementation Details (Phase 2)

**New Endpoints:**
```typescript
// Get messages since last check
GET /messages/new?since=1646000000000
Response: {
  success: true,
  messages: [
    {
      id: "message_id",
      from: "351910270614@c.us",
      fromName: "User Name",
      body: "Hello",
      timestamp: 1646000000000,
      isFromMe: false
    }
  ],
  cursor: 1646000000100
}

// Get message history (optional)
GET /messages?limit=50&offset=0
Response: {
  success: true,
  total: 150,
  messages: [...]
}

// Mark message as read (optional)
POST /messages/{messageId}/read
Response: {
  success: true,
  message: "Marked as read"
}
```

**Storage Mechanism:**
```typescript
class MessageQueue {
  private messages: Message[] = [];

  addMessage(msg: WAMessage) {
    this.messages.push({
      id: msg.id._serialized,
      from: msg.from,
      fromName: msg.author || "Unknown",
      body: msg.body,
      timestamp: msg.timestamp * 1000, // Convert to milliseconds
      isFromMe: msg.fromMe
    });

    // Keep only last 1000 messages in memory
    if (this.messages.length > 1000) {
      this.messages.shift();
    }
  }

  getNewMessages(since: number): Message[] {
    return this.messages.filter(m => m.timestamp > since);
  }
}
```

**Polling Flow Example:**
```
Client code (node.js/Python/etc):

  lastCheck = 0

  loop every 2 seconds:
    response = GET /messages/new?since={lastCheck}

    if response.messages:
      process(response.messages)
      lastCheck = response.cursor
```

**Limitations of Option 4:**
- 1-5 second delay between message arrival and retrieval
- Constant HTTP requests (resource overhead)
- Missing messages if polling stops
- Not optimal for high-volume scenarios

---

## 🎯 Phase 3/4: Option 3 Implementation (Webhook - Future Goal)

### Why Migrate to Webhooks?
1. **Real-time**: Messages delivered in ~100ms
2. **Efficient**: No wasted polling requests
3. **Scalable**: Better for high-volume deployments
4. **Push-based**: Event-driven architecture (modern standard)
5. **Lower latency**: Immediate message delivery
6. **Production-ready**: Industry standard for integrations

### Migration Architecture
```
Configuration Phase:
  Client: POST /webhook/configure
          { url: "https://myapp.com/messages/webhook" }

Message Reception Flow:
  WhatsApp Message
    ↓
  whatsapp-web.js detects event
    ↓
  lightWaha processes message
    ↓
  1. Store in queue (fallback)
    ↓
  2. Check if webhook configured
    ↓
  IF YES → POST to webhook URL
          (with retry logic, exponential backoff)
    ↓
  IF webhook fails → Message stays in queue
    ↓
  Polling still works as fallback
```

### New Endpoints (Added in Phase 3/4)
```typescript
// Configure webhook
POST /webhook/configure
Request: {
  url: "https://myapp.com/webhooks/whatsapp",
  events: ["message.received", "message.sent", "auth.ready"],
  secret: "your-webhook-secret-for-verification"
}
Response: {
  success: true,
  webhookId: "wh_123456"
}

// Test webhook
POST /webhook/test
Request: { webhookId: "wh_123456" }
Response: {
  success: true,
  testSent: true,
  message: "Test payload sent to webhook URL"
}

// Remove webhook
DELETE /webhook/{webhookId}
Response: { success: true }

// Webhook payload that lightWaha POSTs to your URL:
POST https://myapp.com/webhooks/whatsapp
Body: {
  event: "message.received",
  timestamp: 1646000000000,
  data: {
    messageId: "3EB08BE77018B4BF937709",
    from: "351910270614@c.us",
    fromName: "User Name",
    body: "Hello from webhook",
    timestamp: 1646000000000
  },
  signature: "sha256=abc123..." // For verification
}
```

### Webhook Features (Phase 3/4)
- **Event types**: `message.received`, `message.sent`, `auth.ready`, `auth.failed`, `connection.lost`
- **Retry logic**: Exponential backoff (3 retries)
- **Signature verification**: HMAC-SHA256 for security
- **Timeout**: 30 second timeout per request
- **Fallback**: Failed webhook messages stored in queue for polling
- **Status tracking**: GET /webhook/status to see delivery stats

### Backwards Compatibility
```typescript
// Old code (polling) - STILL WORKS:
GET /messages/new?since=1646000000000
→ Returns messages (with or without webhook configured)

// New code (webhook):
POST /webhook/configure
→ Configure webhook
→ Messages also POSTed in real-time
→ Polling still works as backup

// Best of both worlds:
- New clients use webhook for real-time
- Legacy clients use polling without changes
- If webhook fails, polling retrieves messages
- No breaking changes
```

---

## 📊 Comparison Summary

| Aspect | Option 4 (Polling) | Option 3 (Webhook) |
|--------|-------------------|-------------------|
| **Latency** | 1-5 seconds | ~100ms (real-time) |
| **Efficiency** | Many empty polls | Only when message arrives |
| **Scalability** | Good | Excellent |
| **Complexity** | Low | Medium |
| **External dependency** | None | Client webhook URL required |
| **Phase** | Phase 2 (now) | Phase 3/4 (future) |
| **Message loss risk** | Low (queued) | Medium (needs retry logic) |
| **Backwards compatible** | N/A | Yes, polling still works |

---

## 🛠️ Implementation Plan

### Phase 2: Option 4 (Polling)
**Timeline:** 1-2 days
1. Create `MessageQueue` class
2. Integrate with `this.client.on("message")` event
3. Add `GET /messages/new` endpoint
4. Add `GET /messages` endpoint (history)
5. Write tests for message reception
6. Update Swagger documentation
7. Update CHANGELOG.md
8. Commit and document

**Acceptance Criteria:**
- ✅ Messages stored in memory queue
- ✅ `GET /messages/new?since=X` returns new messages
- ✅ Cursor/timestamp tracking works correctly
- ✅ Queue maintains message order
- ✅ Memory limit (1000 messages) enforced
- ✅ Swagger documented
- ✅ Can be tested with curl

### Phase 3/4: Option 3 (Webhook) - Future
**Timeline:** 2-3 days (after polling is stable)
1. Create webhook configuration system
2. Add database schema for webhook configs
3. Implement webhook delivery with retry logic
4. Add signature verification (HMAC-SHA256)
5. Create webhook status tracking
6. Write integration tests
7. Update documentation
8. **Important:** Keep polling endpoint working (backwards compatibility)

**Acceptance Criteria:**
- ✅ Webhooks configurable via API
- ✅ Messages delivered to webhook in real-time
- ✅ Retry logic with exponential backoff
- ✅ Signature verification working
- ✅ Polling still functional (no breaking changes)
- ✅ Webhook status/stats available
- ✅ Test webhook functionality
- ✅ Comprehensive documentation

---

## 📝 Testing Strategy

### Phase 2 (Polling) Tests
```bash
# Test 1: Send message and retrieve via polling
curl -X POST http://localhost:4000/send \
  -H "Content-Type: application/json" \
  -d '{"to": "351910270614", "text": "Test"}'

# Simulate incoming message manually or via phone
# Then poll for it
curl http://localhost:4000/messages/new?since=0

# Expected: Message in response with correct timestamp and content
```

### Phase 3/4 (Webhook) Tests
```bash
# Test 1: Configure webhook
curl -X POST http://localhost:4000/webhook/configure \
  -H "Content-Type: application/json" \
  -d '{"url": "https://webhook.site/unique-id"}'

# Test 2: Send message (webhook should receive it)
curl -X POST http://localhost:4000/send \
  -H "Content-Type: application/json" \
  -d '{"to": "351910270614", "text": "Webhook test"}'

# Check webhook.site to verify payload received
# Expected: Webhook POST with message data and signature
```

---

## 📚 Related Files to Update

### Phase 2
- `src/server.ts` - Add MessageQueue, endpoints
- `swagger.yaml` - Document new endpoints
- `CHANGELOG.md` - Record message reception feature
- `package.json` - No new dependencies needed
- Tests - Add unit/integration tests

### Phase 3/4
- `src/server.ts` - Add webhook configuration, delivery
- `src/database.ts` - Webhook config persistence
- `swagger.yaml` - Document webhook endpoints
- `CHANGELOG.md` - Record webhook feature
- Tests - Add webhook retry/signature tests

---

## 🚀 Success Criteria

**Phase 2 (Option 4):**
- Messages can be received and retrieved via REST API
- Polling works reliably with proper timestamp tracking
- Backwards compatible (future changes don't break this)
- Documented in Swagger
- Tested and verified

**Phase 3/4 (Option 3):**
- Webhooks deliver messages in real-time (~100ms)
- Polling still works (backwards compatible)
- Retry logic handles transient failures
- Signature verification prevents spoofing
- Production-ready implementation

---

## 🔐 Security Considerations

### Phase 2 (Polling)
- ✅ No additional security needed
- ✅ Messages only in server memory
- ✅ Requires authentication (future: add API key)

### Phase 3/4 (Webhook)
- ⚠️ **CRITICAL**: Verify webhook signatures (HMAC-SHA256)
- ⚠️ **CRITICAL**: Validate webhook URLs (no localhost, no private IPs in prod)
- ✅ Timeout protection (30 seconds)
- ✅ Rate limiting on webhook delivery
- ✅ Webhook secret management (environment variable)
- ✅ TLS/SSL verification for webhook URLs

---

## 📖 References

- [Webhook Best Practices](https://webhooks.dev/)
- [HMAC-SHA256 Verification](https://tools.ietf.org/html/rfc2104)
- [Exponential Backoff](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)

---

## 💭 Notes

- **Decision**: Start with Option 4 for simplicity, upgrade to Option 3 for scale
- **Migration risk**: ZERO - both can coexist, polling never removed
- **Technical debt**: None - this is planned enhancement, not a fix
- **Future extensibility**: After webhook works, can add kafka/message queue for even higher volume

---

**Created:** 2026-03-08
**Last Updated:** 2026-03-08
**Labels:** `enhancement`, `architecture`, `messaging`, `phase-2`, `phase-3`, `webhook`
