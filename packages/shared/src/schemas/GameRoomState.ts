import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";
import {
  fixMultipleSchemas,
  fixSchemaHierarchy,
  fixAllSchemaTypes,
} from "../utils/schemaCompat";

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
 * Factory function to create a properly initialized EnemySchema instance.
 * This ensures the Colyseus schema metadata is correctly set up.
 *
 * @param data - Initial data for the enemy (optional)
 * @returns A properly initialized EnemySchema instance
 */
export function createEnemySchema(
  data: Partial<{
    id: string;
    ecsId: number;
    type: string;
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    state: string;
  }> = {}
): EnemySchema {
  const enemy = new EnemySchema();

  // Set provided data
  if (data.id !== undefined) enemy.id = data.id;
  if (data.ecsId !== undefined) enemy.ecsId = data.ecsId;
  if (data.type !== undefined) enemy.type = data.type;
  if (data.x !== undefined) enemy.x = data.x;
  if (data.y !== undefined) enemy.y = data.y;
  if (data.health !== undefined) enemy.health = data.health;
  if (data.maxHealth !== undefined) enemy.maxHealth = data.maxHealth;
  if (data.state !== undefined) enemy.state = data.state;

  return enemy;
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

// Apply metadata compatibility fix to all schemas
fixMultipleSchemas(EnemySchema, WaveSchema, GameRoomState);

// Apply hierarchical fix to ensure all nested schemas are properly fixed
fixSchemaHierarchy(GameRoomState);
fixSchemaHierarchy(PlayerSchema);

// Apply comprehensive fix to all schema types including ArraySchema and MapSchema
fixAllSchemaTypes(ArraySchema, MapSchema);
