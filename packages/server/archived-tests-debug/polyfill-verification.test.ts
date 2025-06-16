/**
 * Test to verify Symbol.metadata polyfill works
 */

import { Schema, type } from '@colyseus/schema';
import '../../utils/symbol-metadata-polyfill';

class TestItem extends Schema {
  @type('string') itemId!: string;
  @type('string') name!: string;
  @type('number') quantity!: number;
}

class TestPlayer extends Schema {
  @type('string') sessionId!: string;
  @type('string') name!: string;
  @type([TestItem]) inventory!: TestItem[];
}

describe('Symbol.metadata Polyfill Test', () => {
  it('should have Symbol.metadata available', () => {
    expect(Symbol.metadata).toBeDefined();
    expect(typeof Symbol.metadata).toBe('symbol');
  });

  it('should allow Colyseus schema creation and encoding', () => {
    const player = new TestPlayer();
    player.sessionId = 'test123';
    player.name = 'TestPlayer';
    player.inventory = [];

    const item = new TestItem();
    item.itemId = 'sword_001';
    item.name = 'Test Sword';
    item.quantity = 1;
    player.inventory.push(item);

    expect(player).toBeDefined();
    expect(player.sessionId).toBe('test123');
    expect(player.inventory.length).toBe(1);
    expect(player.inventory[0].name).toBe('Test Sword');

    // Test serialization - this should not throw
    expect(() => {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder(player);
      const encoded = encoder.encode(player, {}, false);
      expect(encoded).toBeDefined();
    }).not.toThrow();
  });
});
