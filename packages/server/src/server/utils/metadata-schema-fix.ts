/**
 * Critical fix for Colyseus Schema Symbol.metadata issues
 *
 * This addresses the core issue: "Cannot read properties of undefined (reading 'Symbol(Symbol.metadata)')"
 * happening in encodeValue() in Colyseus EncodeOperation.ts
 */

import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';
import 'reflect-metadata';

// Ensure Symbol.metadata exists globally
if (!Symbol.metadata) {
  (Symbol as unknown as { metadata: symbol }).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Ensures a class constructor has the Symbol.metadata property
 */
function ensureMetadata(constructor: unknown): void {
  if (!constructor) return;

  const ctor = constructor as Record<symbol, unknown>;

  // Check if Symbol.metadata already exists
  if (!ctor[Symbol.metadata]) {
    // Create a basic metadata object that Colyseus expects
    ctor[Symbol.metadata] = {
      properties: {},
      indexes: {},
      schemas: {},
    };
  }
}

/**
 * Patches a schema class to ensure it has Symbol.metadata
 */
function patchSchemaClass(SchemaClass: unknown): void {
  if (!SchemaClass) return;

  const SchemaConstructor = SchemaClass as {
    prototype?: { constructor: Record<symbol, unknown> };
  } & Record<symbol, unknown>;

  if (!SchemaConstructor.prototype) return;

  // Ensure the constructor has metadata
  ensureMetadata(SchemaConstructor);

  // Ensure instances will have metadata
  if (!SchemaConstructor.prototype.constructor[Symbol.metadata]) {
    SchemaConstructor.prototype.constructor[Symbol.metadata] = SchemaConstructor[Symbol.metadata];
  }
}

// Apply the patches to core Colyseus classes
patchSchemaClass(Schema);
patchSchemaClass(ArraySchema);
patchSchemaClass(MapSchema);

// Export the patching function for use on custom schema classes
export { ensureMetadata, patchSchemaClass };

console.log('✅ Schema metadata fix applied');
