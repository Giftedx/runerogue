# RuneRogue - Next Steps: Implementing the Core Combat Loop

Our current foundation is solid: the server is running, players can join a room, move around, and target enemies. The next critical phase is to bring the world to life by implementing the core combat loop. This will involve server-side logic for combat calculations and collision, as well as client-side rendering for enemies and visual feedback.

Our goal is to have a playable scenario where players can fight and defeat waves of enemies, with all mechanics adhering to the OSRS authenticity standards.

## Phase 1: Server-Side Gameplay Logic

### 1. Implement Collision-Based Combat

The `CombatSystem` needs to be updated to trigger attacks based on proximity, calculate damage using authentic OSRS formulas, and handle the consequences.

**File to Edit**: `packages/game-server/src/ecs/systems/CombatSystem.ts`

**Implementation Steps**:

1. **Add Required Imports**:

   ```typescript
   import { calculateMaxHit, calculateAccuracy } from "@runerogue/osrs-data";
   import { defineQuery, defineSystem, IWorld } from "bitecs";
   import { Position, Health, Target, Combat } from "../components";
   ```

2. **Define the Combat Query**:

   ```typescript
   const combatQuery = defineQuery([Position, Health, Target, Combat]);
   const targetableQuery = defineQuery([Position, Health]);
   ```

3. **Implement Distance Calculation**:

   ```typescript
   function getDistance(
     x1: number,
     y1: number,
     x2: number,
     y2: number
   ): number {
     const dx = x2 - x1;
     const dy = y2 - y1;
     return Math.sqrt(dx * dx + dy * dy);
   }
   ```

4. **Create the Combat System**:

   ```typescript
   export const createCombatSystem = () => {
     return defineSystem((world: IWorld) => {
       const entities = combatQuery(world);
       const currentTime = performance.now();

       for (let i = 0; i < entities.length; i++) {
         const eid = entities[i];
         const targetEid = Target.eid[eid];

         // Verify target exists and is targetable
         if (!targetEid || !targetableQuery(world).includes(targetEid)) {
           continue;
         }

         // Check distance (1 tile = 32 pixels in our game)
         const distance = getDistance(
           Position.x[eid],
           Position.y[eid],
           Position.x[targetEid],
           Position.y[targetEid]
         );

         if (distance > 40) continue; // Slightly more than 1 tile for melee

         // Check attack timer (stored in milliseconds)
         const lastAttackTime = Combat.lastAttackTime[eid] || 0;
         const attackSpeed = Combat.attackSpeed[eid] || 2400; // 4-tick default

         if (currentTime - lastAttackTime < attackSpeed) continue;

         // Update attack timer
         Combat.lastAttackTime[eid] = currentTime;

         // Calculate combat using OSRS formulas
         const attackerStats = {
           attackLevel: Combat.attack[eid] || 1,
           strengthLevel: Combat.strength[eid] || 1,
           defenceLevel: Combat.defence[eid] || 1,
           attackBonus: 0, // TODO: Equipment bonuses
           strengthBonus: 0,
           defenceBonus: 0,
           attackStyle: "aggressive" as const,
           combatType: "melee" as const,
           prayers: [] as string[],
         };

         const defenderStats = {
           defenceLevel: Combat.defence[targetEid] || 1,
           defenceBonus: 0, // TODO: Equipment bonuses
           prayers: [] as string[],
         };

         // Calculate hit chance and damage
         const accuracy = calculateAccuracy(attackerStats, defenderStats);
         const maxHit = calculateMaxHit(attackerStats);

         // Roll for hit
         if (Math.random() < accuracy) {
           const damage = Math.floor(Math.random() * (maxHit + 1));
           Health.current[targetEid] = Math.max(
             0,
             Health.current[targetEid] - damage
           );

           // Emit damage event for client feedback
           // You'll need to pass the room instance to the system
           // world.room.broadcast("damage", { target: targetEid, damage, attacker: eid });
         }
       }

       return world;
     });
   };
   ```

5. **Add Attack Timer to Combat Component**:
   In `packages/game-server/src/ecs/components/index.ts`, update the Combat component:

   ```typescript
   export const Combat = defineComponent({
     attack: Types.ui8,
     strength: Types.ui8,
     defence: Types.ui8,
     attackSpeed: Types.ui16, // milliseconds between attacks
     lastAttackTime: Types.f32, // timestamp of last attack
   });
   ```

### 2. Handle Entity Death

When an entity's health drops to 0, it needs to be removed from the game.

**Files to Edit**:

- `packages/game-server/src/ecs/systems/CombatSystem.ts`
- `packages/game-server/src/rooms/GameRoom.ts`

**Implementation Steps**:

1. **Extend the Combat System** (in CombatSystem.ts):

   ```typescript
   // After applying damage in the combat system:
   if (Health.current[targetEid] <= 0) {
     // Mark entity for removal (don't remove during iteration)
     world.entitiesToRemove = world.entitiesToRemove || [];
     world.entitiesToRemove.push(targetEid);
   }
   ```

2. **Create Death Handler in GameRoom**:

   ```typescript
   // In GameRoom.ts, add a method to handle entity removal
   private handleEntityDeath(world: IWorld) {
     if (!world.entitiesToRemove || world.entitiesToRemove.length === 0) return;

     for (const eid of world.entitiesToRemove) {
       // Find if it's a player or enemy
       this.state.players.forEach((player, sessionId) => {
         if (player.ecsId === eid) {
           // Handle player death
           this.broadcast("playerDeath", { playerId: sessionId });
           // For now, respawn the player
           Health.current[eid] = Health.max[eid];
           Position.x[eid] = 400; // Spawn position
           Position.y[eid] = 300;
         }
       });

       this.state.enemies.forEach((enemy, enemyId) => {
         if (enemy.ecsId === eid) {
           // Handle enemy death
           this.broadcast("enemyDeath", { enemyId });
           this.state.enemies.delete(enemyId);
           removeEntity(world, eid);
         }
       });
     }

     world.entitiesToRemove = [];
   }
   ```

3. **Call Death Handler in Game Loop**:

   ```typescript
   // In GameRoom's simulation interval
   this.setSimulationInterval(() => {
     for (const system of this.systems) {
       system(this.world);
     }
     this.handleEntityDeath(this.world);
   });
   ```

### 3. Enhance Enemy Spawning and State

The `EnemySpawnSystem` should create fully-featured enemies that are synced to the client.

**Files to Edit**:

- `packages/shared/src/schemas/GameState.ts`
- `packages/game-server/src/ecs/systems/EnemySpawnSystem.ts`
- `packages/game-server/src/rooms/GameRoom.ts`

**Implementation Steps**:

1. **Define EnemySchema** in `packages/shared/src/schemas/GameState.ts`:

   ```typescript
   import { Schema, type, MapSchema } from "@colyseus/schema";

   export class EnemySchema extends Schema {
     @type("string") id: string = "";
     @type("number") ecsId: number = 0;
     @type("number") x: number = 0;
     @type("number") y: number = 0;
     @type("number") health: number = 0;
     @type("number") maxHealth: number = 0;
     @type("string") enemyType: string = "goblin"; // goblin, spider, etc.
     @type("number") combatLevel: number = 2;
   }

   export class GameRoomState extends Schema {
     @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
     @type({ map: EnemySchema }) enemies = new MapSchema<EnemySchema>();
     @type("number") waveNumber: number = 1;
     @type("number") enemiesRemaining: number = 0;
   }
   ```

2. **Create Enemy Spawn System**:

   ```typescript
   // packages/game-server/src/ecs/systems/EnemySpawnSystem.ts
   import { defineSystem, addEntity, addComponent, IWorld } from "bitecs";
   import {
     Position,
     Velocity,
     Health,
     Target,
     Combat,
     Enemy,
   } from "../components";
   import { EnemySchema } from "@runerogue/shared";
   import { GameRoom } from "../../rooms/GameRoom";

   interface SpawnConfig {
     health: number;
     attack: number;
     strength: number;
     defence: number;
     attackSpeed: number;
     combatLevel: number;
   }

   const ENEMY_CONFIGS: Record<string, SpawnConfig> = {
     goblin: {
       health: 5,
       attack: 1,
       strength: 1,
       defence: 1,
       attackSpeed: 2400, // 4 ticks
       combatLevel: 2,
     },
     spider: {
       health: 8,
       attack: 2,
       strength: 2,
       defence: 1,
       attackSpeed: 2400,
       combatLevel: 3,
     },
   };

   export const createEnemySpawnSystem = (room: GameRoom) => {
     let lastSpawnTime = 0;
     const SPAWN_INTERVAL = 5000; // 5 seconds

     return defineSystem((world: IWorld) => {
       const currentTime = performance.now();

       if (currentTime - lastSpawnTime < SPAWN_INTERVAL) {
         return world;
       }

       // Check if we should spawn enemies
       if (room.state.enemies.size < room.state.enemiesRemaining) {
         lastSpawnTime = currentTime;

         // Choose enemy type based on wave
         const enemyType = room.state.waveNumber > 3 ? "spider" : "goblin";
         const config = ENEMY_CONFIGS[enemyType];

         // Create ECS entity
         const eid = addEntity(world);

         // Add components
         addComponent(world, Position, eid);
         Position.x[eid] = 100 + Math.random() * 600;
         Position.y[eid] = 100 + Math.random() * 400;

         addComponent(world, Velocity, eid);
         addComponent(world, Health, eid);
         Health.current[eid] = config.health;
         Health.max[eid] = config.health;

         addComponent(world, Enemy, eid);
         addComponent(world, Target, eid);

         addComponent(world, Combat, eid);
         Combat.attack[eid] = config.attack;
         Combat.strength[eid] = config.strength;
         Combat.defence[eid] = config.defence;
         Combat.attackSpeed[eid] = config.attackSpeed;

         // Create and sync schema
         const enemySchema = new EnemySchema();
         enemySchema.id = `enemy_${eid}`;
         enemySchema.ecsId = eid;
         enemySchema.x = Position.x[eid];
         enemySchema.y = Position.y[eid];
         enemySchema.health = Health.current[eid];
         enemySchema.maxHealth = Health.max[eid];
         enemySchema.enemyType = enemyType;
         enemySchema.combatLevel = config.combatLevel;

         room.state.enemies.set(enemySchema.id, enemySchema);
       }

       // Update wave when all enemies are defeated
       if (room.state.enemies.size === 0 && room.state.enemiesRemaining === 0) {
         room.state.waveNumber++;
         room.state.enemiesRemaining = 3 + room.state.waveNumber * 2;
         room.broadcast("waveStart", {
           waveNumber: room.state.waveNumber,
           enemyCount: room.state.enemiesRemaining,
         });
       }

       return world;
     });
   };
   ```

3. **Add Enemy Component** in `packages/game-server/src/ecs/components/index.ts`:

   ```typescript
   export const Enemy = defineComponent({}); // Tag component
   ```

## Phase 2: Client-Side Rendering and Feedback

The client needs to render the full game state and provide visual feedback for combat.

**File to Edit**: `packages/phaser-client/src/scenes/GameScene.ts`

**Implementation Steps**:

1. **Create Enemy Container Map**:

   ```typescript
   private enemies: Map<string, Phaser.GameObjects.Container> = new Map();
   ```

2. **Listen for Enemy State Changes**:

   ```typescript
   // In setupStateHandlers method:
   this.room.state.enemies.onAdd((enemy, key) => {
     const container = this.add.container(enemy.x, enemy.y);

     // Create enemy sprite (use different colors for different types)
     const sprite = this.add.rectangle(
       0,
       0,
       24,
       24,
       enemy.enemyType === "goblin" ? 0x00ff00 : 0xff00ff
     );
     container.add(sprite);

     // Create health bar
     const healthBarBg = this.add.rectangle(0, -20, 30, 4, 0x000000);
     const healthBar = this.add.rectangle(0, -20, 30, 4, 0xff0000);
     container.add([healthBarBg, healthBar]);

     // Store references
     container.setData("sprite", sprite);
     container.setData("healthBar", healthBar);
     container.setData("maxHealth", enemy.maxHealth);

     this.enemies.set(key, container);
   });

   this.room.state.enemies.onChange((enemy, key) => {
     const container = this.enemies.get(key);
     if (!container) return;

     // Update position
     container.x = enemy.x;
     container.y = enemy.y;

     // Update health bar
     const healthBar = container.getData("healthBar");
     const maxHealth = container.getData("maxHealth");
     healthBar.scaleX = enemy.health / maxHealth;
   });

   this.room.state.enemies.onRemove((enemy, key) => {
     const container = this.enemies.get(key);
     if (container) {
       container.destroy();
       this.enemies.delete(key);
     }
   });
   ```

3. **Implement Damage Splats**:

   ```typescript
   // Listen for damage events
   this.room.onMessage("damage", (data: { target: number; damage: number }) => {
     // Find the target entity and show damage
     const targetPos = this.getEntityPosition(data.target);
     if (targetPos) {
       const damageText = this.add.text(
         targetPos.x,
         targetPos.y - 30,
         data.damage.toString(),
         {
           fontSize: "18px",
           color: "#ffff00",
           stroke: "#000000",
           strokeThickness: 2,
         }
       );

       // Animate the damage splat
       this.tweens.add({
         targets: damageText,
         y: targetPos.y - 50,
         alpha: 0,
         duration: 1000,
         onComplete: () => damageText.destroy(),
       });
     }
   });
   ```

4. **Add Death Animations**:

   ```typescript
   // Listen for death events
   this.room.onMessage("enemyDeath", (data: { enemyId: string }) => {
     const container = this.enemies.get(data.enemyId);
     if (container) {
       const sprite = container.getData("sprite");

       // Play death animation
       this.tweens.add({
         targets: sprite,
         scale: 0,
         angle: 360,
         alpha: 0,
         duration: 500,
         onComplete: () => {
           container.destroy();
           this.enemies.delete(data.enemyId);
         },
       });
     }
   });
   ```

5. **Create Wave UI**:

   ```typescript
   // Listen for wave start
   this.room.onMessage(
     "waveStart",
     (data: { waveNumber: number; enemyCount: number }) => {
       const waveText = this.add
         .text(
           400,
           50,
           `Wave ${data.waveNumber} - ${data.enemyCount} enemies!`,
           {
             fontSize: "32px",
             color: "#ffffff",
             stroke: "#000000",
             strokeThickness: 4,
           }
         )
         .setOrigin(0.5);

       // Fade out after 3 seconds
       this.time.delayedCall(3000, () => {
         this.tweens.add({
           targets: waveText,
           alpha: 0,
           duration: 1000,
           onComplete: () => waveText.destroy(),
         });
       });
     }
   );
   ```

## Testing the Implementation

1. **Start the servers**: `pnpm dev`
2. **Open multiple browser windows** to test multiplayer combat
3. **Verify the following**:
   - Enemies spawn at regular intervals
   - Players can click on enemies to target them
   - Combat occurs when in range
   - Damage numbers appear
   - Enemies disappear when killed
   - Wave progression works
   - All clients see the same game state

## Next Iterations

Once the core combat loop is working:

1. Add different attack animations
2. Implement proper sprite sheets
3. Add combat sounds
4. Create more enemy types with unique behaviors
5. Implement loot drops
6. Add player equipment that affects combat stats
7. Integrate the prayer system for combat bonuses

By completing these steps, we will have a functional and engaging core gameplay loop, paving the way for more advanced features like prayer, equipment, and varied enemy types.
