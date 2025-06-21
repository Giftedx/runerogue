import { Schema, type } from "@colyseus/schema";

export class SpecialAttackSchema extends Schema {
  @type("number") energy = 100;
  @type("boolean") available = true;
}
