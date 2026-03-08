# Contributing to WhatsApp n8n Bridge

Thank you for your interest in contributing! This project is open source and we welcome contributions from the community.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch**: `git checkout -b feature/your-feature`
4. **Make your changes** and commit with clear messages
5. **Push to your fork** and create a Pull Request

## Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose v2
- MySQL 8.0+ (for development)
- Redis 7.0+ (for development)

### Local Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Build TypeScript
npm run build

# Run development server
npm run dev
```

## Code Standards

### Style
- **Format**: Prettier (run `npm run format`)
- **Lint**: ESLint (run `npm run lint`)
- **Line length**: 100 characters max

### Naming Conventions
- **Files**: kebab-case (e.g., `whatsapp-service.ts`)
- **Variables**: camelCase
- **Classes**: PascalCase
- **Constants**: SCREAMING_SNAKE_CASE

### Testing
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Run: `npm test`
- Coverage: `npm run test:coverage`

## Commit Messages

Follow conventional commits:
```
type(scope): description

- type: feat, fix, docs, style, refactor, test, chore
- scope: component or module affected
- description: clear, imperative tense
```

Example:
```
feat(whatsapp-service): add message retry logic
```

## Pull Request Process

1. **Update README.md** if adding features
2. **Add tests** for new functionality
3. **Ensure all tests pass**: `npm test`
4. **Run linting**: `npm run lint`
5. **Update CHANGELOG.md** with your changes
6. **Provide clear PR description** with context and motivation

## Architecture

### Key Components
- **WhatsAppService**: Direct whatsapp-web.js wrapper
- **Controllers**: REST API endpoint handlers
- **Services**: Business logic layer
- **Database**: MySQL for persistence
- **Cache**: Redis for sessions and queuing

### Adding New Endpoints

1. Create controller method in `src/controllers/`
2. Add route in `src/routes/`
3. Update types in `src/utils/types.ts`
4. Add tests in `tests/`
5. Document in API Reference

## n8n Node Development

The n8n custom node is in `n8n-nodes-whatsapp-bridge/`:

```bash
cd n8n-nodes-whatsapp-bridge

# Build
npm run build

# Test
npm test

# Package
npm pack
```

## Security

- **Never commit secrets** (.env, credentials)
- **Always validate input** from external sources
- **Use environment variables** for sensitive config
- **No PII in logs** or error messages
- **Keep dependencies updated**: `npm audit fix`

## Issues

Found a bug? Have a feature request?

1. Check existing issues first
2. Provide clear reproduction steps
3. Include environment details (OS, Node version, etc.)
4. Attach logs if relevant

## Questions?

- Check existing documentation in `docs/`
- Review MASTER_PLAN.md for architecture decisions
- Look at existing code for patterns

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🙏
