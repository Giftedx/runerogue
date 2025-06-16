/**
 * Comprehensive Room-Level Metadata Fix
 * This ensures all schema classes have Symbol.metadata for Colyseus serialization
 */

// Ensure Symbol.metadata exists globally
if (!Symbol.metadata) {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Create a comprehensive metadata object for schema classes
 */
function createSchemaMetadata(): any {
  return {
    properties: {},
    indexes: {},
    schemas: {},
    definition: {},
    descriptors: {},
    type: undefined,
    fieldsByName: new Map(),
    fieldsByIndex: new Map(),
  };
}

/**
 * Apply metadata to a schema class and its prototype
 */
function ensureSchemaMetadata(SchemaClass: any): void {
  if (!SchemaClass) return;

  // Apply metadata to the constructor
  if (!SchemaClass[Symbol.metadata]) {
    SchemaClass[Symbol.metadata] = createSchemaMetadata();
  }

  // Apply metadata to the prototype
  if (SchemaClass.prototype && !SchemaClass.prototype[Symbol.metadata]) {
    SchemaClass.prototype[Symbol.metadata] = createSchemaMetadata();
  }

  // Apply metadata to instances created from this class
  const originalConstructor = SchemaClass;
  if (typeof originalConstructor === 'function') {
    const wrappedConstructor = function (...args: any[]) {
      const instance = new originalConstructor(...args);
      if (instance && !instance[Symbol.metadata]) {
        instance[Symbol.metadata] = createSchemaMetadata();
      }
      return instance;
    };

    // Copy properties from original constructor
    Object.setPrototypeOf(wrappedConstructor, originalConstructor);
    Object.defineProperty(wrappedConstructor, 'name', { value: originalConstructor.name });
    wrappedConstructor.prototype = originalConstructor.prototype;
  }
}

/**
 * Apply metadata fix to all Colyseus schema classes
 */
export function applyRoomLevelMetadataFix(): void {
  try {
    // Import all schema classes
    const schemaModule = require('../game/EntitySchemas');

    // List of all schema classes that need metadata
    const schemaClasses = [
      'WorldState',
      'GameState',
      'Player',
      'NPC',
      'InventoryItem',
      'Trade',
      'LootDrop',
      'AreaMap',
      'Resource',
    ];

    console.log('🔧 Applying room-level metadata fix to schema classes...');

    schemaClasses.forEach(className => {
      const SchemaClass = schemaModule[className];
      if (SchemaClass) {
        ensureSchemaMetadata(SchemaClass);
        console.log(`✅ Applied metadata fix to ${className}`);
      } else {
        console.warn(`⚠️ Schema class ${className} not found`);
      }
    });

    // Also ensure ArraySchema and MapSchema have metadata
    const colyseusSchema = require('@colyseus/schema');
    if (colyseusSchema.ArraySchema) {
      ensureSchemaMetadata(colyseusSchema.ArraySchema);
      console.log('✅ Applied metadata fix to ArraySchema');
    }
    if (colyseusSchema.MapSchema) {
      ensureSchemaMetadata(colyseusSchema.MapSchema);
      console.log('✅ Applied metadata fix to MapSchema');
    }
    if (colyseusSchema.Schema) {
      ensureSchemaMetadata(colyseusSchema.Schema);
      console.log('✅ Applied metadata fix to Schema');
    }

    console.log('🎯 Room-level metadata fix applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply room-level metadata fix:', error);
  }
}

/**
 * Patch instance metadata before serialization
 */
export function ensureInstanceMetadata(instance: any): void {
  if (!instance || typeof instance !== 'object') return;

  // Apply metadata to the instance
  if (!instance[Symbol.metadata]) {
    instance[Symbol.metadata] = createSchemaMetadata();
  }

  // Apply metadata to the constructor if it exists
  if (instance.constructor && !instance.constructor[Symbol.metadata]) {
    instance.constructor[Symbol.metadata] = createSchemaMetadata();
  }

  // Recursively apply to nested objects
  Object.values(instance).forEach(value => {
    if (value && typeof value === 'object') {
      ensureInstanceMetadata(value);
    }
  });
}

// Apply the fix immediately when this module is imported
applyRoomLevelMetadataFix();

export const roomLevelMetadataFixApplied = true;
