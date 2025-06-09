/**
 * Comprehensive fix for Colyseus schema metadata issues
 *
 * This module ensures that Symbol.metadata exists and that schema classes
 * have proper metadata attached before Colyseus tries to encode them.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Ensure Symbol.metadata exists
if (!Symbol.metadata) {
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

// Store original Symbol.metadata for safety
const METADATA_SYMBOL = Symbol.metadata;

/**
 * Patches a schema class to ensure it has metadata
 */
function patchSchemaClass(schemaClass: any, className: string): void {
  if (!schemaClass) {
    console.warn(`[Schema Fix] Cannot patch undefined schema class: ${className}`);
    return;
  }

  // Ensure the class has metadata
  if (!schemaClass[METADATA_SYMBOL]) {
    // Create empty metadata object if none exists
    schemaClass[METADATA_SYMBOL] = new Map();
    console.log(`[Schema Fix] Added empty metadata to ${className}`);
  }

  // Ensure prototype has metadata too (sometimes needed)
  if (schemaClass.prototype && !schemaClass.prototype[METADATA_SYMBOL]) {
    schemaClass.prototype[METADATA_SYMBOL] = schemaClass[METADATA_SYMBOL];
  }
}

/**
 * Apply metadata fixes to all schema classes
 * This should be called before any Colyseus operations
 */
export function applySchemaMetadataFixes(): void {
  console.log('[Schema Fix] Applying schema metadata fixes...');

  try {
    // Import schema classes and patch them
    // Use dynamic import to avoid circular dependencies
    import('../game/EntitySchemas')
      .then(schemas => {
        const schemaClasses = [
          { class: schemas.Skill, name: 'Skill' },
          { class: schemas.Skills, name: 'Skills' },
          { class: schemas.InventoryItem, name: 'InventoryItem' },
          { class: schemas.Equipment, name: 'Equipment' },
          { class: schemas.PlayerPosition, name: 'PlayerPosition' },
          { class: schemas.PlayerStats, name: 'PlayerStats' },
          { class: schemas.Prayer, name: 'Prayer' },
          { class: schemas.PrayerState, name: 'PrayerState' },
          { class: schemas.CombatState, name: 'CombatState' },
          { class: schemas.CombatStats, name: 'CombatStats' },
          { class: schemas.Player, name: 'Player' },
          { class: schemas.NPC, name: 'NPC' },
          { class: schemas.LootDrop, name: 'LootDrop' },
          { class: schemas.GameState, name: 'GameState' },
        ];

        for (const { class: schemaClass, name } of schemaClasses) {
          if (schemaClass) {
            patchSchemaClass(schemaClass, name);
          }
        }

        console.log('[Schema Fix] Schema metadata fixes applied successfully');
      })
      .catch(error => {
        console.warn('[Schema Fix] Failed to import schemas:', error.message);
      });
  } catch (error) {
    console.warn('[Schema Fix] Error applying schema fixes:', error);
  }
}

/**
 * Emergency patch for any constructor that extends Schema
 */
export function patchSchemaConstructor(constructor: any): void {
  if (constructor && typeof constructor === 'function') {
    if (!constructor[METADATA_SYMBOL]) {
      constructor[METADATA_SYMBOL] = new Map();
    }
    if (constructor.prototype && !constructor.prototype[METADATA_SYMBOL]) {
      constructor.prototype[METADATA_SYMBOL] = constructor[METADATA_SYMBOL];
    }
  }
}

// Global patch for Schema base class
const patchSchemaBase = () => {
  try {
    // Patch the base Schema class from Colyseus
    const { Schema } = require('@colyseus/schema');
    if (Schema && !Schema[METADATA_SYMBOL]) {
      Schema[METADATA_SYMBOL] = new Map();
      console.log('[Schema Fix] Patched base Schema class');
    }
  } catch (error) {
    console.warn('[Schema Fix] Could not patch base Schema class:', error.message);
  }
};

// Apply base patch immediately
patchSchemaBase();

// Auto-apply fixes when this module is imported
applySchemaMetadataFixes();

console.log('[Schema Fix] Schema metadata fix module loaded');
