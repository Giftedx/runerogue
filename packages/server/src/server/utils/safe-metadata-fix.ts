/**
 * Safe metadata fix for Colyseus Schema Symbol.metadata issues
 * This version prevents duplicate decorator application and registers ArraySchema/MapSchema
 */

import 'reflect-metadata';

// Global flag to prevent multiple applications
let metadataFixApplied = false;

// Ensure Symbol.metadata exists globally
if (!Symbol.metadata) {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Safe metadata application that only runs once
 */
export function applySafeMetadataFix(): void {
  if (metadataFixApplied) {
    return;
  }

  try {
    // Only patch if we can safely import the classes
    const { Schema, ArraySchema, MapSchema } = require('@colyseus/schema');

    // Ensure metadata exists on core classes
    if (Schema && !Schema[Symbol.metadata]) {
      Schema[Symbol.metadata] = { properties: {}, indexes: {}, schemas: {} };
    }
    if (ArraySchema && !ArraySchema[Symbol.metadata]) {
      ArraySchema[Symbol.metadata] = { properties: {}, indexes: {}, schemas: {} };
    }
    if (MapSchema && !MapSchema[Symbol.metadata]) {
      MapSchema[Symbol.metadata] = { properties: {}, indexes: {}, schemas: {} };
    }

    // Explicitly register ArraySchema and MapSchema in TypeRegistry
    try {
      const schema = require('@colyseus/schema');
      const TypeRegistry = schema.TypeRegistry || schema.types || schema.registerType;

      if (TypeRegistry && typeof TypeRegistry.set === 'function') {
        // Register ArraySchema if it has a _typeid and isn't already registered
        if (ArraySchema && ArraySchema._typeid !== undefined) {
          if (!TypeRegistry.has || !TypeRegistry.has(ArraySchema._typeid)) {
            TypeRegistry.set(ArraySchema._typeid, ArraySchema);
            // eslint-disable-next-line no-console
            console.log('✅ ArraySchema explicitly registered in TypeRegistry');
          }
        }

        // Register MapSchema if it has a _typeid and isn't already registered
        if (MapSchema && MapSchema._typeid !== undefined) {
          if (!TypeRegistry.has || !TypeRegistry.has(MapSchema._typeid)) {
            TypeRegistry.set(MapSchema._typeid, MapSchema);
            // eslint-disable-next-line no-console
            console.log('✅ MapSchema explicitly registered in TypeRegistry');
          }
        }
      } else {
        // Try alternative registration method
        if (schema.registerType && typeof schema.registerType === 'function') {
          if (ArraySchema && ArraySchema._typeid !== undefined) {
            schema.registerType(ArraySchema._typeid, ArraySchema);
            // eslint-disable-next-line no-console
            console.log('✅ ArraySchema registered via registerType');
          }
          if (MapSchema && MapSchema._typeid !== undefined) {
            schema.registerType(MapSchema._typeid, MapSchema);
            // eslint-disable-next-line no-console
            console.log('✅ MapSchema registered via registerType');
          }
        }
      }
    } catch (registryError) {
      // eslint-disable-next-line no-console
      console.warn('⚠️ Could not access TypeRegistry for registration:', registryError);
    }

    metadataFixApplied = true;
    // eslint-disable-next-line no-console
    console.log('✅ Safe metadata fix applied once');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Could not apply metadata fix:', error);
  }
}

// Apply the fix immediately if we're not in a decorator context
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  applySafeMetadataFix();
}

export { metadataFixApplied };
