# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-03-07

### Added (Phase 2: WhatsApp Integration)
- **WhatsApp Service**: Baileys-based wrapper with full lifecycle management
  - QR code generation and authentication
  - Automatic reconnection with exponential backoff (1s → 30s)
  - Event-driven architecture for message handling
  - Session management with Redis persistence (7-day TTL)
- **API Endpoints**:
  - `GET /whatsapp/qr` - Retrieve QR code for authentication
  - `GET /whatsapp/status` - Get connection and authentication status
  - `POST /whatsapp/logout` - Logout and clear session
- **Message Processing Pipeline**:
  - Message type detection (text, image, audio, video, document, sticker)
  - Content extraction and parsing
  - Format conversion to standardized WhatsAppMessage
- **Session Manager**:
  - Redis-based persistent session storage
  - Automatic auth state management
  - Session creation, loading, updating, deletion
- **Comprehensive Testing**:
  - 4 unit tests for session manager
  - 8 unit tests for message parser
  - 5 integration tests for WhatsApp API endpoints
  - All 17 tests passing
- **Documentation**:
  - `docs/WHATSAPP_SETUP.md` - Complete setup and usage guide
  - Updated `docs/ARCHITECTURE.md` with WhatsApp service architecture
- **Configuration**:
  - Fixed ESLint configuration for modern TypeScript
  - Added @types/qrcode and @types/supertest
  - Updated Jest config for uuid ESM module handling

### Changed
- Updated .eslintrc.json rule for comma-dangle (es5 → always-multiline)
- Converted TypeScript rules from error to warn level for external library compatibility
- Refactored middleware formatting and imports

### Fixed
- TypeScript compilation errors in database, redis, and error-handler configs
- ESLint configuration incompatibility with newer versions
- Jest uuid module ESM handling

### Security
- Environment-based secrets (.env configuration)
- WhatsApp session encryption in Redis
- No credential logging in event handlers
- Safe message content extraction

## [0.1.0] - 2026-03-07

### Added (Phase 1: Backend Infrastructure)
- Express.js application with TypeScript
- MySQL connection pool with automatic retry logic
- Redis client with async/await API
- Winston structured JSON logging
- Health check endpoints (`/health`, `/health/metrics`)
- Docker multi-stage build with non-root user
- Docker Compose setup with MySQL 8.0 and Redis 7.0
- ESLint and Prettier code quality tools
- Jest testing framework with mocking
- Git workflow with proper .gitignore
- Environment variable validation
- CORS middleware
- Error handling middleware
- Request logging middleware
- GitHub repository initialization

### Security
- Non-root Docker user execution
- Environment-based configuration
- No hardcoded secrets
- Proper error response handling
- Webhook signature verification with HMAC-SHA256

---

## [1.0.0] - YYYY-MM-DD

### Added
- [New feature or functionality added]
- [New endpoint/API added]
- [New component/module added]
- [New test coverage for X]
- [New documentation for Y]

### Changed
- [Change to existing functionality]
- [Updated dependency from version X to Y]
- [Improved performance of Z]
- [Refactored component A for better maintainability]

### Deprecated
- [Feature that will be removed in future version]
- [Old API endpoint that will be removed]

### Removed
- [Removed feature/functionality]
- [Removed deprecated API endpoint]
- [Removed unused dependency]

### Fixed
- [Bug fix with description]
- [Fix for issue #123]
- [Correction to incorrect behavior in X]
- [Security vulnerability patched]

### Security
- [Security patch for vulnerability X]
- [Updated dependency to fix CVE-YYYY-XXXXX]

---

## [0.2.0] - YYYY-MM-DD

### Added
- [New feature]
- [New functionality]

### Changed
- [Breaking change to API]
- [Updated implementation approach]

### Fixed
- [Bug fix]
- [Issue resolution]

---

## [0.1.0] - YYYY-MM-DD

### Added
- Initial release
- [Core feature 1]
- [Core feature 2]
- [Core feature 3]
- Basic documentation
- Initial test coverage

---

## Version Numbering Guide

**MAJOR.MINOR.PATCH** (e.g., 1.2.3)

- **MAJOR** version: Incompatible API changes or major functionality changes
- **MINOR** version: Added functionality in a backwards-compatible manner
- **PATCH** version: Backwards-compatible bug fixes

---

## Category Definitions

- **Added**: New features, functionality, or capabilities
- **Changed**: Changes to existing functionality (may include breaking changes)
- **Deprecated**: Features marked for removal in future versions
- **Removed**: Removed features or functionality
- **Fixed**: Bug fixes and issue resolutions
- **Security**: Security-related changes, patches, and updates

---

## Notes

- Each version should have a release date in YYYY-MM-DD format
- Link to compare versions: `[1.0.0]: https://github.com/username/repo/compare/v0.2.0...v1.0.0`
- Reference issues/PRs when applicable: `Fixed #123`, `See PR #456`
- Group related changes together under appropriate categories
- Keep descriptions concise but meaningful
- Update this file with every significant commit

---

## Comparison Links

[unreleased]: https://github.com/jonathanicq/whatsapp-n8n-bridge/compare/v0.0.0...HEAD
[0.0.0]: https://github.com/jonathanicq/whatsapp-n8n-bridge/releases/tag/v0.0.0
