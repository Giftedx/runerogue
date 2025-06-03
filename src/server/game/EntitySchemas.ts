import { Schema, ArraySchema, MapSchema, type } from '@colyseus/schema';

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

  constructor() {
    super();
    this.attack = new Skill();
    this.strength = new Skill();
    this.defence = new Skill();
    this.mining = new Skill();
    this.woodcutting = new Skill();
    this.fishing = new Skill();
  }
}

/**
 * Inventory item class
 */
export class InventoryItem extends Schema {
  @type('string')
  public type: string;

  @type('number')
  public quantity: number;

  constructor(type: string = '', quantity: number = 1) {
    super();
    this.type = type;
    this.quantity = quantity;
  }
}

/**
 * Equipment class
 */
export class Equipment extends Schema {
  @type('string')
  public weapon: string | null;

  @type('string')
  public armor: string | null;

  @type('string')
  public shield: string | null;

  constructor() {
    super();
    this.weapon = null;
    this.armor = null;
    this.shield = null;
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

  // Active prayers (by name)
  @type(['string'])
  public activePrayers = new ArraySchema<string>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _prayerTimers: Map<string, number> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _specialCooldowns: Map<string, number> = new Map();

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
      strength: this.skills.strength.level
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
    const base = 0.25 * (this.skills.defence.level + this.skills.strength.level + Math.floor(this.skills.attack.level * 1.3));
    return Math.floor(base);
  }
}

/**
 * Game state class
 */
export class GameState extends Schema {
  @type({ map: Player })
  public players = new MapSchema<Player>();

  @type({ map: LootDrop })
  public lootDrops = new MapSchema<LootDrop>();
}

/**
 * NPC class for non-player characters
 */
export class NPC extends Schema {
  @type('string')
  public id: string = '';

  @type('string')
  public type: string = '';

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

  @type('boolean')
  public aggressive: boolean = false;

  @type('number')
  public aggroRange: number = 5;

  @type('number')
  public attackRange: number = 1;

  @type('number')
  public attackSpeed: number = 4;

  @type('number')
  public lastAttack: number = 0;

  @type('string')
  public currentTargetId: string = '';

  @type('boolean')
  public respawning: boolean = false;

  constructor(type: string) {
    super();
    this.type = type;
    this.id = `npc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Set properties based on NPC type
    switch(type) {
      case 'goblin':
        this.health = this.maxHealth = 25;
        this.aggressive = true;
        this.aggroRange = 7;
        break;
      case 'guard':
        this.health = this.maxHealth = 60;
        this.aggressive = false;
        break;
      case 'chicken':
        this.health = this.maxHealth = 10;
        this.aggressive = false;
        this.aggroRange = 2;
        break;
      // Add more NPC types as needed
    }
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
    switch(type) {
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
  
  @type('number')
  public dangerLevel: number = 1;
  
  @type({ map: NPC })
  public npcs = new MapSchema<NPC>();
  
  @type({ map: Resource })
  public resources = new MapSchema<Resource>();
  
  // Not serialized - used for pathfinding and collision detection
  public collisionMap: boolean[][] = [];
  
  constructor(id: string, name: string, width = 100, height = 100) {
    super();
    this.id = id;
    this.name = name;
    this.width = width;
    this.height = height;
    
    // Initialize collision map
    this.collisionMap = Array(height).fill(false).map(() => Array(width).fill(false));
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

// Extended game state with map
export class WorldState extends GameState {
  @type({ map: AreaMap })
  public maps = new MapSchema<AreaMap>();
  
  @type('string')
  public currentMapId: string = 'default';
}
