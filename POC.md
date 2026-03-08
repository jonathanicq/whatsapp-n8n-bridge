# lightWaha - POC (Proof of Concept)

## Status: ✅ Working

Simple REST API backend for WhatsApp integration using Express.js.

---

## Quick Start

```bash
# Start development server
npm run dev

# Server runs on http://localhost:3000
```

Server starts with mock WhatsApp client automatically. No QR code needed for POC.

---

## API Endpoints

### 1. Health Check
```bash
curl http://localhost:3000/health
```
Response:
```json
{ "status": "ok" }
```

### 2. Get Status
```bash
curl http://localhost:3000/status
```
Response:
```json
{
  "connected": true,
  "authenticated": true,
  "me": {
    "id": "5511987654321@c.us",
    "number": "5511987654321"
  }
}
```

### 3. Get QR Code
```bash
curl http://localhost:3000/qr
```
Response:
```json
{
  "qr": "https://api.qrserver.com/v1/create-qr-code/?..."
}
```

### 4. Send Message
```bash
curl -X POST http://localhost:3000/send \
  -H "Content-Type: application/json" \
  -d '{"to":"5511987654321", "text":"Hello!"}'
```
Response:
```json
{
  "success": true,
  "messageId": "msg_1234567890",
  "to": "5511987654321",
  "text": "Hello!",
  "timestamp": "2026-03-08T19:49:00Z"
}
```

### 5. Logout
```bash
curl -X POST http://localhost:3000/logout
```
Response:
```json
{
  "success": true,
  "message": "Logged out from WhatsApp"
}
```

### 6. Destroy Client
```bash
curl -X POST http://localhost:3000/destroy
```
Response:
```json
{
  "success": true,
  "message": "WhatsApp client destroyed"
}
```

---

## Architecture

### Current (POC)
```
Express Server
  └─ MockWhatsAppClient (simulates real client)
```

### Next (Production)
```
Express Server
  └─ RealWhatsAppClient (whatsapp-web.js)
      └─ Chromium Browser
```

The code is ready to switch from mock to real client when needed:
1. Uncomment `RealWhatsAppClient` in `src/server.ts`
2. Comment out `MockWhatsAppClient`
3. Run with Docker (provides Chromium)

---

## Code Structure

```
src/
└── server.ts          (only file for POC)
    ├─ MockWhatsAppClient class (for testing)
    ├─ RealWhatsAppClient class (commented, production-ready)
    ├─ 6 Express endpoints
    └─ Graceful shutdown handler
```

---

## What's Working

✅ Express server startup
✅ All 6 endpoints functional
✅ Mock WhatsApp client
✅ Error handling
✅ Graceful shutdown

---

## What's Next

1. **Docker Compose** - Add MySQL and Redis services
2. **Database** - Persist messages in MySQL
3. **Queue** - Redis message queue with retries
4. **Real WhatsApp** - Switch to real whatsapp-web.js client
5. **Tests** - Add unit and integration tests
6. **Deploy** - Production deployment

---

## Usage: Mock vs Real

### For Development (Mock)
```bash
npm run dev
# Uses MockWhatsAppClient - no browser needed
```

### For Production (Real)
Change `src/server.ts`:
1. Uncomment `RealWhatsAppClient` class
2. Comment out `MockWhatsAppClient` class
3. Update client initialization

Run with Docker:
```bash
docker compose up
# Chromium provided by Docker image
```

---

## File

- `src/server.ts` - Complete POC implementation (230 lines)
- `POC.md` - This file
- All other files remain unchanged from Phase 0

---

## Validation

Tested endpoints:
- ✅ GET /health
- ✅ GET /status
- ✅ GET /qr
- ✅ POST /send (message delivery)
- ✅ POST /logout
- ✅ POST /destroy

All endpoints working as designed.

---

## Git

Branch: `feature/phase-1-express-whatsapp`
Commit: POC implementation with REST API

Ready to merge after validation in production environment.
