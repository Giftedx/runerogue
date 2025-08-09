import { Schema, type } from "@colyseus/schema";

/**
 * @class HealthSchema
 * @description Represents the health points of an entity (player or enemy).
 * @author The Architect
 */
export class HealthSchema extends Schema {
  @type("number") current = 10;
  @type("number") max = 10;
  @type("number") level = 1;
}
