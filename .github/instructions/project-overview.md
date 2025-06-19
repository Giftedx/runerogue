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

### Frontend

- **Phaser 3** - Game rendering engine
- **React** - UI components and menus
- **Vite** - Build tool and development server

### Backend

- **Node.js + TypeScript** - Server runtime
- **Colyseus** - Real-time multiplayer framework
- **Express** - REST API server
- **bitECS** - Entity Component System architecture

### Data & Storage

- **Prisma ORM** - Database abstraction

- **OSRS Wiki API** - Authentic game data

### Infrastructure

- **Turborepo** - Monorepo management
- **pnpm** - Package management
- **Jest** - Testing framework
- **Docker** - Containerization

## Project Structure

```
runerogue/
├── packages/
│   ├── osrs-data/          # OSRS formulas and data API (COMPLETE)
│   ├── game-server/        # Colyseus multiplayer server (COMPLETE)
│   └── shared/             # Shared types and utilities
├── server-ts/              # Main game implementation
│   ├── src/server/ecs/     # bitECS components and systems
│   ├── src/server/game/    # Core game logic
│   └── src/client/         # Client rendering and input
├── client/                 # React UI and Discord integration
└── docs/                   # Documentation and specifications
```

## Development Phases

### ✅ Phase 0: Foundation (COMPLETE)

- OSRS data pipeline with all combat formulas
- Colyseus multiplayer server infrastructure

- bitECS entity component system
- Comprehensive test suite (13/13 tests passing)
- API server with OSRS data endpoints

### 🎯 Phase 1: Multiplayer Prototype (CURRENT)

- Player movement and synchronization

- Real-time combat visualization
- Enemy spawning and AI
- Basic UI with health/prayer bars
- Discord activity integration

### 🚀 Phase 2: Core Gameplay (PLANNED)

- Full OSRS skill system
- Equipment and inventory
- Advanced prayer system
- Player progression and saves

### 📈 Phase 3: Polish & Launch (PLANNED)

- Performance optimization

- Advanced enemy types
- Social features and leaderboards
- Tutorial and onboarding
- Public Discord activity release

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

## Success Metrics

### Technical

- 60fps sustained with 4 players + 20 enemies
- <100ms server response time
- > 90% test coverage on game systems
- Zero production TypeScript errors

### Gameplay

- Combat feels authentic to OSRS players
- Smooth multiplayer synchronization
- Intuitive Discord activity integration

### Quality

- No game-breaking bugs
- Graceful error handling and recovery
- Clear user feedback for all actions
- Professional polish and presentation

## Current Status

- **OSRS Data Pipeline**: ✅ Complete - All formulas implemented and tested
- **Multiplayer Server**: ✅ Complete - Colyseus rooms operational
- **ECS Architecture**: ✅ Complete - 14 components, 10 systems
- **API Endpoints**: ✅ Complete - Full OSRS data access
- **Client Integration**: 🔄 In Progress - Connecting Phaser to Colyseus
- **Combat Visualization**: 🔄 In Progress - Rendering calculated damage
- **UI Development**: 🔄 In Progress - Health bars and game interface

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
