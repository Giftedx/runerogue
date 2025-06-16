/**
 * Test for Consolidated Schema System
 * This test validates that the consolidated schemas work without conflicts
 */

import {
  Equipment,
  GameState,
  InventoryItem,
  NPC,
  Player,
  SchemaFactories,
  Skills,
} from '../game/ConsolidatedSchemas';

describe('Consolidated Schema System', () => {
  beforeEach(() => {
    // Clear any previous schema registrations if needed
  });

  it('should create player without schema conflicts', () => {
    expect(() => {
      const player = SchemaFactories.createPlayer('player1', 'testuser');
      expect(player.playerId).toBe('player1');
      expect(player.username).toBe('testuser');
      expect(player.health).toBe(100);
      expect(player.maxHealth).toBe(100);
    }).not.toThrow();
  });

  it('should create inventory items without conflicts', () => {
    expect(() => {
      const item1 = SchemaFactories.createInventoryItem('sword', 1);
      const item2 = SchemaFactories.createInventoryItem('potion', 5);

      expect(item1.itemId).toBe('sword');
      expect(item1.quantity).toBe(1);
      expect(item2.itemId).toBe('potion');
      expect(item2.quantity).toBe(5);
    }).not.toThrow();
  });

  it('should create game state and manage players', () => {
    expect(() => {
      const gameState = SchemaFactories.createGameState();

      const player1 = gameState.addPlayer('p1', 'user1');
      const player2 = gameState.addPlayer('p2', 'user2');

      expect(gameState.getAllPlayersCount()).toBe(2);
      expect(gameState.getPlayer('p1')).toBe(player1);
      expect(gameState.getPlayer('p2')).toBe(player2);
    }).not.toThrow();
  });

  it('should create NPCs and manage them', () => {
    expect(() => {
      const gameState = SchemaFactories.createGameState();

      const npc1 = gameState.addNPC('npc1', 'Goblin', 10, 20, 'goblin');
      const npc2 = gameState.addNPC('npc2', 'Orc', 30, 40, 'orc');

      expect(gameState.getAllNPCsCount()).toBe(2);
      expect(npc1.npcName).toBe('Goblin');
      expect(npc1.type).toBe('goblin');
      expect(npc1.health).toBe(50); // Goblin default health
      expect(npc2.health).toBe(100); // Orc default health
    }).not.toThrow();
  });

  it('should handle loot drops correctly', () => {
    expect(() => {
      const gameState = SchemaFactories.createGameState();

      const item1 = SchemaFactories.createInventoryItem('gold', 100);
      const item2 = SchemaFactories.createInventoryItem('sword', 1);

      const loot = gameState.addLootDrop('loot1', 50, 60, [item1, item2]);

      expect(gameState.getAllLootCount()).toBe(1);
      expect(loot.lootDropId).toBe('loot1');
      expect(loot.x).toBe(50);
      expect(loot.y).toBe(60);
      expect(loot.items.length).toBe(2);
    }).not.toThrow();
  });

  it('should allow proper schema nesting without field limit issues', () => {
    expect(() => {
      const player = SchemaFactories.createPlayer('p1', 'testuser');

      // Test equipment nesting
      player.equipment.weapon = 'dragon_sword';
      player.equipment.armor = 'rune_platebody';

      // Test skills nesting
      player.skills.attackSkill.level = 50;
      player.skills.strength.level = 45;

      // Test inventory
      const item = SchemaFactories.createInventoryItem('test_item', 3);
      player.inventory.push(item);

      expect(player.equipment.weapon).toBe('dragon_sword');
      expect(player.skills.attackSkill.level).toBe(50);
      expect(player.inventory.length).toBe(1);
      expect(player.inventory[0].itemId).toBe('test_item');
    }).not.toThrow();
  });

  it('should handle all schema field counts within limits', () => {
    // Validate that no schema exceeds 64 fields
    expect(() => {
      const player = new Player();
      const npc = new NPC('test', 'Test NPC', 0, 0, 'goblin');
      const gameState = new GameState();
      const item = new InventoryItem();
      const skills = new Skills();
      const equipment = new Equipment();

      // If any schema exceeds the 64-field limit, this will throw
      expect(player).toBeDefined();
      expect(npc).toBeDefined();
      expect(gameState).toBeDefined();
      expect(item).toBeDefined();
      expect(skills).toBeDefined();
      expect(equipment).toBeDefined();
    }).not.toThrow();
  });

  it('should support serialization and encoding', () => {
    expect(() => {
      const gameState = SchemaFactories.createGameState();
      const player = gameState.addPlayer('test', 'testuser');

      // This should not throw if schemas are properly defined
      const encoded = gameState.encode();
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });
});
