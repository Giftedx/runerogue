/**
 * Definitive fix for Colyseus ArraySchema/MapSchema registration warnings
 *
 * The issue: Colyseus shows warning "Class 'ArraySchema' is not registered on TypeRegistry"
 * Root cause: ArraySchema and MapSchema are container types that need to be registered
 * Solution: Register them directly in the TypeRegistry before they're used
 */

import { ArraySchema, MapSchema } from '@colyseus/schema';

// Ensure Symbol.metadata exists globally first
if (!Symbol.metadata) {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Register ArraySchema and MapSchema in Colyseus TypeRegistry
 */
function registerContainerTypes(): void {
  try {
    // Import the TypeRegistry from Colyseus
    const schemaModule = require('@colyseus/schema');

    // Find the TypeRegistry (may be in different locations depending on version)
    let TypeRegistry;

    if (schemaModule.TypeRegistry) {
      TypeRegistry = schemaModule.TypeRegistry;
    } else if (schemaModule.types?.TypeRegistry) {
      TypeRegistry = schemaModule.types.TypeRegistry;
    } else {
      // Try to get it from the build directory
      try {
        const typesModule = require('@colyseus/schema/build/src/types');
        TypeRegistry = typesModule.TypeRegistry;
      } catch {
        // Try another common location
        try {
          const typeRegistryModule = require('@colyseus/schema/build/src/types/TypeRegistry');
          TypeRegistry = typeRegistryModule.TypeRegistry;
        } catch {
          console.warn('⚠️ Could not find TypeRegistry to register ArraySchema/MapSchema');
          return;
        }
      }
    }

    if (!TypeRegistry) {
      console.warn('⚠️ TypeRegistry not found - cannot register container types');
      return;
    }

    // Ensure ArraySchema has metadata
    if (!ArraySchema[Symbol.metadata]) {
      ArraySchema[Symbol.metadata] = {
        properties: {},
        indexes: {},
        schemas: {},
      };
    }

    // Ensure MapSchema has metadata
    if (!MapSchema[Symbol.metadata]) {
      MapSchema[Symbol.metadata] = {
        properties: {},
        indexes: {},
        schemas: {},
      };
    }

    // Register ArraySchema in the TypeRegistry
    if (TypeRegistry.register && typeof TypeRegistry.register === 'function') {
      try {
        TypeRegistry.register('ArraySchema', ArraySchema);
        console.log('✅ ArraySchema registered in TypeRegistry');
      } catch (error) {
        console.warn('⚠️ Failed to register ArraySchema:', error.message);
      }

      try {
        TypeRegistry.register('MapSchema', MapSchema);
        console.log('✅ MapSchema registered in TypeRegistry');
      } catch (error) {
        console.warn('⚠️ Failed to register MapSchema:', error.message);
      }
    } else if (TypeRegistry.add && typeof TypeRegistry.add === 'function') {
      // Alternative method name
      try {
        TypeRegistry.add('ArraySchema', ArraySchema);
        console.log('✅ ArraySchema added to TypeRegistry');
      } catch (error) {
        console.warn('⚠️ Failed to add ArraySchema:', error.message);
      }

      try {
        TypeRegistry.add('MapSchema', MapSchema);
        console.log('✅ MapSchema added to TypeRegistry');
      } catch (error) {
        console.warn('⚠️ Failed to add MapSchema:', error.message);
      }
    } else if (TypeRegistry.set && typeof TypeRegistry.set === 'function') {
      // Another alternative method
      try {
        TypeRegistry.set('ArraySchema', ArraySchema);
        console.log('✅ ArraySchema set in TypeRegistry');
      } catch (error) {
        console.warn('⚠️ Failed to set ArraySchema:', error.message);
      }

      try {
        TypeRegistry.set('MapSchema', MapSchema);
        console.log('✅ MapSchema set in TypeRegistry');
      } catch (error) {
        console.warn('⚠️ Failed to set MapSchema:', error.message);
      }
    } else if (typeof TypeRegistry === 'object') {
      // Direct property assignment as fallback
      try {
        TypeRegistry['ArraySchema'] = ArraySchema;
        TypeRegistry['MapSchema'] = MapSchema;
        console.log('✅ ArraySchema/MapSchema assigned directly to TypeRegistry');
      } catch (error) {
        console.warn('⚠️ Failed to assign to TypeRegistry:', error.message);
      }
    } else {
      console.warn('⚠️ Unknown TypeRegistry interface - cannot register container types');
    }
  } catch (error) {
    console.error('❌ Failed to register container types in TypeRegistry:', error);
  }
}

/**
 * Apply entity decorator to ArraySchema and MapSchema as alternative approach
 */
function applyEntityDecorators(): void {
  try {
    // Get the entity decorator
    const schemaModule = require('@colyseus/schema');
    const entity = schemaModule.entity;

    if (entity && typeof entity === 'function') {
      // Apply @entity decorator to ArraySchema
      entity(ArraySchema);
      console.log('✅ @entity decorator applied to ArraySchema');

      // Apply @entity decorator to MapSchema
      entity(MapSchema);
      console.log('✅ @entity decorator applied to MapSchema');
    } else {
      console.warn('⚠️ @entity decorator not found');
    }
  } catch (error) {
    console.warn('⚠️ Failed to apply @entity decorators:', error.message);
  }
}

// Apply both fixes
registerContainerTypes();
applyEntityDecorators();

export const arraySchemaRegistryFixApplied = true;
