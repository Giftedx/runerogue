/**
 * Symbol.metadata polyfill for Colyseus schema compatibility
 * This addresses the undefined Symbol.metadata issue that breaks Colyseus serialization
 */

// Define Symbol.metadata if it doesn't exist
if (typeof Symbol.metadata === 'undefined') {
  // Create a unique symbol for metadata
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

/**
 * Enhanced metadata polyfill that ensures decorator compatibility
 */
export function ensureMetadataPolyfill(): void {
  // Make sure Symbol.metadata exists
  if (typeof Symbol.metadata === 'undefined') {
    (Symbol as any).metadata = Symbol('Symbol.metadata');
  }

  // Add metadata support to prototypes if missing
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function (
    target: any,
    property: PropertyKey,
    descriptor: PropertyDescriptor
  ) {
    const result = originalDefineProperty(target, property, descriptor);

    // Ensure metadata symbol is available on the target
    if (target && typeof target === 'object' && !target[Symbol.metadata]) {
      try {
        Object.defineProperty(target, Symbol.metadata, {
          value: {},
          writable: true,
          enumerable: false,
          configurable: true,
        });
      } catch (e) {
        // Ignore if already defined or not configurable
      }
    }

    return result;
  };

  // Ensure Function.prototype has metadata symbol
  if (typeof Function.prototype[Symbol.metadata] === 'undefined') {
    try {
      Object.defineProperty(Function.prototype, Symbol.metadata, {
        value: null,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    } catch (e) {
      // Ignore if already defined
    }
  }
}

/**
 * Initialize metadata support for Colyseus schemas
 */
export function initializeSchemaMetadata(): void {
  ensureMetadataPolyfill();

  // Import reflect-metadata to ensure decorator metadata works
  require('reflect-metadata');

  console.log('Metadata polyfill initialized. Symbol.metadata:', typeof Symbol.metadata);
}

// Auto-initialize when this module is imported
initializeSchemaMetadata();
