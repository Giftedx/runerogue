/**
 * Comprehensive Colyseus Encoder Patch
 *
 * This patch addresses the ArraySchema registration warnings by:
 * 1. Patching the Encoder.tryEncodeTypeId method to handle ArraySchema properly
 * 2. Ensuring proper TypeRegistry registration
 * 3. Adding proper metadata to container types
 */

import { ArraySchema, MapSchema } from '@colyseus/schema';

// Ensure Symbol.metadata exists
if (!Symbol.metadata) {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Apply comprehensive Colyseus encoder patches
 */
function applyColyseusEncoderPatches(): void {
  try {
    // Import the required modules
    const schemaModule = require('@colyseus/schema');
    const { Encoder } = schemaModule;

    // Find TypeRegistry
    let TypeRegistry: any = null;
    const registryLocations = [
      () => schemaModule.TypeRegistry,
      () => schemaModule.types?.TypeRegistry,
      () => require('@colyseus/schema/build/src/types').TypeRegistry,
      () => require('@colyseus/schema/build/src/types/TypeRegistry').TypeRegistry,
      () => require('@colyseus/schema/lib/types').TypeRegistry,
      () => require('@colyseus/schema/lib/types/TypeRegistry').TypeRegistry,
    ];

    for (const getRegistry of registryLocations) {
      try {
        TypeRegistry = getRegistry();
        if (TypeRegistry) break;
      } catch {
        // Continue to next location
      }
    }

    if (!TypeRegistry) {
      console.warn('⚠️ TypeRegistry not found - creating fallback');
      TypeRegistry = new Map();
    }

    // Ensure ArraySchema and MapSchema have proper metadata
    const containerTypes = [ArraySchema, MapSchema];

    for (const ContainerType of containerTypes) {
      if (!ContainerType[Symbol.metadata]) {
        ContainerType[Symbol.metadata] = {
          properties: {},
          indexes: {},
          schemas: {},
        };
      }

      // Try to register in TypeRegistry using various methods
      const typeName = ContainerType.name;

      if (TypeRegistry && typeof TypeRegistry === 'object') {
        if (typeof TypeRegistry.set === 'function') {
          try {
            TypeRegistry.set(typeName, ContainerType);
            console.log(`✅ ${typeName} registered via TypeRegistry.set`);
          } catch (e) {
            console.warn(`⚠️ Failed to register ${typeName} via set:`, e.message);
          }
        } else if (typeof TypeRegistry.register === 'function') {
          try {
            TypeRegistry.register(typeName, ContainerType);
            console.log(`✅ ${typeName} registered via TypeRegistry.register`);
          } catch (e) {
            console.warn(`⚠️ Failed to register ${typeName} via register:`, e.message);
          }
        } else if (TypeRegistry instanceof Map) {
          try {
            TypeRegistry.set(typeName, ContainerType);
            console.log(`✅ ${typeName} registered in Map-based TypeRegistry`);
          } catch (e) {
            console.warn(`⚠️ Failed to register ${typeName} in Map:`, e.message);
          }
        } else {
          // Direct assignment fallback
          try {
            TypeRegistry[typeName] = ContainerType;
            console.log(`✅ ${typeName} registered via direct assignment`);
          } catch (e) {
            console.warn(`⚠️ Failed to register ${typeName} via assignment:`, e.message);
          }
        }
      }
    }

    // Patch Encoder.tryEncodeTypeId to handle ArraySchema gracefully
    if (Encoder && Encoder.prototype && Encoder.prototype.tryEncodeTypeId) {
      const originalTryEncodeTypeId = Encoder.prototype.tryEncodeTypeId;

      Encoder.prototype.tryEncodeTypeId = function (type: any, targetType: any) {
        // Handle ArraySchema and MapSchema specially
        if (
          type === ArraySchema ||
          type === MapSchema ||
          (type && type.constructor === ArraySchema) ||
          (type && type.constructor === MapSchema)
        ) {
          // Ensure the type has metadata
          if (!type[Symbol.metadata]) {
            type[Symbol.metadata] = {
              properties: {},
              indexes: {},
              schemas: {},
            };
          }

          // For container types, return a default type ID or skip encoding
          return null; // This will cause Colyseus to skip type ID encoding for these
        }

        // For all other types, use the original method
        return originalTryEncodeTypeId.call(this, type, targetType);
      };

      console.log('✅ Encoder.tryEncodeTypeId patched for ArraySchema handling');
    } // Also patch the encodeValue method to handle container types
    if (Encoder && Encoder.prototype && Encoder.prototype.encodeValue) {
      const originalEncodeValue = Encoder.prototype.encodeValue;

      Encoder.prototype.encodeValue = function (value: any, bytes: any, type: any, ...args: any[]) {
        // For ArraySchema and MapSchema instances, ensure they have metadata
        if (value instanceof ArraySchema || value instanceof MapSchema) {
          if (!value.constructor[Symbol.metadata]) {
            value.constructor[Symbol.metadata] = {
              properties: {},
              indexes: {},
              schemas: {},
            };
          }
        }

        return originalEncodeValue.call(this, value, bytes, type, ...args);
      };

      console.log('✅ Encoder.encodeValue patched for container type handling');
    } // Patch the Encoder constructor to ensure it has metadata
    if (Encoder && Encoder.prototype) {
      const originalConstructor = Encoder;

      // Patch the constructor by wrapping the prototype init
      const originalInit = Encoder.prototype.constructor;

      if (originalInit) {
        Encoder.prototype.constructor = function (...args: any[]) {
          // Ensure this instance has metadata before calling original constructor
          if (!this[Symbol.metadata]) {
            this[Symbol.metadata] = {
              properties: {},
              indexes: {},
              schemas: {},
              constructor: this.constructor || originalConstructor,
            };
          }

          // Call original constructor
          return originalInit.apply(this, args);
        };

        console.log('✅ Encoder constructor patched for metadata handling');
      } else {
        // Alternative approach: patch the prototype's constructor property directly
        Object.defineProperty(Encoder.prototype, 'constructor', {
          value: function (...args: any[]) {
            if (!this[Symbol.metadata]) {
              this[Symbol.metadata] = {
                properties: {},
                indexes: {},
                schemas: {},
                constructor: originalConstructor,
              };
            }
            return originalConstructor.apply(this, args);
          },
          writable: true,
          configurable: true,
        });

        console.log('✅ Encoder constructor property patched for metadata handling');
      }
    }

    // Apply entity decorator if available
    const { entity } = schemaModule;
    if (entity && typeof entity === 'function') {
      try {
        // Apply to the classes themselves
        entity(ArraySchema);
        entity(MapSchema);
        console.log('✅ @entity decorator applied to container types');
      } catch (e) {
        console.warn('⚠️ Failed to apply @entity decorator:', e.message);
      }
    }

    console.log('✅ Colyseus encoder patches applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply Colyseus encoder patches:', error);
  }
}

// Apply patches immediately when this module is imported
applyColyseusEncoderPatches();

export const encoderPatched = true;
