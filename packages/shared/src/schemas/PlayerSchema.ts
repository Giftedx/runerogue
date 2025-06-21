import { Schema, type } from "@colyseus/schema";
import { HealthSchema } from "./HealthSchema";
import { CombatStatsSchema } from "./CombatStatsSchema";
import { EquipmentSchema } from "./EquipmentSchema";
import { PrayerSchema } from "./PrayerSchema";
import { SpecialAttackSchema } from "./SpecialAttackSchema";

export class PlayerSchema extends Schema {
  @type("string") name = "Player";
  @type("string") id = "";
  @type("number") x = 400;
  @type("number") y = 300;
  @type("number") ecsId = 0;
  @type(HealthSchema) health = new HealthSchema();
  @type(CombatStatsSchema) stats = new CombatStatsSchema();
  @type(EquipmentSchema) equipment = new EquipmentSchema();
  @type(PrayerSchema) prayer = new PrayerSchema();
  @type(SpecialAttackSchema) specialAttack = new SpecialAttackSchema();
}
