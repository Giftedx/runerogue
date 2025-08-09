import { Schema, type } from "@colyseus/schema";

/**
 * @class CombatStatsSchema
 * @description Represents the combat statistics of a player.
 * These are derived from the player's base levels and equipment bonuses.
 * @author The Architect
 */
export class CombatStatsSchema extends Schema {
  // Base Levels
  @type("number") attack = 1;
  @type("number") strength = 1;
  @type("number") defence = 1;
  @type("number") ranged = 1;
  @type("number") magic = 1;

  // Attack Bonuses
  @type("number") stab = 0;
  @type("number") slash = 0;
  @type("number") crush = 0;
  @type("number") magic_attack = 0;
  @type("number") ranged_attack = 0;

  // Defence Bonuses
  @type("number") stab_defence = 0;
  @type("number") slash_defence = 0;
  @type("number") crush_defence = 0;
  @type("number") magic_defence = 0;
  @type("number") ranged_defence = 0;

  // Other Bonuses
  @type("number") strength_bonus = 0;
  @type("number") ranged_strength = 0;
  @type("number") magic_damage = 0;
  @type("number") prayer_bonus = 0;
}
