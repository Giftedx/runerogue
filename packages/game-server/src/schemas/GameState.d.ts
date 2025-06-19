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
import { Schema, MapSchema } from "@colyseus/schema";
/**
 * @class Character
 * @classdesc A base schema for any character in the game, player or enemy.
 * It contains common properties like position, health, and combat state.
 * This class is extended by Player and Enemy schemas.
 */
export declare class Character extends Schema {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  lastAttackTime: number;
  targetId: string;
  inCombat: boolean;
  attackLevel: number;
  strengthLevel: number;
  defenceLevel: number;
  hitpointsLevel: number;
}
export declare class Player extends Character {
  name: string;
  connected: boolean;
  lastMoveTime: number;
  prayerLevel: number;
  prayerPoints: number;
  isDead: boolean;
}
export declare class Enemy extends Character {
  type: string;
  aiState: string;
  alive: boolean;
}
export declare class GameState extends Schema {
  players: MapSchema<Player, string>;
  enemies: MapSchema<Enemy, string>;
  gameTime: number;
  gameStarted: boolean;
  waveNumber: number;
  enemiesKilled: number;
  lastSpawnTime: number;
}
