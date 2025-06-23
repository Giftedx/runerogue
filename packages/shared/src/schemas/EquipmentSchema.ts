import { Schema, type } from "@colyseus/schema";

/**
 * @class EquipmentSchema
 * @description Represents the equipped items of a player.
 * Each slot holds the ID of the equipped item.
 * @author The Architect
 */
export class EquipmentSchema extends Schema {
  @type("string") head: string = "";
  @type("string") cape: string = "";
  @type("string") neck: string = "";
  @type("string") ammo: string = "";
  @type("string") weapon: string = "";
  @type("string") body: string = "";
  @type("string") shield: string = "";
  @type("string") legs: string = "";
  @type("string") hands: string = "";
  @type("string") feet: string = "";
  @type("string") ring: string = "";
}
