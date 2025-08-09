import { Schema, type } from "@colyseus/schema";

/**
 * @class SpecialAttackSchema
 * @description Represents the special attack energy of a player.
 * @author The Architect
 */
export class SpecialAttackSchema extends Schema {
  @type("number") current = 100;
  @type("number") max = 100;
  @type("boolean") isEnabled = false;
}
