/**
 * Ultimate Symbol.metadata polyfill for Colyseus compatibility
 * This addresses the core issue where Colyseus Encoder tries to access Symbol.metadata
 */

// Ensure Symbol.metadata exists globally
if (!Symbol.metadata) {
  (Symbol as any).metadata = Symbol('metadata');

  // Also ensure it's available on the global Symbol object
  if (typeof globalThis !== 'undefined') {
    if (!globalThis.Symbol.metadata) {
      globalThis.Symbol.metadata = (Symbol as any).metadata;
    }
  }

  if (typeof global !== 'undefined') {
    if (!global.Symbol.metadata) {
      global.Symbol.metadata = (Symbol as any).metadata;
    }
  }

  if (typeof window !== 'undefined') {
    if (!window.Symbol.metadata) {
      window.Symbol.metadata = (Symbol as any).metadata;
    }
  }
}

// Create a proxy for Symbol to ensure metadata is always available
const originalSymbol = Symbol;
const enhancedSymbol = new Proxy(originalSymbol, {
  get(target, prop) {
    if (prop === 'metadata') {
      return target.metadata || Symbol('metadata');
    }
    return target[prop as keyof SymbolConstructor];
  },
});

// Replace the global Symbol with our enhanced version
if (typeof globalThis !== 'undefined') {
  globalThis.Symbol = enhancedSymbol;
}
if (typeof global !== 'undefined') {
  global.Symbol = enhancedSymbol;
}
if (typeof window !== 'undefined') {
  window.Symbol = enhancedSymbol;
}

// Patch all objects to ensure they can access Symbol.metadata
const originalObjectDefineProperty = Object.defineProperty;
Object.defineProperty = function (obj: any, prop: string | symbol, descriptor: PropertyDescriptor) {
  // If someone is trying to define Symbol.metadata, make sure it exists
  if (prop === Symbol.metadata || prop === 'Symbol.metadata') {
    if (!Symbol.metadata) {
      (Symbol as any).metadata = Symbol('metadata');
    }
  }
  return originalObjectDefineProperty.call(this, obj, prop, descriptor);
};

console.log('🔧 Ultimate metadata polyfill applied - Symbol.metadata:', !!Symbol.metadata);

export {};
