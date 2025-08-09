import { Schema, type } from "@colyseus/schema";

/**
 * @class PrayerSchema
 * @description Represents the prayer points and active prayers of a player.
 * @author The Architect
 */
export class PrayerSchema extends Schema {
  @type("number") current = 1;
  @type("number") max = 1;
  @type("number") level = 1;
  // TODO: Add a map or array for active prayers if needed
}
