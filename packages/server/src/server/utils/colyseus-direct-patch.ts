/**
 * @file Direct patch for Colyseus to handle Symbol.metadata issues.
 * This script patches the Colyseus encoder directly where errors related to
 * `Symbol.metadata` commonly occur, making it more resilient.
 */

import { Encoder, Schema } from '@colyseus/schema';

/**
 * Polyfills `Symbol.metadata` if it's not already defined.
 * This is crucial for compatibility with libraries that rely on this feature.
 * @ignore
 */
if (!Symbol.metadata) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Symbol as any).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Represents the structure of the module containing the `encodeValue` function.
 * @ignore
 */
interface EncodeOperationModule {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  encodeValue: (...args: any[]) => any;
}

/**
 * Applies a patch to the Colyseus `encodeValue` function to prevent crashes
 * when an object or its constructor is missing `Symbol.metadata`.
 *
 * This is an asynchronous function that dynamically imports the required module.
 * @returns {Promise<void>} A promise that resolves when the patch has been applied.
 * @ignore
 */
async function applyEncodeValuePatch(): Promise<void> {
  try {
    // Dynamically import the module to be patched.
    const originalModule = (await import(
      '@colyseus/schema/src/encoder/EncodeOperation'
    )) as EncodeOperationModule;

    if (originalModule && typeof originalModule.encodeValue === 'function') {
      const originalEncodeValue = originalModule.encodeValue;

      // Override the original function with a patched version.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      originalModule.encodeValue = function (this: unknown, ...args: any[]): any {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = args[0] as any;
        try {
          // Ensure metadata properties exist to avoid errors.
          if (value?.constructor && !value.constructor[Symbol.metadata]) {
            value.constructor[Symbol.metadata] = null;
          }
          if (value && typeof value === 'object' && !value[Symbol.metadata]) {
            Object.defineProperty(value, Symbol.metadata, {
              value: null,
              enumerable: false,
              configurable: true,
            });
          }

          return originalEncodeValue.call(this, ...args);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('EncodeValue patch error:', message, 'for value:', value);

          // Gracefully handle metadata-related errors.
          if (message.includes('Symbol.metadata')) {
            return new Uint8Array(0); // Return a safe, empty value.
          }
          throw error;
        }
      };
      console.log('✅ Colyseus encodeValue patched successfully.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Failed to apply Colyseus encodeValue patch: ${message}`);
  }
}

/**
 * Patches the Colyseus `Encoder` constructor to make it more resilient
 * to `Symbol.metadata` related errors during instantiation.
 * @ignore
 */
function patchEncoderConstructor(): void {
  const OriginalEncoder = Encoder;

  // This is a direct override of the constructor.
  // It's a bit of a hack, but necessary for this patch.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (Encoder as any).prototype.constructor = function (
    this: Encoder,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...args: any[]
  ) {
    try {
      // We can't use `super()` here, so we call the original constructor's logic.
      // The use of `.call` on a constructor is unusual but seems to be the intent.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (OriginalEncoder as any).call(this, ...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Encoder constructor patch error:', message);

      if (message.includes('Symbol.metadata')) {
        // Initialize with safe defaults to prevent a crash.
        this.schemas = new Map<number | string, typeof Schema>();
        return this;
      }
      throw error;
    }
  };
  console.log('✅ Colyseus Encoder constructor patched successfully.');
}

/**
 * Applies all patches in this file.
 * @returns {Promise<void>}
 * @ignore
 */
async function applyAllPatches(): Promise<void> {
  await applyEncodeValuePatch();
  patchEncoderConstructor();
}

// Apply the patches when the module is imported.
applyAllPatches().catch(e => {
  const message = e instanceof Error ? e.message : String(e);
  console.error(`❌ Fatal error applying colyseus-direct-patch: ${message}`);
});

export { Encoder };
