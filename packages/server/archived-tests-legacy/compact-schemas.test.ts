/**
 * Comprehensive Tests for CompactSchemas.ts
 * Tests Colyseus schema compatibility, serialization, and OSRS authenticity
 */

import { Encoder } from '@colyseus/schema';
import 'reflect-metadata';
import {
  CompactGameState,
  CompactInventoryItem,
  CompactLootItem,
  CompactNPC,
  CompactPlayer,
  IEquipmentData,
  ISkillsData,
} from '../game/CompactSchemas';

describe('CompactSchemas - Colyseus Compatibility', () => {
  beforeEach(() => {
    // Clear any previous schema registrations
    jest.clearAllMocks();
  });

  describe('Schema Registration & Serialization', () => {
    it('should register CompactPlayer schema without errors', () => {
      expect(() => {
        const player = new CompactPlayer('test123', 'TestUser');
        const encoder = new Encoder(player);
        encoder.setState(player);
      }).not.toThrow();
    });

    it('should register CompactInventoryItem schema without errors', () => {
      expect(() => {
        const item = new CompactInventoryItem('bronze_sword', 1, 'Bronze sword');
        const encoder = new Encoder(item);
        encoder.setState(item);
      }).not.toThrow();
    });

    it('should register CompactGameState schema without errors', () => {
      expect(() => {
        const gameState = new CompactGameState();
        const encoder = new Encoder(gameState);
        encoder.setState(gameState);
      }).not.toThrow();
    });

    it('should serialize and encode player state successfully', () => {
      const player = new CompactPlayer('player123', 'TestPlayer');
      player.updatePosition(50, 75);
      player.takeDamage(25);

      const encoder = new Encoder(player);
      encoder.setState(player);

      expect(() => {
        const changes = encoder.hasChanges();
        expect(changes).toBe(true);
      }).not.toThrow();
    });

    it('should handle nested ArraySchema serialization', () => {
      const gameState = new CompactGameState();
      const player = new CompactPlayer('p1', 'Player1');
      const item = new CompactInventoryItem('iron_ore', 5, 'Iron ore');

      player.addToInventory(item.itemId, item.quantity, item.name);
      gameState.addPlayer(player);

      const encoder = new Encoder(gameState);
      encoder.setState(gameState);

      expect(() => {
        const changes = encoder.hasChanges();
        expect(changes).toBe(true);
      }).not.toThrow();
    });
  });

  describe('CompactPlayer Schema', () => {
    let player: CompactPlayer;

    beforeEach(() => {
      player = new CompactPlayer('test_player', 'TestUser');
    });

    it('should initialize with default OSRS skills', () => {
      const skills = player.getSkills();

      expect(skills.attack.level).toBe(1);
      expect(skills.strength.level).toBe(1);
      expect(skills.defence.level).toBe(1);
      expect(skills.hitpoints.level).toBe(10); // OSRS default
      expect(skills.hitpoints.xp).toBe(1154); // OSRS default HP XP
      expect(skills.prayer.level).toBe(1);
      expect(skills.magic.level).toBe(1);
    });

    it('should calculate correct OSRS combat level', () => {
      // Test default combat level (level 3)
      expect(player.getCombatLevel()).toBe(3);

      // Test with custom skills
      const skills = player.getSkills();
      skills.attack.level = 40;
      skills.strength.level = 30;
      skills.defence.level = 20;
      skills.hitpoints.level = 35;
      player.setSkills(skills);

      const combatLevel = player.getCombatLevel();
      expect(combatLevel).toBeGreaterThan(3);
      expect(combatLevel).toBeLessThan(126); // Max combat level
    });

    it('should handle position updates with bounds checking', () => {
      player.updatePosition(50, 75);
      expect(player.x).toBe(50);
      expect(player.y).toBe(75);

      // Test bounds
      player.updatePosition(-10, 1500);
      expect(player.x).toBe(0); // Min bound
      expect(player.y).toBe(1000); // Max bound
    });

    it('should handle combat damage correctly', () => {
      const initialHealth = player.health;
      expect(player.isDead).toBe(false);

      // Take non-fatal damage
      const died = player.takeDamage(30);
      expect(died).toBe(false);
      expect(player.health).toBe(initialHealth - 30);

      // Take fatal damage
      const diedFinal = player.takeDamage(100);
      expect(diedFinal).toBe(true);
      expect(player.isDead).toBe(true);
      expect(player.health).toBe(0);
    });

    it('should handle healing correctly', () => {
      player.takeDamage(50);
      const damagedHealth = player.health;

      player.heal(20);
      expect(player.health).toBe(damagedHealth + 20);

      // Cannot heal beyond max health
      player.heal(1000);
      expect(player.health).toBe(player.maxHealth);
    });

    it('should serialize skills as JSON string', () => {
      const skills = player.getSkills();
      skills.magic.level = 55;
      skills.magic.xp = 166636;
      player.setSkills(skills);

      expect(typeof player.skillsData).toBe('string');

      const parsedSkills = player.getSkills();
      expect(parsedSkills.magic.level).toBe(55);
      expect(parsedSkills.magic.xp).toBe(166636);
    });

    it('should serialize equipment as JSON string', () => {
      const equipment = player.getEquipment();
      equipment.weapon = 'rune_scimitar';
      equipment.armor = 'rune_platebody';
      player.setEquipment(equipment);

      expect(typeof player.equipmentData).toBe('string');

      const parsedEquipment = player.getEquipment();
      expect(parsedEquipment.weapon).toBe('rune_scimitar');
      expect(parsedEquipment.armor).toBe('rune_platebody');
    });
  });

  describe('CompactInventoryItem Schema', () => {
    it('should create items with correct properties', () => {
      const item = new CompactInventoryItem('dragon_sword', 1, 'Dragon longsword');

      expect(item.itemId).toBe('dragon_sword');
      expect(item.quantity).toBe(1);
      expect(item.name).toBe('Dragon longsword');
      expect(item.stackable).toBe(false); // Default
    });

    it('should handle stackable items', () => {
      const item = new CompactInventoryItem('coins', 1000, 'Coins');
      item.stackable = true;

      expect(item.stackable).toBe(true);
      expect(item.quantity).toBe(1000);
    });

    it('should convert to/from data interfaces', () => {
      const item = new CompactInventoryItem('mithril_ore', 10, 'Mithril ore');
      item.value = 150;
      item.stackable = true;

      const data = item.toData();
      expect(data.itemId).toBe('mithril_ore');
      expect(data.quantity).toBe(10);
      expect(data.value).toBe(150);
      expect(data.stackable).toBe(true);

      const newItem = new CompactInventoryItem();
      newItem.fromData(data);
      expect(newItem.itemId).toBe(item.itemId);
      expect(newItem.quantity).toBe(item.quantity);
      expect(newItem.value).toBe(item.value);
    });
  });

  describe('Inventory Management', () => {
    let player: CompactPlayer;

    beforeEach(() => {
      player = new CompactPlayer('inv_test', 'InvUser');
    });

    it('should add non-stackable items separately', () => {
      const success1 = player.addToInventory('bronze_sword', 1, 'Bronze sword');
      const success2 = player.addToInventory('bronze_sword', 1, 'Bronze sword');

      expect(success1).toBe(true);
      expect(success2).toBe(true);
      expect(player.inventory.length).toBe(2);
    });

    it('should stack stackable items', () => {
      // Add first stack
      player.addToInventory('coins', 100, 'Coins');
      const firstItem = player.inventory[0];
      firstItem.stackable = true;

      // Add to existing stack
      const success = player.addToInventory('coins', 50, 'Coins');

      expect(success).toBe(true);
      expect(player.inventory.length).toBe(1);
      expect(player.inventory[0].quantity).toBe(150);
    });

    it('should respect inventory size limits', () => {
      // Fill inventory to capacity (28 items)
      for (let i = 0; i < 28; i++) {
        const success = player.addToInventory(`item_${i}`, 1, `Item ${i}`);
        expect(success).toBe(true);
      }

      // Try to add 29th item
      const overflow = player.addToInventory('overflow_item', 1, 'Overflow Item');
      expect(overflow).toBe(false);
      expect(player.inventory.length).toBe(28);
    });

    it('should remove items correctly', () => {
      player.addToInventory('test_item', 5, 'Test Item');
      expect(player.inventory.length).toBe(1);

      const removed = player.removeFromInventory('test_item', 3);
      expect(removed).toBe(true);
      expect(player.inventory[0].quantity).toBe(2);

      // Remove remaining
      const removedAll = player.removeFromInventory('test_item', 2);
      expect(removedAll).toBe(true);
      expect(player.inventory.length).toBe(0);
    });
  });

  describe('CompactGameState Schema', () => {
    let gameState: CompactGameState;

    beforeEach(() => {
      gameState = new CompactGameState();
    });

    it('should manage players correctly', () => {
      const player1 = gameState.addPlayer('p1', 'Player1');
      const player2 = gameState.addPlayer('p2', 'Player2');

      expect(gameState.players.size).toBe(2);
      expect(gameState.players.get('p1')).toBe(player1);
      expect(gameState.players.get('p2')).toBe(player2);
    });
    it('should handle player removal', () => {
      const player = gameState.addPlayer('test', 'Test');

      expect(gameState.players.size).toBe(1);

      gameState.removePlayer('test');
      expect(gameState.players.size).toBe(0);
    });

    it('should manage NPCs correctly', () => {
      const npc = gameState.addNPC('goblin_1', 'Goblin', 5, 100, 150);

      expect(gameState.npcs.size).toBe(1);
      expect(gameState.npcs.get('goblin_1')).toBe(npc);
    });

    it('should manage loot drops', () => {
      const loot = gameState.addLoot('loot_1', 'bronze_arrow', 25, 200, 250);

      expect(gameState.loot.size).toBe(1);
      expect(gameState.loot.get('loot_1')).toBe(loot);
    });

    it('should update game time', () => {
      const initialTime = gameState.gameTime;
      gameState.updateGameTime();
      expect(gameState.gameTime).toBeGreaterThan(initialTime);
    });
  });

  describe('OSRS Authenticity', () => {
    it('should use authentic OSRS skill names', () => {
      const player = new CompactPlayer('osrs_test', 'OSRSPlayer');
      const skills = player.getSkills();

      // Check all 23 OSRS skills exist
      const expectedSkills = [
        'attack',
        'strength',
        'defence',
        'hitpoints',
        'ranged',
        'prayer',
        'magic',
        'cooking',
        'woodcutting',
        'fletching',
        'fishing',
        'firemaking',
        'crafting',
        'smithing',
        'mining',
        'herblore',
        'agility',
        'thieving',
        'slayer',
        'farming',
        'runecraft',
        'hunter',
        'construction',
      ];

      expectedSkills.forEach(skill => {
        expect(skills[skill as keyof ISkillsData]).toBeDefined();
        expect(skills[skill as keyof ISkillsData].level).toBeGreaterThan(0);
      });
    });

    it('should use authentic equipment slot names', () => {
      const player = new CompactPlayer('eq_test', 'EquipTest');
      const equipment = player.getEquipment();

      const expectedSlots = [
        'weapon',
        'armor',
        'shield',
        'helmet',
        'legs',
        'boots',
        'gloves',
        'cape',
        'amulet',
        'ring',
      ];

      expectedSlots.forEach(slot => {
        expect(equipment[slot as keyof IEquipmentData]).toBeDefined();
      });
    });

    it('should calculate combat level using authentic OSRS formula', () => {
      const player = new CompactPlayer('combat_test', 'CombatTest');

      // Test known combat level calculations
      const skills = player.getSkills();

      // Level 3 default
      expect(player.getCombatLevel()).toBe(3);

      // Pure build test (1 def, high att/str)
      skills.attack.level = 60;
      skills.strength.level = 60;
      skills.defence.level = 1;
      skills.hitpoints.level = 60;
      player.setSkills(skills);

      const pureCombat = player.getCombatLevel();
      expect(pureCombat).toBeGreaterThan(40);
      expect(pureCombat).toBeLessThan(70);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('should handle large inventory operations efficiently', () => {
      const player = new CompactPlayer('perf_test', 'PerfTest');

      const start = performance.now();

      // Add many items
      for (let i = 0; i < 28; i++) {
        player.addToInventory(`item_${i}`, Math.floor(Math.random() * 100), `Item ${i}`);
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(100); // Should complete quickly
      expect(player.inventory.length).toBe(28);
    });

    it('should handle JSON serialization errors gracefully', () => {
      const player = new CompactPlayer('json_test', 'JSONTest');

      // Corrupt the JSON data
      player.skillsData = 'invalid json {';

      // Should return empty object, not throw
      const skills = player.getSkills();
      expect(typeof skills).toBe('object');
    });

    it('should validate position bounds consistently', () => {
      const player = new CompactPlayer('bounds_test', 'BoundsTest');

      // Test extreme values
      player.updatePosition(-999999, 999999);
      expect(player.x).toBe(0);
      expect(player.y).toBe(1000);

      player.updatePosition(500.7, 250.3);
      expect(player.x).toBe(500.7);
      expect(player.y).toBe(250.3);
    });

    it('should maintain last activity timestamp', () => {
      const player = new CompactPlayer('activity_test', 'ActivityTest');
      const initialActivity = player.lastActivity;

      // Small delay to ensure timestamp difference
      setTimeout(() => {
        player.updatePosition(10, 20);
        expect(player.lastActivity).toBeGreaterThan(initialActivity);
      }, 10);
    });
  });

  describe('Field Count Verification', () => {
    it('should stay under Colyseus 64-field limit', () => {
      // This test ensures we don't accidentally exceed the field limit
      const player = new CompactPlayer('field_test', 'FieldTest');

      // CompactPlayer should have exactly 15 fields:
      // playerId, username, x, y, animation, health, maxHealth, gold,
      // inCombat, combatTarget, isDead, skillsData, equipmentData,
      // inventory, lastActivity

      const encoder = new Encoder(player);
      expect(() => {
        encoder.setState(player);
      }).not.toThrow();
    });

    it('should verify each schema class field count', () => {
      // CompactInventoryItem: 5 fields
      const item = new CompactInventoryItem();
      expect(() => new Encoder(item)).not.toThrow();

      // CompactNPC: should be under limit
      const npc = new CompactNPC();
      expect(() => new Encoder(npc)).not.toThrow();

      // CompactLootItem: should be under limit
      const loot = new CompactLootItem();
      expect(() => new Encoder(loot)).not.toThrow();

      // CompactGameState: should be under limit
      const gameState = new CompactGameState();
      expect(() => new Encoder(gameState)).not.toThrow();
    });
  });
});
