import { Schema, type } from "@colyseus/schema";

/**
 * @class EquipmentSchema
 * @description Represents the equipped items of a player.
 * Each slot holds the ID of the equipped item.
 * @author The Architect
 */
export class EquipmentSchema extends Schema {
  @type("string") head = "";
  @type("string") cape = "";
  @type("string") neck = "";
  @type("string") ammo = "";
  @type("string") weapon = "";
  @type("string") body = "";
  @type("string") shield = "";
  @type("string") legs = "";
  @type("string") hands = "";
  @type("string") feet = "";
  @type("string") ring = "";
}
