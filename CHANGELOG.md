# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Phase 1: Backend Infrastructure (Express.js, TypeScript, Docker setup)
- Phase 2: WhatsApp Integration (Baileys library, session management)
- Phase 3: Core API Implementation (message send/receive endpoints)
- Phase 4: Redis Queue & Reliable Delivery
- Phase 5: Webhook system & n8n integration
- Phase 6: Custom n8n node development
- Phase 7: Testing & Documentation
- Phase 8: Production deployment & hardening

### Changed
- N/A (Initial setup)

### Fixed
- N/A (Initial setup)

### Security
- Environment-based secrets (.env configuration)
- WhatsApp session encryption in Redis
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
