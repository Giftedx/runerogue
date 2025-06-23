import { Schema, type } from "@colyseus/schema";

/**
 * @class SpecialAttackSchema
 * @description Represents the special attack energy of a player.
 * @author The Architect
 */
export class SpecialAttackSchema extends Schema {
  @type("number") current: number = 100;
  @type("number") max: number = 100;
  @type("boolean") isEnabled: boolean = false;
}
