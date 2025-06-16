/**
 * Working Entity Schemas for RuneRogue
 * This file provides decorator-free schema definitions that work correctly with Jest
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Re-export Colyseus types for compatibility
export { ArraySchema, MapSchema, Schema, type };

/**
 * Simple working skill schema without decorators
 */
export class WorkingSkill extends Schema {
  level: number = 1;
  experience: number = 0;

  constructor() {
    super();
    // Define the schema structure explicitly
    this.constructor.defineFields(this, {
      level: { type: 'number', default: 1 },
      experience: { type: 'number', default: 0 },
    });
  }
}

/**
 * Working player schema without decorators
 */
export class WorkingPlayer extends Schema {
  id: string = '';
  username: string = '';
  x: number = 0;
  y: number = 0;
  health: number = 100;
  maxHealth: number = 100;

  constructor() {
    super();
    // Define the schema structure explicitly
    this.constructor.defineFields(this, {
      id: { type: 'string', default: '' },
      username: { type: 'string', default: '' },
      x: { type: 'number', default: 0 },
      y: { type: 'number', default: 0 },
      health: { type: 'number', default: 100 },
      maxHealth: { type: 'number', default: 100 },
    });
  }

  moveTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  takeDamage(damage: number): boolean {
    this.health = Math.max(0, this.health - damage);
    return this.health <= 0;
  }
}

/**
 * Working game state schema
 */
export class WorkingGameState extends Schema {
  tick: number = 0;
  timestamp: number = 0;
  players = new MapSchema<WorkingPlayer>();

  constructor() {
    super();
    // Define the schema structure explicitly
    this.constructor.defineFields(this, {
      tick: { type: 'number', default: 0 },
      timestamp: { type: 'number', default: 0 },
      players: { type: MapSchema, of: WorkingPlayer },
    });
  }

  addPlayer(player: WorkingPlayer): void {
    this.players.set(player.id, player);
    this.timestamp = Date.now();
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    this.timestamp = Date.now();
  }

  updateTick(): void {
    this.tick++;
    this.timestamp = Date.now();
  }
}

/**
 * Factory functions for creating schema instances
 */
export const WorkingSchemaFactories = {
  createPlayer(id: string, username: string): WorkingPlayer {
    const player = new WorkingPlayer();
    player.id = id;
    player.username = username;
    return player;
  },

  createGameState(): WorkingGameState {
    const gameState = new WorkingGameState();
    gameState.timestamp = Date.now();
    return gameState;
  },
};

// Export the working schemas as the main interfaces
export const Player = WorkingPlayer;
export const GameState = WorkingGameState;
export const Skill = WorkingSkill;

// Factory function for easy testing
export function createTestPlayer(
  id: string = 'test1',
  username: string = 'TestPlayer'
): WorkingPlayer {
  return WorkingSchemaFactories.createPlayer(id, username);
}

export function createTestGameState(): WorkingGameState {
  return WorkingSchemaFactories.createGameState();
}
