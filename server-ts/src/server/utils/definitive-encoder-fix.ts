/**
 * Final Colyseus Schema Fix
 *
 * This addresses the core issue: "Cannot read properties of undefined (reading 'Symbol(Symbol.metadata)')"
 * The problem is in the Encoder constructor where it tries to access this[Symbol.metadata].constructor
 * but this[Symbol.metadata] is undefined.
 */

import { ArraySchema, MapSchema } from '@colyseus/schema';

// Ensure Symbol.metadata exists
if (!Symbol.metadata) {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Apply the definitive fix for the Encoder metadata issue
 */
function applyDefinitiveEncoderFix(): void {
  try {
    const schemaModule = require('@colyseus/schema');
    const { Encoder } = schemaModule;

    if (!Encoder) {
      console.warn('⚠️ Encoder not found in @colyseus/schema');
      return;
    }

    // Store original Encoder
    const OriginalEncoder = Encoder;

    // Create a wrapper class that ensures metadata exists
    class PatchedEncoder extends OriginalEncoder {
      constructor(...args: any[]) {
        // Pre-initialize metadata on this instance before calling super
        if (!(this as any)[Symbol.metadata]) {
          (this as any)[Symbol.metadata] = {
            properties: {},
            indexes: {},
            schemas: {},
            constructor: PatchedEncoder,
          };
        }

        super(...args);
      }
    }

    // Copy static properties
    Object.setPrototypeOf(PatchedEncoder, OriginalEncoder);
    Object.defineProperty(PatchedEncoder, 'name', { value: 'Encoder' });

    // Replace the Encoder in the module
    schemaModule.Encoder = PatchedEncoder;

    // Also patch any existing prototypes
    if (OriginalEncoder.prototype) {
      PatchedEncoder.prototype = OriginalEncoder.prototype;
    }

    console.log('✅ Encoder class patched with metadata initialization');

    // Register container types
    const containerTypes = [ArraySchema, MapSchema];

    for (const ContainerType of containerTypes) {
      if (!ContainerType[Symbol.metadata]) {
        ContainerType[Symbol.metadata] = {
          properties: {},
          indexes: {},
          schemas: {},
        };
      }
    }

    // Apply entity decorator if available
    const { entity } = schemaModule;
    if (entity && typeof entity === 'function') {
      try {
        entity(ArraySchema);
        entity(MapSchema);
        console.log('✅ @entity decorator applied to container types');
      } catch (e) {
        console.warn('⚠️ Failed to apply @entity decorator:', e.message);
      }
    }

    console.log('✅ Definitive Colyseus encoder fix applied successfully');
  } catch (error) {
    console.error('❌ Failed to apply definitive encoder fix:', error);
  }
}

// Apply fix immediately when this module is imported
applyDefinitiveEncoderFix();

export const definitiveEncoderFixApplied = true;
