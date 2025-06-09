/**
 * Ultimate fix for Colyseus ArraySchema registration warnings
 *
 * The core issue is that ArraySchema is not a Schema class that extends Schema,
 * so it's not automatically added to the TypeContext during discovery.
 * We need to patch the TypeContext.getTypeId method to handle container types.
 */

import { ArraySchema, MapSchema } from '@colyseus/schema';

/**
 * Apply the ultimate fix for ArraySchema registration warnings
 */
export function applyUltimateColyseusContainerFix(): void {
  try {
    // Get the TypeContext class from a known path
    const schemaModule = require('@colyseus/schema');
    const TypeContextModule = require('@colyseus/schema/src/types/TypeContext');
    const TypeContext = TypeContextModule.TypeContext;

    if (!TypeContext) {
      console.warn('⚠️ Could not find TypeContext class');
      return;
    }

    // Store the original getTypeId method
    const originalGetTypeId = TypeContext.prototype.getTypeId;

    // Patch getTypeId to handle container types
    TypeContext.prototype.getTypeId = function (klass: any): number | undefined {
      // First try the original method
      const typeId = originalGetTypeId.call(this, klass);
      if (typeId !== undefined) {
        return typeId;
      }

      // Handle ArraySchema specifically
      if (klass === ArraySchema || klass.name === 'ArraySchema') {
        // Check if we already have a type ID for ArraySchema
        if (!this.schemas.has(ArraySchema)) {
          // Add ArraySchema to the context
          const arrayTypeId = this.schemas.size;
          this.types[arrayTypeId] = ArraySchema;
          this.schemas.set(ArraySchema, arrayTypeId);
          console.log(`🔧 Dynamically registered ArraySchema with type ID ${arrayTypeId}`);
        }
        return this.schemas.get(ArraySchema);
      }

      // Handle MapSchema specifically
      if (klass === MapSchema || klass.name === 'MapSchema') {
        // Check if we already have a type ID for MapSchema
        if (!this.schemas.has(MapSchema)) {
          // Add MapSchema to the context
          const mapTypeId = this.schemas.size;
          this.types[mapTypeId] = MapSchema;
          this.schemas.set(MapSchema, mapTypeId);
          console.log(`🔧 Dynamically registered MapSchema with type ID ${mapTypeId}`);
        }
        return this.schemas.get(MapSchema);
      }

      // Return undefined for unknown types (original behavior)
      return undefined;
    };

    console.log('🎯 Applied ultimate Colyseus container fix - TypeContext.getTypeId patched');
  } catch (error) {
    console.error('❌ Failed to apply ultimate Colyseus container fix:', error);
  }
}

// Auto-apply the fix when this module is imported
applyUltimateColyseusContainerFix();
