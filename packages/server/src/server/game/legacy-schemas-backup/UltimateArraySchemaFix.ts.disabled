/**
 * Ultimate ArraySchema fix for Colyseus v0.16.x TypeRegistry registration.
 * This directly addresses: "Class 'ArraySchema' is not registered on TypeRegistry"
 */

import { ArraySchema, Context, Schema } from '@colyseus/schema';
import '../utils/early-metadata-init';

/**
 * Force ArraySchema registration using multiple strategies
 */
function forceArraySchemaRegistration() {
  try {
    // Strategy 1: Direct TypeRegistry manipulation
    const context = Context as any;
    if (context.typeRegistry) {
      const registry = context.typeRegistry;

      // Check if ArraySchema is already registered
      if (!registry.has(ArraySchema)) {
        // Get the next available type ID
        const typeId = registry.size;

        // Register ArraySchema with the type ID
        registry.set(ArraySchema, typeId);

        // Also add to the reverse lookup
        if (registry.types) {
          registry.types[typeId] = ArraySchema;
        }

        console.log(`✅ ArraySchema registered in TypeRegistry with ID: ${typeId}`);
      } else {
        console.log('✅ ArraySchema already registered in TypeRegistry');
      }
    }

    // Strategy 2: Use internal Colyseus registration method
    const defineTypesFunction = (Schema as any).defineTypes;
    if (defineTypesFunction && typeof defineTypesFunction === 'function') {
      // Create a dummy schema to trigger ArraySchema registration
      class DummySchema extends Schema {}
      defineTypesFunction(DummySchema, {
        dummyArray: [ArraySchema],
      });
      console.log('✅ ArraySchema registered via defineTypes');
    }

    // Strategy 3: Manually invoke the type registration on ArraySchema
    if (ArraySchema.prototype.constructor) {
      const constructor = ArraySchema.prototype.constructor;
      if ((constructor as any).is && typeof (constructor as any).is === 'function') {
        (constructor as any).is('array');
        console.log('✅ ArraySchema marked as array type');
      }
    }

    return true;
  } catch (error) {
    console.warn('⚠️ ArraySchema registration failed:', error);
    return false;
  }
}

// Apply registration immediately
const registered = forceArraySchemaRegistration();

// Also try registration when the module is completely loaded
setTimeout(() => {
  if (!registered) {
    forceArraySchemaRegistration();
  }
}, 0);

export { ArraySchema };
