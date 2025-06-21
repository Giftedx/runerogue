---
applyTo: "**"
---

# RuneRogue Development Workflow

## Development Environment Setup

### Prerequisites

- Node.js 18+
- pnpm package manager (v8+)
- Git version control
- Discord Developer Account (for Activity testing)
- mkcert (for HTTPS certificates in development)

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd runerogue

# Install dependencies using pnpm workspaces
pnpm install

# Install mkcert for HTTPS certificates (required for Discord Activities)
# On Windows (with Chocolatey)
choco install mkcert

# On macOS
brew install mkcert

# On Linux
# Download from https://github.com/FiloSottile/mkcert/releases

# Install mkcert root certificate
mkcert -install

# Generate HTTPS certificates for local development
cd packages/phaser-client
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
cd ../..

# Copy certificates to server (if needed)
# Windows
copy packages\phaser-client\*.pem packages\server\
# Unix/macOS
cp packages/phaser-client/*.pem packages/server/
```

#### Automated Setup Script

Create a file `scripts/setup-dev.js`:

```javascript
#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const crypto = require("crypto");

// Check Node version
const nodeVersion = process.version.match(/^v(\d+)/)[1];
if (parseInt(nodeVersion) < 18) {
  console.error("❌ Node.js 18+ required. Current version:", process.version);
  process.exit(1);
}

// Check pnpm
try {
  execSync("pnpm --version", { stdio: "ignore" });
} catch {
  console.error("❌ pnpm not found. Install with: npm install -g pnpm");
  process.exit(1);
}

// Check mkcert
try {
  execSync("mkcert --version", { stdio: "ignore" });
} catch {
  console.error("❌ mkcert not found. Please install mkcert first.");
  console.log("Windows: choco install mkcert");
  console.log("macOS: brew install mkcert");
  console.log("Linux: https://github.com/FiloSottile/mkcert/releases");
  process.exit(1);
}

console.log("✅ Prerequisites checked");

// Install dependencies
console.log("📦 Installing dependencies...");
try {
  execSync("pnpm install", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

// Generate certificates
const clientPath = path.join(__dirname, "..", "packages", "phaser-client");
const serverPath = path.join(__dirname, "..", "packages", "server");

// Ensure directories exist
if (!fs.existsSync(clientPath)) {
  console.error(`❌ Client path not found: ${clientPath}`);
  process.exit(1);
}

if (!fs.existsSync(serverPath)) {
  console.error(`❌ Server path not found: ${serverPath}`);
  process.exit(1);
}

const keyPath = path.join(clientPath, "key.pem");
const certPath = path.join(clientPath, "cert.pem");

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log("🔐 Generating HTTPS certificates...");
  try {
    execSync("mkcert -install", { stdio: "inherit" });
    execSync(
      "mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1",
      {
        cwd: clientPath,
        stdio: "inherit",
      }
    );

    // Copy to server
    fs.copyFileSync(keyPath, path.join(serverPath, "key.pem"));
    fs.copyFileSync(certPath, path.join(serverPath, "cert.pem"));
    console.log("✅ Certificates generated and copied");
  } catch (error) {
    console.error("❌ Failed to generate certificates:", error.message);
    process.exit(1);
  }
} else {
  console.log("✅ Certificates already exist");
}

// Create .env files if they don't exist
const clientEnvPath = path.join(clientPath, ".env");
const serverEnvPath = path.join(serverPath, ".env");

if (!fs.existsSync(clientEnvPath)) {
  console.log("📝 Creating client .env file...");
  const clientEnv = `VITE_DISCORD_CLIENT_ID=your_discord_app_id
VITE_GAME_SERVER_URL=wss://localhost:2567
VITE_API_URL=https://localhost:2567
VITE_HTTPS_KEY=./key.pem
VITE_HTTPS_CERT=./cert.pem
`;
  fs.writeFileSync(clientEnvPath, clientEnv, "utf8");
}

if (!fs.existsSync(serverEnvPath)) {
  console.log("📝 Creating server .env file...");
  const jwtSecret = crypto.randomBytes(32).toString("hex");
  const serverEnv = `DISCORD_CLIENT_ID=your_discord_app_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://localhost:3000/auth/discord/callback
PORT=2567
NODE_ENV=development
JWT_SECRET=${jwtSecret}
HTTPS_KEY=./key.pem
HTTPS_CERT=./cert.pem
`;
  fs.writeFileSync(serverEnvPath, serverEnv, "utf8");
}

console.log("✅ Development environment setup complete!");
console.log("\n📋 Next steps:");
console.log("1. Update .env files with your Discord app credentials");
console.log('2. Run "pnpm dev" to start development servers');
```

Run with: `node scripts/setup-dev.js`

#### Environment Setup (Cross-platform)

```bash
# Windows (PowerShell)
# Create .env file for phaser-client
@"
VITE_DISCORD_CLIENT_ID=your_discord_app_id
VITE_GAME_SERVER_URL=wss://localhost:2567
VITE_API_URL=https://localhost:2567
VITE_HTTPS_KEY=./key.pem
VITE_HTTPS_CERT=./cert.pem
"@ | Out-File -FilePath packages\phaser-client\.env -Encoding utf8

# Create .env file for server
@"
DISCORD_CLIENT_ID=your_discord_app_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://localhost:3000/auth/discord/callback
PORT=2567
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
HTTPS_KEY=./key.pem
HTTPS_CERT=./cert.pem
"@ | Out-File -FilePath packages\server\.env -Encoding utf8

# Unix/macOS (bash)
cat > packages/phaser-client/.env << 'EOF'
VITE_DISCORD_CLIENT_ID=your_discord_app_id
VITE_GAME_SERVER_URL=wss://localhost:2567
VITE_API_URL=https://localhost:2567
VITE_HTTPS_KEY=./key.pem
VITE_HTTPS_CERT=./cert.pem
EOF

cat > packages/server/.env << 'EOF'
DISCORD_CLIENT_ID=your_discord_app_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://localhost:3000/auth/discord/callback
PORT=2567
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
HTTPS_KEY=./key.pem
HTTPS_CERT=./cert.pem
EOF

# Start development servers
pnpm dev
```

### Discord Application Setup

1. **Create Discord Application**

   - Go to https://discord.com/developers/applications
   - Click "New Application"
   - Name it "RuneRogue" (or your preferred name)
   - Note the Application ID and Public Key

2. **Configure OAuth2**

   In Discord Developer Portal:

   - Navigate to OAuth2 > General
   - Add redirect URLs:
     - `https://localhost:3000/auth/discord/callback` (development)
     - `https://your-domain.com/auth/discord/callback` (production)
   - Generate and save Client Secret

3. **Set Up Activity**

   Navigate to Activities section and configure:

   - Max Participants: 4
   - Supports Voice: Yes
   - Age Rating: E10+

4. **Add Test Users**

   In App Settings > App Testers:

   - Add your Discord user ID
   - Add team members' Discord IDs

## Daily Development Process

### 1. Start Development Session

```bash
# Pull latest changes
git pull origin main

# Clean install to avoid dependency issues
pnpm install --frozen-lockfile

# Run automated setup check
node scripts/setup-dev.js

# Start all services in parallel
pnpm dev

# Or start specific services
pnpm --filter @runerogue/server dev
pnpm --filter @runerogue/phaser-client dev
```

### 2. Test Discord Activity

1. Ensure Discord is running
2. Open Discord and enable Developer Mode (User Settings > Advanced > Developer Mode)
3. Join a test server and create or join a voice channel
4. Test your activity:
   - Click the Activities button (rocket icon) in voice channel
   - Search for your activity (may need to refresh)
   - Click to launch
5. Monitor console for errors using Discord DevTools (Ctrl+Shift+I in Discord client)

### 3. Run Tests Before Changes

```bash
# Run all tests across workspace (skip archived)
pnpm test -- --testPathIgnorePatterns="archived"

# Run tests for specific packages
pnpm --filter @runerogue/osrs-data test
pnpm --filter @runerogue/game-server test
pnpm --filter @runerogue/server test
pnpm --filter @runerogue/phaser-client test

# Run tests with specific file patterns
pnpm test -- packages/osrs-data/src/combat
pnpm test -- packages/game-server/src/systems

# Run tests with specific test name patterns
pnpm test -- -t "damage calculation"
pnpm test -- -t "OSRS"

# Run tests in watch mode
pnpm test -- --watch --testPathIgnorePatterns="archived"

# Run tests with coverage
pnpm test -- --coverage --testPathIgnorePatterns="archived"
```

### 4. Make Changes

- Follow TypeScript best practices
- Add comprehensive error handling
- Include JSDoc documentation
- Write unit tests for new features
- Validate OSRS mechanics against Wiki

### 5. Validate Changes

```bash
# Run tests (skip archived)
pnpm test -- --testPathIgnorePatterns="archived"

# Check TypeScript
pnpm type-check

# Lint code (when configured)
pnpm lint

# Format code (when configured)
pnpm format

# Build packages to check for errors
pnpm build
```

### 6. Commit Changes

```bash
# Stage changes
git add .

# Run pre-commit checks
pnpm precommit

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
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/combat-system

# Work on feature
# ... make changes ...

# Push for review
git push -u origin feature/combat-system

# Create pull request
# Review and merge to develop
```

## Code Review Process

### Before Submitting PR

- All relevant tests passing
- Code coverage maintained or improved
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
4. **Discord Activity Tests** - Discord SDK integration testing
5. **Multiplayer Tests** - Colyseus room and synchronization testing

### Test Execution

```bash
# Run all tests (excluding archived)
pnpm test -- --testPathIgnorePatterns="archived"

# Run tests for specific package
pnpm --filter @runerogue/osrs-data test
pnpm --filter @runerogue/game-server test
pnpm --filter @runerogue/server test

# Run tests with specific file patterns (use full paths)
pnpm test -- packages/osrs-data/src/combat
pnpm test -- packages/game-server/src/systems/player

# Run tests with specific test name patterns
pnpm test -- -t "damage calculation"
pnpm test -- -t "OSRS"

# Run with coverage (excluding archived)
pnpm test -- --coverage --testPathIgnorePatterns="archived"

# Run tests in watch mode during development
pnpm test -- --watch --testPathIgnorePatterns="archived"

# Run tests for a specific file
pnpm test -- packages/osrs-data/src/combat/combat.test.ts
```

### Test Standards

- **Core Packages**: Focus on packages/osrs-data and packages/game-server tests
- **OSRS Authenticity**: All combat calculations must match Wiki values exactly
- **Integration**: Client-server communication and data flow validation
- **Coverage Goals**: Aim for >90% coverage on core game logic

## Debugging Workflow

### Common Issues

1. **Discord Activity Not Loading**

   ```typescript
   // Check if running in Discord iframe
   if (!window.parent || window.parent === window) {
     console.warn("Not running in Discord Activity iframe");
     // Fallback to standalone mode for development
   }

   // Verify Discord SDK initialization
   try {
     await discordSdk.ready();
     console.log("Discord SDK ready");
   } catch (error) {
     console.error("Discord SDK initialization failed:", error);
   }
   ```

2. **Multiplayer Desync**

   - Check server authority validation
   - Verify state synchronization
   - Review client prediction logic
   - Enable Colyseus debug mode
   - Use Chrome DevTools Network tab to inspect WebSocket messages

3. **Performance Problems**

   - Profile with Chrome DevTools Performance tab
   - Check ECS system efficiency (if using bitECS)
   - Monitor memory usage with Chrome DevTools Memory tab
   - Use performance.mark() and performance.measure() for timing
   - Check for memory leaks in update loops

4. **OSRS Calculation Errors**

   - Compare against OSRS Wiki formulas
   - Validate input parameters and types
   - Check rounding and Math.floor() operations
   - Test edge cases (level 1, level 99, max bonuses)
   - Verify prayer and equipment bonus calculations

5. **Network Issues**

   - Monitor WebSocket connections in Network tab
   - Check Colyseus room state updates
   - Verify error handling and reconnection logic
   - Test with network throttling (Chrome DevTools)
   - Check for proper cleanup on disconnect

6. **TypeScript Workspace Issues**

   ```bash
   # Fix TypeScript project references
   pnpm -r exec tsc --build --clean
   pnpm -r exec rm -rf tsconfig.tsbuildinfo

   # Rebuild TypeScript projects
   pnpm -r exec tsc --build

   # Check for circular dependencies
   pnpm dlx madge --circular packages/*/src/index.ts

   # Verify all packages have correct exports
   pnpm -r exec node -e "console.log(require('./package.json').name + ': ' + Object.keys(require('./package.json').exports || {}).join(', '))"
   ```

### Debugging Tools

```bash
# Server debugging with Node.js inspector
node --inspect packages/server/dist/index.js

# Server debugging with breakpoints
node --inspect-brk packages/server/dist/index.js

# Client debugging
# 1. Open Chrome DevTools (F12)
# 2. Use Sources tab for breakpoints
# 3. Use Console for logging
# 4. Use Network tab for API/WebSocket monitoring
# 5. Use Application tab to check localStorage/sessionStorage

# Discord Activity debugging
# 1. Enable Developer Mode in Discord
# 2. Use Discord DevTools (Ctrl+Shift+I in Discord)
# 3. Check iframe communication in Console
# 4. Monitor postMessage events

# Colyseus monitor (if enabled)
# Visit http://localhost:2567/colyseus in development
```

## Performance Monitoring

### Key Metrics

- Server tick rate (target: 20 TPS minimum)
- Client frame rate (target: 60 FPS)
- Network latency (<100ms for good experience)
- Memory usage (stable, no leaks)
- Bundle size (monitor for regressions)

### Performance Commands

```bash
# Start server with Node.js debugging
node --inspect packages/server/dist/index.js

# Profile memory usage
node --inspect --heap-prof packages/server/dist/index.js

# Monitor performance using Chrome DevTools
# 1. Open chrome://inspect
# 2. Click "Open dedicated DevTools for Node"
# 3. Use Performance tab for CPU profiling
# 4. Use Memory tab for heap snapshots

# Analyze bundle size
pnpm --filter @runerogue/phaser-client build

# Check output (Windows)
dir packages\phaser-client\dist

# Check output (Unix/macOS)
du -sh packages/phaser-client/dist/*
```

### Performance Monitoring Script

Create a file `scripts/monitor-performance.js`:

```javascript
const { performance } = require("perf_hooks");
const os = require("os");

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      tickTimes: [],
      memoryUsage: [],
      cpuUsage: [],
    };
    this.lastCpuUsage = process.cpuUsage();
  }

  start() {
    // Monitor tick rate
    let lastTick = Date.now();
    setInterval(() => {
      const now = Date.now();
      const tickTime = now - lastTick;
      this.metrics.tickTimes.push(tickTime);

      // Keep only last 60 samples
      if (this.metrics.tickTimes.length > 60) {
        this.metrics.tickTimes.shift();
      }

      lastTick = now;
    }, 1000);

    // Monitor memory
    setInterval(() => {
      const mem = process.memoryUsage();
      this.metrics.memoryUsage.push({
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        external: mem.external,
      });

      if (this.metrics.memoryUsage.length > 60) {
        this.metrics.memoryUsage.shift();
      }
    }, 1000);

    // Monitor CPU
    setInterval(() => {
      const currentCpuUsage = process.cpuUsage(this.lastCpuUsage);
      const cpuPercent =
        (currentCpuUsage.user + currentCpuUsage.system) / 1000000; // Convert to seconds
      this.metrics.cpuUsage.push(cpuPercent);

      if (this.metrics.cpuUsage.length > 60) {
        this.metrics.cpuUsage.shift();
      }

      this.lastCpuUsage = process.cpuUsage();
    }, 1000);

    // Display stats
    setInterval(() => {
      this.displayStats();
    }, 5000);
  }

  displayStats() {
    console.clear();
    console.log("=== Performance Monitor ===");
    console.log(new Date().toLocaleTimeString());
    console.log("");

    // Tick rate stats
    if (this.metrics.tickTimes.length > 0) {
      const avgTick =
        this.metrics.tickTimes.reduce((a, b) => a + b, 0) /
        this.metrics.tickTimes.length;
      const minTick = Math.min(...this.metrics.tickTimes);
      const maxTick = Math.max(...this.metrics.tickTimes);
      console.log(
        `Tick Rate: ${(1000 / avgTick).toFixed(1)} TPS (min: ${minTick}ms, max: ${maxTick}ms)`
      );
    }

    // Memory stats
    if (this.metrics.memoryUsage.length > 0) {
      const latest =
        this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
      console.log(
        `Memory: RSS ${(latest.rss / 1024 / 1024).toFixed(1)}MB, Heap ${(latest.heapUsed / 1024 / 1024).toFixed(1)}MB`
      );
    }

    // CPU stats
    if (this.metrics.cpuUsage.length > 0) {
      const avgCpu =
        this.metrics.cpuUsage.reduce((a, b) => a + b, 0) /
        this.metrics.cpuUsage.length;
      console.log(`CPU: ${avgCpu.toFixed(1)}% average`);
    }

    // System stats
    const totalMem = os.totalmem() / 1024 / 1024 / 1024;
    const freeMem = os.freemem() / 1024 / 1024 / 1024;
    console.log(
      `System: ${freeMem.toFixed(1)}GB free of ${totalMem.toFixed(1)}GB`
    );
  }
}

const monitor = new PerformanceMonitor();
monitor.start();

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down performance monitor...");
  process.exit(0);
});
```

## Deployment Process

### Local Testing

```bash
# Build all packages
pnpm build

# Test production build locally
pnpm preview

# Run integration tests specifically
pnpm test -- --testNamePattern="integration" --testPathIgnorePatterns="archived"

# Verify build outputs (Windows)
dir packages\*\dist\

# Verify build outputs (Unix/macOS)
ls -la packages/*/dist/

# Test Discord Activity locally
# 1. Build the client
pnpm --filter @runerogue/phaser-client build

# 2. Serve with proper headers for Discord
npx serve packages/phaser-client/dist -p 3000 --cors --ssl-cert ./cert.pem --ssl-key ./key.pem
```

### Staging Deployment

```bash
# Ensure clean working directory
git status

# Build for production (Windows)
set NODE_ENV=production && pnpm build

# Build for production (Unix/macOS)
NODE_ENV=production pnpm build

# Run full test suite
pnpm test -- --testPathIgnorePatterns="archived"

# Deploy to staging (example with common platforms)
# Vercel
vercel --prod

# Netlify
netlify deploy --prod

# Custom server
rsync -avz --delete packages/server/dist/ user@staging-server:/app/server/
rsync -avz --delete packages/phaser-client/dist/ user@staging-server:/app/client/
```

### Production Deployment

```bash
# Ensure on main branch
git checkout main
git pull origin main

# Run all tests
pnpm test -- --testPathIgnorePatterns="archived"

# Build for production (Windows)
set NODE_ENV=production && pnpm build

# Build for production (Unix/macOS)
NODE_ENV=production pnpm build

# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Deploy to production
# GitHub Actions example
git push origin main  # Triggers deployment workflow

# Manual deployment
ssh user@production-server "cd /app && ./deploy.sh"
```

## Emergency Procedures

### Critical Bug Response

1. **Assess Impact**

   - Identify affected systems
   - Check error logs and monitoring
   - Determine severity level

2. **Create Hotfix**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-bug-description
   ```

3. **Implement Fix**

   - Make minimal necessary changes
   - Add regression test
   - Document the issue

4. **Fast-track Testing**

   ```bash
   pnpm test -- --testNamePattern="affected feature"
   pnpm build
   ```

5. **Deploy Immediately**

   - Skip normal review process if critical
   - Deploy to production
   - Monitor closely

6. **Post-mortem**
   - Document root cause
   - Update tests to prevent recurrence
   - Review process improvements

### Rollback Process

```bash
# Find last stable commit
git log --oneline -10

# Create rollback branch
git checkout <stable-commit-hash>
git checkout -b hotfix/emergency-rollback

# Build and test
pnpm install
pnpm build
pnpm test -- --testNamePattern="smoke"

# Deploy rollback
# Use your deployment process

# After stabilization
# Investigate and fix forward
```

## CI/CD Workflow

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Run tests
        run: pnpm test -- --testPathIgnorePatterns="archived" --coverage

      - name: Build
        run: pnpm build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        if: matrix.node-version == '18.x'
        with:
          files: ./coverage/lcov.info

  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint
```

## Resources and Documentation

### Internal Documentation

- **API Documentation**: `/packages/osrs-data/README.md`
- **Architecture Guide**: `/.github/instructions/architecture.instructions.md`
- **Core Standards**: `/.github/instructions/core-standards.instructions.md`
- **OSRS Mechanics**: `/packages/osrs-data/src/`
- **Test Examples**: `/packages/*/src/**/*.test.ts`
- **Discord Activity Setup**: `/packages/phaser-client/docs/discord-setup.md`

### External Resources

- [OSRS Wiki](https://oldschool.runescape.wiki/) - Game mechanics reference
- [Colyseus Docs](https://docs.colyseus.io/) - Multiplayer framework
- [Phaser Docs](https://photonstorm.github.io/phaser3-docs/) - Game engine
- [Discord Developer Portal](https://discord.com/developers/docs/activities/overview) - Discord Activities
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) - Language reference

### Quick Reference

```bash
# Development
pnpm dev                                # Start all dev servers
pnpm test -- --testPathIgnorePatterns="archived"  # Run tests (skip archived)
pnpm test -- --watch --testPathIgnorePatterns="archived"  # Test watch mode
pnpm test -- --coverage --testPathIgnorePatterns="archived"  # Test with coverage
pnpm build                              # Build all packages

# Package-specific
pnpm --filter <package-name> <command>  # Run command in specific package
pnpm --filter @runerogue/osrs-data test # Example: test osrs-data
pnpm -r exec tsc --noEmit              # Type check all packages

# Debugging
node --inspect packages/server/dist/index.js  # Debug server
chrome://inspect                              # Open Chrome DevTools for Node

# Git
git checkout -b feature/name            # Create feature branch
git commit -m "type: description"       # Commit with conventional message
git push -u origin feature/name         # Push new branch

# Utilities
pnpm why <package>                      # Check why package is installed
pnpm outdated                           # Check for outdated dependencies
pnpm audit                              # Security audit
pnpm store prune                        # Clean pnpm store
```

### Troubleshooting

**Installation Issues**

```bash
# Clear cache and reinstall (Windows)
rmdir /s /q node_modules pnpm-lock.yaml
for /d %i in (packages\*) do rmdir /s /q "%i\node_modules"
pnpm store prune
pnpm install

# Clear cache and reinstall (Unix/macOS)
rm -rf node_modules pnpm-lock.yaml packages/*/node_modules
pnpm store prune
pnpm install

# Verify Node version
node --version  # Should be 18+

# Check pnpm version
pnpm --version  # Should be 8+

# Verify mkcert installation
mkcert --version
```

**Build Errors**

```bash
# Clean build artifacts (Windows)
for /d %i in (packages\*) do rmdir /s /q "%i\dist"
for /d %i in (packages\*) do rmdir /s /q "%i\.turbo"
pnpm build

# Clean build artifacts (Unix/macOS)
pnpm -r exec rm -rf dist
pnpm -r exec rm -rf .turbo
pnpm build

# Check for TypeScript errors
pnpm -r exec tsc --noEmit
```

**Test Failures**

```bash
# Run specific test file with debugging
node --inspect-brk node_modules/.bin/jest packages/osrs-data/src/combat/combat.test.ts

# Run with verbose output
pnpm test -- --verbose packages/osrs-data/src/combat/combat.test.ts

# Clear Jest cache
pnpm test -- --clearCache
```

**Discord Activity Issues**

```bash
# Check Discord client ID (Windows)
echo %VITE_DISCORD_CLIENT_ID%

# Check Discord client ID (Unix/macOS)
echo $VITE_DISCORD_CLIENT_ID

# Verify HTTPS certificates
openssl x509 -in packages/phaser-client/cert.pem -text -noout

# Test HTTPS server
curl -k https://localhost:3000

# Test OAuth2 flow
curl -X POST https://discord.com/api/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_AUTH_CODE" \
  -d "redirect_uri=https://localhost:3000/auth/discord/callback"
```

**Certificate Issues**

```bash
# Regenerate certificates if expired
cd packages/phaser-client
rm -f *.pem
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
cd ../..

# Trust certificates manually (if mkcert -install didn't work)
# Windows: Double-click cert.pem > Install Certificate > Local Machine > Trusted Root
# macOS: Open Keychain Access > System > Import cert.pem
# Linux: Copy to /usr/local/share/ca-certificates/ and run update-ca-certificates
```

**pnpm Workspace Issues**

```bash
# Fix pnpm workspace linking
pnpm install --force

# Check workspace structure
pnpm ls -r --depth 0

# Verify all packages are linked correctly
pnpm why @runerogue/shared

# Fix peer dependency issues
pnpm install --strict-peer-dependencies=false

# Clean pnpm cache if corrupted
pnpm store prune
pnpm install --force
```

## Discord Activity Development

### Local Testing Workflow

1. **Start HTTPS Development Server**

   ```bash
   # Ensure certificates are generated (Windows)
   dir packages\phaser-client\*.pem

   # Ensure certificates are generated (Unix/macOS)
   ls packages/phaser-client/*.pem

   # Start with HTTPS
   pnpm --filter @runerogue/phaser-client dev

   # Verify HTTPS is working
   # Visit https://localhost:3000 and accept certificate
   ```

2. **Configure Discord Activity URL**

   In Discord Developer Portal:

   - Navigate to Activities > URL Mappings
   - Set development URL: `https://localhost:3000`

3. **Test in Discord**

   ```bash
   # Clear Discord cache if needed (Windows)
   rmdir /s /q %appdata%\discord\Cache

   # Clear Discord cache (macOS)
   rm -rf ~/Library/Caches/discord

   # Restart Discord after clearing cache
   ```

### Discord-Specific Debugging

1. **Activity Not Loading**

   ```typescript
   // Add debug logging to Discord initialization
   console.log("[Discord] Initializing SDK...");
   console.log("[Discord] Client ID:", process.env.VITE_DISCORD_CLIENT_ID);
   console.log("[Discord] Running in iframe:", window.parent !== window);
   console.log("[Discord] Protocol:", window.location.protocol);

   // Verify CSP headers
   // Check Network tab for blocked requests
   // Look for frame-ancestors violations
   ```

2. **OAuth2 Issues**

   ```bash
   # Test token exchange endpoint
   curl -X POST https://localhost:2567/api/discord/token \
     -H "Content-Type: application/json" \
     -d '{"code":"test_auth_code"}'

   # Verify redirect URI matches exactly
   # Check for trailing slashes
   # Ensure HTTPS in production
   ```

3. **WebSocket Connection Issues**

   ```typescript
   import * as Colyseus from "colyseus.js";

   // Add connection debugging
   const client = new Colyseus.Client(
     process.env.VITE_GAME_SERVER_URL || "wss://localhost:2567",
     {
       requestTimeout: 10000,
     }
   );

   // Note: Client error handling varies by Colyseus version
   // For v0.15.x:
   client
     .joinOrCreate("game_room", {})
     .then((room) => {
       console.log("[Colyseus] Connected to room:", room.id);
     })
     .catch((error) => {
       console.error("[Colyseus] Connection error:", error);
     });

   // Monitor in Chrome DevTools
   // Network tab > WS filter
   // Check for SSL certificate issues
   ```

### Common Discord Activity Issues

1. **Content Security Policy**

   ```typescript
   // Add to Vite config
   export default {
     server: {
       headers: {
         "Content-Security-Policy":
           "frame-ancestors https://discord.com https://discordapp.com",
       },
     },
   };
   ```

2. **CORS Issues**

   ```typescript
   import cors from "cors";
   import express from "express";

   const app = express();

   // Server CORS configuration
   app.use(
     cors({
       origin: [
         "https://discord.com",
         "https://discordapp.com",
         "https://localhost:3000",
         "null", // Discord iframe in development
       ],
       credentials: true,
     })
   );
   ```

3. **Activity Not Showing**

   - Verify URL mappings in Developer Portal
   - Check for console errors in Discord DevTools
   - Ensure activity is enabled for your test server
   - Clear Discord cache and restart client

### Discord Activity Best Practices

1. **Development Setup**

   - Always use HTTPS with valid certificates
   - Test in both standalone and Discord contexts
   - Monitor console for CSP violations

2. **Error Handling**

   - Gracefully handle Discord SDK initialization failures
   - Provide fallback for non-Discord environments
   - Log all Discord-specific errors for debugging

3. **Performance**
   - Minimize initial bundle size for faster loading
   - Lazy load non-critical assets
   - Use Discord's CDN for large assets when possible

## Summary

This development workflow guide provides comprehensive instructions for:

- Setting up the development environment with HTTPS certificates
- Creating and configuring Discord Applications
- Daily development processes and best practices
- Testing strategies and debugging techniques
- Performance monitoring and optimization
- Deployment procedures for staging and production
- Emergency response procedures

Remember to always test your Discord Activity in both development and production environments, and monitor for any CSP or CORS issues that may prevent proper loading within Discord's iframe context.
