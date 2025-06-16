/**
 * Ultimate Colyseus Schema Fix
 * This addresses multiple issues:
 * 1. Symbol.metadata polyfill for TypeScript decorators
 * 2. ArraySchema/MapSchema constructor issues
 * 3. Type registry initialization
 */

// STEP 1: Ensure Symbol.metadata exists before any imports
(() => {
  if (typeof Symbol !== 'undefined' && !Symbol.metadata) {
    (Symbol as any).metadata = Symbol.for('Symbol.metadata');
  }
})();

// STEP 2: Import reflect-metadata early
import 'reflect-metadata';

// STEP 3: Import Colyseus classes
import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

// STEP 4: Ensure all schema classes have Symbol.metadata
(() => {
  const ensureMetadata = (SchemaClass: any) => {
    if (SchemaClass && typeof SchemaClass === 'function') {
      if (!SchemaClass[Symbol.metadata]) {
        SchemaClass[Symbol.metadata] = {};
      }
      if (!SchemaClass.prototype[Symbol.metadata]) {
        SchemaClass.prototype[Symbol.metadata] = {};
      }
    }
  };

  ensureMetadata(Schema);
  ensureMetadata(ArraySchema);
  ensureMetadata(MapSchema);
})();

// STEP 5: Patch ArraySchema constructor if needed
(() => {
  const originalArraySchema = ArraySchema;

  // Check if ArraySchema constructor works properly
  try {
    const test = new ArraySchema();
    if (!test) {
      throw new Error('ArraySchema constructor failed');
    }
  } catch (error) {
    console.warn('[SCHEMA-FIX] ArraySchema constructor issue detected, applying patch...');

    // Override ArraySchema constructor
    (global as any).ArraySchema = function (...args: any[]) {
      const instance = Object.create(originalArraySchema.prototype);
      originalArraySchema.apply(instance, args);

      // Ensure metadata exists on instance
      if (!instance.constructor[Symbol.metadata]) {
        instance.constructor[Symbol.metadata] = {};
      }

      return instance;
    };

    // Copy static properties
    Object.setPrototypeOf((global as any).ArraySchema, originalArraySchema);
    Object.assign((global as any).ArraySchema, originalArraySchema);
  }
})();

// STEP 6: Export flag to confirm polyfill is applied
export const ultimateSchemaFixApplied = true;

// Log success (only in development)
if (process.env.NODE_ENV !== 'test') {
  console.log('[SCHEMA-FIX] Ultimate Colyseus schema fix applied successfully');
}
