import { Schema, type } from "@colyseus/schema";

/**
 * @class CombatStatsSchema
 * @description Represents the combat statistics of a player.
 * These are derived from the player's base levels and equipment bonuses.
 * @author The Architect
 */
export class CombatStatsSchema extends Schema {
  // Base Levels
  @type("number") attack: number = 1;
  @type("number") strength: number = 1;
  @type("number") defence: number = 1;
  @type("number") ranged: number = 1;
  @type("number") magic: number = 1;

  // Attack Bonuses
  @type("number") stab: number = 0;
  @type("number") slash: number = 0;
  @type("number") crush: number = 0;
  @type("number") magic_attack: number = 0;
  @type("number") ranged_attack: number = 0;

  // Defence Bonuses
  @type("number") stab_defence: number = 0;
  @type("number") slash_defence: number = 0;
  @type("number") crush_defence: number = 0;
  @type("number") magic_defence: number = 0;
  @type("number") ranged_defence: number = 0;

  // Other Bonuses
  @type("number") strength_bonus: number = 0;
  @type("number") ranged_strength: number = 0;
  @type("number") magic_damage: number = 0;
  @type("number") prayer_bonus: number = 0;
}
