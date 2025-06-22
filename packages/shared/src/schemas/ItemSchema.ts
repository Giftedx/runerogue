import { Schema, type } from "@colyseus/schema";
import { EquipmentBonusesSchema } from "./EquipmentBonusesSchema";

export class ItemSchema extends Schema {
  @type("number") id = 0;
  @type("string") name = "";
  @type("string") examine = "";
  @type("string") equipmentSlot = "";
  @type(EquipmentBonusesSchema) bonuses = new EquipmentBonusesSchema();
  @type("number") attackSpeed = 5;
  @type("number") attackRange = 1;
}
