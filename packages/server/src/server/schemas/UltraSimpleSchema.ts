/**
 * Ultra-simple schema to isolate Symbol.metadata issues
 * No MapSchema, just basic types
 */

import { Schema, defineTypes } from '@colyseus/schema';

/**
 * Ultra simple state with no complex types
 */
export class UltraSimpleState extends Schema {
  tick: number = 0;
  playerCount: number = 0;
  message: string = 'Hello World';

  constructor() {
    super();
    this.tick = 0;
    this.playerCount = 0;
    this.message = 'Server started';
  }
}

// Define types
defineTypes(UltraSimpleState, {
  tick: 'number',
  playerCount: 'number',
  message: 'string',
});

/**
 * Factory function
 */
export const createUltraSimpleState = (): UltraSimpleState => {
  const state = new UltraSimpleState();
  console.log('Created ultra simple state');
  return state;
};
