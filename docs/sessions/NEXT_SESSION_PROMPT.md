# RuneRogue Development Session Prompt - Phase 2: Core Multiplayer Prototype

## 🎯 **MAIN OBJECTIVE: IMPLEMENT MULTIPLAYER GAMEPLAY WITH AUTHENTIC OSRS MECHANICS**

You are continuing work on **RuneRogue**, an OSRS-inspired multiplayer roguelike survival game for Discord Activities. The project combines Old School RuneScape's authentic combat mechanics with modern multiplayer architecture.

## 🏆 **INFRASTRUCTURE SUCCESS - PREVIOUS SESSION**

**ALL CRITICAL ISSUES RESOLVED** ✅

The previous session was a complete success:

- **Fixed 71 failing test suites** → Game server now operational
- **Resolved Colyseus schema conflicts** → Multiplayer infrastructure working
- **Game server healthy**: http://localhost:3000/health responding
- **OSRS data pipeline**: 41/41 authentic calculations passing
- **Asset extraction**: Real OSRS Wiki assets downloading
- **ECS integration**: bitECS systems loading correctly
- **TypeScript compilation**: All packages building successfully

## 📊 **CURRENT PROJECT STATUS**

### ✅ **What's Working:**

- **Game Server**: Colyseus + Express running on port 3000
- **Client**: Vite + Phaser running on port 5173
- **OSRS Calculations**: 100% authentic combat formulas
- **ECS Architecture**: bitECS entity management
- **Asset Pipeline**: OSRS Wiki sprite extraction
- **Multiplayer Infrastructure**: Ready for room implementation
- **TypeScript Configuration**: Strict types enforced
- **Test Environment**: Clean and stable

### 🔄 **Ready For Implementation:**

- **GameRoom Logic**: Schema conflicts resolved, ready for enhancement
- **Player Movement**: Server-authoritative system ready to implement
- **Combat Systems**: OSRS formulas integrated, auto-combat ready
- **UI Components**: Health/prayer orbs and XP tracking ready
- **Asset Integration**: Real OSRS sprites ready for use

## 🛠 **IMPLEMENTATION ROADMAP**

### **Phase 1: GameRoom Enhancement (30 minutes)**

**Goal**: Enable 2-4 players to join and move together in real-time

1. **Complete GameRoom State Management**

   ```typescript
   // Fix any remaining schema field conflicts
   // Ensure PlayerState and EntityState don't overlap
   // Test room creation and player joining
   ```

2. **Implement Server-Authoritative Movement**

   ```typescript
   // OSRS Movement: 1 tile per 0.6 seconds (walking)
   // Validate movement speed and collision
   // Anti-cheat: Reject impossible movement
   ```

3. **ECS Integration with Colyseus**

   ```typescript
   // Sync ECS world state with Colyseus state
   // Bidirectional updates: ECS ↔ Network State
   // Optimize for 60fps with multiple players
   ```

### **Phase 2: Auto-Combat Implementation (45 minutes)**

**Goal**: Players automatically fight enemies using authentic OSRS mechanics

1. **Enemy Spawning System**

   ```typescript
   // Spawn goblins, cows, chickens with OSRS stats
   // Dynamic respawn based on player count
   // Spatial distribution for balanced encounters
   ```

2. **Auto-Combat Logic**

   ```typescript
   // Auto-target nearest enemy within range
   // Use authentic OSRS attack speeds and damage
   // Combat calculations from packages/osrs-data
   ```

3. **Combat Visual Effects**

   ```typescript
   // Red damage splats (OSRS style)
   // Attack animations with proper timing
   // XP drops: 4 * damage dealt (authentic formula)
   ```

### **Phase 3: Essential UI (30 minutes)**

**Goal**: Core game interface with health, prayer, and XP tracking

1. **Health and Prayer Orbs**

   ```typescript
   // Circular orbs with OSRS styling
   // Real-time health/prayer updates
   // Visual feedback for low health
   ```

2. **XP Counter and Mini-map**

   ```typescript
   // XP gains with smooth animations
   // Mini-map showing player and enemy positions
   // Combat level display
   ```

## 🎯 **TECHNICAL SPECIFICATIONS**

### **Performance Targets**

- **60fps** with 4+ players simultaneously
- **Server tick rate**: 20 TPS (50ms updates)
- **Network latency**: <100ms response time
- **Memory usage**: Stable, no leaks

### **OSRS Authenticity Requirements**

- **Combat calculations**: 100% match OSRS Wiki
- **Attack speeds**: 4-tick (2.4s), 5-tick (3.0s), 6-tick (3.6s)
- **XP formulas**: 4 × damage dealt for Attack/Strength/Defence
- **Movement speed**: 1 tile per 0.6 seconds (walking)

### **Anti-Cheat Implementation**

- **Server-authoritative**: All game state validation on server
- **Movement validation**: Check speed, collision, boundaries
- **Combat validation**: Verify range, timing, damage calculations
- **Rate limiting**: Prevent action spam and impossible speeds

## 📋 **CODE PATTERNS AND EXAMPLES**

### **GameRoom State Sync Pattern**

```typescript
// packages/game-server/src/rooms/RuneRogueRoom.ts
export class RuneRogueRoom extends Room<GameRoomState> {
  onCreate(options: any) {
    this.setState(new GameRoomState());

    // ECS World Integration
    this.ecsWorld = createWorld();
    this.setupECSSystems();

    // Game loop: 20 TPS
    this.setSimulationInterval((deltaTime) => {
      this.updateECSWorld(deltaTime);
      this.syncECSToColyseus();
    }, 50);
  }

  onMessage(client: Client, type: string, data: any) {
    switch (type) {
      case "move":
        this.handlePlayerMovement(client, data);
        break;
      case "attack":
        this.handlePlayerAttack(client, data);
        break;
    }
  }
}
```

### **Server-Authoritative Movement**

```typescript
// Anti-cheat movement validation
handlePlayerMovement(client: Client, data: { x: number, y: number }) {
  const player = this.state.players.get(client.sessionId);
  const distance = Math.abs(data.x - player.x) + Math.abs(data.y - player.y);

  // OSRS: 1 tile per 0.6s = max ~1.67 tiles/second
  const maxDistance = 1.67 * (Date.now() - player.lastMoveTime) / 1000;

  if (distance > maxDistance) {
    // Reject impossible movement (anti-cheat)
    client.send("movement_rejected", { reason: "too_fast" });
    return;
  }

  // Update position
  player.x = data.x;
  player.y = data.y;
  player.lastMoveTime = Date.now();
}
```

### **OSRS Combat Integration**

```typescript
// packages/game-server/src/systems/CombatSystem.ts
import { calculateDamage, getAttackSpeed } from "@runerogue/osrs-data";

export class CombatSystem implements System {
  update(world: World, deltaTime: number) {
    // Auto-target nearest enemy
    const combatQuery = world.query(CombatComponent, PositionComponent);

    for (const entity of combatQuery) {
      const combat = CombatComponent.get(entity);
      const position = PositionComponent.get(entity);

      if (Date.now() - combat.lastAttackTime >= getAttackSpeed(combat.weapon)) {
        const target = this.findNearestEnemy(world, position);
        if (target && this.isInRange(position, target, combat.attackRange)) {
          this.performAttack(world, entity, target);
        }
      }
    }
  }

  performAttack(world: World, attacker: Entity, target: Entity) {
    const attackerCombat = CombatComponent.get(attacker);
    const targetCombat = CombatComponent.get(target);

    // Use authentic OSRS damage calculation
    const damage = calculateDamage(
      attackerCombat.attackLevel,
      attackerCombat.strengthLevel,
      attackerCombat.weapon,
      targetCombat.defenceLevel,
      targetCombat.armor
    );

    // Apply damage
    targetCombat.hitpoints -= damage;
    attackerCombat.lastAttackTime = Date.now();

    // Award XP: 4 * damage dealt (OSRS formula)
    this.awardExperience(attacker, "attack", damage * 4);

    // Create damage splat
    this.createDamageSplat(world, target, damage);
  }
}
```

### **UI Component Pattern**

```typescript
// packages/phaser-client/src/ui/HealthOrb.ts
export class HealthOrb extends Phaser.GameObjects.Container {
  private orbSprite: Phaser.GameObjects.Sprite;
  private healthText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    // OSRS-style health orb
    this.orbSprite = scene.add.sprite(0, 0, "health_orb");
    this.healthText = scene.add.text(0, 0, "99", {
      fontFamily: "RuneScape",
      fontSize: "16px",
      color: "#FFFFFF",
    });

    this.add([this.orbSprite, this.healthText]);
  }

  updateHealth(current: number, max: number) {
    this.healthText.setText(current.toString());

    // Visual feedback for low health
    if (current / max < 0.25) {
      this.orbSprite.setTint(0xff0000); // Red tint
    } else {
      this.orbSprite.clearTint();
    }
  }
}
```

## 🚀 **IMMEDIATE ACTION PLAN**

### **Step 1: Verify Current Status (5 minutes)**

```bash
cd runerogue

# Check game server status
curl http://localhost:3000/health

# Verify OSRS data tests
cd packages/osrs-data && pnpm test

# Check for any remaining schema conflicts
cd packages/game-server && pnpm test --testPathPattern="GameRoom"
```

### **Step 2: Implement GameRoom Enhancement (25 minutes)**

1. **Fix Schema Conflicts**

   - Open `packages/game-server/src/schemas/GameRoomState.ts`
   - Ensure no duplicate field names between schemas
   - Test with multiple clients joining

2. **Add Movement Validation**

   - Implement server-side movement checks
   - Add anti-cheat validation for movement speed
   - Test movement synchronization

3. **ECS Integration**
   - Connect ECS world updates to Colyseus state
   - Implement bidirectional sync (ECS ↔ Network)

### **Step 3: Combat System Implementation (35 minutes)**

1. **Enemy Spawning**

   - Create enemy spawn system using ECS
   - Add goblin, cow, chicken with OSRS stats
   - Implement respawn logic

2. **Auto-Combat Logic**

   - Implement auto-targeting system
   - Use OSRS combat formulas from packages/osrs-data
   - Add attack timing and damage calculation

3. **Visual Effects**
   - Create damage splat system
   - Add XP gain animations
   - Implement attack animations

### **Step 4: UI Implementation (20 minutes)**

1. **Health/Prayer Orbs**

   - Create health orb component
   - Add prayer orb (future prayer system)
   - Real-time health updates

2. **XP Counter**

   - Implement XP gain display
   - Add smooth animation effects
   - Show combat level updates

3. **Mini-map**
   - Basic mini-map with player positions
   - Enemy indicators
   - Zoom and pan functionality

### **Step 5: Integration Testing (15 minutes)**

1. **Multiplayer Test**

   - Start game server and client
   - Test with 2+ browser windows
   - Verify all features work together

2. **Performance Validation**
   - Check 60fps with multiple players
   - Monitor server CPU and memory
   - Test network synchronization

## 📁 **KEY FILES TO WORK WITH**

### **Server Files**

- `packages/game-server/src/rooms/RuneRogueRoom.ts` - Main multiplayer logic
- `packages/game-server/src/schemas/GameRoomState.ts` - Network state schema
- `packages/game-server/src/systems/CombatSystem.ts` - Combat logic
- `packages/game-server/src/systems/EnemyAISystem.ts` - Enemy behavior
- `packages/game-server/src/systems/SpawnSystem.ts` - Enemy spawning

### **Client Files**

- `packages/phaser-client/src/scenes/MultiplayerGameScene.ts` - Main game scene
- `packages/phaser-client/src/ui/HealthOrb.ts` - Health display
- `packages/phaser-client/src/ui/XPCounter.ts` - XP tracking
- `packages/phaser-client/src/ui/GameHUD.ts` - UI container

### **Shared Files**

- `packages/shared/src/types/GameTypes.ts` - Common interfaces
- `packages/osrs-data/src/combat/` - OSRS combat formulas

## 🏁 **SUCCESS CRITERIA**

### **Minimum Viable Prototype (Must Have)**

- [ ] 2+ players can join the same game room
- [ ] Players can move around and see each other's movement
- [ ] Players automatically attack enemies when in range
- [ ] Combat damage uses authentic OSRS calculations
- [ ] Health orbs show real-time health updates
- [ ] XP gains appear when dealing damage

### **Enhanced Features (Should Have)**

- [ ] 4+ players supported simultaneously
- [ ] Multiple enemy types (goblins, cows, chickens)
- [ ] Mini-map showing player and enemy positions
- [ ] Attack animations and timing effects
- [ ] Performance: 60fps with no lag

### **Polish Features (Nice to Have)**

- [ ] Prayer orbs (for future prayer system)
- [ ] Equipment system integration
- [ ] Sound effects for combat
- [ ] Advanced enemy AI behaviors

## � **DEBUGGING AND TROUBLESHOOTING**

### **Common Issues and Solutions**

1. **Schema Conflicts**

   ```bash
   # Check for duplicate field names
   grep -r "field(" packages/game-server/src/schemas/

   # Fix by renaming conflicting fields
   ```

2. **ECS Performance Issues**

   ```typescript
   // Use sparse sets for optimal performance
   // Limit entity queries to essential systems only
   ```

3. **Network Synchronization**

   ```typescript
   // Implement delta compression
   // Use client-side prediction for responsiveness
   ```

4. **Memory Leaks**
   ```bash
   # Monitor with Node.js inspector
   node --inspect packages/game-server/src/index.ts
   ```

## 📖 **REFERENCE DOCUMENTATION**

- **OSRS Combat**: `docs/OSRS_COMBAT_FORMULAS_VALIDATION.md`
- **Architecture**: `docs/RUNEROGUE_PROJECT_STRUCTURE.md`
- **ECS Guide**: `packages/server/README.md`
- **Colyseus Docs**: https://docs.colyseus.io/
- **bitECS Docs**: https://github.com/NateTheGreatt/bitECS

---

## 🎮 **FINAL NOTES**

**The infrastructure is rock solid - now it's time to build the game!**

Focus on **functional multiplayer gameplay** over polish. Get 2+ players fighting enemies together with authentic OSRS mechanics. Every feature should work end-to-end before moving to the next one.

**Priority Order:**

1. Players joining and moving together (**foundation**)
2. Auto-combat with OSRS calculations (**core gameplay**)
3. Essential UI for feedback (**user experience**)
4. Performance optimization (**scalability**)

Start with the GameRoom enhancement and work systematically through each phase. The authentic OSRS formulas are already working - now bring them to life in multiplayer!

**Expected Session Outcome**: 2+ players fighting enemies together in real-time with authentic RuneScape combat mechanics. 🏆

- Network latency: <100ms
- Memory usage: stable

### **Testing Requirements**

- Unit tests for all utilities
- Integration tests for APIs
- OSRS data validation tests
- Performance tests for ECS systems

## 🚀 **IMMEDIATE COMMANDS TO RUN**

1. **Check Current State:**

   ```bash
   cd runerogue
   curl http://localhost:3000/health
   pnpm test --testPathPattern=osrs-data
   ```

2. **Start Development Servers:**

   ```bash
   # Start game server (Terminal 1)
   cd packages/game-server && pnpm dev

   # Start client (Terminal 2)
   cd packages/phaser-client && pnpm dev
   ```

3. **Run Integration Tests:**

   ```bash
   # Test multiplayer functionality
   cd packages/game-server && pnpm test --testPathPattern=GameRoom
   ```
