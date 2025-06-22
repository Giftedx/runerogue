import { defineComponent, Types } from "bitecs";

/**
 * OSRS-authentic combat stats component.
 * Contains all the combat-related stats that match OSRS exactly.
 *
 * All levels are 1-99 (or 126 for combat level).
 * All bonuses can be negative to positive values.
 */
export const CombatStats = defineComponent({
  // Core combat levels (1-99)
  attackLevel: Types.ui8,
  strengthLevel: Types.ui8,
  defenceLevel: Types.ui8,
  rangedLevel: Types.ui8,
  magicLevel: Types.ui8,
  hitpointsLevel: Types.ui8,
  prayerLevel: Types.ui8,

  // Equipment bonuses (can be negative)
  attackBonus: Types.i16,
  strengthBonus: Types.i16,
  defenceBonus: Types.i16,
  rangedBonus: Types.i16,
  rangedStrengthBonus: Types.i16,
  magicBonus: Types.i16,
  magicDamageBonus: Types.i16,
  prayerBonus: Types.i16,

  // Combat style settings
  combatStyle: Types.ui8, // AttackStyle enum value
  combatType: Types.ui8, // CombatType enum value (melee/ranged/magic)
});

export default CombatStats;
