/**
 * Consolidated Schemas for RuneRogue
 *
 * This file consolidates all schemas to prevent duplicate definitions
 * and resolve Colyseus schema registry conflicts.
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';

// === TYPE INTERFACES ===

export interface PlayerActionMessage {
  type: string;
  targetId?: string;
  abilityId?: string;
}

export interface EquipItemMessage {
  itemIndex: number;
  slot: 'weapon' | 'armor' | 'shield';
}

export interface DropItemMessage {
  itemIndex: number;
  quantity?: number;
}

export interface CollectLootMessage {
  lootId: string;
}

export interface LootDropMessage {
  itemType: string;
  quantity: number;
  position: { x: number; y: number };
}

export interface TradeRequestMessage {
  targetPlayerId: string;
}

export interface TradeOfferMessage {
  offeredItems: { itemId: string; quantity: number }[];
}

export interface TradeAcceptMessage {
  tradeId: string;
}

export interface TradeCancelMessage {
  tradeId: string;
}

// === BASIC SCHEMAS ===

/**
 * Skill class for player skills
 */
export class Skill extends Schema {
  @type('number')
  public level: number;

  @type('number')
  public xp: number;

  constructor(level: number = 1, xp: number = 0) {
    super();
    this.level = level;
    this.xp = xp;
  }
}

/**
 * Skills collection class (consolidated to prevent 64-field limit)
 */
export class Skills extends Schema {
  @type(Skill)
  public attackSkill: Skill;

  @type(Skill)
  public strength: Skill;

  @type(Skill)
  public defence: Skill;

  @type(Skill)
  public mining: Skill;

  @type(Skill)
  public woodcutting: Skill;

  @type(Skill)
  public fishing: Skill;

  @type(Skill)
  public prayer: Skill;

  constructor() {
    super();
    this.attackSkill = new Skill();
    this.strength = new Skill();
    this.defence = new Skill();
    this.mining = new Skill();
    this.woodcutting = new Skill();
    this.fishing = new Skill();
    this.prayer = new Skill();
  }
}

/**
 * Equipment class
 */
export class Equipment extends Schema {
  @type('string')
  public weapon: string = '';

  @type('string')
  public armor: string = '';

  @type('string')
  public shield: string = '';

  constructor() {
    super();
    this.weapon = '';
    this.armor = '';
    this.shield = '';
  }
}

/**
 * Inventory item class
 */
export class InventoryItem extends Schema {
  @type('string')
  public itemId: string = '';

  @type('number')
  public quantity: number = 1;

  @type('string')
  public itemName: string = '';

  @type('string')
  public description: string = '';

  @type('number')
  public attackBonus: number = 0;

  @type('number')
  public defenseBonus: number = 0;

  @type('boolean')
  public isStackable: boolean = false;

  constructor(itemId: string = '', quantity: number = 1) {
    super();
    this.itemId = itemId;
    this.quantity = quantity;
  }
}

/**
 * Player class (essential fields only to stay under 64-field limit)
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

  @type([InventoryItem])
  public inventory = new ArraySchema<InventoryItem>();

  @type('number')
  public inventorySize: number = 28;

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

  @type('string')
  public currentTargetId: string = '';

  @type('number')
  public specialEnergy: number = 100;

  @type('number')
  public prayerPoints: number = 1;

  @type('number')
  public maxPrayerPoints: number = 1;

  @type('number')
  public prayerBonus: number = 0;

  @type('number')
  public combatLevel: number = 3;

  // Non-serialized properties
  private actionCooldowns: Map<string, number> = new Map();

  constructor() {
    super();
    this.lastActivity = Date.now();
  }

  // Utility methods
  isOnCooldown(actionType: string): boolean {
    const cooldownUntil = this.actionCooldowns.get(actionType);
    return cooldownUntil !== undefined && cooldownUntil > Date.now();
  }

  setCooldown(actionType: string, durationMs: number): void {
    this.actionCooldowns.set(actionType, Date.now() + durationMs);
  }

  getCooldownRemaining(actionType: string): number {
    const cooldownUntil = this.actionCooldowns.get(actionType);
    if (!cooldownUntil || cooldownUntil <= Date.now()) return 0;
    return cooldownUntil - Date.now();
  }

  getCombatStats(): { attack: number; defense: number; strength: number } {
    return {
      attack: this.skills.attackSkill.level,
      defense: this.skills.defence.level,
      strength: this.skills.strength.level,
    };
  }

  setBusy(durationMs: number): void {
    this.isBusy = true;
    this.busyUntil = Date.now() + durationMs;
  }

  updateBusyStatus(): void {
    if (this.isBusy && this.busyUntil <= Date.now()) {
      this.isBusy = false;
    }
  }

  getCombatLevel(): number {
    const base =
      0.25 *
      (this.skills.defence.level +
        this.skills.strength.level +
        Math.floor(this.skills.attackSkill.level * 1.3));
    return Math.floor(base);
  }

  updateMaxPrayerPoints(): void {
    this.maxPrayerPoints = this.skills.prayer.level;
    if (this.prayerPoints > this.maxPrayerPoints) {
      this.prayerPoints = this.maxPrayerPoints;
    }
  }

  restorePrayerPoints(amount: number): void {
    this.prayerPoints = Math.min(this.prayerPoints + amount, this.maxPrayerPoints);
  }

  drainPrayerPoints(amount: number): void {
    this.prayerPoints = Math.max(this.prayerPoints - amount, 0);
  }
}

/**
 * Simplified NPC class (to stay under 64-field limit)
 */
export class NPC extends Schema {
  @type('string')
  public npcId: string = '';

  @type('string')
  public npcName: string = '';

  @type('string')
  public type: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public health: number = 100;

  @type('number')
  public maxHealth: number = 100;

  @type('number')
  public attackPower: number = 10;

  @type('number')
  public defensePower: number = 10;

  @type('number')
  public aggroRange: number = 5;

  @type('number')
  public attackRange: number = 1;

  @type('number')
  public attackSpeed: number = 2000;

  @type(['string'])
  public lootTable = new ArraySchema<string>();

  constructor(id: string, name: string, x: number, y: number, type: string) {
    super();
    this.npcId = id;
    this.npcName = name;
    this.x = x;
    this.y = y;
    this.type = type;

    // Set base stats based on type
    switch (type) {
      case 'goblin':
        this.maxHealth = 50;
        this.health = 50;
        this.attackPower = 5;
        this.defensePower = 3;
        break;
      case 'orc':
        this.maxHealth = 100;
        this.health = 100;
        this.attackPower = 15;
        this.defensePower = 8;
        break;
      default:
        // Default stats already set
        break;
    }
  }
}

/**
 * Loot drop class
 */
export class LootDrop extends Schema {
  @type('string')
  public lootDropId: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public timestamp: number = 0;

  @type([InventoryItem])
  public items = new ArraySchema<InventoryItem>();

  constructor() {
    super();
    this.timestamp = Date.now();
  }
}

/**
 * Resource class for gathering
 */
export class Resource extends Schema {
  @type('string')
  public resourceId: string = '';

  @type('string')
  public type: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public respawnTime: number = 60000;

  @type('boolean')
  public depleted: boolean = false;

  @type('number')
  public depletedUntil: number = 0;

  @type('number')
  public requiredSkill: number = 1;

  @type('string')
  public skillType: string = 'woodcutting';

  constructor(type: string, x: number, y: number) {
    super();
    this.resourceId = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.type = type;
    this.x = x;
    this.y = y;

    switch (type) {
      case 'tree':
        this.respawnTime = 60000;
        this.requiredSkill = 1;
        this.skillType = 'woodcutting';
        break;
      case 'oak_tree':
        this.respawnTime = 90000;
        this.requiredSkill = 15;
        this.skillType = 'woodcutting';
        break;
      case 'copper_rock':
        this.respawnTime = 60000;
        this.requiredSkill = 1;
        this.skillType = 'mining';
        break;
    }
  }

  deplete(): void {
    this.depleted = true;
    this.depletedUntil = Date.now() + this.respawnTime;
  }

  checkRespawn(): boolean {
    if (this.depleted && Date.now() > this.depletedUntil) {
      this.depleted = false;
      return true;
    }
    return false;
  }
}

/**
 * Game state class
 */
export class GameState extends Schema {
  @type({ map: Player })
  public players = new MapSchema<Player>();

  @type({ map: NPC })
  public npcs = new MapSchema<NPC>();

  @type({ map: LootDrop })
  public loot = new MapSchema<LootDrop>();

  @type({ map: Resource })
  public resources = new MapSchema<Resource>();

  @type('number')
  public timestamp: number = 0;

  @type('number')
  public tickRate: number = 60;

  constructor() {
    super();
    this.timestamp = Date.now();
  }

  // Player management
  addPlayer(playerId: string, username: string): Player {
    const player = new Player();
    player.playerId = playerId;
    player.username = username;
    player.x = Math.floor(Math.random() * 100);
    player.y = Math.floor(Math.random() * 100);
    this.players.set(playerId, player);
    return player;
  }

  removePlayer(playerId: string): boolean {
    return this.players.delete(playerId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  // NPC management
  addNPC(npcId: string, name: string, x: number, y: number, type: string): NPC {
    const npc = new NPC(npcId, name, x, y, type);
    this.npcs.set(npcId, npc);
    return npc;
  }

  removeNPC(npcId: string): boolean {
    return this.npcs.delete(npcId);
  }

  getNPC(npcId: string): NPC | undefined {
    return this.npcs.get(npcId);
  }

  // Loot management
  addLootDrop(lootId: string, x: number, y: number, items: InventoryItem[]): LootDrop {
    const loot = new LootDrop();
    loot.lootDropId = lootId;
    loot.x = x;
    loot.y = y;
    loot.items.push(...items);
    this.loot.set(lootId, loot);
    return loot;
  }

  removeLootDrop(lootId: string): boolean {
    return this.loot.delete(lootId);
  }

  getLootDrop(lootId: string): LootDrop | undefined {
    return this.loot.get(lootId);
  }

  // Resource management
  addResource(resourceId: string, type: string, x: number, y: number): Resource {
    const resource = new Resource(type, x, y);
    resource.resourceId = resourceId;
    this.resources.set(resourceId, resource);
    return resource;
  }

  removeResource(resourceId: string): boolean {
    return this.resources.delete(resourceId);
  }

  getResource(resourceId: string): Resource | undefined {
    return this.resources.get(resourceId);
  }

  // Utility methods
  updateTimestamp(): void {
    this.timestamp = Date.now();
  }

  getAllPlayersCount(): number {
    return this.players.size;
  }

  getAllNPCsCount(): number {
    return this.npcs.size;
  }

  getAllLootCount(): number {
    return this.loot.size;
  }

  getAllResourcesCount(): number {
    return this.resources.size;
  }
}

// === FACTORY FUNCTIONS ===

export const SchemaFactories = {
  createPlayer(playerId: string, username: string): Player {
    const player = new Player();
    player.playerId = playerId;
    player.username = username;
    return player;
  },

  createInventoryItem(itemId: string, quantity: number = 1): InventoryItem {
    const item = new InventoryItem(itemId, quantity);
    return item;
  },

  createNPC(id: string, name: string, x: number, y: number, type: string): NPC {
    return new NPC(id, name, x, y, type);
  },

  createLootDrop(lootId: string, x: number, y: number): LootDrop {
    const loot = new LootDrop();
    loot.lootDropId = lootId;
    loot.x = x;
    loot.y = y;
    return loot;
  },

  createGameState(): GameState {
    return new GameState();
  },
};
