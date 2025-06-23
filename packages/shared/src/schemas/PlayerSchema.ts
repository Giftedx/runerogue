import { Schema, type } from "@colyseus/schema";
import { EquipmentSchema } from "./EquipmentSchema";
import { HealthSchema } from "./HealthSchema";
import { CombatStatsSchema } from "./CombatStatsSchema";
import { PrayerSchema } from "./PrayerSchema";
import { SpecialAttackSchema } from "./SpecialAttackSchema";

/**
 * @class PlayerSchema
 * @description Represents the state of a player in the game.
 * This includes their position, appearance, equipment, and combat-related stats.
 * This schema is synchronized across all clients.
 * @author The Architect
 */
export class PlayerSchema extends Schema {
  @type("string") sessionId: string = "";
  @type("string") ecsId: string = "";
  @type("string") userId: string = "";
  @type("string") username: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") direction: string = "down";
  @type("boolean") isMoving: boolean = false;

  // Appearance
  @type("string") body: string = "male";
  @type("string") hair: string = "default";
  @type("string") skinColor: string = "#C68642";
  @type("string") hairColor: string = "#000000";

  // Equipment & Stats
  @type(EquipmentSchema) equipment = new EquipmentSchema();
  @type(HealthSchema) health = new HealthSchema();
  @type(CombatStatsSchema) combatStats = new CombatStatsSchema();
  @type(PrayerSchema) prayer = new PrayerSchema();
  @type(SpecialAttackSchema) specialAttack = new SpecialAttackSchema();

  // Player State
  @type("boolean") isConnected: boolean = true;
  @type("boolean") isInCombat: boolean = false;
  @type("string") targetId: string = ""; // ECS ID of the current target
}
