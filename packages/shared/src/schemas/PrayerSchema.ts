import { Schema, ArraySchema, type } from "@colyseus/schema";
import { fixSchemaMetadata, fixAllSchemaTypes } from "../utils/schemaCompat";

export class PrayerSchema extends Schema {
  @type("number") points = 1;
  @type(["string"]) activePrayers = new ArraySchema<string>();
  @type("number") drainRate = 0;
}

// Apply metadata compatibility fix
fixSchemaMetadata(PrayerSchema);

// Fix ArraySchema for activePrayers field
fixAllSchemaTypes(ArraySchema);
