/**
 * Final fix for Colyseus ArraySchema registration warnings
 *
 * The issue is that ArraySchema/MapSchema classes themselves are not decorated
 * with @entity, so Colyseus can't find them in the TypeRegistry during encoding.
 * This fix directly patches these classes with the @entity decorator.
 */

import { ArraySchema, MapSchema, entity } from '@colyseus/schema';

/**
 * Apply @entity decorator to ArraySchema and MapSchema to register them in TypeRegistry
 */
export function applyEntityDecoratorsToContainers(): void {
  try {
    // Check if entity decorator is available
    if (typeof entity !== 'function') {
      console.warn('⚠️ @entity decorator not available, skipping container registration');
      return;
    }

    // Apply @entity decorator to ArraySchema
    if (ArraySchema && !ArraySchema.hasOwnProperty('_schema')) {
      entity()(ArraySchema);
      console.log('✅ Applied @entity decorator to ArraySchema');
    }

    // Apply @entity decorator to MapSchema
    if (MapSchema && !MapSchema.hasOwnProperty('_schema')) {
      entity()(MapSchema);
      console.log('✅ Applied @entity decorator to MapSchema');
    }
  } catch (error) {
    console.error('❌ Failed to apply entity decorators to containers:', error);
  }
}

// Apply the fix immediately when this module is imported
applyEntityDecoratorsToContainers();
