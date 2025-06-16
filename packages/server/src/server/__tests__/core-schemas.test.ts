/**
 * Basic test to verify the new CoreSchemas work correctly
 */

import {
  Player,
  Enemy,
  InventoryItem,
  GameRoomState,
  createPlayer,
  createEnemy,
  createInventoryItem,
  createGameRoomState,
} from '../schemas/CoreSchemas';

describe('Core Schemas Test', () => {
  it('should create a Player instance successfully', () => {
    const player = createPlayer('test-id', 'test-user');

    expect(player).toBeInstanceOf(Player);
    expect(player.id).toBe('test-id');
    expect(player.username).toBe('test-user');
    expect(player.health).toBe(100);
    expect(player.inventory).toBeDefined();
    expect(player.equipment).toBeDefined();
    expect(player.skills).toBeDefined();
  });

  it('should create an Enemy instance successfully', () => {
    const enemy = createEnemy('goblin-1', 'Goblin', 5);

    expect(enemy).toBeInstanceOf(Enemy);
    expect(enemy.id).toBe('goblin-1');
    expect(enemy.name).toBe('Goblin');
    expect(enemy.level).toBe(5);
    expect(enemy.position).toBeDefined();
  });

  it('should create an InventoryItem instance successfully', () => {
    const item = createInventoryItem('sword', 'Iron Sword', 1);

    expect(item).toBeInstanceOf(InventoryItem);
    expect(item.itemId).toBe('sword');
    expect(item.name).toBe('Iron Sword');
    expect(item.quantity).toBe(1);
  });

  it('should create a GameRoomState instance successfully', () => {
    const state = createGameRoomState();

    expect(state).toBeInstanceOf(GameRoomState);
    expect(state.players).toBeDefined();
    expect(state.enemies).toBeDefined();
    expect(state.tick).toBe(0);
    expect(state.timestamp).toBeGreaterThan(0);
  });

  it('should add a player to game state', () => {
    const state = createGameRoomState();
    const player = createPlayer('player-1', 'TestUser');

    state.players.set(player.id, player);

    expect(state.players.size).toBe(1);
    expect(state.players.get('player-1')).toBe(player);
  });

  it('should add an item to player inventory', () => {
    const player = createPlayer('player-1', 'TestUser');
    const item = createInventoryItem('potion', 'Health Potion', 5);

    player.inventory.push(item);

    expect(player.inventory.length).toBe(1);
    expect(player.inventory[0]).toBe(item);
    expect(player.inventory[0].quantity).toBe(5);
  });
});
