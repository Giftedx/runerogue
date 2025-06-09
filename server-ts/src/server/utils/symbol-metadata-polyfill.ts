/**
 * Symbol.metadata polyfill for Node.js versions that don't support it
 * This polyfill implements basic functionality to make Colyseus schema work
 */

declare global {
  interface SymbolConstructor {
    readonly metadata: unique symbol;
  }
}

// Check if Symbol.metadata already exists
if (typeof Symbol.metadata === 'undefined') {
  // Create the metadata symbol
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Symbol as any).metadata = Symbol('Symbol.metadata');

  // We also need to polyfill the decorator metadata functionality
  // This is a minimal implementation to satisfy Colyseus requirements
  if (typeof globalThis === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).globalThis = global;
  }
}

export {};
