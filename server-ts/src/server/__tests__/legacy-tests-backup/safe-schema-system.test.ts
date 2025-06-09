/**
 * Test for Safe Schema Registry and Safe Schemas
 *
 * This test verifies that our safe schema system prevents duplicate
 * registration errors and allows proper serialization.
 */

import { Player, SchemaFactories } from '../game/SafeSchemas';
import { getRegistryStats, resetSchemaRegistry } from '../utils/schema-registry';

describe('Safe Schema System', () => {
  beforeEach(() => {
    // Reset registry before each test
    resetSchemaRegistry();
  });

  it('should create schema instances without duplicate registration errors', () => {
    expect(() => {
      const player1 = SchemaFactories.createPlayer('player1', 'testuser1');
      const player2 = SchemaFactories.createPlayer('player2', 'testuser2');

      expect(player1.id).toBe('player1');
      expect(player1.username).toBe('testuser1');
      expect(player2.id).toBe('player2');
      expect(player2.username).toBe('testuser2');
    }).not.toThrow();
  });

  it('should handle multiple imports without duplicate registration', () => {
    expect(() => {
      // Import and create multiple times
      const { createPlayer } = SchemaFactories;
      const player1 = createPlayer('p1', 'user1');
      const player2 = createPlayer('p2', 'user2');
      const player3 = createPlayer('p3', 'user3');

      expect(player1).toBeDefined();
      expect(player2).toBeDefined();
      expect(player3).toBeDefined();
    }).not.toThrow();
  });

  it('should create inventory items correctly', () => {
    expect(() => {
      const item1 = SchemaFactories.createInventoryItem('sword', 1);
      const item2 = SchemaFactories.createInventoryItem('potion', 5);

      expect(item1.itemId).toBe('sword');
      expect(item1.quantity).toBe(1);
      expect(item2.itemId).toBe('potion');
      expect(item2.quantity).toBe(5);
    }).not.toThrow();
  });

  it('should create and populate inventory without errors', () => {
    expect(() => {
      const inventory = SchemaFactories.createInventory();
      const item1 = SchemaFactories.createInventoryItem('sword', 1);
      const item2 = SchemaFactories.createInventoryItem('shield', 1);

      const added1 = inventory.addItem(item1);
      const added2 = inventory.addItem(item2);

      expect(added1).toBe(true);
      expect(added2).toBe(true);
      expect(inventory.items.length).toBe(2);
    }).not.toThrow();
  });

  it('should create GameState with players', () => {
    expect(() => {
      const gameState = SchemaFactories.createGameState();
      const player1 = SchemaFactories.createPlayer('p1', 'user1');
      const player2 = SchemaFactories.createPlayer('p2', 'user2');

      gameState.addPlayer(player1);
      gameState.addPlayer(player2);

      expect(gameState.players.size).toBe(2);
      expect(gameState.getPlayer('p1')).toBe(player1);
      expect(gameState.getPlayer('p2')).toBe(player2);
    }).not.toThrow();
  });

  it('should track registry stats correctly', () => {
    const stats1 = getRegistryStats();
    expect(stats1.registered.length).toBe(0);
    expect(stats1.cached.length).toBe(0);

    // Create some instances
    SchemaFactories.createPlayer('p1', 'user1');
    SchemaFactories.createInventory();

    const stats2 = getRegistryStats();
    expect(stats2.registered.length).toBeGreaterThan(0);
    expect(stats2.cached.length).toBeGreaterThan(0);
  });

  it('should handle schema registration properly', () => {
    // This test specifically checks that the same class can be "imported" multiple times
    expect(() => {
      for (let i = 0; i < 5; i++) {
        const player = new Player(`player${i}`, `user${i}`);
        expect(player.id).toBe(`player${i}`);
      }
    }).not.toThrow();
  });

  it('should allow proper schema nesting', () => {
    expect(() => {
      const player = SchemaFactories.createPlayer('p1', 'user1');
      const item = SchemaFactories.createInventoryItem('test_item', 3);

      // Test nested schema functionality
      const added = player.inventory.addItem(item);
      expect(added).toBe(true);
      expect(player.inventory.items.length).toBe(1);
      expect(player.inventory.items[0].itemId).toBe('test_item');
      expect(player.inventory.items[0].quantity).toBe(3);
    }).not.toThrow();
  });
});
