# RuneRogue Development Continuation Prompt

## 🎯 **PROJECT CONTEXT**

You are continuing development on **RuneRogue**, an OSRS-inspired roguelike survivor game for Discord Activities. This is a sophisticated TypeScript/Node.js game built with Colyseus multiplayer framework, featuring authentic OSRS combat mechanics, procedural generation, and AI-assisted development.

## 📊 **CURRENT STATE ANALYSIS**

### ✅ **COMPLETED FOUNDATIONS**

- **Core Architecture**: TypeScript server with Colyseus, basic client structure
- **Combat System**: Partial implementation with OSRS formula research completed
- **Prayer System**: Research and specifications documented (see `docs/OSRS_PRAYER_SYSTEM_SPECIFICATIONS.md`)
- **Economy Integration**: Python economy service with TypeScript client integration
- **Testing Framework**: Jest setup with initial test coverage
- **Discord Integration**: OAuth2 authentication skeleton implemented
- **Project Structure**: Monorepo structure with proper TypeScript configuration

### ⚠️ **CRITICAL GAPS IDENTIFIED**

1. **Incomplete Combat Formula Implementation**: OSRS combat calculations need completion
2. **Missing ECS Architecture**: Current system uses basic schemas, needs proper Entity-Component-System
3. **Prayer System Integration**: Research completed but implementation pending
4. **Procedural Generation**: No dungeon/map generation system implemented
5. **Survivor Mechanics**: Wave-based gameplay mechanics missing
6. **Client Rendering**: Basic Phaser setup needs enhancement for OSRS-style graphics

## 🎯 **IMMEDIATE PRIORITIES (NEXT SESSION)**

### **PRIORITY 1: Complete OSRS Combat Formula Implementation**

**File**: `server-ts/src/server/game/CombatSystem.ts`
**Status**: 🔄 IN PROGRESS - formulas researched, implementation incomplete
**Dependencies**: None
**Estimated Time**: 2-3 hours

**Tasks**:

1. **Implement authentic max hit calculations**:

   ```typescript
   /**
    * Calculate the maximum hit for a player based on OSRS formulas
    * @param attacker - The attacking player
    * @param style - The attack style being used
    * @returns The maximum hit value
    */
   calculateMaxHit(attacker: Player, style: AttackStyle): number {
     // Get effective strength level
     const effectiveStrength = this.getEffectiveLevel(
       attacker.skills.strength,
       style.strengthBonus,
       attacker.activePrayers
     );

     // Get equipment strength bonus
     const strengthBonus = attacker.equipment.getStrengthBonus();

     // Calculate base max hit
     const baseMaxHit = Math.floor(
       0.5 + effectiveStrength * (strengthBonus + 64) / 640
     );

     // Apply style-specific bonuses
     return Math.floor(baseMaxHit * style.damageMultiplier);
   }
   ```

2. **Complete accuracy calculations**:

   ```typescript
   /**
    * Calculate hit chance based on OSRS accuracy formula
    * @param attacker - The attacking entity
    * @param defender - The defending entity
    * @returns Accuracy as a decimal between 0 and 1
    */
   calculateAccuracy(attacker: Player, defender: Entity): number {
     // Calculate attack roll
     const effectiveAttack = this.getEffectiveLevel(
       attacker.skills.attack,
       attacker.currentStyle.attackBonus,
       attacker.activePrayers
     );
     const attackBonus = attacker.equipment.getAttackBonus(attacker.currentStyle.type);
     const maxAttackRoll = effectiveAttack * (attackBonus + 64);

     // Calculate defense roll
     const effectiveDefense = this.getEffectiveLevel(
       defender.skills.defense,
       1, // NPC defense style bonus
       defender.activePrayers || []
     );
     const defenseBonus = defender.equipment?.getDefenseBonus(attacker.currentStyle.type) || 0;
     const maxDefenseRoll = effectiveDefense * (defenseBonus + 64);

     // Calculate accuracy
     if (maxAttackRoll > maxDefenseRoll) {
       return 1 - (maxDefenseRoll + 2) / (2 * (maxAttackRoll + 1));
     } else {
       return maxAttackRoll / (2 * (maxDefenseRoll + 1));
     }
   }
   ```

3. **Validate against OSRS Wiki data**:
   - Test with known weapon stats (e.g., Dragon Scimitar: +67 slash attack, +66 strength)
   - Verify calculations match OSRS DPS calculators
   - Add comprehensive unit tests

**Success Criteria**:

- ✅ All combat formulas match OSRS Wiki within 99% accuracy
- ✅ Unit tests pass with 90%+ coverage
- ✅ Can calculate damage for all major weapon types

### **PRIORITY 2: Prayer System Integration**

**File**: `server-ts/src/server/game/PrayerSystem.ts`
**Status**: 📋 READY TO START - specifications complete
**Dependencies**: Combat system completion
**Estimated Time**: 2-3 hours

**Tasks**:

1. **Implement prayer point management**:

   ```typescript
   export class PrayerSystem {
     private drainTimers: Map<string, NodeJS.Timeout> = new Map();
     private readonly DRAIN_INTERVAL = 600; // 0.6 seconds in milliseconds

     /**
      * Activate a prayer for a player
      * @param playerId - The player's ID
      * @param prayerId - The prayer to activate
      * @returns true if activation successful, false otherwise
      */
     activatePrayer(playerId: string, prayerId: string): boolean {
       const player = this.getPlayer(playerId);
       const prayer = this.getPrayer(prayerId);

       if (!player || !prayer) return false;
       if (player.stats.prayer.current < prayer.drainRate) return false;
       if (player.skills.prayer.level < prayer.levelRequired) return false;

       // Check for conflicting prayers
       const conflicts = this.getConflictingPrayers(
         prayer,
         player.activePrayers
       );
       conflicts.forEach((p) => this.deactivatePrayer(playerId, p.id));

       // Activate the prayer
       player.activePrayers.push(prayer);
       this.startDrainTimer(playerId);

       return true;
     }

     /**
      * Calculate total prayer drain rate
      * @param prayers - Active prayers
      * @returns Points drained per game tick
      */
     calculateDrainRate(prayers: Prayer[]): number {
       return prayers.reduce((total, prayer) => total + prayer.drainRate, 0);
     }
   }
   ```

2. **Integrate with combat calculations**:
   ```typescript
   // In CombatSystem.ts
   /**
    * Apply prayer bonuses to combat stats
    * @param player - The player with active prayers
    * @returns Modified combat stats
    */
   applyPrayerBonuses(player: Player): CombatStats {
     const baseStats = { ...player.skills };

     player.activePrayers.forEach(prayer => {
       if (prayer.attackBonus) {
         baseStats.attack.level = Math.floor(
           baseStats.attack.level * (1 + prayer.attackBonus)
         );
       }
       if (prayer.strengthBonus) {
         baseStats.strength.level = Math.floor(
           baseStats.strength.level * (1 + prayer.strengthBonus)
         );
       }
       if (prayer.defenseBonus) {
         baseStats.defense.level = Math.floor(
           baseStats.defense.level * (1 + prayer.defenseBonus)
         );
       }
     });

     return baseStats;
   }
   ```

**Success Criteria**:

- ✅ Prayer points drain at correct OSRS rates
- ✅ Combat bonuses applied correctly
- ✅ Protection prayers reduce damage by 40%

### **PRIORITY 3: Enhanced Client Rendering**

**File**: `server-ts/src/client/game/GameRenderer.ts`
**Status**: 🔄 BASIC SETUP - needs OSRS-style enhancement
**Dependencies**: None (can work in parallel)
**Estimated Time**: 2-4 hours

**Tasks**:

1. **Implement OSRS-style sprite rendering**:

   ```typescript
   export class GameRenderer {
     private game: Phaser.Game;
     private config: Phaser.Types.Core.GameConfig;

     constructor() {
       this.config = {
         type: Phaser.AUTO,
         pixelArt: true, // Enable pixel-perfect rendering
         antialias: false,
         render: {
           pixelArt: true,
           roundPixels: true,
         },
       };
     }

     /**
      * Configure OSRS-style rendering settings
      */
     private setupOSRSStyle(): void {
       // Set up pixel-perfect rendering
       this.game.renderer.setPixelArt(true);

       // Configure sprite batching for performance
       const spriteBatch = this.game.renderer.addPipeline("SpriteBatch");
       spriteBatch.setFloat2(
         "uResolution",
         this.game.config.width,
         this.game.config.height
       );

       // Set up OSRS color palette
       this.setupColorPalette();

       // Configure UI layer with proper scaling
       this.setupUILayer();
     }

     private setupColorPalette(): void {
       // OSRS uses a specific color palette
       const osrsColors = {
         damage: 0xff0000,
         miss: 0x0000ff,
         heal: 0x00ff00,
         prayer: 0xffff00,
       };
       this.game.registry.set("osrsColors", osrsColors);
     }
   }
   ```

2. **Add damage splats and visual feedback**:
   ```typescript
   /**
    * Render OSRS-style damage splat
    * @param damage - Damage amount to display
    * @param x - World X coordinate
    * @param y - World Y coordinate
    * @param type - Type of splat (hit, miss, heal)
    */
   renderDamageSplat(damage: number, x: number, y: number, type: 'hit' | 'miss' | 'heal'): void {
     const colors = this.game.registry.get('osrsColors');
     const color = type === 'hit' ? colors.damage :
                   type === 'miss' ? colors.miss :
                   colors.heal;

     // Create splat sprite
     const splat = this.game.add.sprite(x, y, 'damage-splat');
     splat.setTint(color);

     // Add damage text
     const text = this.game.add.text(x, y, damage.toString(), {
       fontFamily: 'RuneScape',
       fontSize: '16px',
       color: '#FFFFFF',
       stroke: '#000000',
       strokeThickness: 2
     });
     text.setOrigin(0.5);

     // Animate splat
     this.game.tweens.add({
       targets: [splat, text],
       y: y - 20,
       alpha: 0,
       duration: 1000,
       ease: 'Power2',
       onComplete: () => {
         splat.destroy();
         text.destroy();
       }
     });
   }
   ```

**Success Criteria**:

- ✅ Pixelated OSRS-authentic visual style
- ✅ Smooth 60fps performance in Discord iframe
- ✅ Damage splats and combat feedback working

## 🚀 **SECONDARY OBJECTIVES (TIME PERMITTING)**

### **Objective A: ECS Architecture Foundation**

**Files**: Create in `server-ts/src/server/game/ecs/`
**Estimated Time**: 3-4 hours

**Tasks**:

1. **Install and configure ECS library**:

   ```bash
   cd server-ts
   npm install bitecs --save
   npm install @types/node --save-dev
   ```

2. **Create component definitions**:

   ```typescript
   // server-ts/src/server/game/ecs/components/Position.ts
   import { defineComponent, Types } from "bitecs";

   export const Position = defineComponent({
     x: Types.f32,
     y: Types.f32,
     z: Types.f32,
   });

   // server-ts/src/server/game/ecs/components/Health.ts
   import { defineComponent, Types } from "bitecs";

   export const Health = defineComponent({
     current: Types.ui16,
     maximum: Types.ui16,
   });

   // server-ts/src/server/game/ecs/components/CombatStats.ts
   import { defineComponent, Types } from "bitecs";

   export const CombatStats = defineComponent({
     attack: Types.ui8,
     strength: Types.ui8,
     defense: Types.ui8,
     ranged: Types.ui8,
     magic: Types.ui8,
   });
   ```

3. **Refactor existing Player/NPC schemas**:

   ```typescript
   // server-ts/src/server/game/ecs/EntityFactory.ts
   import { addEntity, addComponent } from "bitecs";
   import { Position, Health, CombatStats } from "./components";

   export class EntityFactory {
     createPlayer(world: World, x: number, y: number): number {
       const eid = addEntity(world);

       addComponent(world, Position, eid);
       Position.x[eid] = x;
       Position.y[eid] = y;

       addComponent(world, Health, eid);
       Health.current[eid] = 100;
       Health.maximum[eid] = 100;

       addComponent(world, CombatStats, eid);
       CombatStats.attack[eid] = 1;
       CombatStats.strength[eid] = 1;
       CombatStats.defense[eid] = 1;

       return eid;
     }
   }
   ```

### **Objective B: Basic Procedural Generation**

**Files**: Create in `server-ts/src/server/game/procedural/`
**Estimated Time**: 2-3 hours

**Tasks**:

1. **Install ROT.js for dungeon generation**:

   ```bash
   cd server-ts
   npm install rot-js --save
   npm install @types/rot-js --save-dev
   ```

2. **Create simple dungeon generator**:

   ```typescript
   // server-ts/src/server/game/procedural/DungeonGenerator.ts
   import { Map as ROTMap, RNG } from "rot-js";

   export interface TileMap {
     width: number;
     height: number;
     tiles: TileType[][];
   }

   export enum TileType {
     WALL = 0,
     FLOOR = 1,
     DOOR = 2,
     SPAWN = 3,
   }

   export class DungeonGenerator {
     /**
      * Generate a roguelike dungeon map
      * @param width - Map width in tiles
      * @param height - Map height in tiles
      * @param seed - Random seed for generation
      * @returns Generated tile map
      */
     generateMap(width: number, height: number, seed?: number): TileMap {
       if (seed) RNG.setSeed(seed);

       const map: TileType[][] = Array(height)
         .fill(null)
         .map(() => Array(width).fill(TileType.WALL));

       // Use ROT.js Digger algorithm for room generation
       const digger = new ROTMap.Digger(width, height, {
         roomWidth: [5, 9],
         roomHeight: [5, 9],
         corridorLength: [3, 7],
         dugPercentage: 0.3,
       });

       digger.create((x, y, value) => {
         if (value === 0) {
           // 0 = empty space in ROT.js
           map[y][x] = TileType.FLOOR;
         }
       });

       // Add spawn points in rooms
       const rooms = digger.getRooms();
       if (rooms.length > 0) {
         const spawnRoom = rooms[0];
         const centerX = Math.floor(
           spawnRoom.getLeft() + spawnRoom.getWidth() / 2
         );
         const centerY = Math.floor(
           spawnRoom.getTop() + spawnRoom.getHeight() / 2
         );
         map[centerY][centerX] = TileType.SPAWN;
       }

       return { width, height, tiles: map };
     }
   }
   ```

### **Objective C: Survivor Wave Mechanics**

**Files**: Create `server-ts/src/server/game/WaveManager.ts`
**Estimated Time**: 2-3 hours

**Tasks**:

1. **Implement basic wave spawning**:

   ```typescript
   // server-ts/src/server/game/WaveManager.ts
   export interface WaveConfig {
     waveNumber: number;
     enemyCount: number;
     enemyTypes: string[];
     spawnDelay: number;
     difficulty: number;
   }

   export class WaveManager {
     private currentWave: number = 0;
     private activeEnemies: Set<string> = new Set();

     /**
      * Calculate wave configuration based on wave number and player count
      * @param waveNumber - Current wave number
      * @param playerCount - Number of players in game
      * @returns Wave configuration
      */
     private calculateWaveConfig(
       waveNumber: number,
       playerCount: number
     ): WaveConfig {
       // Exponential difficulty scaling
       const baseEnemyCount = 3 + Math.floor(waveNumber * 1.5);
       const enemyCount = Math.floor(baseEnemyCount * (1 + playerCount * 0.3));

       // Determine enemy types based on wave
       const enemyTypes = this.getEnemyTypesForWave(waveNumber);

       return {
         waveNumber,
         enemyCount,
         enemyTypes,
         spawnDelay: Math.max(100, 500 - waveNumber * 10), // Faster spawns each wave
         difficulty: 1 + waveNumber * 0.1,
       };
     }

     /**
      * Spawn a new wave of enemies
      * @param waveNumber - Wave to spawn
      * @param playerCount - Number of players
      */
     spawnWave(waveNumber: number, playerCount: number): void {
       const config = this.calculateWaveConfig(waveNumber, playerCount);

       // Clear any remaining enemies
       this.clearEnemies();

       // Spawn enemies with delays
       let spawnedCount = 0;
       const spawnInterval = setInterval(() => {
         if (spawnedCount >= config.enemyCount) {
           clearInterval(spawnInterval);
           return;
         }

         const enemyType =
           config.enemyTypes[
             Math.floor(Math.random() * config.enemyTypes.length)
           ];
         const enemy = this.spawnEnemy(enemyType, config.difficulty);
         this.activeEnemies.add(enemy.id);

         spawnedCount++;
       }, config.spawnDelay);
     }

     private getEnemyTypesForWave(waveNumber: number): string[] {
       const allTypes = ["goblin", "spider", "skeleton", "zombie", "demon"];
       const maxTier = Math.min(
         Math.floor(waveNumber / 5) + 1,
         allTypes.length
       );
       return allTypes.slice(0, maxTier);
     }
   }
   ```

## 🛠️ **TECHNICAL SPECIFICATIONS**

### **OSRS Combat Formula Reference**

```typescript
// Max Hit Calculation (from OSRS Wiki)
// Source: https://oldschool.runescape.wiki/w/Maximum_hit
const calculateMaxHit = (
  effectiveStrength: number,
  strengthBonus: number,
  specialMultiplier: number = 1
): number => {
  const baseMax = Math.floor(
    0.5 + (effectiveStrength * (strengthBonus + 64)) / 640
  );
  return Math.floor(baseMax * specialMultiplier);
};

// Accuracy Calculation
// Source: https://oldschool.runescape.wiki/w/Accuracy
const calculateAccuracy = (
  maxAttackRoll: number,
  maxDefenseRoll: number
): number => {
  if (maxAttackRoll > maxDefenseRoll) {
    return 1 - (maxDefenseRoll + 2) / (2 * (maxAttackRoll + 1));
  } else {
    return maxAttackRoll / (2 * (maxDefenseRoll + 1));
  }
};

// Effective Level Calculation
const getEffectiveLevel = (
  baseLevel: number,
  prayerBonus: number,
  styleBonus: number
): number => {
  return Math.floor(Math.floor(baseLevel * prayerBonus) + styleBonus + 8);
};
```

### **Performance Targets**

- **Client**: 60fps stable, <100MB memory, <16ms frame time
- **Server**: 10Hz tick rate (100ms), support 15+ concurrent players
- **Network**: <150ms latency, delta compression enabled

### **Testing Requirements**

- **Unit Tests**: 90%+ coverage on all game logic
- **Integration Tests**: Combat, prayer, inventory systems
- **Performance Tests**: Stress testing with multiple players

## 🎮 **OSRS AUTHENTICITY CHECKLIST**

### **Combat System Validation**

- [ ] Dragon Scimitar max hit calculations match OSRS
- [ ] Accuracy formulas produce correct hit chances
- [ ] Prayer bonuses apply correctly to combat stats
- [ ] Protection prayers reduce damage by exactly 40%
- [ ] Combat triangle effectiveness implemented

### **Visual Authenticity**

- [ ] Pixelated sprite rendering (`image-rendering: pixelated`)
- [ ] OSRS-style damage splats (red for damage, blue for miss)
- [ ] Authentic UI elements and fonts
- [ ] Proper color palette matching OSRS

## 📋 **DEVELOPMENT WORKFLOW**

### **Before Starting**

1. **Review current combat implementation**: Read `server-ts/src/server/game/CombatSystem.ts` and tests
2. **Check prayer specifications**: Review `docs/OSRS_PRAYER_SYSTEM_SPECIFICATIONS.md`
3. **Understand project structure**: Familiarize with TypeScript/Colyseus setup
4. **Run existing tests**: Ensure `npm test` passes before making changes

### **Development Process**

1. **Start with unit tests**: Write tests first for new functionality
2. **Implement incrementally**: Small, testable changes
3. **Validate frequently**: Test against OSRS Wiki data regularly
4. **Document decisions**: Update relevant docs with implementation notes

### **Quality Gates**

- ✅ All tests pass
- ✅ TypeScript compiles without errors
- ✅ Performance benchmarks met
- ✅ Code review ready (clean, documented code)

## 🔧 **USEFUL COMMANDS**

```bash
# Development
cd server-ts
npm install
npm run dev          # Start development server
npm test            # Run all tests
npm run test:watch  # Watch mode for development

# Testing specific components
npm test -- CombatSystem
npm test -- PrayerSystem
npm test -- --coverage  # Coverage report

# Build and production
npm run build
npm start

# Linting and formatting
npm run lint
npm run format
```

## 📚 **KEY FILES TO REFERENCE**

### **Combat System Files**

- `server-ts/src/server/game/CombatSystem.ts` - Main combat logic
- `server-ts/src/server/__tests__/game/CombatSystem.test.ts` - Combat tests
- `docs/OSRS_COMBAT_FORMULAS_VALIDATION.md` - Formula specifications

### **Prayer System Files**

- `server-ts/src/server/game/PrayerSystem.ts` - Prayer implementation (to be created)
- `docs/OSRS_PRAYER_SYSTEM_SPECIFICATIONS.md` - Complete prayer specs
- `server-ts/src/server/__tests__/game/PrayerSystem.test.ts` - Prayer tests (to be created)

### **Game Architecture Files**

- `server-ts/src/server/game/GameRoom.ts` - Main game room logic
- `server-ts/src/server/game/EntitySchemas.ts` - Current entity definitions
- `server-ts/src/client/game/GameClient.ts` - Client-side game logic

### **Documentation**

- `MASTER_ORCHESTRATION_PLAN.md` - Overall project vision and architecture
- `docs/AI_AGENT_TASK_COORDINATION.md` - Agent task coordination
- `memories.md` - Project context and decisions

## 🎯 **SUCCESS METRICS FOR NEXT SESSION**

### **Minimum Viable Progress**

- ✅ Combat formulas implemented and validated
- ✅ At least 80% test coverage on combat system
- ✅ Prayer system basic implementation started

### **Optimal Progress**

- ✅ Combat and prayer systems fully integrated
- ✅ Client rendering enhanced with OSRS styling
- ✅ Basic procedural generation or wave mechanics started

### **Stretch Goals**

- ✅ ECS architecture foundation implemented
- ✅ Multiple game systems working together
- ✅ Performance optimizations applied

## 🚨 **CRITICAL NOTES**

### **OSRS Authenticity is Paramount**

- **Every formula must match OSRS Wiki exactly**
- **Visual style must be authentic to OSRS**
- **Game mechanics must feel like authentic OSRS**

### **Performance Considerations**

- **Discord iframe has memory constraints (256MB limit)**
- **60fps target for smooth gameplay**
- **Optimize for 15+ concurrent players**

### **Development Philosophy**

- **Test-driven development preferred**
- **Small, incremental changes**
- **Document all OSRS formula sources**
- **Maintain type safety throughout**

---

## 🚀 **READY TO START**

You now have a complete roadmap for the next development session. Begin with **Priority 1: Complete OSRS Combat Formula Implementation** and work through the priorities based on time availability. The project has a solid foundation - focus on completing the core combat system before expanding to additional features.

**Good luck building the most authentic OSRS roguelike survivor experience! 🎮⚔️**
