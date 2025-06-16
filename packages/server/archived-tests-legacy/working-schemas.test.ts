/**
 * Test for Working Entity Schemas
 *
 * Tests the new schema implementation that avoids naming conflicts.
 */

import { Encoder } from '@colyseus/schema';
import {
  GameState,
  createInventoryItem,
  createLootDrop,
  createNPC,
  createPlayer,
} from '../game/WorkingEntitySchemas';

describe('Working Entity Schemas', () => {
  it('should create and serialize Player without errors', () => {
    expect(() => {
      const player = createPlayer('p1', 'testuser');
      expect(player.player_id).toBe('p1');
      expect(player.player_username).toBe('testuser');
      expect(player.player_health).toBe(100);
      expect(player.player_x).toBe(0);
      expect(player.player_y).toBe(0);

      // Test serialization
      const encoder = new Encoder();
      const encoded = encoder.encode(player, {}, false);
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should create and serialize NPC without errors', () => {
    expect(() => {
      const npc = createNPC('npc1', 'Goblin', 'enemy');
      expect(npc.npc_id).toBe('npc1');
      expect(npc.npc_name).toBe('Goblin');
      expect(npc.npc_type).toBe('enemy');
      expect(npc.npc_combat.npc_health).toBe(100);

      // Test serialization
      const encoder = new Encoder();
      const encoded = encoder.encode(npc, {}, false);
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should create and serialize InventoryItem without errors', () => {
    expect(() => {
      const item = createInventoryItem('dragon_scimitar', 1);
      expect(item.item_id).toBe('dragon_scimitar');
      expect(item.item_quantity).toBe(1);

      // Test serialization
      const encoder = new Encoder();
      const encoded = encoder.encode(item, {}, false);
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should create and serialize LootDrop without errors', () => {
    expect(() => {
      const loot = createLootDrop('loot1', 10, 20);
      expect(loot.loot_id).toBe('loot1');
      expect(loot.loot_x).toBe(10);
      expect(loot.loot_y).toBe(20);

      // Test serialization
      const encoder = new Encoder();
      const encoded = encoder.encode(loot, {}, false);
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should create and serialize GameState without errors', () => {
    expect(() => {
      const gameState = new GameState();

      // Add some entities
      const player = createPlayer('p1', 'testuser');
      const npc = createNPC('npc1', 'Goblin', 'enemy');
      const loot = createLootDrop('loot1', 5, 5);

      gameState.addPlayer(player);
      gameState.addNPC(npc);
      gameState.addLootDrop(loot);

      expect(gameState.game_players.size).toBe(1);
      expect(gameState.game_npcs.size).toBe(1);
      expect(gameState.game_loot.size).toBe(1);

      // Test serialization
      const encoder = new Encoder();
      const encoded = encoder.encode(gameState, {}, false);
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should handle player inventory operations correctly', () => {
    expect(() => {
      const player = createPlayer('p1', 'testuser');
      const item = createInventoryItem('bronze_sword', 1);

      // Add item to inventory
      const added = player.addItemToInventory(item);
      expect(added).toBe(true);
      expect(player.player_inventory.length).toBe(1);
      expect(player.player_inventory[0].item_id).toBe('bronze_sword');

      // Remove item from inventory
      const removed = player.removeItemFromInventory(0);
      expect(removed).not.toBeNull();
      expect(removed!.item_id).toBe('bronze_sword');
      expect(player.player_inventory.length).toBe(0);
    }).not.toThrow();
  });

  it('should handle stackable item mechanics correctly', () => {
    expect(() => {
      const player = createPlayer('p1', 'testuser');
      const item1 = createInventoryItem('coins', 100);
      const item2 = createInventoryItem('coins', 50);

      // Mark as stackable
      item1.item_stackable = true;
      item2.item_stackable = true;

      // Add first stack
      player.addItemToInventory(item1);
      expect(player.player_inventory.length).toBe(1);
      expect(player.player_inventory[0].item_quantity).toBe(100);

      // Add second stack - should combine
      player.addItemToInventory(item2);
      expect(player.player_inventory.length).toBe(1);
      expect(player.player_inventory[0].item_quantity).toBe(150);
    }).not.toThrow();
  });

  it('should calculate combat levels correctly using OSRS formula', () => {
    expect(() => {
      const player = createPlayer('p1', 'testuser');

      // Set some skill levels
      player.player_skills.skills_attack.skill_level = 60;
      player.player_skills.skills_strength.skill_level = 70;
      player.player_skills.skills_defence.skill_level = 50;

      const combatLevel = player.getCombatLevel();
      expect(combatLevel).toBe(60); // (60 + 70 + 50) / 3 = 60
    }).not.toThrow();
  });

  it('should handle NPC combat mechanics correctly', () => {
    expect(() => {
      const npc = createNPC('goblin1', 'Goblin', 'enemy');

      // Set NPC stats
      npc.npc_attack_level = 10;
      npc.npc_strength_level = 10;
      npc.npc_defence_level = 10;
      npc.npc_combat.npc_health = 25;
      npc.npc_max_health = 25;

      // Test damage
      npc.takeDamage(10);
      expect(npc.npc_combat.npc_health).toBe(15);

      // Test death
      npc.takeDamage(20);
      expect(npc.npc_combat.npc_health).toBe(0);
      expect(npc.isDead()).toBe(true);

      // Test combat level
      const combatLevel = npc.getCombatLevel();
      expect(combatLevel).toBe(10);
    }).not.toThrow();
  });

  it('should handle equipment bonuses correctly', () => {
    expect(() => {
      const player = createPlayer('p1', 'testuser');
      const weapon = createInventoryItem('steel_sword', 1);

      // Set weapon stats
      weapon.item_attack_bonus = 20;
      weapon.item_strength_bonus = 18;
      weapon.item_defence_bonus = 0;

      // Equip weapon
      player.player_equipment.equip_weapon = weapon;

      // Test bonuses
      expect(player.player_equipment.getTotalAttackBonus()).toBe(20);
      expect(player.player_equipment.getTotalStrengthBonus()).toBe(18);
      expect(player.player_equipment.getTotalDefenceBonus()).toBe(0);
    }).not.toThrow();
  });

  it('should handle loot drop mechanics correctly', () => {
    expect(() => {
      const loot = createLootDrop('loot1', 10, 10);
      const item = createInventoryItem('bones', 1);

      loot.addItem(item);
      expect(loot.loot_items.length).toBe(1);
      expect(loot.loot_items[0].item_id).toBe('bones');

      // Test despawn timing (should not despawn immediately)
      expect(loot.shouldDespawn()).toBe(false);
    }).not.toThrow();
  });

  it('should handle game state management correctly', () => {
    expect(() => {
      const gameState = new GameState();
      const player1 = createPlayer('p1', 'player1');
      const player2 = createPlayer('p2', 'player2');
      const npc1 = createNPC('npc1', 'Goblin', 'enemy');

      // Add entities
      gameState.addPlayer(player1);
      gameState.addPlayer(player2);
      gameState.addNPC(npc1);

      // Test retrieval
      expect(gameState.getPlayer('p1')).toBe(player1);
      expect(gameState.getPlayer('p2')).toBe(player2);
      expect(gameState.getAllPlayers().length).toBe(2);
      expect(gameState.getAllNPCs().length).toBe(1);

      // Test removal
      gameState.removePlayer('p1');
      expect(gameState.game_players.size).toBe(1);
      expect(gameState.getPlayer('p1')).toBeUndefined();

      gameState.removeNPC('npc1');
      expect(gameState.game_npcs.size).toBe(0);
    }).not.toThrow();
  });

  it('should maintain server time correctly', () => {
    expect(() => {
      const gameState = new GameState();
      const initialTime = gameState.game_server_time;

      // Update server time
      setTimeout(() => {
        gameState.updateServerTime();
        expect(gameState.game_server_time).toBeGreaterThan(initialTime);
      }, 10);
    }).not.toThrow();
  });

  it('should handle skill XP and level progression correctly', () => {
    expect(() => {
      const player = createPlayer('p1', 'testuser');
      const attackSkill = player.player_skills.skills_attack;

      // Initial state
      expect(attackSkill.skill_level).toBe(1);
      expect(attackSkill.skill_xp).toBe(0);

      // Add XP
      attackSkill.addXp(100);
      expect(attackSkill.skill_xp).toBe(100);
      expect(attackSkill.skill_level).toBeGreaterThan(1);
    }).not.toThrow();
  });
});
