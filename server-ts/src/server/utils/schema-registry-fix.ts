/**
 * Schema Registry Fix for Colyseus v0.16.x + @colyseus/schema v3.x
 *
 * This file addresses ArraySchema registration issues in newer Colyseus versions.
 * The problem occurs when @colyseus/schema v3.x tries to serialize ArraySchema
 * instances but they're not properly registered in the TypeRegistry.
 */

import { ArraySchema, Context, MapSchema } from '@colyseus/schema';

/**
 * Initialize and register core schema types in TypeRegistry
 * This must be called before any schema classes are instantiated or used
 */
export function initializeSchemaRegistry(): void {
  try {
    // Access the global Context and its type registry
    const context = Context;

    // Check if we can access the internal type registry
    if ((context as any).typeRegistry) {
      const typeRegistry = (context as any).typeRegistry;

      console.log('🔧 Schema Registry Debug Info:');
      console.log('  - TypeRegistry exists:', !!typeRegistry);
      console.log('  - TypeRegistry size:', typeRegistry.size || 0);
      console.log('  - ArraySchema in registry:', typeRegistry.has?.(ArraySchema) || false);
      console.log('  - MapSchema in registry:', typeRegistry.has?.(MapSchema) || false);

      // Attempt to manually register core types if not present
      if (typeRegistry.set && !typeRegistry.has(ArraySchema)) {
        const arraySchemaId = typeRegistry.size;
        typeRegistry.set(ArraySchema, arraySchemaId);
        console.log(`✅ Manually registered ArraySchema with ID: ${arraySchemaId}`);
      }

      if (typeRegistry.set && !typeRegistry.has(MapSchema)) {
        const mapSchemaId = typeRegistry.size;
        typeRegistry.set(MapSchema, mapSchemaId);
        console.log(`✅ Manually registered MapSchema with ID: ${mapSchemaId}`);
      }
    }

    // Alternative approach: Try to force-register via Context
    if ((Context as any).create) {
      // Some versions use Context.create() for registration
      try {
        (Context as any).create(ArraySchema);
        (Context as any).create(MapSchema);
        console.log('✅ Used Context.create() for schema registration');
      } catch (e) {
        console.log('ℹ️ Context.create() not available or failed:', (e as Error).message);
      }
    }
  } catch (error) {
    console.warn('⚠️ Schema registry initialization failed:', error);
    console.warn('This may cause ArraySchema/MapSchema warnings during serialization');
  }
}

/**
 * Alternative approach using defineTypes if available
 * This is the newer approach in @colyseus/schema v3.x
 */
export function tryDefineTypesApproach(): void {
  try {
    // Import defineTypes if available
    const { defineTypes } = require('@colyseus/schema');

    if (defineTypes) {
      // Register core schema types using defineTypes
      defineTypes('ArraySchema', ArraySchema);
      defineTypes('MapSchema', MapSchema);
      console.log('✅ Used defineTypes() for schema registration');
    }
  } catch (error) {
    console.log('ℹ️ defineTypes approach not available:', (error as Error).message);
  }
}

// Auto-initialize when this module is imported
initializeSchemaRegistry();
tryDefineTypesApproach();
