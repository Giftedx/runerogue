/**
 * CleanSchemasV2.test.ts - Comprehensive test suite for new CleanSchemas
 * Tests serialization, multiplayer functionality, and OSRS authenticity
 */

import { Encoder } from '@colyseus/schema';
import {
  CleanGameState,
  CleanPlayer,
  createCleanGameState,
  createCleanItem,
  createCleanLoot,
  createCleanNPC,
  createCleanPlayer,
} from '../game/CleanSchemas';

describe('Clean Schema System V2', () => {
  describe('Schema Creation and Serialization', () => {
    it('should create and serialize clean items without errors', () => {
      expect(() => {
        const item = createCleanItem('sword_001', 'Iron Sword', 1, 100, false);

        expect(item.itemId).toBe('sword_001');
        expect(item.itemName).toBe('Iron Sword');
        expect(item.itemQuantity).toBe(1);
        expect(item.itemValue).toBe(100);
        expect(item.itemStackable).toBe(false);

        // Test serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(item, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should create and serialize clean players without errors', () => {
      expect(() => {
        const player = createCleanPlayer('player_001', 'TestUser', 50, 50);

        expect(player.playerId).toBe('player_001');
        expect(player.playerUsername).toBe('TestUser');
        expect(player.playerX).toBe(50);
        expect(player.playerY).toBe(50);
        expect(player.playerHealth).toBeGreaterThan(0);
        expect(player.playerSkills.skillHitpoints.skillLevel).toBe(10); // OSRS default

        // Test serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(player, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should create and serialize game state without errors', () => {
      expect(() => {
        const gameState = createCleanGameState();

        expect(gameState.gameStatus).toBe('running');
        expect(gameState.gameTickRate).toBe(60);
        expect(gameState.gamePlayers.size).toBe(0);
        expect(gameState.gameNPCs.size).toBe(0);
        expect(gameState.gameLoot.size).toBe(0);

        // Test serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(gameState, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });

  describe('Player Functionality', () => {
    let player: CleanPlayer;

    beforeEach(() => {
      player = createCleanPlayer('test_player', 'TestUser', 0, 0);
    });

    it('should handle player movement correctly', () => {
      const initialTime = player.playerLastAction;

      player.moveTo(100, 200);

      expect(player.playerX).toBe(100);
      expect(player.playerY).toBe(200);
      expect(player.playerLastAction).toBeGreaterThan(initialTime);
    });

    it('should handle player damage and healing', () => {
      const initialHealth = player.playerHealth;

      // Take damage
      const died = player.takeDamage(20);
      expect(player.playerHealth).toBe(initialHealth - 20);
      expect(died).toBe(false);

      // Heal
      player.heal(10);
      expect(player.playerHealth).toBe(initialHealth - 10);

      // Take fatal damage
      const fatalDied = player.takeDamage(player.playerHealth + 10);
      expect(player.playerHealth).toBe(0);
      expect(fatalDied).toBe(true);
    });

    it('should calculate OSRS combat level correctly', () => {
      // Test default starting stats
      const defaultCombatLevel = player.getCombatLevel();
      expect(defaultCombatLevel).toBeGreaterThan(0);

      // Level up some skills
      player.playerSkills.skillAttack.skillLevel = 50;
      player.playerSkills.skillStrength.skillLevel = 50;
      player.playerSkills.skillDefence.skillLevel = 40;

      const newCombatLevel = player.getCombatLevel();
      expect(newCombatLevel).toBeGreaterThan(defaultCombatLevel);
    });
  });

  describe('Inventory System', () => {
    let player: CleanPlayer;

    beforeEach(() => {
      player = createCleanPlayer('test_player', 'TestUser', 0, 0);
    });

    it('should add items to inventory correctly', () => {
      const item1 = createCleanItem('item_001', 'Test Item 1', 5, 10, true);
      const item2 = createCleanItem('item_002', 'Test Item 2', 1, 50, false);

      const added1 = player.playerInventory.addItem(item1);
      const added2 = player.playerInventory.addItem(item2);

      expect(added1).toBe(true);
      expect(added2).toBe(true);
      expect(player.playerInventory.inventoryUsedSlots).toBe(2);
      expect(player.playerInventory.inventoryItems.length).toBe(2);
    });

    it('should stack identical stackable items', () => {
      const item1 = createCleanItem('stackable_001', 'Coins', 100, 1, true);
      const item2 = createCleanItem('stackable_001', 'Coins', 50, 1, true);

      player.playerInventory.addItem(item1);
      player.playerInventory.addItem(item2);

      expect(player.playerInventory.inventoryUsedSlots).toBe(1);
      expect(player.playerInventory.inventoryItems[0].itemQuantity).toBe(150);
    });

    it('should remove items from inventory correctly', () => {
      const item = createCleanItem('item_001', 'Test Item', 10, 5, true);
      player.playerInventory.addItem(item);

      // Partial removal
      const removed1 = player.playerInventory.removeItem('item_001', 3);
      expect(removed1).toBe(true);
      expect(player.playerInventory.inventoryItems[0].itemQuantity).toBe(7);
      expect(player.playerInventory.inventoryUsedSlots).toBe(1);

      // Complete removal
      const removed2 = player.playerInventory.removeItem('item_001', 10);
      expect(removed2).toBe(true);
      expect(player.playerInventory.inventoryUsedSlots).toBe(0);
      expect(player.playerInventory.inventoryItems.length).toBe(0);
    });

    it('should respect maximum inventory slots', () => {
      player.playerInventory.inventoryMaxSlots = 2;

      const item1 = createCleanItem('item_001', 'Item 1', 1, 1, false);
      const item2 = createCleanItem('item_002', 'Item 2', 1, 1, false);
      const item3 = createCleanItem('item_003', 'Item 3', 1, 1, false);

      expect(player.playerInventory.addItem(item1)).toBe(true);
      expect(player.playerInventory.addItem(item2)).toBe(true);
      expect(player.playerInventory.addItem(item3)).toBe(false); // Should fail

      expect(player.playerInventory.inventoryUsedSlots).toBe(2);
    });
  });

  describe('Skills System', () => {
    let player: CleanPlayer;

    beforeEach(() => {
      player = createCleanPlayer('test_player', 'TestUser', 0, 0);
    });

    it('should add experience and handle level ups', () => {
      const attackSkill = player.playerSkills.skillAttack;
      const initialLevel = attackSkill.skillLevel;
      const initialXp = attackSkill.skillExperience;

      // Add some experience
      const leveledUp = attackSkill.addExperience(500);

      expect(attackSkill.skillExperience).toBe(initialXp + 500);
      // Level up depends on OSRS formula - may or may not happen
      if (leveledUp) {
        expect(attackSkill.skillLevel).toBeGreaterThan(initialLevel);
      }
    });

    it('should not exceed maximum skill level', () => {
      const skill = player.playerSkills.skillAttack;
      skill.skillLevel = 99; // Max level
      skill.skillExperience = 13034431; // Max XP

      const leveledUp = skill.addExperience(1000);

      expect(leveledUp).toBe(false);
      expect(skill.skillLevel).toBe(99);
    });

    it('should start with correct hitpoints level', () => {
      expect(player.playerSkills.skillHitpoints.skillLevel).toBe(10);
      expect(player.playerSkills.skillHitpoints.skillExperience).toBe(1184);
    });
  });

  describe('Equipment System', () => {
    let player: CleanPlayer;

    beforeEach(() => {
      player = createCleanPlayer('test_player', 'TestUser', 0, 0);
    });

    it('should equip and unequip items correctly', () => {
      const weapon = createCleanItem('weapon_001', 'Iron Sword', 1, 100, false);
      const helmet = createCleanItem('helmet_001', 'Iron Helmet', 1, 50, false);

      // Equip items
      const prevWeapon = player.playerEquipment.equipItem(weapon, 'weapon');
      const prevHelmet = player.playerEquipment.equipItem(helmet, 'head');

      expect(prevWeapon).toBeUndefined(); // No previous weapon
      expect(prevHelmet).toBeUndefined(); // No previous helmet
      expect(player.playerEquipment.equipmentWeapon).toBe(weapon);
      expect(player.playerEquipment.equipmentHead).toBe(helmet);

      // Unequip items
      const unequippedWeapon = player.playerEquipment.unequipItem('weapon');
      const unequippedHelmet = player.playerEquipment.unequipItem('head');

      expect(unequippedWeapon).toBe(weapon);
      expect(unequippedHelmet).toBe(helmet);
      expect(player.playerEquipment.equipmentWeapon).toBeUndefined();
      expect(player.playerEquipment.equipmentHead).toBeUndefined();
    });
  });

  describe('Game State Management', () => {
    let gameState: CleanGameState;

    beforeEach(() => {
      gameState = createCleanGameState();
    });

    it('should manage players correctly', () => {
      const player1 = createCleanPlayer('player_001', 'User1', 10, 20);
      const player2 = createCleanPlayer('player_002', 'User2', 30, 40);

      // Add players
      gameState.addPlayer(player1);
      gameState.addPlayer(player2);

      expect(gameState.gamePlayers.size).toBe(2);
      expect(player1.playerOnline).toBe(true);
      expect(player2.playerOnline).toBe(true);

      // Get player
      const retrievedPlayer = gameState.getPlayer('player_001');
      expect(retrievedPlayer).toBe(player1);

      // Remove player
      const removedPlayer = gameState.removePlayer('player_001');
      expect(removedPlayer).toBe(player1);
      expect(gameState.gamePlayers.size).toBe(1);
      expect(player1.playerOnline).toBe(false);
    });

    it('should manage NPCs correctly', () => {
      const npc1 = createCleanNPC('npc_001', 'Goblin', 100, 100, 5, 'monster');
      const npc2 = createCleanNPC('npc_002', 'Merchant', 50, 50, 1, 'vendor');

      gameState.addNPC(npc1);
      gameState.addNPC(npc2);

      expect(gameState.gameNPCs.size).toBe(2);
      expect(npc1.npcHealth).toBe(50); // level * 10
      expect(npc2.npcType).toBe('vendor');

      const removedNPC = gameState.removeNPC('npc_001');
      expect(removedNPC).toBe(npc1);
      expect(gameState.gameNPCs.size).toBe(1);
    });

    it('should manage loot correctly', () => {
      const loot1 = createCleanLoot('loot_001', 'item_001', 75, 75, 1, 'player_001');
      const loot2 = createCleanLoot('loot_002', 'item_002', 125, 125, 5, '');

      gameState.addLoot(loot1);
      gameState.addLoot(loot2);

      expect(gameState.gameLoot.size).toBe(2);
      expect(loot1.canPickup('player_001')).toBe(true); // Owner can always pickup
      expect(loot1.canPickup('player_002')).toBe(false); // Other players can't pickup yet
      expect(loot2.canPickup('anyone')).toBe(true); // No owner restriction

      const removedLoot = gameState.removeLoot('loot_001');
      expect(removedLoot).toBe(loot1);
      expect(gameState.gameLoot.size).toBe(1);
    });

    it('should clean up expired loot', () => {
      const expiredLoot = createCleanLoot('expired_001', 'item_001', 0, 0, 1, '');
      // Force expiration by setting despawn time in the past
      expiredLoot.lootDespawnTime = Date.now() - 1000;

      const validLoot = createCleanLoot('valid_001', 'item_002', 10, 10, 1, '');

      gameState.addLoot(expiredLoot);
      gameState.addLoot(validLoot);

      expect(gameState.gameLoot.size).toBe(2);

      const cleanedCount = gameState.cleanupExpiredLoot();

      expect(cleanedCount).toBe(1);
      expect(gameState.gameLoot.size).toBe(1);
      expect(gameState.gameLoot.has('valid_001')).toBe(true);
      expect(gameState.gameLoot.has('expired_001')).toBe(false);
    });

    it('should handle game ticks correctly', () => {
      const initialTimestamp = gameState.gameTimestamp;

      // Wait a moment then tick
      setTimeout(() => {
        gameState.tick();
        expect(gameState.gameTimestamp).toBeGreaterThan(initialTimestamp);
      }, 10);
    });
  });

  describe('Multiplayer Integration', () => {
    let gameState: CleanGameState;

    beforeEach(() => {
      gameState = createCleanGameState();
    });

    it('should handle multiple players with full serialization', () => {
      expect(() => {
        // Create multiple players with different states
        const player1 = createCleanPlayer('p1', 'Alice', 0, 0);
        const player2 = createCleanPlayer('p2', 'Bob', 100, 100);

        // Give them different items and skills
        const sword = createCleanItem('sword', 'Iron Sword', 1, 100, false);
        const coins = createCleanItem('coins', 'Coins', 1000, 1, true);

        player1.playerInventory.addItem(sword);
        player2.playerInventory.addItem(coins);

        player1.playerSkills.skillAttack.addExperience(1000);
        player2.playerSkills.skillMagic.addExperience(2000);

        // Add to game state
        gameState.addPlayer(player1);
        gameState.addPlayer(player2);

        // Add some NPCs and loot
        const goblin = createCleanNPC('goblin1', 'Goblin', 50, 50, 3);
        const loot = createCleanLoot('loot1', 'bones', 50, 50, 1, 'p1');

        gameState.addNPC(goblin);
        gameState.addLoot(loot);

        // Test full serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(gameState, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(100); // Should be substantial data

        // Verify state integrity
        expect(gameState.gamePlayers.size).toBe(2);
        expect(gameState.gameNPCs.size).toBe(1);
        expect(gameState.gameLoot.size).toBe(1);
      }).not.toThrow();
    });

    it('should serialize complex nested schemas without conflicts', () => {
      expect(() => {
        const player = createCleanPlayer('complex_player', 'ComplexUser', 25, 75);

        // Fill inventory with various items
        for (let i = 0; i < 10; i++) {
          const item = createCleanItem(
            `item_${i}`,
            `Test Item ${i}`,
            Math.floor(Math.random() * 100) + 1,
            Math.floor(Math.random() * 1000),
            i % 2 === 0
          );
          player.playerInventory.addItem(item);
        }

        // Level up all skills randomly
        Object.values(player.playerSkills).forEach(skill => {
          if (skill && 'addExperience' in skill) {
            skill.addExperience(Math.floor(Math.random() * 5000));
          }
        });

        // Equip some items
        const weapon = createCleanItem('complex_weapon', 'Dragon Sword', 1, 5000, false);
        const armor = createCleanItem('complex_armor', 'Dragon Armor', 1, 10000, false);

        player.playerEquipment.equipItem(weapon, 'weapon');
        player.playerEquipment.equipItem(armor, 'body');

        // Add to game state with other entities
        gameState.addPlayer(player);

        // Create complex environment
        for (let i = 0; i < 5; i++) {
          const npc = createCleanNPC(`npc_${i}`, `Monster ${i}`, i * 10, i * 10, i + 1);
          gameState.addNPC(npc);

          const loot = createCleanLoot(
            `loot_${i}`,
            `drop_${i}`,
            i * 15,
            i * 15,
            1,
            player.playerId
          );
          gameState.addLoot(loot);
        }

        // Full serialization test
        const encoder = new Encoder();
        const encoded = encoder.encode(gameState, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(500); // Complex data should be large
      }).not.toThrow();
    });
  });

  describe('OSRS Authenticity', () => {
    it('should follow OSRS combat level calculation', () => {
      const player = createCleanPlayer('osrs_test', 'OSRSPlayer', 0, 0);

      // Set known OSRS stats
      player.playerSkills.skillAttack.skillLevel = 60;
      player.playerSkills.skillStrength.skillLevel = 60;
      player.playerSkills.skillDefence.skillLevel = 60;
      player.playerSkills.skillHitpoints.skillLevel = 60;
      player.playerSkills.skillRanged.skillLevel = 1;
      player.playerSkills.skillPrayer.skillLevel = 43;
      player.playerSkills.skillMagic.skillLevel = 1;

      const combatLevel = player.getCombatLevel();

      // Should be around 67-68 with these stats
      expect(combatLevel).toBeGreaterThanOrEqual(65);
      expect(combatLevel).toBeLessThanOrEqual(70);
    });

    it('should start with correct OSRS default stats', () => {
      const player = createCleanPlayer('new_player', 'Newbie', 0, 0);

      // OSRS starting stats
      expect(player.playerSkills.skillAttack.skillLevel).toBe(1);
      expect(player.playerSkills.skillStrength.skillLevel).toBe(1);
      expect(player.playerSkills.skillDefence.skillLevel).toBe(1);
      expect(player.playerSkills.skillHitpoints.skillLevel).toBe(10);
      expect(player.playerSkills.skillRanged.skillLevel).toBe(1);
      expect(player.playerSkills.skillPrayer.skillLevel).toBe(1);
      expect(player.playerSkills.skillMagic.skillLevel).toBe(1);

      // Health should be hitpoints level * 10
      expect(player.playerHealth).toBe(100);
      expect(player.playerMaxHealth).toBe(100);
    });

    it('should handle inventory with OSRS-like constraints', () => {
      const player = createCleanPlayer('inv_test', 'InvTester', 0, 0);

      // OSRS has 28 inventory slots by default
      expect(player.playerInventory.inventoryMaxSlots).toBe(28);

      // Test with OSRS-like items
      const coins = createCleanItem('995', 'Coins', 10000, 1, true);
      const lobster = createCleanItem('379', 'Lobster', 5, 120, true);
      const rune_scimitar = createCleanItem('1333', 'Rune scimitar', 1, 15000, false);

      expect(player.playerInventory.addItem(coins)).toBe(true);
      expect(player.playerInventory.addItem(lobster)).toBe(true);
      expect(player.playerInventory.addItem(rune_scimitar)).toBe(true);

      expect(player.playerInventory.inventoryUsedSlots).toBe(3);
    });
  });
});
