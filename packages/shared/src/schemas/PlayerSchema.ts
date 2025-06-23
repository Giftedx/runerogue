import { Schema, type } from "@colyseus/schema";
import { HealthSchema } from "./HealthSchema";
import { CombatStatsSchema } from "./CombatStatsSchema";
import { EquipmentSchema } from "./EquipmentSchema";
import { PrayerSchema } from "./PrayerSchema";
import { SpecialAttackSchema } from "./SpecialAttackSchema";
import { fixSchemaMetadata, fixSchemaHierarchy } from "../utils/schemaCompat";

export class PlayerSchema extends Schema {
  @type("string") name = "Player";
  @type("string") id = "";
  @type("number") x = 400;
  @type("number") y = 300;
  @type("number") ecsId = 0;
  @type(HealthSchema) health = new HealthSchema();
  @type(CombatStatsSchema) stats = new CombatStatsSchema();
  @type(EquipmentSchema) equipment = new EquipmentSchema();
  @type(PrayerSchema) prayer = new PrayerSchema();
  @type(SpecialAttackSchema) specialAttack = new SpecialAttackSchema();
}

// Apply metadata compatibility fix
fixSchemaMetadata(PlayerSchema);

// Apply hierarchical fix to ensure all nested schemas are properly fixed
fixSchemaHierarchy(PlayerSchema);

/**
 * Factory function to create a properly initialized PlayerSchema instance.
 * This ensures the Colyseus schema metadata is correctly set up.
 *
 * @param data - Initial data for the player
 * @returns A properly initialized PlayerSchema instance
 */
export function createPlayerSchema(
  data: Partial<{
    name: string;
    id: string;
    x: number;
    y: number;
    ecsId: number;
  }>
): PlayerSchema {
  const player = new PlayerSchema();

  // Apply metadata fixes to all nested schema instances
  fixSchemaMetadata(player.health.constructor as any);
  fixSchemaMetadata(player.stats.constructor as any);
  fixSchemaMetadata(player.equipment.constructor as any);
  fixSchemaMetadata(player.prayer.constructor as any);
  fixSchemaMetadata(player.specialAttack.constructor as any);

  // Set provided data
  if (data.name !== undefined) player.name = data.name;
  if (data.id !== undefined) player.id = data.id;
  if (data.x !== undefined) player.x = data.x;
  if (data.y !== undefined) player.y = data.y;
  if (data.ecsId !== undefined) player.ecsId = data.ecsId;

  return player;
}
