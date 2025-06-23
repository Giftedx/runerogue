import { Schema, type } from "@colyseus/schema";

/**
 * @class SkillSchema
 * @description Represents a single player skill, including its level and experience.
 * @author The Architect
 */
export class SkillSchema extends Schema {
  @type("number") level = 1;
  @type("number") xp = 0;
  @type("number") boosted = 0;
}
