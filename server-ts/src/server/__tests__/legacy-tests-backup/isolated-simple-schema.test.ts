/**
 * Isolated test for SimpleSchemas without any global Jest setup interference
 */

import { SchemaFactories } from '../game/SimpleSchemas';

describe('Isolated Simple Schema System', () => {
  beforeEach(() => {
    // Clear any existing type registrations
    if (global.Symbol && global.Symbol.metadata) {
      delete global.Symbol.metadata;
    }
  });

  it('should create schema instances without decorator errors', () => {
    expect(() => {
      const player = SchemaFactories.createPlayer('test123', 'TestUser');
      expect(player).toBeDefined();
      expect(player.id).toBe('test123');
      expect(player.username).toBe('TestUser');
    }).not.toThrow();
  });

  it('should create nested schemas correctly', () => {
    expect(() => {
      const player = SchemaFactories.createPlayer('test456', 'AnotherUser');
      const item = SchemaFactories.createInventoryItem('sword_001', 1);

      expect(player.inventory).toBeDefined();
      expect(player.skills).toBeDefined();
      expect(item.itemId).toBe('sword_001');
      expect(item.quantity).toBe(1);
    }).not.toThrow();
  });

  it('should serialize without throwing errors', () => {
    expect(() => {
      const gameState = SchemaFactories.createGameState();
      const player = SchemaFactories.createPlayer('player1', 'Hero');

      // Add some basic data
      player.x = 100;
      player.y = 200;
      player.health = 90;

      gameState.addPlayer(player);

      // Test serialization using Colyseus Encoder
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      const encoded = encoder.encode(gameState, {}, false);

      console.log('✅ Successfully encoded gameState:', encoded.length, 'bytes');
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should handle inventory operations', () => {
    expect(() => {
      const player = SchemaFactories.createPlayer('inv_test', 'InventoryTester');
      const item1 = SchemaFactories.createInventoryItem('potion_health', 5);
      const item2 = SchemaFactories.createInventoryItem('sword_iron', 1);

      const success1 = player.inventory.addItem(item1);
      const success2 = player.inventory.addItem(item2);

      expect(success1).toBe(true);
      expect(success2).toBe(true);
      expect(player.inventory.items.length).toBe(2);

      console.log('✅ Inventory operations successful');
    }).not.toThrow();
  });
});
