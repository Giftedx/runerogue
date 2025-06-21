import { Schema, MapSchema, ArraySchema, type } from "@colyseus/schema";
import { Vector2, ItemData, Equipment } from "../types/game";

/**
 * COLYSEUS SCHEMAS FOR NETWORK SYNCHRONIZATION
 * These MUST stay perfectly in sync with shared types
 * DO NOT modify without updating shared types too
 */

export class Vector2Schema extends Schema implements Vector2 {
  @type("number") x = 0;
  @type("number") y = 0;
}

export class HealthSchema extends Schema {
  @type("number") current = 10;
  @type("number") max = 10;
}

/**
 * Represents a skill with its level, experience, and boosted level.
 * This schema is used for network synchronization.
 */
export class SkillSchema extends Schema {
  @type("number") level = 1;
  @type("number") xp = 0;
  @type("number") boosted = 0;
}

/**
 * Defines the combat statistics for a player or NPC, following OSRS structure.
 * This schema is used for network synchronization.
 */
export class CombatStatsSchema extends Schema {
  @type(SkillSchema) attack = new SkillSchema();
  @type(SkillSchema) strength = new SkillSchema();
  @type(SkillSchema) defence = new SkillSchema();
  @type(SkillSchema) hitpoints = new SkillSchema();
  @type(SkillSchema) ranged = new SkillSchema();
  @type(SkillSchema) prayer = new SkillSchema();
  @type(SkillSchema) magic = new SkillSchema();
}

/**
 * Defines the equipment bonuses for an item, following OSRS structure.
 * This schema is used for network synchronization.
 */
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

export class EquipmentSchema extends Schema implements Equipment {
  @type(ItemSchema) weapon?: ItemSchema = new ItemSchema();
  @type(ItemSchema) helmet?: ItemSchema = new ItemSchema();
  @type(ItemSchema) chest?: ItemSchema = new ItemSchema();
  @type(ItemSchema) legs?: ItemSchema = new ItemSchema();
  // Add other slots as needed
}

export class PrayerSchema extends Schema {
  @type("number") points = 1;
  @type(["string"]) activePrayers = new ArraySchema<string>();
  @type("number") drainRate = 0;
}

export class SpecialAttackSchema extends Schema {
  @type("number") energy = 100;
  @type("boolean") available = true;
}

export class PlayerSchema extends Schema {
  @type("string") id = "";
  @type("string") name = "";
  @type(Vector2Schema) position = new Vector2Schema();
  @type(HealthSchema) health = new HealthSchema();
  @type(CombatStatsSchema) stats = new CombatStatsSchema();
  @type(EquipmentSchema) equipment = new EquipmentSchema();
  @type(PrayerSchema) prayer = new PrayerSchema();
  @type(SpecialAttackSchema) specialAttack = new SpecialAttackSchema();
  @type("number") lastAttackTick = 0;
  @type("number") ecsId = 0;
}

export class EnemySchema extends Schema {
  @type("string") id = "";
  @type("string") type = "goblin";
  @type(Vector2Schema) position = new Vector2Schema();
  @type(HealthSchema) health = new HealthSchema();
  @type(CombatStatsSchema) stats = new CombatStatsSchema();
  @type(EquipmentBonusesSchema) bonuses = new EquipmentBonusesSchema();
  @type("number") aggroRange = 5;
  @type("string") target = "";
  @type("number") lastAttackTick = 0;
}

export class WaveSchema extends Schema {
  @type("number") number = 0;
  @type("number") remainingEnemies = 0;
  @type("number") nextSpawnTime = 0;
}

export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: EnemySchema }) enemies = new MapSchema<EnemySchema>();
  @type(WaveSchema) wave = new WaveSchema();
}
