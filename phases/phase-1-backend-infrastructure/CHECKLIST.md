# Phase 1 Checklist: Backend Infrastructure

**Phase:** Phase 1 - Backend Infrastructure
**Status:** Not Started
**Started:** [Date]
**Completed:** [Date or N/A]

---

## Quick Reference

**Current Task:** [Task currently being worked on]
**Last Checkpoint:** [Last completed task - for resuming if interrupted]
**Blockers:** [Any current blockers or issues]

---

## Setup & Prerequisites

- [ ] Read PROMPT.md for this phase
- [ ] Review PROJECT_CONFIG.md for relevant standards
- [ ] Verify Phase 0 is complete (GitHub repo created)
- [ ] Create feature branch: `git checkout -b feature/phase-1-backend-infrastructure`
- [ ] Ensure Node.js 20+ installed: `node --version`
- [ ] Ensure Docker installed: `docker --version`
- [ ] Ensure npm installed: `npm --version`
- [ ] Clone/navigate to project repo
- [ ] Create .env file from .env.example: `cp .env.example .env`
- [ ] Update .env with local credentials (DB, Redis)

---

## Section 1: Project Initialization

### Task 1.1: Initialize npm project and install dependencies
- [ ] Create `package.json` with project metadata
  - Name: whatsapp-n8n-bridge
  - Version: 0.0.1
  - Description: WhatsApp to n8n bridge service
  - Entry point: dist/server.js
  - Scripts: dev, build, start, test, lint, format
- [ ] Run `npm install` to initialize node_modules
- [ ] Files affected: `package.json`, `package-lock.json`
- [ ] Acceptance: `npm --version` and `npm list` show all packages installed

### Task 1.2: Install core dependencies
- [ ] Install Express: `npm install express@4.18.2`
- [ ] Install TypeScript: `npm install --save-dev typescript@5.3.3`
- [ ] Install type definitions: `npm install --save-dev @types/express @types/node`
- [ ] Install dotenv: `npm install dotenv@16.3.1`
- [ ] Install Winston logger: `npm install winston@3.11.0`
- [ ] Install MySQL2: `npm install mysql2@3.6.5`
- [ ] Install Redis: `npm install redis@4.6.10`
- [ ] Install CORS: `npm install cors@2.8.5`
- [ ] Files affected: `package.json`, `package-lock.json`
- [ ] Acceptance: `npm list` shows all dependencies; `package-lock.json` is committed

### Task 1.3: Install dev dependencies
- [ ] Install Jest: `npm install --save-dev jest@29.7.0 @types/jest ts-jest`
- [ ] Install ESLint: `npm install --save-dev eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser`
- [ ] Install Prettier: `npm install --save-dev prettier@3.1.0`
- [ ] Install ts-node: `npm install --save-dev ts-node@10.9.1`
- [ ] Install nodemon: `npm install --save-dev nodemon@3.0.2`
- [ ] Install Husky (pre-commit hooks): `npm install --save-dev husky lint-staged`
- [ ] Files affected: `package.json`, `package-lock.json`
- [ ] Acceptance: Dev dependencies appear in `package.json`; `npm run build` available

---

## Section 2: TypeScript Configuration

### Task 2.1: Create TypeScript configuration
- [ ] Create `tsconfig.json` with:
  - Strict mode enabled: `"strict": true`
  - Target: ES2020
  - Module: commonjs
  - Lib: [ES2020]
  - Outdir: dist
  - Rootdir: src
  - Skip lib check enabled
  - Resolve json module enabled
- [ ] Files affected: `tsconfig.json`
- [ ] Acceptance: `npx tsc --version` works; tsconfig validates

### Task 2.2: Create Jest configuration
- [ ] Create `jest.config.js` with:
  - Preset: ts-jest
  - testEnvironment: node
  - testMatch: [tests/**/*.test.ts]
  - coverageDirectory: coverage
  - collectCoverageFrom: [src/**/*.ts]
  - coverageThreshold: 80%
- [ ] Files affected: `jest.config.js`
- [ ] Acceptance: `npm test -- --showConfig` shows Jest config

### Task 2.3: Configure build scripts in package.json
- [ ] Add scripts:
  - `build`: `tsc`
  - `dev`: `nodemon --exec ts-node src/server.ts`
  - `start`: `node dist/server.js`
  - `test`: `jest`
  - `test:watch`: `jest --watch`
  - `lint`: `eslint src --ext .ts`
  - `format`: `prettier --write src`
- [ ] Files affected: `package.json`
- [ ] Acceptance: All scripts in package.json; `npm run build` compiles

---

## Section 3: Code Style & Linting

### Task 3.1: Create ESLint configuration
- [ ] Create `.eslintrc.json` with:
  - Parser: @typescript-eslint/parser
  - Extends: plugin:@typescript-eslint/recommended
  - Environment: { node: true, es2020: true }
  - Rules: no-console, no-unused-vars, semi, quotes
- [ ] Files affected: `.eslintrc.json`
- [ ] Acceptance: `npm run lint` runs without errors on new code

### Task 3.2: Create Prettier configuration
- [ ] Create `.prettierrc.json` with:
  - Semi: true
  - Quotes: double
  - TabWidth: 2
  - Trailing comma: es5
  - Arrow parens: always
- [ ] Files affected: `.prettierrc.json`
- [ ] Acceptance: `npm run format` formats code consistently

### Task 3.3: Set up pre-commit hooks
- [ ] Initialize Husky: `npx husky install`
- [ ] Create pre-commit hook: `npx husky add .husky/pre-commit "npx lint-staged"`
- [ ] Create `.lintstagedrc.json`:
  - src/**/*.ts: [eslint --fix, prettier --write]
- [ ] Files affected: `.husky/pre-commit`, `.lintstagedrc.json`
- [ ] Acceptance: Committing code triggers linter and formatter

---

## Section 4: Environment & Configuration

### Task 4.1: Create environment variable validation
- [ ] Create `src/config/environment.ts`
  - Load from .env using dotenv
  - Define required variables
  - Define optional variables with defaults
  - Validate on startup
  - Export as AppConfig type
- [ ] Files affected: `src/config/environment.ts`
- [ ] Acceptance: Script validates all required env vars; throws error if missing

### Task 4.2: Create database configuration
- [ ] Create `src/config/database.ts`
  - Create MySQL connection pool with mysql2/promise
  - Pool size from DB_POOL_SIZE env var (default: 10)
  - Connection retry logic with 3 attempts
  - Error handling and logging
  - Export pool instance
- [ ] Files affected: `src/config/database.ts`
- [ ] Acceptance: Database.getConnection() returns a connection; pool size correct

### Task 4.3: Create Redis configuration
- [ ] Create `src/config/redis.ts`
  - Create Redis client using redis package
  - Connect to Redis server
  - Error handling and reconnection logic
  - Test ping command on connect
  - Export client instance
- [ ] Files affected: `src/config/redis.ts`
- [ ] Acceptance: Redis.ping() returns "PONG"; client ready for commands

### Task 4.4: Create logging configuration
- [ ] Create `src/config/logger.ts`
  - Initialize Winston logger
  - JSON format for logs
  - Log level from LOG_LEVEL env var
  - Console transport
  - File transport if LOG_TO_FILE=true
  - Include timestamp, level, message, data
  - Export logger instance
- [ ] Files affected: `src/config/logger.ts`
- [ ] Acceptance: logger.info() produces JSON logs; rotates if file enabled

---

## Section 5: Express Application

### Task 5.1: Create Express application factory
- [ ] Create `src/app.ts`
  - Initialize Express app
  - Register middleware (CORS, logging, error handler)
  - Register routes
  - Return app instance
- [ ] Files affected: `src/app.ts`
- [ ] Acceptance: app starts without errors; middleware registered in correct order

### Task 5.2: Create middleware
- [ ] Create `src/middleware/cors.ts`
  - Enable CORS for localhost:3000 (dev)
  - Export middleware function

- [ ] Create `src/middleware/logging.ts`
  - Log all HTTP requests (method, path, status, duration)
  - Use Winston logger
  - Include request/response timing

- [ ] Create `src/middleware/error-handler.ts`
  - Global error handler for all errors
  - Log errors with full stack trace
  - Return error response with status code
  - Don't leak sensitive info in error messages

- [ ] Create `src/middleware/auth.ts`
  - Stub for API key authentication
  - Read API_KEY from header
  - Validate (to be implemented in Phase 3)

- [ ] Files affected: `src/middleware/*.ts`
- [ ] Acceptance: Middleware functions work independently; error handler catches exceptions

### Task 5.3: Create routes structure
- [ ] Create `src/routes/index.ts`
  - Aggregate all routes
  - Mount at appropriate paths

- [ ] Create `src/routes/health.ts`
  - Define health check endpoints
  - GET /health - basic health status
  - GET /metrics - service metrics

- [ ] Files affected: `src/routes/*.ts`
- [ ] Acceptance: Routes accessible at specified paths

---

## Section 6: Controllers & Services

### Task 6.1: Create health check service
- [ ] Create `src/services/health-service.ts`
  - Check MySQL connection
  - Check Redis connection
  - Return health status object with:
    - status: "healthy" | "degraded" | "unhealthy"
    - timestamp: ISO string
    - services: { mysql: bool, redis: bool }
    - uptime: seconds
  - Handle connection errors gracefully
- [ ] Files affected: `src/services/health-service.ts`
- [ ] Acceptance: Service returns correct structure; handles connection errors

### Task 6.2: Create health controller
- [ ] Create `src/controllers/health-controller.ts`
  - GET /health handler - call health service, return JSON
  - GET /metrics handler - return basic metrics (requests count, uptime, etc.)
  - Handle errors and return proper status codes
- [ ] Files affected: `src/controllers/health-controller.ts`
- [ ] Acceptance: Controllers return proper HTTP responses

---

## Section 7: Server Startup

### Task 7.1: Create server entry point
- [ ] Create `src/server.ts`
  - Load configuration (environment, logger, DB, Redis)
  - Create Express app
  - Start HTTP server on PORT env var
  - Add graceful shutdown handlers (SIGTERM, SIGINT)
  - On shutdown: close DB connections, close Redis, close server
  - Log startup and shutdown events
- [ ] Files affected: `src/server.ts`
- [ ] Acceptance: `npm run dev` starts server; listens on correct port; logs startup

### Task 7.2: Create main entry point
- [ ] Create src/index.ts or ensure server.ts is the main entry
  - Should just import and run server.ts
- [ ] Files affected: `src/index.ts`
- [ ] Acceptance: `npm start` runs compiled JavaScript

---

## Section 8: Docker Setup

### Task 8.1: Create Dockerfile
- [ ] Create `Dockerfile` with:
  - Multi-stage build (builder, runtime)
  - Base image: node:20-alpine
  - Working directory: /app
  - Copy package.json, install prod dependencies only
  - Copy source, build TypeScript
  - Runtime stage: copy dist from builder
  - Run as non-root user
  - EXPOSE 3000
  - CMD ["node", "dist/server.js"]
  - Health check using curl to /health
- [ ] Files affected: `Dockerfile`
- [ ] Acceptance: `docker build -t whatsapp-bridge .` succeeds

### Task 8.2: Create docker-entrypoint.sh
- [ ] Create `docker-entrypoint.sh`
  - Set branch based on APP_ENV
  - If APP_ENV=production: checkout master
  - If APP_ENV=development: checkout dev
  - Pull latest from origin
  - Run npm install (if needed)
  - Run npm build (if needed)
  - Start application
  - Handle errors gracefully
- [ ] Files affected: `docker-entrypoint.sh`
- [ ] Acceptance: Script runs without errors; selects correct branch

### Task 8.3: Create docker-compose configuration
- [ ] Create `compose.yaml` (no version field) with services:
  - **app:**
    - build: .
    - ports: [3000:3000]
    - environment: DB_HOST=mysql, REDIS_HOST=redis, APP_ENV
    - depends_on: [mysql, redis]
    - volumes: [./logs:/app/logs]
    - healthcheck: curl /health

  - **mysql:**
    - image: mysql:8.0
    - environment: MYSQL_ROOT_PASSWORD, MYSQL_DATABASE
    - ports: [3306:3306]
    - volumes: [mysql_data:/var/lib/mysql]

  - **redis:**
    - image: redis:7.0-alpine
    - ports: [6379:6379]
    - volumes: [redis_data:/data]

  - **volumes:** mysql_data, redis_data
- [ ] Files affected: `compose.yaml`
- [ ] Acceptance: `docker compose build` succeeds; `docker compose up` starts all services

### Task 8.4: Create .dockerignore
- [ ] Create `.dockerignore`
  - node_modules
  - npm-debug.log
  - .git
  - .gitignore
  - dist
  - coverage
  - .env (don't include secrets)
- [ ] Files affected: `.dockerignore`
- [ ] Acceptance: Docker build doesn't include unnecessary files

---

## Section 9: Unit Tests

### Task 9.1: Create test directory structure
- [ ] Create test directories:
  - `tests/unit/config/`
  - `tests/unit/middleware/`
  - `tests/unit/services/`
  - `tests/integration/`
- [ ] Files affected: Directory structure
- [ ] Acceptance: Directories created with proper nesting

### Task 9.2: Write unit tests for environment configuration
- [ ] Create `tests/unit/config/environment.unit.test.ts`
  - Test required variables present
  - Test optional variables with defaults
  - Test validation errors for missing required vars
  - Test parsing of numeric values
- [ ] Files affected: `tests/unit/config/environment.unit.test.ts`
- [ ] Acceptance: All tests pass; `npm test -- environment.unit` passes

### Task 9.3: Write unit tests for logger configuration
- [ ] Create `tests/unit/config/logger.unit.test.ts`
  - Test logger initialization
  - Test log level configuration
  - Test JSON format output
  - Test logger methods (info, error, warn, debug)
- [ ] Files affected: `tests/unit/config/logger.unit.test.ts`
- [ ] Acceptance: All tests pass

### Task 9.4: Write unit tests for middleware
- [ ] Create `tests/unit/middleware/error-handler.unit.test.ts`
  - Test error handling (catches errors)
  - Test response format
  - Test status codes
  - Test no sensitive data in response

- [ ] Create `tests/unit/middleware/cors.unit.test.ts`
  - Test CORS headers set correctly
  - Test origin validation

- [ ] Files affected: `tests/unit/middleware/*.test.ts`
- [ ] Acceptance: All middleware tests pass

### Task 9.5: Write unit tests for services
- [ ] Create `tests/unit/services/health-service.unit.test.ts`
  - Mock database connection
  - Mock Redis connection
  - Test health status when both available
  - Test degraded status when one fails
  - Test unhealthy status when both fail
- [ ] Files affected: `tests/unit/services/health-service.unit.test.ts`
- [ ] Acceptance: All service tests pass with mocks

---

## Section 10: Integration Tests

### Task 10.1: Write database integration tests
- [ ] Create `tests/integration/database.integration.test.ts`
  - Test connection pool creation
  - Test query execution
  - Test error handling for connection failures
  - Test pool size configuration
- [ ] Files affected: `tests/integration/database.integration.test.ts`
- [ ] Acceptance: Tests require real database; can skip if no DB available

### Task 10.2: Write Redis integration tests
- [ ] Create `tests/integration/redis.integration.test.ts`
  - Test connection to Redis
  - Test basic operations (SET, GET)
  - Test error handling
- [ ] Files affected: `tests/integration/redis.integration.test.ts`
- [ ] Acceptance: Tests require real Redis; can skip if not available

### Task 10.3: Write API endpoint integration tests
- [ ] Create `tests/integration/health.integration.test.ts`
  - Test GET /health returns 200
  - Test response structure
  - Test GET /metrics returns metrics
  - Mock external dependencies
- [ ] Files affected: `tests/integration/health.integration.test.ts`
- [ ] Acceptance: All API tests pass

---

## Section 11: Code Quality

### Task 11.1: Run linter and fix issues
- [ ] Run `npm run lint`
  - Fix all errors (not warnings)
  - Verify no console.log statements
  - Verify no any types without comments
- [ ] Files affected: All src/ files
- [ ] Acceptance: `npm run lint` shows zero errors

### Task 11.2: Format code with Prettier
- [ ] Run `npm run format`
  - Auto-format all src/ files
  - Verify consistent styling
- [ ] Files affected: All src/ files
- [ ] Acceptance: `npm run format` produces no changes on re-run

### Task 11.3: Run complete test suite
- [ ] Run `npm test`
  - All tests pass
  - Coverage meets 80% threshold
  - No skipped tests without reason
- [ ] Files affected: N/A
- [ ] Acceptance: `npm test -- --coverage` shows >= 80% coverage

### Task 11.4: Verify TypeScript compilation
- [ ] Run `npm run build`
  - TypeScript compiles without errors
  - All dist/ files generated
  - No type errors
- [ ] Files affected: dist/ directory
- [ ] Acceptance: `npm run build` completes with zero errors

---

## Section 12: Docker Verification

### Task 12.1: Build Docker image
- [ ] Run `docker compose build`
  - Image builds successfully
  - No build errors
  - Size reasonable (< 500MB)
- [ ] Files affected: Docker image
- [ ] Acceptance: `docker compose build` completes; image appears in `docker images`

### Task 12.2: Start Docker services
- [ ] Run `docker compose up -d`
  - All services start without errors
  - MySQL available on port 3306
  - Redis available on port 6379
  - App available on port 3000
  - Health check passes
- [ ] Files affected: Running containers
- [ ] Acceptance: `docker compose ps` shows all services running; healthy status

### Task 12.3: Test endpoints in Docker
- [ ] Test health endpoint:
  ```bash
  curl http://localhost:3000/health
  ```
  - Returns 200 with health status
  - Shows MySQL and Redis status

- [ ] Test metrics endpoint:
  ```bash
  curl http://localhost:3000/metrics
  ```
  - Returns 200 with metrics data

- [ ] Check logs:
  ```bash
  docker compose logs app
  ```
  - Shows startup messages
  - JSON formatted logs

- [ ] Acceptance: All endpoints respond correctly; logs appear in JSON

### Task 12.4: Test Docker shutdown and restart
- [ ] Run `docker compose down`
  - All services stop gracefully
  - No error messages

- [ ] Run `docker compose up` again
  - Services restart and reconnect successfully

- [ ] Acceptance: Services start and stop cleanly

---

## Section 13: Documentation

### Task 13.1: Update README.md
- [ ] Add sections:
  - Prerequisites (Node, Docker, Docker Compose)
  - Local development setup
  - Environment configuration
  - Running tests
  - Docker setup and usage
  - API endpoints overview (health, metrics)
  - Troubleshooting section
- [ ] Files affected: `README.md`
- [ ] Acceptance: README complete and clear

### Task 13.2: Create architecture documentation
- [ ] Create `docs/ARCHITECTURE.md`
  - Project structure explanation
  - Architecture diagram
  - Component responsibilities
  - Data flow
  - Technology choices
  - Design patterns used
- [ ] Files affected: `docs/ARCHITECTURE.md`
- [ ] Acceptance: Document explains project layout

### Task 13.3: Update CHANGELOG.md
- [ ] Add entry under [Unreleased] or new version:
  - Added: List all new features from Phase 1
  - Changed: Any config/structure changes
  - Fixed: Any bug fixes
  - Link to related commit(s)
- [ ] Files affected: `CHANGELOG.md`
- [ ] Acceptance: CHANGELOG updated with Phase 1 work

### Task 13.4: Document environment variables
- [ ] Update `.env.example` with all Phase 1 variables
  - Add comments explaining each variable
  - Include examples
- [ ] Create `docs/ENVIRONMENT_VARIABLES.md`
  - Document each variable
  - Explain required vs optional
  - Show defaults
- [ ] Files affected: `.env.example`, `docs/ENVIRONMENT_VARIABLES.md`
- [ ] Acceptance: All env vars documented

---

## Section 14: Git & Commit

### Task 14.1: Review all changes
- [ ] Run `git status` to see all changes
- [ ] Review `git diff` to verify changes
- [ ] Ensure no secrets or credentials in code
- [ ] Ensure all tests pass before commit
- [ ] Acceptance: Clean diff; no unintended changes

### Task 14.2: Create feature branch commits
- [ ] Make logical commits for related changes:
  - Commit 1: Initialize npm and TypeScript setup
  - Commit 2: Create Express app and middleware
  - Commit 3: Add database and Redis configuration
  - Commit 4: Add health check endpoints
  - Commit 5: Add Docker configuration
  - Commit 6: Add unit tests
  - Commit 7: Add integration tests
  - Commit 8: Update documentation
- [ ] Files affected: All modified files
- [ ] Acceptance: Each commit is atomic and buildable

### Task 14.3: Push feature branch to GitHub
- [ ] Push branch: `git push -u origin feature/phase-1-backend-infrastructure`
- [ ] Create pull request on GitHub with description
- [ ] Link to PROMPT.md and acceptance criteria
- [ ] Files affected: N/A (GitHub)
- [ ] Acceptance: PR visible on GitHub; branch tracking origin

### Task 14.4: Merge to dev branch
- [ ] After code review/approval, merge PR to dev:
  - Use `git checkout dev && git merge feature/phase-1-backend-infrastructure`
  - Or merge via GitHub PR UI
  - Delete feature branch after merge
- [ ] Push dev to GitHub: `git push origin dev`
- [ ] Files affected: dev branch
- [ ] Acceptance: Changes merged to dev; feature branch deleted

### Task 14.5: Update MASTER_PLAN.md
- [ ] Update Phase 1 status: ✅ Complete
- [ ] Update "Current Phase" to Phase 2
- [ ] Add completion date
- [ ] Files affected: `MASTER_PLAN.md` (root)
- [ ] Acceptance: MASTER_PLAN reflects current status

---

## Section 15: Phase Completion

### Task 15.1: Verify all acceptance criteria
- [ ] Checklist above fully completed
- [ ] All acceptance criteria from PROMPT.md met
- [ ] All tests passing locally and in Docker
- [ ] Documentation complete
- [ ] No technical debt left undocumented
- [ ] Code reviewed and linted
- [ ] Acceptance: All criteria verified ✅

### Task 15.2: Prepare for Phase 2
- [ ] Ensure dev branch is clean and pushed
- [ ] Create Phase 2 folder (already exists)
- [ ] Document any blockers or learnings
- [ ] Make note of any surprises
- [ ] Acceptance: Ready to start Phase 2

### Task 15.3: Sign off Phase 1
- [ ] Update this CHECKLIST.md:
  - Mark status as Complete
  - Set completed date
  - Add final notes

- [ ] Update PROMPT.md:
  - Mark status as Complete
  - Add sign-off information
  - Document lessons learned

- [ ] Files affected: `PROMPT.md`, `CHECKLIST.md`
- [ ] Acceptance: Phase 1 marked complete in documentation

---

## Notes & Observations

[To be filled during implementation]

---

## Issues Encountered

[To be filled during implementation]

---

## Time Tracking

| Task | Time Spent | Notes |
|------|-----------|-------|
| [Task] | [Hours] | [Notes] |

---

**Last Updated:** 2026-03-07
**Phase Status:** Ready to Start ⏳
