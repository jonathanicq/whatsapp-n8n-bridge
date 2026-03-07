# Architecture Documentation

## Project Overview

WhatsApp-n8n Bridge is a Node.js/Express service that bridges WhatsApp messaging with n8n automation workflows.

## Directory Structure

```
src/
├── app.ts                    # Express application factory
├── server.ts                 # Server entry point & lifecycle management
├── config/                   # Configuration modules
│   ├── environment.ts        # Environment variable loading & validation
│   ├── database.ts           # MySQL connection pool
│   ├── logger.ts             # Winston logging setup
│   └── redis.ts              # Redis client configuration
├── middleware/               # Express middleware
│   ├── cors.ts              # CORS configuration
│   ├── logging.ts           # Request/response logging
│   ├── error-handler.ts     # Global error handling
│   └── auth.ts              # API key authentication (stub)
├── routes/                      # API routes
│   ├── index.ts                # Route aggregation
│   ├── health.ts               # Health check endpoints
│   └── whatsapp.ts             # WhatsApp API endpoints
├── controllers/                 # Route handlers
│   ├── health-controller.ts    # Health & metrics endpoints
│   └── whatsapp-controller.ts  # WhatsApp API handlers
├── services/                    # Business logic
│   ├── health-service.ts       # Health check & metrics service
│   ├── whatsapp-service.ts     # WhatsApp Baileys wrapper
│   └── session-manager.ts      # Session persistence layer
├── models/                      # Data models
│   ├── whatsapp-message.ts     # Message type definitions
│   └── whatsapp-session.ts     # Session type definitions
└── utils/                       # Utilities
    ├── types.ts                # TypeScript type definitions
    ├── constants.ts            # Application constants
    └── message-parser.ts       # Message parsing & conversion
```

## Architecture Patterns

### 1. Configuration Management
- Environment variables loaded via dotenv
- Validated at startup with clear error messages
- Singleton pattern for config access
- Lazy loading with caching

### 2. Logging
- Winston JSON format for structured logging
- Log levels: DEBUG, INFO, WARN, ERROR
- Console output in development, file output optional
- All errors logged with stack traces

### 3. Database
- MySQL connection pool for connection management
- Automatic retry logic for failed connections
- Connection validation on initialization
- Graceful shutdown with pool cleanup

### 4. Redis Cache
- Redis client for session/cache storage
- Automatic reconnection with exponential backoff
- Error handling without blocking main flow
- Graceful shutdown

### 5. Express Middleware Stack
```
Request
  ↓
CORS Middleware
  ↓
Body Parser (JSON/URL)
  ↓
Logging Middleware
  ↓
Auth Middleware (stub)
  ↓
Routes
  ↓
404 Handler
  ↓
Error Handler (catch-all)
  ↓
Response
```

### 6. Error Handling
- AppError class for typed errors
- Global error handler middleware
- No sensitive data in error responses
- Proper HTTP status codes

## Data Flow

### Health Check Flow
```
GET /health
    ↓
Health Controller
    ↓
Health Service
    ↓
Check Database Status ←→ Database Pool
Check Redis Status ←→ Redis Client
    ↓
Return Health Status (JSON)
```

### Metrics Flow
```
GET /health/metrics
    ↓
Metrics Controller
    ↓
Metrics Service
    ↓
Gather metrics (uptime, memory, version)
    ↓
Return Metrics (JSON)
```

### WhatsApp Authentication Flow
```
GET /whatsapp/qr
    ↓
WhatsApp Controller
    ↓
WhatsApp Service (Baileys)
    ↓
Generate QR Code (if not authenticated)
    ↓
Return QR as Data URI
```

### WhatsApp Message Handling Flow
```
WhatsApp Web
    ↓
Baileys Socket (Event: messages.upsert)
    ↓
Message Parser
    ├─ Detect message type
    ├─ Extract content
    └─ Convert to standard format
    ↓
Emit 'message' Event
    ↓
Event Listeners (in server.ts)
    └─ Log message received
    └─ (Future: Send to n8n)
```

### Session Management Flow
```
Authentication via QR
    ↓
Baileys generates auth credentials
    ↓
Session Manager saves to Redis
    ├─ TTL: 7 days
    └─ Encrypted in transit
    ↓
On next startup:
    └─ Load session from Redis
    └─ Resume connection without new QR
```

## Technology Choices

| Component | Technology | Reason |
|-----------|-----------|--------|
| Language | TypeScript | Type safety, better IDE support, catch errors early |
| Framework | Express.js | Minimal, flexible, large ecosystem |
| Database | MySQL | Relational data, reliable, widespread |
| Cache | Redis | Fast, message queuing (Phase 4), session management |
| Logging | Winston | Structured logging, multiple transports, flexible |
| Testing | Jest | Built-in TypeScript support, mocking, coverage |

## Security Considerations

- All credentials in environment variables (never hardcoded)
- CORS properly configured per environment
- Input validation via Express middleware
- No sensitive data in logs
- Non-root Docker user
- Health checks don't leak internal details

## Performance Considerations

- Connection pooling for database
- Lazy initialization of services
- Graceful shutdown with timeout
- Memory monitoring via metrics endpoint
- Efficient JSON logging format

## Scalability Notes

- Connection pool size configurable
- Stateless design allows horizontal scaling
- Redis enables shared state across instances
- No in-memory caching (Phase 4 will add Redis caching)

## Service Architecture (Phase 2)

### WhatsAppService (Singleton Pattern)
```
WhatsAppService extends EventEmitter
├── Lifecycle Management
│   ├── initialize() - Connect to Baileys
│   ├── disconnect() - Clean shutdown
│   └── logout() - Clear session
├── State Management
│   ├── currentQR - Cached QR code
│   ├── socket - Baileys socket instance
│   └── reconnectAttempts - Retry counter
├── Event Handlers
│   ├── connection.update - Connection/auth changes
│   ├── creds.update - Save credentials to Redis
│   ├── messages.upsert - New message received
│   └── Custom events: qr, connected, logout, reconnect_failed
└── Reconnection Logic
    ├── Exponential backoff: 1s, 2s, 5s, 10s, 30s
    └── Max 5 attempts before manual restart
```

### Message Parser Pipeline
```
Raw Baileys Message
├── Extract key info (sender, timestamp, id)
├── Detect message type
│   ├── conversation → text
│   ├── extendedTextMessage → text
│   ├── imageMessage → image
│   ├── audioMessage → audio
│   ├── videoMessage → video
│   ├── documentMessage → document
│   └── stickerMessage → sticker
├── Extract content per type
│   ├── text: message text
│   ├── image: caption, mimeType
│   ├── media: mimeType, url
│   └── etc.
└── Convert to WhatsAppMessage format
```

## Future Architecture Changes

- **Phase 3**: Add send message endpoint
- **Phase 4**: Add message queue layer
- **Phase 5**: Add webhook dispatcher
- **Phase 6**: Add custom n8n node
- **Phase 7**: Add rate limiting & quotas
- **Phase 8**: Add multi-session management
