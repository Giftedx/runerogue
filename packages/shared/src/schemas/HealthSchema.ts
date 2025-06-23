import { Schema, type } from "@colyseus/schema";

/**
 * @class HealthSchema
 * @description Represents the health points of an entity (player or enemy).
 * @author The Architect
 */
export class HealthSchema extends Schema {
  @type("number") current: number = 10;
  @type("number") max: number = 10;
  @type("number") level: number = 1;
}
