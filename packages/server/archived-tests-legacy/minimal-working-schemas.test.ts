/**
 * Test for Minimal Working Schemas - verify Colyseus serialization works
 */

import { Encoder } from '@colyseus/schema';
import { MinimalSchemas } from '../game/MinimalWorkingSchemas';

const {
  BasicItem,
  BasicPlayer,
  BasicNPC,
  BasicLoot,
  BasicGameState,
  createBasicItem,
  createBasicPlayer,
  createBasicNPC,
  createBasicLoot,
  createBasicGameState,
} = MinimalSchemas;

describe('Minimal Working Schemas', () => {
  it('should create BasicItem without schema errors', () => {
    expect(() => {
      const item = createBasicItem('sword_001', 'Iron Sword', 'weapon', 1);
      expect(item.item_id).toBe('sword_001');
      expect(item.item_name).toBe('Iron Sword');
      expect(item.item_type).toBe('weapon');
      expect(item.item_quantity).toBe(1);
    }).not.toThrow();
  });

  it('should create BasicPlayer without schema errors', () => {
    expect(() => {
      const player = createBasicPlayer('player_123', 'TestPlayer');
      player.player_x = 10;
      player.player_y = 20;
      player.player_health = 95;

      expect(player.player_id).toBe('player_123');
      expect(player.player_name).toBe('TestPlayer');
      expect(player.player_x).toBe(10);
      expect(player.player_y).toBe(20);
      expect(player.player_health).toBe(95);
    }).not.toThrow();
  });

  it('should add items to player inventory without errors', () => {
    expect(() => {
      const player = createBasicPlayer('player_123', 'TestPlayer');
      const item1 = createBasicItem('sword_001', 'Iron Sword', 'weapon');
      const item2 = createBasicItem('food_001', 'Lobster', 'food', 5);

      player.player_inventory.push(item1);
      player.player_inventory.push(item2);

      expect(player.player_inventory.length).toBe(2);
      expect(player.player_inventory[0].item_name).toBe('Iron Sword');
      expect(player.player_inventory[1].item_quantity).toBe(5);
    }).not.toThrow();
  });

  it('should create BasicGameState and add entities without errors', () => {
    expect(() => {
      const gameState = createBasicGameState();
      const player = createBasicPlayer('player_123', 'TestPlayer');
      const npc = createBasicNPC('npc_001', 'Goblin');
      const loot = createBasicLoot('loot_001', 15, 25);

      gameState.state_players.set('player_123', player);
      gameState.state_npcs.set('npc_001', npc);
      gameState.state_loot.set('loot_001', loot);

      expect(gameState.state_players.size).toBe(1);
      expect(gameState.state_npcs.size).toBe(1);
      expect(gameState.state_loot.size).toBe(1);
      expect(gameState.state_players.get('player_123')?.player_name).toBe('TestPlayer');
      expect(gameState.state_npcs.get('npc_001')?.npc_name).toBe('Goblin');
    }).not.toThrow();
  });

  it('should serialize BasicGameState with Colyseus Encoder without errors', () => {
    expect(() => {
      const gameState = createBasicGameState();
      const player = createBasicPlayer('player_123', 'TestPlayer');

      // Add item to player inventory
      const item = createBasicItem('sword_001', 'Iron Sword', 'weapon');
      player.player_inventory.push(item);

      // Add entities to game state
      gameState.state_players.set('player_123', player);
      gameState.state_tick = 100;

      // Create encoder and serialize
      const encoder = new Encoder(gameState);
      const encoded = encoder.encode();

      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
      console.log('✅ Successfully encoded BasicGameState:', encoded.length, 'bytes');
    }).not.toThrow();
  });

  it('should handle complex gameplay scenario', () => {
    expect(() => {
      const gameState = createBasicGameState();

      // Create multiple players
      const player1 = createBasicPlayer('player_001', 'Alice');
      const player2 = createBasicPlayer('player_002', 'Bob');

      // Give them some items
      player1.player_inventory.push(createBasicItem('sword_001', 'Iron Sword', 'weapon'));
      player1.player_inventory.push(createBasicItem('food_001', 'Lobster', 'food', 3));

      player2.player_inventory.push(createBasicItem('bow_001', 'Oak Bow', 'weapon'));
      player2.player_inventory.push(createBasicItem('arrow_001', 'Bronze Arrow', 'ammo', 50));

      // Create some NPCs
      const goblin = createBasicNPC('npc_001', 'Goblin Warrior');
      goblin.npc_x = 100;
      goblin.npc_y = 150;

      const orc = createBasicNPC('npc_002', 'Orc Shaman');
      orc.npc_x = 200;
      orc.npc_y = 250;
      orc.npc_health = 80;

      // Create loot drops
      const loot1 = createBasicLoot('loot_001', 120, 130);
      loot1.loot_items.push(createBasicItem('coins_001', 'Gold Coins', 'currency', 25));

      const loot2 = createBasicLoot('loot_002', 180, 190);
      loot2.loot_items.push(createBasicItem('gem_001', 'Ruby', 'gem'));
      loot2.loot_items.push(createBasicItem('scroll_001', 'Teleport Scroll', 'magic'));

      // Add everything to game state
      gameState.state_players.set('player_001', player1);
      gameState.state_players.set('player_002', player2);
      gameState.state_npcs.set('npc_001', goblin);
      gameState.state_npcs.set('npc_002', orc);
      gameState.state_loot.set('loot_001', loot1);
      gameState.state_loot.set('loot_002', loot2);
      gameState.state_tick = 1000;

      // Serialize the complex state
      const encoder = new Encoder(gameState);
      const encoded = encoder.encode();

      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
      expect(gameState.state_players.size).toBe(2);
      expect(gameState.state_npcs.size).toBe(2);
      expect(gameState.state_loot.size).toBe(2);

      console.log('✅ Successfully encoded complex game scenario:', encoded.length, 'bytes');
      console.log('   - Players:', gameState.state_players.size);
      console.log('   - NPCs:', gameState.state_npcs.size);
      console.log('   - Loot drops:', gameState.state_loot.size);
      console.log('   - Player 1 inventory:', player1.player_inventory.length, 'items');
      console.log('   - Player 2 inventory:', player2.player_inventory.length, 'items');
      console.log('   - Loot 1 items:', loot1.loot_items.length);
      console.log('   - Loot 2 items:', loot2.loot_items.length);
    }).not.toThrow();
  });
});
