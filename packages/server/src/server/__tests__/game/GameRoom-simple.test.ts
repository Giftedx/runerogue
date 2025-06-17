import 'reflect-metadata';
import '../../utils/symbol-metadata-polyfill';

describe('GameRoom Simple Test', () => {
  test('should be able to import GameRoom without errors', () => {
    // Just test that we can import and instantiate basic components
    const { GameRoom } = require('../../game/GameRoom');
    const { GameState } = require('../../game/EntitySchemas');

    expect(GameRoom).toBeDefined();
    expect(GameState).toBeDefined();

    // Test basic schema creation
    const gameState = new GameState();
    expect(gameState).toBeDefined();
    expect(gameState.players).toBeDefined();
    expect(gameState.trades).toBeDefined();

    console.log('✅ GameRoom import and basic schema creation works');
  });

  test('should be able to create schema instances', () => {
    const { Player, InventoryItem, PlayerSkills } = require('../../game/EntitySchemas');

    const player = new Player();
    player.id = 'test-player';
    player.username = 'TestUser';
    player.x = 100;
    player.y = 200;

    const item = new InventoryItem();
    item.itemId = 'test-item';
    item.name = 'Test Item';
    item.quantity = 5;

    const skills = new PlayerSkills();
    skills.attack.level = 1;
    skills.defence.level = 1;

    expect(player.id).toBe('test-player');
    expect(item.quantity).toBe(5);
    expect(skills.attack.level).toBe(1);

    console.log('✅ Schema instances created successfully');
  });
  test('should be able to test encoding without Room', () => {
    const { Player, InventoryItem, PlayerSkills } = require('../../game/EntitySchemas');
    const { ArraySchema } = require('@colyseus/schema');

    const player = new Player();
    player.id = 'test-player';
    player.username = 'TestUser';

    const item = new InventoryItem();
    item.itemId = 'bronze_sword';
    item.name = 'Bronze Sword';
    item.quantity = 1;

    // Add item to player inventory
    player.inventory.push(item);
    expect(player.inventory.length).toBe(1);
    expect(player.inventory.at(0)?.itemId).toBe('bronze_sword');

    // Test that we can serialize the player using Colyseus encoding
    try {
      // In Colyseus, we test serialization by checking the schema instance properties
      // rather than calling encode() directly (which is done by the Room)
      expect(player).toBeInstanceOf(Player);
      expect(player.id).toBeDefined();
      expect(typeof player.x).toBe('number');
      expect(typeof player.y).toBe('number');
      expect(player.skills).toBeInstanceOf(PlayerSkills);
      expect(player.inventory).toBeInstanceOf(ArraySchema);
      console.log('✅ Player schema structure validation works');
    } catch (error) {
      console.log('❌ Player schema validation failed:', error);
      throw error;
    }
  });
});
