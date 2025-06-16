/**
 * Enhanced Colyseus Metadata Fix
 *
 * Comprehensive fix for Symbol.metadata and ArraySchema registration issues
 */

// Step 1: Ensure Symbol.metadata exists globally BEFORE any schema imports
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as any).metadata = Symbol.for('Symbol.metadata');
  console.log('✅ Symbol.metadata polyfilled globally');
}

// Step 2: Polyfill Reflect.metadata if needed
if (typeof (globalThis as any).Reflect === 'undefined') {
  (globalThis as any).Reflect = {};
}

if (typeof (globalThis as any).Reflect.metadata === 'undefined') {
  (globalThis as any).Reflect.metadata = function (metadataKey: any, metadataValue: any) {
    return function (target: any, propertyKey?: string | symbol) {
      if (!target[Symbol.metadata]) {
        target[Symbol.metadata] = {};
      }
      if (propertyKey) {
        if (!target[Symbol.metadata][propertyKey]) {
          target[Symbol.metadata][propertyKey] = {};
        }
        target[Symbol.metadata][propertyKey][metadataKey] = metadataValue;
      } else {
        target[Symbol.metadata][metadataKey] = metadataValue;
      }
    };
  };
}

// Step 3: Import schemas after polyfills are in place
import { ArraySchema, MapSchema, Schema } from '@colyseus/schema';

// Step 4: Ensure ArraySchema and MapSchema have proper metadata
function ensureSchemaMetadata(SchemaClass: any) {
  if (!SchemaClass.prototype[Symbol.metadata]) {
    SchemaClass.prototype[Symbol.metadata] = {
      properties: {},
      indexes: {},
      schemas: {},
      definition: {},
      descriptors: {},
      type: undefined,
      fieldsByName: new Map(),
      fieldsByIndex: new Map(),
    };
  }
}

ensureSchemaMetadata(ArraySchema);
ensureSchemaMetadata(MapSchema);
ensureSchemaMetadata(Schema);

console.log('✅ Enhanced metadata polyfill and schema metadata initialized');

// Step 5: Export the enhanced schema classes
export { ArraySchema, MapSchema, Schema };
