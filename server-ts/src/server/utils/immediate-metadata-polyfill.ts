/**
 * Immediate Symbol.metadata polyfill that executes when the module is loaded
 * This ensures Symbol.metadata is available before any decorators are processed
 */

// Immediately Invoked Function Expression (IIFE) to execute polyfill on module load
(() => {
  // Check if Symbol.metadata already exists
  if (typeof (Symbol as unknown as { metadata?: symbol }).metadata !== 'undefined') {
    return; // Already available, no need to polyfill
  }

  // Create Symbol.metadata if it doesn't exist
  if (typeof Symbol !== 'undefined') {
    (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
  }

  // Also ensure reflect-metadata is available
  try {
    require('reflect-metadata');
  } catch (error) {
    console.warn('reflect-metadata not available:', error);
  }

  // Log polyfill application for debugging (only in development)
  if (process.env.NODE_ENV !== 'test') {
    console.log('[POLYFILL] Symbol.metadata polyfill applied immediately');
  }
})();

// Export a dummy to make this a valid module
export const metadataPolyfillApplied = true;
