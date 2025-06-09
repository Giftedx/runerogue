/**
 * Definitive fix for Colyseus ArraySchema and MapSchema registration warnings
 *
 * The issue is that Colyseus registers ArraySchema as "array" and MapSchema as "map"
 * in the TypeRegistry, but during encoding, it looks for the class name "ArraySchema"
 * and "MapSchema" which don't exist in the registry.
 *
 * This fix registers the classes with their actual class names in addition to the
 * existing registrations.
 */

import { ArraySchema, getIdentifier, MapSchema, registerType } from '@colyseus/schema';

/**
 * Initialize the definitive Colyseus schema fix
 * This must be called before any schema operations
 */
export function initializeColyseusDefinitiveFix(): void {
  try {
    // Check if ArraySchema is already registered by class name
    const arrayIdentifier = getIdentifier(ArraySchema);
    if (!arrayIdentifier || arrayIdentifier !== 'ArraySchema') {
      // Register ArraySchema with its class name
      registerType('ArraySchema', {
        constructor: ArraySchema,
        // ArraySchema has built-in encode/decode, so we don't override
      });
      console.log('✅ Registered ArraySchema with class name');
    }

    // Check if MapSchema is already registered by class name
    const mapIdentifier = getIdentifier(MapSchema);
    if (!mapIdentifier || mapIdentifier !== 'MapSchema') {
      // Register MapSchema with its class name
      registerType('MapSchema', {
        constructor: MapSchema,
        // MapSchema has built-in encode/decode, so we don't override
      });
      console.log('✅ Registered MapSchema with class name');
    }

    // Also ensure the classes have Symbol.metadata if needed
    if (!ArraySchema.prototype[Symbol.metadata] && typeof Symbol.metadata !== 'undefined') {
      ArraySchema.prototype[Symbol.metadata] = {};
    }

    if (!MapSchema.prototype[Symbol.metadata] && typeof Symbol.metadata !== 'undefined') {
      MapSchema.prototype[Symbol.metadata] = {};
    }

    console.log('🎯 Colyseus definitive fix applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply Colyseus definitive fix:', error);
  }
}

// Auto-initialize when this module is imported
initializeColyseusDefinitiveFix();
