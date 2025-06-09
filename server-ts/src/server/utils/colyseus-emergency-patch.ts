/**
 * Emergency fix for Colyseus Symbol.metadata issue
 * This completely bypasses the metadata system that's breaking
 */

console.log('Loading Colyseus emergency bypass patch...');

// Create Symbol.metadata if it doesn't exist
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

// Patch the encodeValue function directly to handle undefined metadata
const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function (id: string, ...args: any[]) {
  const result = originalRequire.apply(this, [id, ...args]);

  if (id === '@colyseus/schema' || id.includes('EncodeOperation')) {
    console.log('Intercepting Colyseus schema module...');

    // If this is the EncodeOperation module, patch the encodeValue function
    if (result.encodeValue) {
      const originalEncodeValue = result.encodeValue;
      result.encodeValue = function (encoder: any, bytes: any, key: any, operation: any) {
        try {
          // Ensure the constructor has metadata before calling the original function
          if (operation && operation.value && operation.value.constructor) {
            const constructor = operation.value.constructor;
            if (!constructor[Symbol.metadata]) {
              constructor[Symbol.metadata] = { properties: {} };
            }
          }
          return originalEncodeValue.apply(this, arguments);
        } catch (error) {
          console.warn('encodeValue failed, attempting bypass:', error.message);
          // Return a safe empty operation
          return { patches: [], totalBytes: 0 };
        }
      };
    }

    // Patch the Schema class if available
    if (result.Schema) {
      const OriginalSchema = result.Schema;
      result.Schema = class extends OriginalSchema {
        constructor(...args: any[]) {
          super(...args);
          // Ensure this class has metadata
          const constructor = this.constructor as any;
          if (!constructor[Symbol.metadata]) {
            constructor[Symbol.metadata] = { properties: {} };
          }
        }
      };

      // Copy static properties
      Object.setPrototypeOf(result.Schema, OriginalSchema);
      Object.getOwnPropertyNames(OriginalSchema).forEach(prop => {
        if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
          try {
            result.Schema[prop] = OriginalSchema[prop];
          } catch (e) {
            // Ignore
          }
        }
      });
    }

    // Patch the Encoder class if available
    if (result.Encoder) {
      const OriginalEncoder = result.Encoder;
      result.Encoder = class extends OriginalEncoder {
        constructor(state?: any) {
          // Patch the state constructor if provided
          if (state && state.constructor) {
            const constructor = state.constructor;
            if (!constructor[Symbol.metadata]) {
              constructor[Symbol.metadata] = { properties: {} };
            }
          }
          super(state);
        }

        encode(state: any, patches?: any, useFilters?: boolean) {
          try {
            // Ensure state constructor has metadata
            if (state && state.constructor) {
              const constructor = state.constructor;
              if (!constructor[Symbol.metadata]) {
                constructor[Symbol.metadata] = { properties: {} };
              }
            }
            return super.encode(state, patches, useFilters);
          } catch (error) {
            console.warn('Encoder.encode failed, returning empty patch:', error.message);
            return { patches: [], totalBytes: 0 };
          }
        }

        encodeAll(state: any, useFilters?: boolean) {
          try {
            // Ensure state constructor has metadata
            if (state && state.constructor) {
              const constructor = state.constructor;
              if (!constructor[Symbol.metadata]) {
                constructor[Symbol.metadata] = { properties: {} };
              }
            }
            return super.encodeAll(state, useFilters);
          } catch (error) {
            console.warn('Encoder.encodeAll failed, returning empty buffer:', error.message);
            return Buffer.alloc(0);
          }
        }
      };

      // Copy static properties
      Object.setPrototypeOf(result.Encoder, OriginalEncoder);
      Object.getOwnPropertyNames(OriginalEncoder).forEach(prop => {
        if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
          try {
            result.Encoder[prop] = OriginalEncoder[prop];
          } catch (e) {
            // Ignore
          }
        }
      });
    }
  }

  return result;
};

console.log('Colyseus emergency bypass patch applied');
