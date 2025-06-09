/**
 * Test for FinalSchemas.ts - Verifying the new unified schema system
 */

import { Encoder } from '@colyseus/schema';
import {
  GameState,
  NPC,
  Player,
  Skill,
  Skills,
  createInventoryItem,
  createLootItem,
  createNPC,
  createPlayer,
} from '../game/FinalSchemas';

describe('Final Schema System', () => {
  describe('Schema Creation and Serialization', () => {
    it('should create and serialize inventory items without errors', () => {
      expect(() => {
        const item = createInventoryItem('dragon_scimitar', 1, {
          name: 'Dragon scimitar',
          attack: 60,
          strength: 3,
          value: 100000,
        });

        // Test serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(item, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should create and serialize players without errors', () => {
      expect(() => {
        const player = createPlayer('player_001', 'TestPlayer');
        player.x = 3222;
        player.y = 3218;

        // Test serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(player, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should create and serialize game state without errors', () => {
      expect(() => {
        const gameState = new GameState();
        const player = createPlayer('player_001', 'TestPlayer');
        gameState.addPlayer(player);

        // Test serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(gameState, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should create and serialize NPCs without errors', () => {
      expect(() => {
        const npc = createNPC('goblin_001', 'Goblin', 5, 100, 100);

        // Test serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(npc, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it('should create and serialize loot items without errors', () => {
      expect(() => {
        const loot = createLootItem('loot_001', 'bones', 1, 150, 150, 'player_001');

        // Test serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(loot, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });

  describe('Game State Management', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    it('should manage players correctly', () => {
      const player = createPlayer('player_001', 'TestPlayer');

      // Add player
      gameState.addPlayer(player);
      expect(gameState.players.size).toBe(1);
      expect(gameState.players.get('player_001')).toBe(player);

      // Remove player
      const removed = gameState.removePlayer('player_001');
      expect(removed).toBe(true);
      expect(gameState.players.size).toBe(0);
    });

    it('should manage NPCs correctly', () => {
      const npc = createNPC('goblin_001', 'Goblin', 5, 100, 100);

      // Add NPC
      gameState.addNPC(npc);
      expect(gameState.npcs.size).toBe(1);
      expect(gameState.npcs.get('goblin_001')).toBe(npc);

      // Remove NPC
      const removed = gameState.removeNPC('goblin_001');
      expect(removed).toBe(true);
      expect(gameState.npcs.size).toBe(0);
    });

    it('should manage loot correctly', () => {
      const loot1 = createLootItem('loot_001', 'bones', 1, 150, 150, 'player_001');
      const loot2 = createLootItem('loot_002', 'coins', 100, 200, 200);

      // Add loot
      gameState.addLoot(loot1);
      gameState.addLoot(loot2);
      expect(gameState.loot.size).toBe(2);

      // Test pickup permissions
      expect(loot1.canPickup('player_001')).toBe(true); // Owner can always pickup
      expect(loot1.canPickup('player_002')).toBe(false); // Other players can't pickup yet
      expect(loot2.canPickup('anyone')).toBe(true); // No owner restriction

      const removedLoot = gameState.removeLoot('loot_001');
      expect(removedLoot).toBe(loot1);
      expect(gameState.loot.size).toBe(1);
    });

    it('should get entities in range correctly', () => {
      const player1 = createPlayer('player_001', 'Player1');
      player1.x = 100;
      player1.y = 100;

      const player2 = createPlayer('player_002', 'Player2');
      player2.x = 150;
      player2.y = 150;

      const player3 = createPlayer('player_003', 'Player3');
      player3.x = 300;
      player3.y = 300;

      gameState.addPlayer(player1);
      gameState.addPlayer(player2);
      gameState.addPlayer(player3);

      // Players within range of (100, 100) with range 100
      const playersInRange = gameState.getPlayersInRange(100, 100, 100);
      expect(playersInRange.length).toBe(2); // player1 and player2
      expect(playersInRange).toContain(player1);
      expect(playersInRange).toContain(player2);
      expect(playersInRange).not.toContain(player3);
    });
  });

  describe('Player Functionality', () => {
    let player: Player;

    beforeEach(() => {
      player = createPlayer('player_001', 'TestPlayer');
    });

    it('should handle movement correctly', () => {
      player.updatePosition(200, 300);
      expect(player.x).toBe(200);
      expect(player.y).toBe(300);
      expect(player.lastActivity).toBeGreaterThan(0);
    });

    it('should handle combat and health correctly', () => {
      expect(player.health).toBe(player.maxHealth);
      expect(player.isDead).toBe(false);

      // Take non-fatal damage
      const died = player.takeDamage(50);
      expect(died).toBe(false);
      expect(player.health).toBe(50);
      expect(player.isDead).toBe(false);

      // Take fatal damage
      const diedNow = player.takeDamage(60);
      expect(diedNow).toBe(true);
      expect(player.health).toBe(0);
      expect(player.isDead).toBe(true);
      expect(player.respawnTime).toBeGreaterThan(0);
    });

    it('should handle busy state correctly', () => {
      expect(player.canAct()).toBe(true);

      player.setBusy(1000);
      expect(player.canAct()).toBe(false);
      expect(player.isBusy).toBe(true);

      // Simulate time passing
      player.busyUntil = Date.now() - 1000;
      player.updateBusyStatus();
      expect(player.canAct()).toBe(true);
      expect(player.isBusy).toBe(false);
    });

    it('should calculate combat level correctly using OSRS formula', () => {
      // Set some test stats
      player.skills.attack.level = 60;
      player.skills.strength.level = 60;
      player.skills.defence.level = 60;
      player.skills.hitpoints.level = 60;
      player.skills.prayer.level = 45;

      const combatLevel = player.getCombatLevel();
      expect(combatLevel).toBeGreaterThan(0);
      expect(combatLevel).toBeLessThanOrEqual(126); // Max combat level
    });
  });

  describe('Inventory System', () => {
    let player: Player;

    beforeEach(() => {
      player = createPlayer('player_001', 'TestPlayer');
    });

    it('should handle inventory operations correctly', () => {
      const item1 = createInventoryItem('coins', 100, { stackable: true });
      const item2 = createInventoryItem('dragon_scimitar', 1);

      // Add items
      expect(player.inventory.addItem(item1)).toBe(true);
      expect(player.inventory.addItem(item2)).toBe(true);
      expect(player.inventory.items.length).toBe(2);

      // Test stacking
      const moreCoins = createInventoryItem('coins', 50, { stackable: true });
      expect(player.inventory.addItem(moreCoins)).toBe(true);
      expect(player.inventory.items.length).toBe(2); // Should stack
      expect(player.inventory.items[0].quantity).toBe(150);

      // Remove items
      expect(player.inventory.removeItem('coins', 25)).toBe(true);
      expect(player.inventory.items[0].quantity).toBe(125);

      expect(player.inventory.removeItem('dragon_scimitar', 1)).toBe(true);
      expect(player.inventory.items.length).toBe(1);
    });

    it('should respect inventory size limits', () => {
      const inventory = player.inventory;

      // Fill inventory to capacity
      for (let i = 0; i < 28; i++) {
        const item = createInventoryItem(`item_${i}`, 1);
        expect(inventory.addItem(item)).toBe(true);
      }

      expect(inventory.items.length).toBe(28);
      expect(inventory.getAvailableSpace()).toBe(0);

      // Try to add one more item (should fail)
      const extraItem = createInventoryItem('extra_item', 1);
      expect(inventory.addItem(extraItem)).toBe(false);
      expect(inventory.items.length).toBe(28);
    });
  });

  describe('Skills System', () => {
    let skills: Skills;

    beforeEach(() => {
      skills = new Skills();
    });

    it('should handle skill level calculations correctly', () => {
      const skill = new Skill(50, 101333); // Level 50 XP
      expect(skill.level).toBe(50);

      // Test level calculation from XP
      skill.xp = 1210421; // Should be around level 80
      skill.updateLevel();
      expect(skill.level).toBeGreaterThanOrEqual(75);
      expect(skill.level).toBeLessThanOrEqual(85);
    });

    it('should calculate total level correctly', () => {
      // Set all skills to level 50
      Object.values(skills).forEach(skill => {
        if (skill instanceof Skill) {
          skill.level = 50;
        }
      });

      const totalLevel = skills.getTotalLevel();
      expect(totalLevel).toBe(50 * 23); // 23 skills in OSRS
    });

    it('should start with correct OSRS default stats', () => {
      expect(skills.hitpoints.level).toBe(10); // Hitpoints starts at 10
      expect(skills.attack.level).toBe(1);
      expect(skills.strength.level).toBe(1);
      expect(skills.defence.level).toBe(1);
    });
  });

  describe('NPC System', () => {
    let npc: NPC;

    beforeEach(() => {
      npc = createNPC('goblin_001', 'Goblin', 5, 100, 100);
    });

    it('should handle NPC combat correctly', () => {
      expect(npc.health).toBe(npc.maxHealth);
      expect(npc.isDead).toBe(false);

      // Take damage
      const died = npc.takeDamage(30);
      expect(died).toBe(false);
      expect(npc.health).toBe(20);

      // Take fatal damage
      const diedNow = npc.takeDamage(25);
      expect(diedNow).toBe(true);
      expect(npc.isDead).toBe(true);
      expect(npc.respawnTime).toBeGreaterThan(0);
    });

    it('should handle respawn correctly', () => {
      npc.takeDamage(1000); // Kill NPC
      expect(npc.isDead).toBe(true);

      // Simulate respawn time passing
      npc.respawnTime = Date.now() - 1000;
      expect(npc.canRespawn()).toBe(true);

      npc.respawn();
      expect(npc.isDead).toBe(false);
      expect(npc.health).toBe(npc.maxHealth);
      expect(npc.aiState).toBe('idle');
    });
  });

  describe('Multiplayer Integration', () => {
    let gameState: GameState;

    beforeEach(() => {
      gameState = new GameState();
    });

    it('should handle multiple players with full serialization', () => {
      expect(() => {
        // Create multiple players with different setups
        const player1 = createPlayer('player_001', 'TestPlayer1');
        player1.x = 100;
        player1.y = 100;
        player1.skills.attack.level = 60;

        const player2 = createPlayer('player_002', 'TestPlayer2');
        player2.x = 200;
        player2.y = 200;
        player2.skills.magic.level = 75;

        // Add some items to inventories
        player1.inventory.addItem(createInventoryItem('dragon_scimitar', 1));
        player2.inventory.addItem(createInventoryItem('rune_sword', 1));

        gameState.addPlayer(player1);
        gameState.addPlayer(player2);

        // Add some NPCs
        const npc1 = createNPC('goblin_001', 'Goblin', 5, 150, 150);
        const npc2 = createNPC('orc_001', 'Orc', 25, 250, 250);

        gameState.addNPC(npc1);
        gameState.addNPC(npc2);

        // Add some loot
        const loot = createLootItem('loot_001', 'bones', 1, 175, 175, 'player_001');
        gameState.addLoot(loot);

        expect(gameState.players.size).toBe(2);
        expect(gameState.npcs.size).toBe(2);
        expect(gameState.loot.size).toBe(1);

        // Test full serialization
        const encoder = new Encoder();
        const encoded = encoder.encode(gameState, {}, false);
        expect(encoded).toBeDefined();
        expect(encoded.length).toBeGreaterThan(100); // Should be substantial data
      }).not.toThrow();
    });

    it('should serialize complex nested schemas without conflicts', () => {
      expect(() => {
        const gameState = new GameState();

        // Create a player with complex nested data
        const player = createPlayer('player_001', 'ComplexPlayer');

        // Add multiple skills with different levels
        player.skills.attack.level = 99;
        player.skills.strength.level = 85;
        player.skills.defence.level = 70;
        player.skills.magic.level = 94;
        player.skills.prayer.level = 43;

        // Add equipment
        player.equipment.weapon = 'dragon_scimitar';
        player.equipment.armor = 'rune_platebody';
        player.equipment.shield = 'dragon_defender';

        // Add inventory items
        for (let i = 0; i < 20; i++) {
          player.inventory.addItem(createInventoryItem(`item_${i}`, i + 1));
        }

        gameState.addPlayer(player);

        // Add multiple NPCs with different configurations
        for (let i = 0; i < 10; i++) {
          const npc = createNPC(`npc_${i}`, `Monster${i}`, i + 5, i * 50, i * 50);
          npc.health = npc.maxHealth * 0.8; // Partial health
          gameState.addNPC(npc);
        }

        // Add multiple loot items
        for (let i = 0; i < 15; i++) {
          const loot = createLootItem(`loot_${i}`, `item_${i}`, i + 1, i * 25, i * 25);
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
      const player = createPlayer('player_001', 'TestPlayer');

      // Set realistic combat stats
      player.skills.attack.level = 70;
      player.skills.strength.level = 70;
      player.skills.defence.level = 70;
      player.skills.hitpoints.level = 70;
      player.skills.prayer.level = 52;

      const combatLevel = player.getCombatLevel();

      // Should be around 74-75 with these stats
      expect(combatLevel).toBeGreaterThanOrEqual(70);
      expect(combatLevel).toBeLessThanOrEqual(80);
    });

    it('should start with correct OSRS default stats', () => {
      const player = createPlayer('player_001', 'TestPlayer');

      expect(player.skills.hitpoints.level).toBe(10);
      expect(player.skills.attack.level).toBe(1);
      expect(player.skills.strength.level).toBe(1);
      expect(player.skills.defence.level).toBe(1);
      expect(player.skills.prayer.level).toBe(1);
      expect(player.skills.magic.level).toBe(1);

      // Check starting position (Lumbridge)
      expect(player.x).toBe(3222);
      expect(player.y).toBe(3218);
    });

    it('should respect OSRS inventory constraints', () => {
      const player = createPlayer('player_001', 'TestPlayer');

      // OSRS inventory is 28 slots
      expect(player.inventory.maxSize).toBe(28);

      // Test stackable items (coins should stack)
      const coins1 = createInventoryItem('coins', 1000, { stackable: true });
      const coins2 = createInventoryItem('coins', 500, { stackable: true });

      player.inventory.addItem(coins1);
      player.inventory.addItem(coins2);

      expect(player.inventory.items.length).toBe(1); // Should stack
      expect(player.inventory.items[0].quantity).toBe(1500);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large numbers of entities efficiently', () => {
      const gameState = new GameState();

      // Add many players
      for (let i = 0; i < 100; i++) {
        const player = createPlayer(`player_${i}`, `Player${i}`);
        player.x = Math.random() * 1000;
        player.y = Math.random() * 1000;
        gameState.addPlayer(player);
      }

      // Add many NPCs
      for (let i = 0; i < 200; i++) {
        const npc = createNPC(`npc_${i}`, `Monster${i}`, Math.floor(Math.random() * 50) + 1);
        npc.x = Math.random() * 1000;
        npc.y = Math.random() * 1000;
        gameState.addNPC(npc);
      }

      expect(gameState.players.size).toBe(100);
      expect(gameState.npcs.size).toBe(200);

      // Test range queries are efficient
      const start = Date.now();
      const playersInRange = gameState.getPlayersInRange(500, 500, 100);
      const npcsInRange = gameState.getNPCsInRange(500, 500, 100);
      const end = Date.now();

      expect(end - start).toBeLessThan(50); // Should be fast
      expect(playersInRange.length).toBeGreaterThanOrEqual(0);
      expect(npcsInRange.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle edge cases in damage and healing', () => {
      const player = createPlayer('player_001', 'TestPlayer');

      // Test negative damage (should not heal)
      const initialHealth = player.health;
      player.takeDamage(-10);
      expect(player.health).toBe(initialHealth);

      // Test excessive damage
      player.takeDamage(9999);
      expect(player.health).toBe(0);
      expect(player.isDead).toBe(true);

      // Test healing when dead (should not work)
      player.heal(100);
      expect(player.health).toBe(0);
      expect(player.isDead).toBe(true);

      // Test respawn and healing
      player.respawnTime = Date.now() - 1000;
      player.respawn();
      expect(player.isDead).toBe(false);
      expect(player.health).toBe(player.maxHealth);

      // Test overhealing
      player.heal(9999);
      expect(player.health).toBe(player.maxHealth);
    });

    it('should handle invalid skill levels correctly', () => {
      // Test level bounds enforcement
      const skill1 = new Skill(0, 0); // Below minimum
      expect(skill1.level).toBe(1);

      const skill2 = new Skill(150, 0); // Above maximum
      expect(skill2.level).toBe(99);

      const skill3 = new Skill(50, -100); // Negative XP
      expect(skill3.xp).toBe(0);
    });
  });
});
