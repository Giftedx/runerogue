/**
 * Targeted Metadata Fix for Colyseus Encoding
 * This ensures Symbol.metadata exists for encoding without causing duplicate decorators
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
 * Patch the Encoder's encodeValue function to handle missing metadata gracefully
 * This is the key fix for the Symbol.metadata encoding errors
 */
function patchEncoderForMetadata(): void {
  try {
    // Try to access the EncodeOperation module
    let EncodeOperation;
    try {
      EncodeOperation = require('@colyseus/schema/build/src/encoder/EncodeOperation');
    } catch {
      try {
        EncodeOperation = require('@colyseus/schema/src/encoder/EncodeOperation');
      } catch {
        console.warn('⚠️ Could not find EncodeOperation module');
        return;
      }
    }

    if (!EncodeOperation) return;

    // Store original encodeValue method
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

      console.log('✅ EncodeOperation.encodeValue patched for Symbol.metadata safety');
    }
  } catch (error) {
    console.warn('⚠️ Failed to patch EncodeOperation:', error.message);
  }
}

// Apply the encoder patch immediately
patchEncoderForMetadata();

export const targetedMetadataFixApplied = true;
