/**
 * Reflect-metadata initialization with comprehensive Symbol.metadata support
 * This MUST be imported before any schema classes or decorators are used
 */

// Import reflect-metadata first
import 'reflect-metadata';

// Comprehensive Symbol.metadata polyfill for Colyseus compatibility
if (!Symbol.metadata) {
  (Symbol as any).metadata = Symbol.for('Symbol.metadata');

  // Also ensure it's available on all global Symbol objects
  if (typeof globalThis !== 'undefined' && !globalThis.Symbol.metadata) {
    globalThis.Symbol.metadata = (Symbol as any).metadata;
  }

  if (typeof global !== 'undefined' && !global.Symbol.metadata) {
    global.Symbol.metadata = (Symbol as any).metadata;
  }

  if (typeof window !== 'undefined' && !window.Symbol.metadata) {
    window.Symbol.metadata = (Symbol as any).metadata;
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
