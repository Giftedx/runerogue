# RuneRogue Development Session - Phase 1: Core Multiplayer Implementation

## 🎯 **SESSION OBJECTIVES**

Building on the successful infrastructure fixes from the previous session, this session focuses on implementing core multiplayer gameplay mechanics with authentic OSRS features.

### **Previous Session Achievements:**

- ✅ **Fixed critical import path issues** (71 failing test suites → functional)
- ✅ **Resolved Colyseus schema conflicts** (game server now operational)
- ✅ **Game server running successfully** (<http://localhost:3000/health>)
- ✅ **OSRS data pipeline: 41/41 tests passing** (authentic calculations ready)
- ✅ **Asset extraction system working** (downloading real OSRS assets)
- ✅ **Clean test environment** (problematic legacy tests isolated)

### **Current System Status:**

- **Colyseus Game Server**: ✅ Running (port 3000)
- **Vite Client**: ✅ Running (port 5173)
- **OSRS Data**: ✅ All authentic formulas working
- **ECS Integration**: ✅ bitECS loading correctly
- **Schema System**: ⚠️ Basic schemas working (conflicts isolated)

## 🎮 **PHASE 1 IMPLEMENTATION TARGETS**

### **Priority 1: Complete GameRoom Functionality** (30 minutes)

**Goal**: Get players joining, moving, and synchronizing in real-time

#### **Key Tasks:**

1. **Fix Remaining Schema Conflicts**

   ```bash
   # Current issue: Multiple schemas with overlapping field names
   # Files to check: GameRoomState.ts, EntitySchemas.ts
   cd packages/server && pnpm test --testPathPattern="GameRoom"
   ```

2. **Implement Basic Player Movement**

   ```typescript
   // OSRS Movement: 1 tile per 0.6 seconds (walking)
   // Server must validate all movement for anti-cheat
   // Client prediction for responsiveness
   ```

3. **Create Working Room Connection Test**

   ```typescript
   // Test: Multiple clients can join same room
   // Test: Player positions sync across clients
   // Test: Players can see each other move
   ```

#### **Success Criteria:**

- [ ] GameRoom tests passing without schema conflicts
- [ ] 2+ players can join same room simultaneously
- [ ] Player movement syncs across all connected clients
- [ ] Server validates movement speed (anti-cheat working)

### **Priority 2: Implement Auto-Combat System** (45 minutes)

**Goal**: Players automatically attack nearby enemies using authentic OSRS combat

#### **Key Tasks:**

1. **Integrate OSRS Combat Calculations**

   ```typescript
   // Use packages/osrs-data combat formulas
   // Attack speeds: 4-tick (2.4s), 5-tick (3.0s), 6-tick (3.6s)
   // Damage calculation must match OSRS Wiki exactly
   ```

2. **Enemy Spawning and AI**

   ```typescript
   // Spawn goblins, cows, chickens with authentic OSRS stats
   // Enemies automatically attack nearest player
   // Respawn system for continuous gameplay
   ```

3. **Visual Combat Feedback**

   ```typescript
   // Red damage splats with exact OSRS styling
   // Attack animations and timing
   // XP drops: 4 * damage dealt (OSRS formula)
   ```

#### **Success Criteria:**

- [ ] Players automatically attack enemies in range
- [ ] Combat calculations match OSRS Wiki values exactly
- [ ] Damage numbers appear with authentic styling
- [ ] XP gains follow OSRS formulas (4 \* damage)

### **Priority 3: Essential UI Implementation** (30 minutes)

**Goal**: Core game interface with health, prayer, and XP tracking

#### **Key Tasks:**

1. **Health and Prayer Orbs**

   ```typescript
   // Authentic OSRS orb styling (extracted assets working)
   // Real-time updates from server state
   // Prayer drain: 1 point per 3 seconds (base rate)
   ```

2. **XP Counter and Level Display**

   ```typescript
   // Show combat XP gains in real-time
   // Level calculation using authentic OSRS table
   // Skill icons from extracted OSRS assets
   ```

3. **Minimap Integration**

   ```typescript
   // Show player and enemy positions
   // Use extracted OSRS minimap assets
   // Real-time updates for multiplayer awareness
   ```

#### **Success Criteria:**

- [ ] Health/prayer orbs update in real-time
- [ ] XP gains visible with authentic OSRS styling
- [ ] Minimap shows all players and enemies
- [ ] UI responds smoothly during combat

### **Priority 4: Discord Activity Integration** (15 minutes)

**Goal**: Make the game accessible as a Discord Activity

#### **Key Tasks:**

1. **Discord SDK Integration**

   ```typescript
   // Add Discord Activity manifest
   // Handle Discord authentication
   // Player names from Discord profiles
   ```

2. **Social Features**

   ```typescript
   // Show who you're playing with
   // Invite friends to join room
   // Share achievements in Discord
   ```

#### **Success Criteria:**

- [ ] Game launches as Discord Activity
- [ ] Discord usernames appear in game
- [ ] Players can invite friends to join

## 🛠 **TECHNICAL IMPLEMENTATION GUIDE**

### **File Structure Focus:**

```
packages/
├── game-server/src/rooms/RuneRogueRoom.ts     # Main multiplayer logic
├── server/src/server/game/GameRoom.ts         # ECS integration
├── server/src/server/schemas/GameRoomState.ts # Network state
├── phaser-client/                             # Game rendering
└── client/                                    # Discord integration
```

### **Critical Code Patterns:**

#### **1. Player Movement (Server Authority)**

```typescript
onMessage("move", (client, { targetX, targetY }) => {
  const entity = this.playerEntityMap.get(client.sessionId);

  // CRITICAL: Validate movement speed (anti-cheat)
  const currentPos = getComponent(this.world, Position, entity);
  const distance = Math.sqrt((targetX - currentPos.x)² + (targetY - currentPos.y)²);
  const maxSpeed = 1.0 / 0.6; // OSRS: 1 tile per 0.6 seconds

  if (distance > maxSpeed) {
    // Reject illegal movement
    return;
  }

  // Update ECS position (server-authoritative)
  Position.x[entity] = targetX;
  Position.y[entity] = targetY;
});
```

#### **2. Auto-Combat Integration**

```typescript
import { calculateDamage } from "@runerogue/osrs-data";

// Combat system runs every server tick
const combatQuery = defineQuery([Position, Combat, Health]);

export function executeCombatSystem(world: World) {
  const entities = combatQuery(world);

  for (const entity of entities) {
    const target = findNearestEnemy(entity);
    if (!target) continue;

    // Use authentic OSRS combat calculation
    const damage = calculateDamage({
      attackerLevel: Combat.level[entity],
      attackerStrength: Combat.strength[entity],
      defenderDefense: Combat.defense[target],
      weaponType: Equipment.weapon[entity],
    });

    // Apply damage with exact OSRS timing
    dealDamage(target, damage);
    awardXP(entity, damage * 4); // OSRS XP formula
  }
}
```

#### **3. Real-time State Sync**

```typescript
// Critical: Sync ECS state to Colyseus every tick
private syncStateToColyseus() {
  const playerQuery = defineQuery([Position, Health, Combat]);

  for (const entity of playerQuery(this.world)) {
    const sessionId = this.entityPlayerMap.get(entity);
    const playerState = this.state.players.get(sessionId);

    // Sync position
    playerState.position.x = Position.x[entity];
    playerState.position.y = Position.y[entity];

    // Sync health
    playerState.health.current = Health.current[entity];
    playerState.health.max = Health.max[entity];

    // Sync combat stats
    playerState.combat.level = Combat.level[entity];
    playerState.combat.xp = Combat.xp[entity];
  }
}
```

## 📋 **DEVELOPMENT WORKFLOW**

### **Session Start Checklist:**

```bash
# 1. Verify all services running
pnpm dev

# 2. Check game server health
curl http://localhost:3000/health

# 3. Run core tests to ensure stability
cd packages/osrs-data && pnpm test  # Should show 41/41 passing
cd ../game-server && pnpm test     # Should show 3/3 passing
cd ../server && pnpm test --testPathPattern="core-functionality" # Should pass
```

### **Development Phases:**

#### **Phase A: Schema Resolution (First 30 min)**

1. **Identify Schema Conflicts**

   ```bash
   cd packages/server && pnpm test --testPathPattern="GameRoom" --verbose
   # Look for "Duplicate 'name' definition" or similar errors
   ```

2. **Fix Overlapping Field Names**

   ```typescript
   // Check these files for conflicting field names:
   // - GameRoomState.ts (prayer, name fields)
   // - EntitySchemas.ts (name fields in multiple classes)
   ```

3. **Test Room Creation**

   ```typescript
   // Create test that verifies room can be created without schema errors
   // Should be able to instantiate GameRoomState successfully
   ```

#### **Phase B: Movement Implementation (Next 30 min)**

1. **Add Movement Message Handler**
2. **Implement Server-side Movement Validation**
3. **Add Client Prediction for Responsiveness**
4. **Test Multi-player Movement Sync**

#### **Phase C: Combat System (Next 45 min)**

1. **Integrate OSRS Combat Formulas**
2. **Add Enemy Entities with Auto-Attack**
3. **Implement Damage Calculation and Application**
4. **Add XP System with Authentic Formulas**

#### **Phase D: UI and Polish (Final 30 min)**

1. **Health/Prayer Orbs with Real-time Updates**
2. **XP Display and Level Tracking**
3. **Basic Minimap with Player Positions**
4. **Discord Activity Setup**

## 🧪 **TESTING STRATEGY**

### **Critical Tests to Implement:**

```typescript
// 1. Multi-player Room Test
describe("GameRoom Multiplayer", () => {
  it("should allow 2+ players to join and move simultaneously", async () => {
    // Test that multiple clients can connect
    // Test that movement syncs across all clients
    // Test that players can see each other
  });
});

// 2. Combat Authenticity Test
describe("OSRS Combat Integration", () => {
  it("should calculate damage exactly like OSRS", () => {
    // Use known OSRS values to verify calculations
    // Test against OSRS Wiki damage formulas
    // Ensure attack timing is precise (2.4s, 3.0s, etc.)
  });
});

// 3. Performance Test
describe("Multiplayer Performance", () => {
  it("should maintain 60fps with 4 players + 20 enemies", () => {
    // Load test with multiple entities
    // Monitor server tick rate (target: 20 TPS)
    // Verify no memory leaks during extended play
  });
});
```

### **Validation Commands:**

```bash
# Performance monitoring
pnpm test:performance

# OSRS authenticity verification
pnpm test:osrs

# Multiplayer integration tests
pnpm test:integration

# Real-time load testing
pnpm test:load
```

## 🎯 **SUCCESS METRICS**

### **Minimum Session Goals:**

- [ ] **2+ players can join same room** and see each other
- [ ] **Player movement syncs in real-time** across all clients
- [ ] **Auto-combat system working** with authentic OSRS calculations
- [ ] **Health/XP UI responsive** to game state changes
- [ ] **No game-breaking bugs** during normal gameplay

### **Stretch Goals:**

- [ ] **Discord Activity fully functional** with social features
- [ ] **Enemy respawning system** for continuous gameplay
- [ ] **Prayer system integrated** with authentic drain rates
- [ ] **Equipment system prototype** with stat bonuses
- [ ] **Performance optimized** for 4 players + 20+ enemies

## 🚨 **KNOWN ISSUES TO ADDRESS**

### **High Priority:**

1. **Schema Field Conflicts**: Multiple classes have `name` and `prayer` fields
2. **GameRoom Test Failures**: ColyseusTestServer import issues
3. **Movement Validation**: Need server-side speed checking
4. **Combat Integration**: OSRS formulas not yet connected to real-time game

### **Medium Priority:**

1. **Asset Loading**: Some OSRS Wiki assets not found (expected)
2. **Type Annotation**: Minor OSRS data type warning
3. **Performance**: No load testing with multiple players yet
4. **UI Integration**: Phaser client not fully connected to Colyseus

## 📚 **REFERENCE MATERIALS**

### **OSRS Mechanics (CRITICAL - Must Match Exactly):**

- **Movement**: 1 tile per 0.6 seconds (walking), 1 tile per 0.4 seconds (running)
- **Combat**: Attack speed varies by weapon (2.4s = 4-tick, 3.0s = 5-tick, 3.6s = 6-tick)
- **XP Formula**: `4 * damage dealt` for combat XP
- **Prayer Drain**: 1 point per 3 seconds (base rate, varies by prayer)
- **Combat Level**: `((Attack + Defence) / 4) + ((Strength + Hitpoints) / 4) + ((Prayer + Ranged + Magic) / 8)`

### **Technical Documentation:**

- **Colyseus Docs**: <https://docs.colyseus.io/>
  - [Room Lifecycle](https://docs.colyseus.io/server/room/)
  - [State Synchronization](https://docs.colyseus.io/state/)
  - [Client Prediction](https://docs.colyseus.io/state/client-prediction/)
- **bitECS Guide**: <https://github.com/NateTheGreatt/bitECS>
- **OSRS Wiki**: <https://oldschool.runescape.wiki/> (primary reference)
- **Discord Activities**: <https://discord.com/developers/docs/activities/overview>

### **Project Architecture:**

```typescript
// ECS Components (keep data-only)
export const Position = defineComponent({ x: Types.f32, y: Types.f32 });
export const Health = defineComponent({ current: Types.ui16, max: Types.ui16 });
export const Combat = defineComponent({ level: Types.ui8, xp: Types.ui32 });

// Systems (contain all logic)
export class MovementSystem {
  execute(world: World, deltaTime: number);
}
export class CombatSystem {
  execute(world: World, deltaTime: number);
}
export class StateSyncSystem {
  execute(world: World, deltaTime: number);
}

// Colyseus Integration
export class RuneRogueRoom extends Room<GameRoomState> {
  // Bridge between ECS world and network state
  // Handle player messages and validation
  // Sync ECS state to Colyseus every tick
}
```

## 🚀 **LET'S BUILD THE CORE GAME!**

This session transforms RuneRogue from a working infrastructure into a **playable multiplayer game** with authentic OSRS combat mechanics.

**Focus Areas:**

1. **Multiplayer First**: Get 2+ players moving and fighting together
2. **OSRS Authenticity**: Every calculation must match the Wiki exactly
3. **Real-time Performance**: Smooth 60fps with responsive controls
4. **Social Gaming**: Discord integration for community play

The foundation is solid, the OSRS data is authentic, and the architecture is clean. Time to bring RuneRogue to life! 🎮

---

**Start with schema fixes, then implement movement, then add combat. Test multiplayer functionality frequently. The game is ready to be born!**
