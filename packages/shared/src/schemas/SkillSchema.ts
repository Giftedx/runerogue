import { Schema, type } from "@colyseus/schema";

export class SkillSchema extends Schema {
  @type("number") level = 1;
  @type("number") xp = 0;
  @type("number") boosted = 0;
}
