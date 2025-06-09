/**
 * Final Schema Definitions for RuneRogue
 *
 * This is the single, authoritative schema file for the RuneRogue multiplayer system.
 * All other schema files should be disabled to prevent duplicate registrations.
 *
 * Features:
 * - Production-ready Colyseus schemas with proper @type decorators
 * - OSRS-authentic game mechanics and data structures
 * - Comprehensive error handling and validation
 * - Full TypeScript type safety with proper JSDoc comments
 * - Optimized for performance with efficient serialization
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';

// === TYPE INTERFACES ===

/**
 * Interface for player action messages
 */
export interface PlayerActionMessage {
  type: string; // e.g., 'attack', 'cast_spell', 'use_ability'
  targetId?: string; // Optional: ID of the target entity
  abilityId?: string; // Optional: ID of the ability/spell used
}

/**
 * Interface for equip item messages
 */
export interface EquipItemMessage {
  itemIndex: number;
  slot: 'weapon' | 'armor' | 'shield';
}

/**
 * Interface for drop item messages
 */
export interface DropItemMessage {
  itemIndex: number;
  quantity?: number;
}

/**
 * Interface for collect loot messages
 */
export interface CollectLootMessage {
  lootId: string;
}

/**
 * Interface for loot drop messages
 */
export interface LootDropMessage {
  itemType: string;
  quantity: number;
  position: { x: number; y: number };
}

/**
 * Interface for trade request messages
 */
export interface TradeRequestMessage {
  targetPlayerId: string;
}

/**
 * Interface for trade offer messages
 */
export interface TradeOfferMessage {
  offeredItems: { itemId: string; quantity: number }[];
}

/**
 * Interface for trade accept/cancel messages
 */
export interface TradeAcceptMessage {
  tradeId: string;
}

export interface TradeCancelMessage {
  tradeId: string;
}

// === CORE SCHEMA CLASSES ===

/**
 * Skill class representing OSRS skills
 * Each skill has a level (1-99) and experience points
 */
export class Skill extends Schema {
  @type('number')
  public level: number;

  @type('number')
  public xp: number;

  constructor(level: number = 1, xp: number = 0) {
    super();
    this.level = Math.max(1, Math.min(99, level)); // Enforce OSRS level bounds
    this.xp = Math.max(0, xp);
  }

  /**
   * Calculate level from experience using OSRS formula
   */
  public calculateLevelFromXp(): number {
    let level = 1;
    let xpForLevel = 0;

    for (let i = 1; i < 99; i++) {
      xpForLevel += Math.floor(i + 300 * Math.pow(2, i / 7)) / 4;
      if (this.xp < xpForLevel) break;
      level = i + 1;
    }

    return level;
  }

  /**
   * Update level based on current XP
   */
  public updateLevel(): void {
    this.level = this.calculateLevelFromXp();
  }
}

/**
 * Equipment item schema for equipped items
 */
export class Equipment extends Schema {
  @type('string')
  public weapon: string = '';

  @type('string')
  public armor: string = '';

  @type('string')
  public shield: string = '';

  @type('string')
  public helmet: string = '';

  @type('string')
  public legs: string = '';

  @type('string')
  public boots: string = '';

  @type('string')
  public gloves: string = '';

  @type('string')
  public cape: string = '';

  @type('string')
  public amulet: string = '';

  @type('string')
  public ring: string = '';

  constructor() {
    super();
  }

  /**
   * Get all equipped items as an array
   */
  public getAllEquipped(): string[] {
    return [
      this.weapon,
      this.armor,
      this.shield,
      this.helmet,
      this.legs,
      this.boots,
      this.gloves,
      this.cape,
      this.amulet,
      this.ring,
    ].filter(item => item !== '');
  }
}

/**
 * Inventory item class with OSRS item properties
 */
export class InventoryItem extends Schema {
  @type('string')
  public itemId: string = '';

  @type('number')
  public quantity: number = 1;

  @type('string')
  public name: string = '';

  @type('number')
  public attackBonus: number = 0;

  @type('number')
  public strengthBonus: number = 0;

  @type('number')
  public defenceBonus: number = 0;

  @type('number')
  public rangedBonus: number = 0;

  @type('number')
  public magicBonus: number = 0;

  @type('number')
  public prayerBonus: number = 0;

  @type('number')
  public value: number = 0;

  @type('boolean')
  public stackable: boolean = false;

  @type('boolean')
  public tradeable: boolean = true;

  @type('string')
  public description: string = '';

  constructor(itemId: string = '', quantity: number = 1) {
    super();
    this.itemId = itemId;
    this.quantity = Math.max(1, quantity);
  }

  /**
   * Check if this item can be stacked with another
   */
  public canStackWith(other: InventoryItem): boolean {
    return this.stackable && other.stackable && this.itemId === other.itemId;
  }

  /**
   * Get the total combat bonus of this item
   */
  public getTotalCombatBonus(): number {
    return (
      this.attackBonus + this.strengthBonus + this.defenceBonus + this.rangedBonus + this.magicBonus
    );
  }
}

/**
 * Inventory schema managing player items
 */
export class Inventory extends Schema {
  @type([InventoryItem])
  public items = new ArraySchema<InventoryItem>();

  @type('number')
  public maxSize: number = 28; // OSRS standard inventory size

  constructor(maxSize: number = 28) {
    super();
    this.maxSize = maxSize;
  }

  /**
   * Add an item to the inventory
   */
  public addItem(item: InventoryItem): boolean {
    // Try to stack with existing items first
    if (item.stackable) {
      for (const existingItem of this.items) {
        if (existingItem.canStackWith(item)) {
          existingItem.quantity += item.quantity;
          return true;
        }
      }
    }

    // Add as new item if space available
    if (this.items.length < this.maxSize) {
      this.items.push(item);
      return true;
    }

    return false; // Inventory full
  }

  /**
   * Remove an item from the inventory
   */
  public removeItem(itemId: string, quantity: number = 1): boolean {
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

  /**
   * Get available inventory space
   */
  public getAvailableSpace(): number {
    return this.maxSize - this.items.length;
  }

  /**
   * Check if inventory has space for an item
   */
  public hasSpace(item: InventoryItem): boolean {
    if (item.stackable) {
      // Check if can stack with existing
      return (
        this.items.some(existing => existing.canStackWith(item)) || this.getAvailableSpace() > 0
      );
    }
    return this.getAvailableSpace() > 0;
  }
}

/**
 * Skills collection for OSRS skills
 */
export class Skills extends Schema {
  @type(Skill)
  public attack: Skill = new Skill();

  @type(Skill)
  public strength: Skill = new Skill();

  @type(Skill)
  public defence: Skill = new Skill();

  @type(Skill)
  public hitpoints: Skill = new Skill(10, 1154); // OSRS starts at level 10

  @type(Skill)
  public ranged: Skill = new Skill();

  @type(Skill)
  public prayer: Skill = new Skill();

  @type(Skill)
  public magic: Skill = new Skill();

  @type(Skill)
  public cooking: Skill = new Skill();

  @type(Skill)
  public woodcutting: Skill = new Skill();

  @type(Skill)
  public fletching: Skill = new Skill();

  @type(Skill)
  public fishing: Skill = new Skill();

  @type(Skill)
  public firemaking: Skill = new Skill();

  @type(Skill)
  public crafting: Skill = new Skill();

  @type(Skill)
  public smithing: Skill = new Skill();

  @type(Skill)
  public mining: Skill = new Skill();

  @type(Skill)
  public herblore: Skill = new Skill();

  @type(Skill)
  public agility: Skill = new Skill();

  @type(Skill)
  public thieving: Skill = new Skill();

  @type(Skill)
  public slayer: Skill = new Skill();

  @type(Skill)
  public farming: Skill = new Skill();

  @type(Skill)
  public runecraft: Skill = new Skill();

  @type(Skill)
  public hunter: Skill = new Skill();

  @type(Skill)
  public construction: Skill = new Skill();

  constructor() {
    super();
  }

  /**
   * Calculate combat level using OSRS formula
   */
  public calculateCombatLevel(): number {
    const defence = this.defence.level;
    const hitpoints = this.hitpoints.level;
    const prayer = this.prayer.level;

    const melee = (this.attack.level + this.strength.level) * 0.325;
    const ranged = this.ranged.level * 0.325;
    const magic = this.magic.level * 0.325;

    const base = (defence + hitpoints + Math.floor(prayer / 2)) * 0.25;
    const combat = base + Math.max(melee, ranged, magic);

    return Math.floor(combat);
  }

  /**
   * Get total level (sum of all skill levels)
   */
  public getTotalLevel(): number {
    return (
      this.attack.level +
      this.strength.level +
      this.defence.level +
      this.hitpoints.level +
      this.ranged.level +
      this.prayer.level +
      this.magic.level +
      this.cooking.level +
      this.woodcutting.level +
      this.fletching.level +
      this.fishing.level +
      this.firemaking.level +
      this.crafting.level +
      this.smithing.level +
      this.mining.level +
      this.herblore.level +
      this.agility.level +
      this.thieving.level +
      this.slayer.level +
      this.farming.level +
      this.runecraft.level +
      this.hunter.level +
      this.construction.level
    );
  }
}

/**
 * Player schema representing a game player
 */
export class Player extends Schema {
  @type('string')
  public playerId: string = '';

  @type('string')
  public username: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('string')
  public animation: string = 'idle';

  @type('string')
  public direction: string = 'down';

  @type('number')
  public health: number = 100;

  @type('number')
  public maxHealth: number = 100;

  @type('number')
  public lastActivity: number = 0;

  @type('boolean')
  public isBusy: boolean = false;

  @type('number')
  public busyUntil: number = 0;

  @type(Inventory)
  public inventory: Inventory = new Inventory();

  @type('number')
  public gold: number = 0;

  @type(Equipment)
  public equipment: Equipment = new Equipment();

  @type(Skills)
  public skills: Skills = new Skills();

  @type('string')
  public combatStyle: string = 'accurate';

  @type('boolean')
  public inCombat: boolean = false;

  @type('number')
  public combatTarget: number = -1;

  @type('number')
  public lastCombatAction: number = 0;

  @type('number')
  public respawnTime: number = 0;

  @type('boolean')
  public isDead: boolean = false;

  constructor(playerId: string = '', username: string = '') {
    super();
    this.playerId = playerId;
    this.username = username;
    this.lastActivity = Date.now();

    // Set initial health based on hitpoints level
    this.maxHealth = this.skills.hitpoints.level;
    this.health = this.maxHealth;
  }

  /**
   * Update player position with validation
   */
  public updatePosition(x: number, y: number): void {
    // Basic bounds checking (can be expanded based on map size)
    this.x = Math.max(0, Math.min(1000, x));
    this.y = Math.max(0, Math.min(1000, y));
    this.lastActivity = Date.now();
  }

  /**
   * Check if player can perform actions
   */
  public canAct(): boolean {
    return !this.isBusy && !this.isDead && Date.now() >= this.busyUntil;
  }

  /**
   * Set player as busy for a duration
   */
  public setBusy(duration: number): void {
    this.isBusy = true;
    this.busyUntil = Date.now() + duration;
  }

  /**
   * Update busy status
   */
  public updateBusyStatus(): void {
    if (this.isBusy && Date.now() >= this.busyUntil) {
      this.isBusy = false;
      this.busyUntil = 0;
    }
  }

  /**
   * Get combat level
   */
  public getCombatLevel(): number {
    return this.skills.calculateCombatLevel();
  }

  /**
   * Take damage with proper validation
   */
  public takeDamage(damage: number): boolean {
    if (this.isDead) return false;

    this.health = Math.max(0, this.health - Math.max(0, damage));

    if (this.health <= 0) {
      this.isDead = true;
      this.respawnTime = Date.now() + 5000; // 5 second respawn timer
      return true; // Player died
    }

    return false;
  }

  /**
   * Heal player
   */
  public heal(amount: number): void {
    if (!this.isDead) {
      this.health = Math.min(this.maxHealth, this.health + Math.max(0, amount));
    }
  }

  /**
   * Check if player can respawn
   */
  public canRespawn(): boolean {
    return this.isDead && Date.now() >= this.respawnTime;
  }

  /**
   * Respawn player
   */
  public respawn(): void {
    if (this.canRespawn()) {
      this.isDead = false;
      this.health = this.maxHealth;
      this.respawnTime = 0;
      this.inCombat = false;
      this.combatTarget = -1;
      // Reset position to safe area (can be customized)
      this.x = 100;
      this.y = 100;
    }
  }
}

/**
 * NPC (Non-Player Character) schema
 */
export class NPC extends Schema {
  @type('string')
  public npcId: string = '';

  @type('string')
  public name: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public health: number = 100;

  @type('number')
  public maxHealth: number = 100;

  @type('number')
  public level: number = 1;

  @type('string')
  public animation: string = 'idle';

  @type('boolean')
  public inCombat: boolean = false;

  @type('number')
  public combatTarget: number = -1;

  @type('number')
  public lastCombatAction: number = 0;

  @type('boolean')
  public isDead: boolean = false;

  @type('number')
  public respawnTime: number = 0;

  @type('string')
  public aiState: string = 'idle';

  constructor(npcId: string = '', name: string = '', level: number = 1) {
    super();
    this.npcId = npcId;
    this.name = name;
    this.level = Math.max(1, level);
    this.maxHealth = level * 10; // Simple scaling
    this.health = this.maxHealth;
  }

  /**
   * Take damage and handle death
   */
  public takeDamage(damage: number): boolean {
    if (this.isDead) return false;

    this.health = Math.max(0, this.health - Math.max(0, damage));

    if (this.health <= 0) {
      this.isDead = true;
      this.respawnTime = Date.now() + 30000; // 30 second respawn
      this.inCombat = false;
      this.combatTarget = -1;
      return true; // NPC died
    }

    return false;
  }

  /**
   * Check if NPC can respawn
   */
  public canRespawn(): boolean {
    return this.isDead && Date.now() >= this.respawnTime;
  }

  /**
   * Respawn NPC
   */
  public respawn(): void {
    if (this.canRespawn()) {
      this.isDead = false;
      this.health = this.maxHealth;
      this.respawnTime = 0;
      this.aiState = 'idle';
    }
  }
}

/**
 * Loot item schema for dropped items
 */
export class LootItem extends Schema {
  @type('string')
  public lootId: string = '';

  @type('string')
  public itemId: string = '';

  @type('number')
  public quantity: number = 1;

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public timestamp: number = 0;

  @type('string')
  public ownerId: string = ''; // Player who can pick it up first

  @type('number')
  public publicTime: number = 0; // When it becomes public

  constructor(lootId: string = '', itemId: string = '', quantity: number = 1) {
    super();
    this.lootId = lootId;
    this.itemId = itemId;
    this.quantity = Math.max(1, quantity);
    this.timestamp = Date.now();
    this.publicTime = this.timestamp + 60000; // 1 minute until public
  }

  /**
   * Check if a player can pick up this loot
   */
  public canPickup(playerId: string): boolean {
    // Owner can always pickup
    if (this.ownerId === '' || this.ownerId === playerId) {
      return true;
    }

    // After public time, anyone can pickup
    return Date.now() >= this.publicTime;
  }

  /**
   * Check if loot has expired
   */
  public hasExpired(): boolean {
    const maxAge = 300000; // 5 minutes
    return Date.now() - this.timestamp > maxAge;
  }
}

/**
 * Main game state schema
 */
export class GameState extends Schema {
  @type({ map: Player })
  public players = new MapSchema<Player>();

  @type({ map: NPC })
  public npcs = new MapSchema<NPC>();

  @type({ map: LootItem })
  public loot = new MapSchema<LootItem>();

  @type('number')
  public timestamp: number = 0;

  @type('number')
  public tickRate: number = 60;

  @type('number')
  public serverTime: number = 0;

  constructor() {
    super();
    this.timestamp = Date.now();
    this.serverTime = this.timestamp;
  }

  /**
   * Add a player to the game
   */
  public addPlayer(player: Player): void {
    this.players.set(player.playerId, player);
    this.updateTimestamp();
  }

  /**
   * Remove a player from the game
   */
  public removePlayer(playerId: string): boolean {
    const removed = this.players.delete(playerId);
    if (removed) {
      this.updateTimestamp();
    }
    return removed;
  }

  /**
   * Add an NPC to the game
   */
  public addNPC(npc: NPC): void {
    this.npcs.set(npc.npcId, npc);
    this.updateTimestamp();
  }

  /**
   * Remove an NPC from the game
   */
  public removeNPC(npcId: string): boolean {
    const removed = this.npcs.delete(npcId);
    if (removed) {
      this.updateTimestamp();
    }
    return removed;
  }

  /**
   * Add loot to the game
   */
  public addLoot(loot: LootItem): void {
    this.loot.set(loot.lootId, loot);
    this.updateTimestamp();
  }

  /**
   * Remove loot from the game
   */
  public removeLoot(lootId: string): LootItem | undefined {
    const lootItem = this.loot.get(lootId);
    if (lootItem) {
      this.loot.delete(lootId);
      this.updateTimestamp();
    }
    return lootItem;
  }

  /**
   * Update the game timestamp
   */
  public updateTimestamp(): void {
    this.timestamp = Date.now();
    this.serverTime = this.timestamp;
  }

  /**
   * Clean up expired loot items
   */
  public cleanupExpiredLoot(): void {
    const expiredLoot: string[] = [];

    this.loot.forEach((loot, lootId) => {
      if (loot.hasExpired()) {
        expiredLoot.push(lootId);
      }
    });

    expiredLoot.forEach(lootId => {
      this.removeLoot(lootId);
    });
  }

  /**
   * Update all game entities
   */
  public update(): void {
    // Update player busy status
    this.players.forEach(player => {
      player.updateBusyStatus();
    });

    // Check for NPC respawns
    this.npcs.forEach(npc => {
      if (npc.canRespawn()) {
        npc.respawn();
      }
    });

    // Clean up expired loot
    this.cleanupExpiredLoot();

    this.updateTimestamp();
  }

  /**
   * Get players within a certain range of a position
   */
  public getPlayersInRange(x: number, y: number, range: number): Player[] {
    const playersInRange: Player[] = [];

    this.players.forEach(player => {
      const distance = Math.sqrt(Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2));

      if (distance <= range) {
        playersInRange.push(player);
      }
    });

    return playersInRange;
  }

  /**
   * Get NPCs within a certain range of a position
   */
  public getNPCsInRange(x: number, y: number, range: number): NPC[] {
    const npcsInRange: NPC[] = [];

    this.npcs.forEach(npc => {
      const distance = Math.sqrt(Math.pow(npc.x - x, 2) + Math.pow(npc.y - y, 2));

      if (distance <= range && !npc.isDead) {
        npcsInRange.push(npc);
      }
    });

    return npcsInRange;
  }

  /**
   * Get total number of active entities
   */
  public getEntityCount(): { players: number; npcs: number; loot: number } {
    return {
      players: this.players.size,
      npcs: Array.from(this.npcs.values()).filter(npc => !npc.isDead).length,
      loot: this.loot.size,
    };
  }
}

// === FACTORY FUNCTIONS ===

/**
 * Create a new player with default OSRS stats
 */
export function createPlayer(playerId: string, username: string): Player {
  const player = new Player(playerId, username);

  // Set OSRS starting position (Lumbridge)
  player.x = 3222;
  player.y = 3218;

  return player;
}

/**
 * Create a new inventory item
 */
export function createInventoryItem(
  itemId: string,
  quantity: number = 1,
  properties?: Partial<InventoryItem>
): InventoryItem {
  const item = new InventoryItem(itemId, quantity);

  if (properties) {
    Object.assign(item, properties);
  }

  return item;
}

/**
 * Create a new NPC
 */
export function createNPC(
  npcId: string,
  name: string,
  level: number = 1,
  x: number = 0,
  y: number = 0
): NPC {
  const npc = new NPC(npcId, name, level);
  npc.x = x;
  npc.y = y;
  return npc;
}

/**
 * Create a new loot item
 */
export function createLootItem(
  lootId: string,
  itemId: string,
  quantity: number = 1,
  x: number = 0,
  y: number = 0,
  ownerId: string = ''
): LootItem {
  const loot = new LootItem(lootId, itemId, quantity);
  loot.x = x;
  loot.y = y;
  loot.ownerId = ownerId;
  return loot;
}

// === EXPORTS ===

export {
  CollectLootMessage,
  DropItemMessage,
  EquipItemMessage,
  Equipment,
  GameState,
  Inventory,
  InventoryItem,
  LootDropMessage,
  LootItem,
  NPC,
  Player,
  // Type interfaces
  PlayerActionMessage,
  // Core schemas
  Skill,
  Skills,
  TradeAcceptMessage,
  TradeCancelMessage,
  TradeOfferMessage,
  TradeRequestMessage,
};
