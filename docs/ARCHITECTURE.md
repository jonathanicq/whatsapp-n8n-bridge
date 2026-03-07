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
├── routes/                   # API routes
│   ├── index.ts             # Route aggregation
│   └── health.ts            # Health check endpoints
├── controllers/              # Route handlers
│   └── health-controller.ts # Health & metrics endpoints
├── services/                 # Business logic
│   └── health-service.ts    # Health check & metrics service
└── utils/                    # Utilities
    ├── types.ts             # TypeScript type definitions
    └── constants.ts         # Application constants
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

## Future Architecture Changes

- **Phase 2**: Add WhatsApp integration service
- **Phase 3**: Add message processing pipeline
- **Phase 4**: Add message queue layer
- **Phase 5**: Add webhook dispatcher
- **Phase 6**: Add custom n8n node
