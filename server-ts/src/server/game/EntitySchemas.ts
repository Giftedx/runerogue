// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
export { ArraySchema };

// Interface for player action messages
export interface PlayerActionMessage {
  type: string; // e.g., 'attack', 'cast_spell', 'use_ability'
  targetId?: string; // Optional: ID of the target entity
  abilityId?: string; // Optional: ID of the ability/spell used
}

// Interface for equip item messages
export interface EquipItemMessage {
  itemIndex: number;
  slot: 'weapon' | 'armor' | 'shield';
}

// Interface for drop item messages
export interface DropItemMessage {
  itemIndex: number;
  quantity?: number;
}

// Interface for collect loot messages
export interface CollectLootMessage {
  lootId: string;
}

// Interface for loot drop messages
export interface LootDropMessage {
  itemType: string;
  quantity: number;
  position: { x: number; y: number };
}

// Interface for trade request messages
export interface TradeRequestMessage {
  targetPlayerId: string;
}

// Interface for trade offer messages
export interface TradeOfferMessage {
  offeredItems: { itemId: string; quantity: number }[];
}

// Interface for trade accept/cancel messages
export interface TradeAcceptMessage {
  tradeId: string;
}

export interface TradeCancelMessage {
  tradeId: string;
}

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
 * Skills collection class
 */
export class Skills extends Schema {
  @type(Skill)
  public attack: Skill;

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
    this.attack = new Skill();
    this.strength = new Skill();
    this.defence = new Skill();
    this.mining = new Skill();
    this.woodcutting = new Skill();
    this.fishing = new Skill();
    this.prayer = new Skill();
  }
}

import { ItemDefinition } from './ItemManager';
import { LootTableEntry } from './LootManager';

/**
 * Inventory item class
 */
export class InventoryItem extends Schema {
  @type('string')
  public itemId: string = ''; // Unique ID for the item type

  @type('number')
  public quantity: number = 1;

  // Properties loaded from ItemDefinition
  @type('string')
  public name: string = '';

  @type('string')
  public description: string = '';

  @type('number')
  public attack: number = 0;

  @type('number')
  public defense: number = 0;

  @type('boolean')
  public isStackable: boolean = false;

  constructor(itemDefinition?: ItemDefinition, quantity: number = 1) {
    super();
    if (itemDefinition) {
      this.itemId = itemDefinition.itemId;
      this.name = itemDefinition.name;
      this.description = itemDefinition.description;
      this.attack = itemDefinition.attack;
      this.defense = itemDefinition.defense;
      this.isStackable = itemDefinition.isStackable;
    }
    this.quantity = quantity;
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
 * Loot drop class
 */
export class LootDrop extends Schema {
  @type('string')
  public id: string = '';

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
 * Player class
 */
export class Player extends Schema {
  @type('string')
  public id: string = '';

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

  // Special attack energy (0-100)
  @type('number')
  public specialEnergy: number = 100;

  // Prayer points (0 to Prayer level)
  @type('number')
  public prayerPoints: number = 1;

  // Active combat effects
  @type(['string'])
  public activeEffects = new ArraySchema<string>();

  // Maximum prayer points (equal to Prayer level)
  @type('number')
  public maxPrayerPoints: number = 1;

  // Active prayers (by prayer ID)
  @type(['string'])
  public activePrayers = new ArraySchema<string>();

  // Prayer bonus from equipment
  @type('number')
  public prayerBonus: number = 0;

  // Combat level (calculated from skills)
  @type('number')
  public combatLevel: number = 3;

  private actionCooldowns: Map<string, number> = new Map();

  constructor() {
    super();
    this.lastActivity = Date.now();
  }

  // Check if an action is on cooldown
  isOnCooldown(actionType: string): boolean {
    const cooldownUntil = this.actionCooldowns.get(actionType);
    return cooldownUntil !== undefined && cooldownUntil > Date.now();
  }

  // Set cooldown for an action
  setCooldown(actionType: string, durationMs: number): void {
    this.actionCooldowns.set(actionType, Date.now() + durationMs);
  }

  // Get remaining cooldown time
  getCooldownRemaining(actionType: string): number {
    const cooldownUntil = this.actionCooldowns.get(actionType);
    if (!cooldownUntil || cooldownUntil <= Date.now()) return 0;
    return cooldownUntil - Date.now();
  }

  // Get combat stats for damage calculation
  getCombatStats(): { attack: number; defense: number; strength: number } {
    return {
      attack: this.skills.attack.level,
      defense: this.skills.defence.level,
      strength: this.skills.strength.level,
    };
  }

  // Set player as busy for a duration
  setBusy(durationMs: number): void {
    this.isBusy = true;
    this.busyUntil = Date.now() + durationMs;
  }

  // Check and update busy status
  updateBusyStatus(): void {
    if (this.isBusy && this.busyUntil <= Date.now()) {
      this.isBusy = false;
    }
  }

  // Calculate combat level based on skills
  getCombatLevel(): number {
    const base =
      0.25 *
      (this.skills.defence.level +
        this.skills.strength.level +
        Math.floor(this.skills.attack.level * 1.3));
    return Math.floor(base);
  }

  // Update maximum prayer points based on Prayer level
  updateMaxPrayerPoints(): void {
    this.maxPrayerPoints = this.skills.prayer.level;
    // Ensure current prayer points don't exceed max
    if (this.prayerPoints > this.maxPrayerPoints) {
      this.prayerPoints = this.maxPrayerPoints;
    }
  }

  // Restore prayer points (capped at max)
  restorePrayerPoints(amount: number): void {
    this.prayerPoints = Math.min(this.prayerPoints + amount, this.maxPrayerPoints);
  }

  // Drain prayer points (minimum 0)
  drainPrayerPoints(amount: number): void {
    this.prayerPoints = Math.max(this.prayerPoints - amount, 0);
  }
}
export class Resource extends Schema {
  @type('string')
  public id: string = '';

  @type('string')
  public type: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public respawnTime: number = 60000; // 1 minute in ms

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
    this.id = `resource-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.type = type;
    this.x = x;
    this.y = y;

    // Set properties based on resource type
    switch (type) {
      case 'tree':
        this.respawnTime = 60000; // 1 minute
        this.requiredSkill = 1;
        this.skillType = 'woodcutting';
        break;
      case 'oak_tree':
        this.respawnTime = 90000; // 1.5 minutes
        this.requiredSkill = 15;
        this.skillType = 'woodcutting';
        break;
      case 'copper_rock':
        this.respawnTime = 60000;
        this.requiredSkill = 1;
        this.skillType = 'mining';
        break;
      // Add more resource types
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

export class AreaMap extends Schema {
  @type('string')
  public id: string = '';

  @type('string')
  public name: string = '';

  @type('number')
  public width: number = 100;

  @type('number')
  public height: number = 100;

  @type('string')
  public biome: string = 'plains';

  // Note: 2D array collision map is not serialized via Colyseus
  // It's managed locally on the server
  public collisionMap: boolean[][] = [];

  constructor(name: string, width: number, height: number) {
    super();
    this.id = `map-${Date.now()}`;
    this.name = name;
    this.width = width;
    this.height = height;

    // Initialize collision map
    this.collisionMap = Array(height)
      .fill(false)
      .map(() => Array(width).fill(false));
  }

  // Check if position is walkable (not colliding with obstacles)
  isWalkable(x: number, y: number): boolean {
    // Check bounds
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }

    // Check collision map
    return !this.collisionMap[Math.floor(y)][Math.floor(x)];
  }

  // Add collision at position
  addCollision(x: number, y: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.collisionMap[Math.floor(y)][Math.floor(x)] = true;
    }
  }

  // Remove collision at position
  removeCollision(x: number, y: number): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.collisionMap[Math.floor(y)][Math.floor(x)] = false;
    }
  }
}

export class NPC extends Schema {
  @type('string')
  public id: string = '';

  @type('string')
  public name: string = '';

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
  public attack: number = 10;

  @type('number')
  public defense: number = 10;

  @type('number')
  public aggroRange: number = 5;

  @type('number')
  public attackRange: number = 1;

  @type('number')
  public attackSpeed: number = 2000;

  @type(['string'])
  public lootTable = new ArraySchema<string>(); // Array of itemIds

  // Active combat effects
  @type(['string'])
  public activeEffects = new ArraySchema<string>();

  constructor(
    id: string,
    name: string,
    x: number,
    y: number,
    type: string,
    lootTable: LootTableEntry[] = []
  ) {
    super();
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.type = type;
    // Convert LootTableEntry objects to itemId strings
    this.lootTable.push(...lootTable.map(entry => entry.itemId));

    // Set base stats based on type (example, can be more complex)
    switch (type) {
      case 'goblin':
        this.maxHealth = 50;
        this.health = 50;
        this.attack = 5;
        this.defense = 3;
        this.aggroRange = 3;
        this.attackRange = 1;
        this.attackSpeed = 1500;
        break;
      case 'orc':
        this.maxHealth = 120;
        this.health = 120;
        this.attack = 15;
        this.defense = 10;
        this.aggroRange = 4;
        this.attackRange = 1;
        this.attackSpeed = 2000;
        break;
      // Add more NPC types
    }
  }
}

// Extended game state with map and NPCs
export class Trade extends Schema {
  @type('string')
  public tradeId: string = '';

  @type('string')
  public proposerId: string = '';

  @type('string')
  public accepterId: string = '';

  @type([InventoryItem])
  public proposerItems = new ArraySchema<InventoryItem>();

  @type([InventoryItem])
  public accepterItems = new ArraySchema<InventoryItem>();

  @type('string')
  public status: 'pending' | 'offered' | 'accepted' | 'completed' | 'cancelled' = 'pending';

  constructor(tradeId: string, proposerId: string, accepterId: string) {
    super();
    this.tradeId = tradeId;
    this.proposerId = proposerId;
    this.accepterId = accepterId;
  }
}

export class GameState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type({ map: LootDrop })
  lootDrops = new MapSchema<LootDrop>();

  @type({ map: NPC })
  npcs = new MapSchema<NPC>();

  @type({ map: Trade })
  trades = new MapSchema<Trade>();

  @type({ map: Resource })
  resources = new MapSchema<Resource>();

  // Add other common game state properties here if needed
}

export class WorldState extends GameState {
  @type({ map: AreaMap })
  public maps = new MapSchema<AreaMap>();

  @type('string')
  public currentMapId: string = 'default';
}
