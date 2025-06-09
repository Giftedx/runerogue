// Comprehensive Colyseus Schema Serialization Fix
// This fixes Symbol.metadata issues, ArraySchema registration, and encode() method problems

// Import and polyfill Symbol.metadata if needed
import 'reflect-metadata';

// Ensure Symbol.metadata exists
if (!Symbol.metadata) {
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

// Import Colyseus Schema classes
import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

// Polyfill for Schema instances that don't have encode method
const originalSchemaConstruct = Schema;
function patchSchemaEncode() {
  if (!Schema.prototype.encode) {
    Schema.prototype.encode = function () {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      return encoder.encode(this, {}, false);
    };
  }
}

// Polyfill for ArraySchema instances
function patchArraySchemaEncode() {
  if (!ArraySchema.prototype.encode) {
    ArraySchema.prototype.encode = function () {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      return encoder.encode(this, {}, false);
    };
  }
}

// Polyfill for MapSchema instances
function patchMapSchemaEncode() {
  if (!MapSchema.prototype.encode) {
    MapSchema.prototype.encode = function () {
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder();
      return encoder.encode(this, {}, false);
    };
  }
}

// Global metadata registry for schema classes
const schemaMetadataRegistry = new WeakMap();

// Enhanced Schema constructor wrapper
function createSchemaWithMetadata<T extends Schema>(SchemaClass: new () => T): new () => T {
  return class extends SchemaClass {
    constructor() {
      super();

      // Ensure constructor metadata
      if (!this.constructor[Symbol.metadata]) {
        this.constructor[Symbol.metadata] = {};
      }

      // Ensure instance metadata
      if (!this[Symbol.metadata]) {
        this[Symbol.metadata] = {};
      }

      // Store in registry
      schemaMetadataRegistry.set(this, this.constructor[Symbol.metadata]);
    }
  };
}

// Apply all patches
export function applyComprehensiveSchemaFixes() {
  try {
    // Apply encode method patches
    patchSchemaEncode();
    patchArraySchemaEncode();
    patchMapSchemaEncode();

    console.log('✅ Applied comprehensive Colyseus schema serialization fixes');
    console.log('  - Symbol.metadata polyfill');
    console.log('  - Schema.prototype.encode patch');
    console.log('  - ArraySchema.prototype.encode patch');
    console.log('  - MapSchema.prototype.encode patch');

    return true;
  } catch (error) {
    console.error('❌ Failed to apply comprehensive schema fixes:', error);
    return false;
  }
}

// Decorator for ensuring schema classes have proper metadata
export function schemaClass<T extends new (...args: any[]) => Schema>(constructor: T): T {
  // Ensure constructor has metadata
  if (!constructor[Symbol.metadata]) {
    constructor[Symbol.metadata] = {};
  }

  // Ensure prototype has metadata
  if (!constructor.prototype[Symbol.metadata]) {
    constructor.prototype[Symbol.metadata] = {};
  }

  return constructor;
}

// Helper to register ArraySchema types properly
export function registerArraySchemaType(SchemaClass: any, propertyName: string, ItemType: any) {
  try {
    if (!SchemaClass[Symbol.metadata]) {
      SchemaClass[Symbol.metadata] = {};
    }

    if (!SchemaClass[Symbol.metadata][propertyName]) {
      SchemaClass[Symbol.metadata][propertyName] = {
        type: 'array',
        itemType: ItemType,
      };
    }

    console.log(`✅ Registered ArraySchema type for ${SchemaClass.name}.${propertyName}`);
  } catch (error) {
    console.error(
      `❌ Failed to register ArraySchema type for ${SchemaClass.name}.${propertyName}:`,
      error
    );
  }
}

// Helper to register MapSchema types properly
export function registerMapSchemaType(SchemaClass: any, propertyName: string, ItemType: any) {
  try {
    if (!SchemaClass[Symbol.metadata]) {
      SchemaClass[Symbol.metadata] = {};
    }

    if (!SchemaClass[Symbol.metadata][propertyName]) {
      SchemaClass[Symbol.metadata][propertyName] = {
        type: 'map',
        itemType: ItemType,
      };
    }

    console.log(`✅ Registered MapSchema type for ${SchemaClass.name}.${propertyName}`);
  } catch (error) {
    console.error(
      `❌ Failed to register MapSchema type for ${SchemaClass.name}.${propertyName}:`,
      error
    );
  }
}

export { createSchemaWithMetadata, schemaMetadataRegistry };
