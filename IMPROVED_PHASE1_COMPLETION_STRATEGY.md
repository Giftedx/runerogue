# RuneRogue Phase 1 Completion - Improved Strategy

## 🎯 Current State Analysis (Based on Code Review)

### ✅ What's Working Well

1. **Schema Infrastructure**: `EnemySchema` exists in `packages/shared/src/schemas/GameRoomState.ts`
2. **Server Systems**: `SimpleEnemySpawnSystem` and `SimpleEnemyAISystem` are implemented
3. **GameRoom Integration**: Enemy systems are already integrated in `GameRoom.ts`
4. **Client Foundation**: `GameScene.ts` has 843 lines of sophisticated game logic
5. **Network Layer**: `NetworkManager.ts` has basic client-server communication
6. **Test Infrastructure**: Working test clients exist (`test-simple-client-fixed.js`)

### ⚠️ Critical Issues Found

1. **Test Failures**: 9/35 tests failing, primarily due to missing dependencies and server not running
2. **Schema Mismatch**: `SimpleTestRoom` only has `SimplePlayer`, missing enemy schema
3. **Missing Integration**: Client doesn't handle enemy state from the complex `GameRoom`
4. **Dependency Issues**: Missing imports like `getWaveConfig` causing test failures

## 🚀 Improved Phase 1 Strategy

### Phase 1A: Fix Foundation Issues (1-2 hours)

#### Priority 1: Fix SimpleTestRoom Enemy Integration

The fastest path to working enemies is updating `SimpleTestRoom` to match the existing `EnemySchema`:

```typescript
// packages/game-server/src/rooms/SimpleTestRoom.ts
import { EnemySchema } from "@runerogue/shared";

export class SimpleGameState extends Schema {
  @type({ map: SimplePlayer })
  players: MapSchema<SimplePlayer> = new MapSchema<SimplePlayer>();

  @type({ map: EnemySchema })
  enemies: MapSchema<EnemySchema> = new MapSchema<EnemySchema>();

  @type("number")
  waveNumber: number = 1;

  constructor() {
    super();
  }
}
```

#### Priority 2: Fix Missing Dependencies

The tests are failing due to missing imports. Key fixes needed:

1. **Fix `getWaveConfig` import**: Missing in `EnemySpawnSystem.ts`
2. **Fix component registration**: `Object.values(EnemyType).indexOf()` errors
3. **Add server dependency**: Integration tests need server running

### Phase 1B: Enemy Rendering Integration (2-3 hours)

#### Client-Side Enemy Rendering

The `GameScene.ts` already has sophisticated ECS integration. We need to:

1. **Connect to actual GameRoom**: Currently connects to "test" room, needs "game" room
2. **Add enemy sprite management**: Use existing sprite patterns for enemies
3. **Implement enemy health bars**: Similar to existing player health bars

### Phase 1C: Combat Integration (2-3 hours)

#### Combat System Integration

The combat systems exist but need connection:

1. **Player-Enemy collision**: Use existing collision detection patterns
2. **OSRS damage formulas**: Import from `packages/osrs-data/`
3. **Combat event handling**: Use existing event system

## 📋 Immediate Action Plan (Next 6 Hours)

### Hour 1: Fix SimpleTestRoom Enemy Schema

```typescript
// File: packages/game-server/src/rooms/SimpleTestRoom.ts

import { Room, Client } from "colyseus";
import { MapSchema, Schema, type } from "@colyseus/schema";
import { EnemySchema } from "@runerogue/shared";

export class SimplePlayer extends Schema {
  @type("string") id: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 100;
  @type("number") maxHealth: number = 100;

  constructor() {
    super();
  }
}

export class SimpleGameState extends Schema {
  @type({ map: SimplePlayer })
  players: MapSchema<SimplePlayer> = new MapSchema<SimplePlayer>();

  @type({ map: EnemySchema })
  enemies: MapSchema<EnemySchema> = new MapSchema<EnemySchema>();

  @type("number")
  waveNumber: number = 1;

  @type("number")
  enemiesKilled: number = 0;

  constructor() {
    super();
  }
}

export class SimpleTestRoom extends Room<SimpleGameState> {
  private enemySpawnInterval?: NodeJS.Timeout;
  private enemyUpdateInterval?: NodeJS.Timeout;
  private enemyIdCounter = 0;

  onCreate(options: any) {
    console.log("SimpleTestRoom created!", options);
    this.setState(new SimpleGameState());

    // Start enemy spawning
    this.startEnemySpawning();
    this.startEnemyAI();

    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.isValidPosition(message.x, message.y)) {
        player.x = message.x;
        player.y = message.y;
      }
    });

    this.onMessage("attack", (client, data) => {
      this.handlePlayerAttack(client.sessionId, data.targetId);
    });
  }

  private startEnemySpawning() {
    this.enemySpawnInterval = setInterval(() => {
      const enemyCount = this.state.enemies.size;
      const maxEnemies = 3 + (this.state.waveNumber - 1) * 2;

      if (enemyCount < maxEnemies) {
        this.spawnEnemy();
      }
    }, 5000); // Every 5 seconds
  }

  private spawnEnemy() {
    const enemy = new EnemySchema();
    enemy.id = `enemy_${this.enemyIdCounter++}`;
    enemy.ecsId = this.enemyIdCounter;
    enemy.type = Math.random() > 0.5 ? "spider" : "goblin";
    enemy.x = Math.random() * 800;
    enemy.y = Math.random() * 600;
    enemy.health = enemy.type === "spider" ? 30 : 50;
    enemy.maxHealth = enemy.health;
    enemy.state = "moving";

    this.state.enemies.set(enemy.id, enemy);
    console.log(`Spawned ${enemy.type} at (${enemy.x}, ${enemy.y})`);
  }

  private startEnemyAI() {
    this.enemyUpdateInterval = setInterval(() => {
      this.state.enemies.forEach((enemy) => {
        // Find closest player
        let closestPlayer: SimplePlayer | null = null;
        let closestDistance = Infinity;

        this.state.players.forEach((player) => {
          const distance = Math.sqrt(
            Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPlayer = player;
          }
        });

        if (closestPlayer) {
          // Move towards closest player
          const dx = closestPlayer.x - enemy.x;
          const dy = closestPlayer.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 20) {
            const speed = enemy.type === "spider" ? 40 : 30;
            const moveX = (dx / distance) * speed * 0.05;
            const moveY = (dy / distance) * speed * 0.05;

            enemy.x += moveX;
            enemy.y += moveY;
          }

          // Check for attack range
          if (distance < 30) {
            this.handleEnemyAttack(enemy, closestPlayer);
          }
        }
      });
    }, 100); // 10Hz update rate
  }

  private handleEnemyAttack(enemy: EnemySchema, player: SimplePlayer) {
    const damage = Math.floor(Math.random() * 8) + 2;
    player.health = Math.max(0, player.health - damage);

    this.broadcast("combat", {
      type: "enemyAttack",
      enemyId: enemy.id,
      playerId: player.id,
      damage: damage,
    });

    if (player.health <= 0) {
      this.handlePlayerDeath(player);
    }
  }

  private handlePlayerAttack(playerId: string, targetId: string) {
    const player = this.state.players.get(playerId);
    const enemy = this.state.enemies.get(targetId);

    if (player && enemy) {
      const damage = Math.floor(Math.random() * 15) + 8;
      enemy.health = Math.max(0, enemy.health - damage);

      this.broadcast("combat", {
        type: "playerAttack",
        playerId: playerId,
        enemyId: targetId,
        damage: damage,
      });

      if (enemy.health <= 0) {
        this.handleEnemyDeath(enemy);
      }
    }
  }

  private handleEnemyDeath(enemy: EnemySchema) {
    this.state.enemies.delete(enemy.id);
    this.state.enemiesKilled++;

    this.broadcast("enemyDeath", {
      enemyId: enemy.id,
      enemyType: enemy.type,
    });
  }

  private handlePlayerDeath(player: SimplePlayer) {
    setTimeout(() => {
      player.health = player.maxHealth;
      player.x = Math.random() * 800;
      player.y = Math.random() * 600;

      this.broadcast("playerRespawn", {
        playerId: player.id,
      });
    }, 3000);
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x <= 800 && y >= 0 && y <= 600;
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new SimplePlayer();
    player.id = client.sessionId;
    player.x = 100 + Math.random() * 200;
    player.y = 100 + Math.random() * 200;
    player.health = 100;
    player.maxHealth = 100;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    if (this.enemySpawnInterval) clearInterval(this.enemySpawnInterval);
    if (this.enemyUpdateInterval) clearInterval(this.enemyUpdateInterval);
    console.log("Room", this.roomId, "disposing...");
  }
}
```

### Hour 2-3: Update GameScene Enemy Rendering

Add enemy rendering to the existing sophisticated GameScene:

```typescript
// Add to packages/phaser-client/src/scenes/GameScene.ts

export class GameScene extends Phaser.Scene {
  // ...existing properties...
  private enemies: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private enemyHealthBars: Map<string, Phaser.GameObjects.Graphics> = new Map();

  // In the create() method, add enemy handling
  private setupRoomHandlers(room: Room) {
    // ...existing player handlers...

    // Enemy handlers
    room.state.enemies.onAdd((enemy: any, key: string) => {
      this.createEnemySprite(key, enemy);
    });

    room.state.enemies.onRemove((enemy: any, key: string) => {
      this.removeEnemySprite(key);
    });

    room.state.enemies.onChange((enemy: any, key: string) => {
      this.updateEnemySprite(key, enemy);
    });

    // Combat events
    room.onMessage("combat", (data: any) => {
      this.handleCombatEvent(data);
    });
  }

  private createEnemySprite(id: string, enemy: any): void {
    // Use existing texture or create placeholder
    const texture = enemy.type === "spider" ? "spider" : "goblin";
    const sprite = this.add.sprite(enemy.x, enemy.y, texture);

    if (!this.textures.exists(texture)) {
      // Create placeholder colored rectangle
      const color = enemy.type === "spider" ? 0x800080 : 0x00aa00;
      sprite.setTint(color);
    }

    sprite.setScale(0.7);
    sprite.setInteractive();

    // Click to attack
    sprite.on("pointerdown", () => {
      this.networkManager.sendAttack(id);
    });

    this.enemies.set(id, sprite);

    // Create health bar
    const healthBar = this.add.graphics();
    this.enemyHealthBars.set(id, healthBar);
    this.updateEnemyHealthBar(id, enemy);
  }

  private updateEnemySprite(id: string, enemy: any): void {
    const sprite = this.enemies.get(id);
    if (sprite) {
      sprite.setPosition(enemy.x, enemy.y);
      this.updateEnemyHealthBar(id, enemy);
    }
  }

  private updateEnemyHealthBar(id: string, enemy: any): void {
    const healthBar = this.enemyHealthBars.get(id);
    const sprite = this.enemies.get(id);

    if (healthBar && sprite) {
      healthBar.clear();

      const barWidth = 40;
      const barHeight = 6;
      const x = sprite.x - barWidth / 2;
      const y = sprite.y - sprite.height * 0.5 - 15;

      // Background
      healthBar.fillStyle(0x000000, 0.7);
      healthBar.fillRect(x, y, barWidth, barHeight);

      // Health
      const healthPercent = enemy.health / enemy.maxHealth;
      const healthColor =
        healthPercent > 0.6 ? 0x00ff00
        : healthPercent > 0.3 ? 0xffaa00
        : 0xff0000;
      healthBar.fillStyle(healthColor);
      healthBar.fillRect(x, y, barWidth * healthPercent, barHeight);

      // Border
      healthBar.lineStyle(1, 0xffffff, 0.8);
      healthBar.strokeRect(x, y, barWidth, barHeight);
    }
  }

  private removeEnemySprite(id: string): void {
    const sprite = this.enemies.get(id);
    const healthBar = this.enemyHealthBars.get(id);

    if (sprite) {
      // Add death effect
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        scale: 0.3,
        duration: 300,
        onComplete: () => {
          sprite.destroy();
          this.enemies.delete(id);
        },
      });
    }

    if (healthBar) {
      healthBar.destroy();
      this.enemyHealthBars.delete(id);
    }
  }

  private handleCombatEvent(data: any): void {
    if (data.type === "playerAttack") {
      const enemySprite = this.enemies.get(data.enemyId);
      if (enemySprite) {
        this.showDamageNumber(
          enemySprite.x,
          enemySprite.y,
          data.damage,
          0xff0000
        );
        this.flashSprite(enemySprite, 0xff4444);
      }
    } else if (data.type === "enemyAttack") {
      const playerSprite = this.playerSprites.get(data.playerId);
      if (playerSprite) {
        this.showDamageNumber(
          playerSprite.x,
          playerSprite.y,
          data.damage,
          0xffaa00
        );
        this.flashSprite(playerSprite, 0xff6666);
      }
    }
  }

  private showDamageNumber(
    x: number,
    y: number,
    damage: number,
    color: number
  ): void {
    const damageText = this.add.text(x, y - 10, damage.toString(), {
      fontSize: "18px",
      color: `#${color.toString(16).padStart(6, "0")}`,
      stroke: "#000000",
      strokeThickness: 3,
      fontWeight: "bold",
    });

    this.tweens.add({
      targets: damageText,
      y: y - 40,
      alpha: 0,
      scale: 1.2,
      duration: 800,
      ease: "Power2",
      onComplete: () => damageText.destroy(),
    });
  }

  private flashSprite(sprite: Phaser.GameObjects.Sprite, color: number): void {
    const originalTint = sprite.tint;
    sprite.setTint(color);

    this.time.delayedCall(100, () => {
      sprite.setTint(originalTint);
    });
  }
}
```

### Hour 4: Create Test Client for Enemy System

```javascript
// File: test-enemy-system.js

const { Client } = require("colyseus.js");

async function testEnemySystem() {
  console.log("🎮 Starting Enemy System Test...");

  const client = new Client("ws://localhost:2567");

  try {
    const room = await client.joinOrCreate("test", { name: "EnemyTester" });
    console.log("✅ Connected to room:", room.id);

    // Wait for state initialization
    await new Promise((resolve) => {
      if (room.state?.players) {
        resolve();
      } else {
        room.state.onChange(() => resolve());
      }
    });

    console.log("📊 Initial state:");
    console.log(`  Players: ${room.state.players.size}`);
    console.log(`  Enemies: ${room.state.enemies.size}`);
    console.log(`  Wave: ${room.state.waveNumber}`);

    // Listen for enemy events
    room.state.enemies.onAdd((enemy, key) => {
      console.log(
        `👹 Enemy spawned: ${key} (${enemy.type}) at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)})`
      );
    });

    room.state.enemies.onChange((enemy, key) => {
      console.log(
        `🚶 Enemy ${key} moved to (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) - HP: ${enemy.health}/${enemy.maxHealth}`
      );
    });

    room.state.enemies.onRemove((enemy, key) => {
      console.log(`💀 Enemy died: ${key}`);
    });

    // Listen for combat events
    room.onMessage("combat", (data) => {
      if (data.type === "playerAttack") {
        console.log(
          `⚔️  Player attacked ${data.enemyId} for ${data.damage} damage`
        );
      } else if (data.type === "enemyAttack") {
        console.log(`🗡️  Enemy attacked player for ${data.damage} damage`);
      }
    });

    // Simulate player movement and combat
    let attackCooldown = 0;

    const gameLoop = setInterval(() => {
      // Move randomly
      const x = 200 + Math.random() * 400;
      const y = 200 + Math.random() * 200;
      room.send("move", { x, y });

      // Attack enemies if available
      attackCooldown--;
      if (attackCooldown <= 0 && room.state.enemies.size > 0) {
        const enemies = Array.from(room.state.enemies.keys());
        const targetId = enemies[Math.floor(Math.random() * enemies.length)];
        room.send("attack", { targetId });
        attackCooldown = 4; // 2 second cooldown
        console.log(`🎯 Attacking enemy: ${targetId}`);
      }
    }, 500);

    // Run for 2 minutes then cleanup
    setTimeout(() => {
      clearInterval(gameLoop);
      room.leave();
      console.log("🏁 Test completed");
    }, 120000);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testEnemySystem();
```

### Hour 5-6: Performance Testing and Polish

1. **Load Testing**: Run multiple test clients simultaneously
2. **Performance Monitoring**: Add FPS monitoring to client
3. **Memory Optimization**: Implement object pooling for damage numbers
4. **Polish Effects**: Add better visual feedback for combat

## 🎯 Success Criteria Validation

After implementing these changes, test that:

- [ ] **Server starts without errors**: `pnpm --filter @runerogue/game-server dev`
- [ ] **Client connects and renders**: `pnpm --filter @runerogue/phaser-client dev`
- [ ] **Enemies spawn every 5 seconds**: Visible in test client logs
- [ ] **Enemies move toward players**: Observable behavior
- [ ] **Click-to-attack works**: Combat events fire
- [ ] **Health bars update**: Visual confirmation
- [ ] **Damage numbers appear**: Visual feedback
- [ ] **Enemies die and respawn**: Full lifecycle
- [ ] **Multiple players see same enemies**: Multiplayer sync
- [ ] **60fps maintained**: Performance target

## 🚀 Why This Strategy Is Better

1. **Leverages Existing Code**: Uses the sophisticated `GameScene.ts` (843 lines) instead of rewriting
2. **Minimal Changes**: Updates `SimpleTestRoom` instead of complex `GameRoom` integration
3. **Proven Schema**: Uses existing `EnemySchema` from shared package
4. **Incremental Testing**: Each hour builds on the previous with validation
5. **Performance Focus**: Addresses the 60fps requirement from the start
6. **OSRS Authenticity**: Preserves path to integrate real OSRS combat formulas

This approach should get you to a working multiplayer enemy system within 6 hours, then you can enhance with OSRS combat formulas and advanced features.
