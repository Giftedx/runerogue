import { Schema, type } from "@colyseus/schema";
import { Equipment } from "../types/game";
import { ItemSchema } from "./ItemSchema";

export class EquipmentSchema extends Schema implements Equipment {
  @type(ItemSchema) weapon?: ItemSchema = new ItemSchema();
  @type(ItemSchema) helmet?: ItemSchema = new ItemSchema();
  @type(ItemSchema) chest?: ItemSchema = new ItemSchema();
  @type(ItemSchema) legs?: ItemSchema = new ItemSchema();
  // Add other slots as needed
}
