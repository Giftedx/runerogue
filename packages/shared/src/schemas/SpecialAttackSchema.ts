import { Schema, type } from "@colyseus/schema";
import { fixSchemaMetadata } from "../utils/schemaCompat";

export class SpecialAttackSchema extends Schema {
  @type("number") energy = 100;
  @type("boolean") available = true;
}

// Apply metadata compatibility fix
fixSchemaMetadata(SpecialAttackSchema);
