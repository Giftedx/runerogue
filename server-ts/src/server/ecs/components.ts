import { Types, defineComponent } from 'bitecs';

// ============================================
// Core Components
// ============================================

/**
 * Transform Component - Position and rotation in world space
 */
export const Transform = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
  rotation: Types.f32,
});

/**
 * Health Component - Current and max health with regeneration
 */
export const Health = defineComponent({
  current: Types.ui16,
  max: Types.ui16,
  regenRate: Types.f32,
});

/**
 * Combat Stats Component - Core combat attributes
 */
export const CombatStats = defineComponent({
  attack: Types.ui8,
  strength: Types.ui8,
  defence: Types.ui8,
  attackBonus: Types.i16,
  strengthBonus: Types.i16,
  defenceBonus: Types.i16,
});

/**
 * Equipment Component - References to equipped items
 */
export const Equipment = defineComponent({
  weapon: Types.eid,
  armor: Types.eid,
  shield: Types.eid,
  helmet: Types.eid,
  boots: Types.eid,
  gloves: Types.eid,
  cape: Types.eid,
  ring: Types.eid,
  amulet: Types.eid,
});

/**
 * Skills Component - All OSRS skills (current levels)
 */
export const Skills = defineComponent({
  attack: Types.ui8,
  strength: Types.ui8,
  defence: Types.ui8,
  ranged: Types.ui8,
  prayer: Types.ui8,
  magic: Types.ui8,
  runecrafting: Types.ui8,
  hitpoints: Types.ui8,
  crafting: Types.ui8,
  mining: Types.ui8,
  smithing: Types.ui8,
  fishing: Types.ui8,
  cooking: Types.ui8,
  firemaking: Types.ui8,
  woodcutting: Types.ui8,
  agility: Types.ui8,
  herblore: Types.ui8,
  thieving: Types.ui8,
  fletching: Types.ui8,
  slayer: Types.ui8,
  farming: Types.ui8,
  construction: Types.ui8,
  hunter: Types.ui8,
});

/**
 * Skill Experience Component - XP for all skills
 */
export const SkillExperience = defineComponent({
  attackXP: Types.ui32,
  strengthXP: Types.ui32,
  defenceXP: Types.ui32,
  rangedXP: Types.ui32,
  prayerXP: Types.ui32,
  magicXP: Types.ui32,
  runecraftingXP: Types.ui32,
  hitpointsXP: Types.ui32,
  craftingXP: Types.ui32,
  miningXP: Types.ui32,
  smithingXP: Types.ui32,
  fishingXP: Types.ui32,
  cookingXP: Types.ui32,
  firemakingXP: Types.ui32,
  woodcuttingXP: Types.ui32,
  agilityXP: Types.ui32,
  herbloreXP: Types.ui32,
  thievingXP: Types.ui32,
  fletchingXP: Types.ui32,
  slayerXP: Types.ui32,
  farmingXP: Types.ui32,
  constructionXP: Types.ui32,
  hunterXP: Types.ui32,
});

/**
 * Inventory Component - 28 slot OSRS inventory
 * Note: Using separate arrays for slots and quantities
 */
export const Inventory = defineComponent({
  // Item entity IDs for each slot (0 = empty)
  slot0: Types.eid,
  slot1: Types.eid,
  slot2: Types.eid,
  slot3: Types.eid,
  slot4: Types.eid,
  slot5: Types.eid,
  slot6: Types.eid,
  slot7: Types.eid,
  slot8: Types.eid,
  slot9: Types.eid,
  slot10: Types.eid,
  slot11: Types.eid,
  slot12: Types.eid,
  slot13: Types.eid,
  slot14: Types.eid,
  slot15: Types.eid,
  slot16: Types.eid,
  slot17: Types.eid,
  slot18: Types.eid,
  slot19: Types.eid,
  slot20: Types.eid,
  slot21: Types.eid,
  slot22: Types.eid,
  slot23: Types.eid,
  slot24: Types.eid,
  slot25: Types.eid,
  slot26: Types.eid,
  slot27: Types.eid,
  
  // Quantities for each slot
  qty0: Types.ui16,
  qty1: Types.ui16,
  qty2: Types.ui16,
  qty3: Types.ui16,
  qty4: Types.ui16,
  qty5: Types.ui16,
  qty6: Types.ui16,
  qty7: Types.ui16,
  qty8: Types.ui16,
  qty9: Types.ui16,
  qty10: Types.ui16,
  qty11: Types.ui16,
  qty12: Types.ui16,
  qty13: Types.ui16,
  qty14: Types.ui16,
  qty15: Types.ui16,
  qty16: Types.ui16,
  qty17: Types.ui16,
  qty18: Types.ui16,
  qty19: Types.ui16,
  qty20: Types.ui16,
  qty21: Types.ui16,
  qty22: Types.ui16,
  qty23: Types.ui16,
  qty24: Types.ui16,
  qty25: Types.ui16,
  qty26: Types.ui16,
  qty27: Types.ui16,
});

/**
 * Item Component - Represents an item
 */
export const Item = defineComponent({
  itemId: Types.ui16,      // OSRS item ID
  quantity: Types.ui16,    // Stack size
  noted: Types.ui8,        // 0 = normal, 1 = noted
  charges: Types.ui16,     // For degradable items
});

/**
 * NPC Data Component
 */
export const NPCData = defineComponent({
  npcId: Types.ui16,       // OSRS NPC ID
  combatLevel: Types.ui8,
  aggroRange: Types.ui8,
  attackRange: Types.ui8,
  attackSpeed: Types.ui8,
  respawnTime: Types.ui16,
});

/**
 * Movement Component - Velocity and target position
 */
export const Movement = defineComponent({
  velocityX: Types.f32,
  velocityY: Types.f32,
  speed: Types.f32,
  targetX: Types.f32,
  targetY: Types.f32,
});

/**
 * Active Prayers Component - Using bitflags for efficiency
 */
export const ActivePrayers = defineComponent({
  prayers: Types.ui32,  // Each bit represents a prayer
});

/**
 * Network Entity Component - For multiplayer sync
 */
export const NetworkEntity = defineComponent({
  sessionHash: Types.ui32,  // Hashed session ID
  lastUpdate: Types.f64,    // Timestamp
});

/**
 * Loot Drop Component - For items on the ground
 */
export const LootDrop = defineComponent({
  ownerId: Types.eid,      // Player who can pick it up
  despawnTime: Types.f64,  // When it despawns
  x: Types.f32,
  y: Types.f32,
});

/**
 * Resource Component - For gathering nodes
 */
export const Resource = defineComponent({
  resourceType: Types.ui8,   // 0=tree, 1=rock, 2=fishing spot, etc
  resourceId: Types.ui16,    // Specific resource ID
  remainingYield: Types.ui8, // How many gathers left
  respawnTime: Types.f32,   // Time to respawn after depletion
});

// ============================================
// Tag Components (no data, just markers)
// ============================================

export const Player = defineComponent();
export const NPC = defineComponent();
export const Monster = defineComponent();
export const Projectile = defineComponent();
export const Dead = defineComponent();
export const Respawning = defineComponent();
export const InCombat = defineComponent();
export const Gathering = defineComponent();

// ============================================
// Prayer Flags
// ============================================

export enum PrayerFlag {
  // Level 1 prayers
  THICK_SKIN = 1 << 0,
  BURST_OF_STRENGTH = 1 << 1,
  CLARITY_OF_THOUGHT = 1 << 2,
  SHARP_EYE = 1 << 3,
  MYSTIC_WILL = 1 << 4,
  
  // Level 4+ prayers
  ROCK_SKIN = 1 << 5,
  SUPERHUMAN_STRENGTH = 1 << 6,
  IMPROVED_REFLEXES = 1 << 7,
  
  // Protection prayers
  PROTECT_FROM_MAGIC = 1 << 8,
  PROTECT_FROM_MISSILES = 1 << 9,
  PROTECT_FROM_MELEE = 1 << 10,
  
  // Higher level prayers
  EAGLE_EYE = 1 << 11,
  MYSTIC_MIGHT = 1 << 12,
  STEEL_SKIN = 1 << 13,
  ULTIMATE_STRENGTH = 1 << 14,
  INCREDIBLE_REFLEXES = 1 << 15,
  
  // Advanced prayers
  PIETY = 1 << 16,
  CHIVALRY = 1 << 17,
  RIGOUR = 1 << 18,
  AUGURY = 1 << 19,
  
  // Additional prayers can be added up to bit 31
}

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a prayer is active
 */
export function isPrayerActive(prayers: number, flag: PrayerFlag): boolean {
  return (prayers & flag) !== 0;
}

/**
 * Activate a prayer
 */
export function activatePrayer(prayers: number, flag: PrayerFlag): number {
  return prayers | flag;
}

/**
 * Deactivate a prayer
 */
export function deactivatePrayer(prayers: number, flag: PrayerFlag): number {
  return prayers & ~flag;
}

/**
 * Toggle a prayer
 */
export function togglePrayer(prayers: number, flag: PrayerFlag): number {
  return prayers ^ flag;
}