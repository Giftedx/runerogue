/**
 * OSRS Wiki Asset Extractor
 * Extracts all visual assets from OSRS Wiki including:
 * - Player models and animations
 * - NPC models and animations
 * - Item sprites and inventory icons
 * - Equipment models and textures
 * - UI elements and interfaces
 * - Particle effects and projectiles
 * - Map tiles and terrain textures
 *
 * @author RuneRogue Team
 * @license CC BY-NC-SA 3.0 (Attribution required for OSRS Wiki content)
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { createHash } from 'crypto';

// Type definitions
interface AssetMetadata {
  name: string;
  category: string;
  originalUrl: string;
  hash: string;
  variants: AssetVariant[];
  extractedAt: string;
}

interface AssetVariant {
  resolution: string;
  path: string;
  format: string;
  width?: number;
  height?: number;
}

interface NPCInfo {
  name: string;
  id: number;
}

interface ItemInfo {
  name: string;
  id: number;
}

export class OSRSAssetExtractor {
  private readonly WIKI_API = 'https://oldschool.runescape.wiki/api.php';
  private readonly WIKI_IMAGE_BASE = 'https://oldschool.runescape.wiki/images/';
  private readonly ASSET_CACHE_DIR = path.join(process.cwd(), 'assets/osrs-cache');
  private readonly ASSET_MANIFEST_PATH = path.join(this.ASSET_CACHE_DIR, 'manifest.json');

  private assetManifest: Map<string, AssetMetadata> = new Map();

  constructor() {
    this.ensureDirectories();
    this.loadManifest();
  }

  /**
   * Extract all player model assets including animations
   */
  async extractPlayerAssets(): Promise<void> {
    console.log('🏃 Extracting player model assets from OSRS Wiki...');

    const playerAssets = [
      // Base player models
      { name: 'Player_male_base', category: 'player/models' },
      { name: 'Player_female_base', category: 'player/models' },

      // Player animations
      { name: 'Player_idle_animation', category: 'player/animations' },
      { name: 'Player_walk_animation', category: 'player/animations' },
      { name: 'Player_run_animation', category: 'player/animations' },
      { name: 'Player_attack_animation', category: 'player/animations' },
      { name: 'Player_death_animation', category: 'player/animations' },

      // Combat stances
      { name: 'Attack_stance_aggressive', category: 'player/stances' },
      { name: 'Attack_stance_accurate', category: 'player/stances' },
      { name: 'Attack_stance_defensive', category: 'player/stances' },
      { name: 'Attack_stance_controlled', category: 'player/stances' },
    ];

    for (const asset of playerAssets) {
      await this.extractAsset(asset.name, asset.category);
    }

    console.log('✅ Player assets extraction complete');
  }

  /**
   * Extract all NPC models and animations
   */
  async extractNPCAssets(): Promise<void> {
    console.log('👹 Extracting NPC assets from OSRS Wiki...');

    const npcList = await this.fetchNPCList();

    for (const npc of npcList) {
      const assets = [
        { name: `${npc.name}_model`, category: 'npc/models' },
        { name: `${npc.name}_idle`, category: 'npc/animations' },
        { name: `${npc.name}_attack`, category: 'npc/animations' },
        { name: `${npc.name}_death`, category: 'npc/animations' },
      ];

      for (const asset of assets) {
        await this.extractAsset(asset.name, asset.category);
      }
    }

    console.log('✅ NPC assets extraction complete');
  }

  /**
   * Extract equipment sprites and models
   */
  async extractEquipmentAssets(): Promise<void> {
    console.log('⚔️ Extracting equipment assets from OSRS Wiki...');

    const equipmentTypes = [
      'helmets',
      'bodies',
      'legs',
      'boots',
      'gloves',
      'capes',
      'weapons',
      'shields',
      'amulets',
      'rings',
    ];

    for (const type of equipmentTypes) {
      console.log(`  📦 Processing ${type}...`);
      const items = await this.fetchEquipmentList(type);

      for (const item of items) {
        // Inventory sprite
        await this.extractAsset(`${item.name}_inventory`, `equipment/${type}/sprites`);

        // Equipped model
        await this.extractAsset(`${item.name}_equipped`, `equipment/${type}/models`);

        // Detail image for UI
        await this.extractAsset(`${item.name}_detail`, `equipment/${type}/detail`);
      }
    }

    console.log('✅ Equipment assets extraction complete');
  }

  /**
   * Extract UI elements and interfaces
   */
  async extractUIAssets(): Promise<void> {
    console.log('🎨 Extracting UI assets from OSRS Wiki...');

    const uiAssets = [
      // Health and prayer orbs
      { name: 'Hitpoints_orb', category: 'ui/orbs' },
      { name: 'Prayer_orb', category: 'ui/orbs' },
      { name: 'Run_energy_orb', category: 'ui/orbs' },
      { name: 'Special_attack_orb', category: 'ui/orbs' },
      { name: 'XP_drops_icon', category: 'ui/orbs' },

      // Skill icons
      { name: 'Attack_icon', category: 'ui/skills' },
      { name: 'Strength_icon', category: 'ui/skills' },
      { name: 'Defence_icon', category: 'ui/skills' },
      { name: 'Ranged_icon', category: 'ui/skills' },
      { name: 'Prayer_icon', category: 'ui/skills' },
      { name: 'Magic_icon', category: 'ui/skills' },
      { name: 'Hitpoints_icon', category: 'ui/skills' },

      // Interface backgrounds and elements
      { name: 'Minimap', category: 'ui/interfaces' },
      { name: 'Compass', category: 'ui/interfaces' },
      { name: 'World_map_icon', category: 'ui/interfaces' },
      { name: 'Wiki_lookup', category: 'ui/interfaces' },

      // Buttons and markers
      { name: 'Minimap_self_marker', category: 'ui/buttons' },
      { name: 'Flag_map_marker', category: 'ui/buttons' },
      { name: 'Minimap_player_marker', category: 'ui/buttons' },
    ];

    for (const asset of uiAssets) {
      await this.extractAsset(asset.name, asset.category);
    }

    console.log('✅ UI assets extraction complete');
  }

  /**
   * Extract combat effects and projectiles
   */
  async extractCombatEffects(): Promise<void> {
    console.log('💥 Extracting combat effects from OSRS Wiki...');

    const effects = [
      // Hit splats
      { name: 'Red_hitsplat', category: 'effects/hitsplats' },
      { name: 'Blue_hitsplat', category: 'effects/hitsplats' },
      { name: 'Green_hitsplat', category: 'effects/hitsplats' },
      { name: 'Yellow_hitsplat', category: 'effects/hitsplats' },

      // Projectiles
      { name: 'Arrow_projectile', category: 'effects/projectiles' },
      { name: 'Bolt_projectile', category: 'effects/projectiles' },
      { name: 'Fire_spell_projectile', category: 'effects/projectiles' },
      { name: 'Ice_spell_projectile', category: 'effects/projectiles' },

      // Impact effects
      { name: 'Melee_impact', category: 'effects/impacts' },
      { name: 'Range_impact', category: 'effects/impacts' },
      { name: 'Magic_impact', category: 'effects/impacts' },
    ];

    for (const effect of effects) {
      await this.extractAsset(effect.name, effect.category);
    }

    console.log('✅ Combat effects extraction complete');
  }

  /**
   * Extract map tiles and terrain textures
   */
  async extractMapAssets(): Promise<void> {
    console.log('🗺️ Extracting map assets from OSRS Wiki...');

    const terrainTypes = [
      'grass',
      'dirt',
      'sand',
      'stone',
      'water',
      'lava',
      'snow',
      'swamp',
      'cave',
    ];

    for (const terrain of terrainTypes) {
      // Base tiles
      await this.extractAsset(`Tile_${terrain}`, 'map/tiles');

      // Transition tiles
      await this.extractAsset(`Tile_${terrain}_edge`, 'map/transitions');

      // Decorations
      await this.extractAsset(`Decoration_${terrain}`, 'map/decorations');
    }

    console.log('✅ Map assets extraction complete');
  }

  /**
   * Extract and process a single asset from OSRS Wiki
   */
  private async extractAsset(assetName: string, category: string): Promise<void> {
    try {
      const cacheKey = `${category}/${assetName}`;

      // Check if already cached
      if (this.assetManifest.has(cacheKey)) {
        const metadata = this.assetManifest.get(cacheKey)!;
        if (await this.isAssetCached(metadata)) {
          console.log(`  ✓ ${cacheKey} (cached)`);
          return;
        }
      }

      // Fetch from Wiki
      const imageUrl = await this.getWikiImageUrl(assetName);
      if (!imageUrl) {
        console.warn(`  ⚠️ Asset not found on Wiki: ${assetName}`);
        return;
      }

      // Download image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'RuneRogue/1.0 (https://github.com/yourusername/runerogue)',
        },
        timeout: 30000, // 30 second timeout
      });

      const buffer = Buffer.from(response.data);

      // Process image for game use
      const processedAssets = await this.processAsset(buffer, assetName, category);

      // Save metadata
      const metadata: AssetMetadata = {
        name: assetName,
        category,
        originalUrl: imageUrl,
        hash: createHash('sha256').update(buffer).digest('hex'),
        variants: processedAssets,
        extractedAt: new Date().toISOString(),
      };

      this.assetManifest.set(cacheKey, metadata);
      await this.saveManifest();

      console.log(`  ✓ ${cacheKey}`);
    } catch (error) {
      console.error(
        `  ✗ Failed to extract ${assetName}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  /**
   * Process raw asset into game-ready formats
   */
  private async processAsset(
    buffer: Buffer,
    name: string,
    category: string
  ): Promise<AssetVariant[]> {
    const variants: AssetVariant[] = [];
    const outputDir = path.join(this.ASSET_CACHE_DIR, category);
    await fs.ensureDir(outputDir);

    // For now, just save the original PNG
    // In production, we would use Sharp for image processing
    const originalPath = path.join(outputDir, `${name}.png`);
    await fs.writeFile(originalPath, buffer);

    variants.push({
      resolution: 'original',
      path: originalPath,
      format: 'png',
    });

    return variants;
  }

  /**
   * Get image URL from OSRS Wiki
   */
  private async getWikiImageUrl(imageName: string): Promise<string | null> {
    try {
      const response = await axios.get(this.WIKI_API, {
        params: {
          action: 'query',
          titles: `File:${imageName}.png`,
          prop: 'imageinfo',
          iiprop: 'url',
          format: 'json',
        },
        timeout: 10000,
      });

      const pages = response.data.query.pages;
      const page = Object.values(pages)[0] as any;

      if (page.imageinfo && page.imageinfo[0]) {
        return page.imageinfo[0].url;
      }

      return null;
    } catch (error) {
      console.error(`Failed to get Wiki URL for ${imageName}:`, error);
      return null;
    }
  }

  /**
   * Fetch list of NPCs from Wiki (implementation needed)
   */
  private async fetchNPCList(): Promise<NPCInfo[]> {
    // For now, return the initial enemy list
    // In production, this would query the Wiki API or use MCP tools
    return [
      { name: 'Goblin', id: 1 },
      { name: 'Cow', id: 2 },
      { name: 'Chicken', id: 3 },
      { name: 'Giant_rat', id: 4 },
      { name: 'Skeleton', id: 5 },
    ];
  }

  /**
   * Fetch equipment list by type
   */
  private async fetchEquipmentList(type: string): Promise<ItemInfo[]> {
    // For now, return common items for each type
    const commonItems: Record<string, ItemInfo[]> = {
      weapons: [
        { name: 'Bronze_sword', id: 1277 },
        { name: 'Iron_scimitar', id: 1323 },
        { name: 'Steel_longsword', id: 1295 },
        { name: 'Mithril_2h_sword', id: 1319 },
        { name: 'Adamant_dagger', id: 1211 },
      ],
      helmets: [
        { name: 'Bronze_full_helm', id: 1155 },
        { name: 'Iron_full_helm', id: 1153 },
        { name: 'Steel_full_helm', id: 1157 },
      ],
      bodies: [
        { name: 'Bronze_platebody', id: 1117 },
        { name: 'Iron_platebody', id: 1115 },
        { name: 'Steel_platebody', id: 1119 },
      ],
    };

    return commonItems[type] || [];
  }

  /**
   * Check if asset is already cached
   */
  private async isAssetCached(metadata: AssetMetadata): Promise<boolean> {
    for (const variant of metadata.variants) {
      if (!(await fs.pathExists(variant.path))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Ensure required directories exist
   */
  private ensureDirectories(): void {
    const dirs = [
      'player/models',
      'player/animations',
      'player/stances',
      'npc/models',
      'npc/animations',
      'equipment/helmets/sprites',
      'equipment/helmets/models',
      'equipment/bodies/sprites',
      'equipment/bodies/models',
      'equipment/legs/sprites',
      'equipment/legs/models',
      'equipment/weapons/sprites',
      'equipment/weapons/models',
      'ui/orbs',
      'ui/skills',
      'ui/interfaces',
      'ui/buttons',
      'effects/hitsplats',
      'effects/projectiles',
      'effects/impacts',
      'map/tiles',
      'map/transitions',
      'map/decorations',
    ];

    for (const dir of dirs) {
      fs.ensureDirSync(path.join(this.ASSET_CACHE_DIR, dir));
    }
  }

  /**
   * Load asset manifest from disk
   */
  private loadManifest(): void {
    if (fs.existsSync(this.ASSET_MANIFEST_PATH)) {
      try {
        const data = fs.readJsonSync(this.ASSET_MANIFEST_PATH);
        this.assetManifest = new Map(Object.entries(data));
      } catch (error) {
        console.warn('Failed to load asset manifest, starting fresh');
        this.assetManifest = new Map();
      }
    }
  }

  /**
   * Save asset manifest to disk
   */
  private async saveManifest(): Promise<void> {
    try {
      const data = Object.fromEntries(this.assetManifest);
      await fs.writeJson(this.ASSET_MANIFEST_PATH, data, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save asset manifest:', error);
    }
  }

  /**
   * Extract all assets in the correct order
   */
  async extractAllAssets(): Promise<void> {
    console.log('=====================================');
    console.log('🎮 OSRS Wiki Asset Extraction Tool');
    console.log('=====================================');
    console.log('Extracting 100% authentic OSRS visual assets');
    console.log('from the Old School RuneScape Wiki...\n');

    const startTime = Date.now();

    try {
      // Extract assets in priority order
      await this.extractUIAssets();
      await this.extractPlayerAssets();
      await this.extractNPCAssets();
      await this.extractCombatEffects();
      await this.extractEquipmentAssets();
      await this.extractMapAssets();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('\n=====================================');
      console.log('✅ Asset extraction complete!');
      console.log(`📊 Total assets: ${this.assetManifest.size}`);
      console.log(`⏱️ Duration: ${duration}s`);
      console.log(`📁 Assets saved to: ${this.ASSET_CACHE_DIR}`);
      console.log('📋 Manifest: assets/osrs-cache/manifest.json');
      console.log('=====================================');
    } catch (error) {
      console.error('\n❌ Asset extraction failed:', error);
      throw error;
    }
  }

  /**
   * Get extraction statistics
   */
  getStats(): { totalAssets: number; categories: Record<string, number> } {
    const categories: Record<string, number> = {};

    for (const [key] of this.assetManifest) {
      const category = key.split('/')[0];
      categories[category] = (categories[category] || 0) + 1;
    }

    return {
      totalAssets: this.assetManifest.size,
      categories,
    };
  }
}
