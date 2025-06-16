/**
 * Early metadata initialization to fix Colyseus schema serialization issues.
 * This must be imported BEFORE any schema classes or Colyseus imports.
 */

// Ensure Symbol.metadata exists globally
if (!Symbol.metadata) {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

// Create a more robust metadata polyfill
const metadataSymbol = Symbol.metadata;

// Patch Object prototype to ensure all objects have Symbol.metadata
if (!Object.prototype.hasOwnProperty.call(Object.prototype, metadataSymbol)) {
  Object.defineProperty(Object.prototype, metadataSymbol, {
    value: null,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}

// Store original Symbol.metadata
const originalMetadata = (Symbol as unknown as { metadata: symbol }).metadata;

// Override Symbol.metadata to ensure it always returns a valid symbol
Object.defineProperty(Symbol, 'metadata', {
  get() {
    return originalMetadata || Symbol.for('Symbol.metadata');
  },
  configurable: true,
});

// Early patch for common class constructors
function patchConstructor(constructor: unknown) {
  if (constructor && typeof constructor === 'function') {
    const ctorWithMetadata = constructor as unknown as Record<string | symbol, unknown>;
    if (!ctorWithMetadata[metadataSymbol]) {
      ctorWithMetadata[metadataSymbol] = null;
    }
    const proto = (constructor as { prototype?: unknown }).prototype;
    if (proto) {
      const protoWithMetadata = proto as unknown as Record<string | symbol, unknown>;
      if (!protoWithMetadata[metadataSymbol]) {
        protoWithMetadata[metadataSymbol] = null;
      }
    }
  }
}

// Patch common classes early
patchConstructor(Object);
patchConstructor(Array);
patchConstructor(Function);

// Enhanced ArraySchema support
let arraySchemaPatched = false;
function ensureArraySchemaPatched() {
  if (arraySchemaPatched) return;
  try {
    // Try to get ArraySchema without importing it directly
    const colyseusSchema = require('@colyseus/schema');
    if (colyseusSchema && colyseusSchema.ArraySchema) {
      const ArraySchema = colyseusSchema.ArraySchema;

      // Patch ArraySchema constructor and prototype
      patchConstructor(ArraySchema);

      // Ensure ArraySchema has a proper type registry entry
      if (ArraySchema.prototype && !ArraySchema.prototype[metadataSymbol]) {
        ArraySchema.prototype[metadataSymbol] = null;
      }

      arraySchemaPatched = true;
      console.log('✅ ArraySchema patched for metadata support');
    }
  } catch (error) {
    // Ignore errors - ArraySchema might not be available yet
  }
}

// Patch when first accessed
setTimeout(ensureArraySchemaPatched, 0);

// Also try to patch when module is first loaded
if (typeof setImmediate !== 'undefined') {
  setImmediate(ensureArraySchemaPatched);
}

// Export for verification
export const isMetadataInitialized = true;
export { metadataSymbol };

console.log('✅ Early metadata initialization complete');
