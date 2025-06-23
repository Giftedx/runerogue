import { Schema, type } from "@colyseus/schema";
import { ItemSchema } from "./ItemSchema";
import { fixSchemaMetadata } from "../utils/schemaCompat";

export class EquipmentSchema extends Schema {
  @type(ItemSchema) weapon = new ItemSchema();
  @type(ItemSchema) helmet = new ItemSchema();
  @type(ItemSchema) chest = new ItemSchema();
  @type(ItemSchema) legs = new ItemSchema();
  // Add other slots as needed
}

// Apply metadata compatibility fix
fixSchemaMetadata(EquipmentSchema);
