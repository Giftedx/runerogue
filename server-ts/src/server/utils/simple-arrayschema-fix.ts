/**
 * Simple ArraySchema Registration Fix
 *
 * This is a minimal, targeted fix for the ArraySchema registration warning:
 * "@colyseus/schema WARNING: Class "ArraySchema" is not registered on TypeRegistry"
 *
 * Instead of complex patches, this uses the recommended @entity decorator approach.
 */

import { ArraySchema, MapSchema, entity } from '@colyseus/schema';

// Ensure Symbol.metadata exists (minimal polyfill)
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Apply @entity decorator to container types to register them in TypeRegistry
 */
function registerContainerTypes(): void {
  try {
    // Use the @entity decorator which is the official way to register types
    if (typeof entity === 'function') {
      // Apply @entity decorator to ArraySchema
      entity(ArraySchema);
      console.log('✅ ArraySchema registered with @entity decorator');

      // Apply @entity decorator to MapSchema
      entity(MapSchema);
      console.log('✅ MapSchema registered with @entity decorator');
    } else {
      console.warn('⚠️ @entity decorator not available, trying alternative registration');

      // Fallback: try to find and register directly in TypeRegistry
      try {
        const schemaModule = require('@colyseus/schema');

        // Look for TypeRegistry in common locations
        const possibleRegistries = [schemaModule.TypeRegistry, schemaModule.types?.TypeRegistry];

        for (const TypeRegistry of possibleRegistries) {
          if (TypeRegistry && typeof TypeRegistry.set === 'function') {
            TypeRegistry.set('ArraySchema', ArraySchema);
            TypeRegistry.set('MapSchema', MapSchema);
            console.log('✅ Container types registered in TypeRegistry directly');
            break;
          }
        }
      } catch (fallbackError) {
        console.warn('⚠️ Fallback registration failed:', fallbackError.message);
      }
    }
  } catch (error) {
    console.error('❌ Failed to register container types:', error.message);
  }
}

// Register immediately when this module is imported
registerContainerTypes();

export const arraySchemaFixed = true;
