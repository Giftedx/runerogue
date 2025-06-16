/**
 * @deprecated LEGACY SCHEMA - This file contains old schema definitions.
 * It is not used in the main game and is pending removal.
 * Please use the schemas from '@runerogue/shared' instead.
 */

/**
 * Legacy-style schema without decorators to fix Symbol.metadata issues
 * Using defineTypes pattern that's proven to work
 */

import { Schema, MapSchema, defineTypes } from '@colyseus/schema';

/**
 * Legacy Player schema using defineTypes
 */
export class LegacyPlayer extends Schema {
  id: string = '';
  username: string = '';
  x: number = 0;
  y: number = 0;
  health: number = 100;

  constructor(id: string = '', username: string = '') {
    super();
    this.id = id;
    this.username = username;
    this.x = Math.floor(Math.random() * 100);
    this.y = Math.floor(Math.random() * 100);
    this.health = 100;
  }
}

// Define types for LegacyPlayer
defineTypes(LegacyPlayer, {
  id: 'string',
  username: 'string',
  x: 'number',
  y: 'number',
  health: 'number',
});

/**
 * Legacy Game State using defineTypes
 */
export class LegacyGameState extends Schema {
  tick: number = 0;
  timestamp: number = 0;
  players: MapSchema<LegacyPlayer>;

  constructor() {
    super();
    this.tick = 0;
    this.timestamp = Date.now();
    this.players = new MapSchema<LegacyPlayer>();
  }
}

// Define types for LegacyGameState - careful with MapSchema definition
defineTypes(LegacyGameState, {
  tick: 'number',
  timestamp: 'number',
  players: { map: LegacyPlayer },
});

/**
 * Factory functions
 */
export const createLegacyPlayer = (id: string, username: string): LegacyPlayer => {
  const player = new LegacyPlayer(id, username);
  console.log(`Created legacy player: ${username} at (${player.x}, ${player.y})`);
  return player;
};

export const createLegacyGameState = (): LegacyGameState => {
  const state = new LegacyGameState();
  console.log('Created legacy game state');
  return state;
};

/**
 * Validation functions
 */
export const validateLegacyPlayer = (player: LegacyPlayer): boolean => {
  const isValid = !!(player.id && player.username && player.health > 0);
  console.log(`Player validation: ${player.username} -> ${isValid}`);
  return isValid;
};
