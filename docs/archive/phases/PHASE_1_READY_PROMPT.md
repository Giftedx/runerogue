# 🚀 RuneRogue Phase 1 Development Prompt

## PROJECT STATUS: PHASE 0 COMPLETE ✅

**All foundation tasks are now complete and running:**

### OSRS Data API (port 3001) ✅ WORKING
- 13/13 combat formula tests passing
- API endpoints responding correctly  
- All OSRS formulas validated against Wiki
- 5 enemy stat blocks complete

### Game Server (port 2567) ✅ WORKING  
- Colyseus server operational
- WebSocket connections working
- Room management active
- Winston logging operational

### ECS Architecture ✅ READY
- bitECS implementation with 14 components
- 10 complete systems (Combat, Prayer, Skills, Movement)
- Entity factory functions ready
- 335k+ ops/sec performance

---

## PHASE 1 MISSION: PLAYABLE PROTOTYPE

**Goal:** Create a playable multiplayer game where 2-4 players can move around and fight enemies using authentic OSRS mechanics.

### PRIORITY 1: CLIENT IMPLEMENTATION

**Task 1.1: Initialize Phaser 3 Client**
```bash
mkdir client && cd client
npm init -y
npm install phaser @colyseus/client vite typescript
```

Create basic Phaser 3 game with:
- Game canvas and scene management
- Asset loading pipeline
- TypeScript + Vite build system
- Basic player sprite rendering

**Task 1.2: Colyseus Client Connection**
- Connect to WebSocket server (port 2567)
- Real-time state synchronization
- Player input handling (click-to-move)
- Room joining mechanics

**Task 1.3: ECS Network Bridge**
- Create NetworkSyncSystem in `server-ts/src/server/ecs/systems/`
- Bridge bitECS world → Colyseus room state
- One-way data flow (ECS as source of truth)
- 60 TPS synchronization

### PRIORITY 2: CORE GAMEPLAY

**Task 2.1: Player Movement**
- Click-to-move mechanics (OSRS style)
- Server-side position validation
- Smooth client interpolation
- Grid-based pathfinding

**Task 2.2: Enemy System**
- Spawn 5 enemy types using osrs-data
- Basic combat AI with targeting
- Wave-based spawning (Vampire Survivors style)
- Enemy movement and pathfinding

**Task 2.3: Auto-Combat**
- Use OSRS combat formulas from packages/osrs-data
- Auto-attack nearest enemy
- Visual damage numbers
- XP gain and level-up notifications

### PRIORITY 3: MISSING SYSTEMS

**Complete ECS Systems:**
- SpawnSystem for entity creation
- DeathSystem for respawn mechanics
- LootSystem for item drops
- InventorySystem (28-slot OSRS inventory)

**UI Implementation:**
- HP bars and minimap
- Inventory interface
- Combat stats display
- Basic chat system

---

## TECHNICAL REQUIREMENTS

**Performance Targets:**
- Client: 60 FPS rendering
- Server: 60 TPS with 4 players
- Network: <50ms latency

**Technology Stack:**
- Client: Phaser 3 + TypeScript + Vite
- Server: Node.js + Colyseus + bitECS
- Data: Existing OSRS formulas (validated)

---

## FILES TO EXAMINE

**Current working systems:**
1. `packages/osrs-data/src/calculators/combat.ts` - Combat formulas
2. `packages/osrs-data/src/api/server.ts` - API endpoints
3. `server-ts/src/server/ecs/` - ECS architecture
4. `packages/game-server/src/rooms/RuneRogueRoom.ts` - Colyseus room

**Test everything works:**
```bash
cd packages/osrs-data && npm test  # 13 tests should pass
curl http://localhost:3001/health  # API health check
```

---

## SUCCESS CRITERIA

**Phase 1 Complete When:**
- [ ] Client connects to server
- [ ] 2+ players can move simultaneously
- [ ] Combat works with OSRS damage
- [ ] XP gain and leveling functional
- [ ] Enemies spawn and can be defeated
- [ ] 60 FPS client performance

**Next Phases:**
- Phase 2: Advanced combat and equipment
- Phase 3: Procedural world generation
- Phase 4: Discord integration

---

## READY TO BUILD

The foundation is complete. All OSRS mechanics are authentic and tested. The ECS architecture is production-ready. Your mission: **Transform this into a playable RuneRogue prototype!**

Focus on the critical path: Client setup → Network sync → Movement → Combat

Let's build the best OSRS × Vampire Survivors experience! 🎮⚔️
