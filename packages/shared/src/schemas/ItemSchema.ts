import { Schema, type } from "@colyseus/schema";
import { ItemData } from "../types/game";
import { EquipmentBonusesSchema } from "./EquipmentBonusesSchema";

export class ItemSchema extends Schema implements ItemData {
  @type("number") id = 0;
  @type("string") name = "";
  @type("string") examine = "";
  @type("string") equipmentSlot?:
    | "weapon"
    | "helmet"
    | "chest"
    | "legs"
    | "shield"
    | "gloves"
    | "boots"
    | "ring"
    | "amulet" = undefined;
  @type(EquipmentBonusesSchema) bonuses = new EquipmentBonusesSchema();
  @type("number") attackSpeed? = 5;
  @type("number") attackRange? = 1;
}
