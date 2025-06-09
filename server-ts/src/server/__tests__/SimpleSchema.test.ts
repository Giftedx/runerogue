/**
 * Simple Schema Test to Debug Constructor Issues
 */

import { Schema, type } from '@colyseus/schema';

// Create a minimal test schema
export class SimplePlayer extends Schema {
  @type('string') name: string = 'test';
  @type('number') health: number = 100;
}

describe('Simple Schema Debug', () => {
  it('should create a simple player schema', () => {
    expect(() => {
      const player = new SimplePlayer();
      expect(player).toBeDefined();
      expect(player.name).toBe('test');
      expect(player.health).toBe(100);
    }).not.toThrow();
  });
  
  it('should be able to modify properties', () => {
    const player = new SimplePlayer();
    player.name = 'changed';
    player.health = 50;
    
    expect(player.name).toBe('changed');
    expect(player.health).toBe(50);
  });
});
