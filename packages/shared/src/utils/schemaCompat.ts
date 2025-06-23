import { Schema, ArraySchema, MapSchema } from "@colyseus/schema";

/**
 * Fix for Colyseus schema metadata compatibility issue.
 *
 * The newer @colyseus/schema v3.0.42 stores metadata in Symbol(Symbol.metadata)
 * but MapSchema and other Colyseus internals still look for the old metadata property.
 *
 * This function copies the Symbol metadata to the metadata property to maintain compatibility.
 *
 * @param SchemaClass - The Schema class to fix
 */
export function fixSchemaMetadata(SchemaClass: typeof Schema): void {
  try {
    const symbolMetadata = (SchemaClass as any)[Symbol.metadata];
    if (symbolMetadata && !(SchemaClass as any).metadata) {
      (SchemaClass as any).metadata = symbolMetadata;
    }

    // Also ensure _definition exists (fallback for older Colyseus compatibility)
    if (symbolMetadata && !(SchemaClass as any)._definition) {
      (SchemaClass as any)._definition = symbolMetadata;
    }
  } catch (error) {
    console.warn(
      `Failed to fix schema metadata for ${SchemaClass.name}:`,
      error
    );
  }
}

/**
 * Apply metadata fix to multiple schema classes at once
 * @param schemas - Array of Schema classes to fix
 */
export function fixMultipleSchemas(...schemas: (typeof Schema)[]): void {
  schemas.forEach(fixSchemaMetadata);
}

/**
 * Recursively fix all schemas in a hierarchy
 * @param RootSchema - The root schema class to fix along with all its nested schemas
 */
export function fixSchemaHierarchy(RootSchema: typeof Schema): void {
  const visited = new Set<typeof Schema>();

  function fixRecursively(SchemaClass: typeof Schema): void {
    if (visited.has(SchemaClass)) return;
    visited.add(SchemaClass);

    fixSchemaMetadata(SchemaClass);

    // Check for nested schemas in the metadata
    try {
      const metadata =
        (SchemaClass as any)[Symbol.metadata] || (SchemaClass as any).metadata;
      if (metadata && typeof metadata === "object") {
        Object.values(metadata).forEach((fieldDef: any) => {
          if (fieldDef && typeof fieldDef === "object" && fieldDef.type) {
            const nestedType = fieldDef.type;
            if (
              nestedType &&
              typeof nestedType === "function" &&
              nestedType.prototype instanceof Schema
            ) {
              fixRecursively(nestedType);
            }
          }
        });
      }
    } catch (error) {
      // Ignore errors when introspecting metadata
    }
  }

  fixRecursively(RootSchema);
}

/**
 * Fix ArraySchema metadata compatibility
 * @param ArraySchemaClass - The ArraySchema class to fix
 */
export function fixArraySchemaMetadata(
  ArraySchemaClass: typeof ArraySchema
): void {
  try {
    const symbolMetadata = (ArraySchemaClass as any)[Symbol.metadata];
    if (symbolMetadata && !(ArraySchemaClass as any).metadata) {
      (ArraySchemaClass as any).metadata = symbolMetadata;
    }

    if (symbolMetadata && !(ArraySchemaClass as any)._definition) {
      (ArraySchemaClass as any)._definition = symbolMetadata;
    }
  } catch (error) {
    console.warn(`Failed to fix ArraySchema metadata:`, error);
  }
}

/**
 * Fix MapSchema metadata compatibility
 * @param MapSchemaClass - The MapSchema class to fix
 */
export function fixMapSchemaMetadata(MapSchemaClass: typeof MapSchema): void {
  try {
    const symbolMetadata = (MapSchemaClass as any)[Symbol.metadata];
    if (symbolMetadata && !(MapSchemaClass as any).metadata) {
      (MapSchemaClass as any).metadata = symbolMetadata;
    }

    if (symbolMetadata && !(MapSchemaClass as any)._definition) {
      (MapSchemaClass as any)._definition = symbolMetadata;
    }
  } catch (error) {
    console.warn(`Failed to fix MapSchema metadata:`, error);
  }
}

/**
 * Comprehensive schema compatibility fix that handles all schema types
 * @param classes - Mix of Schema, ArraySchema, and MapSchema classes
 */
export function fixAllSchemaTypes(...classes: any[]): void {
  classes.forEach((cls) => {
    if (cls.prototype instanceof Schema) {
      fixSchemaMetadata(cls);
    } else if (cls === ArraySchema) {
      fixArraySchemaMetadata(cls);
    } else if (cls === MapSchema) {
      fixMapSchemaMetadata(cls);
    }
  });
}
