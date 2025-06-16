/**
 * RuneRogue Game State Schema
 * Colyseus schema for synchronized game state
 *
 * @author agent/backend-infra (The Architect)
 */

import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 10;
  @type("number") maxHealth: number = 10;
  @type("boolean") connected: boolean = true;
  @type("number") lastMoveTime: number = 0;

  // OSRS Combat Stats
  @type("number") attackLevel: number = 1;
  @type("number") strengthLevel: number = 1;
  @type("number") defenceLevel: number = 1;
  @type("number") hitpointsLevel: number = 10;
  @type("number") prayerLevel: number = 1;
  @type("number") prayerPoints: number = 1;

  // Combat state
  @type("number") lastAttackTime: number = 0;
  @type("string") targetId: string = "";
  @type("boolean") inCombat: boolean = false;
}

export class Enemy extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = "goblin";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 5;
  @type("number") maxHealth: number = 5;
  @type("number") attackLevel: number = 1;
  @type("number") defenceLevel: number = 1;
  @type("number") lastAttackTime: number = 0;
  @type("string") targetId: string = "";
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
