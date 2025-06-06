import { BiomeType, ProceduralGenerator, TerrainType } from '../../game/ProceduralGenerator';

describe('ProceduralGenerator', () => {
  const generator = new ProceduralGenerator();

  it('should generate a map blueprint with correct dimensions and biome', () => {
    const width = 32;
    const height = 32;
    const biome = BiomeType.VARROCK;
    const map = generator.generateMap(width, height, biome, 42);
    expect(map.width).toBe(width);
    expect(map.height).toBe(height);
    expect(map.biome).toBe(biome);
    expect(map.terrain.length).toBe(height);
    expect(map.terrain[0].length).toBe(width);
  });

  it('should only use valid terrain types for the biome', () => {
    const map = generator.generateMap(16, 16, BiomeType.WILDERNESS, 123);
    const validTerrains = new Set([
      ...generator.getBiomeConfig(BiomeType.WILDERNESS)!.primaryTerrain,
      ...generator.getBiomeConfig(BiomeType.WILDERNESS)!.secondaryTerrain,
      TerrainType.WATER,
      TerrainType.TREE,
      TerrainType.ROCK,
    ]);
    for (const row of map.terrain) {
      for (const cell of row) {
        expect(validTerrains.has(cell)).toBe(true);
      }
    }
  });

  it('should generate monsters only on preferred terrain', () => {
    const map = generator.generateMap(24, 24, BiomeType.MORYTANIA, 99);
    const biomeConfig = generator.getBiomeConfig(BiomeType.MORYTANIA)!;
    for (const monster of map.monsters) {
      const terrain = map.terrain[monster.y][monster.x];
      const config = biomeConfig.monsters.find(m => m.npcId === monster.npcId);
      expect(config).toBeDefined();
      expect(config!.preferredTerrain.includes(terrain)).toBe(true);
    }
  });

  it('should generate loot and resources only on preferred terrain', () => {
    const map = generator.generateMap(24, 24, BiomeType.VARROCK, 77);
    const biomeConfig = generator.getBiomeConfig(BiomeType.VARROCK)!;
    for (const loot of map.loot) {
      const terrain = map.terrain[loot.y][loot.x];
      const config = biomeConfig.loot.find(l => l.itemId === loot.itemId);
      expect(config).toBeDefined();
      expect(config!.preferredTerrain.includes(terrain)).toBe(true);
    }
    for (const resource of map.resources) {
      const terrain = map.terrain[resource.y][resource.x];
      const config = biomeConfig.resources.find(r => r.itemId === resource.itemId);
      expect(config).toBeDefined();
      expect(config!.preferredTerrain.includes(terrain)).toBe(true);
    }
  });

  it('should return all available biomes', () => {
    const biomes = generator.getAvailableBiomes();
    expect(biomes).toContain(BiomeType.VARROCK);
    expect(biomes).toContain(BiomeType.WILDERNESS);
    expect(biomes).toContain(BiomeType.MORYTANIA);
  });

  it('should throw for unknown biome', () => {
    // @ts-expect-error
    expect(() => generator.generateMap(10, 10, 'unknown')).toThrow();
  });
});
