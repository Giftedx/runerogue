/**
 * Alternative schema implementation to replace problematic Colyseus decorators
 * This bypasses the Symbol.metadata issue by using a simpler approach
 */

import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

/**
 * Create a schema class without decorators by using defineTypes
 */
export class Item extends Schema {
  itemId: string = '';
  name: string = '';
  quantity: number = 0;
}

export class Skills extends Schema {
  attack: number = 1;
  strength: number = 1;
  defence: number = 1;
  ranged: number = 1;
  prayer: number = 1;
  magic: number = 1;
  hitpoints: number = 10;
  mining: number = 1;
  smithing: number = 1;
  fishing: number = 1;
  cooking: number = 1;
  firemaking: number = 1;
  woodcutting: number = 1;
  crafting: number = 1;
  herblore: number = 1;
  agility: number = 1;
  thieving: number = 1;
  slayer: number = 1;
  farming: number = 1;
  runecraft: number = 1;
  hunter: number = 1;
  construction: number = 1;
}

export class Player extends Schema {
  name: string = '';
  x: number = 0;
  y: number = 0;
  health: number = 100;
  maxHealth: number = 100;
  inventory: ArraySchema<Item> = new ArraySchema<Item>();
  skills: Skills = new Skills();
  combatLevel: number = 3;
  equipment: { [slot: string]: Item | null } = {};
}

export class Trade extends Schema {
  id: string = '';
  proposer: string = '';
  accepter: string = '';
  proposerItems: ArraySchema<Item> = new ArraySchema<Item>();
  accepterItems: ArraySchema<Item> = new ArraySchema<Item>();
  proposerAccepted: boolean = false;
  accepterAccepted: boolean = false;
  status: 'pending' | 'accepted' | 'cancelled' = 'pending';
}

export class LootDrop extends Schema {
  id: string = '';
  x: number = 0;
  y: number = 0;
  items: ArraySchema<Item> = new ArraySchema<Item>();
  droppedBy: string = '';
  droppedAt: number = Date.now();
}

export class GameState extends Schema {
  players: MapSchema<Player> = new MapSchema<Player>();
  trades: MapSchema<Trade> = new MapSchema<Trade>();
  loot: MapSchema<LootDrop> = new MapSchema<LootDrop>();
}

// Define schema types without decorators
Item.defineTypes({
  itemId: 'string',
  name: 'string',
  quantity: 'number',
});

Skills.defineTypes({
  attack: 'number',
  strength: 'number',
  defence: 'number',
  ranged: 'number',
  prayer: 'number',
  magic: 'number',
  hitpoints: 'number',
  mining: 'number',
  smithing: 'number',
  fishing: 'number',
  cooking: 'number',
  firemaking: 'number',
  woodcutting: 'number',
  crafting: 'number',
  herblore: 'number',
  agility: 'number',
  thieving: 'number',
  slayer: 'number',
  farming: 'number',
  runecraft: 'number',
  hunter: 'number',
  construction: 'number',
});

Player.defineTypes({
  name: 'string',
  x: 'number',
  y: 'number',
  health: 'number',
  maxHealth: 'number',
  inventory: [Item],
  skills: Skills,
  combatLevel: 'number',
  equipment: 'object', // Will handle serialization manually if needed
});

Trade.defineTypes({
  id: 'string',
  proposer: 'string',
  accepter: 'string',
  proposerItems: [Item],
  accepterItems: [Item],
  proposerAccepted: 'boolean',
  accepterAccepted: 'boolean',
  status: 'string',
});

LootDrop.defineTypes({
  id: 'string',
  x: 'number',
  y: 'number',
  items: [Item],
  droppedBy: 'string',
  droppedAt: 'number',
});

GameState.defineTypes({
  players: { map: Player },
  trades: { map: Trade },
  loot: { map: LootDrop },
});

/**
 * Helper functions to create schema objects safely
 */
export function createItem(itemId: string, name: string, quantity: number = 1): Item {
  const item = new Item();
  item.itemId = itemId;
  item.name = name;
  item.quantity = quantity;
  return item;
}

export function createPlayer(name: string, x: number = 0, y: number = 0): Player {
  const player = new Player();
  player.name = name;
  player.x = x;
  player.y = y;
  player.health = 100;
  player.maxHealth = 100;
  player.skills = new Skills();
  player.combatLevel = 3;
  player.equipment = {};
  return player;
}

export function createTrade(id: string, proposer: string, accepter: string): Trade {
  const trade = new Trade();
  trade.id = id;
  trade.proposer = proposer;
  trade.accepter = accepter;
  trade.status = 'pending';
  return trade;
}

export function createLootDrop(id: string, x: number, y: number, droppedBy: string): LootDrop {
  const loot = new LootDrop();
  loot.id = id;
  loot.x = x;
  loot.y = y;
  loot.droppedBy = droppedBy;
  loot.droppedAt = Date.now();
  return loot;
}
