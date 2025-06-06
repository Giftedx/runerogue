/**
 * Procedural Map Generator for RuneRogue
 *
 * Generates OSRS-style maps with biomes, dungeons, and POIs
 * Uses ROT.js for advanced procedural generation algorithms
 */

import { Noise, RNG, Map as ROTMap } from 'rot-js';

// Terrain types
export enum TerrainType {
  FLOOR = 0,
  WALL = 1,
  WATER = 2,
  TREE = 3,
  ROCK = 4,
  CHEST = 5,
  STAIRS_UP = 6,
  STAIRS_DOWN = 7,
  EXIT = 8,
}

// Biome types inspired by OSRS
export enum BiomeType {
  LUMBRIDGE = 'lumbridge',
  VARROCK = 'varrock',
  WILDERNESS = 'wilderness',
  DUNGEON = 'dungeon',
  FOREST = 'forest',
  DESERT = 'desert',
  ICE = 'ice',
  SWAMP = 'swamp',
}

// Dungeon difficulty levels
export enum DungeonDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3,
  BOSS = 4,
}

export interface GeneratedMap {
  id: string;
  name: string;
  width: number;
  height: number;
  terrain: TerrainType[][];
  collisionMap: boolean[][];
  biome: BiomeType;
  difficulty?: DungeonDifficulty;
  spawnPoints: { x: number; y: number; type: 'player' | 'npc' | 'boss' }[];
  resources: { x: number; y: number; type: string; amount: number }[];
  chests: { x: number; y: number; lootTable: string }[];
  exits: { x: number; y: number; targetMap?: string }[];
}

/**
 * Advanced procedural map generator using ROT.js
 */
export class ProceduralMapGenerator {
  private rng: RNG;
  private mapCounter = 0;

  constructor(seed?: number) {
    this.rng = new RNG(seed);
  }

  /**
   * Generate a survival map with wave mechanics
   */
  public generateSurvivorMap(size: number = 50, wave: number = 1): GeneratedMap {
    const mapId = `survivor_wave_${wave}_${++this.mapCounter}`;
    const mapSize = Math.min(size + Math.floor(wave / 5) * 10, 100); // Increase size with waves

    // Choose biome based on wave
    const biome = this.getBiomeForWave(wave);

    // Generate base terrain using cellular automata
    const terrain = this.generateCellularAutomata(mapSize, mapSize, biome);

    // Add wave-specific features
    this.addWaveFeatures(terrain, wave, biome);

    // Generate collision map
    const collisionMap = this.generateCollisionMap(terrain);

    // Place spawn points strategically
    const spawnPoints = this.generateSpawnPoints(terrain, wave);

    // Add resources based on biome and wave
    const resources = this.generateResources(terrain, biome, wave);

    // Add chests with wave-appropriate loot
    const chests = this.generateChests(terrain, wave);

    // Add exits (limited in survivor mode)
    const exits = this.generateExits(terrain, 1);

    return {
      id: mapId,
      name: `${biome} - Wave ${wave}`,
      width: mapSize,
      height: mapSize,
      terrain,
      collisionMap,
      biome,
      spawnPoints,
      resources,
      chests,
      exits,
    };
  }

  /**
   * Generate a traditional dungeon map
   */
  public generateDungeon(
    width: number = 40,
    height: number = 30,
    difficulty: DungeonDifficulty = DungeonDifficulty.EASY
  ): GeneratedMap {
    const mapId = `dungeon_${difficulty}_${++this.mapCounter}`;

    // Generate dungeon using ROT.js maze algorithm
    const terrain = this.generateMazeDungeon(width, height);

    // Add dungeon-specific features
    this.addDungeonFeatures(terrain, difficulty);

    const collisionMap = this.generateCollisionMap(terrain);
    const spawnPoints = this.generateDungeonSpawns(terrain, difficulty);
    const resources = this.generateDungeonResources(terrain, difficulty);
    const chests = this.generateDungeonChests(terrain, difficulty);
    const exits = this.generateDungeonExits(terrain);

    return {
      id: mapId,
      name: `${BiomeType.DUNGEON} Level ${difficulty}`,
      width,
      height,
      terrain,
      collisionMap,
      biome: BiomeType.DUNGEON,
      difficulty,
      spawnPoints,
      resources,
      chests,
      exits,
    };
  }

  /**
   * Generate overworld map with multiple biomes
   */
  public generateOverworld(width: number = 100, height: number = 100): GeneratedMap {
    const mapId = `overworld_${++this.mapCounter}`;

    // Generate base terrain using Perlin noise
    const terrain = this.generateNoiseBasedTerrain(width, height);

    // Apply biome transitions
    this.applyBiomeTransitions(terrain);

    const collisionMap = this.generateCollisionMap(terrain);
    const spawnPoints = this.generateOverworldSpawns(terrain);
    const resources = this.generateOverworldResources(terrain);
    const chests = this.generateOverworldChests(terrain);
    const exits = this.generateOverworldExits(terrain);

    return {
      id: mapId,
      name: 'Overworld',
      width,
      height,
      terrain,
      collisionMap,
      biome: BiomeType.LUMBRIDGE, // Default starting biome
      spawnPoints,
      resources,
      chests,
      exits,
    };
  }

  // ===== PRIVATE GENERATION METHODS =====

  private getBiomeForWave(wave: number): BiomeType {
    const biomes = [
      BiomeType.LUMBRIDGE,
      BiomeType.FOREST,
      BiomeType.VARROCK,
      BiomeType.SWAMP,
      BiomeType.DESERT,
      BiomeType.WILDERNESS,
      BiomeType.ICE,
    ];

    // Cycle through biomes with some randomness
    const baseIndex = Math.floor((wave - 1) / 3) % biomes.length;
    const randomOffset = this.rng.getUniformInt(0, 2) - 1;
    const index = Math.max(0, Math.min(biomes.length - 1, baseIndex + randomOffset));

    return biomes[index];
  }

  private generateCellularAutomata(
    width: number,
    height: number,
    biome: BiomeType
  ): TerrainType[][] {
    const terrain: TerrainType[][] = [];

    // Initialize with random terrain
    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        terrain[y][x] = this.rng.getUniform() > 0.55 ? TerrainType.WALL : TerrainType.FLOOR;
      }
    }

    // Apply cellular automata rules
    for (let iteration = 0; iteration < 5; iteration++) {
      const newTerrain = terrain.map(row => [...row]);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const wallCount = this.countAdjacentWalls(terrain, x, y);

          if (wallCount >= 4) {
            newTerrain[y][x] = TerrainType.WALL;
          } else if (wallCount <= 3) {
            newTerrain[y][x] = TerrainType.FLOOR;
          }
        }
      }

      // Copy back
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          terrain[y][x] = newTerrain[y][x];
        }
      }
    }

    // Apply biome-specific transformations
    this.applyBiomeTransformation(terrain, biome);

    return terrain;
  }

  private generateMazeDungeon(width: number, height: number): TerrainType[][] {
    const terrain: TerrainType[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(TerrainType.WALL));

    // Use ROT.js maze generation
    const maze = new ROTMap.Maze(width, height);
    maze.create((x: number, y: number, value: number) => {
      if (x >= 0 && x < width && y >= 0 && y < height) {
        terrain[y][x] = value === 0 ? TerrainType.FLOOR : TerrainType.WALL;
      }
    });

    return terrain;
  }

  private generateNoiseBasedTerrain(width: number, height: number): TerrainType[][] {
    const terrain: TerrainType[][] = [];
    const noise = new Noise.Simplex();

    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        const noiseValue = noise.get(x / 20, y / 20);

        if (noiseValue > 0.3) {
          terrain[y][x] = TerrainType.TREE;
        } else if (noiseValue > 0.1) {
          terrain[y][x] = TerrainType.FLOOR;
        } else if (noiseValue > -0.2) {
          terrain[y][x] = TerrainType.WATER;
        } else {
          terrain[y][x] = TerrainType.ROCK;
        }
      }
    }

    return terrain;
  }

  private countAdjacentWalls(terrain: TerrainType[][], x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;

        if (nx < 0 || nx >= terrain[0].length || ny < 0 || ny >= terrain.length) {
          count++; // Count boundaries as walls
        } else if (terrain[ny][nx] === TerrainType.WALL) {
          count++;
        }
      }
    }
    return count;
  }

  private applyBiomeTransformation(terrain: TerrainType[][], biome: BiomeType): void {
    const height = terrain.length;
    const width = terrain[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (terrain[y][x] === TerrainType.FLOOR) {
          // Add biome-specific decorations
          const rand = this.rng.getUniform();

          switch (biome) {
            case BiomeType.FOREST:
              if (rand < 0.3) terrain[y][x] = TerrainType.TREE;
              break;
            case BiomeType.DESERT:
              if (rand < 0.1) terrain[y][x] = TerrainType.ROCK;
              break;
            case BiomeType.SWAMP:
              if (rand < 0.2) terrain[y][x] = TerrainType.WATER;
              break;
            case BiomeType.ICE:
              if (rand < 0.15) terrain[y][x] = TerrainType.ROCK; // Ice rocks
              break;
          }
        }
      }
    }
  }

  private addWaveFeatures(terrain: TerrainType[][], wave: number, biome: BiomeType): void {
    // Add features that scale with wave number
    const featureCount = Math.floor(wave / 2) + 1;

    for (let i = 0; i < featureCount; i++) {
      const x = this.rng.getUniformInt(1, terrain[0].length - 2);
      const y = this.rng.getUniformInt(1, terrain.length - 2);

      if (terrain[y][x] === TerrainType.FLOOR) {
        // Add boss arena or special feature for higher waves
        if (wave >= 10 && i === 0) {
          this.createBossArena(terrain, x, y);
        } else {
          terrain[y][x] = TerrainType.CHEST;
        }
      }
    }
  }

  private createBossArena(terrain: TerrainType[][], centerX: number, centerY: number): void {
    const radius = 3;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = centerX + dx;
        const y = centerY + dy;

        if (x >= 0 && x < terrain[0].length && y >= 0 && y < terrain.length) {
          if (dx === 0 && dy === 0) {
            terrain[y][x] = TerrainType.FLOOR; // Boss spawn point
          } else if (Math.abs(dx) + Math.abs(dy) <= radius) {
            terrain[y][x] = TerrainType.FLOOR;
          }
        }
      }
    }
  }

  // Additional helper methods for collision maps, spawn points, etc.
  private generateCollisionMap(terrain: TerrainType[][]): boolean[][] {
    return terrain.map(row =>
      row.map(
        cell => cell === TerrainType.WALL || cell === TerrainType.WATER || cell === TerrainType.ROCK
      )
    );
  }

  private generateSpawnPoints(
    terrain: TerrainType[][],
    wave: number
  ): { x: number; y: number; type: 'player' | 'npc' | 'boss' }[] {
    const points: { x: number; y: number; type: 'player' | 'npc' | 'boss' }[] = [];

    // Find suitable spawn locations
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = this.rng.getUniformInt(1, terrain[0].length - 2);
      const y = this.rng.getUniformInt(1, terrain.length - 2);

      if (terrain[y][x] === TerrainType.FLOOR) {
        if (points.length === 0) {
          points.push({ x, y, type: 'player' });
        } else {
          const type = wave >= 5 && points.length === 1 ? 'boss' : 'npc';
          points.push({ x, y, type });

          if (points.length >= Math.min(10, wave + 2)) break;
        }
      }
    }

    return points;
  }

  private generateResources(
    terrain: TerrainType[][],
    biome: BiomeType,
    wave: number
  ): { x: number; y: number; type: string; amount: number }[] {
    const resources: { x: number; y: number; type: string; amount: number }[] = [];

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[0].length; x++) {
        if (terrain[y][x] === TerrainType.TREE && this.rng.getUniform() < 0.8) {
          resources.push({ x, y, type: 'wood', amount: this.rng.getUniformInt(1, 5) });
        } else if (terrain[y][x] === TerrainType.ROCK && this.rng.getUniform() < 0.6) {
          resources.push({ x, y, type: 'ore', amount: this.rng.getUniformInt(1, 3) });
        }
      }
    }

    return resources;
  }

  private generateChests(
    terrain: TerrainType[][],
    wave: number
  ): { x: number; y: number; lootTable: string }[] {
    const chests: { x: number; y: number; lootTable: string }[] = [];

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[0].length; x++) {
        if (terrain[y][x] === TerrainType.CHEST) {
          const lootTable = wave >= 10 ? 'boss_loot' : wave >= 5 ? 'rare_loot' : 'common_loot';
          chests.push({ x, y, lootTable });
        }
      }
    }

    return chests;
  }

  private generateExits(
    terrain: TerrainType[][],
    count: number
  ): { x: number; y: number; targetMap?: string }[] {
    const exits: { x: number; y: number; targetMap?: string }[] = [];

    for (let attempts = 0; attempts < count * 10 && exits.length < count; attempts++) {
      const x = this.rng.getUniformInt(1, terrain[0].length - 2);
      const y = this.rng.getUniformInt(1, terrain.length - 2);

      if (terrain[y][x] === TerrainType.FLOOR) {
        terrain[y][x] = TerrainType.EXIT;
        exits.push({ x, y });
      }
    }

    return exits;
  }

  // Dungeon-specific generation methods
  private addDungeonFeatures(terrain: TerrainType[][], difficulty: DungeonDifficulty): void {
    // Add stairs, traps, secret doors based on difficulty
    const featureCount = difficulty * 2;

    for (let i = 0; i < featureCount; i++) {
      const x = this.rng.getUniformInt(1, terrain[0].length - 2);
      const y = this.rng.getUniformInt(1, terrain.length - 2);

      if (terrain[y][x] === TerrainType.FLOOR) {
        if (i === 0) {
          terrain[y][x] = TerrainType.STAIRS_UP;
        } else if (i === 1 && difficulty > 1) {
          terrain[y][x] = TerrainType.STAIRS_DOWN;
        } else {
          terrain[y][x] = TerrainType.CHEST;
        }
      }
    }
  }

  private generateDungeonSpawns(
    terrain: TerrainType[][],
    difficulty: DungeonDifficulty
  ): { x: number; y: number; type: 'player' | 'npc' | 'boss' }[] {
    const spawns: { x: number; y: number; type: 'player' | 'npc' | 'boss' }[] = [];
    const mobCount = difficulty * 3;

    for (let attempts = 0; attempts < 100; attempts++) {
      const x = this.rng.getUniformInt(1, terrain[0].length - 2);
      const y = this.rng.getUniformInt(1, terrain.length - 2);

      if (terrain[y][x] === TerrainType.FLOOR) {
        if (spawns.length === 0) {
          spawns.push({ x, y, type: 'player' });
        } else {
          const type = spawns.length === mobCount ? 'boss' : 'npc';
          spawns.push({ x, y, type });

          if (spawns.length >= mobCount + 1) break;
        }
      }
    }

    return spawns;
  }

  private generateDungeonResources(
    terrain: TerrainType[][],
    difficulty: DungeonDifficulty
  ): { x: number; y: number; type: string; amount: number }[] {
    // Dungeons have fewer resources but better quality
    return [];
  }

  private generateDungeonChests(
    terrain: TerrainType[][],
    difficulty: DungeonDifficulty
  ): { x: number; y: number; lootTable: string }[] {
    const chests: { x: number; y: number; lootTable: string }[] = [];

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[0].length; x++) {
        if (terrain[y][x] === TerrainType.CHEST) {
          const lootTable = `dungeon_${difficulty}_loot`;
          chests.push({ x, y, lootTable });
        }
      }
    }

    return chests;
  }

  private generateDungeonExits(
    terrain: TerrainType[][]
  ): { x: number; y: number; targetMap?: string }[] {
    const exits: { x: number; y: number; targetMap?: string }[] = [];

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[0].length; x++) {
        if (terrain[y][x] === TerrainType.STAIRS_UP) {
          exits.push({ x, y, targetMap: 'overworld' });
        }
      }
    }

    return exits;
  }

  // Overworld-specific generation methods (simplified for now)
  private applyBiomeTransitions(terrain: TerrainType[][]): void {
    // Apply smooth biome transitions across the overworld
    // This would be more complex in a full implementation
  }

  private generateOverworldSpawns(
    terrain: TerrainType[][]
  ): { x: number; y: number; type: 'player' | 'npc' | 'boss' }[] {
    return [
      { x: Math.floor(terrain[0].length / 2), y: Math.floor(terrain.length / 2), type: 'player' },
    ];
  }

  private generateOverworldResources(
    terrain: TerrainType[][]
  ): { x: number; y: number; type: string; amount: number }[] {
    const resources: { x: number; y: number; type: string; amount: number }[] = [];

    for (let y = 0; y < terrain.length; y++) {
      for (let x = 0; x < terrain[0].length; x++) {
        if (terrain[y][x] === TerrainType.TREE && this.rng.getUniform() < 0.3) {
          resources.push({ x, y, type: 'wood', amount: this.rng.getUniformInt(1, 3) });
        } else if (terrain[y][x] === TerrainType.ROCK && this.rng.getUniform() < 0.2) {
          resources.push({ x, y, type: 'ore', amount: this.rng.getUniformInt(1, 2) });
        }
      }
    }

    return resources;
  }

  private generateOverworldChests(
    terrain: TerrainType[][]
  ): { x: number; y: number; lootTable: string }[] {
    return []; // Overworld chests are rare
  }

  private generateOverworldExits(
    terrain: TerrainType[][]
  ): { x: number; y: number; targetMap?: string }[] {
    const exits: { x: number; y: number; targetMap?: string }[] = [];

    // Add some dungeon entrances
    for (let attempts = 0; attempts < 20; attempts++) {
      const x = this.rng.getUniformInt(5, terrain[0].length - 6);
      const y = this.rng.getUniformInt(5, terrain.length - 6);

      if (terrain[y][x] === TerrainType.FLOOR && this.rng.getUniform() < 0.1) {
        terrain[y][x] = TerrainType.STAIRS_DOWN;
        exits.push({ x, y, targetMap: 'dungeon' });

        if (exits.length >= 3) break;
      }
    }

    return exits;
  }
}
