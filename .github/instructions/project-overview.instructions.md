---
applyTo: "**"
---

# RuneRogue Project Overview

## What is RuneRogue?

RuneRogue is an OSRS-inspired multiplayer roguelike survival game designed as a Discord activity. It combines the authentic combat mechanics of Old School RuneScape with the fast-paced gameplay patterns of Vampire Survivors, creating a unique multiplayer experience.

## Core Concept

- **Genre**: Multiplayer roguelike survival with OSRS mechanics
- **Platform**: Discord Activity (web-based iframe application)
- **Players**: 2-4 players per room
- **Gameplay**: Survive waves of enemies using authentic OSRS combat, prayer, and skill systems
- **Progression**: OSRS-style XP and levels with equipment upgrades

## Technology Stack

### Backend

- **Node.js + TypeScript** - Server runtime with type safety
- **Colyseus** - Real-time multiplayer framework for game rooms
- **Express** - REST API server for OSRS data and static hosting
- **@colyseus/schema** - Efficient state synchronization
- **bitECS** - Entity Component System for game logic

### Frontend (Single Web Client)

- **Phaser 3** - Game rendering engine for 2D graphics
- **React 18** - UI framework for menus, HUD, and Discord integration
- **Tailwind CSS** - Styling that matches Discord's design language
- **Vite** - Modern build tool with fast HMR
- **@discord/embedded-app-sdk** - Official Discord integration
- **colyseus.js** - Client-side multiplayer connection
- **Zustand** - State management for UI components

### Data & Storage

- **OSRS Wiki API** - Authentic game data source
- **JSON Files** - Local game data storage
- **Express APIs** - Data access layer
- **PostgreSQL** - Player data persistence (future)
- **Redis** - Session management and caching (future)

### Infrastructure

- **pnpm workspaces** - Monorepo management
- **Jest** - Testing framework
- **Docker** - Containerization (production)
- **GitHub Actions** - CI/CD pipeline

## Project Structure

```
runerogue/
├── packages/
│   ├── osrs-data/          # OSRS formulas and data API ✅
│   ├── game-server/        # Colyseus multiplayer server ✅
│   ├── server/             # Main Express server ✅
│   ├── phaser-client/      # Web-based game client 🔄
│   └── shared/             # Shared types and utilities ✅
├── scripts/                # Build and utility scripts
├── docs/                   # Documentation and reports
└── .github/
    ├── workflows/          # CI/CD pipelines
    └── instructions/       # Development guidelines
```

## Development Phases

### ✅ Phase 0: Foundation (COMPLETE)

- OSRS data pipeline with combat formulas and Express API
- Colyseus multiplayer server infrastructure with basic rooms
- Shared types and utilities package
- Test framework setup (Jest) with mixed coverage

### 🎯 Phase 1: Discord Activity Prototype (CURRENT)

- Set up Discord Activity infrastructure
- Create unified web client with Phaser + React
- Implement real-time multiplayer connection
- Basic player movement and combat
- Discord authentication and presence

#### Phase 1 Action Items:

1. **Set Up Discord Activity** (Priority: CRITICAL - Week 1)

   ```bash
   # Install Discord SDK in phaser-client with latest stable version
   pnpm --filter @runerogue/phaser-client add @discord/embedded-app-sdk@1.2.0

   # Install required HTTPS development tools
   pnpm add -D -w @vitejs/plugin-basic-ssl
   ```

   - [ ] Create Discord application at https://discord.com/developers
   - [ ] Configure activity settings and OAuth2
   - [ ] Create `discord-activity.json` manifest
   - [ ] Implement Discord SDK initialization
   - [ ] Add OAuth2 redirect handler endpoint
   - [ ] Configure CSP headers for Discord iframe
   - [ ] Set up HTTPS for local development (required for Discord)

   **Validation**: Run `pnpm --filter @runerogue/phaser-client dev` and verify HTTPS certificate is loaded

2. **Refactor Client Architecture** (Priority: HIGH - Week 1-2)

   ```bash
   # Install required dependencies with versions
   pnpm --filter @runerogue/phaser-client add react@18.2.0 react-dom@18.2.0
   pnpm --filter @runerogue/phaser-client add -D @types/react@18.2.0 @types/react-dom@18.2.0
   pnpm --filter @runerogue/phaser-client add -D tailwindcss@3.4.0 postcss@8.4.33 autoprefixer@10.4.17 @vitejs/plugin-react@4.2.1
   pnpm --filter @runerogue/phaser-client add zustand@4.4.7
   pnpm --filter @runerogue/phaser-client add phaser@3.70.0
   ```

   - [ ] Install React and Tailwind in phaser-client
   - [ ] Create hybrid Phaser + React structure
   - [ ] Implement Discord-themed UI components
   - [ ] Set up Zustand for state management
   - [ ] Configure Vite for React + Phaser
   - [ ] Set up proper TypeScript configurations

   **Validation**: Run `pnpm --filter @runerogue/phaser-client type-check` with no errors

3. **Connect to Multiplayer Server** (Priority: HIGH - Week 2)

   ```bash
   # Install Colyseus client with exact version matching server
   pnpm --filter @runerogue/phaser-client add colyseus.js@0.15.0

   # Install WebSocket types
   pnpm --filter @runerogue/phaser-client add -D @types/ws@8.5.10
   ```

   - [ ] Create NetworkManager class
   - [ ] Implement room join/leave logic
   - [ ] Add state synchronization handlers
   - [ ] Create connection status UI
   - [ ] Implement reconnection logic
   - [ ] Add latency compensation

   **Validation**: Test connection between client and server with `pnpm dev` and check WebSocket connection in Chrome DevTools

4. **Implement Core Gameplay** (Priority: MEDIUM - Week 3)

   ```bash
   # No additional dependencies needed - verify all packages are installed
   pnpm install
   ```

   - [ ] Player spawning and movement
   - [ ] WASD/arrow key input handling
   - [ ] Basic combat with OSRS formulas
   - [ ] Health bars and damage numbers
   - [ ] Simple enemy AI
   - [ ] Collision detection
   - [ ] Basic animations

   **Validation**: Run game and verify player can move with WASD keys and health bar updates

### 🚀 Phase 2: Core Systems (PLANNED)

- Full OSRS skill system implementation
- Equipment and inventory management
- Advanced combat mechanics with prayers
- Wave-based enemy spawning
- Player progression and XP tracking

### 📈 Phase 3: Polish & Launch (PLANNED)

- Performance optimization for 60fps
- Advanced enemy AI and boss fights
- Social features and voice integration
- Discord Rich Presence
- Public release on Discord App Directory

## Key Principles

### OSRS Authenticity

- **Exact Formulas**: All calculations must match OSRS Wiki specifications
- **Authentic Mechanics**: Combat, prayer, and skill systems work exactly like OSRS
- **Verified Data**: Use real OSRS data from Wiki API, not approximations
- **Player Expectations**: OSRS players should feel at home

### Multiplayer Performance

- **60fps Target**: Smooth gameplay with 4 players and 20+ enemies
- **Server Authority**: All game state validated on server to prevent cheating
- **Low Latency**: Client prediction with server reconciliation
- **Scalable Architecture**: ECS design with bitECS for performance

### Discord Integration

- **Native Feel**: UI should feel like part of Discord
- **Voice Awareness**: Integrate with voice channels
- **Rich Presence**: Show game state in user profile
- **Social Features**: Easy invites and party formation
- **Activity Requirements**: Must work within Discord's iframe sandbox

## Success Metrics

### Technical

- 60fps sustained with 4 players + 20 enemies
- <100ms server response time
- > 90% test coverage on game systems
- Zero production TypeScript errors
- Smooth Discord Activity experience

### Gameplay

- Players can join, move, and fight collaboratively
- Combat feels authentic to OSRS players
- Smooth multiplayer synchronization
- Intuitive Discord integration

### Quality

- No game-breaking bugs
- Graceful error handling and recovery
- Clear user feedback for all actions
- Professional polish matching Discord's quality

## Current Status (Updated)

- **OSRS Data Pipeline**: ✅ Complete - All formulas implemented with Express API
- **Multiplayer Server**: ✅ Basic infrastructure - Colyseus rooms ready
- **Game Server**: ✅ Core implementation - ECS and game logic in place
- **Web Client**: ❌ Needs Complete Refactor - Current client is legacy, needs Phaser + React rebuild
- **Discord Integration**: ❌ Not Started - Critical for Phase 1
- **Client-Server Connection**: ❌ Not Implemented - Needed for multiplayer
- **Test Coverage**: ⚠️ Limited - 27 passing tests, 79 failing (mostly archived), needs major cleanup

### Immediate Priorities

1. **Create Discord Application** (Day 1)

   - Go to https://discord.com/developers/applications
   - Create new application named "RuneRogue"
   - Note the Application ID and Public Key
   - Configure OAuth2 redirect URLs:
     - Development: `https://localhost:3000/auth/discord/callback`
     - Production: `https://your-domain.com/auth/discord/callback`
   - Set up activity settings in the Discord Developer Portal:
     - Activity Type: Game
     - Max Participants: 4
     - Supports Voice: Yes
     - Platform Type: Web
   - Generate and secure client secret
   - **Important**: Add your Discord user as a tester in the app settings

2. **Set Up Development Environment** (Day 1-2)

   ```bash
   # Clean install
   rm -rf node_modules pnpm-lock.yaml packages/*/node_modules
   pnpm install

   # Install mkcert for HTTPS certificates (required for Discord Activities)
   # On Windows (with Chocolatey)
   choco install mkcert
   # On macOS
   brew install mkcert
   # On Linux - download from https://github.com/FiloSottile/mkcert/releases

   # Install mkcert root certificate
   mkcert -install

   # Generate HTTPS certificates for local development
   cd packages/phaser-client
   mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
   cd ../..

   # Copy certificates to server (cross-platform)
   # Windows
   copy packages\phaser-client\*.pem packages\server\
   # Unix/macOS
   cp packages/phaser-client/*.pem packages/server/
   ```

3. **Environment Setup** (Day 2)

   Create `.env` file in `packages/phaser-client/`:

   ```env
   VITE_DISCORD_CLIENT_ID=your_discord_app_id
   VITE_GAME_SERVER_URL=wss://localhost:2567
   VITE_API_URL=https://localhost:2567
   VITE_HTTPS_KEY=./key.pem
   VITE_HTTPS_CERT=./cert.pem
   ```

   Create `.env` file in `packages/server/`:

   ```env
   DISCORD_CLIENT_ID=your_discord_app_id
   DISCORD_CLIENT_SECRET=your_client_secret
   DISCORD_REDIRECT_URI=https://localhost:3000/auth/discord/callback
   PORT=2567
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_here
   HTTPS_KEY=./key.pem
   HTTPS_CERT=./cert.pem
   ```

4. **Start Development** (Day 2)

   ```bash
   # Start all services
   pnpm dev

   # Or start individually:
   # Terminal 1: Start game server
   pnpm --filter @runerogue/server dev

   # Terminal 2: Start web client
   pnpm --filter @runerogue/phaser-client dev
   ```

5. **Test Discord Activity** (Day 2)
   - Open Discord
   - Enable Developer Mode in settings (User Settings > Advanced > Developer Mode)
   - Create a test server or use existing
   - Join a voice channel
   - Click Activities button (rocket icon)
   - Find and launch your activity
   - Monitor console for errors

### Quick Development Commands

```bash
# Start all services
pnpm dev

# Start specific services
pnpm --filter @runerogue/server dev
pnpm --filter @runerogue/phaser-client dev

# Run tests (skip archived)
pnpm test -- --testPathIgnorePatterns="archived"

# Run tests in watch mode
pnpm test -- --watch --testPathIgnorePatterns="archived"

# Run tests with coverage
pnpm test -- --coverage --testPathIgnorePatterns="archived"

# Build for production
pnpm build

# Type check all packages
pnpm type-check

# Clean build artifacts
pnpm clean

# Full clean and reinstall
pnpm clean && rm -rf node_modules pnpm-lock.yaml && pnpm install

# Verify all dependencies
pnpm ls -r --depth 0

# Check for issues
pnpm audit

# Update dependencies
pnpm up -i -r --latest
```

## Current Testing Status (Updated)

Based on recent test runs:

- **Total Tests**: 106 tests across all packages
- **Passing Tests**: 27 tests (25%)
- **Failing Tests**: 79 tests (75%)
- **Main Issues**:
  - Most failing tests are in archived folders with missing dependencies
  - Active tests in core packages (osrs-data, game-server) are mostly passing
  - Client tests need complete rewrite after refactor

### Test Organization

- Active tests: `packages/*/src/**/*.test.ts` (excluding archived)
- Archived tests: `packages/*/src/archived/` (should be ignored or removed)
- Use `--testPathIgnorePatterns="archived"` to skip legacy tests

### Priority Testing Areas

1. **OSRS Calculations** (packages/osrs-data) - Must be 100% accurate
2. **Game Server Logic** (packages/game-server) - Core multiplayer functionality
3. **Client Integration** (packages/phaser-client) - After refactor is complete

## Troubleshooting

### Common Issues

1. **Discord Activity Not Loading**

   ```typescript
   // Check Discord SDK initialization
   import { DiscordSDK } from "@discord/embedded-app-sdk";

   const discordSdk = new DiscordSDK(process.env.VITE_DISCORD_CLIENT_ID!);

   // Ensure you're in a Discord environment
   if (!window.parent || window.parent === window) {
     console.warn("Not running in Discord iframe");
   }

   // Check for HTTPS (required for Discord Activities)
   if (location.protocol !== "https:") {
     console.error("Discord Activities require HTTPS");
   }

   // Verify CSP headers allow Discord
   // Add to Vite config or server headers:
   // Content-Security-Policy: frame-ancestors https://discord.com https://discordapp.com
   ```

2. **HTTPS Certificate Issues**

   ```bash
   # Regenerate certificates if needed
   cd packages/phaser-client
   rm -f *.pem
   mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
   cd ../..

   # Trust certificates (if mkcert -install didn't work)
   # Windows: Double-click cert.pem > Install Certificate > Local Machine > Trusted Root
   # macOS: Open Keychain Access > System > Import cert.pem
   # Linux: Copy to /usr/local/share/ca-certificates/ and run update-ca-certificates
   ```

3. **WebSocket Connection Failed**

   ```typescript
   // Verify server is running with WSS support
   // Check packages/server/src/index.ts:
   import { Server } from "colyseus";
   import { createServer } from "https";
   import cors from "cors";
   import fs from "fs";

   // For development with HTTPS
   const httpsServer = createServer(
     {
       key: fs.readFileSync("key.pem"),
       cert: fs.readFileSync("cert.pem"),
     },
     app,
   );

   const gameServer = new Server({
     server: httpsServer,
     express: app,
   });

   // Ensure CORS is configured for Discord
   app.use(
     cors({
       origin: [
         "https://discord.com",
         "https://discordapp.com",
         "https://localhost:3000",
         "null", // For Discord iframe in development
       ],
       credentials: true,
     }),
   );
   ```

4. **Build Errors**

   ```bash
   # Clear all caches and rebuild
   pnpm clean
   rm -rf packages/*/dist packages/*/.turbo packages/*/.vite
   pnpm install
   pnpm build

   # If TypeScript errors persist
   pnpm -r exec rm -rf tsconfig.tsbuildinfo
   pnpm -r exec tsc --build --clean
   ```

5. **Module Resolution Issues**

   ```bash
   # Check for missing types
   pnpm add -D @types/node @types/react @types/react-dom

   # Verify workspace dependencies
   pnpm -r exec tsc --noEmit

   # Update all TypeScript project references
   pnpm -r exec tsc --build
   ```

6. **Discord OAuth2 Issues**

   ```bash
   # Verify redirect URI matches exactly (including trailing slashes)
   # Test OAuth2 flow manually
   curl -X POST https://discord.com/api/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "client_id=${DISCORD_CLIENT_ID}" \
     -d "client_secret=${DISCORD_CLIENT_SECRET}" \
     -d "grant_type=authorization_code" \
     -d "code=YOUR_AUTH_CODE" \
     -d "redirect_uri=https://localhost:3000/auth/discord/callback"
   ```

## Architecture Quick Reference

### Package Responsibilities

- **osrs-data**: Combat formulas, item stats, OSRS calculations
- **game-server**: Colyseus rooms, game state, multiplayer logic
- **server**: Express server, API endpoints, WebSocket hosting, OAuth2
- **phaser-client**: Phaser game + React UI + Discord integration
- **shared**: Common types, interfaces, utilities

### Key Files to Create/Edit for Phase 1

1. **Discord Integration** (Priority 1):

   - `packages/phaser-client/src/discord/DiscordActivity.ts` - Main Discord SDK integration
   - `packages/phaser-client/src/discord/auth.ts` - OAuth2 authentication flow
   - `packages/phaser-client/src/discord/types.ts` - Discord-related TypeScript types
   - `packages/phaser-client/discord-activity.json` - Activity manifest
   - `packages/server/src/routes/discord.ts` - OAuth2 token exchange endpoint
   - `packages/server/src/middleware/discord-auth.ts` - Authentication middleware

2. **Client Architecture** (Priority 2):

   - `packages/phaser-client/src/main.tsx` - React entry point
   - `packages/phaser-client/src/game/PhaserGame.ts` - Phaser game initialization
   - `packages/phaser-client/src/ui/App.tsx` - Main React component
   - `packages/phaser-client/src/stores/gameStore.ts` - Zustand state management
   - `packages/phaser-client/vite.config.ts` - Vite configuration with HTTPS
   - `packages/phaser-client/tailwind.config.js` - Tailwind CSS setup
   - `packages/phaser-client/postcss.config.js` - PostCSS configuration
   - `packages/phaser-client/index.html` - Entry HTML template

3. **Multiplayer Connection** (Priority 3):
   - `packages/phaser-client/src/network/NetworkManager.ts` - Colyseus client wrapper
   - `packages/phaser-client/src/network/StateSync.ts` - State synchronization logic
   - `packages/phaser-client/src/network/types.ts` - Network-related types
   - `packages/game-server/src/rooms/GameRoom.ts` - Update room logic
   - `packages/game-server/src/schemas/GameState.ts` - Update state schema
   - `packages/shared/src/types/multiplayer.ts` - Shared multiplayer types

## Discord Activity Requirements

### Technical Requirements

- **HTTPS Required**: Even in development (use mkcert)
- **CSP Headers**: Must allow Discord as frame-ancestor
- **OAuth2 Flow**: Required for user authentication
- **WebSocket Support**: For real-time multiplayer (WSS in production)
- **Responsive Design**: Must work in Discord's resizable iframe
- **SDK Version**: Use latest stable version of @discord/embedded-app-sdk

### Activity Configuration

```json
{
  "name": "RuneRogue",
  "description": "OSRS-inspired multiplayer roguelike",
  "type": 0,
  "launch_options": {
    "default": {
      "handler": "/"
    }
  },
  "activity_configuration": {
    "supports_voice": true,
    "max_participants": 4,
    "requires_age_gate": false
  },
  "aliases": ["runerogue", "rr"],
  "supported_platforms": ["web"],
  "orientation_lock_state": "unlocked"
}
```

### Discord Developer Portal Settings

1. **OAuth2 Settings**:

   - Scopes: `identify`, `guilds`, `guilds.members.read`
   - Redirect URLs: Add both development and production URLs

2. **Activity Settings**:

   - Platform Type: Web
   - Activity Privacy: Public (after testing)
   - Age Gate: Not required
   - Max Participants: 4

3. **URL Mappings**:
   - Development: `https://localhost:3000`
   - Production: `https://your-domain.com`

## Next Steps After Phase 1

Once Discord Activity and basic multiplayer work:

1. **Enhanced Combat System**

   - Port all OSRS combat formulas
   - Add weapon types and attack styles
   - Implement prayer system
   - Add special attacks

2. **Enemy System**

   - Wave spawning mechanics
   - Different enemy types
   - Boss encounters
   - Loot drops

3. **Progression System**

   - XP and leveling
   - Skill unlocks
   - Equipment upgrades
   - Persistent progress

4. **Social Features**
   - Voice channel integration
   - Party system
   - Leaderboards
   - Achievements

## Resources

- [Discord Activities Documentation](https://discord.com/developers/docs/activities/overview)
- [Discord Embedded App SDK](https://discord.com/developers/docs/developer-tools/embedded-app-sdk)
- [Colyseus Documentation](https://docs.colyseus.io/)
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [OSRS Wiki](https://oldschool.runescape.wiki/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)
- [mkcert Documentation](https://github.com/FiloSottile/mkcert)

Remember: Focus on getting a working Discord Activity first, then iterate on gameplay features. The key is having something playable that showcases the core concept.
