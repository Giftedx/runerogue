import { Schema, type } from "@colyseus/schema";
import { EquipmentBonusesSchema } from "./EquipmentBonusesSchema";

/**
 * @class ItemSchema
 * @description Represents a single item in the game, including its stats and properties.
 * @author The Architect
 */
export class ItemSchema extends Schema {
  @type("number") id = 0;
  @type("string") name = "";
  @type("string") examine = "";
  @type("string") equipmentSlot = "";
  @type(EquipmentBonusesSchema) bonuses = new EquipmentBonusesSchema();
  @type("number") attackSpeed = 5;
  @type("number") attackRange = 1;
}
