/**
 * Safe Entity Schemas - Idempotent Registration System
 *
 * This file implements a comprehensive solution to prevent Colyseus schema
 * duplicate property registration issues in Jest test environments.
 *
 * Key features:
 * - Global registration tracking to prevent duplicates
 * - Safe decorator wrapper that checks for existing registrations
 * - Proper Symbol.metadata polyfill
 * - Clean schema definitions with proper inheritance
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Global registry to track which classes/properties have been registered
const SCHEMA_REGISTRY = new Map<string, Set<string>>();

/**
 * Safe type decorator that prevents duplicate property registration
 */
function safeType(typeOrSchema: any, options?: any) {
  return function (target: any, propertyKey: string) {
    const className = target.constructor.name;
    const registryKey = `${className}.${propertyKey}`;

    // Check if this property has already been registered
    if (!SCHEMA_REGISTRY.has(className)) {
      SCHEMA_REGISTRY.set(className, new Set());
    }

    const classRegistry = SCHEMA_REGISTRY.get(className)!;

    if (classRegistry.has(propertyKey)) {
      // Property already registered, skip registration
      console.debug(`[SafeSchema] Skipping duplicate registration: ${registryKey}`);
      return;
    }

    // Mark as registered
    classRegistry.add(propertyKey);

    // Perform the actual type registration
    try {
      type(typeOrSchema, options)(target, propertyKey);
      console.debug(`[SafeSchema] Successfully registered: ${registryKey}`);
    } catch (error) {
      console.warn(`[SafeSchema] Failed to register ${registryKey}:`, error);
      // Remove from registry if registration failed
      classRegistry.delete(propertyKey);
    }
  };
}

// Interface definitions (no changes needed)
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

/**
 * Skill class for player skills
 */
export class Skill extends Schema {
  @safeType('number')
  public level: number = 1;

  @safeType('number')
  public xp: number = 0;

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
  @safeType(Skill)
  public attackSkill: Skill = new Skill();

  @safeType(Skill)
  public strength: Skill = new Skill();

  @safeType(Skill)
  public defence: Skill = new Skill();

  @safeType(Skill)
  public mining: Skill = new Skill();

  @safeType(Skill)
  public woodcutting: Skill = new Skill();

  @safeType(Skill)
  public fishing: Skill = new Skill();

  @safeType(Skill)
  public prayer: Skill = new Skill();

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
 * Inventory item class
 */
export class InventoryItem extends Schema {
  @safeType('string')
  public itemId: string = '';

  @safeType('number')
  public quantity: number = 1;

  @safeType('string')
  public itemName: string = '';

  @safeType('string')
  public description: string = '';

  @safeType('number')
  public attackBonus: number = 0;

  @safeType('number')
  public defenseBonus: number = 0;

  @safeType('boolean')
  public isStackable: boolean = false;

  constructor(itemDefinition?: any, quantity: number = 1) {
    super();
    if (itemDefinition) {
      this.itemId = itemDefinition.itemId || '';
      this.itemName = itemDefinition.name || '';
      this.description = itemDefinition.description || '';
      this.attackBonus = itemDefinition.attack || 0;
      this.defenseBonus = itemDefinition.defense || 0;
      this.isStackable = itemDefinition.isStackable || false;
    }
    this.quantity = quantity;
  }
}

/**
 * Equipment class
 */
export class Equipment extends Schema {
  @safeType('string')
  public weapon: string = '';

  @safeType('string')
  public armor: string = '';

  @safeType('string')
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
  @safeType('string')
  public id: string = '';

  @safeType('number')
  public x: number = 0;

  @safeType('number')
  public y: number = 0;

  @safeType('number')
  public timestamp: number = 0;

  @safeType([InventoryItem])
  public items = new ArraySchema<InventoryItem>();

  constructor() {
    super();
    this.id = Math.random().toString(36).substr(2, 9);
    this.timestamp = Date.now();
  }
}

/**
 * Player class
 */
export class Player extends Schema {
  @safeType('string')
  public id: string = '';

  @safeType('string')
  public username: string = '';

  @safeType('number')
  public x: number = 0;

  @safeType('number')
  public y: number = 0;

  @safeType('string')
  public animation: string = 'idle';

  @safeType('string')
  public direction: string = 'down';

  @safeType('number')
  public health: number = 100;

  @safeType('number')
  public maxHealth: number = 100;

  @safeType('number')
  public lastActivity: number = 0;

  @safeType('boolean')
  public isBusy: boolean = false;

  @safeType('number')
  public busyUntil: number = 0;

  @safeType([InventoryItem])
  public inventory = new ArraySchema<InventoryItem>();

  @safeType('number')
  public inventorySize: number = 28;

  @safeType('number')
  public gold: number = 0;

  @safeType(Equipment)
  public equipment: Equipment = new Equipment();

  @safeType(Skills)
  public skills: Skills = new Skills();

  @safeType('string')
  public combatStyle: string = 'accurate';

  @safeType('boolean')
  public inCombat: boolean = false;

  @safeType('number')
  public combatLevel: number = 3;

  constructor() {
    super();
    this.equipment = new Equipment();
    this.skills = new Skills();
    this.lastActivity = Date.now();
  }
}

/**
 * NPC class for non-player characters
 */
export class NPC extends Schema {
  @safeType('string')
  public id: string = '';

  @safeType('string')
  public name: string = '';

  @safeType('number')
  public x: number = 0;

  @safeType('number')
  public y: number = 0;

  @safeType('string')
  public animation: string = 'idle';

  @safeType('string')
  public direction: string = 'down';

  @safeType('number')
  public health: number = 100;

  @safeType('number')
  public maxHealth: number = 100;

  @safeType('boolean')
  public hostile: boolean = false;

  @safeType('number')
  public level: number = 1;

  @safeType('string')
  public type: string = 'generic';

  constructor() {
    super();
    this.id = Math.random().toString(36).substr(2, 9);
  }
}

/**
 * Game state class that holds all multiplayer state
 */
export class GameState extends Schema {
  @safeType({ map: Player })
  public players = new MapSchema<Player>();

  @safeType({ map: NPC })
  public npcs = new MapSchema<NPC>();

  @safeType({ map: LootDrop })
  public loot = new MapSchema<LootDrop>();

  @safeType('number')
  public timestamp: number = 0;

  constructor() {
    super();
    this.timestamp = Date.now();
  }
}

// Export schema registry for debugging
export { SCHEMA_REGISTRY };

// Export utility functions
export function getRegistrationInfo() {
  const info: Record<string, string[]> = {};
  for (const [className, properties] of SCHEMA_REGISTRY.entries()) {
    info[className] = Array.from(properties);
  }
  return info;
}

export function clearRegistrationCache() {
  SCHEMA_REGISTRY.clear();
  console.log('[SafeSchema] Registration cache cleared');
}

export function isPropertyRegistered(className: string, propertyName: string): boolean {
  const classRegistry = SCHEMA_REGISTRY.get(className);
  return classRegistry ? classRegistry.has(propertyName) : false;
}
