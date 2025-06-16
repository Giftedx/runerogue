/**
 * Test the alternative schema approach to see if it avoids the Symbol.metadata issue
 */

import { GameState, createItem, createPlayer } from '../game/AlternativeSchemas';

describe('Alternative Schema Test', () => {
  it('should create Item without metadata errors', () => {
    expect(() => {
      const item = createItem('test_sword', 'Test Sword', 1);
      expect(item.itemId).toBe('test_sword');
      expect(item.name).toBe('Test Sword');
      expect(item.quantity).toBe(1);
    }).not.toThrow();
  });

  it('should create Player without metadata errors', () => {
    expect(() => {
      const player = createPlayer('TestPlayer', 10, 20);
      expect(player.name).toBe('TestPlayer');
      expect(player.x).toBe(10);
      expect(player.y).toBe(20);
      expect(player.health).toBe(100);
    }).not.toThrow();
  });

  it('should encode/decode without errors', () => {
    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();

      const gameState = new GameState();
      const player = createPlayer('TestPlayer');
      gameState.players.set('test123', player);

      const encoded = encoder.encode(gameState, {}, false);
      console.log('Alternative schema encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });

  it('should handle inventory operations', () => {
    const player = createPlayer('TestPlayer');
    const sword = createItem('sword_001', 'Iron Sword', 1);
    const shield = createItem('shield_001', 'Wooden Shield', 1);

    player.inventory.push(sword);
    player.inventory.push(shield);

    expect(player.inventory.length).toBe(2);
    expect(player.inventory[0].name).toBe('Iron Sword');
    expect(player.inventory[1].name).toBe('Wooden Shield');
  });
});
