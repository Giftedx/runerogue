/**
 * Test for Simple Schema System using defineTypes
 */

import { InventoryItem, Player, SchemaFactories } from '../game/SimpleSchemas';

describe('Simple Schema System', () => {
  it('should create schema instances without decorator errors', () => {
    expect(() => {
      const player1 = SchemaFactories.createPlayer('player1', 'testuser1');
      const player2 = SchemaFactories.createPlayer('player2', 'testuser2');

      expect(player1.id).toBe('player1');
      expect(player1.username).toBe('testuser1');
      expect(player2.id).toBe('player2');
      expect(player2.username).toBe('testuser2');
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

  it('should handle multiple imports without issues', () => {
    expect(() => {
      // Create multiple instances to test for any registration issues
      for (let i = 0; i < 10; i++) {
        const player = new Player(`player${i}`, `user${i}`);
        expect(player.id).toBe(`player${i}`);
        const item = new InventoryItem(`item${i}`, i + 1);
        expect(item.itemId).toBe(`item${i}`);
        expect(item.quantity).toBe(i + 1);
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
