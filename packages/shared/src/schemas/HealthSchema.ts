import { Schema, type } from "@colyseus/schema";
import { fixSchemaMetadata } from "../utils/schemaCompat";

export class HealthSchema extends Schema {
  @type("number") current = 10;
  @type("number") max = 10;
}

// Apply metadata compatibility fix
fixSchemaMetadata(HealthSchema);
