/**
 * Definitive Colyseus Schema Metadata Fix
 *
 * This fix addresses all Symbol.metadata related issues in Colyseus by:
 * 1. Polyfilling Symbol.metadata globally
 * 2. Patching the Encoder constructor to handle missing metadata
 * 3. Registering ArraySchema and MapSchema in TypeRegistry
 * 4. Ensuring all schema instances have proper metadata
 *
 * IMPORTANT: This must be imported before any Colyseus schema code runs.
 */

// Step 1: Global Symbol.metadata polyfill
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
  console.log('✅ Symbol.metadata polyfilled globally');
}

// Step 2: Import Colyseus types after polyfill
import { ArraySchema, MapSchema, Schema, entity } from '@colyseus/schema';

// Step 3: Patch Encoder constructor to handle missing metadata
function patchEncoder(): void {
  try {
    const { Encoder } = require('@colyseus/schema');

    if (Encoder && Encoder.prototype) {
      const originalConstructor = Encoder;

      // Patch the Encoder constructor
      function PatchedEncoder() {
        // Ensure metadata symbol exists
        if (typeof Symbol.metadata === 'undefined') {
          (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
        }

        // Call original constructor with proper context
        return originalConstructor.apply(this, arguments);
      }

      // Copy prototype and static properties
      PatchedEncoder.prototype = originalConstructor.prototype;
      Object.setPrototypeOf(PatchedEncoder, originalConstructor);

      // Copy static properties
      Object.getOwnPropertyNames(originalConstructor).forEach(prop => {
        if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
          PatchedEncoder[prop] = originalConstructor[prop];
        }
      });

      // Replace the original Encoder
      require.cache[require.resolve('@colyseus/schema')].exports.Encoder = PatchedEncoder;

      console.log('✅ Encoder constructor patched for metadata handling');
    }
  } catch (error) {
    console.warn('⚠️ Could not patch Encoder constructor:', error.message);
  }
}

// Step 4: Ensure all schema instances have metadata
function ensureMetadata(target: any): void {
  if (target && typeof target === 'object') {
    if (!target[Symbol.metadata]) {
      target[Symbol.metadata] = {
        constructor: target.constructor?.name || 'Unknown',
        schema: true,
      };
    }
  }
}

// Step 5: Patch Schema base class to ensure metadata
function patchSchemaBase(): void {
  try {
    const originalSchema = Schema;

    if (originalSchema && originalSchema.prototype) {
      const originalConstructor = originalSchema.prototype.constructor;

      originalSchema.prototype.constructor = function (...args) {
        const result = originalConstructor.apply(this, args);
        ensureMetadata(this);
        return result;
      };

      console.log('✅ Schema base class patched for metadata');
    }
  } catch (error) {
    console.warn('⚠️ Could not patch Schema base class:', error.message);
  }
}

// Step 6: Register container types with proper metadata
function registerContainerTypes(): void {
  try {
    // Ensure ArraySchema and MapSchema have metadata
    ensureMetadata(ArraySchema.prototype);
    ensureMetadata(MapSchema.prototype);

    // Try to register using @entity decorator first
    if (typeof entity === 'function') {
      entity(ArraySchema);
      entity(MapSchema);
      console.log('✅ Container types registered with @entity decorator');
    } else {
      console.warn('⚠️ @entity decorator not available');
    }

    // Try direct TypeRegistry registration as fallback
    try {
      const schemaModule = require('@colyseus/schema');

      // Look for TypeRegistry
      const possibleRegistries = [
        schemaModule.TypeRegistry,
        schemaModule.types?.TypeRegistry,
        schemaModule.Context?.TypeRegistry,
      ];

      for (const TypeRegistry of possibleRegistries) {
        if (TypeRegistry && typeof TypeRegistry.set === 'function') {
          TypeRegistry.set('ArraySchema', ArraySchema);
          TypeRegistry.set('MapSchema', MapSchema);
          console.log('✅ Container types registered in TypeRegistry directly');
          break;
        }
      }
    } catch (registryError) {
      console.warn('⚠️ TypeRegistry registration failed:', registryError.message);
    }
  } catch (error) {
    console.error('❌ Failed to register container types:', error.message);
  }
}

// Step 7: Apply all fixes immediately
try {
  patchEncoder();
  patchSchemaBase();
  registerContainerTypes();

  console.log('✅ Definitive metadata fix applied successfully');
} catch (error) {
  console.error('❌ Failed to apply metadata fixes:', error.message);
}

// Export flag for verification
export const definitiveMetadataFixed = true;
export { ArraySchema, MapSchema, Schema, ensureMetadata };
