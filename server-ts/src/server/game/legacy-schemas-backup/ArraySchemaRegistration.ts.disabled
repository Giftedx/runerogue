/**
 * Proper ArraySchema registration for Colyseus v0.16.x.
 * This addresses: "Class 'ArraySchema' is not registered on TypeRegistry"
 */

import { ArraySchema, Context } from '@colyseus/schema';
import '../utils/early-metadata-init';

/**
 * Register ArraySchema in the TypeRegistry to fix schema encoding issues.
 */
export function registerArraySchemaInTypeRegistry() {
  try {
    // In Colyseus v0.16.x, Context.typeRegistry is the global type registry
    const typeRegistry = (Context as any).typeRegistry;

    if (typeRegistry && typeof typeRegistry.set === 'function') {
      // Check if ArraySchema is already registered
      if (!typeRegistry.has(ArraySchema)) {
        // Register ArraySchema with a unique type ID
        const typeId = typeRegistry.size; // Use the current size as the type ID
        typeRegistry.set(ArraySchema, typeId);

        // Also register by name for reverse lookup
        if (typeRegistry.types) {
          typeRegistry.types[typeId] = ArraySchema;
        }

        console.log(`✅ ArraySchema registered with typeId: ${typeId}`);
      } else {
        console.log('✅ ArraySchema already registered in TypeRegistry');
      }
    } else {
      console.warn('⚠️ TypeRegistry not found or invalid');
    }
  } catch (error) {
    console.warn('⚠️ ArraySchema registration failed:', error);
  }
}

// Alternative approach: Use Colyseus internal registration mechanism
export function forceArraySchemaRegistration() {
  try {
    // Import internal registration function if available
    const colyseusInternal = require('@colyseus/schema/build/types');
    if (colyseusInternal && colyseusInternal.registerType) {
      colyseusInternal.registerType(ArraySchema);
      console.log('✅ ArraySchema registered via internal mechanism');
    }
  } catch (error) {
    // Silent fail for fallback approach
  }
}

// Execute both registration strategies
registerArraySchemaInTypeRegistry();
forceArraySchemaRegistration();

export { ArraySchema };
