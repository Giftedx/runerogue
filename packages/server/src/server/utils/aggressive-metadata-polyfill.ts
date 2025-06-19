/**
 * Aggressive metadata polyfill for Colyseus compatibility
 * This ensures Symbol.metadata is available in all contexts and situations
 */

// Ensure Symbol.metadata exists globally and is accessible
(function initializeSymbolMetadata(): void {
  if (typeof Symbol.metadata === 'undefined') {
    Object.defineProperty(Symbol, 'metadata', {
      value: Symbol.for('Symbol.metadata'),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  // Also ensure it's available on global scope
  if (typeof (globalThis as Record<string, unknown>).Symbol === 'undefined') {
    (globalThis as Record<string, unknown>).Symbol = Symbol;
  }

  if (typeof (globalThis as { Symbol: { metadata: symbol } }).Symbol.metadata === 'undefined') {
    Object.defineProperty((globalThis as { Symbol: object }).Symbol, 'metadata', {
      value: Symbol.for('Symbol.metadata'),
      writable: false,
      enumerable: false,
      configurable: false,
    });
  }

  // Also ensure it's available on global scope for Node.js
  if (typeof global !== 'undefined') {
    if (typeof (global as Record<string, unknown>).Symbol === 'undefined') {
      (global as Record<string, unknown>).Symbol = Symbol;
    }

    if (typeof (global as { Symbol: { metadata: symbol } }).Symbol.metadata === 'undefined') {
      Object.defineProperty((global as { Symbol: object }).Symbol, 'metadata', {
        value: Symbol.for('Symbol.metadata'),
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }
  }

  // Ensure it's available on window for browser contexts
  if (typeof window !== 'undefined') {
    if (typeof (window as Record<string, unknown>).Symbol === 'undefined') {
      (window as Record<string, unknown>).Symbol = Symbol;
    }

    if (typeof (window as { Symbol: { metadata: symbol } }).Symbol.metadata === 'undefined') {
      Object.defineProperty((window as { Symbol: object }).Symbol, 'metadata', {
        value: Symbol.for('Symbol.metadata'),
        writable: false,
        enumerable: false,
        configurable: false,
      });
    }
  }
})();

// Enhanced metadata store for decorators
const metadataStore = new WeakMap<object, Map<string | symbol, unknown>>();

// Ensure Reflect exists
if (typeof Reflect === 'undefined') {
  (global as { Reflect: object }).Reflect = {};
}

// Enhanced metadata reflection methods
if (!Reflect.defineMetadata) {
  Reflect.defineMetadata = function (
    metadataKey: unknown,
    metadataValue: unknown,
    target: object,
    propertyKey?: string | symbol
  ): void {
    let targetMetadata = metadataStore.get(target);
    if (!targetMetadata) {
      targetMetadata = new Map();
      metadataStore.set(target, targetMetadata);
    }

    const key = propertyKey ? `${String(propertyKey)}:${String(metadataKey)}` : String(metadataKey);
    targetMetadata.set(key, metadataValue);
  };
}

if (!Reflect.getMetadata) {
  Reflect.getMetadata = function (
    metadataKey: unknown,
    target: object,
    propertyKey?: string | symbol
  ): unknown {
    const targetMetadata = metadataStore.get(target);
    if (!targetMetadata) return undefined;

    const key = propertyKey ? `${String(propertyKey)}:${String(metadataKey)}` : String(metadataKey);
    return targetMetadata.get(key);
  };
}

if (!Reflect.hasMetadata) {
  Reflect.hasMetadata = function (
    metadataKey: unknown,
    target: object,
    propertyKey?: string | symbol
  ): boolean {
    const targetMetadata = metadataStore.get(target);
    if (!targetMetadata) return false;

    const key = propertyKey ? `${String(propertyKey)}:${String(metadataKey)}` : String(metadataKey);
    return targetMetadata.has(key);
  };
}

// Debug logging to verify Symbol.metadata is available
if (process.env.NODE_ENV === 'test') {
  console.log(
    '[Metadata Polyfill] Symbol.metadata available:',
    typeof Symbol.metadata !== 'undefined'
  );
  console.log('[Metadata Polyfill] Symbol.metadata value:', Symbol.metadata);
}

export {}; // Make this a module
