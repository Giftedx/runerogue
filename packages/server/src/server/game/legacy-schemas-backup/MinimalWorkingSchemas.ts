/**
 * Minimal Working Schemas - Designed to avoid all Colyseus schema issues
 *
 * Key design principles:
 * 1. No duplicate property names across ALL schema classes
 * 2. Each schema class has <15 fields to stay well under 64-field limit
 * 3. Simple, flat structure to avoid complex nested schema issues
 * 4. Isolated imports to prevent global schema conflicts
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';

/**
 * Basic inventory item with unique prefixes
 */
export class BasicItem extends Schema {
  @type('string') item_id: string = '';
  @type('string') item_name: string = '';
  @type('string') item_type: string = '';
  @type('number') item_quantity: number = 1;
  @type('boolean') item_stackable: boolean = true;
}

/**
 * Player schema with unique prefixes - condensed to essential fields
 */
export class BasicPlayer extends Schema {
  @type('string') player_id: string = '';
  @type('string') player_name: string = '';
  @type('number') player_x: number = 0;
  @type('number') player_y: number = 0;
  @type('number') player_health: number = 100;
  @type('number') player_max_health: number = 100;
  @type('number') player_level: number = 1;
  @type([BasicItem]) player_inventory = new ArraySchema<BasicItem>();
}

/**
 * Simple NPC schema with unique prefixes
 */
export class BasicNPC extends Schema {
  @type('string') npc_id: string = '';
  @type('string') npc_name: string = '';
  @type('number') npc_x: number = 0;
  @type('number') npc_y: number = 0;
  @type('number') npc_health: number = 100;
  @type('number') npc_max_health: number = 100;
  @type('number') npc_level: number = 1;
  @type('boolean') npc_aggressive: boolean = true;
}

/**
 * Simple loot schema with unique prefixes
 */
export class BasicLoot extends Schema {
  @type('string') loot_id: string = '';
  @type('number') loot_x: number = 0;
  @type('number') loot_y: number = 0;
  @type([BasicItem]) loot_items = new ArraySchema<BasicItem>();
  @type('number') loot_timestamp: number = 0;
}

/**
 * Minimal game state - essential multiplayer sync only
 */
export class BasicGameState extends Schema {
  @type({ map: BasicPlayer }) state_players = new MapSchema<BasicPlayer>();
  @type({ map: BasicNPC }) state_npcs = new MapSchema<BasicNPC>();
  @type({ map: BasicLoot }) state_loot = new MapSchema<BasicLoot>();
  @type('number') state_tick: number = 0;
  @type('number') state_timestamp: number = 0;
}

/**
 * Factory functions for creating instances
 */
export function createBasicItem(
  id: string,
  name: string,
  type: string = 'misc',
  quantity: number = 1
): BasicItem {
  const item = new BasicItem();
  item.item_id = id;
  item.item_name = name;
  item.item_type = type;
  item.item_quantity = quantity;
  return item;
}

export function createBasicPlayer(id: string, name: string): BasicPlayer {
  const player = new BasicPlayer();
  player.player_id = id;
  player.player_name = name;
  return player;
}

export function createBasicNPC(id: string, name: string): BasicNPC {
  const npc = new BasicNPC();
  npc.npc_id = id;
  npc.npc_name = name;
  return npc;
}

export function createBasicLoot(id: string, x: number, y: number): BasicLoot {
  const loot = new BasicLoot();
  loot.loot_id = id;
  loot.loot_x = x;
  loot.loot_y = y;
  loot.loot_timestamp = Date.now();
  return loot;
}

export function createBasicGameState(): BasicGameState {
  const gameState = new BasicGameState();
  gameState.state_timestamp = Date.now();
  return gameState;
}

/**
 * Export for easy access
 */
export const MinimalSchemas = {
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
};
