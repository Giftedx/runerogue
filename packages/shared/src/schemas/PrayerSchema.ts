import { Schema, ArraySchema, type } from "@colyseus/schema";

export class PrayerSchema extends Schema {
  @type("number") points = 1;
  @type(["string"]) activePrayers = new ArraySchema<string>();
  @type("number") drainRate = 0;
}
