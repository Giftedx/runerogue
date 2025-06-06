// src/world-generation/types.ts

export enum BiomeType {
  LumbridgePlains = 'lumbridge_plains',
  VarrockCity = 'varrock_city',
  Wilderness = 'wilderness',
  // Add more biomes as needed
}

export interface Tile {
  x: number;
  y: number;
  type: string; // e.g., 'grass', 'water', 'mountain'
  biome: BiomeType;
  entities: any[]; // Placeholder for items, NPCs, etc.
}

export interface World {
  seed: string; // Seed for reproducibility
  width: number;
  height: number;
  tiles: Tile[][];
  biomes: BiomeType[]; // List of biomes present in the world
  entities: any[]; // All entities (players, NPCs, items) in the world
}

export interface WorldGenerationConfig {
  seed: string;
  width: number;
  height: number;
  biomes: BiomeType[];
  // Add more configuration options as needed (e.g., density of resources, enemy types)
}
