/**
 * @deprecated LEGACY SCHEMA - This file contains a previous, more complex schema implementation.
 * It is not used in the main game and is pending removal.
 * Please use the schemas from '@runerogue/shared' instead.
 */

/**
 * Core Colyseus schemas using defineTypes approach for maximum compatibility
 * This replaces all decorator-based schemas to avoid Symbol.metadata issues
 */

import { Schema, MapSchema, ArraySchema, defineTypes } from '@colyseus/schema';

/**
 * Inventory item schema - represents a single item in a player's inventory
 */
export class InventoryItem extends Schema {
  itemId: string = '';
  name: string = '';
  quantity: number = 0;
  stackable: boolean = true;

  constructor(itemId: string = '', name: string = '', quantity: number = 0) {
    super();
    this.itemId = itemId;
    this.name = name;
    this.quantity = quantity;
  }
}

defineTypes(InventoryItem, {
  itemId: 'string',
  name: 'string',
  quantity: 'number',
  stackable: 'boolean',
});

/**
 * Equipment slot schema
 */
export class Equipment extends Schema {
  helmet: string = '';
  chestplate: string = '';
  legs: string = '';
  boots: string = '';
  weapon: string = '';
  shield: string = '';
  gloves: string = '';
  cape: string = '';
  ring: string = '';
  necklace: string = '';
}

defineTypes(Equipment, {
  helmet: 'string',
  chestplate: 'string',
  legs: 'string',
  boots: 'string',
  weapon: 'string',
  shield: 'string',
  gloves: 'string',
  cape: 'string',
  ring: 'string',
  necklace: 'string',
});

/**
 * Skills schema - represents player skill levels
 */
export class Skills extends Schema {
  attack: number = 1;
  strength: number = 1;
  defence: number = 1;
  ranged: number = 1;
  prayer: number = 1;
  magic: number = 1;
  construction: number = 1;
  hitpoints: number = 10;
  agility: number = 1;
  herblore: number = 1;
  thieving: number = 1;
  crafting: number = 1;
  fletching: number = 1;
  slayer: number = 1;
  hunter: number = 1;
  mining: number = 1;
  smithing: number = 1;
  fishing: number = 1;
  cooking: number = 1;
  firemaking: number = 1;
  woodcutting: number = 1;
  farming: number = 1;
}

defineTypes(Skills, {
  attack: 'number',
  strength: 'number',
  defence: 'number',
  ranged: 'number',
  prayer: 'number',
  magic: 'number',
  construction: 'number',
  hitpoints: 'number',
  agility: 'number',
  herblore: 'number',
  thieving: 'number',
  crafting: 'number',
  fletching: 'number',
  slayer: 'number',
  hunter: 'number',
  mining: 'number',
  smithing: 'number',
  fishing: 'number',
  cooking: 'number',
  firemaking: 'number',
  woodcutting: 'number',
  farming: 'number',
});

/**
 * Player position schema
 */
export class Position extends Schema {
  x: number = 0;
  y: number = 0;
  z: number = 0;
}

defineTypes(Position, {
  x: 'number',
  y: 'number',
  z: 'number',
});

/**
 * Player schema - represents a connected player
 */
export class Player extends Schema {
  id: string = '';
  username: string = '';
  position: Position = new Position();
  health: number = 100;
  maxHealth: number = 100;
  combatLevel: number = 3;
  inventory: ArraySchema<InventoryItem> = new ArraySchema<InventoryItem>();
  equipment: Equipment = new Equipment();
  skills: Skills = new Skills();

  constructor(id: string = '', username: string = '') {
    super();
    this.id = id;
    this.username = username;
    this.position = new Position();
    this.equipment = new Equipment();
    this.skills = new Skills();
    this.inventory = new ArraySchema<InventoryItem>();
  }
}

defineTypes(Player, {
  id: 'string',
  username: 'string',
  position: Position,
  health: 'number',
  maxHealth: 'number',
  combatLevel: 'number',
  inventory: [InventoryItem],
  equipment: Equipment,
  skills: Skills,
});

/**
 * Enemy schema - represents NPCs and monsters
 */
export class Enemy extends Schema {
  id: string = '';
  name: string = '';
  position: Position = new Position();
  health: number = 100;
  maxHealth: number = 100;
  level: number = 1;
  aggressive: boolean = false;

  constructor(id: string = '', name: string = '', level: number = 1) {
    super();
    this.id = id;
    this.name = name;
    this.level = level;
    this.position = new Position();
  }
}

defineTypes(Enemy, {
  id: 'string',
  name: 'string',
  position: Position,
  health: 'number',
  maxHealth: 'number',
  level: 'number',
  aggressive: 'boolean',
});

/**
 * Game room state schema - main multiplayer state
 */
export class GameRoomState extends Schema {
  tick: number = 0;
  timestamp: number = 0;
  players: MapSchema<Player> = new MapSchema<Player>();
  enemies: MapSchema<Enemy> = new MapSchema<Enemy>();

  constructor() {
    super();
    this.players = new MapSchema<Player>();
    this.enemies = new MapSchema<Enemy>();
    this.timestamp = Date.now();
  }
}

defineTypes(GameRoomState, {
  tick: 'number',
  timestamp: 'number',
  players: { map: Player },
  enemies: { map: Enemy },
});

/**
 * Factory functions for creating instances with proper initialization
 */
export const createPlayer = (id: string, username: string): Player => {
  return new Player(id, username);
};

export const createEnemy = (id: string, name: string, level: number = 1): Enemy => {
  return new Enemy(id, name, level);
};

export const createInventoryItem = (
  itemId: string,
  name: string,
  quantity: number = 1
): InventoryItem => {
  return new InventoryItem(itemId, name, quantity);
};

export const createGameRoomState = (): GameRoomState => {
  return new GameRoomState();
};

/**
 * Validation functions
 */
export const validatePlayer = (player: Player): boolean => {
  return !!(player.id && player.username && player.position);
};

export const validateEnemy = (enemy: Enemy): boolean => {
  return !!(enemy.id && enemy.name && enemy.position);
};

export const validateInventoryItem = (item: InventoryItem): boolean => {
  return !!(item.itemId && item.name && item.quantity > 0);
};
