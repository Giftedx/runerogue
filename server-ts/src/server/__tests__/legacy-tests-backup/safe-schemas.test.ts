/**
 * Test for Safe Entity Schemas - Idempotent Registration System
 */

import { Encoder } from '@colyseus/schema';
import {
  clearRegistrationCache,
  GameState,
  getRegistrationInfo,
  InventoryItem,
  isPropertyRegistered,
  LootDrop,
  NPC,
  Player,
  Skills,
} from '../game/SafeEntitySchemas';

describe('Safe Entity Schemas', () => {
  beforeAll(() => {
    // Clear any previous registrations
    clearRegistrationCache();
  });

  beforeEach(() => {
    // Log current registry state
    console.log('Registry state:', getRegistrationInfo());
  });

  it('should create Player without duplicate property errors', () => {
    const player = new Player();
    player.id = 'test-player';
    player.username = 'TestUser';
    player.x = 100;
    player.y = 200;
    player.health = 75;

    expect(player.id).toBe('test-player');
    expect(player.username).toBe('TestUser');
    expect(player.x).toBe(100);
    expect(player.y).toBe(200);
    expect(player.health).toBe(75);
  });

  it('should create multiple Player instances without registration conflicts', () => {
    const player1 = new Player();
    const player2 = new Player();

    player1.id = 'player1';
    player2.id = 'player2';

    expect(player1.id).toBe('player1');
    expect(player2.id).toBe('player2');
  });

  it('should encode Player without serialization errors', () => {
    const player = new Player();
    player.id = 'test-player';
    player.username = 'TestUser';
    player.health = 90;

    expect(() => {
      const encoder = new Encoder();
      const encoded = encoder.encode(player, {}, false);
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
      console.log('Player encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });

  it('should create GameState with complex nested structures', () => {
    const gameState = new GameState();

    // Add a player
    const player = new Player();
    player.id = 'player1';
    player.username = 'TestPlayer';

    // Add items to inventory
    const item1 = new InventoryItem();
    item1.itemId = 'sword';
    item1.itemName = 'Iron Sword';
    item1.quantity = 1;

    player.inventory.push(item1);
    gameState.players.set('player1', player);

    // Add an NPC
    const npc = new NPC();
    npc.id = 'npc1';
    npc.name = 'Guard';
    npc.level = 5;
    gameState.npcs.set('npc1', npc);

    // Add loot
    const loot = new LootDrop();
    loot.id = 'loot1';
    loot.x = 50;
    loot.y = 50;
    gameState.loot.set('loot1', loot);

    expect(gameState.players.size).toBe(1);
    expect(gameState.npcs.size).toBe(1);
    expect(gameState.loot.size).toBe(1);
  });

  it('should encode GameState without serialization errors', () => {
    const gameState = new GameState();

    const player = new Player();
    player.id = 'test-player';
    player.username = 'TestUser';
    gameState.players.set('test-player', player);

    expect(() => {
      const encoder = new Encoder();
      const encoded = encoder.encode(gameState, {}, false);
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
      console.log('GameState encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });

  it('should handle Skills with complex nested structures', () => {
    const skills = new Skills();
    skills.attackSkill.level = 50;
    skills.attackSkill.xp = 101333;
    skills.strength.level = 40;
    skills.defence.level = 60;

    expect(skills.attackSkill.level).toBe(50);
    expect(skills.attackSkill.xp).toBe(101333);
    expect(skills.strength.level).toBe(40);
    expect(skills.defence.level).toBe(60);

    expect(() => {
      const encoder = new Encoder();
      const encoded = encoder.encode(skills, {}, false);
      expect(encoded).toBeDefined();
      console.log('Skills encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });

  it('should handle InventoryItem arrays correctly', () => {
    const player = new Player();

    // Add multiple items
    for (let i = 0; i < 5; i++) {
      const item = new InventoryItem();
      item.itemId = `item_${i}`;
      item.itemName = `Test Item ${i}`;
      item.quantity = i + 1;
      player.inventory.push(item);
    }

    expect(player.inventory.length).toBe(5);
    expect(player.inventory[0].itemId).toBe('item_0');
    expect(player.inventory[4].quantity).toBe(5);

    expect(() => {
      const encoder = new Encoder();
      const encoded = encoder.encode(player, {}, false);
      expect(encoded).toBeDefined();
      console.log('Player with inventory encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });

  it('should track registration state correctly', () => {
    // Check that registrations have been tracked
    const registrationInfo = getRegistrationInfo();

    console.log('Final registration info:', registrationInfo);

    // Verify key classes are registered
    expect(registrationInfo['Player']).toBeDefined();
    expect(registrationInfo['Skill']).toBeDefined();
    expect(registrationInfo['Skills']).toBeDefined();
    expect(registrationInfo['InventoryItem']).toBeDefined();
    expect(registrationInfo['GameState']).toBeDefined();

    // Verify specific properties are registered
    expect(isPropertyRegistered('Player', 'id')).toBe(true);
    expect(isPropertyRegistered('Player', 'username')).toBe(true);
    expect(isPropertyRegistered('Skill', 'level')).toBe(true);
    expect(isPropertyRegistered('Skill', 'xp')).toBe(true);
  });

  it('should prevent duplicate registrations on re-import', () => {
    const initialRegistrationInfo = getRegistrationInfo();

    // Import again (simulating Jest re-importing)
    const SafeSchemas = require('../game/SafeEntitySchemas');

    // Create new instances
    const player = new SafeSchemas.Player();
    player.id = 'test-duplicate';

    const finalRegistrationInfo = getRegistrationInfo();

    // Registry should be the same (no duplicates added)
    expect(finalRegistrationInfo).toEqual(initialRegistrationInfo);

    // Should still be able to encode
    expect(() => {
      const encoder = new Encoder();
      const encoded = encoder.encode(player, {}, false);
      expect(encoded).toBeDefined();
    }).not.toThrow();
  });
});
