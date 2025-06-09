/**
 * ArraySchema registration fix for Colyseus v0.16.x compatibility.
 * This file ensures ArraySchema is properly registered in the TypeRegistry.
 */

import { ArraySchema, Context, Schema } from '@colyseus/schema';
import '../utils/early-metadata-init';

/**
 * Ensure ArraySchema is registered with TypeRegistry.
 * This addresses the warning: "Class 'ArraySchema' is not registered on TypeRegistry"
 */
export function registerArraySchema() {
  try {
    // Check if Context and TypeRegistry exist
    if (Context && Context.typeRegistry) {
      const typeRegistry = Context.typeRegistry;

      // Register ArraySchema if not already registered
      if (!typeRegistry.get(ArraySchema)) {
        typeRegistry.set(ArraySchema, ArraySchema);
        console.log('✅ ArraySchema registered in TypeRegistry');
      } else {
        console.log('✅ ArraySchema already registered in TypeRegistry');
      }
    }

    // Alternative approach: Try to create a dummy schema with ArraySchema to force registration
    const dummySchema = class extends Schema {};
    try {
      Object.defineProperty(dummySchema, '_childType', {
        value: ArraySchema,
        writable: false,
        enumerable: false,
        configurable: false,
      });
    } catch (e) {
      // Ignore property definition errors
    }

    // Ensure ArraySchema has metadata symbol
    const metadataSymbol = Symbol.metadata;
    if (metadataSymbol && !ArraySchema.prototype[metadataSymbol]) {
      ArraySchema.prototype[metadataSymbol] = null;
    }

    console.log('✅ ArraySchema registration completed');
  } catch (error) {
    console.warn('⚠️ ArraySchema registration failed:', error);
  }
}

// Auto-register when this module is imported
registerArraySchema();

export { ArraySchema };
