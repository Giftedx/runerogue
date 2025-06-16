/**
 * Schema Class Metadata Patcher
 * Directly adds Symbol.metadata to our schema classes
 */

import 'reflect-metadata';

// Ensure Symbol.metadata exists
if (!Symbol.metadata) {
  (Symbol as any).metadata = Symbol.for('Symbol.metadata');
}

/**
 * Patches a schema class to have proper Symbol.metadata
 */
export function patchSchemaClass(SchemaClass: any): void {
  if (!SchemaClass) return;

  // Add Symbol.metadata if missing
  if (!SchemaClass[Symbol.metadata]) {
    SchemaClass[Symbol.metadata] = null;
  }

  // Also patch the prototype
  if (SchemaClass.prototype && !SchemaClass.prototype[Symbol.metadata]) {
    SchemaClass.prototype[Symbol.metadata] = null;
  }
}

/**
 * Patches all our schema classes
 */
export function patchAllSchemas(): void {
  try {
    // Import after patching Symbol.metadata
    const {
      Player,
      NPC,
      InventoryItem,
      Equipment,
      Skills,
      GameState,
      LootDrop,
      Trade,
    } = require('../game/EntitySchemas');

    // Patch each schema class
    patchSchemaClass(Player);
    patchSchemaClass(NPC);
    patchSchemaClass(InventoryItem);
    patchSchemaClass(Equipment);
    patchSchemaClass(Skills);
    patchSchemaClass(GameState);
    patchSchemaClass(LootDrop);
    patchSchemaClass(Trade);

    console.log('✅ All schema classes patched with Symbol.metadata');
  } catch (error) {
    console.error('❌ Failed to patch schema classes:', error);
  }
}

export const symbolMetadataReady = !!Symbol.metadata;
