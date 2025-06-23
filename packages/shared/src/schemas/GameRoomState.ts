import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";

/**
 * @class EnemySchema
 * @description Represents a single enemy in the game, including its state and position.
 * This schema is synchronized across all clients.
 * @author The Architect
 */
export class EnemySchema extends Schema {
  @type("string") id: string = "";
  @type("number") ecsId: number = 0;
  @type("string") type: string = "goblin";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 10;
  @type("number") maxHealth: number = 10;
  @type("string") state: string = "idle"; // e.g., idle, moving, attacking, dead
}

/**
 * @class WaveSchema
 * @description Represents the state of the current enemy wave.
 * @author The Architect
 */
export class WaveSchema extends Schema {
  @type("number") number: number = 1;
  @type("number") enemiesRemaining: number = 0;
  @type("number") enemiesTotal: number = 0;
  @type("boolean") isActive: boolean = false;
  @type("number") nextWaveTime: number = 0; // Timestamp for the next wave
}

/**
 * @class GameRoomState
 * @description The root schema for the entire game room state.
 * It contains all players, enemies, and the current wave state.
 * @author The Architect
 */
export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: EnemySchema }) enemies = new MapSchema<EnemySchema>();
  @type(WaveSchema) wave = new WaveSchema();
  @type("number") serverTime: number = 0;
}
