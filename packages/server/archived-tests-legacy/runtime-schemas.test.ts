/**
 * Runtime Entity Schemas Test
 * Test the working schema system that doesn't rely on decorators
 */

import { RuntimeSchemas } from '../../game/RuntimeEntitySchemas';

const { Player, InventoryItem, GameState, createPlayer, createInventoryItem, createGameState } =
  RuntimeSchemas;

describe('Runtime Entity Schemas Test', () => {
  it('should create Player instance successfully', () => {
    const player = createPlayer('TestUser', 100, 200);

    expect(player).toBeDefined();
    expect(player.username).toBe('TestUser');
    expect(player.x).toBe(100);
    expect(player.y).toBe(200);
    expect(player.id).toBeDefined();
    expect(player.id.startsWith('player_')).toBe(true);
    expect(player.health).toBe(100);
    expect(player.maxHealth).toBe(100);
  });

  it('should create InventoryItem instance successfully', () => {
    const itemDef = {
      itemId: 'sword',
      name: 'Iron Sword',
      value: 100,
      stackable: false,
    };

    const item = createInventoryItem(itemDef, 1);

    expect(item).toBeDefined();
    expect(item.itemId).toBe('sword');
    expect(item.name).toBe('Iron Sword');
    expect(item.quantity).toBe(1);
    expect(item.value).toBe(100);
    expect(item.stackable).toBe(false);
  });

  it('should create GameState instance successfully', () => {
    const gameState = createGameState();

    expect(gameState).toBeDefined();
    expect(gameState.tick).toBe(0);
    expect(gameState.players).toBeDefined();
    expect(gameState.npcs).toBeDefined();
    expect(gameState.loot).toBeDefined();
    expect(gameState.serverTime).toBeGreaterThan(0);
  });

  it('should add player to game state', () => {
    const gameState = createGameState();
    const player = createPlayer('TestUser');

    gameState.addPlayer(player);

    expect(gameState.players.size).toBe(1);
    expect(gameState.players.get(player.id)).toBe(player);
  });

  it('should add item to player inventory', () => {
    const player = createPlayer('TestUser');
    const itemDef = {
      itemId: 'sword',
      name: 'Iron Sword',
      value: 100,
      stackable: false,
    };
    const item = createInventoryItem(itemDef, 1);

    const success = player.inventory.addItem(item);

    expect(success).toBe(true);
    expect(player.inventory.items.length).toBe(1);
    expect(player.inventory.items[0].itemId).toBe('sword');
  });

  it('should calculate combat level correctly', () => {
    const player = createPlayer('TestUser');

    // Set some skill levels
    player.skills.attack.level = 50;
    player.skills.strength.level = 50;
    player.skills.defence.level = 40;
    player.skills.hitpoints.level = 50;

    const combatLevel = player.calculateCombatLevel();

    expect(combatLevel).toBeGreaterThan(3);
    expect(player.combatLevel).toBe(combatLevel);
  });

  it('should handle player damage and healing', () => {
    const player = createPlayer('TestUser');

    // Take damage
    const isDead = player.takeDamage(30);
    expect(player.health).toBe(70);
    expect(isDead).toBe(false);

    // Heal
    player.heal(20);
    expect(player.health).toBe(90);

    // Take fatal damage
    const isDeadNow = player.takeDamage(100);
    expect(player.health).toBe(0);
    expect(isDeadNow).toBe(true);
  });

  it('should update game tick', () => {
    const gameState = createGameState();
    const initialTick = gameState.tick;
    const initialTimestamp = gameState.timestamp;

    gameState.updateTick();

    expect(gameState.tick).toBe(initialTick + 1);
    expect(gameState.timestamp).toBeGreaterThan(initialTimestamp);
  });

  it('should remove player from game state', () => {
    const gameState = createGameState();
    const player = createPlayer('TestUser');

    gameState.addPlayer(player);
    expect(gameState.players.size).toBe(1);

    const removed = gameState.removePlayer(player.id);
    expect(removed).toBe(true);
    expect(gameState.players.size).toBe(0);
  });
});
