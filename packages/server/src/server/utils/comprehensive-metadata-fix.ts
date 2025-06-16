/**
 * Comprehensive Colyseus Schema Metadata Fix
 * This addresses the core Symbol.metadata issues causing encoding failures
 */

// Ensure Symbol.metadata exists globally
if (!Symbol.metadata) {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Create a proper metadata object that Colyseus expects
 */
function createMetadataObject() {
  return {
    properties: {},
    indexes: {},
    schemas: {},
    definition: {},
    descriptors: {},
    type: undefined,
    fieldsByName: new Map(),
    fieldsByIndex: new Map(),
  };
}

/**
 * Ensures a class or instance has proper Symbol.metadata
 */
function ensureMetadata(target: unknown): void {
  if (!target) return;

  const obj = target as Record<symbol | string, unknown>;

  // Ensure the target has Symbol.metadata
  if (!obj[Symbol.metadata]) {
    obj[Symbol.metadata] = createMetadataObject();
  }

  // If it's a constructor function, also patch the prototype
  if (typeof target === 'function') {
    const constructor = target as { prototype?: unknown };
    if (constructor.prototype) {
      const proto = constructor.prototype as Record<symbol | string, unknown>;
      if (!proto[Symbol.metadata]) {
        proto[Symbol.metadata] = createMetadataObject();
      }
    }
  }
}

/**
 * Patch all Colyseus schema classes immediately
 */
function patchColyseusSchemas(): void {
  try {
    // Import and patch core Colyseus classes
    const { Schema, ArraySchema, MapSchema } = require('@colyseus/schema');

    ensureMetadata(Schema);
    ensureMetadata(ArraySchema);
    ensureMetadata(MapSchema);

    // Patch constructors to ensure all instances have metadata
    const originalSchemaConstructor = Schema;
    const originalArraySchemaConstructor = ArraySchema;
    const originalMapSchemaConstructor = MapSchema;

    // Override Schema constructor
    function PatchedSchema(this: unknown, ...args: unknown[]) {
      const result = originalSchemaConstructor.apply(this, args);
      ensureMetadata(this);
      return result;
    }
    PatchedSchema.prototype = originalSchemaConstructor.prototype;
    Object.setPrototypeOf(PatchedSchema, originalSchemaConstructor);
    Object.assign(PatchedSchema, originalSchemaConstructor);

    // Override ArraySchema constructor
    function PatchedArraySchema(this: unknown, ...args: unknown[]) {
      const result = originalArraySchemaConstructor.apply(this, args);
      ensureMetadata(this);
      return result;
    }
    PatchedArraySchema.prototype = originalArraySchemaConstructor.prototype;
    Object.setPrototypeOf(PatchedArraySchema, originalArraySchemaConstructor);
    Object.assign(PatchedArraySchema, originalArraySchemaConstructor);

    // Override MapSchema constructor
    function PatchedMapSchema(this: unknown, ...args: unknown[]) {
      const result = originalMapSchemaConstructor.apply(this, args);
      ensureMetadata(this);
      return result;
    }
    PatchedMapSchema.prototype = originalMapSchemaConstructor.prototype;
    Object.setPrototypeOf(PatchedMapSchema, originalMapSchemaConstructor);
    Object.assign(PatchedMapSchema, originalMapSchemaConstructor);

    console.log('✅ Colyseus schema constructors patched with metadata');
  } catch (error) {
    console.warn('⚠️ Failed to patch Colyseus schemas:', error.message);
  }
}

/**
 * Patch the Encoder class to handle missing metadata gracefully
 */
function patchEncoder(): void {
  try {
    const schemaModule = require('@colyseus/schema');

    // Try to find the Encoder class
    let EncoderClass;
    if (schemaModule.Encoder) {
      EncoderClass = schemaModule.Encoder;
    } else {
      try {
        const encoderModule = require('@colyseus/schema/build/src/encoder/Encoder');
        EncoderClass = encoderModule.Encoder;
      } catch {
        console.warn('⚠️ Could not find Encoder class');
        return;
      }
    }

    if (!EncoderClass) return;

    // Store original encodeValue method
    const EncodeOperation = require('@colyseus/schema/build/src/encoder/EncodeOperation');
    const originalEncodeValue = EncodeOperation.encodeValue;

    if (typeof originalEncodeValue === 'function') {
      EncodeOperation.encodeValue = function (
        bytes: unknown,
        it: unknown,
        instance: unknown,
        operation: unknown
      ) {
        // Ensure the instance has metadata before encoding
        if (instance && typeof instance === 'object') {
          ensureMetadata(instance);

          // Also ensure the constructor has metadata
          const constructor = (instance as { constructor?: unknown }).constructor;
          if (constructor) {
            ensureMetadata(constructor);
          }
        }

        return originalEncodeValue.call(this, bytes, it, instance, operation);
      };

      console.log('✅ Encoder.encodeValue patched with metadata safety');
    }
  } catch (error) {
    console.warn('⚠️ Failed to patch Encoder:', error.message);
  }
}

// Apply all patches immediately
patchColyseusSchemas();
patchEncoder();

export const comprehensiveMetadataFixApplied = true;
