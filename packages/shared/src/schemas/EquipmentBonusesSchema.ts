import { Schema, type } from "@colyseus/schema";
import { fixSchemaMetadata } from "../utils/schemaCompat";

export class EquipmentBonusesSchema extends Schema {
  @type("number") attackStab = 0;
  @type("number") attackSlash = 0;
  @type("number") attackCrush = 0;
  @type("number") attackMagic = 0;
  @type("number") attackRanged = 0;
  @type("number") defenceStab = 0;
  @type("number") defenceSlash = 0;
  @type("number") defenceCrush = 0;
  @type("number") defenceMagic = 0;
  @type("number") defenceRanged = 0;
  @type("number") meleeStrength = 0;
  @type("number") rangedStrength = 0;
  @type("number") magicDamage = 0;
  @type("number") prayer = 0;
}

// Apply metadata compatibility fix
fixSchemaMetadata(EquipmentBonusesSchema);
