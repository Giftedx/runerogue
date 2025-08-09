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
  @type("string") sessionId = "";
  @type("string") ecsId = "";
  @type("string") userId = "";
  @type("string") username = "";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("string") direction = "down";
  @type("boolean") isMoving = false;

  // Appearance
  @type("string") body = "male";
  @type("string") hair = "default";
  @type("string") skinColor = "#C68642";
  @type("string") hairColor = "#000000";

  // Equipment & Stats
  @type(EquipmentSchema) equipment = new EquipmentSchema();
  @type(HealthSchema) health = new HealthSchema();
  @type(CombatStatsSchema) combatStats = new CombatStatsSchema();
  @type(PrayerSchema) prayer = new PrayerSchema();
  @type(SpecialAttackSchema) specialAttack = new SpecialAttackSchema();

  // Player State
  @type("boolean") isConnected = true;
  @type("boolean") isInCombat = false;
  @type("string") targetId = ""; // ECS ID of the current target
}
