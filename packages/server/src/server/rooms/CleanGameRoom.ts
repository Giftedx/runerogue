/**
 * @deprecated LEGACY ROOM - This room uses a deprecated, complex schema for testing.
 * It is kept for debugging purposes only and is pending removal.
 * Please use 'RuneRogueGameRoom' as a reference for the current implementation.
 */

/**
 * Clean RuneRogue Game Room using stable CoreSchemas
 * This replaces the previous broken implementations
 */

// LEGACY: Not used in current production. Retained for reference, migration, or testing only.

import { Room, Client } from '@colyseus/core';
import {
  GameRoomState,
  Player,
  Enemy,
  createPlayer,
  createEnemy,
  createGameRoomState,
  validatePlayer,
} from '../schemas/CoreSchemas';

export interface JoinOptions {
  username?: string;
}

export interface PlayerInput {
  type: 'move' | 'attack' | 'interact';
  x?: number;
  y?: number;
  targetId?: string;
}

export class CleanGameRoom extends Room<GameRoomState> {
  maxClients = 50;
  patchRate = 1000 / 60; // 60 FPS

  onCreate(options: any) {
    console.log('CleanGameRoom created with options:', options);

    // Initialize game state using the working CoreSchemas
    this.state = createGameRoomState();

    // Set up game loop
    this.setSimulationInterval(deltaTime => this.update(deltaTime));

    // Handle player input
    this.onMessage('input', (client, message: PlayerInput) => {
      this.handlePlayerInput(client, message);
    });
  }

  onJoin(client: Client, options: JoinOptions) {
    console.log(`Player ${client.sessionId} joining with username: ${options.username}`);

    const username = options.username || `Player_${client.sessionId.slice(0, 6)}`;
    const player = createPlayer(client.sessionId, username);

    // Set spawn position
    player.position.x = Math.floor(Math.random() * 10);
    player.position.y = Math.floor(Math.random() * 10);

    // Validate before adding
    if (validatePlayer(player)) {
      this.state.players.set(client.sessionId, player);
      console.log(`Player ${username} spawned at (${player.position.x}, ${player.position.y})`);
    } else {
      console.error('Failed to validate player:', player);
      throw new Error('Failed to create valid player');
    }
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`Player ${client.sessionId} left (consented: ${consented})`);
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log('CleanGameRoom disposed');
  }

  private handlePlayerInput(client: Client, input: PlayerInput) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    switch (input.type) {
      case 'move':
        if (typeof input.x === 'number' && typeof input.y === 'number') {
          this.movePlayer(player, input.x, input.y);
        }
        break;

      case 'attack':
        if (input.targetId) {
          this.handleAttack(player, input.targetId);
        }
        break;

      case 'interact':
        this.handleInteraction(player, input.targetId);
        break;
    }
  }

  private movePlayer(player: Player, newX: number, newY: number) {
    // Basic validation
    if (newX < 0 || newX > 100 || newY < 0 || newY > 100) {
      return; // Out of bounds
    }

    // Simple movement - in a real game you'd validate pathfinding
    player.position.x = newX;
    player.position.y = newY;

    console.log(`Player ${player.username} moved to (${newX}, ${newY})`);
  }

  private handleAttack(attacker: Player, targetId: string) {
    // Check if target is another player
    const targetPlayer = this.state.players.get(targetId);
    if (targetPlayer) {
      // Player vs Player combat
      const damage = Math.floor(Math.random() * 10) + 1;
      targetPlayer.health = Math.max(0, targetPlayer.health - damage);
      console.log(`${attacker.username} attacked ${targetPlayer.username} for ${damage} damage`);
      return;
    }

    // Check if target is an enemy
    const targetEnemy = this.state.enemies.get(targetId);
    if (targetEnemy) {
      // Player vs Enemy combat
      const damage = Math.floor(Math.random() * 15) + 5;
      targetEnemy.health = Math.max(0, targetEnemy.health - damage);
      console.log(`${attacker.username} attacked ${targetEnemy.name} for ${damage} damage`);

      // Remove enemy if dead
      if (targetEnemy.health <= 0) {
        this.state.enemies.delete(targetId);
        console.log(`${targetEnemy.name} was defeated!`);
      }
    }
  }

  private handleInteraction(player: Player, targetId?: string) {
    console.log(`Player ${player.username} interacted with ${targetId || 'environment'}`);
    // Handle interactions with objects, NPCs, etc.
  }

  private update(_deltaTime: number) {
    // Update game tick
    this.state.tick++;
    this.state.timestamp = Date.now();

    // Spawn enemies occasionally
    if (this.state.tick % 300 === 0 && this.state.enemies.size < 10) {
      this.spawnRandomEnemy();
    }

    // Update enemy AI (simple example)
    this.state.enemies.forEach(enemy => {
      this.updateEnemyAI(enemy);
    });
  }

  private spawnRandomEnemy() {
    const enemyTypes = [
      { name: 'Goblin', level: 5, health: 30 },
      { name: 'Orc', level: 10, health: 50 },
      { name: 'Skeleton', level: 8, health: 40 },
    ];

    const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    const enemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const enemy = createEnemy(enemyId, enemyType.name, enemyType.level);
    enemy.health = enemyType.health;
    enemy.maxHealth = enemyType.health;
    enemy.position.x = Math.floor(Math.random() * 100);
    enemy.position.y = Math.floor(Math.random() * 100);

    this.state.enemies.set(enemyId, enemy);
    console.log(
      `Spawned ${enemy.name} (lvl ${enemy.level}) at (${enemy.position.x}, ${enemy.position.y})`
    );
  }

  private updateEnemyAI(enemy: Enemy) {
    // Simple random movement for now
    if (Math.random() < 0.01) {
      // 1% chance per tick to move
      enemy.position.x += Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
      enemy.position.y += Math.floor(Math.random() * 3) - 1;

      // Keep in bounds
      enemy.position.x = Math.max(0, Math.min(100, enemy.position.x));
      enemy.position.y = Math.max(0, Math.min(100, enemy.position.y));
    }
  }
}
