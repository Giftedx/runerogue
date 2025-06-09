/**
 * Test to verify EntitySchemas exports work with Jest/TypeScript decorators
 */

import { GameState, InventoryItem, Player } from '../../game/EntitySchemas';

describe('EntitySchemas Jest Fix Test', () => {
  beforeAll(() => {
    // Ensure reflect-metadata is available
    expect(typeof Reflect.getMetadata).toBe('function');
  });

  it('should import EntitySchemas classes successfully', () => {
    expect(Player).toBeDefined();
    expect(InventoryItem).toBeDefined();
    expect(GameState).toBeDefined();

    expect(typeof Player).toBe('function');
    expect(typeof InventoryItem).toBe('function');
    expect(typeof GameState).toBe('function');
  });

  it('should create Player instance', () => {
    const player = new Player();
    expect(player).toBeInstanceOf(Player);
    expect(player.id).toBeDefined();
    expect(player.username).toBeDefined();
    expect(player.x).toBeDefined();
    expect(player.y).toBeDefined();
  });

  it('should create InventoryItem instance', () => {
    const item = new InventoryItem();
    expect(item).toBeInstanceOf(InventoryItem);
    expect(item.itemId).toBeDefined();
    expect(item.name).toBeDefined();
    expect(item.quantity).toBeDefined();
  });

  it('should create GameState instance', () => {
    const gameState = new GameState();
    expect(gameState).toBeInstanceOf(GameState);
    expect(gameState.tick).toBeDefined();
    expect(gameState.players).toBeDefined();
  });
});
