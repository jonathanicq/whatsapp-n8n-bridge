# Phase 1: Backend Infrastructure

**Phase Directory:** `phases/phase-1-backend-infrastructure/`
**Status:** Not Started
**Started:** [To be filled]
**Completed:** [To be filled]

---

## Phase Objective

Set up the Express.js backend with TypeScript, Docker containerization, and database connections. This phase establishes the foundation for all subsequent development, including API routing, middleware, logging, and health monitoring.

**This phase is complete when:** `npm run dev` starts the Express server successfully, Docker Compose brings up all services (MySQL, Redis, app) without errors, and health endpoints return proper responses.

---

## Context

**What was completed before this phase:**
- Project planning and architecture documented in PROJECT_CONFIG.md
- Tech stack decisions locked (Node.js, Express, TypeScript, MySQL, Redis)
- GitHub repository created and configured
- Project structure with phase directories created

**What depends on this phase:**
- Phase 2 (WhatsApp Integration) requires running Express app with database connections
- Phase 3 (API Implementation) requires working routing and middleware
- All future phases depend on this infrastructure

**Related Documentation:**
- PROJECT_CONFIG.md: Technology Stack, Code Style, Testing Strategy, Build Commands
- MASTER_PLAN.md: Phase 1 section
- CLAUDE.md: Development standards, Docker requirements

---

## Requirements

### Functional Requirements
1. Express.js application starts successfully and listens on port 3000
2. MySQL connection pool established and verified
3. Redis connection established and verified
4. Health check endpoint (`/health`) returns service status
5. Metrics endpoint (`/metrics`) returns basic service metrics
6. Environment variables properly loaded from .env file
7. TypeScript compiles without errors
8. Request/response logging implemented

### Non-Functional Requirements
- **Performance:** App startup < 5 seconds; health check response < 50ms
- **Security:** No hardcoded credentials; all secrets in .env; CORS configured
- **Reliability:** Graceful error handling; database connection retries
- **Maintainability:** Clean code structure; TypeScript strict mode; ESLint passing

---

## Deliverables

### Code Deliverables

**Project Structure:**
```
src/
├── app.ts                        # Express app configuration
├── server.ts                     # Server startup (entry point)
├── config/
│   ├── database.ts              # MySQL connection pool
│   ├── redis.ts                 # Redis client setup
│   ├── logger.ts                # Winston logger configuration
│   └── environment.ts           # Environment variable validation
├── middleware/
│   ├── error-handler.ts         # Global error handling
│   ├── cors.ts                  # CORS configuration
│   ├── logging.ts               # Request logging middleware
│   └── auth.ts                  # API key authentication (stub)
├── routes/
│   ├── health.ts                # Health check endpoints
│   └── index.ts                 # Route aggregation
├── controllers/
│   └── health-controller.ts     # Health endpoint logic
├── services/
│   └── health-service.ts        # Health check service
├── utils/
│   ├── types.ts                 # Shared TypeScript types
│   └── constants.ts             # App-wide constants
└── models/
    └── (empty - for Phase 3+)
```

**Configuration Files:**
```
Dockerfile                        # Multi-stage Docker build
compose.yaml                      # Docker Compose services (app, MySQL, Redis)
.prettierrc.json                  # Code formatting rules
.eslintrc.json                    # Linting rules
tsconfig.json                     # TypeScript configuration
jest.config.js                    # Jest testing configuration
```

### Test Deliverables
- [ ] Unit tests for logger configuration
- [ ] Unit tests for environment variable validation
- [ ] Integration tests for database connection
- [ ] Integration tests for Redis connection
- [ ] Integration tests for health endpoints

### Documentation Deliverables
- [ ] Update README.md with development setup instructions
- [ ] Create docs/ARCHITECTURE.md explaining project structure
- [ ] Update CHANGELOG.md with Phase 1 completion
- [ ] Add inline comments to complex configuration code

---

## Technical Approach

### Architecture

**Service Architecture:**
```
┌─────────────────────────────────────────┐
│          Express Application             │
│  ┌─────────────────────────────────────┐ │
│  │  Middleware Layer                    │ │
│  │  - CORS, Logging, Error Handler     │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │  Route Layer                         │ │
│  │  - /health, /metrics                │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │  Service Layer                       │ │
│  │  - Health checks, Metrics           │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         │                    │
         ▼                    ▼
    ┌─────────┐         ┌──────────┐
    │  MySQL  │         │  Redis   │
    │   8.0+  │         │  7.0+    │
    └─────────┘         └──────────┘
```

**Key Components:**
1. **app.ts** - Express application factory, middleware setup
2. **server.ts** - Server initialization and startup logic
3. **config/** - External service configuration (database, cache, logger)
4. **middleware/** - Request/response processing layer
5. **routes/** - API endpoint definitions
6. **services/** - Business logic and external service interactions

### Data Flow
```
HTTP Request
    ↓
CORS Middleware
    ↓
Logging Middleware
    ↓
Route Handler (Health Controller)
    ↓
Health Service (check DB, Cache)
    ↓
Database & Redis Connections
    ↓
Service Response
    ↓
HTTP Response (JSON)
```

### Technologies Used
- **Express.js 4.18+** - HTTP server framework
- **TypeScript 5.x** - Static typing for JavaScript
- **Winston 3.x** - Structured logging
- **mysql2 2.x** - MySQL driver with connection pooling
- **redis 4.x** - Redis client for caching/sessions
- **dotenv 16.x** - Environment variable management
- **Prettier 3.x** - Code formatting
- **ESLint 8.x** - Code linting
- **Jest 29.x** - Testing framework

---

## Implementation Tasks

See `CHECKLIST.md` for detailed task breakdown.

**High-level steps:**
1. Initialize Node.js project with package.json and dependencies
2. Set up TypeScript configuration (tsconfig.json, build scripts)
3. Create Express application with middleware stack
4. Configure MySQL connection pool with error handling
5. Configure Redis client with connection retry logic
6. Implement logging with Winston JSON format
7. Create health check endpoints and service
8. Create metrics endpoint for basic monitoring
9. Set up Docker and docker-compose files
10. Write unit and integration tests
11. Configure pre-commit hooks and linting
12. Document architecture and update README

---

## Testing Strategy

### Unit Tests
**What to test:**
- Logger initialization with different log levels
- Environment variable validation (required vars, defaults)
- Error handling middleware
- CORS configuration
- Health service calculations

**Test files:**
- `tests/unit/config/logger.unit.test.ts`
- `tests/unit/config/environment.unit.test.ts`
- `tests/unit/middleware/error-handler.unit.test.ts`
- `tests/unit/services/health-service.unit.test.ts`

### Integration Tests
**What to test:**
- MySQL connection pool initialization and basic queries
- Redis connection and basic operations
- Health endpoint returns proper response structure
- Metrics endpoint returns metrics
- Error handling for database connection failures
- Request logging captures all HTTP methods

**Test files:**
- `tests/integration/database.integration.test.ts`
- `tests/integration/redis.integration.test.ts`
- `tests/integration/health.integration.test.ts`

### Manual Testing Checklist
- [ ] `npm install` completes without errors
- [ ] `npm run build` compiles TypeScript successfully
- [ ] `npm run dev` starts server on port 3000
- [ ] `npm test` runs all tests and passes
- [ ] `docker compose build` succeeds
- [ ] `docker compose up` brings up all services
- [ ] `curl http://localhost:3000/health` returns 200 with status
- [ ] `curl http://localhost:3000/metrics` returns metrics
- [ ] Logs appear in JSON format on console
- [ ] Environment variables from .env are loaded correctly
- [ ] ESLint shows no errors: `npm run lint`
- [ ] Code formatting verified: `npm run format`

---

## Acceptance Criteria

**This phase passes if:**

1. **Functionality:**
   - [ ] Express app starts and listens on port 3000
   - [ ] MySQL connection pool connects successfully
   - [ ] Redis client connects successfully
   - [ ] GET /health returns 200 with health status
   - [ ] GET /metrics returns 200 with metrics data
   - [ ] Server gracefully handles connection errors

2. **Tests:**
   - [ ] All unit tests passing (`npm test -- --testPathPattern=\.unit\.test\.ts`)
   - [ ] All integration tests passing (`npm test -- --testPathPattern=\.integration\.test\.ts`)
   - [ ] Test coverage >= 80% for src/ directory
   - [ ] `npm test -- --coverage` generates coverage report

3. **Code Quality:**
   - [ ] Linter passes: `npm run lint` shows no errors
   - [ ] Code formatted: `npm run format` produces no changes
   - [ ] No console.log statements (use logger instead)
   - [ ] No hardcoded credentials or secrets in code
   - [ ] TypeScript strict mode enabled and no type errors

4. **Docker:**
   - [ ] `docker compose build` succeeds
   - [ ] `docker compose up` starts all services without errors
   - [ ] APP_ENV environment variable controls branch selection in docker-entrypoint.sh
   - [ ] Health check endpoint works in container
   - [ ] Logs visible in `docker compose logs app`

5. **Documentation:**
   - [ ] README.md updated with development setup
   - [ ] docs/ARCHITECTURE.md created explaining project structure
   - [ ] CHANGELOG.md updated with Phase 1 completion
   - [ ] Code comments explain complex logic
   - [ ] Environment variables documented in .env.example

6. **Security:**
   - [ ] All credentials in environment variables (not hardcoded)
   - [ ] .env in .gitignore (only .env.example committed)
   - [ ] CORS properly configured for local development
   - [ ] Connection strings use environment variables
   - [ ] Error messages don't leak sensitive information

---

## Dependencies

### Prerequisites (Must be complete before starting)
- [x] Phase 0 completed (project setup, GitHub repo)
- [x] Node.js 20+ installed locally
- [x] Docker installed
- [x] MySQL and Redis available (docker or remote)

### External Dependencies
- MySQL 8.0+ (docker service or remote)
- Redis 7.0+ (docker service or remote)
- Node package ecosystem (npm)

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|-----------|--------|---------------------|
| Docker network connectivity issues | Medium | High | Test docker compose on multiple machines; use named volumes |
| MySQL/Redis connection timeouts | Medium | High | Implement retry logic with exponential backoff; test connection pooling |
| Environment variable configuration errors | Low | Medium | Validate required env vars at startup; clear error messages |
| TypeScript compilation issues | Low | Medium | Use strict mode from start; catch errors early |
| Test mocking complexity | Medium | Low | Mock external services at integration test level only |

---

## Environment Variables

**New/Modified Environment Variables:**
```bash
# Application
PORT=3000
NODE_ENV=development
APP_ENV=development
LOG_LEVEL=info
LOG_FORMAT=json

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=whatsapp_bridge
DB_POOL_SIZE=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Logging
LOG_TO_FILE=false
LOG_DIR=./logs
```

**Update `.env.example` with these variables**

---

## Database Changes (if applicable)

**No database migrations in this phase.** Database is initialized by Docker Compose. Phase 1 only tests connectivity.

**Initialization Script (for Phase 3+):**
- Initial schema creation will happen in Phase 3
- Connection pooling tested in this phase

**Rollback Plan:**
- Delete Docker volumes: `docker compose down -v`
- Reinitialize: `docker compose up`

---

## Deployment Considerations

**Configuration Changes:**
- APP_ENV in docker-entrypoint.sh to control branch selection
- Environment variables for MySQL and Redis (internal docker services)
- Log output to JSON format for structured logging

**Infrastructure Changes:**
- Docker Compose services: app, mysql, redis (optional: local development only)
- Network: docker compose creates shared network
- Volumes: mysql data, redis data (persistent)

**Deployment Steps:**
1. Build Docker image: `docker compose build`
2. Start services: `docker compose up -d`
3. Verify health: `curl http://localhost:3000/health`
4. Check logs: `docker compose logs -f app`
5. Run tests in container: `docker compose exec app npm test`

---

## Rollback Plan

**If this phase fails or needs to be reverted:**
1. Stop services: `docker compose down`
2. Revert code changes: `git reset --hard HEAD~1`
3. Delete node_modules: `rm -rf node_modules`
4. Reinstall dependencies: `npm install`
5. Restart services: `docker compose up`

---

## Notes & Decisions

**Important decisions made during this phase:**
- **Node.js + Express** - Chosen for strong ecosystem with WhatsApp libraries (Baileys), WebSocket support (future)
- **TypeScript** - Strict typing reduces bugs and improves maintainability for long-term project
- **Winston Logger** - Industry-standard logging with JSON support for structured logs
- **Docker Compose** - Enables reproducible local development and easy deployment

**Lessons learned:**
- [To be filled during implementation]

**Technical debt created (if any):**
- [To be filled during implementation]

---

## Sign-off

**Phase started by:** Claude AI Developer
**Started date:** 2026-03-07
**Phase completed by:** [Name/Date]
**Verified by:** [Name/Date]

**Final status:** ⏳ In Progress (Ready to start implementation)

---

## Quick Start for Phase 1

Once you start working:

1. Read CHECKLIST.md for task-by-task breakdown
2. Create `package.json` with dependencies
3. Set up TypeScript configuration
4. Create Express app with middleware
5. Connect to MySQL and Redis
6. Write tests for each component
7. Check off tasks as you complete them
8. Update CHANGELOG.md with progress
9. Commit regularly to GitHub
10. When all tasks done, mark phase complete and move to Phase 2
