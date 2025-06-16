/**
 * Colyseus Schema Compatibility Layer
 * This provides alternative schema implementations that work around Symbol.metadata issues
 */

import { MapSchema } from '@colyseus/schema';

// Create a global Symbol.metadata if it doesn't exist
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as any).metadata = Symbol.for('Symbol.metadata');
}

// Enhanced polyfill that handles Colyseus specific metadata requirements
if (typeof (globalThis as any).Symbol === 'undefined') {
  (globalThis as any).Symbol = Symbol;
}

// Ensure Symbol.metadata is available in the global scope
(globalThis as any).Symbol.metadata = Symbol.metadata || Symbol.for('Symbol.metadata');

// Create enhanced metadata support for classes
export function createSchemaMetadata(constructor: any): void {
  if (!constructor[Symbol.metadata]) {
    constructor[Symbol.metadata] = new Map();
  }
}

// Alternative schema base class that doesn't rely on decorators
export class CompatibleSchema {
  constructor() {
    // Ensure metadata exists
    const constructor = this.constructor as any;
    createSchemaMetadata(constructor);

    // Initialize schema metadata if needed
    if (!constructor[Symbol.metadata]) {
      constructor[Symbol.metadata] = new Map();
    }
  }
}

// Decorator replacement functions that work with our compatibility layer
export function compatibleType(type: any) {
  return function (target: any, propertyKey: string) {
    const constructor = target.constructor;
    createSchemaMetadata(constructor);

    if (!constructor[Symbol.metadata].has('schema')) {
      constructor[Symbol.metadata].set('schema', new Map());
    }

    const schema = constructor[Symbol.metadata].get('schema');
    schema.set(propertyKey, { type });
  };
}

export function compatibleSchema(target: any) {
  createSchemaMetadata(target);
  return target;
}

// Enhanced inventory item that works with compatibility layer
@compatibleSchema
export class CompatibleInventoryItem extends CompatibleSchema {
  @compatibleType('string')
  itemId: string = '';

  @compatibleType('string')
  name: string = '';

  @compatibleType('string')
  description: string = '';

  @compatibleType('number')
  quantity: number = 0;

  constructor(itemDef?: any, quantity: number = 1) {
    super();
    if (itemDef) {
      this.itemId = itemDef.id || '';
      this.name = itemDef.name || '';
      this.description = itemDef.description || '';
      this.quantity = quantity;
    }
  }
}

// Enhanced player that works with compatibility layer
@compatibleSchema
export class CompatiblePlayer extends CompatibleSchema {
  @compatibleType('string')
  id: string = '';

  @compatibleType('string')
  username: string = '';

  @compatibleType('number')
  x: number = 0;

  @compatibleType('number')
  y: number = 0;

  @compatibleType('number')
  health: number = 100;

  @compatibleType('number')
  maxHealth: number = 100;

  @compatibleType([CompatibleInventoryItem])
  inventory: CompatibleInventoryItem[] = [];

  @compatibleType('number')
  combatLevel: number = 3;

  @compatibleType(['string'])
  activePrayers: string[] = [];

  @compatibleType('string')
  tradeId?: string;

  constructor() {
    super();
    this.inventory = [];
    this.activePrayers = [];
  }
}

// Enhanced game state that works with compatibility layer
@compatibleSchema
export class CompatibleGameState extends CompatibleSchema {
  @compatibleType({ map: CompatiblePlayer })
  players: MapSchema<CompatiblePlayer> = new MapSchema<CompatiblePlayer>();

  @compatibleType({ map: 'any' })
  lootDrops: MapSchema<any> = new MapSchema<any>();

  @compatibleType({ map: 'any' })
  npcs: MapSchema<any> = new MapSchema<any>();

  @compatibleType({ map: 'any' })
  trades: MapSchema<any> = new MapSchema<any>();

  constructor() {
    super();
    this.players = new MapSchema<CompatiblePlayer>();
    this.lootDrops = new MapSchema<any>();
    this.npcs = new MapSchema<any>();
    this.trades = new MapSchema<any>();
  }
}
