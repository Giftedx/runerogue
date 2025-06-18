/**
 * RuneRogue Game Room - Clean Colyseus Room Implementation
 *
 * This is a simplified, working game room that focuses on core multiplayer functionality:
 * - Player join/leave
 * - Movement synchronization
 * - Basic combat mechanics
 * - Enemy spawning and waves
 */

// LEGACY: Not used in current production. Retained for reference, migration, or testing only.

import { Client, Room } from '@colyseus/core';
import { GameRoomState, Player, Enemy } from '../game/EntitySchemas';
import { EnemyAISystem } from '../../../../game-server/src/ecs/systems/EnemyAISystem';
import { DeathSystem } from '../../../../game-server/src/ecs/systems/DeathSystem';

/**
 * Message types for client-server communication
 */
interface PlayerMoveMessage {
  x: number;
  y: number;
}

interface PlayerAttackMessage {
  targetId: string;
  targetType: 'enemy' | 'player';
}

interface RoomOptions {
  username?: string;
}

export class RuneRogueGameRoom extends Room<GameRoomState> {
  private gameLoopInterval?: NodeJS.Timeout;
  private waveSpawnInterval?: NodeJS.Timeout;
  private readonly TICK_RATE = 50; // 20 TPS
  private readonly WAVE_SPAWN_INTERVAL = 30000; // 30 seconds

  // ECS Systems
  private enemyAISystem: EnemyAISystem;
  private deathSystem: DeathSystem;

  /**
   * Initialize the game room
   */
  async onCreate(_options: RoomOptions) {
    this.setState(new GameRoomState());

    // Initialize ECS Systems
    // Cast to `any` is a temporary workaround for schema incompatibility between packages.
    // TODO: Unify GameState and GameRoomState schemas.
    this.enemyAISystem = new EnemyAISystem(this.state as any);
    this.deathSystem = new DeathSystem(this.state as any, this);

    this.setupMessageHandlers();
    this.startGameLoop();
    this.startWaveSpawning();

    // Set max clients to 4 players
    this.maxClients = 4;
  }

  /**
   * Handle player joining the game
   */
  async onJoin(client: Client, options: RoomOptions) {
    const username = options.username || `Player${Math.floor(Math.random() * 1000)}`;
    const player = this.state.addPlayer(client.sessionId, username);

    // Set random starting position
    player.position.x = Math.random() * 800 + 100;
    player.position.y = Math.random() * 600 + 100;
  }

  /**
   * Handle player leaving the game
   */
  async onLeave(client: Client, _consented: boolean) {
    this.state.removePlayer(client.sessionId);

    // If no players left, end the game
    if (this.state.players.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Handle room disposal
   */
  onDispose() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
    if (this.waveSpawnInterval) {
      clearInterval(this.waveSpawnInterval);
    }
  }

  /**
   * Set up message handlers for client actions
   */
  private setupMessageHandlers(): void {
    this.onMessage('move', (client, message: PlayerMoveMessage) => {
      const player = this.state.getPlayer(client.sessionId);
      if (!player || !player.isAlive) return;

      // Validate movement bounds (basic anti-cheat)
      const x = Math.max(0, Math.min(1000, message.x));
      const y = Math.max(0, Math.min(800, message.y));

      player.position.targetX = x;
      player.position.targetY = y;
      player.position.isMoving = true;
    });

    this.onMessage('attack', (client, message: PlayerAttackMessage) => {
      const attacker = this.state.getPlayer(client.sessionId);
      if (!attacker || !attacker.isAlive) return;

      // Check attack cooldown (OSRS 4-tick = 2.4s)
      const now = Date.now();
      if (now - attacker.lastAttackTime < 2400) return;

      this.handleAttack(attacker, message.targetId, message.targetType);
      attacker.lastAttackTime = now;
    });

    this.onMessage('ping', (client, _message) => {
      client.send('pong', { timestamp: Date.now() });
    });
  }

  /**
   * Main game loop - runs at 20 TPS
   */
  private startGameLoop(): void {
    this.gameLoopInterval = setInterval(() => {
      const delta = this.TICK_RATE;
      this.updatePlayerMovement();

      // Execute ECS systems
      this.enemyAISystem.execute(delta);
      this.deathSystem.execute(delta);

      this.updateWaveProgress();
    }, this.TICK_RATE);
  }

  /**
   * Update player movement towards targets
   */
  private updatePlayerMovement(): void {
    this.state.players.forEach(player => {
      if (!player.position.isMoving) return;

      const dx = player.position.targetX - player.position.x;
      const dy = player.position.targetY - player.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 5) {
        // Reached target
        player.position.x = player.position.targetX;
        player.position.y = player.position.targetY;
        player.position.isMoving = false;
      } else {
        // Move towards target (speed: 100 pixels/second)
        const speed = 5; // pixels per tick at 20 TPS
        const moveX = (dx / distance) * speed;
        const moveY = (dy / distance) * speed;

        player.position.x += moveX;
        player.position.y += moveY;
      }
    });
  }

  /**
   * Update combat and AI
   */
  private updateCombat(): void {
    // This logic is now handled by EnemyAISystem and player attack messages.
  }

  /**
   * Handle player attacking a target
   */
  private handleAttack(attacker: Player, targetId: string, targetType: 'enemy' | 'player'): void {
    if (targetType === 'enemy') {
      const enemy = this.state.enemies.get(targetId);
      if (!enemy || !enemy.isAlive) return;

      // Calculate damage using simplified OSRS formula
      const maxHit = this.calculateMaxHit(attacker);
      const damage = Math.floor(Math.random() * (maxHit + 1));

      enemy.takeDamage(damage);
    }
  }

  /**
   * Handle enemy attacking a player
   */
  public handleEnemyAttack(enemy: Enemy, target: Player): void {
    const maxHit = enemy.stats.strength; // Simple calculation
    const damage = Math.floor(Math.random() * (maxHit + 1));

    target.takeDamage(damage);
  }

  /**
   * Calculate max hit using simplified OSRS formula
   */
  private calculateMaxHit(player: Player): number {
    const strength = player.stats.strength;
    const strengthBonus = player.bonuses.strengthBonus;
    const effectiveStrength = strength + strengthBonus;

    // Simplified OSRS formula
    return Math.floor(0.5 + (effectiveStrength * (64 + strengthBonus)) / 640);
  }

  /**
   * Start wave spawning system
   */
  private startWaveSpawning(): void {
    // Spawn initial enemies
    this.spawnWave();

    this.waveSpawnInterval = setInterval(() => {
      if (this.state.wave.enemiesRemaining === 0) {
        this.spawnWave();
      }
    }, this.WAVE_SPAWN_INTERVAL);
  }

  /**
   * Spawn a new wave of enemies
   */
  private spawnWave(): void {
    // Increment wave number directly on the state
    this.state.waveNumber++;
    const wave = this.state.wave;

    const enemyCount = Math.min(10, 2 + wave.currentWave);

    for (let i = 0; i < enemyCount; i++) {
      const enemyId = `enemy_${wave.currentWave}_${i}`;
      const enemy = new Enemy(enemyId, `Goblin ${i + 1}`, wave.currentWave);

      // Random spawn position
      enemy.position.x = Math.random() * 1000;
      enemy.position.y = Math.random() * 800;

      this.state.addEnemy(enemy);
    }
  }

  /**
   * Update wave progress
   */
  private updateWaveProgress(): void {
    if (this.state.wave.enemiesRemaining === 0) {
      // Wave complete logic can go here
    }
  }

  /**
   * Utility functions
   */
  public findNearestPlayer(enemy: Enemy): Player | null {
    let nearest: Player | null = null;
    let minDistance = Infinity;

    this.state.players.forEach(player => {
      if (!player.isAlive) return;

      const distance = this.getDistance(enemy.position, player.position);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = player;
      }
    });

    return nearest;
  }

  private getDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  public moveEnemyTowards(enemy: Enemy, target: Player): void {
    const dx = target.position.x - enemy.position.x;
    const dy = target.position.y - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      const speed = 2; // Slower than players
      enemy.position.x += (dx / distance) * speed;
      enemy.position.y += (dy / distance) * speed;
    }
  }
}
