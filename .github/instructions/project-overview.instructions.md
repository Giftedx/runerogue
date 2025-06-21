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
│   ├── phaser-client/      # Web-based game client ✅
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

### 🎯 Phase 1: Discord Activity Prototype (CURRENT - Week 1-3)

**Goal**: Create a working Discord Activity with basic multiplayer functionality

**Status**:

- ✅ Discord Activity infrastructure complete
- ✅ Client foundation created and integrated
- ✅ Basic client-server connection implemented
- ⚠️ Test coverage needs improvement (27/106 passing)
- ⚠️ Core gameplay features partially complete

#### Phase 1 Checklist:

##### Week 1: Discord Setup & Client Foundation

- [x] Create Discord application and configure settings
- [x] Set up HTTPS certificates with mkcert
- [x] Install all required dependencies
- [x] Create Discord Activity manifest
- [x] Implement Discord SDK initialization
- [x] Set up React + Phaser hybrid architecture
- [x] Configure Vite with HTTPS support

##### Week 2: Multiplayer Integration

- [x] Implement NetworkManager for Colyseus
- [x] Create state synchronization handlers
- [x] Build connection status UI
- [x] Add reconnection logic
- [x] Test client-server communication
- [x] Implement basic latency compensation

##### Week 3: Core Gameplay (IN PROGRESS)

- [x] Player movement (WASD/arrows)
- [x] Basic combat with OSRS formulas
- [x] Health bars and UI elements
- [ ] Simple enemy spawning
- [ ] Collision detection
- [ ] Basic animations
- [ ] Wave progression system
- [ ] Death and respawn mechanics

### 🚀 Phase 2: Core Systems (PLANNED - Week 4-6)

- Full OSRS skill system implementation
- Equipment and inventory management
- Advanced combat mechanics with prayers
- Wave-based enemy spawning
- Player progression and XP tracking

### 📈 Phase 3: Polish & Launch (PLANNED - Week 7-8)

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

## Current Status Dashboard

### Package Status

| Package       | Status      | Tests      | Coverage | Notes                                   |
| ------------- | ----------- | ---------- | -------- | --------------------------------------- |
| osrs-data     | ✅ Complete | ✅ Passing | Good     | Combat formulas implemented             |
| game-server   | ✅ Complete | ✅ Passing | Good     | Basic rooms ready, needs enemy spawning |
| server        | ✅ Complete | ⚠️ Mixed   | Fair     | Discord routes implemented              |
| phaser-client | ⚠️ Active   | ⚠️ Mixed   | Fair     | Needs enemy rendering & collision       |
| shared        | ✅ Complete | ✅ Passing | Good     | Types defined                           |

### Critical Path Items (Phase 1)

1. **Discord Application Setup** - ✅ Complete
2. **HTTPS Certificates** - ✅ Complete
3. **Client Refactor** - ✅ Complete
4. **WebSocket Connection** - ✅ Complete
5. **Basic Gameplay** - ⚠️ In Progress
   - ✅ Player movement and combat
   - ⚠️ Enemy spawning (server-side logic needed)
   - ⚠️ Collision detection (Phaser physics setup needed)
   - ⚠️ Animations (sprite sheets needed)
6. **Discord Activity Config** - ✅ Complete (discord-activity.json created)

## Quick Start Guide

### Prerequisites Check

```bash
# Check Node.js version (need 18+)
node --version

# Check pnpm installation
pnpm --version || npm install -g pnpm

# Check mkcert installation (Windows)
where mkcert || echo "Install mkcert first!"

# Check mkcert installation (macOS/Linux)
which mkcert || echo "Install mkcert first!"
```

### Day 1: Discord & Environment Setup

1. **Create Discord Application**

   - Visit https://discord.com/developers/applications
   - Create new application "RuneRogue"
   - Save Application ID and Public Key
   - Navigate to OAuth2 > General
   - Add redirect URL: `https://localhost:3000/auth/discord/callback`
   - Generate and save Client Secret
   - Go to Bot section, create bot, save token
   - In App Settings > App Testers, add your Discord ID

2. **Generate HTTPS Certificates**

   ```bash
   # Install mkcert if needed
   # Windows: choco install mkcert
   # macOS: brew install mkcert
   # Linux: Download from GitHub releases

   # Install root certificate
   mkcert -install

   # Create certificate directory if it doesn't exist
   mkdir -p packages/phaser-client

   # Generate certificates
   cd packages/phaser-client
   mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
   cd ../..

   # Copy to server (Windows)
   copy packages\phaser-client\*.pem packages\server\

   # Copy to server (macOS/Linux)
   cp packages/phaser-client/*.pem packages/server/
   ```

3. **Configure Environment**

   For Windows (PowerShell):

   ```powershell
   # Create client .env
   @"
   VITE_DISCORD_CLIENT_ID=YOUR_APP_ID_HERE
   VITE_GAME_SERVER_URL=wss://localhost:2567
   VITE_API_URL=https://localhost:2567
   VITE_HTTPS_KEY=./key.pem
   VITE_HTTPS_CERT=./cert.pem
   "@ | Out-File -FilePath packages\phaser-client\.env -Encoding UTF8

   # Create server .env
   $jwtSecret = -join ((1..32) | ForEach {'{0:X2}' -f (Get-Random -Max 256)})
   @"
   DISCORD_CLIENT_ID=YOUR_APP_ID_HERE
   DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
   DISCORD_REDIRECT_URI=https://localhost:3000/auth/discord/callback
   PORT=2567
   NODE_ENV=development
   JWT_SECRET=$jwtSecret
   HTTPS_KEY=./key.pem
   HTTPS_CERT=./cert.pem
   "@ | Out-File -FilePath packages\server\.env -Encoding UTF8
   ```

   For macOS/Linux (Bash):

   ```bash
   # Create client .env
   cat > packages/phaser-client/.env << EOF
   VITE_DISCORD_CLIENT_ID=YOUR_APP_ID_HERE
   VITE_GAME_SERVER_URL=wss://localhost:2567
   VITE_API_URL=https://localhost:2567
   VITE_HTTPS_KEY=./key.pem
   VITE_HTTPS_CERT=./cert.pem
   EOF

   # Create server .env
   cat > packages/server/.env << EOF
   DISCORD_CLIENT_ID=YOUR_APP_ID_HERE
   DISCORD_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
   DISCORD_REDIRECT_URI=https://localhost:3000/auth/discord/callback
   PORT=2567
   NODE_ENV=development
   JWT_SECRET=$(openssl rand -hex 32)
   HTTPS_KEY=./key.pem
   HTTPS_CERT=./cert.pem
   EOF
   ```

### Day 2: Development Start

1. **Install Dependencies**

   ```bash
   # Clean install (Windows)
   rmdir /s /q node_modules 2>nul
   del pnpm-lock.yaml 2>nul
   for /d %i in (packages\*) do rmdir /s /q "%i\node_modules" 2>nul

   # Clean install (macOS/Linux)
   rm -rf node_modules pnpm-lock.yaml packages/*/node_modules

   # Install base dependencies
   pnpm install

   # Install Phase 1 dependencies
   pnpm --filter @runerogue/phaser-client add \
     @discord/embedded-app-sdk@1.2.0 \
     react@18.2.0 react-dom@18.2.0 \
     phaser@3.70.0 \
     colyseus.js@0.15.0 \
     zustand@4.4.7

   pnpm --filter @runerogue/phaser-client add -D \
     @types/react@18.2.0 @types/react-dom@18.2.0 \
     tailwindcss@3.4.0 postcss@8.4.33 autoprefixer@10.4.17 \
     @vitejs/plugin-react@4.2.1
   ```

2. **Start Development**

   ```bash
   # Terminal 1: Start all services
   pnpm dev

   # Terminal 2: Monitor logs (Windows)
   type packages\server\logs\*.log 2>nul

   # Terminal 2: Monitor logs (macOS/Linux)
   tail -f packages/*/logs/*.log 2>/dev/null
   ```

3. **Test Discord Activity**
   - Open Discord, enable Developer Mode (User Settings > Advanced > Developer Mode)
   - Join a voice channel in a test server
   - Click Activities button (rocket icon)
   - Your activity should appear (may need refresh)
   - Check browser console for errors (F12 in Discord)

## Immediate Action Items (Phase 1 - Week 3)

### 1. Complete Core Gameplay Features

The client foundation is complete. Critical remaining tasks:

#### Enemy Spawning System

- [ ] Create `Enemy` schema in `packages/game-server/src/schemas/GameState.ts`
- [ ] Implement `EnemySpawnSystem` in `packages/game-server/src/systems/`
- [ ] Add enemy types to `packages/shared/src/types/entities.ts`
- [ ] Create enemy sprite rendering in `packages/phaser-client/src/scenes/GameScene.ts`

#### Collision Detection

- [ ] Enable Arcade Physics in Phaser game config
- [ ] Add physics bodies to player and enemy sprites
- [ ] Implement collision handlers for:
  - Player-Enemy collisions (damage dealing)
  - Player-Projectile collisions
  - Enemy-Projectile collisions

#### Basic Animations

- [ ] Create or acquire sprite sheets for:
  - Player idle/walk/attack animations
  - Enemy movement animations
  - Attack/death effects
- [ ] Set up animation definitions in Phaser
- [ ] Trigger animations based on game state

#### Integration Tasks

- [ ] Import and use OSRS combat formulas from `@runerogue/osrs-data`
- [ ] Sync enemy positions from server to client
- [ ] Implement damage numbers display
- [ ] Add basic sound effects for combat

### 2. Implementation Guide for Enemy Spawning

Create the following files:

**Server-side (Colyseus)**:

```typescript
// packages/game-server/src/schemas/Enemy.ts
import { Schema, type } from "@colyseus/schema";

export class Enemy extends Schema {
  @type("string") id: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") health: number;
  @type("number") maxHealth: number;
  @type("string") type: string; // "goblin", "spider", etc.
}
```

**Client-side (Phaser)**:

```typescript
// packages/phaser-client/src/entities/EnemySprite.ts
export class EnemySprite extends Phaser.GameObjects.Sprite {
  // Implementation details
}
```

### 3. Testing Checklist

Before considering Phase 1 complete:

- [ ] 4 players can connect simultaneously
- [ ] Players can see each other move in real-time
- [ ] Enemies spawn and move toward players
- [ ] Combat damage is calculated using OSRS formulas
- [ ] Players can die and respawn
- [ ] Basic wave progression works
- [ ] Activity loads correctly in Discord
- [ ] No major performance issues with 4 players + 20 enemies

## Troubleshooting Quick Reference

### Common Issues & Solutions

| Issue                         | Solution                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Discord Activity not loading  | Check HTTPS certs, verify CSP headers, check console, ensure discord-activity.json exists |
| WebSocket connection failed   | Ensure server is running, check firewall, verify WSS URL                                  |
| HTTPS certificate errors      | Regenerate with mkcert, manually trust in OS                                              |
| Build errors                  | Clear caches: `pnpm clean && pnpm install`                                                |
| Test failures                 | Run with: `pnpm test -- --testPathIgnorePatterns="archived"`                              |
| Environment variables missing | Ensure .env files exist and have correct values                                           |
| Discord manifest not found    | Ensure .well-known/discord-activity.json is in public folder                              |
| Phaser not rendering          | Check canvas element exists, verify game config                                           |
| State sync issues             | Enable Colyseus debug mode, check schema definitions                                      |

### Debug Commands

```bash
# Check Discord connection
curl -k https://localhost:3000/health

# Verify Discord manifest is served
curl -k https://localhost:3000/.well-known/discord-activity.json

# Test WebSocket (install wscat first: npm install -g wscat)
wscat -c wss://localhost:2567

# View server logs (Windows)
type packages\server\logs\*.log

# View server logs (macOS/Linux)
tail -f packages/server/logs/*.log

# Check certificate validity
openssl x509 -in packages/phaser-client/cert.pem -text -noout

# Monitor Phaser performance
# In browser console: game.plugins.get('DebugPlugin').toggle()
```

## Architecture Overview

### Data Flow

```
Discord Client → iframe → React UI → Phaser Game → Colyseus Client
                                                          ↓
PostgreSQL ← Express API ← Game Server ← Colyseus Server ↓
```

### Key Components

- **Discord Activity**: Runs in iframe, uses Discord SDK
- **React UI**: Handles menus, HUD, chat, inventory
- **Phaser Game**: Renders game world and entities
- **Colyseus**: Manages real-time state synchronization
- **Express API**: Serves OSRS data and handles OAuth2

## Resources

### Documentation

- [Discord Activities Overview](https://discord.com/developers/docs/activities/overview)
- [Discord SDK Reference](https://discord.com/developers/docs/developer-tools/embedded-app-sdk)
- [Colyseus Getting Started](https://docs.colyseus.io/getting-started/)
- [Phaser 3 Examples](https://phaser.io/examples)
- [OSRS Wiki API](https://oldschool.runescape.wiki/w/RuneScape:Real-time_APIs)

### Support

- Discord Developer Server: [discord.gg/discord-developers](https://discord.gg/discord-developers)
- Project Issues: Create GitHub issue with logs
- OSRS Mechanics: Reference Wiki for exact formulas

---

**Remember**: Focus on getting a minimal Discord Activity working first. Everything else can be iterated on once you have players able to connect and see each other move.
