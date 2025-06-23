import { Schema, type } from "@colyseus/schema";
import { fixSchemaMetadata } from "../utils/schemaCompat";

export class SkillSchema extends Schema {
  @type("number") level = 1;
  @type("number") xp = 0;
  @type("number") boosted = 0;
}

// Apply metadata compatibility fix
fixSchemaMetadata(SkillSchema);
