/**
 * Direct patch for Colyseus to handle Symbol.metadata issues
 * This patches the encoder directly where the error occurs
 */

// Ensure Symbol.metadata exists globally
if (!Symbol.metadata) {
  (Symbol as any).metadata = Symbol.for('Symbol.metadata');
}

// Import after ensuring Symbol.metadata exists
import { Encoder } from '@colyseus/schema';

// Store the original encodeValue function
const originalModule = require('@colyseus/schema/src/encoder/EncodeOperation');

if (originalModule && originalModule.encodeValue) {
  const originalEncodeValue = originalModule.encodeValue;

  // Patch encodeValue to handle undefined metadata gracefully
  originalModule.encodeValue = function (
    value: any,
    operation: any,
    root: any,
    filters?: any
  ): any {
    try {
      // If the value has a constructor, ensure it has Symbol.metadata
      if (value && value.constructor && !value.constructor[Symbol.metadata]) {
        value.constructor[Symbol.metadata] = null;
      }

      // If the value itself needs Symbol.metadata
      if (value && typeof value === 'object' && !value[Symbol.metadata]) {
        Object.defineProperty(value, Symbol.metadata, {
          value: null,
          enumerable: false,
          configurable: true,
        });
      }

      return originalEncodeValue.call(this, value, operation, root, filters);
    } catch (error) {
      console.error('EncodeValue error:', error, 'for value:', value);
      // Try to handle the error gracefully
      if (error.message?.includes('Symbol.metadata')) {
        // Return a safe default for metadata errors
        return new Uint8Array(0);
      }
      throw error;
    }
  };
}

// Also patch the Encoder constructor to be more resilient
const OriginalEncoder = Encoder;
(Encoder as any).prototype.constructor = function (...args: any[]) {
  try {
    return OriginalEncoder.call(this, ...args);
  } catch (error) {
    console.error('Encoder constructor error:', error);
    if (error.message?.includes('Symbol.metadata')) {
      // Initialize with safe defaults
      this.schemas = new Map();
      return this;
    }
    throw error;
  }
};

export { Encoder };
