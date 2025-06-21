import { defineComponent, Types } from "bitecs";

/**
 * @description Component for entities that have health.
 * @property {number} current - The current health value.
 * @property {number} max - The maximum health value.
 */
export const Health = defineComponent({
  current: Types.i16,
  max: Types.i16,
});

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

  // Combat Settings
  attackSpeed: Types.f32, // Time between attacks in milliseconds
  attackRange: Types.f32,
  lastAttackTime: Types.f32,
  damage: Types.i16, // Last damage dealt
});

/**
 * @description Component to tag an entity as an enemy.
 */
export const Enemy = defineComponent();

/**
 * @description Component to tag an entity as the player.
 */
export const Player = defineComponent();
