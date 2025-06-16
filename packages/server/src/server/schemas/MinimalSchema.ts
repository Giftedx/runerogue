/**
 * Minimal schema to isolate and fix Colyseus encoding issues
 * Based on official Colyseus examples and best practices
 */

import { Schema, MapSchema, type } from '@colyseus/schema';

/**
 * Minimal Player schema with @type decorators
 */
export class MinimalPlayer extends Schema {
  @type('string') id: string = '';
  @type('string') username: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') health: number = 100;

  constructor(id: string = '', username: string = '') {
    super();
    this.id = id;
    this.username = username;
    this.x = Math.floor(Math.random() * 100);
    this.y = Math.floor(Math.random() * 100);
    this.health = 100;
  }
}

/**
 * Minimal Game State with @type decorators for MapSchema
 */
export class MinimalGameState extends Schema {
  @type('number') tick: number = 0;
  @type('number') timestamp: number = 0;
  @type({ map: MinimalPlayer }) players = new MapSchema<MinimalPlayer>();

  constructor() {
    super();
    this.tick = 0;
    this.timestamp = Date.now();
  }
}

/**
 * Factory functions
 */
export const createMinimalPlayer = (id: string, username: string): MinimalPlayer => {
  const player = new MinimalPlayer(id, username);
  console.log(`Created minimal player: ${username} at (${player.x}, ${player.y})`);
  return player;
};

export const createMinimalGameState = (): MinimalGameState => {
  const state = new MinimalGameState();
  console.log('Created minimal game state');
  return state;
};

/**
 * Validation functions
 */
export const validateMinimalPlayer = (player: MinimalPlayer): boolean => {
  const isValid = !!(player.id && player.username && player.health > 0);
  console.log(`Player validation: ${player.username} -> ${isValid}`);
  return isValid;
};
