import { Schema, type } from "@colyseus/schema";

export class HealthSchema extends Schema {
  @type("number") current = 10;
  @type("number") max = 10;
}
