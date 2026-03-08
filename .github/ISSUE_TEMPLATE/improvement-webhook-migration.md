---
name: "[IMPROVEMENT] Migrate Message Reception to Webhook Architecture"
about: Track migration from polling (Phase 2) to webhook architecture (Phase 3/4)
title: "[IMPROVEMENT] Migrate Message Reception from Polling to Webhook"
labels: ["enhancement", "architecture", "messaging"]
assignees: ''

---

## 📋 Summary

Migrate the message reception system from **Option 4 (Polling via REST API)** to **Option 3 (Webhook/Callback architecture)** while maintaining backwards compatibility.

## 🎯 Current State (Phase 1)

The lightWaha project provides a complete WhatsApp REST API bridge with:
- ✅ Message sending (`POST /send`)
- ✅ WhatsApp authentication (QR code)
- ✅ Connection status tracking
- ❌ **Missing**: Way to retrieve received messages via API

## 🔄 Phase 2: Start with Option 4 (Polling)

### Why Polling First?
- Simpler implementation
- Easy to test and verify
- No external dependencies
- Safe foundation for later webhook migration

### What Gets Implemented
```
GET /messages/new?since=timestamp
→ Returns: {messages: [...], cursor: ...}
```

### Timeline
- Estimated: 1-2 days
- No breaking changes to existing endpoints

## 🚀 Phase 3/4: Migrate to Option 3 (Webhook)

### Why Webhooks?
- Real-time delivery (~100ms vs 1-5s)
- More efficient (no wasted polls)
- Production-ready architecture
- Better scalability

### Key Features
```
POST /webhook/configure
→ Configure webhook endpoint

POST https://yourapp.com/webhook
→ lightWaha delivers messages in real-time
```

### Timeline
- Estimated: 2-3 days (after polling is stable)
- **IMPORTANT**: Polling stays for backwards compatibility

## ✅ Acceptance Criteria

### Phase 2 (Polling)
- [ ] Messages stored in memory queue
- [ ] `GET /messages/new?since=X` working
- [ ] Timestamp/cursor tracking correct
- [ ] Message ordering preserved
- [ ] Memory limit (1000 msgs) enforced
- [ ] Swagger documented
- [ ] Tests passing
- [ ] Can test with: `curl http://localhost:4000/messages/new?since=0`

### Phase 3/4 (Webhook)
- [ ] Webhooks configurable via API
- [ ] Messages delivered in real-time
- [ ] Retry logic (exponential backoff)
- [ ] Signature verification (HMAC-SHA256)
- [ ] Polling still works (backwards compatible)
- [ ] Webhook status tracking
- [ ] Comprehensive tests
- [ ] Documentation updated

## 📊 Architecture Comparison

| Factor | Polling (Op 4) | Webhook (Op 3) |
|--------|---|---|
| Latency | 1-5s | ~100ms |
| Efficiency | Medium | High |
| Complexity | Low | Medium |
| Phase | Phase 2 | Phase 3/4 |

## 🔗 Related Documents

- [Detailed Implementation Plan](../docs/IMPROVEMENT-MESSAGE-WEBHOOK.md)
- [Swagger Documentation](../swagger.yaml)

## 💬 Notes

- Zero breaking changes - both options can coexist
- Polling endpoint never removed
- Migration is incremental and safe
- Can upgrade anytime without client changes

---

**See [IMPROVEMENT-MESSAGE-WEBHOOK.md](../../docs/IMPROVEMENT-MESSAGE-WEBHOOK.md) for complete technical details.**
