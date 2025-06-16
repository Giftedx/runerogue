/**
 * Test for CleanEntitySchemas - isolated schema testing
 */

import { Encoder } from '@colyseus/schema';
import { CleanSchemas } from '../game/CleanEntitySchemas';

const { GameState, Player, createPlayer, createInventoryItem } = CleanSchemas;

describe('Clean Entity Schemas Test', () => {
  it('should create schema instances without errors', () => {
    expect(() => {
      const gameState = new GameState();
      const player = createPlayer('test123', 'TestPlayer');
      const item = createInventoryItem('bronze_sword', 'Bronze sword', 1);

      console.log('GameState created:', !!gameState);
      console.log('Player created:', player.name, player.id);
      console.log('Item created:', item.name, item.itemId);
    }).not.toThrow();
  });

  it('should serialize schema without encoding errors', () => {
    const gameState = new GameState();
    const player = createPlayer('player1', 'TestUser');

    // Add player to game state
    gameState.players.set(player.id, player);
    gameState.playerCount = 1;
    gameState.timestamp = Date.now();

    expect(() => {
      const encoder = new Encoder();
      const encoded = encoder.encode(gameState, {}, false);
      console.log('Encoded successfully:', encoded.length, 'bytes');
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should handle inventory operations correctly', () => {
    const player = createPlayer('inv_test', 'InventoryTester');
    const sword = createInventoryItem('bronze_sword', 'Bronze sword', 1);
    const coins = createInventoryItem('coins', 'Coins', 100);

    expect(() => {
      player.inventory.items.push(sword);
      player.inventory.items.push(coins);

      expect(player.inventory.items.length).toBe(2);
      expect(player.inventory.items[0].name).toBe('Bronze sword');
      expect(player.inventory.items[1].quantity).toBe(100);
    }).not.toThrow();
  });
});
