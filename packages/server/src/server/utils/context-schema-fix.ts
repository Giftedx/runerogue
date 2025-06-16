/**
 * Fix for Colyseus ArraySchema registration in TypeContext
 * This ensures ArraySchema and MapSchema are properly registered in the context's schema registry
 */

import { ArraySchema, MapSchema } from '@colyseus/schema';

/**
 * Register ArraySchema and MapSchema in the TypeContext schemas Map
 * This addresses the specific issue where tryEncodeTypeId calls context.getTypeId
 */
function registerSchemasInContext() {
  try {
    // We need to access the global/shared TypeContext that the encoder uses
    // In newer versions of Colyseus, this might be through a different mechanism

    // Try to get the TypeContext class
    const colyseusSchema = require('@colyseus/schema');

    // Check if we can access the TypeContext directly
    if (colyseusSchema.TypeContext) {
      const TypeContext = colyseusSchema.TypeContext;

      // Create a global context instance if it doesn't exist
      if (!TypeContext.sharedContext) {
        TypeContext.sharedContext = new TypeContext();
      }

      const context = TypeContext.sharedContext;

      // Manually register ArraySchema and MapSchema with type IDs
      if (!context.schemas.has(ArraySchema)) {
        const arrayTypeId = context.schemas.size;
        context.schemas.set(ArraySchema, arrayTypeId);
        context.types[arrayTypeId] = ArraySchema;
        console.log(`✅ ArraySchema registered with type ID ${arrayTypeId}`);
      }

      if (!context.schemas.has(MapSchema)) {
        const mapTypeId = context.schemas.size;
        context.schemas.set(MapSchema, mapTypeId);
        context.types[mapTypeId] = MapSchema;
        console.log(`✅ MapSchema registered with type ID ${mapTypeId}`);
      }

      return true;
    }

    console.warn('⚠️ TypeContext not accessible, trying alternative approach...');
    return false;
  } catch (error) {
    console.warn('⚠️ Failed to register schemas in TypeContext:', error);
    return false;
  }
}

/**
 * Alternative approach: Monkey patch the context creation
 */
function patchContextCreation() {
  try {
    const colyseusSchema = require('@colyseus/schema');

    if (colyseusSchema.TypeContext) {
      const OriginalTypeContext = colyseusSchema.TypeContext;

      // Patch the constructor to auto-register ArraySchema and MapSchema
      const originalConstructor = OriginalTypeContext.prototype.constructor;
      OriginalTypeContext.prototype.constructor = function (...args) {
        originalConstructor.apply(this, args);

        // Auto-register core schema types
        if (!this.schemas.has(ArraySchema)) {
          const arrayTypeId = this.schemas.size;
          this.schemas.set(ArraySchema, arrayTypeId);
          this.types[arrayTypeId] = ArraySchema;
        }

        if (!this.schemas.has(MapSchema)) {
          const mapTypeId = this.schemas.size;
          this.schemas.set(MapSchema, mapTypeId);
          this.types[mapTypeId] = MapSchema;
        }
      };

      console.log('✅ TypeContext constructor patched for auto-registration');
      return true;
    }

    return false;
  } catch (error) {
    console.warn('⚠️ Failed to patch TypeContext:', error);
    return false;
  }
}

/**
 * Initialize context-level schema registration
 */
export function initializeContextSchemaRegistration(): void {
  try {
    console.log('🔧 Attempting context-level schema registration...');

    const directSuccess = registerSchemasInContext();
    const patchSuccess = patchContextCreation();

    if (directSuccess || patchSuccess) {
      console.log('✅ Context-level schema registration completed');
    } else {
      console.warn('⚠️ Context-level schema registration failed');
    }
  } catch (error) {
    console.error('❌ Context-level schema registration error:', error);
  }
}

// Auto-initialize when this module is imported
initializeContextSchemaRegistration();
