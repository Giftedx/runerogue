/**
 * Definitive fix for Colyseus ArraySchema/MapSchema registration warnings.
 *
 * The issue: Colyseus shows warning "Class 'ArraySchema' is not registered on TypeRegistry".
 * This is because ArraySchema and MapSchema are container types that need to be explicitly registered.
 * This script handles the registration in a way that is robust against different Colyseus versions.
 *
 * @file This file contains the fix for ArraySchema and MapSchema registration.
 */

import { ArraySchema, MapSchema } from '@colyseus/schema';

// Polyfill Symbol.metadata if it doesn't exist.
if (!Symbol.metadata) {
  (Symbol as { metadata?: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Represents a schema constructor with an optional metadata symbol.
 * This is used to safely access and assign `Symbol.metadata`.
 * @ignore
 */
type SchemaConstructor = {
  new (...args: unknown[]): unknown;
} & {
  [Symbol.metadata]?: {
    properties: unknown;
    indexes: unknown;
    schemas: unknown;
  };
};

/**
 * Dynamically finds and imports the Colyseus TypeRegistry.
 * It searches in common locations to support different package structures.
 *
 * @returns {Promise<any | null>} A promise that resolves to the TypeRegistry or null if not found.
 * @ignore
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findTypeRegistry(): Promise<any | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaModule: any = await import('@colyseus/schema');
    if (schemaModule.TypeRegistry) return schemaModule.TypeRegistry;
    if (schemaModule.types?.TypeRegistry) return schemaModule.types.TypeRegistry;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typesModule: any = await import('@colyseus/schema/build/src/types');
    if (typesModule.TypeRegistry) return typesModule.TypeRegistry;
  } catch {
    // Fallback for other structures
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const typeRegistryModule: any = await import('@colyseus/schema/build/src/types/TypeRegistry');
    if (typeRegistryModule.TypeRegistry) return typeRegistryModule.TypeRegistry;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.warn(`⚠️ Could not find TypeRegistry. Details: ${message}`);
  }

  return null;
}

/**
 * Registers a schema (like ArraySchema or MapSchema) with the TypeRegistry.
 * It tries different registration methods for compatibility.
 *
 * @param {any} TypeRegistry - The found TypeRegistry.
 * @param {string} name - The name of the schema to register.
 * @param {SchemaConstructor} schema - The schema constructor.
 * @ignore
 */
function registerSchema(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TypeRegistry: any,
  name: string,
  schema: SchemaConstructor
): void {
  try {
    if (typeof TypeRegistry.register === 'function') {
      TypeRegistry.register(name, schema);
    } else if (typeof TypeRegistry.add === 'function') {
      TypeRegistry.add(name, schema);
    } else if (typeof TypeRegistry.set === 'function') {
      TypeRegistry.set(name, schema);
    } else if (typeof TypeRegistry === 'object') {
      TypeRegistry[name] = schema;
    } else {
      console.warn(`⚠️ Unknown TypeRegistry interface - cannot register ${name}`);
      return;
    }
    console.log(`✅ ${name} registered in TypeRegistry.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`⚠️ Failed to register ${name}:`, message);
  }
}

/**
 * Registers ArraySchema and MapSchema with the Colyseus TypeRegistry.
 * This prevents warnings about unregistered container types.
 * @returns {Promise<void>}
 * @ignore
 */
async function registerContainerTypes(): Promise<void> {
  try {
    const TypeRegistry = await findTypeRegistry();
    if (!TypeRegistry) {
      console.warn('⚠️ TypeRegistry not found - cannot register container types.');
      return;
    }

    const schemas: [string, SchemaConstructor][] = [
      ['ArraySchema', ArraySchema as SchemaConstructor],
      ['MapSchema', MapSchema as SchemaConstructor],
    ];

    for (const [name, schema] of schemas) {
      if (!schema[Symbol.metadata]) {
        schema[Symbol.metadata] = { properties: {}, indexes: {}, schemas: {} };
      }
      registerSchema(TypeRegistry, name, schema);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to register container types: ${message}`);
  }
}

/**
 * Applies the `@entity` decorator to ArraySchema and MapSchema as a fallback.
 * This can also help satisfy Colyseus's registration requirements.
 * @returns {Promise<void>}
 * @ignore
 */
async function applyEntityDecorators(): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const schemaModule: any = await import('@colyseus/schema');
    const entity = schemaModule.entity;

    if (typeof entity === 'function') {
      entity(ArraySchema);
      console.log('✅ @entity decorator applied to ArraySchema');
      entity(MapSchema);
      console.log('✅ @entity decorator applied to MapSchema');
    } else {
      console.warn('⚠️ Could not find @entity decorator to apply.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to apply entity decorators: ${message}`);
  }
}

/**
 * Applies a comprehensive fix to prevent Colyseus schema registration warnings.
 * It first tries to register container types directly and then applies entity decorators.
 * This function is executed automatically when the module is imported.
 *
 * @export
 * @returns {Promise<void>}
 */
export async function applyArraySchemaRegistryFix(): Promise<void> {
  console.log('🛠️ Applying definitive ArraySchema/MapSchema registration fix...');
  await registerContainerTypes();
  await applyEntityDecorators();
  console.log('✅ Definitive schema registration fix applied.');
}

// Automatically apply the fix when this module is imported.
applyArraySchemaRegistryFix().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`❌ Fatal error applying ArraySchema/MapSchema fix: ${message}`);
});
