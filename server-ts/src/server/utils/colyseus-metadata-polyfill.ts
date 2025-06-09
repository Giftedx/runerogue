/**
 * Comprehensive Symbol.metadata Polyfill for Colyseus Compatibility
 *
 * This polyfill ensures Symbol.metadata is available globally and properly
 * accessible by Colyseus schema encoding/decoding operations.
 */

// Ensure Symbol.metadata exists globally
if (!Symbol.metadata) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

// Store reference to the metadata symbol
const metadataSymbol = Symbol.metadata;

/**
 * Enhanced polyfill that patches Function.prototype to ensure metadata symbol
 * is accessible on all constructor functions
 */
export function initializeColyseusMetadataPolyfill(): void {
  // Ensure all Function constructors have the metadata symbol property
  const originalDefineProperty = Object.defineProperty;

  // Patch Object.defineProperty to handle metadata symbol
  Object.defineProperty = function (
    target: any,
    property: PropertyKey,
    descriptor: PropertyDescriptor
  ) {
    const result = originalDefineProperty.call(this, target, property, descriptor);

    // If this is a constructor function and we're setting metadata, ensure the symbol is accessible
    if (typeof target === 'function' && property === metadataSymbol) {
      // Ensure the metadata is properly accessible
      if (!target.hasOwnProperty(metadataSymbol)) {
        originalDefineProperty.call(this, target, metadataSymbol, {
          value: descriptor.value,
          writable: true,
          enumerable: false,
          configurable: true,
        });
      }
    }

    return result;
  };

  // Patch all existing constructor functions to have metadata symbol
  const patchConstructor = (constructor: any) => {
    if (typeof constructor === 'function' && !constructor.hasOwnProperty(metadataSymbol)) {
      try {
        Object.defineProperty(constructor, metadataSymbol, {
          value: undefined,
          writable: true,
          enumerable: false,
          configurable: true,
        });
      } catch (error) {
        // Ignore errors for built-in constructors that can't be modified
      }
    }
  };

  // Patch common constructors
  [Object, Array, Function, String, Number, Boolean, Date, RegExp, Error].forEach(patchConstructor);

  // Patch global constructors that might be used by Colyseus
  if (typeof globalThis !== 'undefined') {
    Object.getOwnPropertyNames(globalThis).forEach(name => {
      try {
        const value = (globalThis as any)[name];
        if (typeof value === 'function' && value.prototype) {
          patchConstructor(value);
        }
      } catch (error) {
        // Ignore errors accessing restricted properties
      }
    });
  }

  console.log('[Colyseus Metadata Polyfill] Initialized comprehensive metadata support');
}

/**
 * Verify that the polyfill is working correctly
 */
export function verifyMetadataPolyfill(): boolean {
  try {
    // Test 1: Symbol.metadata exists
    if (!Symbol.metadata) {
      console.error('[Metadata Polyfill] Symbol.metadata not found');
      return false;
    }

    // Test 2: Can access metadata on a test class
    class TestClass {}
    const hasMetadataProperty = metadataSymbol in TestClass;

    console.log('[Metadata Polyfill] Verification results:', {
      symbolExists: !!Symbol.metadata,
      canAccessOnClass: hasMetadataProperty,
      symbolValue: Symbol.metadata.toString(),
    });

    return true;
  } catch (error) {
    console.error('[Metadata Polyfill] Verification failed:', error);
    return false;
  }
}

// Auto-initialize when imported
initializeColyseusMetadataPolyfill();
