/**
 * @file schemaCompat.ts
 * @author The Architect
 * @date 2025-06-23
 * @description Comprehensive and robust solution for Colyseus schema metadata compatibility issues.
 * This utility provides a single function, `fixSchemaHierarchy`, to recursively patch
 * the metadata of all schema classes, including nested schemas within `MapSchema` and `ArraySchema`.
 * This is necessary to bridge the gap between newer `@colyseus/schema` versions that use
 * `Symbol(Symbol.metadata)` and the Colyseus server internals that still expect a `.metadata` property.
 */

import { Schema, ArraySchema, MapSchema } from "@colyseus/schema";

/**
 * A Set to keep track of already processed schema classes to avoid infinite recursion.
 * @type {Set<any>}
 */
const visited = new Set<any>();

/**
 * Copies the metadata from `Symbol(Symbol.metadata)` to a `.metadata` property
 * on a given class constructor. This is the core of the compatibility fix.
 *
 * @param {any} SchemaClass - The class (e.g., PlayerSchema, ArraySchema) to patch.
 */
function applyMetadataFix(SchemaClass: any): void {
  if (!SchemaClass || typeof SchemaClass !== "function") return;

  try {
    const symbolMetadata = SchemaClass[Symbol.metadata];
    if (symbolMetadata && !SchemaClass.metadata) {
      SchemaClass.metadata = symbolMetadata;
    }
  } catch (error) {
    // Ignore errors, as some classes might not have these properties.
  }
}

/**
 * Recursively traverses the entire schema hierarchy starting from a root schema,
 * applying the metadata compatibility fix to every discovered schema class,
 * including `ArraySchema` and `MapSchema`.
 *
 * This is the ONLY function that needs to be called. It should be called once,
 * at runtime, before the server starts listening for connections. The best place
is in the `GameRoom.onCreate()` method.
 *
 * @param {typeof Schema} RootSchema - The top-level schema class (e.g., GameRoomState).
 */
export function fixSchemaHierarchy(RootSchema: typeof Schema): void {
  if (visited.has(RootSchema)) {
    return;
  }
  visited.add(RootSchema);

  // 1. Fix the root schema itself
  applyMetadataFix(RootSchema);

  // 2. Fix ArraySchema and MapSchema globally, as they are used by the root
  applyMetadataFix(ArraySchema);
  applyMetadataFix(MapSchema);

  // 3. Introspect the schema's definition to find and fix all nested schemas
  const definition =
    (RootSchema as any)._definition || (RootSchema as any).metadata;
  if (!definition || !definition.fields) {
    return;
  }

  for (const field of definition.fields) {
    let fieldType = field.type;

    // Handle collection types (maps and arrays)
    if (typeof fieldType === "object" && (fieldType.map || fieldType.array)) {
      fieldType = fieldType.map || fieldType.array;
    }

    // If the field type is a valid Schema subclass, recurse into it
    if (
      fieldType &&
      typeof fieldType === "function" &&
      fieldType.prototype instanceof Schema &&
      !visited.has(fieldType)
    ) {
      fixSchemaHierarchy(fieldType as typeof Schema);
    }
  }
}
