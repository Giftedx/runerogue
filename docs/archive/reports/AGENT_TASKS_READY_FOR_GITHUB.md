# 🤖 AI AGENT TASKS - READY FOR GITHUB ISSUES

**Master Orchestrator Status:** DEPLOYING AI AGENTS  
**Phase:** Phase 0 - Foundation & Data Pipeline  
**Ready for GitHub Issue Creation:** YES ✅

---

## 🎯 **ISSUE 1: agent/osrs-data (The Lorekeeper)**

**GitHub Issue Title:** `[AGENT TASK] [agent/osrs-data] Create OSRS Wiki Data Pipeline - Combat & Initial Enemies`

**Labels:** `copilot`, `agent/osrs-data`, `phase-0`, `high-priority`, `foundation`, `critical-path`

**Assignee:** `github-copilot[bot]`

**Issue Body:**
```markdown
## Task Type
- [x] Feature - Implement a new feature

## Priority
- [x] High

## Description

**Agent: agent/osrs-data (The Lorekeeper)**

Create the foundational OSRS Wiki data pipeline that serves as the canonical source of truth for all game mechanics. This is a **CRITICAL PATH** task that blocks all Phase 1 development.

**Package Location:** `packages/osrs-data/`

## Specific Requirements

### 1. Combat Formulas Implementation
- **Max Hit formula** (Strength bonus, Prayer effects, Equipment bonuses)
- **Accuracy formula** (Attack vs Defence calculations) 
- **Attack speed calculations** for different weapon types
- Must match OSRS Wiki formulas **EXACTLY**

### 2. Initial Enemy Data (5 enemies required)
- **Goblin** (level 2) - Complete stat block from Wiki
- **Cow** (level 2) - Complete stat block from Wiki
- **Chicken** (level 1) - Complete stat block from Wiki
- **Giant Rat** (level 1) - Complete stat block from Wiki  
- **Zombie** (level 13) - Complete stat block from Wiki

### 3. Player Base Stats
- Base combat stats (Attack: 1, Strength: 1, Defence: 1, Hitpoints: 10)
- Combat level calculation implementation
- Base equipment stats (no equipment = 0 bonuses)

### 4. Data API Structure
- `GET /api/combat/max-hit` - Calculate max hit for given stats
- `GET /api/combat/accuracy` - Calculate hit probability  
- `GET /api/enemies/{id}` - Get enemy stats by ID
- `GET /api/formulas/validate` - Validate calculations against Wiki
- `GET /health` - API health check

## Relevant Code References

**Package Structure (Already Created):**
- `packages/osrs-data/src/scrapers/` - Wiki scraping utilities
- `packages/osrs-data/src/parsers/` - Data parsing & validation  
- `packages/osrs-data/src/calculators/` - OSRS formula implementations
- `packages/osrs-data/src/api/` - Data service API endpoints
- `packages/osrs-data/data/` - Generated JSON data files
- `packages/osrs-data/tests/` - Validation tests

**Key Files to Create:**
- `src/calculators/combat.ts` - Combat formulas
- `src/scrapers/wiki-scraper.ts` - OSRS Wiki scraper
- `src/api/server.ts` - Express API server
- `data/enemies/initial-enemies.json` - Enemy stat data

## Custom MCP Tool Options

**Use these MCP tools for Wiki access:**
- `mcp_osrs_osrs_wiki_search` - Search for specific pages
- `mcp_osrs_osrs_wiki_parse_page` - Extract page content  
- `mcp_osrs_search_npctypes` - Search NPC definitions

**Wiki References:**
- https://oldschool.runescape.wiki/w/Combat_level
- https://oldschool.runescape.wiki/w/Damage_per_second/Melee
- https://oldschool.runescape.wiki/w/Goblin
- https://oldschool.runescape.wiki/w/Cow
- https://oldschool.runescape.wiki/w/Chicken
- https://oldschool.runescape.wiki/w/Giant_rat
- https://oldschool.runescape.wiki/w/Zombie

## Acceptance Criteria

- [ ] Combat max hit calculations match OSRS Wiki formulas exactly
- [ ] Combat accuracy calculations match OSRS Wiki formulas exactly  
- [ ] All 5 enemy stat blocks are complete and accurate
- [ ] JSON API endpoints return valid, structured data
- [ ] Unit tests validate all calculations against known OSRS examples
- [ ] Data validation function confirms Wiki formula compliance
- [ ] Generated data files are stored in `packages/osrs-data/data/`
- [ ] API server runs on port 3001 with proper error handling
- [ ] All package.json scripts work (build, test, dev, scrape, validate, serve)

## Environment

- [x] Development
- Node.js Version: 18+
- TypeScript: ^5.2.2
- Testing: Jest

## Examples

**Expected Max Hit Calculation:**
```typescript
// Player with 10 Strength, no equipment, no prayers
const maxHit = calculateMaxHit({
  strength: 10,
  strengthBonus: 0,
  prayerMultiplier: 1.0
});
// Expected result: 1 (verified against OSRS Wiki)
```

**Expected Enemy Data Structure:**
```json
{
  "id": "goblin",
  "name": "Goblin", 
  "combatLevel": 2,
  "hitpoints": 5,
  "attackLevel": 1,
  "defenceLevel": 1,
  "attackBonus": 0,
  "defenceBonus": 0,
  "maxHit": 1,
  "attackSpeed": 4,
  "aggressive": false
}
```

## Task Priority

**CRITICAL** - All other agents depend on this data foundation.

## Related Issues

- **Blocks:** Phase 1 gameplay implementation
- **Required by:** agent/gameplay-systems combat calculations  
- **Required by:** agent/qa-tester validation tests
- **Works with:** agent/backend-infra (independent parallel work)

**Dependencies:** None (foundational task)
**Estimated Duration:** 3-4 days
**Phase:** Phase 0 - Foundation & Data Pipeline
```

---

## 🎯 **ISSUE 2: agent/backend-infra (The Architect)**

**GitHub Issue Title:** `[AGENT TASK] [agent/backend-infra] Setup Basic Colyseus GameRoom with Logging`

**Labels:** `copilot`, `agent/backend-infra`, `phase-0`, `high-priority`, `multiplayer`

**Assignee:** `github-copilot[bot]`

**Issue Body:**
```markdown
## Task Type

- [x] Feature - Implement a new feature

## Priority

- [x] High

## Description

**Agent: agent/backend-infra (The Architect)**

Set up the foundational multiplayer server infrastructure using Colyseus that will handle authoritative game state and player connections. This runs **in parallel** with the osrs-data task.

**Package Location:** `packages/game-server/`

## Specific Requirements

### 1. Colyseus Server Setup
- **Node.js/TypeScript Colyseus server** configuration
- **Single GameRoom class:** `RuneRogueRoom`
- **Basic room schema** for player connections
- **Express.js server wrapper** for HTTP endpoints

### 2. Connection Logging
- Log when players **join** the room (with timestamp)
- Log when players **leave** the room (with timestamp)
- Log basic **room state** (player count, room ID)
- **Structured logging** with Winston or similar

### 3. Basic Room Management
- **Room creation** on demand when players connect
- **Maximum 4 players** per room (Discord group limit)
- **Room cleanup** when empty (automatic disposal)
- **Basic error handling** for connection issues

### 4. Development Setup
- **Local development server** on port 2567
- **Hot reload** for development (nodemon/ts-node)
- **Environment configuration** (.env support)
- **Docker configuration** for future deployment

## Relevant Code References

**Package Structure (Already Created):**
- `packages/game-server/src/rooms/` - Colyseus game rooms
- `packages/game-server/src/schemas/` - Game state schemas
- `packages/game-server/src/auth/` - Authentication logic
- `packages/game-server/src/persistence/` - Database operations
- `packages/game-server/src/api/` - REST API endpoints
- `packages/game-server/tests/` - Server tests

**Key Files to Create:**
- `src/index.ts` - Main server entry point
- `src/rooms/RuneRogueRoom.ts` - Main game room
- `src/schemas/GameState.ts` - Room state schema
- `Dockerfile` - Container configuration

## Custom MCP Tool Options

**No specific MCP tools required** - this is pure infrastructure setup.

**Reference Documentation:**
- Colyseus Documentation: https://docs.colyseus.io/
- Express.js: https://expressjs.com/
- Winston Logging: https://github.com/winstonjs/winston

## Acceptance Criteria

- [ ] Colyseus server starts successfully on port 2567
- [ ] GameRoom accepts player connections via WebSocket
- [ ] Connection/disconnection events are properly logged with timestamps
- [ ] Room state is maintained and accessible
- [ ] Server handles multiple concurrent rooms (up to 10 rooms)
- [ ] Clean shutdown and cleanup procedures implemented
- [ ] Docker container builds and runs successfully
- [ ] Health check endpoint `/health` returns server status
- [ ] Basic room info endpoint `/rooms` lists active rooms
- [ ] All package.json scripts work (build, dev, start, test, docker:build)

## Environment

- [x] Development
- Node.js Version: 18+
- TypeScript: ^5.2.2
- Testing: Jest
- Colyseus: ^0.15.17

## Examples

**Expected Room Connection Log:**
```
[2024-01-15 10:30:45] INFO: Player connected to room 'game_001' - Player ID: player_abc123
[2024-01-15 10:30:45] INFO: Room 'game_001' state - Players: 1/4
```

**Expected Health Check Response:**
```json
{
  "status": "healthy",
  "uptime": 12345,
  "rooms": 3,
  "totalPlayers": 7,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## Task Priority

**HIGH** - Required for multiplayer foundation, but independent of osrs-data.

## Related Issues

- **Works with:** agent/osrs-data (parallel development)
- **Enables:** Phase 1 player synchronization
- **Required by:** agent/qa-tester integration tests (after basic setup)

**Dependencies:** None (independent infrastructure task)
**Estimated Duration:** 2-3 days  
**Phase:** Phase 0 - Foundation & Data Pipeline
```

---

## 📋 **QUICK DEPLOYMENT INSTRUCTIONS**

### **To Create These Issues:**

1. **Copy Issue 1 content** → Create new GitHub Issue → Paste content → Add labels → Assign to `github-copilot[bot]`

2. **Copy Issue 2 content** → Create new GitHub Issue → Paste content → Add labels → Assign to `github-copilot[bot]`

### **Critical Path:**
- **Issue 1 (osrs-data)** → Blocks Phase 1
- **Issue 2 (backend-infra)** → Independent, can start immediately
- **Both can run in parallel**

### **Next Phase Trigger:**
When both tasks complete successfully with passing tests → Phase 1 begins

---

**Master Orchestrator Status:** ✅ AGENT TASKS READY FOR DEPLOYMENT  
**Action Required:** Create GitHub Issues using above specifications  
**Timeline:** Phase 0 completion target: 7 days from deployment 