/**
 * @deprecated LEGACY ROOM - This is a simplified, non-ECS prototype implementation.
 * It is kept for reference but is not part of the main game server.
 * The canonical, active room is 'RuneRogueGameRoom' in the '@runerogue/server' package, which uses the ECS architecture.
 *
 * RuneRogue Game Room
 * Main Colyseus room for RuneRogue multiplayer sessions
 *
 * @author agent/backend-infra (The Architect)
 */

import { Room, Client } from "colyseus";
import { GameState, Player, Enemy } from "../schemas/GameState";

export class RuneRogueRoom extends Room<GameState> {
  maxClients = 4; // Discord group limit
  private gameLoop?: NodeJS.Timeout;
  private readonly TICK_RATE = 50; // 20 TPS (50ms per tick)
  private readonly OSRS_WALK_SPEED = 1.67; // tiles per second (OSRS: 1 tile per 0.6s)
  private readonly SPAWN_INTERVAL = 5000; // 5 seconds between spawns

  /**
   * Calculate OSRS max hit formula
   */
  private calculateMaxHit(
    strength: number,
    strengthBonus: number = 0,
    prayerMultiplier: number = 1.0,
    styleBonus: number = 0,
  ): number {
    const effectiveStrength =
      Math.floor(strength * prayerMultiplier) + styleBonus + 8;
    const maxHit = Math.floor(
      0.5 + (effectiveStrength * (strengthBonus + 64)) / 640,
    );
    return maxHit;
  }

  /**
   * Calculate OSRS accuracy formula
   */
  private calculateAccuracy(
    attackerAttack: number,
    attackerEquipmentBonus: number = 0,
    defenderDefence: number,
    defenderEquipmentBonus: number = 0,
    prayerMultiplier: number = 1.0,
  ): number {
    const effectiveAttack = Math.floor(attackerAttack * prayerMultiplier) + 8;
    const maxAttackRoll = effectiveAttack * (attackerEquipmentBonus + 64);

    const effectiveDefence = Math.floor(defenderDefence * prayerMultiplier) + 8;
    const maxDefenceRoll = effectiveDefence * (defenderEquipmentBonus + 64);

    if (maxAttackRoll > maxDefenceRoll) {
      return 1 - (maxDefenceRoll + 2) / (2 * (maxAttackRoll + 1));
    } else {
      return maxAttackRoll / (2 * (maxDefenceRoll + 1));
    }
  }

  onCreate(options: any) {
    this.setState(new GameState());

    console.log(
      `[${new Date().toISOString()}] RuneRogueRoom created with options:`,
      options,
    );

    // Set up message handlers
    this.onMessage("move", this.handlePlayerMovement.bind(this));
    this.onMessage("attack", this.handlePlayerAttack.bind(this));
    this.onMessage("start_game", this.handleStartGame.bind(this));

    // Initialize game loop
    this.startGameLoop();
  }

  /**
   * Start the main game loop at 20 TPS
   */
  private startGameLoop() {
    this.gameLoop = setInterval(() => {
      this.updateGame();
    }, this.TICK_RATE);
  }

  /**
   * Main game update loop
   */
  private updateGame() {
    const now = Date.now();
    this.state.gameTime = now;

    if (!this.state.gameStarted) return;

    // Spawn enemies
    this.updateEnemySpawning(now);

    // Update combat
    this.updateCombat(now);

    // Cleanup dead enemies
    this.cleanupDeadEnemies();
  }
  /**
   * Handle player movement with server-side validation
   */
  private handlePlayerMovement(client: Client, data: { x: number; y: number }) {
    console.log(
      `🏃 handlePlayerMovement called: ${client.sessionId} -> (${data.x}, ${data.y})`,
    );

    const player = this.state.players.get(client.sessionId);
    if (!player) {
      console.log(`❌ Player not found: ${client.sessionId}`);
      return;
    }
    const now = Date.now();
    const timeDelta = (now - player.lastMoveTime) / 1000; // seconds
    const distance = Math.abs(data.x - player.x) + Math.abs(data.y - player.y);

    // Allow first move or reasonable movement speeds
    // OSRS: ~1.67 tiles/second, but allow up to 3 tiles/second for responsiveness
    const maxDistance = Math.max(3, this.OSRS_WALK_SPEED * 2 * timeDelta);

    // Anti-cheat: Validate movement speed (only after first move)
    if (distance > maxDistance && player.lastMoveTime > 0 && timeDelta < 5) {
      console.log(
        `[ANTI-CHEAT] Player ${client.sessionId} rejected for speed: ${distance} > ${maxDistance} (timeDelta: ${timeDelta}s)`,
      );
      client.send("movement_rejected", {
        reason: "too_fast",
        current: { x: player.x, y: player.y },
      });
      return;
    }

    // Update position
    player.x = data.x;
    player.y = data.y;
    player.lastMoveTime = now;

    console.log(`Player ${client.sessionId} moved to (${data.x}, ${data.y})`);
  }

  /**
   * Handle player attack command
   */
  private handlePlayerAttack(client: Client, data: { targetId: string }) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const enemy = this.state.enemies.get(data.targetId);
    if (!enemy || !enemy.alive) return;

    const now = Date.now();
    const attackSpeed = 2400; // 4-tick (2.4s) - OSRS standard attack speed

    // Check attack cooldown
    if (now - player.lastAttackTime < attackSpeed) return;

    // Check range (simplified - within 2 tiles)
    const distance =
      Math.abs(player.x - enemy.x) + Math.abs(player.y - enemy.y);
    if (distance > 2) return;

    // Perform attack using OSRS calculations
    this.performAttack(player, enemy, now);
  }
  /**
   * Handle start game command
   */
  private handleStartGame(client: Client) {
    console.log(`🚀 handleStartGame called by: ${client.sessionId}`);

    if (this.state.gameStarted) {
      console.log(`⚠️ Game already started`);
      return;
    }

    this.state.gameStarted = true;
    this.state.lastSpawnTime = Date.now();

    console.log(`Game started by ${client.sessionId}`);
    this.broadcast("game_started", {});
  }

  onJoin(client: Client, options: any) {
    console.log(
      `[${new Date().toISOString()}] Player joined room '${this.roomId}' - Player ID: ${client.sessionId}`,
    );

    // Create new player
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Player${this.clients.length}`;
    player.x = Math.random() * 20; // Random spawn position
    player.y = Math.random() * 20;
    player.health = 10;
    player.maxHealth = 10;
    player.attackLevel = 1;
    player.strengthLevel = 1;
    player.defenceLevel = 1;
    player.hitpointsLevel = 10;
    player.prayerLevel = 1;
    player.prayerPoints = 1;
    player.lastMoveTime = Date.now();

    this.state.players.set(client.sessionId, player);

    // Send initial game data
    client.send("joined", {
      playerId: client.sessionId,
      gameState: {
        started: this.state.gameStarted,
        wave: this.state.waveNumber,
        enemies: this.state.enemiesKilled,
      },
    });

    console.log(
      `[${new Date().toISOString()}] Room '${this.roomId}' state - Players: ${this.clients.length}/${this.maxClients}`,
    );
  }

  /**
   * Handles player disconnection with Colyseus reconnection support.
   * If a client disconnects, allowReconnection gives them 30 seconds to reconnect and reclaim their state.
   * If they reconnect within the window, their player state is preserved.
   * If not, their player is removed from the game state.
   *
   * @param client The Colyseus client that left
   * @param consented Whether the leave was voluntary
   */
  onLeave(client: Client, consented: boolean) {
    console.log(
      `[${new Date().toISOString()}] Player left room '${this.roomId}' - Player ID: ${client.sessionId} (consented: ${consented})`,
    );

    // Colyseus reconnection support: allow player to reconnect for 30 seconds
    this.allowReconnection(client, 30)
      .then(() => {
        // Reconnection succeeded, do nothing (player state is preserved)
        console.log(
          `[${new Date().toISOString()}] Player reconnected to room '${this.roomId}' - Player ID: ${client.sessionId}`,
        );
      })
      .catch(() => {
        // Reconnection window expired, remove player
        this.state.players.delete(client.sessionId);
        console.log(
          `[${new Date().toISOString()}] Player permanently left room '${this.roomId}' - Player ID: ${client.sessionId}`,
        );
        console.log(
          `[${new Date().toISOString()}] Room '${this.roomId}' state - Players: ${this.clients.length}/${this.maxClients}`,
        );
      });
  }

  onDispose() {
    console.log(`[${new Date().toISOString()}] Room '${this.roomId}' disposed`);

    // Cleanup game loop
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
  }

  /**
   * Update enemy spawning system
   */
  private updateEnemySpawning(now: number) {
    if (now - this.state.lastSpawnTime < this.SPAWN_INTERVAL) return;

    const playerCount = this.state.players.size;
    if (playerCount === 0) return;

    const enemyCount = this.state.enemies.size;
    const maxEnemies = Math.min(20, playerCount * 5); // Scale with players

    if (enemyCount < maxEnemies) {
      this.spawnEnemy();
      this.state.lastSpawnTime = now;
    }
  }

  /**
   * Spawn a new enemy
   */
  private spawnEnemy() {
    const enemy = new Enemy();
    enemy.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    enemy.type = "goblin"; // Start with goblins
    enemy.x = Math.random() * 30; // Random position
    enemy.y = Math.random() * 30;
    enemy.health = 5;
    enemy.maxHealth = 5;
    enemy.attackLevel = 2;
    enemy.defenceLevel = 1;
    enemy.alive = true;
    enemy.lastAttackTime = 0;

    this.state.enemies.set(enemy.id, enemy);
    console.log(`Spawned ${enemy.type} at (${enemy.x}, ${enemy.y})`);
  }

  /**
   * Update combat system
   */
  private updateCombat(now: number) {
    // Auto-combat for players
    this.state.players.forEach((player) => {
      if (now - player.lastAttackTime >= 2400) {
        // 4-tick attack speed
        const nearestEnemy = this.findNearestEnemy(player.x, player.y);
        if (nearestEnemy && this.getDistance(player, nearestEnemy) <= 2) {
          this.performAttack(player, nearestEnemy, now);
        }
      }
    });

    // Simple enemy AI - attack nearest player
    this.state.enemies.forEach((enemy) => {
      if (!enemy.alive) return;

      if (now - enemy.lastAttackTime >= 3000) {
        // Slower enemy attacks
        const nearestPlayer = this.findNearestPlayer(enemy.x, enemy.y);
        if (nearestPlayer && this.getDistance(enemy, nearestPlayer) <= 2) {
          this.performEnemyAttack(enemy, nearestPlayer, now);
        }
      }
    });
  }
  /**
   * Perform attack using authentic OSRS combat calculations
   */ private performAttack(attacker: Player, target: Enemy, now: number) {
    try {
      // Calculate accuracy using OSRS formula
      const accuracy = this.calculateAccuracy(
        attacker.attackLevel,
        0, // No equipment bonus for now
        target.defenceLevel,
        0, // No equipment bonus for now
      );

      // Roll for hit success
      const hitSuccess = Math.random() < accuracy;

      let damage = 0;
      if (hitSuccess) {
        // Calculate max hit using OSRS formula
        const maxHit = this.calculateMaxHit(attacker.strengthLevel);

        // Roll damage between 1 and max hit
        damage = Math.floor(Math.random() * maxHit) + 1;
      }

      // Apply damage
      target.health = Math.max(0, target.health - damage);
      attacker.lastAttackTime = now;

      // Check if enemy died
      if (target.health <= 0) {
        target.alive = false;
        this.state.enemiesKilled++;

        // Award XP: 4 * damage dealt (OSRS formula)
        const xpGained = damage * 4;
        this.broadcast("enemy_killed", {
          enemyId: target.id,
          killerId: attacker.id,
          xpGained: xpGained,
          position: {
            x: target.x,
            y: target.y,
          },
          enemyType: target.type,
        });
      } // Broadcast enhanced combat visual event
      this.broadcast("damage_dealt", {
        attackerId: attacker.id,
        targetId: target.id,
        damage: damage,
        targetHealth: target.health,
        targetMaxHealth: target.maxHealth,
        hitSuccess: hitSuccess,
        accuracy: Math.round(accuracy * 100),
        effectType: hitSuccess ? (damage > 0 ? "damage" : "zero") : "miss",
        position: {
          x: target.x,
          y: target.y,
        },
      });

      // Broadcast XP gain event for attacker
      if (hitSuccess && damage > 0) {
        const xpGained = damage * 4; // OSRS XP formula
        this.broadcast("xp_gained", {
          playerId: attacker.id,
          skill: "Attack",
          amount: xpGained,
          position: {
            x: attacker.x,
            y: attacker.y,
          },
        });
      }

      console.log(
        `Player ${attacker.id} ${hitSuccess ? "hit" : "missed"} ${target.type} for ${damage} damage (${Math.round(accuracy * 100)}% accuracy, ${target.health}/${target.maxHealth} HP)`,
      );
    } catch (error) {
      console.error("Error calculating OSRS damage:", error);
      // Fallback damage
      const damage = Math.floor(Math.random() * 3) + 1;
      target.health = Math.max(0, target.health - damage);
      attacker.lastAttackTime = now;
    }
  }

  /**
   * Enemy attack on player
   */
  private performEnemyAttack(attacker: Enemy, target: Player, now: number) {
    // Simple enemy damage (1-3)
    const damage = Math.floor(Math.random() * 3) + 1;

    target.health = Math.max(0, target.health - damage);
    attacker.lastAttackTime = now; // Broadcast enhanced damage event
    this.broadcast("damage_dealt", {
      attackerId: attacker.id,
      targetId: target.id,
      damage: damage,
      targetHealth: target.health,
      targetMaxHealth: target.maxHealth,
      hitSuccess: true,
      effectType: "damage",
      attackerType: "enemy",
      position: {
        x: target.x,
        y: target.y,
      },
    });

    console.log(
      `${attacker.type} dealt ${damage} damage to player ${target.id} (${target.health}/${target.maxHealth} HP)`,
    );
  }

  /**
   * Find nearest enemy to a position
   */
  private findNearestEnemy(x: number, y: number): Enemy | null {
    let nearest: Enemy | null = null;
    let minDistance = Infinity;

    this.state.enemies.forEach((enemy) => {
      if (!enemy.alive) return;

      const distance = Math.abs(x - enemy.x) + Math.abs(y - enemy.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = enemy;
      }
    });

    return nearest;
  }

  /**
   * Find nearest player to a position
   */
  private findNearestPlayer(x: number, y: number): Player | null {
    let nearest: Player | null = null;
    let minDistance = Infinity;

    this.state.players.forEach((player) => {
      const distance = Math.abs(x - player.x) + Math.abs(y - player.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = player;
      }
    });

    return nearest;
  }

  /**
   * Calculate distance between two entities
   */
  private getDistance(
    entity1: { x: number; y: number },
    entity2: { x: number; y: number },
  ): number {
    return Math.abs(entity1.x - entity2.x) + Math.abs(entity1.y - entity2.y);
  }

  /**
   * Remove dead enemies from the game state
   */
  private cleanupDeadEnemies() {
    const toDelete: string[] = [];

    this.state.enemies.forEach((enemy, id) => {
      if (!enemy.alive) {
        toDelete.push(id);
      }
    });

    toDelete.forEach((id) => {
      this.state.enemies.delete(id);
    });
  }
}
