/**
 * Fix for Colyseus schema registration issues
 * This ensures ArraySchema and MapSchema are properly registered in the type registry
 */

import { ArraySchema, MapSchema, registerType } from '@colyseus/schema';

/**
 * Register ArraySchema and MapSchema using the proper registerType function
 */
function registerSchemaTypes() {
  try {
    // Register ArraySchema with the type registry
    registerType('ArraySchema', {
      constructor: ArraySchema,
      // ArraySchema has built-in encode/decode via symbols, so we don't override them
    });

    // Register MapSchema with the type registry
    registerType('MapSchema', {
      constructor: MapSchema,
      // MapSchema has built-in encode/decode via symbols, so we don't override them
    });

    console.log('✅ ArraySchema and MapSchema registered in type registry');
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to register ArraySchema/MapSchema:', error);
    return false;
  }
}

/**
 * Initialize schema types - call this before any other schema operations
 */
export function initializeSchemaTypes(): void {
  try {
    // Register the core schema types
    const success = registerSchemaTypes();

    if (success) {
      console.log('✅ Schema types initialized successfully');
    } else {
      console.warn('⚠️ Schema type registration may have failed');
    }
  } catch (error) {
    console.error('❌ Failed to initialize schema types:', error);
  }
}

// Auto-initialize when this module is imported
initializeSchemaTypes();
