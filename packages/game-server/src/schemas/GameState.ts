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
  @type("string") id: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 10;
  @type("number") maxHealth: number = 10;

  // Combat state
  @type("number") lastAttackTime: number = 0;
  @type("string") targetId: string = "";
  @type("boolean") inCombat: boolean = false;

  // OSRS Combat Stats
  @type("number") attackLevel: number = 1;
  @type("number") strengthLevel: number = 1;
  @type("number") defenceLevel: number = 1;
  @type("number") hitpointsLevel: number = 10;
}

export class Player extends Character {
  @type("string") name: string = "";
  @type("boolean") connected: boolean = true;
  @type("number") lastMoveTime: number = 0;

  // OSRS Combat Stats (Prayer)
  @type("number") prayerLevel: number = 1;
  @type("number") prayerPoints: number = 1;

  // Player-specific state
  @type("boolean") isDead: boolean = false;
}

export class Enemy extends Character {
  @type("string") type: string = "goblin";
  @type("string") aiState: string = "IDLE"; // e.g., 'IDLE', 'ATTACKING'
  @type("boolean") alive: boolean = true;
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Enemy }) enemies = new MapSchema<Enemy>();
  @type("number") gameTime: number = 0;
  @type("boolean") gameStarted: boolean = false;
  @type("number") waveNumber: number = 1;
  @type("number") enemiesKilled: number = 0;
  @type("number") lastSpawnTime: number = 0;
}
