/**
 * Global Symbol.metadata Polyfill for Colyseus Schema Compatibility
 *
 * This polyfill ensures Symbol.metadata is available globally for
 * Colyseus schema serialization. Must be imported before any schema classes.
 */

// Check if Symbol.metadata already exists
if (!Symbol.metadata) {
  // Create the metadata symbol and attach it to the global Symbol object
  (Symbol as any).metadata = Symbol('Symbol.metadata');

  // Also ensure it's available on globalThis for broader compatibility
  if (typeof globalThis !== 'undefined') {
    (globalThis.Symbol as any).metadata = (Symbol as any).metadata;
  }

  // For Node.js environments, also set it on global
  if (typeof global !== 'undefined') {
    (global.Symbol as any).metadata = (Symbol as any).metadata;
  }
}

// Export the symbol for explicit usage if needed
export const METADATA_SYMBOL = (Symbol as any).metadata;

// Verify the polyfill worked
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  console.log('✅ Symbol.metadata polyfill applied:', !!Symbol.metadata);
}
