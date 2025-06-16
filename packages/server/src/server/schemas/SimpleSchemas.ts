/**
 * Simplified test schemas to fix the Symbol.metadata encoding error
 * This will test basic Colyseus schema functionality first
 */

import { Schema, MapSchema, defineTypes } from '@colyseus/schema';

/**
 * Simple Position schema
 */
export class SimplePosition extends Schema {
  x: number = 0;
  y: number = 0;
}

defineTypes(SimplePosition, {
  x: 'number',
  y: 'number',
});

/**
 * Simple Player schema with minimal properties
 */
export class SimplePlayer extends Schema {
  id: string = '';
  username: string = '';
  x: number = 0;
  y: number = 0;
  health: number = 100;

  constructor(id: string = '', username: string = '') {
    super();
    this.id = id;
    this.username = username;
    this.x = Math.floor(Math.random() * 10);
    this.y = Math.floor(Math.random() * 10);
    this.health = 100;
  }
}

defineTypes(SimplePlayer, {
  id: 'string',
  username: 'string',
  x: 'number',
  y: 'number',
  health: 'number',
});

/**
 * Simple Game State - NO MapSchema defineTypes to avoid Symbol.metadata issues
 */
export class SimpleGameState extends Schema {
  tick: number = 0;
  timestamp: number = 0;
  players: MapSchema<SimplePlayer>;

  constructor() {
    super();
    this.tick = 0;
    this.timestamp = Date.now();
    this.players = new MapSchema<SimplePlayer>();
  }
}

// DO NOT define types for MapSchema - let TypeScript handle it
defineTypes(SimpleGameState, {
  tick: 'number',
  timestamp: 'number',
  players: { map: SimplePlayer }, // Try defining MapSchema properly
});

/**
 * Factory functions
 */
export const createSimplePlayer = (id: string, username: string): SimplePlayer => {
  return new SimplePlayer(id, username);
};

export const createSimpleGameState = (): SimpleGameState => {
  return new SimpleGameState();
};

/**
 * Validation functions
 */
export const validateSimplePlayer = (player: SimplePlayer): boolean => {
  return !!(player.id && player.username);
};
