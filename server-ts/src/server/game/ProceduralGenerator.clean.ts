/**
 * OSRS-Inspired Procedural Generation System
 * Generates authentic OSRS biomes with appropriate monster placement and loot distribution
 * Based on OSRS Wiki data and survivor-style gameplay mechanics
 */

import { createNoise2D } from 'simplex-noise';
import { MapBlueprint } from './MapBlueprintSchema';

// OSRS Biome Types
export enum BiomeType {
  VARROCK = 'varrock',
  WILDERNESS = 'wilderness',
  MORYTANIA = 'morytania',
  LUMBRIDGE = 'lumbridge',
  KARAMJA = 'karamja',
  DESERT = 'desert',
  FREMENNIK = 'fremennik',
}

// Terrain Types for each biome
export enum TerrainType {
  GRASS = 'grass',
  DIRT = 'dirt',
  STONE = 'stone',
  WATER = 'water',
  SAND = 'sand',
  SNOW = 'snow',
  SWAMP = 'swamp',
  LAVA = 'lava',
  TREE = 'tree',
  ROCK = 'rock',
  WALL = 'wall',
}

// Monster difficulty scaling
export interface MonsterSpawnConfig {
  npcId: string;
  level: number;
  spawnWeight: number;
  minGroupSize: number;
  maxGroupSize: number;
  preferredTerrain: TerrainType[];
}

// Loot generation configuration
export interface LootSpawnConfig {
  itemId: string;
  rarity: number;
  minQuantity: number;
  maxQuantity: number;
  preferredTerrain: TerrainType[];
}

// Biome configuration
export interface BiomeConfig {
  name: string;
  primaryTerrain: TerrainType[];
  secondaryTerrain: TerrainType[];
  temperatureRange: [number, number];
  moistureRange: [number, number];
  dangerLevel: number;
  monsters: MonsterSpawnConfig[];
  loot: LootSpawnConfig[];
  resources: LootSpawnConfig[];
}

/**
 * OSRS-style procedural generation engine
 */
export class ProceduralGenerator {
  private noise2D = createNoise2D();
  private biomeConfigs: Map<BiomeType, BiomeConfig> = new Map();

  constructor() {
    this.initializeBiomeConfigs();
  }

  /**
   * Initialize OSRS biome configurations
   */
  private initializeBiomeConfigs(): void {
    this.biomeConfigs = new Map();

    // Varrock - Urban/City biome
    this.biomeConfigs.set(BiomeType.VARROCK, {
      name: 'Varrock',
      primaryTerrain: [TerrainType.STONE, TerrainType.DIRT],
      secondaryTerrain: [TerrainType.GRASS],
      temperatureRange: [0.4, 0.7],
      moistureRange: [0.3, 0.6],
      dangerLevel: 2,
      monsters: [
        {
          npcId: 'guard',
          level: 21,
          spawnWeight: 30,
          minGroupSize: 1,
          maxGroupSize: 2,
          preferredTerrain: [TerrainType.STONE, TerrainType.DIRT],
        },
        {
          npcId: 'dark_wizard',
          level: 7,
          spawnWeight: 15,
          minGroupSize: 1,
          maxGroupSize: 3,
          preferredTerrain: [TerrainType.DIRT],
        },
      ],
      loot: [
        {
          itemId: 'coins',
          rarity: 50,
          minQuantity: 1,
          maxQuantity: 25,
          preferredTerrain: [TerrainType.STONE],
        },
      ],
      resources: [
        {
          itemId: 'bronze_ore',
          rarity: 20,
          minQuantity: 1,
          maxQuantity: 3,
          preferredTerrain: [TerrainType.ROCK],
        },
      ],
    });

    // Wilderness - High danger PvP area
    this.biomeConfigs.set(BiomeType.WILDERNESS, {
      name: 'Wilderness',
      primaryTerrain: [TerrainType.DIRT, TerrainType.GRASS],
      secondaryTerrain: [TerrainType.STONE, TerrainType.TREE],
      temperatureRange: [0.2, 0.6],
      moistureRange: [0.1, 0.4],
      dangerLevel: 10,
      monsters: [
        {
          npcId: 'green_dragon',
          level: 79,
          spawnWeight: 5,
          minGroupSize: 1,
          maxGroupSize: 1,
          preferredTerrain: [TerrainType.GRASS],
        },
        {
          npcId: 'chaos_druid',
          level: 13,
          spawnWeight: 25,
          minGroupSize: 2,
          maxGroupSize: 4,
          preferredTerrain: [TerrainType.TREE],
        },
        {
          npcId: 'skeleton',
          level: 25,
          spawnWeight: 40,
          minGroupSize: 3,
          maxGroupSize: 6,
          preferredTerrain: [TerrainType.DIRT],
        },
      ],
      loot: [
        {
          itemId: 'dragon_bones',
          rarity: 2,
          minQuantity: 1,
          maxQuantity: 1,
          preferredTerrain: [TerrainType.GRASS],
        },
        {
          itemId: 'rune_essence',
          rarity: 15,
          minQuantity: 1,
          maxQuantity: 5,
          preferredTerrain: [TerrainType.STONE],
        },
      ],
      resources: [
        {
          itemId: 'yew_logs',
          rarity: 10,
          minQuantity: 1,
          maxQuantity: 2,
          preferredTerrain: [TerrainType.TREE],
        },
      ],
    });

    // Add other biomes...
    this.initializeOtherBiomes();
  }

  /**
   * Initialize remaining OSRS biomes
   */
  private initializeOtherBiomes(): void {
    // Morytania - Swamp/undead biome
    this.biomeConfigs.set(BiomeType.MORYTANIA, {
      name: 'Morytania',
      primaryTerrain: [TerrainType.SWAMP, TerrainType.DIRT],
      secondaryTerrain: [TerrainType.TREE, TerrainType.WATER],
      temperatureRange: [0.1, 0.4],
      moistureRange: [0.7, 1.0],
      dangerLevel: 8,
      monsters: [
        {
          npcId: 'ghoul',
          level: 42,
          spawnWeight: 30,
          minGroupSize: 2,
          maxGroupSize: 4,
          preferredTerrain: [TerrainType.SWAMP],
        },
        {
          npcId: 'vampire',
          level: 35,
          spawnWeight: 15,
          minGroupSize: 1,
          maxGroupSize: 2,
          preferredTerrain: [TerrainType.DIRT],
        },
      ],
      loot: [
        {
          itemId: 'mort_myre_fungus',
          rarity: 25,
          minQuantity: 1,
          maxQuantity: 3,
          preferredTerrain: [TerrainType.SWAMP],
        },
      ],
      resources: [
        {
          itemId: 'swamp_tar',
          rarity: 30,
          minQuantity: 1,
          maxQuantity: 4,
          preferredTerrain: [TerrainType.SWAMP],
        },
      ],
    });

    // Continue with other biomes (Lumbridge, Karamja, Desert, Fremennik)...
  }

  /**
   * Generate a complete map with OSRS-authentic features
   */
  public generateMap(
    width: number,
    height: number,
    biomeType: BiomeType,
    seed?: number
  ): MapBlueprint {
    // Set seed for deterministic generation
    if (seed !== undefined) {
      // Re-create noise with seed (simplex-noise doesn't support runtime seeding)
      // For now, we'll use the seed to modify noise values
    }

    const biomeConfig = this.biomeConfigs.get(biomeType);
    if (!biomeConfig) {
      throw new Error(`Unknown biome type: ${biomeType}`);
    }

    // Generate base terrain using noise
    const terrain = this.generateTerrain(width, height, biomeConfig);

    // Post-process terrain for realism
    const processedTerrain = this.postProcessTerrain(terrain, biomeConfig);

    // Generate monster spawns
    const monsters = this.generateMonsterSpawns(processedTerrain, biomeConfig);

    // Generate loot spawns
    const loot = this.generateLootSpawns(processedTerrain, biomeConfig);

    // Generate resource spawns
    const resources = this.generateResourceSpawns(processedTerrain, biomeConfig);

    return {
      width,
      height,
      biome: biomeType,
      terrain: processedTerrain,
      monsters,
      loot,
      resources,
      dangerLevel: biomeConfig.dangerLevel,
      seed: seed || Date.now(),
    };
  }

  /**
   * Generate base terrain using noise functions
   */
  private generateTerrain(
    width: number,
    height: number,
    biomeConfig: BiomeConfig
  ): TerrainType[][] {
    const terrain: TerrainType[][] = [];

    for (let y = 0; y < height; y++) {
      terrain[y] = [];
      for (let x = 0; x < width; x++) {
        // Generate noise values
        const temperature = this.noise2D(x * 0.01, y * 0.01);
        const moisture = this.noise2D(x * 0.007, y * 0.007 + 1000);
        const elevation = this.noise2D(x * 0.005, y * 0.005 + 2000);

        // Normalize to 0-1 range
        const normalizedTemp = (temperature + 1) / 2;
        const normalizedMoisture = (moisture + 1) / 2;
        const normalizedElevation = (elevation + 1) / 2;

        // Determine terrain based on biome and noise values
        const terrainType = this.selectTerrainType(
          normalizedTemp,
          normalizedMoisture,
          normalizedElevation,
          biomeConfig
        );

        terrain[y][x] = terrainType;
      }
    }

    return terrain;
  }

  /**
   * Select terrain type based on environmental factors
   */
  private selectTerrainType(
    temperature: number,
    moisture: number,
    elevation: number,
    biomeConfig: BiomeConfig
  ): TerrainType {
    // Check if within biome's preferred ranges
    const tempInRange =
      temperature >= biomeConfig.temperatureRange[0] &&
      temperature <= biomeConfig.temperatureRange[1];
    const moistureInRange =
      moisture >= biomeConfig.moistureRange[0] && moisture <= biomeConfig.moistureRange[1];

    // Use primary terrain if in optimal conditions
    if (tempInRange && moistureInRange) {
      const primaryTerrain = biomeConfig.primaryTerrain;
      const index = Math.floor((elevation * primaryTerrain.length) % primaryTerrain.length);
      return primaryTerrain[index];
    }

    // Use secondary terrain otherwise
    const secondaryTerrain = biomeConfig.secondaryTerrain;
    const index = Math.floor((elevation * secondaryTerrain.length) % secondaryTerrain.length);
    return secondaryTerrain[index];
  }

  /**
   * Post-process terrain to create more realistic features
   */
  private postProcessTerrain(terrain: TerrainType[][], _biomeConfig: BiomeConfig): TerrainType[][] {
    const processed = terrain.map(row => [...row]);

    // Create water bodies
    this.createWaterBodies(processed);

    // Create tree clusters
    this.createTreeClusters(processed);

    // Create rock formations
    this.createRockFormations(processed);

    return processed;
  }

  /**
   * Create coherent water bodies
   */
  private createWaterBodies(terrain: TerrainType[][]): void {
    const height = terrain.length;
    const width = terrain[0].length;

    // Find potential water starting points
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < 0.005) {
          // 0.5% chance for water seed
          this.growWaterBody(terrain, x, y, 5 + Math.floor(Math.random() * 10));
        }
      }
    }
  }

  /**
   * Grow a water body from a seed point
   */
  private growWaterBody(
    terrain: TerrainType[][],
    startX: number,
    startY: number,
    size: number
  ): void {
    const visited = new Set<string>();
    const queue = [{ x: startX, y: startY }];
    let placed = 0;

    while (queue.length > 0 && placed < size) {
      const { x, y } = queue.shift()!;
      const key = `${x},${y}`;

      if (visited.has(key) || y < 0 || y >= terrain.length || x < 0 || x >= terrain[0].length) {
        continue;
      }

      visited.add(key);

      // Only place water on suitable terrain
      if (terrain[y][x] === TerrainType.GRASS || terrain[y][x] === TerrainType.DIRT) {
        terrain[y][x] = TerrainType.WATER;
        placed++;

        // Add neighboring cells
        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        ];

        for (const neighbor of neighbors) {
          if (Math.random() < 0.7) {
            // 70% chance to spread
            queue.push(neighbor);
          }
        }
      }
    }
  }

  /**
   * Create tree clusters
   */
  private createTreeClusters(terrain: TerrainType[][]): void {
    const height = terrain.length;
    const width = terrain[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (terrain[y][x] === TerrainType.GRASS && Math.random() < 0.01) {
          this.growTreeCluster(terrain, x, y, 3 + Math.floor(Math.random() * 7));
        }
      }
    }
  }

  /**
   * Grow a tree cluster from a seed point
   */
  private growTreeCluster(
    terrain: TerrainType[][],
    startX: number,
    startY: number,
    size: number
  ): void {
    const queue = [{ x: startX, y: startY }];
    let placed = 0;

    while (queue.length > 0 && placed < size) {
      const { x, y } = queue.shift()!;

      if (y < 0 || y >= terrain.length || x < 0 || x >= terrain[0].length) {
        continue;
      }

      if (terrain[y][x] === TerrainType.GRASS) {
        terrain[y][x] = TerrainType.TREE;
        placed++;

        // Add random neighbors
        const neighbors = [
          { x: x + 1, y },
          { x: x - 1, y },
          { x, y: y + 1 },
          { x, y: y - 1 },
        ];

        for (const neighbor of neighbors) {
          if (Math.random() < 0.5) {
            queue.push(neighbor);
          }
        }
      }
    }
  }

  /**
   * Create rock formations
   */
  private createRockFormations(terrain: TerrainType[][]): void {
    const height = terrain.length;
    const width = terrain[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (
          (terrain[y][x] === TerrainType.STONE || terrain[y][x] === TerrainType.DIRT) &&
          Math.random() < 0.005
        ) {
          this.placeRockFormation(terrain, x, y);
        }
      }
    }
  }

  /**
   * Place a rock formation
   */
  private placeRockFormation(terrain: TerrainType[][], centerX: number, centerY: number): void {
    const size = 2 + Math.floor(Math.random() * 3); // 2-4 rocks

    for (let i = 0; i < size; i++) {
      const offsetX = centerX + Math.floor(Math.random() * 3) - 1;
      const offsetY = centerY + Math.floor(Math.random() * 3) - 1;

      if (offsetY >= 0 && offsetY < terrain.length && offsetX >= 0 && offsetX < terrain[0].length) {
        terrain[offsetY][offsetX] = TerrainType.ROCK;
      }
    }
  }

  /**
   * Generate monster spawns based on terrain and biome
   */
  private generateMonsterSpawns(
    terrain: TerrainType[][],
    biomeConfig: BiomeConfig
  ): Array<{ x: number; y: number; npcId: string; level: number }> {
    const monsters: Array<{ x: number; y: number; npcId: string; level: number }> = [];
    const height = terrain.length;
    const width = terrain[0].length;

    // Calculate spawn density based on danger level
    const spawnDensity = biomeConfig.dangerLevel * 0.001; // 0.1% per danger level

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (Math.random() < spawnDensity) {
          const suitableMonsters = biomeConfig.monsters.filter(monster =>
            monster.preferredTerrain.includes(terrain[y][x])
          );

          if (suitableMonsters.length > 0) {
            // Weighted random selection
            const totalWeight = suitableMonsters.reduce(
              (sum, monster) => sum + monster.spawnWeight,
              0
            );
            let random = Math.random() * totalWeight;

            for (const monster of suitableMonsters) {
              random -= monster.spawnWeight;
              if (random <= 0) {
                // Determine group size
                const groupSize =
                  monster.minGroupSize +
                  Math.floor(Math.random() * (monster.maxGroupSize - monster.minGroupSize + 1));

                // Place group
                for (let i = 0; i < groupSize; i++) {
                  const offsetX = x + Math.floor(Math.random() * 3) - 1;
                  const offsetY = y + Math.floor(Math.random() * 3) - 1;

                  if (offsetY >= 0 && offsetY < height && offsetX >= 0 && offsetX < width) {
                    monsters.push({
                      x: offsetX,
                      y: offsetY,
                      npcId: monster.npcId,
                      level: monster.level,
                    });
                  }
                }
                break;
              }
            }
          }
        }
      }
    }

    return monsters;
  }

  /**
   * Generate loot spawns
   */
  private generateLootSpawns(
    terrain: TerrainType[][],
    biomeConfig: BiomeConfig
  ): Array<{ x: number; y: number; itemId: string; quantity: number }> {
    const loot: Array<{ x: number; y: number; itemId: string; quantity: number }> = [];
    const height = terrain.length;
    const width = terrain[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (const lootConfig of biomeConfig.loot) {
          if (
            lootConfig.preferredTerrain.includes(terrain[y][x]) &&
            Math.random() < lootConfig.rarity / 10000
          ) {
            // Convert rarity to probability
            const quantity =
              lootConfig.minQuantity +
              Math.floor(Math.random() * (lootConfig.maxQuantity - lootConfig.minQuantity + 1));

            loot.push({
              x,
              y,
              itemId: lootConfig.itemId,
              quantity,
            });
          }
        }
      }
    }

    return loot;
  }

  /**
   * Generate resource spawns
   */
  private generateResourceSpawns(
    terrain: TerrainType[][],
    biomeConfig: BiomeConfig
  ): Array<{ x: number; y: number; itemId: string; quantity: number }> {
    const resources: Array<{ x: number; y: number; itemId: string; quantity: number }> = [];
    const height = terrain.length;
    const width = terrain[0].length;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        for (const resourceConfig of biomeConfig.resources) {
          if (
            resourceConfig.preferredTerrain.includes(terrain[y][x]) &&
            Math.random() < resourceConfig.rarity / 1000
          ) {
            // Higher spawn rate for resources
            const quantity =
              resourceConfig.minQuantity +
              Math.floor(
                Math.random() * (resourceConfig.maxQuantity - resourceConfig.minQuantity + 1)
              );

            resources.push({
              x,
              y,
              itemId: resourceConfig.itemId,
              quantity,
            });
          }
        }
      }
    }

    return resources;
  }

  /**
   * Get available biome types
   */
  public getAvailableBiomes(): BiomeType[] {
    return Array.from(this.biomeConfigs.keys());
  }

  /**
   * Get biome configuration
   */
  public getBiomeConfig(biomeType: BiomeType): BiomeConfig | undefined {
    return this.biomeConfigs.get(biomeType);
  }
}
