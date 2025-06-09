/**
 * Direct patch for Colyseus Encoder.tryEncodeTypeId to fix ArraySchema warnings
 *
 * The issue is that Encoder.tryEncodeTypeId can't find ArraySchema in the TypeRegistry.
 * This patch intercepts the problematic call and handles ArraySchema/MapSchema correctly.
 */

import { ArraySchema, MapSchema } from '@colyseus/schema';

let isPatched = false;

/**
 * Patch Encoder.tryEncodeTypeId to handle ArraySchema/MapSchema without warnings
 */
export function patchEncoderTypeId(): void {
  if (isPatched) {
    return;
  }

  try {
    // Import the Encoder class (it might be in a different location in different versions)
    const schemaModule = require('@colyseus/schema');

    // Try different possible locations for the Encoder
    let EncoderClass;

    if (schemaModule.Encoder) {
      EncoderClass = schemaModule.Encoder;
    } else if (schemaModule.encode?.Encoder) {
      EncoderClass = schemaModule.encode.Encoder;
    } else {
      // Try to get it from the internal modules
      try {
        const encoderModule = require('@colyseus/schema/build/src/encoder/Encoder');
        EncoderClass = encoderModule.Encoder;
      } catch {
        console.warn('⚠️ Could not find Encoder class to patch');
        return;
      }
    }

    if (!EncoderClass || !EncoderClass.prototype) {
      console.warn('⚠️ Encoder class not found or invalid');
      return;
    }

    // Store the original method
    const originalTryEncodeTypeId = EncoderClass.prototype.tryEncodeTypeId;

    if (typeof originalTryEncodeTypeId !== 'function') {
      console.warn('⚠️ tryEncodeTypeId method not found on Encoder prototype');
      return;
    }

    // Patch the method
    EncoderClass.prototype.tryEncodeTypeId = function (instance: any, instanceType: any) {
      // Check if this is ArraySchema or MapSchema
      if (instance && (instance instanceof ArraySchema || instance instanceof MapSchema)) {
        // For ArraySchema and MapSchema, return a predefined type ID to avoid the warning
        // These are container types and don't need to be in the TypeRegistry
        if (instance instanceof ArraySchema) {
          return 'array'; // Use the built-in array type identifier
        } else if (instance instanceof MapSchema) {
          return 'map'; // Use the built-in map type identifier
        }
      }

      // For all other cases, use the original method
      return originalTryEncodeTypeId.call(this, instance, instanceType);
    };

    console.log('✅ Encoder.tryEncodeTypeId patched to handle ArraySchema/MapSchema');
    isPatched = true;
  } catch (error) {
    console.error('❌ Failed to patch Encoder.tryEncodeTypeId:', error);
  }
}

// Apply the patch immediately when this module is imported
patchEncoderTypeId();
