import { defineComponent, Types } from "bitecs";

// Health component moved to dedicated Health.ts file

/**
 * @description Component for entities that can engage in combat.
 * This includes base stats and bonuses derived from equipment.
 * @property {number} attack - The base attack level.
 * @property {number} strength - The base strength level.
 * @property {number} defence - The base defence level.
 * @property {number} ranged - The base ranged level.
 * @property {number} magic - The base magic level.
 * @property {number} attackBonus - The total attack bonus from equipment.
 * @property {number} strengthBonus - The total strength bonus from equipment.
 * @property {number} defenceBonus - The total defence bonus from equipment.
 * @property {number} rangedStrengthBonus - The total ranged strength bonus from equipment.
 * @property {number} magicBonus - The total magic attack bonus from equipment.
 * @property {number} magicDamageBonus - The total magic damage bonus as a percentage.
 * @property {number} attackSpeed - The time between attacks in milliseconds.
 * @property {number} attackRange - The effective range of attacks.
 * @property {number} lastAttackTime - The timestamp of the last attack.
 * @property {number} damage - The last damage dealt by this entity.
 */
export const Combat = defineComponent({
  // Base Stats
  attack: Types.ui8,
  strength: Types.ui8,
  defence: Types.ui8,
  ranged: Types.ui8,
  magic: Types.ui8,

  // Equipment Bonuses
  attackBonus: Types.i16,
  strengthBonus: Types.i16,
  defenceBonus: Types.i16,
  rangedStrengthBonus: Types.i16,
  magicBonus: Types.i16,
  magicDamageBonus: Types.f32, // Percentage

  /**
   * @property {number} prayerBonus - The total prayer bonus from equipment (for authentic OSRS prayer drain calculations).
   */
  prayerBonus: Types.i16,

  // Combat Settings
  attackSpeed: Types.f32, // Time between attacks in milliseconds
  attackRange: Types.f32,
  lastAttackTime: Types.f32,
  damage: Types.i16, // Last damage dealt
});

// Enemy and Player components moved to dedicated files
// See ./Enemy.ts and ./Player.ts (or use the ones from Combat.ts if they exist)
