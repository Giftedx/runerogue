/**
 * Reflect-metadata initialization with comprehensive Symbol.metadata support
 * This MUST be imported before any schema classes or decorators are used
 */

// Import reflect-metadata first
import 'reflect-metadata';

// Comprehensive Symbol.metadata polyfill for Colyseus compatibility
if (!Symbol.metadata) {
  // Use Object.defineProperty to avoid read-only property errors
  Object.defineProperty(Symbol, 'metadata', {
    value: Symbol.for('Symbol.metadata'),
    writable: false,
    enumerable: false,
    configurable: true,
  });

  // Also ensure it's available on all global Symbol objects
  if (typeof globalThis !== 'undefined' && !globalThis.Symbol.metadata) {
    Object.defineProperty(globalThis.Symbol, 'metadata', {
      value: Symbol.metadata,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  if (typeof global !== 'undefined' && !global.Symbol.metadata) {
    Object.defineProperty(global.Symbol, 'metadata', {
      value: Symbol.metadata,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }

  if (typeof window !== 'undefined' && !window.Symbol.metadata) {
    Object.defineProperty(window.Symbol, 'metadata', {
      value: Symbol.metadata,
      writable: false,
      enumerable: false,
      configurable: true,
    });
  }
}

// Create a proxy for Symbol to ensure metadata is always available when accessed
const originalSymbol = Symbol;
const enhancedSymbol = new Proxy(originalSymbol, {
  get(target, prop) {
    if (prop === 'metadata') {
      return target.metadata || Symbol.for('Symbol.metadata');
    }
    return target[prop as keyof SymbolConstructor];
  },
});

// Replace global Symbol references
if (typeof globalThis !== 'undefined') {
  globalThis.Symbol = enhancedSymbol;
}
if (typeof global !== 'undefined') {
  global.Symbol = enhancedSymbol;
}

console.log('🔧 Enhanced metadata polyfill loaded - Symbol.metadata:', !!Symbol.metadata);

// Export for verification
export const reflectMetadataLoaded = true;
export const symbolMetadataExists = !!Symbol.metadata;
