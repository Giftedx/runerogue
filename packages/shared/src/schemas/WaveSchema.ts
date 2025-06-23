import { Schema, type } from "@colyseus/schema";

/**
 * @class WaveSchema
 * @description Represents the state of the current enemy wave.
 * @author The Architect
 */
export class WaveSchema extends Schema {
  @type("number") waveNumber = 0;
  @type("number") enemiesToSpawn = 0;
  @type("number") enemiesRemaining = 0;
}
