/**
 * @deprecated LEGACY SCHEMA - This is a simplified, prototype schema.
 * It is not used in the main game and is pending removal.
 * The canonical, up-to-date schemas are in the '@runerogue/shared' package.
 */

/**
 * RuneRogue Game State Schema
 * Colyseus schema for synchronized game state
 *
 * @author agent/backend-infra (The Architect)
 */

import { Schema, MapSchema, type } from "@colyseus/schema";

/**
 * @class Character
 * @classdesc A base schema for any character in the game, player or enemy.
 * It contains common properties like position, health, and combat state.
 * This class is extended by Player and Enemy schemas.
 */
export class Character extends Schema {
  @type("string") id = "";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") health = 10;
  @type("number") maxHealth = 10;

  // Combat state
  @type("number") lastAttackTime = 0;
  @type("string") targetId = "";
  @type("boolean") isDead = false;

  // OSRS Combat Stats
  @type("number") attackLevel = 1;
  @type("number") strengthLevel = 1;
  @type("number") defenceLevel = 1;
  @type("number") hitpointsLevel = 10;
}

export class Player extends Character {
  @type("string") sessionId = "";
  @type("boolean") connected = true;
  @type("number") lastMoveTime = 0;

  // OSRS Combat Stats (Prayer)
  @type("number") prayerLevel = 1;
  @type("number") prayerPoints = 1;

  // Player-specific state
  @type("boolean") isDead = false;
}

export class CombatStats extends Schema {
  @type("string") attackStyle = "controlled";
  @type("number") attackBonus = 0;
  @type("number") strengthBonus = 0;
  @type("number") defenceBonus = 0;
  @type("number") attackLevel = 1;

  // Melee stats
  @type("number") strengthLevel = 1;
  @type("string") weaponType = "unarmed";
  @type("boolean") usingSpecial = false;

  // Defensive stats
  @type("number") defenceLevel = 1;
  @type("number") hitpointsLevel = 10;
  @type("number") prayerLevel = 1;
  @type("number") magicLevel = 1;
}

export class Enemy extends Schema {
  @type("string") id = "";
  @type("boolean") isNPC = true;
  @type("number") entityId = -1;

  // Position
  @type("number") x = 0;
  @type("number") y = 0;

  // Movement
  @type("boolean") isMoving = false;

  // Combat
  @type("string") name = "Goblin";
  @type("string") examineText = "An ugly green creature.";
  @type("boolean") aggressive = true;

  // Additional enemy properties
  @type("number") level = 1;
  @type("number") experience = 0;
  @type("number") dropTableId = 0;
  @type("number") respawnTime = 0;
}

export class GameState extends Schema {
  @type("string") status = "waiting";
  @type("string") winner = "";
  @type("boolean") isGameOver = false;

  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Enemy }) enemies = new MapSchema<Enemy>();
  @type("number") tick = 0;
  @type("boolean") gameStarted = false;
  @type("number") gameTime = 0;
  @type("boolean") gameStarted = false;
  @type("number") waveNumber = 1;
  @type("number") enemiesKilled = 0;
  @type("number") lastSpawnTime = 0;
}

export class GameRoom extends Schema {
  @type("number") playerCount = 0;
  @type("boolean") inProgress = false;
  @type("number") waveNumber = 1;
  @type("number") difficulty = 1;
  @type("number") timeElapsed = 0;
}
