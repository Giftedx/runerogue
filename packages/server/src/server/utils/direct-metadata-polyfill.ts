/**
 * Direct Symbol.metadata polyfill specifically for Colyseus Schema compatibility
 *
 * This polyfill patches the global Symbol object and ensures that all classes
 * have the metadata symbol available for Colyseus schema serialization.
 */

// Ensure Symbol.metadata exists globally before any other imports
if (!('metadata' in Symbol)) {
  Object.defineProperty(Symbol, 'metadata', {
    value: Symbol('Symbol.metadata'),
    configurable: false,
    enumerable: false,
    writable: false,
  });
}

// Store the metadata symbol
const METADATA_SYMBOL = Symbol.metadata;

/**
 * Patch all constructor functions to have the metadata symbol
 */
function patchConstructorForMetadata(constructor: any): void {
  if (typeof constructor === 'function' && !constructor.hasOwnProperty(METADATA_SYMBOL)) {
    try {
      Object.defineProperty(constructor, METADATA_SYMBOL, {
        value: undefined,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    } catch (error) {
      // Silently ignore errors for built-in constructors
    }
  }
}

/**
 * Enhanced polyfill that ensures metadata compatibility
 */
export function applyColyseusMetadataFix(): void {
  // Patch common built-in constructors
  const commonConstructors = [
    Object,
    Array,
    Function,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    Error,
    Map,
    Set,
  ];

  commonConstructors.forEach(patchConstructorForMetadata);

  // Override the global class definition process to ensure all new classes get metadata
  const originalDefineProperty = Object.defineProperty;

  Object.defineProperty = function (
    target: any,
    property: PropertyKey,
    descriptor: PropertyDescriptor
  ) {
    const result = originalDefineProperty.call(this, target, property, descriptor);

    // If this is a constructor function, ensure it has metadata symbol
    if (typeof target === 'function') {
      patchConstructorForMetadata(target);
    }

    return result;
  };

  console.log('[Colyseus Metadata Fix] Applied Symbol.metadata polyfill');
}

// Apply the fix immediately when this module is imported
applyColyseusMetadataFix();

// Export for manual verification
export function verifyMetadataSymbol(): boolean {
  const hasSymbol = 'metadata' in Symbol;
  const symbolValue = Symbol.metadata;

  console.log('[Metadata Verification]', {
    hasSymbol,
    symbolString: symbolValue?.toString(),
    canCreateClass: (() => {
      try {
        class TestClass {}
        return METADATA_SYMBOL in TestClass;
      } catch {
        return false;
      }
    })(),
  });

  return hasSymbol;
}

// Verify immediately
verifyMetadataSymbol();
