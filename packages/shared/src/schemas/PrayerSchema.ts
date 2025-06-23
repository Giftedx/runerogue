import { Schema, type } from "@colyseus/schema";

/**
 * @class PrayerSchema
 * @description Represents the prayer points and active prayers of a player.
 * @author The Architect
 */
export class PrayerSchema extends Schema {
  @type("number") current: number = 1;
  @type("number") max: number = 1;
  @type("number") level: number = 1;
  // TODO: Add a map or array for active prayers if needed
}
