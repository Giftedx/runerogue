/**
 * RuntimeEntitySchemas.ts - Working Colyseus schema definitions for RuneRogue
 *
 * This file provides working schema classes using runtime registration
 * instead of decorators to ensure Jest compatibility.
 */

import { ArraySchema, defineTypes, MapSchema, Schema } from '@colyseus/schema';
import 'reflect-metadata';

// === RUNTIME SCHEMA DEFINITIONS ===

/**
 * Item schema for inventory management
 */
export class InventoryItem extends Schema {
  public itemId: string = '';
  public name: string = '';
  public quantity: number = 1;
  public value: number = 0;
  public stackable: boolean = false;

  constructor(itemDefinition?: any, quantity: number = 1) {
    super();
    if (itemDefinition) {
      this.itemId = itemDefinition.itemId || itemDefinition.id || '';
      this.name = itemDefinition.name || '';
      this.value = itemDefinition.value || 0;
      this.stackable = itemDefinition.stackable || false;
      this.quantity = quantity;
    }
  }
}

/**
 * Equipment schema for equipped items
 */
export class Equipment extends Schema {
  public helmet: string = '';
  public chest: string = '';
  public legs: string = '';
  public weapon: string = '';
  public shield: string = '';
  public gloves: string = '';
  public boots: string = '';
  public cape: string = '';
  public amulet: string = '';
  public ring: string = '';
}

/**
 * Individual skill schema
 */
export class Skill extends Schema {
  public level: number = 1;
  public experience: number = 0;

  constructor(level: number = 1, experience: number = 0) {
    super();
    this.level = level;
    this.experience = experience;
  }
}

/**
 * Skills collection schema
 */
export class Skills extends Schema {
  public attack: Skill = new Skill();
  public defence: Skill = new Skill();
  public strength: Skill = new Skill();
  public hitpoints: Skill = new Skill(10, 1154); // Start at level 10
  public ranged: Skill = new Skill();
  public prayer: Skill = new Skill();
  public magic: Skill = new Skill();
  public cooking: Skill = new Skill();
  public woodcutting: Skill = new Skill();
  public fletching: Skill = new Skill();
  public fishing: Skill = new Skill();
  public firemaking: Skill = new Skill();
  public crafting: Skill = new Skill();
  public smithing: Skill = new Skill();
  public mining: Skill = new Skill();
  public herblore: Skill = new Skill();
  public agility: Skill = new Skill();
  public thieving: Skill = new Skill();
  public slayer: Skill = new Skill();
  public farming: Skill = new Skill();
  public runecraft: Skill = new Skill();
  public hunter: Skill = new Skill();
  public construction: Skill = new Skill();
}

/**
 * Player inventory schema
 */
export class Inventory extends Schema {
  public items = new ArraySchema<InventoryItem>();
  public maxSlots: number = 28;

  constructor() {
    super();
    this.items = new ArraySchema<InventoryItem>();
  }

  /**
   * Add an item to the inventory
   */
  addItem(item: InventoryItem): boolean {
    if (this.items.length >= this.maxSlots) {
      return false;
    }

    // Check if item already exists and is stackable
    const existingItem = this.items.find(
      invItem => invItem.itemId === item.itemId && invItem.stackable
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.push(item);
    }

    return true;
  }

  /**
   * Remove an item from the inventory
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    const itemIndex = this.items.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) return false;

    const item = this.items[itemIndex];
    if (item.quantity <= quantity) {
      this.items.splice(itemIndex, 1);
    } else {
      item.quantity -= quantity;
    }

    return true;
  }
}

/**
 * Player schema for multiplayer synchronization
 */
export class Player extends Schema {
  public id: string = '';
  public username: string = '';
  public x: number = 0;
  public y: number = 0;
  public health: number = 100;
  public maxHealth: number = 100;
  public combatLevel: number = 3;
  public inCombat: boolean = false;
  public animation: string = '';
  public direction: string = 'south';
  public skills: Skills = new Skills();
  public inventory: Inventory = new Inventory();
  public equipment: Equipment = new Equipment();
  public lastUpdate: number = 0;

  constructor(username?: string, x?: number, y?: number, health?: number) {
    super();
    if (username) this.username = username;
    if (typeof x === 'number') this.x = x;
    if (typeof y === 'number') this.y = y;
    if (typeof health === 'number') this.health = health;
    this.skills = new Skills();
    this.inventory = new Inventory();
    this.equipment = new Equipment();
    this.lastUpdate = Date.now();
  }

  /**
   * Calculate combat level based on skills
   */
  calculateCombatLevel(): number {
    const attack = this.skills.attack.level;
    const defence = this.skills.defence.level;
    const strength = this.skills.strength.level;
    const hitpoints = this.skills.hitpoints.level;
    const ranged = this.skills.ranged.level;
    const magic = this.skills.magic.level;
    const prayer = this.skills.prayer.level;

    const combatLevel = Math.floor(
      (defence + hitpoints + Math.floor(prayer / 2)) * 0.25 +
        Math.max(attack + strength, ranged * 1.5, magic * 1.5) * 0.325
    );

    this.combatLevel = Math.max(combatLevel, 3);
    return this.combatLevel;
  }

  /**
   * Update player position
   */
  updatePosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.lastUpdate = Date.now();
  }

  /**
   * Take damage
   */
  takeDamage(damage: number): boolean {
    this.health = Math.max(0, this.health - damage);
    this.lastUpdate = Date.now();
    return this.health <= 0;
  }

  /**
   * Heal player
   */
  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.lastUpdate = Date.now();
  }
}

/**
 * NPC schema for non-player characters
 */
export class NPC extends Schema {
  public id: string = '';
  public name: string = '';
  public x: number = 0;
  public y: number = 0;
  public health: number = 100;
  public maxHealth: number = 100;
  public level: number = 1;
  public animation: string = '';
  public direction: string = 'south';
  public aggressive: boolean = false;
  public respawnTime: number = 30000;
  public lastUpdate: number = 0;

  constructor(id?: string, name?: string, x?: number, y?: number) {
    super();
    if (id) this.id = id;
    if (name) this.name = name;
    if (typeof x === 'number') this.x = x;
    if (typeof y === 'number') this.y = y;
    this.lastUpdate = Date.now();
  }
}

/**
 * Loot item schema
 */
export class LootItem extends Schema {
  public id: string = '';
  public itemId: string = '';
  public x: number = 0;
  public y: number = 0;
  public quantity: number = 1;
  public droppedBy: string = '';
  public despawnTime: number = 0;

  constructor(itemId?: string, x?: number, y?: number, quantity?: number) {
    super();
    if (itemId) this.itemId = itemId;
    if (typeof x === 'number') this.x = x;
    if (typeof y === 'number') this.y = y;
    if (typeof quantity === 'number') this.quantity = quantity;
    this.id = `loot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.despawnTime = Date.now() + 180000; // 3 minutes
  }
}

/**
 * Trade schema for player trading
 */
export class Trade extends Schema {
  public id: string = '';
  public proposer: string = '';
  public accepter: string = '';
  public proposerItems = new ArraySchema<InventoryItem>();
  public accepterItems = new ArraySchema<InventoryItem>();
  public proposerAccepted: boolean = false;
  public accepterAccepted: boolean = false;
  public status: string = 'pending'; // pending, accepted, cancelled, completed

  constructor(id?: string, proposer?: string, accepter?: string) {
    super();
    if (id) this.id = id;
    if (proposer) this.proposer = proposer;
    if (accepter) this.accepter = accepter;
    this.proposerItems = new ArraySchema<InventoryItem>();
    this.accepterItems = new ArraySchema<InventoryItem>();
  }
}

/**
 * Game state schema for the overall game room
 */
export class GameState extends Schema {
  public tick: number = 0;
  public timestamp: number = 0;
  public players = new MapSchema<Player>();
  public npcs = new MapSchema<NPC>();
  public loot = new MapSchema<LootItem>();
  public trades = new MapSchema<Trade>();
  public serverTime: number = 0;
  public tickRate: number = 60;

  constructor() {
    super();
    this.players = new MapSchema<Player>();
    this.npcs = new MapSchema<NPC>();
    this.loot = new MapSchema<LootItem>();
    this.trades = new MapSchema<Trade>();
    this.serverTime = Date.now();
  }

  /**
   * Update game tick
   */
  updateTick(): void {
    this.tick++;
    this.timestamp = Date.now();
    this.serverTime = this.timestamp;
  }

  /**
   * Add a player to the game
   */
  addPlayer(player: Player): void {
    this.players.set(player.id, player);
  }

  /**
   * Remove a player from the game
   */
  removePlayer(playerId: string): boolean {
    return this.players.delete(playerId);
  }

  /**
   * Add an NPC to the game
   */
  addNPC(npc: NPC): void {
    this.npcs.set(npc.id, npc);
  }

  /**
   * Remove an NPC from the game
   */
  removeNPC(npcId: string): boolean {
    return this.npcs.delete(npcId);
  }

  /**
   * Add loot to the game
   */
  addLoot(loot: LootItem): void {
    this.loot.set(loot.id, loot);
  }

  /**
   * Remove loot from the game
   */
  removeLoot(lootId: string): boolean {
    return this.loot.delete(lootId);
  }
}

// === RUNTIME TYPE REGISTRATION ===

// Register schema types at runtime
defineTypes(InventoryItem, {
  itemId: 'string',
  name: 'string',
  quantity: 'number',
  value: 'number',
  stackable: 'boolean',
});

defineTypes(Equipment, {
  helmet: 'string',
  chest: 'string',
  legs: 'string',
  weapon: 'string',
  shield: 'string',
  gloves: 'string',
  boots: 'string',
  cape: 'string',
  amulet: 'string',
  ring: 'string',
});

defineTypes(Skill, {
  level: 'number',
  experience: 'number',
});

defineTypes(Skills, {
  attack: Skill,
  defence: Skill,
  strength: Skill,
  hitpoints: Skill,
  ranged: Skill,
  prayer: Skill,
  magic: Skill,
  cooking: Skill,
  woodcutting: Skill,
  fletching: Skill,
  fishing: Skill,
  firemaking: Skill,
  crafting: Skill,
  smithing: Skill,
  mining: Skill,
  herblore: Skill,
  agility: Skill,
  thieving: Skill,
  slayer: Skill,
  farming: Skill,
  runecraft: Skill,
  hunter: Skill,
  construction: Skill,
});

defineTypes(Inventory, {
  items: [InventoryItem],
  maxSlots: 'number',
});

defineTypes(Player, {
  id: 'string',
  username: 'string',
  x: 'number',
  y: 'number',
  health: 'number',
  maxHealth: 'number',
  combatLevel: 'number',
  inCombat: 'boolean',
  animation: 'string',
  direction: 'string',
  skills: Skills,
  inventory: Inventory,
  equipment: Equipment,
  lastUpdate: 'number',
});

defineTypes(NPC, {
  id: 'string',
  name: 'string',
  x: 'number',
  y: 'number',
  health: 'number',
  maxHealth: 'number',
  level: 'number',
  animation: 'string',
  direction: 'string',
  aggressive: 'boolean',
  respawnTime: 'number',
  lastUpdate: 'number',
});

defineTypes(LootItem, {
  id: 'string',
  itemId: 'string',
  x: 'number',
  y: 'number',
  quantity: 'number',
  droppedBy: 'string',
  despawnTime: 'number',
});

defineTypes(Trade, {
  id: 'string',
  proposer: 'string',
  accepter: 'string',
  proposerItems: [InventoryItem],
  accepterItems: [InventoryItem],
  proposerAccepted: 'boolean',
  accepterAccepted: 'boolean',
  status: 'string',
});

defineTypes(GameState, {
  tick: 'number',
  timestamp: 'number',
  players: { map: Player },
  npcs: { map: NPC },
  loot: { map: LootItem },
  trades: { map: Trade },
  serverTime: 'number',
  tickRate: 'number',
});

// === FACTORY FUNCTIONS ===

/**
 * Create a player with proper initialization
 */
export function createPlayer(username: string, x: number = 0, y: number = 0): Player {
  const player = new Player(username, x, y);
  player.id = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  return player;
}

/**
 * Create an inventory item with proper initialization
 */
export function createInventoryItem(itemDefinition: any, quantity: number = 1): InventoryItem {
  return new InventoryItem(itemDefinition, quantity);
}

/**
 * Create an NPC with proper initialization
 */
export function createNPC(name: string, x: number, y: number, level: number = 1): NPC {
  const npc = new NPC();
  npc.id = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  npc.name = name;
  npc.x = x;
  npc.y = y;
  npc.level = level;
  npc.health = level * 10;
  npc.maxHealth = npc.health;
  return npc;
}

/**
 * Create a loot item with proper initialization
 */
export function createLootItem(
  itemId: string,
  x: number,
  y: number,
  quantity: number = 1
): LootItem {
  return new LootItem(itemId, x, y, quantity);
}

/**
 * Create a trade with proper initialization
 */
export function createTrade(proposer: string, accepter: string): Trade {
  const trade = new Trade();
  trade.id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  trade.proposer = proposer;
  trade.accepter = accepter;
  return trade;
}

/**
 * Create a game state with proper initialization
 */
export function createGameState(): GameState {
  return new GameState();
}

// Export everything for easy access
export const RuntimeSchemas = {
  InventoryItem,
  Equipment,
  Skill,
  Skills,
  Inventory,
  Player,
  NPC,
  LootItem,
  Trade,
  GameState,
  createPlayer,
  createInventoryItem,
  createNPC,
  createLootItem,
  createTrade,
  createGameState,
};
