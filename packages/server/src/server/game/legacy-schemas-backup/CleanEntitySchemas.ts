/**
 * Clean Entity Schemas for RuneRogue
 *
 * This file contains completely isolated schema definitions that prevent
 * duplicate registration issues during testing and runtime.
 *
 * Key principles:
 * 1. Each schema class is defined only once
 * 2. Proper metadata handling with Symbol.metadata polyfill
 * 3. Safe for Jest testing environment
 * 4. No circular dependencies or re-registrations
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Ensure Symbol.metadata exists for decorator compatibility
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as any).metadata = Symbol('metadata');
}

/**
 * Registry to track defined schema classes and prevent duplicates
 */
const SCHEMA_REGISTRY = new Set<string>();

/**
 * Safe decorator wrapper that prevents duplicate registrations
 */
function safeType(typeDef: any) {
  return function (target: any, propertyKey: string) {
    const className = target.constructor.name;
    const registryKey = `${className}.${propertyKey}`;

    if (SCHEMA_REGISTRY.has(registryKey)) {
      console.warn(`Schema property ${registryKey} already registered, skipping duplicate`);
      return;
    }

    SCHEMA_REGISTRY.add(registryKey);
    return type(typeDef)(target, propertyKey);
  };
}

/**
 * Skill data structure matching OSRS skill system
 */
export class Skill extends Schema {
  @type('number') level: number = 1;
  @type('number') experience: number = 0;
  @type('number') modifiedLevel: number = 1; // For stat changes (potions, prayers, etc.)
}

/**
 * Complete skills collection for a player
 */
export class Skills extends Schema {
  @type(Skill) attack: Skill = new Skill();
  @type(Skill) strength: Skill = new Skill();
  @type(Skill) defence: Skill = new Skill();
  @type(Skill) ranged: Skill = new Skill();
  @type(Skill) prayer: Skill = new Skill();
  @type(Skill) magic: Skill = new Skill();
  @type(Skill) hitpoints: Skill = new Skill();
  @type(Skill) crafting: Skill = new Skill();
  @type(Skill) mining: Skill = new Skill();
  @type(Skill) smithing: Skill = new Skill();
  @type(Skill) fishing: Skill = new Skill();
  @type(Skill) cooking: Skill = new Skill();
  @type(Skill) firemaking: Skill = new Skill();
  @type(Skill) woodcutting: Skill = new Skill();
  @type(Skill) agility: Skill = new Skill();
  @type(Skill) herblore: Skill = new Skill();
  @type(Skill) thieving: Skill = new Skill();
  @type(Skill) fletching: Skill = new Skill();
  @type(Skill) slayer: Skill = new Skill();
  @type(Skill) farming: Skill = new Skill();
  @type(Skill) construction: Skill = new Skill();
  @type(Skill) hunter: Skill = new Skill();
  @type(Skill) runecrafting: Skill = new Skill();
}

/**
 * Individual inventory item
 */
export class InventoryItem extends Schema {
  @type('string') itemId: string = '';
  @type('string') name: string = '';
  @type('number') quantity: number = 1;
  @type('boolean') stackable: boolean = false;
  @type('number') attack: number = 0;
  @type('number') strength: number = 0;
  @type('number') defence: number = 0;
  @type('number') ranged: number = 0;
  @type('number') magic: number = 0;
  @type('number') prayer: number = 0;
  @type('number') value: number = 0;
  @type('boolean') tradeable: boolean = true;
}

/**
 * Player inventory container
 */
export class Inventory extends Schema {
  @type([InventoryItem]) items: ArraySchema<InventoryItem> = new ArraySchema<InventoryItem>();
  @type('number') maxCapacity: number = 28; // Standard OSRS inventory size
}

/**
 * Equipment slot data
 */
export class Equipment extends Schema {
  @type(InventoryItem) helmet?: InventoryItem;
  @type(InventoryItem) cape?: InventoryItem;
  @type(InventoryItem) amulet?: InventoryItem;
  @type(InventoryItem) weapon?: InventoryItem;
  @type(InventoryItem) body?: InventoryItem;
  @type(InventoryItem) shield?: InventoryItem;
  @type(InventoryItem) legs?: InventoryItem;
  @type(InventoryItem) gloves?: InventoryItem;
  @type(InventoryItem) boots?: InventoryItem;
  @type(InventoryItem) ring?: InventoryItem;
  @type(InventoryItem) ammo?: InventoryItem;
}

/**
 * Main player entity
 */
export class Player extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0; // Floor/height level
  @type('number') health: number = 10;
  @type('number') maxHealth: number = 10;
  @type('number') prayer: number = 1;
  @type('number') maxPrayer: number = 1;
  @type('number') combatLevel: number = 3;
  @type('boolean') inCombat: boolean = false;
  @type('string') lastAction: string = '';
  @type('number') lastActionTime: number = 0;
  @type(Skills) skills: Skills = new Skills();
  @type(Inventory) inventory: Inventory = new Inventory();
  @type(Equipment) equipment: Equipment = new Equipment();
}

/**
 * NPC (Non-Player Character) entity
 */
export class NPC extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('number') health: number = 1;
  @type('number') maxHealth: number = 1;
  @type('number') combatLevel: number = 1;
  @type('boolean') aggressive: boolean = false;
  @type('string') respawnTime: string = '0';
  @type([InventoryItem]) drops: ArraySchema<InventoryItem> = new ArraySchema<InventoryItem>();
}

/**
 * Loot item on ground
 */
export class LootItem extends Schema {
  @type('string') id: string = '';
  @type('string') itemId: string = '';
  @type('string') name: string = '';
  @type('number') quantity: number = 1;
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;
  @type('string') ownerId: string = ''; // Player who can pick up first
  @type('number') spawnTime: number = 0;
  @type('number') expireTime: number = 0;
}

/**
 * Main game state container
 */
export class GameState extends Schema {
  @type({ map: Player }) players: MapSchema<Player> = new MapSchema<Player>();
  @type({ map: NPC }) npcs: MapSchema<NPC> = new MapSchema<NPC>();
  @type({ map: LootItem }) loot: MapSchema<LootItem> = new MapSchema<LootItem>();
  @type('number') timestamp: number = 0;
  @type('number') tick: number = 0;
  @type('number') playerCount: number = 0;
}

/**
 * Player action message for client-server communication
 */
export interface PlayerActionMessage {
  type: string;
  targetId?: string;
  data?: any;
  timestamp: number;
}

/**
 * Combat result data
 */
export interface CombatResult {
  attackerId: string;
  defenderId: string;
  damage: number;
  hit: boolean;
  experienceGained: {
    attack?: number;
    strength?: number;
    defence?: number;
    hitpoints?: number;
  };
}

/**
 * Utility function to create a new player with default stats
 */
export function createPlayer(id: string, name: string): Player {
  const player = new Player();
  player.id = id;
  player.name = name;

  // Set default OSRS starting stats
  player.skills.hitpoints.level = 10;
  player.skills.hitpoints.experience = 1154; // Level 10 XP
  player.health = 10;
  player.maxHealth = 10;
  player.combatLevel = 3;

  return player;
}

/**
 * Utility function to create a new inventory item
 */
export function createInventoryItem(
  itemId: string,
  name: string,
  quantity: number = 1
): InventoryItem {
  const item = new InventoryItem();
  item.itemId = itemId;
  item.name = name;
  item.quantity = quantity;
  return item;
}

/**
 * Export all schema classes for use in other modules
 */
export const CleanSchemas = {
  GameState,
  Player,
  NPC,
  LootItem,
  Skills,
  Skill,
  Inventory,
  InventoryItem,
  Equipment,
  createPlayer,
  createInventoryItem,
};

// Clear registry on module unload for testing
if (typeof global !== 'undefined' && (global as any).__CLEAN_SCHEMAS_LOADED) {
  console.warn('CleanEntitySchemas already loaded, this may cause issues');
} else if (typeof global !== 'undefined') {
  (global as any).__CLEAN_SCHEMAS_LOADED = true;
}
