/**
 * CleanSchemas Simple Test - Basic validation that schemas work
 */

import { Encoder } from '@colyseus/schema';
import {
  CleanGameState,
  CleanItem,
  CleanPlayer,
  createCleanGameState,
  createCleanItem,
  createCleanPlayer,
} from '../game/CleanSchemas';

describe('Clean Schemas Simple Test', () => {
  it('should create CleanItem instances successfully', () => {
    const item = createCleanItem('sword_001', 'Iron Sword', 1, 100, false);

    expect(item).toBeInstanceOf(CleanItem);
    expect(item.itemId).toBe('sword_001');
    expect(item.itemName).toBe('Iron Sword');
    expect(item.itemQuantity).toBe(1);
    expect(item.itemValue).toBe(100);
    expect(item.itemStackable).toBe(false);
  });

  it('should create CleanPlayer instances successfully', () => {
    const player = createCleanPlayer('player_001', 'TestUser', 50, 50);

    expect(player).toBeInstanceOf(CleanPlayer);
    expect(player.playerId).toBe('player_001');
    expect(player.playerUsername).toBe('TestUser');
    expect(player.playerX).toBe(50);
    expect(player.playerY).toBe(50);
  });

  it('should create CleanGameState instances successfully', () => {
    const gameState = createCleanGameState();

    expect(gameState).toBeInstanceOf(CleanGameState);
    expect(gameState.gameTimestamp).toBeGreaterThan(0);
    expect(gameState.gamePlayers).toBeDefined();
    expect(gameState.gameNPCs).toBeDefined();
    expect(gameState.gameLoot).toBeDefined();
  });

  it('should serialize schemas using correct Encoder API', () => {
    // Start with simple schemas first, then work up to complex ones
    const item = createCleanItem('test_item', 'Test Item', 1, 10, true);

    expect(() => {
      const encoder = new Encoder(item);
      const hasChanges = encoder.hasChanges;
      expect(typeof hasChanges).toBe('boolean');
    }).not.toThrow();

    // Test player schema (more complex)
    const player = createCleanPlayer('test_player', 'TestUser', 100, 100);

    expect(() => {
      const encoder = new Encoder(player);
      const hasChanges = encoder.hasChanges;
      expect(typeof hasChanges).toBe('boolean');
    }).not.toThrow();
  });

  it('should handle nested schemas correctly', () => {
    const gameState = createCleanGameState();
    const player = createCleanPlayer('test_player', 'TestUser', 100, 100);

    // Add player to game state
    gameState.gamePlayers.set('test_player', player);

    expect(gameState.gamePlayers.size).toBe(1);
    expect(gameState.gamePlayers.get('test_player')).toBe(player);
  });
});
