/**
 * Ultra-early Symbol.metadata polyfill
 * Must be imported BEFORE any Colyseus code to fix decorator issues
 */

// Patch Symbol.metadata immediately if it doesn't exist
if (!Symbol.metadata) {
  Object.defineProperty(Symbol, 'metadata', {
    value: Symbol('Symbol.metadata'),
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

// Ensure reflect-metadata is available early
if (typeof Reflect === 'undefined' || !Reflect.metadata) {
  require('reflect-metadata');
}

console.log('[Early Polyfill] Symbol.metadata applied:', !!Symbol.metadata);
