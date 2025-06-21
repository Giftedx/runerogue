import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";

/**
 * Represents a single enemy in the game.
 * This schema is used for network synchronization.
 */
export class EnemySchema extends Schema {
  @type("string") id = "";
  @type("number") ecsId = 0;
  @type("string") type = "goblin";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") health = 10;
  @type("number") maxHealth = 10;
  @type("string") state = "idle"; // idle, moving, attacking, dead
}

/**
 * Represents the state of the current enemy wave.
 * This schema is used for network synchronization.
 */
export class WaveSchema extends Schema {
  @type("number") number = 1;
  @type("number") enemiesRemaining = 0;
  @type("number") enemiesTotal = 0;
  @type("boolean") isActive = false;
  @type("number") nextWaveTime = 0; // Timestamp for next wave
}

export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: EnemySchema }) enemies = new MapSchema<EnemySchema>();
  @type(WaveSchema) wave = new WaveSchema();

  @type("number") serverTime = 0;
}
