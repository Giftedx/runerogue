---
applyTo: "**"
---

# RuneRogue Project Overview

## What is RuneRogue?

RuneRogue is an OSRS-inspired multiplayer roguelike survival game designed as a Discord activity. It combines the authentic combat mechanics of Old School RuneScape with the fast-paced gameplay patterns of Vampire Survivors, creating a unique multiplayer experience.

## Core Concept

- **Genre**: Multiplayer roguelike survival with OSRS mechanics
- **Platform**: Discord Activity (web-based)
- **Players**: 2-4 players per room
- **Gameplay**: Survive waves of enemies using authentic OSRS combat, prayer, and skill systems
- **Progression**: OSRS-style XP and levels with equipment upgrades

## Technology Stack

### Backend

- **Node.js + TypeScript** - Server runtime
- **Colyseus** - Real-time multiplayer framework
- **Express** - REST API server
- **@colyseus/schema** - State synchronization

### Frontend

- **Phaser 3** - Game rendering engine (in packages/phaser-client)
- **Godot** - Alternative game client (in client/godot)
- **TypeScript** - Type-safe development
- **Vite** - Build tool for web clients

### Data & Storage

- **OSRS Wiki API** - Authentic game data
- **JSON Files** - Game data storage
- **Express APIs** - Data access layer

### Infrastructure

- **pnpm workspaces** - Monorepo management
- **Lerna** - Package coordination
- **Jest** - Testing framework

## Project Structure

```
runerogue/
├── packages/
│   ├── osrs-data/          # OSRS formulas and data API ✅
│   ├── game-server/        # Colyseus multiplayer server ✅
│   ├── server/             # Main server implementation ✅
│   ├── phaser-client/      # Web-based Phaser client ✅
│   └── shared/             # Shared types and utilities ✅
├── client/                 # Godot client and web UI
│   ├── godot/              # Godot game client
│   └── src/                # Web client source
├── scripts/                # Build and utility scripts
└── docs/                   # Documentation and reports
```

## Development Phases

### ✅ Phase 0: Foundation (COMPLETE)

- OSRS data pipeline with combat formulas and Express API
- Colyseus multiplayer server infrastructure with basic rooms
- Shared types and utilities package
- Test framework setup (Jest) with mixed coverage

### 🎯 Phase 1: Multiplayer Prototype (CURRENT)

- Fix failing tests and stabilize test coverage
- Complete client-server integration for both Phaser and Godot clients
- Implement real-time game state synchronization
- Basic player movement and interaction
- Simple UI with game status display

### 🚀 Phase 2: Core Gameplay (PLANNED)

- Full OSRS skill system implementation
- Equipment and inventory management
- Advanced combat mechanics
- Player progression and data persistence
- Enhanced graphics and visual effects

### 📈 Phase 3: Polish & Launch (PLANNED)

- Performance optimization and load testing
- Advanced enemy AI and spawning systems
- Social features and player interaction
- Discord Activity integration
- Public release and community features

## Key Principles

### OSRS Authenticity

- **Exact Formulas**: All calculations must match OSRS Wiki specifications
- **Authentic Mechanics**: Combat, prayer, and skill systems work exactly like OSRS
- **Verified Data**: Use real OSRS data from Wiki API, not approximations

- **Player Expectations**: OSRS players should feel at home

### Multiplayer Performance

- **60fps Target**: Smooth gameplay with 4 players and 20+ enemies
- **Server Authority**: All game state validated on server to prevent cheating
- **Low Latency**: Client prediction and smooth interpolation
- **Scalable Architecture**: Clean ECS design for future features

### Code Quality

- **Type Safety**: Strict TypeScript with comprehensive error handling
- **Test Coverage**: >90% coverage for all game logic
- **Documentation**: JSDoc comments and architectural documentation

- **Performance**: Profiled and optimized hot paths

## Success Metrics

### Technical

- 60fps sustained with 4 players + 20 enemies
- <100ms server response time
- > 90% test coverage on game systems
- Zero production TypeScript errors

### Gameplay

- Players can join, move, and fight collaboratively
- Combat feels authentic to OSRS players
- Smooth multiplayer synchronization
- Intuitive Discord activity integration

### Quality

- No game-breaking bugs
- Graceful error handling and recovery
- Clear user feedback for all actions
- Professional polish and presentation

## Current Status

- **OSRS Data Pipeline**: ✅ Complete - All formulas implemented, serving via Express API
- **Multiplayer Server**: ✅ Basic infrastructure - Colyseus rooms and schemas implemented
- **Game Server**: ✅ Core implementation - Located in packages/server with ECS and game logic
- **Phaser Client**: 🔄 In Progress - Web-based client with multiple demo implementations
- **Godot Client**: 🔄 In Progress - Alternative native client implementation
- **Client Integration**: ❌ Needs Work - Clients need connection to multiplayer server
- **Test Coverage**: ⚠️ Mixed - 27 passing, 79 failing tests (mostly archived legacy tests)

## Getting Started

1. **Clone Repository**: `git clone <repo-url>`
2. **Install Dependencies**: `pnpm install`
3. **Start Development**: `pnpm dev`
4. **Run Tests**: `pnpm test`
5. **View Documentation**: Check `/docs` folder

## Resources

- **OSRS Wiki**: Primary reference for all game mechanics
- **Colyseus Docs**: Multiplayer framework documentation
- **bitECS Guide**: Entity Component System patterns
- **Discord Activities**: Platform integration guide

Remember: This project combines modern multiplayer technology with classic OSRS authenticity. Every game mechanic must feel familiar to OSRS players while delivering smooth, responsive multiplayer gameplay.
