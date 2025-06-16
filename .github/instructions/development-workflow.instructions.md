---
applyTo: "**"
---

# RuneRogue Development Workflow

## Development Environment Setup

### Prerequisites

- Node.js 18+
- pnpm package manager
- PostgreSQL database
- Git version control

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd runerogue

# Install dependencies using pnpm workspaces
pnpm install

# Set up environment (optional - most packages work without .env)
cp env.template .env

# Start development servers
pnpm dev
```

## Daily Development Process

### 1. Start Development Session

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
pnpm install

# Start all services in parallel
pnpm dev
```

### 2. Run Tests Before Changes

```bash
# Run tests (currently mixed results - 27 passing, 79 failing)
pnpm test

# Run specific package tests
pnpm test --scope=@runerogue/osrs-data
pnpm test --scope=@runerogue/game-server

# Skip archived legacy tests that are failing
pnpm test --testPathIgnorePatterns="archived-tests"
```

### 3. Make Changes

- Follow TypeScript best practices
- Add comprehensive error handling
- Include JSDoc documentation
- Write unit tests for new features
- Validate OSRS mechanics against Wiki

### 4. Validate Changes

```bash
# Run tests
pnpm test

# Check TypeScript
pnpm type-check

# Lint code
pnpm lint

# Format code
pnpm format
```

### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: implement player movement system with client prediction"

# Push to feature branch
git push origin feature/player-movement
```

## Branch Strategy

### Main Branches

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Individual feature development
- `hotfix/*` - Critical bug fixes

### Feature Development

```bash
# Create feature branch
git checkout -b feature/combat-system

# Work on feature
# ... make changes ...

# Push for review
git push origin feature/combat-system

# Create pull request
# Review and merge to develop
```

## Code Review Process

### Before Submitting PR

- All tests passing
- Code coverage maintained
- OSRS mechanics validated
- Performance benchmarks met
- Documentation updated

### PR Requirements

- Descriptive title and description
- Link to related issues
- Screenshots/videos for UI changes
- Performance impact analysis
- Test results summary

### Review Checklist

- ✅ Code follows project standards
- ✅ Tests cover new functionality
- ✅ OSRS authenticity maintained
- ✅ Performance requirements met
- ✅ Security considerations addressed
- ✅ Documentation updated

## Testing Strategy

### Test Categories

1. **Unit Tests** - Package-specific functionality testing
2. **Integration Tests** - Cross-package and API testing
3. **OSRS Validation** - Combat formulas against Wiki data
4. **Client Tests** - Phaser and Godot client functionality
5. **Multiplayer Tests** - Colyseus room and synchronization testing

### Test Execution

```bash
# Run all tests (expect mixed results)
pnpm test

# Run tests for specific package
pnpm --filter @runerogue/osrs-data test
pnpm --filter @runerogue/game-server test

# Run tests excluding archived failures
pnpm test --testPathIgnorePatterns="archived-tests-legacy|archived-tests-debug"

# Run with coverage for working tests
pnpm test:coverage --testPathIgnorePatterns="archived"
```

### Test Standards

- **Core Packages**: Focus on packages/osrs-data and packages/game-server tests
- **OSRS Authenticity**: All combat calculations must match Wiki values exactly
- **Integration**: Client-server communication and data flow validation
- **Legacy Cleanup**: Archived tests with missing dependencies should be fixed or removed

## Debugging Workflow

### Common Issues

1. **Multiplayer Desync**

   - Check server authority validation
   - Verify state synchronization
   - Review client prediction logic

2. **Performance Problems**

   - Profile with Chrome DevTools
   - Check ECS system efficiency
   - Monitor memory usage

3. **OSRS Calculation Errors**

   - Compare against OSRS Wiki
   - Validate input parameters
   - Check rounding and floor operations

4. **Network Issues**
   - Monitor WebSocket connections
   - Check message batching
   - Verify error handling

### Debugging Tools

- Chrome DevTools for client debugging
- Node.js inspector for server debugging
- Colyseus dashboard for room monitoring
- Winston logs for structured logging

## Performance Monitoring

### Key Metrics

- Server tick rate (target: 20 TPS)
- Client frame rate (target: 60 FPS)
- Network latency (<100ms)
- Memory usage (stable)
- Test coverage (>90%)

### Monitoring Commands

```bash
# Performance profiling
pnpm profile

# Memory analysis
pnpm analyze

# Bundle size analysis
pnpm bundle-analyzer

# Load testing
pnpm load-test
```

## Deployment Process

### Development Deployment

```bash
# Build for development
pnpm build:dev

# Deploy to staging
pnpm deploy:staging

# Run smoke tests
pnpm test:smoke
```

### Production Deployment

```bash
# Build for production
pnpm build:prod

# Run full test suite
pnpm test:all

# Deploy to production
pnpm deploy:prod

# Monitor deployment
pnpm monitor
```

## Emergency Procedures

### Critical Bug Response

1. Identify and isolate the issue
2. Create hotfix branch from main
3. Implement minimal fix
4. Test thoroughly
5. Deploy immediately
6. Post-mortem analysis

### Rollback Process

```bash
# Rollback to previous version
pnpm rollback:last

# Rollback to specific version
pnpm rollback:version <version>

# Verify rollback success
pnpm verify:deployment
```

## Resources and Documentation

### Internal Documentation

- API documentation: `/docs/api`
- Architecture guide: `/docs/architecture`
- OSRS mechanics: `/docs/osrs`
- Testing guide: `/docs/testing`

### External Resources

- OSRS Wiki for game mechanics
- Colyseus documentation for multiplayer
- bitECS guide for entity systems
- Discord Activities for platform integration

Remember: Quality over speed. Take time to write proper tests, validate OSRS authenticity, and ensure multiplayer stability before pushing changes.
