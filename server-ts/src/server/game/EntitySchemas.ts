/**
 * Calculate OSRS-style combat level from player skills.
 * @param skills PlayerSkills instance
 * @returns Combat level (rounded down)
 */
export function getCombatLevel(skills: PlayerSkills): number {
  // OSRS combat level formula:
  // base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2))
  // melee = 0.325 * (attack + strength)
  // range = 0.325 * Math.floor(ranged * 1.5)
  // mage = 0.325 * Math.floor(magic * 1.5)
  const defence = skills.defence.level;
  const hitpoints = skills.hitpoints.level;
  const prayer = skills.prayer.level;
  const attack = skills.attack.level;
  const strength = skills.strength.level;
  const ranged = skills.ranged.level;
  const magic = skills.magic.level;
  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
  const melee = 0.325 * (attack + strength);
  const range = 0.325 * Math.floor(ranged * 1.5);
  const mage = 0.325 * Math.floor(magic * 1.5);
  return Math.floor(base + Math.max(melee, range, mage));
}
/**
 * RuneRogue Entity Schemas
 *
 * Working Colyseus schema definitions for multiplayer synchronization.
 * Uses simplified, conflict-free property names for reliable operation.
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

/**
 * Basic inventory item schema
 */
export class InventoryItem extends Schema {
  @type('string') public itemId: string = '';
  @type('string') public name: string = '';
  @type('number') public quantity: number = 1;
  @type('number') public value: number = 0;
  @type('boolean') public stackable: boolean = false;

  constructor(itemDef?: any, quantity: number = 1) {
    super();
    if (itemDef) {
      this.itemId = itemDef.itemId || itemDef.id || '';
      this.name = itemDef.name || '';
      this.value = itemDef.baseValue || itemDef.value || 0;
      this.stackable = itemDef.isStackable || false;
      this.quantity = quantity;
    }
  }
}

/**
 * Player schema
 */

/**
 * Schema for a single skill (level and xp).
 */
export class SkillLevel extends Schema {
  /** Skill level */
  @type('number') public level: number = 1;
  /** Skill experience */
  @type('number') public xp: number = 0;
}

/**
 * Schema for all player skills (OSRS-style).
 */
export class PlayerSkills extends Schema {
  /** Attack skill */
  @type(SkillLevel) public attack: SkillLevel = new SkillLevel();
  /** Strength skill */
  @type(SkillLevel) public strength: SkillLevel = new SkillLevel();
  /** Defence skill */
  @type(SkillLevel) public defence: SkillLevel = new SkillLevel();
  /** Hitpoints skill */
  @type(SkillLevel) public hitpoints: SkillLevel = new SkillLevel();
  /** Prayer skill */
  @type(SkillLevel) public prayer: SkillLevel = new SkillLevel();
  /** Magic skill */
  @type(SkillLevel) public magic: SkillLevel = new SkillLevel();
  /** Ranged skill */
  @type(SkillLevel) public ranged: SkillLevel = new SkillLevel();
  // Add more skills as needed
}

/**
 * Player schema for Colyseus multiplayer and ECS integration.
 * @augments Schema
 */
export class Player extends Schema {
  /** Unique player ID */
  @type('string') public id: string = '';
  /** Player username */
  @type('string') public username: string = '';
  /** Player display name */
  @type('string') public displayName: string = '';
  /** X position */
  @type('number') public x: number = 0;
  /** Y position */
  @type('number') public y: number = 0;
  /** Player health (current) */
  @type('number') public health: number = 10;
  /** Player health (maximum) */
  @type('number') public maxHealth: number = 10;
  /** Player prayer points (current) */
  @type('number') public prayerPoints: number = 1;
  /** Player prayer points (maximum) */
  @type('number') public maxPrayerPoints: number = 1;
  /** Player combat level */
  @type('number') public combatLevel: number = 3;
  /** Player is in combat */
  @type('boolean') public inCombat: boolean = false;
  /** Player special attack energy */
  @type('number') public specialEnergy: number = 100;
  /** Player animation state (e.g., 'idle', 'walking') */
  @type('string') public animation: string = 'idle';
  /** Player inventory */
  @type([InventoryItem]) public inventory = new ArraySchema<InventoryItem>();
  /** Player inventory size (max slots) */
  @type('number') public inventorySize: number = 28;
  /** Player active prayers (by ID as string) */
  @type(['string']) public activePrayers = new ArraySchema<string>();
  /**
   * OSRS-style skills object for ECS integration
   */
  @type(PlayerSkills) public skills: PlayerSkills = new PlayerSkills();

  constructor() {
    super();
    // Ensure skills object is always initialized
    if (!this.skills) {
      this.skills = new PlayerSkills();
    }
    // Ensure activePrayers is always initialized
    if (!this.activePrayers) {
      this.activePrayers = new ArraySchema<string>();
    }
    // Ensure inventory is always initialized
    if (!this.inventory) {
      this.inventory = new ArraySchema<InventoryItem>();
    }
  }

  takeDamage(damage: number): boolean {
    this.hp = Math.max(0, this.hp - damage);
    return this.hp <= 0;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}

/**
 * NPC schema
 */
export class NPC extends Schema {
  @type('string') public id: string = '';
  @type('string') public name: string = '';
  @type('string') public type: string = '';
  @type('number') public x: number = 0;
  @type('number') public y: number = 0;
  @type('number') public health: number = 10;
  @type('number') public maxHealth: number = 10;
  @type('number') public combatLevel: number = 1;
  @type('number') public attack: number = 1;
  @type('number') public defense: number = 1;
  @type('number') public aggroRange: number = 5;
  @type('string') public targetId: string = '';
  @type('boolean') public isDead: boolean = false;

  constructor() {
    super();
  }

  takeDamage(damage: number): boolean {
    this.health = Math.max(0, this.health - damage);
    this.isDead = this.health <= 0;
    return this.isDead;
  }
}

/**
 * Loot drop schema
 */
export class LootDrop extends Schema {
  @type('string') public id: string = '';
  @type('number') public x: number = 0;
  @type('number') public y: number = 0;
  @type('number') public timestamp: number = 0;
  @type([InventoryItem]) public items = new ArraySchema<InventoryItem>();

  constructor() {
    super();
    this.timestamp = Date.now();
  }
}

/**
 * Enemy schema (for wave-based gameplay)
 */
export class Enemy extends Schema {
  @type('string') public id: string = '';
  @type('string') public type: string = '';
  @type('number') public x: number = 0;
  @type('number') public y: number = 0;
  @type('number') public health: number = 10;
  @type('number') public maxHealth: number = 10;
  @type('number') public combatLevel: number = 1;
  @type('boolean') public isAggressive: boolean = true;
  @type('string') public targetId: string = '';
  @type('string') public lastAction: string = '';

  constructor() {
    super();
  }
}

/**
 * Trade schema for player trading
 */
export class Trade extends Schema {
  @type('string') public id: string = '';
  @type('string') public initiatorId: string = '';
  @type('string') public recipientId: string = '';
  @type([InventoryItem]) public initiatorItems = new ArraySchema<InventoryItem>();
  @type([InventoryItem]) public recipientItems = new ArraySchema<InventoryItem>();
  @type('boolean') public initiatorAccepted: boolean = false;
  @type('boolean') public recipientAccepted: boolean = false;
  @type('string') public status: string = 'pending';

  constructor() {
    super();
  }
}

/**
 * Area map schema
 */
export class AreaMap extends Schema {
  @type('string') public id: string = '';
  @type('string') public name: string = '';
  @type('number') public width: number = 100;
  @type('number') public height: number = 100;
  @type('string') public biome: string = 'plains';

  // Not serialized - used for pathfinding and collision detection
  public collisionMap: boolean[][] = [];

  constructor(name: string = '', width: number = 100, height: number = 100) {
    super();
    this.id = `map_${Date.now()}`;
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

/**
 * Resource schema for gathering nodes
 */
export class Resource extends Schema {
  @type('string') public id: string = '';
  @type('string') public type: string = '';
  @type('number') public x: number = 0;
  @type('number') public y: number = 0;
  @type('number') public respawnTime: number = 60000;
  @type('boolean') public depleted: boolean = false;
  @type('number') public depletedUntil: number = 0;
  @type('number') public requiredSkill: number = 1;
  @type('string') public skillType: string = 'woodcutting';

  constructor(type: string = '', x: number = 0, y: number = 0) {
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
      case 'iron_rock':
        this.respawnTime = 60000;
        this.requiredSkill = 15;
        this.skillType = 'mining';
        break;
      case 'fishing_spot':
        this.respawnTime = 0; // Don't deplete
        this.requiredSkill = 1;
        this.skillType = 'fishing';
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
 * Main game state schema
 */
export class GameState extends Schema {
  @type('number') public tick: number = 0;
  @type('number') public timestamp: number = 0;
  @type('number') public waveNumber: number = 1;
  @type('number') public enemiesRemaining: number = 0;
  @type('string') public gamePhase: string = 'waiting';
  @type('string') public currentMapId: string = '';
  @type({ map: Player }) public players = new MapSchema<Player>();
  @type({ map: Enemy }) public enemies = new MapSchema<Enemy>();
  @type({ map: NPC }) public npcs = new MapSchema<NPC>();
  @type({ map: LootDrop }) public lootDrops = new MapSchema<LootDrop>();
  @type({ map: Trade }) public trades = new MapSchema<Trade>();
  @type({ map: AreaMap }) public maps = new MapSchema<AreaMap>();
  @type({ map: Resource }) public resources = new MapSchema<Resource>();

  constructor() {
    super();
    this.timestamp = Date.now();
  }

  updateTick(): void {
    this.tick++;
    this.timestamp = Date.now();
  }
}

/**
 * World state schema (alias for GameState for compatibility)
 */
export class WorldState extends GameState {
  constructor() {
    super();
  }
}

// Message schemas for client-server communication
export class DropItemMessage extends Schema {
  @type('string') public playerId: string = '';
  @type('number') public slotIndex: number = 0;
  @type('number') public quantity: number = 1;
}

export class EquipItemMessage extends Schema {
  @type('string') public playerId: string = '';
  @type('number') public slotIndex: number = 0;
}

export class TradeRequestMessage extends Schema {
  @type('string') public fromPlayerId: string = '';
  @type('string') public toPlayerId: string = '';
}

export class TradeOfferMessage extends Schema {
  @type('string') public tradeId: string = '';
  @type('string') public playerId: string = '';
  @type([InventoryItem]) public items = new ArraySchema<InventoryItem>();
}

export class TradeAcceptMessage extends Schema {
  @type('string') public tradeId: string = '';
  @type('string') public playerId: string = '';
}

export class TradeCancelMessage extends Schema {
  @type('string') public tradeId: string = '';
  @type('string') public playerId: string = '';
}

// Re-export essential types
export { ArraySchema, MapSchema, Schema, type };

// Factory functions for creating entities
export function createPlayer(id: string, username: string, displayName?: string): Player {
  const player = new Player();
  player.id = id;
  player.username = username;
  player.displayName = displayName || username;
  return player;
}

export function createNPC(id: string, name: string, type: string = 'monster'): NPC {
  const npc = new NPC();
  npc.id = id;
  npc.name = name;
  npc.type = type;
  return npc;
}

export function createEnemy(id: string, type: string): Enemy {
  const enemy = new Enemy();
  enemy.id = id;
  enemy.type = type;
  return enemy;
}

export function createLootDrop(id: string, x: number, y: number): LootDrop {
  const loot = new LootDrop();
  loot.id = id;
  loot.x = x;
  loot.y = y;
  return loot;
}
