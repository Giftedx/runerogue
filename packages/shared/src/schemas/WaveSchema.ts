import { Schema, type } from "@colyseus/schema";
import { fixSchemaMetadata } from "../utils/schemaCompat";

/**
 * @class WaveSchema
 * @description Represents the state of the current enemy wave.
 */
export class WaveSchema extends Schema {
  @type("number") waveNumber = 0;
  @type("number") enemiesToSpawn = 0;
  @type("number") enemiesRemaining = 0;
}

// Apply metadata compatibility fix
fixSchemaMetadata(WaveSchema);
