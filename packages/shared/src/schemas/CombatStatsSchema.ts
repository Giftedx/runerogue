import { Schema, type } from "@colyseus/schema";
import { SkillSchema } from "./SkillSchema";
import { fixSchemaMetadata } from "../utils/schemaCompat";

export class CombatStatsSchema extends Schema {
  @type(SkillSchema) attack = new SkillSchema();
  @type(SkillSchema) strength = new SkillSchema();
  @type(SkillSchema) defence = new SkillSchema();
  @type(SkillSchema) hitpoints = new SkillSchema();
  @type(SkillSchema) ranged = new SkillSchema();
  @type(SkillSchema) prayer = new SkillSchema();
  @type(SkillSchema) magic = new SkillSchema();
}

// Apply metadata compatibility fix
fixSchemaMetadata(CombatStatsSchema);
