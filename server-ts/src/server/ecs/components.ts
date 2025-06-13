import { Types, defineComponent } from 'bitecs';

// ============================================
// Core Components
// ============================================

/**
 * Position Component - 2D world position
 */
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
  z: Types.f32,
  rotation: Types.f32,
});

/**
 * Transform Component - Alternative name for Position (used by many systems)
 */
export const Transform = Position;

/**
 * Health Component - Current and max HP
 */
export const Health = defineComponent({
  current: Types.ui16,
  max: Types.ui16,
  regenRate: Types.f32,
});

/**
 * Skill Levels Component - All OSRS combat skills (level)
 */
/**
 * SkillLevels Component - All 23 OSRS skills (level)
 * Order and names must match OSRS exactly for authenticity.
 */
export const SkillLevels = defineComponent({
  attack: Types.ui8,
  defence: Types.ui8,
  strength: Types.ui8,
  hitpoints: Types.ui8,
  ranged: Types.ui8,
  prayer: Types.ui8,
  magic: Types.ui8,
  cooking: Types.ui8,
  woodcutting: Types.ui8,
  fletching: Types.ui8,
  fishing: Types.ui8,
  firemaking: Types.ui8,
  crafting: Types.ui8,
  smithing: Types.ui8,
  mining: Types.ui8,
  herblore: Types.ui8,
  agility: Types.ui8,
  thieving: Types.ui8,
  slayer: Types.ui8,
  farming: Types.ui8,
  runecraft: Types.ui8,
  hunter: Types.ui8,
  construction: Types.ui8,
});

/**
 * Skills Component - Alternative name for SkillLevels (used by some systems)
 */
export const Skills = SkillLevels;

/**
 * Skill XP Component - All OSRS combat skills (xp)
 */
/**
 * SkillXP Component - All 23 OSRS skills (xp)
 * Order and names must match OSRS exactly for authenticity.
 */
export const SkillXP = defineComponent({
  attack: Types.ui32,
  defence: Types.ui32,
  strength: Types.ui32,
  hitpoints: Types.ui32,
  ranged: Types.ui32,
  prayer: Types.ui32,
  magic: Types.ui32,
  cooking: Types.ui32,
  woodcutting: Types.ui32,
  fletching: Types.ui32,
  fishing: Types.ui32,
  firemaking: Types.ui32,
  crafting: Types.ui32,
  smithing: Types.ui32,
  mining: Types.ui32,
  herblore: Types.ui32,
  agility: Types.ui32,
  thieving: Types.ui32,
  slayer: Types.ui32,
  farming: Types.ui32,
  runecraft: Types.ui32,
  hunter: Types.ui32,
  construction: Types.ui32,
});

/**
 * SkillExperience Component - Alternative name for SkillXP (used by some systems)
 */
export const SkillExperience = SkillXP;

/**
 * EquipmentBonuses Component - OSRS equipment bonuses
 */
export const EquipmentBonuses = defineComponent({
  attackStab: Types.i16,
  attackSlash: Types.i16,
  attackCrush: Types.i16,
  attackMagic: Types.i16,
  attackRanged: Types.i16,
  defenceStab: Types.i16,
  defenceSlash: Types.i16,
  defenceCrush: Types.i16,
  defenceMagic: Types.i16,
  defenceRanged: Types.i16,
  meleeStrength: Types.i16,
  rangedStrength: Types.i16,
  magicDamage: Types.i16,
  prayer: Types.i16,
});

/**
 * Equipment Component - All OSRS equipment slots (item entity IDs)
 */
export const Equipment = defineComponent({
  weapon: Types.eid,
  helmet: Types.eid,
  chest: Types.eid,
  legs: Types.eid,
  shield: Types.eid,
  gloves: Types.eid,
  boots: Types.eid,
  ring: Types.eid,
  amulet: Types.eid,
});

/**
 * Prayer Component - Prayer points, active prayers (bitmask), drain rate
 */
export const Prayer = defineComponent({
  points: Types.ui8,
  activeMask: Types.ui32, // Bitmask for active prayers
  drainRate: Types.f32,
  drainTimer: Types.f32,
  level: Types.ui8,
});

/**
 * SpecialAttack Component - Energy and cooldown
 */
export const SpecialAttack = defineComponent({
  energy: Types.ui8,
  cooldownTimer: Types.f32,
});

/**
 * Target Component - Target entity ID
 */
export const Target = defineComponent({
  id: Types.eid,
});

/**
 * AttackTimer Component - Weapon cooldown and last attack tick
 */
export const AttackTimer = defineComponent({
  cooldown: Types.f32,
  lastAttack: Types.ui32,
});

/**
 * Input Component - Movement and attack input
 */
export const Input = defineComponent({
  moveX: Types.f32,
  moveY: Types.f32,
  isMoving: Types.ui8,
  isAttacking: Types.ui8,
});

/**
 * Velocity Component - For movement system
 */
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
  maxSpeed: Types.f32,
});

/**
 * Name Component - Player or enemy name (index into string table or external map)
 */
export const Name = defineComponent({
  value: Types.ui32, // Use a string table or external map for actual string
});

/**
 * CombatState Component - In-combat timer
 */
export const CombatState = defineComponent({
  inCombatTimer: Types.f32,
});

/**
 * Enemy Component - Enemy type (index or enum)
 */
export const Enemy = defineComponent({
  type: Types.ui8, // Index into EnemyType array
});

/**
 * AI Component - Aggro range, etc.
 */
export const AI = defineComponent({
  aggroRange: Types.f32,
});

/**
 * Dead Component - Marks entity as dead
 */
export const Dead = defineComponent({
  timer: Types.f32,
});

/**
 * WaveState Component - For wave spawning
 */
export const WaveState = defineComponent({
  currentWave: Types.ui16,
  enemiesToSpawn: Types.ui16,
  spawnTimer: Types.f32,
});

/**
 * ResourceNode Component - for all resource nodes (trees, rocks, fishing spots, etc.)
 * type: string (e.g. 'tree', 'oak_tree', 'fishing_spot', 'copper_rock')
 * depleted: 0 (active) or 1 (depleted)
 * respawnTimer: ticks until respawn
 */
export const ResourceNode = defineComponent({
  type: Types.ui16, // index into resource type table
  depleted: Types.ui8,
  respawnTimer: Types.ui16,
});

/**
 * Gathering Component - marks a player as gathering a resource node
 * target: entityId of the resource node
 */
export const Gathering = defineComponent({
  target: Types.eid,
});

/**
 * Inventory Component - manages player inventory (itemId -> quantity)
 * This is a placeholder; real implementation should be a map or array.
 */
export const Inventory = {
  hasItem: (_playerId: number, _itemId: string) => true, // TODO: implement
  addItem: (_playerId: number, _itemId: string, _qty: number) => {}, // TODO: implement
  removeItem: (_playerId: number, _itemId: string, _qty: number) => {}, // TODO: implement
};

/**
 * Movement Component - Velocity and movement state
 */
export const Movement = defineComponent({
  velocityX: Types.f32,
  velocityY: Types.f32,
  speed: Types.f32,
  isMoving: Types.ui8,
  targetX: Types.f32,
  targetY: Types.f32,
});

/**
 * NetworkEntity Component - For network synchronization
 */
export const NetworkEntity = defineComponent({
  sessionId: Types.ui32,
  lastUpdate: Types.ui32,
  dirty: Types.ui8,
  sessionHash: Types.ui32,
});

/**
 * CombatStats Component - Combat bonuses and stats
 */
export const CombatStats = defineComponent({
  attack: Types.ui8,
  strength: Types.ui8,
  defence: Types.ui8,
  hitpoints: Types.ui8,
  ranged: Types.ui8,
  prayer: Types.ui8,
  magic: Types.ui8,
  attackBonus: Types.i16,
  strengthBonus: Types.i16,
  defenceBonus: Types.i16,
  rangedBonus: Types.i16,
  magicBonus: Types.i16,
});

/**
 * Item Component - Item data and properties
 */
export const Item = defineComponent({
  id: Types.ui32,
  quantity: Types.ui16,
  type: Types.ui16,
  rarity: Types.ui8,
  itemId: Types.ui32,
  noted: Types.ui8,
  charges: Types.ui16,
});

/**
 * LootDrop Component - Dropped loot from enemies
 */
export const LootDrop = defineComponent({
  itemId: Types.ui32,
  quantity: Types.ui16,
  dropTimer: Types.f32,
  playerId: Types.eid,
  ownerId: Types.eid,
  despawnTime: Types.ui32,
  x: Types.f32,
  y: Types.f32,
});

/**
 * NPCData Component - NPC specific data
 */
export const NPCData = defineComponent({
  npcId: Types.ui16,
  spawnX: Types.f32,
  spawnY: Types.f32,
  respawnTimer: Types.f32,
  maxDistance: Types.f32,
  combatLevel: Types.ui8,
  aggroRange: Types.f32,
  attackRange: Types.f32,
  attackSpeed: Types.ui8,
  respawnTime: Types.ui16,
});

/**
 * Resource Component - Resource node data
 */
export const Resource = defineComponent({
  resourceType: Types.ui16,
  maxQuantity: Types.ui16,
  currentQuantity: Types.ui16,
  respawnTime: Types.ui16,
  skillRequired: Types.ui8,
  levelRequired: Types.ui8,
  resourceId: Types.ui32,
  remainingYield: Types.ui16,
});

// ============================================
// Tag Components (no data, just markers)
// ============================================

export const Player = defineComponent();
export const NPC = defineComponent();
export const Monster = defineComponent();
export const Projectile = defineComponent();
// Note: Dead and Gathering are already defined above with data components
export const Respawning = defineComponent();
export const InCombat = defineComponent();

// ============================================
// Prayer Flags
// ============================================

// PrayerFlag as const object for bitmask usage (not enum, for bitecs compatibility)
export const PrayerFlag = {
  THICK_SKIN: 1 << 0,
  BURST_OF_STRENGTH: 1 << 1,
  CLARITY_OF_THOUGHT: 1 << 2,
  SHARP_EYE: 1 << 3,
  MYSTIC_WILL: 1 << 4,
  ROCK_SKIN: 1 << 5,
  SUPERHUMAN_STRENGTH: 1 << 6,
  IMPROVED_REFLEXES: 1 << 7,
  PROTECT_FROM_MAGIC: 1 << 8,
  PROTECT_FROM_MISSILES: 1 << 9,
  PROTECT_FROM_MELEE: 1 << 10,
  EAGLE_EYE: 1 << 11,
  MYSTIC_MIGHT: 1 << 12,
  STEEL_SKIN: 1 << 13,
  ULTIMATE_STRENGTH: 1 << 14,
  INCREDIBLE_REFLEXES: 1 << 15,
  PIETY: 1 << 16,
  CHIVALRY: 1 << 17,
  RIGOUR: 1 << 18,
  AUGURY: 1 << 19,
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a prayer is active
 */
export function isPrayerActive(
  prayers: number,
  flag: (typeof PrayerFlag)[keyof typeof PrayerFlag]
): boolean {
  return (prayers & flag) !== 0;
}

/**
 * Activate a prayer
 */
export function activatePrayer(
  prayers: number,
  flag: (typeof PrayerFlag)[keyof typeof PrayerFlag]
): number {
  return prayers | flag;
}

/**
 * Deactivate a prayer
 */
export function deactivatePrayer(
  prayers: number,
  flag: (typeof PrayerFlag)[keyof typeof PrayerFlag]
): number {
  return prayers & ~flag;
}

/**
 * Toggle a prayer
 */
export function togglePrayer(
  prayers: number,
  flag: (typeof PrayerFlag)[keyof typeof PrayerFlag]
): number {
  return prayers ^ flag;
}
