/**
 * Simple test room to verify client-server connectivity with enemy support
 * This bypasses schema compatibility issues for basic testing
 */

import { Room, Client } from "colyseus";
import { MapSchema, Schema, type } from "@colyseus/schema";

export class SimplePlayer extends Schema {
  @type("string")
  id: string = "";

  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;

  @type("number")
  health: number = 100;

  @type("number")
  maxHealth: number = 100;

  constructor() {
    super();
  }
}

export class SimpleEnemy extends Schema {
  @type("string")
  id: string = "";

  @type("number")
  x: number = 0;

  @type("number")
  y: number = 0;

  @type("number")
  health: number = 50;

  @type("number")
  maxHealth: number = 50;

  @type("string")
  enemyType: string = "goblin";

  @type("string")
  state: string = "moving";

  @type("number")
  attack: number = 1;

  @type("number")
  strength: number = 1;

  @type("number")
  defence: number = 1;

  constructor() {
    super();
  }
}

export class SimpleGameState extends Schema {
  @type({ map: SimplePlayer })
  players: MapSchema<SimplePlayer> = new MapSchema<SimplePlayer>();

  @type({ map: SimpleEnemy })
  enemies: MapSchema<SimpleEnemy> = new MapSchema<SimpleEnemy>();

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

    // Start enemy systems
    this.startEnemySpawning();
    this.startEnemyAI();

    this.onMessage("move", (client, message) => {
      console.log("Move message from", client.sessionId, message);
      const player = this.state.players.get(client.sessionId);
      if (player && this.isValidPosition(message.x, message.y)) {
        player.x = message.x;
        player.y = message.y;
      }
    });

    this.onMessage("attack", (client, data) => {
      console.log("Attack message from", client.sessionId, data);
      this.handlePlayerAttack(client.sessionId, data.targetId);
    });
  }
  private startEnemySpawning() {
    console.log("🎯 Starting enemy spawning system...");

    // Spawn initial enemies immediately
    const initialEnemies = 3;
    console.log(`🏁 Spawning ${initialEnemies} initial enemies...`);
    for (let i = 0; i < initialEnemies; i++) {
      this.spawnEnemy();
    }

    this.enemySpawnInterval = setInterval(() => {
      const enemyCount = this.state.enemies.size;
      const maxEnemies = 3 + (this.state.waveNumber - 1) * 2;

      console.log(`🔄 Enemy spawn check: ${enemyCount}/${maxEnemies} enemies`);

      if (enemyCount < maxEnemies) {
        this.spawnEnemy();
      } else {
        console.log(`⏸️  Max enemies reached (${maxEnemies}), skipping spawn`);
      }
    }, 5000); // Spawn every 5 seconds

    console.log("✅ Enemy spawning system started");
  }
  private spawnEnemy() {
    const enemy = new SimpleEnemy();
    enemy.id = `enemy_${this.enemyIdCounter++}`;
    enemy.enemyType = Math.random() > 0.5 ? "spider" : "goblin";
    enemy.x = Math.random() * 800;
    enemy.y = Math.random() * 600;

    // Set health and combat stats based on enemy type
    if (enemy.enemyType === "spider") {
      enemy.health = 30;
      enemy.maxHealth = 30;
      enemy.attack = 5;
      enemy.strength = 8;
      enemy.defence = 3;
    } else {
      // goblin
      enemy.health = 50;
      enemy.maxHealth = 50;
      enemy.attack = 8;
      enemy.strength = 12;
      enemy.defence = 5;
    }

    enemy.state = "moving";

    this.state.enemies.set(enemy.id, enemy);
    console.log(
      `Spawned ${enemy.enemyType} (${enemy.id}) at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) with stats: atk=${enemy.attack}, str=${enemy.strength}, def=${enemy.defence}`
    );
  }
  private startEnemyAI() {
    console.log("🤖 Starting enemy AI system...");
    this.enemyUpdateInterval = setInterval(() => {
      const enemyCount = this.state.enemies.size;
      if (enemyCount > 0) {
        console.log(`🧠 AI update for ${enemyCount} enemies`);
      }

      this.state.enemies.forEach((enemy: SimpleEnemy) => {
        // Find closest player
        let closestPlayer: SimplePlayer | null = null;
        let closestDistance = Infinity;

        this.state.players.forEach((player: SimplePlayer) => {
          const distance = Math.sqrt(
            Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
          );

          if (distance < closestDistance) {
            closestDistance = distance;
            closestPlayer = player;
          }
        });
        if (closestPlayer !== null) {
          // Move towards closest player
          const player = closestPlayer as SimplePlayer;
          const dx = player.x - enemy.x;
          const dy = player.y - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 25) {
            const speed = enemy.enemyType === "spider" ? 40 : 30;
            const moveX = (dx / distance) * speed * 0.05;
            const moveY = (dy / distance) * speed * 0.05;

            enemy.x = Math.max(0, Math.min(800, enemy.x + moveX));
            enemy.y = Math.max(0, Math.min(600, enemy.y + moveY));
          }

          // Check for attack range
          if (distance < 30) {
            this.handleEnemyAttack(enemy, player);
          }
        }
      });
    }, 100); // 10Hz AI update rate
  }

  private handleEnemyAttack(enemy: SimpleEnemy, player: SimplePlayer) {
    const damage = Math.floor(Math.random() * 8) + 2;
    player.health = Math.max(0, player.health - damage);

    this.broadcast("combat", {
      type: "enemyAttack",
      enemyId: enemy.id,
      playerId: player.id,
      damage: damage,
    });

    console.log(
      `Enemy ${enemy.id} attacked player ${player.id} for ${damage} damage`
    );

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

      console.log(
        `Player ${playerId} attacked enemy ${targetId} for ${damage} damage`
      );

      if (enemy.health <= 0) {
        this.handleEnemyDeath(enemy);
      }
    }
  }

  private handleEnemyDeath(enemy: SimpleEnemy) {
    this.state.enemies.delete(enemy.id);
    this.state.enemiesKilled++;

    this.broadcast("enemyDeath", {
      enemyId: enemy.id,
      enemyType: enemy.enemyType,
    });

    console.log(
      `Enemy ${enemy.id} (${enemy.enemyType}) died. Total kills: ${this.state.enemiesKilled}`
    );
  }

  private handlePlayerDeath(player: SimplePlayer) {
    console.log(`Player ${player.id} died, respawning in 3 seconds...`);

    setTimeout(() => {
      player.health = player.maxHealth;
      player.x = 100 + Math.random() * 200;
      player.y = 100 + Math.random() * 200;

      this.broadcast("playerRespawn", {
        playerId: player.id,
      });

      console.log(`Player ${player.id} respawned`);
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
    if (this.enemySpawnInterval) {
      clearInterval(this.enemySpawnInterval);
    }
    if (this.enemyUpdateInterval) {
      clearInterval(this.enemyUpdateInterval);
    }
    console.log("Room", this.roomId, "disposing...");
  }
}
