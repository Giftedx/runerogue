/**
 * OSRS Asset Loader for Game Integration
 * Loads extracted OSRS Wiki assets into the game engine
 *
 * @author RuneRogue Team
 */

import { OSRSAssetExtractor } from './osrs-asset-extractor';
import path from 'path';
import fs from 'fs-extra';

/**
 * Manages loading and organizing OSRS assets for game use
 */
export class OSRSAssetLoader {
  private extractor: OSRSAssetExtractor;
  private assetManifest: Map<string, any>;
  private loadedAssets: Map<string, HTMLImageElement> = new Map();

  constructor() {
    this.extractor = new OSRSAssetExtractor();
    this.assetManifest = new Map();
  }

  /**
   * Initialize and load all game assets
   */
  async initialize(): Promise<void> {
    console.log('🎮 Initializing OSRS Asset Loader...');

    // Check if assets exist, extract if needed
    await this.ensureAssetsExist();

    // Load asset manifest
    await this.loadManifest();

    console.log('✅ OSRS Asset Loader initialized');
  }

  /**
   * Preload essential assets for immediate game start
   */
  async preloadEssentialAssets(): Promise<void> {
    console.log('⚡ Preloading essential OSRS assets...');

    const essentialAssets = [
      // UI elements - most critical
      'ui/orbs/Hitpoints_orb',
      'ui/orbs/Prayer_orb',
      'ui/skills/Attack_icon',
      'ui/skills/Strength_icon',
      'ui/skills/Defence_icon',
      'ui/skills/Hitpoints_icon',

      // Player sprites
      'player/models/Player_male_base',
      'player/animations/Player_idle_animation',
      'player/animations/Player_walk_animation',

      // Basic NPCs
      'npc/models/Goblin_model',
      'npc/models/Cow_model',

      // Combat effects
      'effects/hitsplats/Red_hitsplat',
      'effects/hitsplats/Blue_hitsplat',
    ];

    const loadPromises = essentialAssets.map(asset => this.loadAsset(asset));
    await Promise.all(loadPromises);

    console.log('✅ Essential assets preloaded');
  }

  /**
   * Preload essential UI assets
   */
  async preloadUIAssets(): Promise<void> {
    const uiAssets = [
      'ui/orbs/Hitpoints_orb',
      'ui/orbs/Prayer_orb',
      'ui/orbs/Run_energy_orb',
      'ui/orbs/Special_attack_orb',
      'ui/skills/Attack_icon',
      'ui/skills/Strength_icon',
      'ui/skills/Defence_icon',
      'ui/interfaces/Minimap',
      'ui/interfaces/Compass',
    ];

    for (const assetPath of uiAssets) {
      await this.loadAsset(assetPath);
    }
  }

  /**
   * Preload equipment assets
   */
  async preloadEquipmentAssets(): Promise<void> {
    const equipmentAssets = [
      'equipment/helmets/detail/Bronze_full_helm_detail',
      'equipment/helmets/detail/Iron_full_helm_detail',
      'equipment/bodies/detail/Bronze_platebody_detail',
      'equipment/weapons/detail/Bronze_sword_detail',
    ];

    for (const assetPath of equipmentAssets) {
      await this.loadAsset(assetPath);
    }
  }

  /**
   * Load a specific asset by path
   */
  async loadAsset(assetPath: string): Promise<HTMLImageElement | null> {
    try {
      // Check if already loaded
      if (this.loadedAssets.has(assetPath)) {
        return this.loadedAssets.get(assetPath)!;
      }

      // Get asset metadata
      const metadata = this.assetManifest.get(assetPath);
      if (!metadata) {
        console.warn(`Asset not found in manifest: ${assetPath}`);
        return null;
      }

      // Get the PNG variant (original resolution)
      const pngVariant = metadata.variants.find((v: any) => v.format === 'png');
      if (!pngVariant) {
        console.warn(`No PNG variant found for asset: ${assetPath}`);
        return null;
      }

      // Load image
      const image = await this.loadImageFromPath(pngVariant.path);
      this.loadedAssets.set(assetPath, image);

      return image;
    } catch (error) {
      console.error(`Failed to load asset ${assetPath}:`, error);
      return null;
    }
  }

  /**
   * Get asset by category and name
   */
  async getAsset(category: string, name: string): Promise<HTMLImageElement | null> {
    const assetPath = `${category}/${name}`;
    return await this.loadAsset(assetPath);
  }

  /**
   * Get asset manifest for external use
   */
  getAssetManifest(): Record<string, any> {
    const manifest: Record<string, any> = {};
    for (const [key, value] of this.assetManifest) {
      manifest[key] = value;
    }
    return manifest;
  }

  /**
   * Get asset by name (simple interface)
   */
  getAssetByName(assetName: string): HTMLImageElement | null {
    // Try to find asset by name in any category
    for (const [key, _] of this.assetManifest) {
      if (key.endsWith(assetName) || key.includes(assetName)) {
        return this.loadedAssets.get(key) || null;
      }
    }
    return null;
  }

  /**
   * Check if asset exists by name
   */
  hasAssetByName(assetName: string): boolean {
    for (const [key, _] of this.assetManifest) {
      if (key.endsWith(assetName) || key.includes(assetName)) {
        return this.loadedAssets.has(key);
      }
    }
    return false;
  }

  /**
   * Check if asset exists (alias for hasAssetByName)
   */
  hasAsset(assetName: string): boolean {
    return this.hasAssetByName(assetName);
  }

  /**
   * Create Phaser-compatible sprite configurations
   */
  createPhaserSpriteConfig(scene: any): void {
    console.log('🎨 Setting up Phaser sprites from OSRS assets...');

    // UI Orbs
    this.setupUISprites(scene);

    // Player sprites
    this.setupPlayerSprites(scene);

    // NPC sprites
    this.setupNPCSprites(scene);

    // Combat effects
    this.setupCombatEffects(scene);

    console.log('✅ Phaser sprites configured');
  }

  /**
   * Setup UI sprites for Phaser
   */
  private setupUISprites(scene: any): void {
    const uiAssets = [
      { key: 'hp_orb', path: 'ui/orbs/Hitpoints_orb' },
      { key: 'prayer_orb', path: 'ui/orbs/Prayer_orb' },
      { key: 'energy_orb', path: 'ui/orbs/Energy_orb' },
      { key: 'attack_icon', path: 'ui/skills/Attack_icon' },
      { key: 'strength_icon', path: 'ui/skills/Strength_icon' },
      { key: 'defence_icon', path: 'ui/skills/Defence_icon' },
      { key: 'hitpoints_icon', path: 'ui/skills/Hitpoints_icon' },
    ];

    for (const asset of uiAssets) {
      const image = this.loadedAssets.get(asset.path);
      if (image) {
        // Convert to Phaser texture
        scene.textures.addImage(asset.key, image);
      }
    }
  }

  /**
   * Setup player sprites for Phaser
   */
  private setupPlayerSprites(scene: any): void {
    const playerAssets = [
      { key: 'player_base', path: 'player/models/Player_male_base' },
      { key: 'player_idle', path: 'player/animations/Player_idle_animation' },
      { key: 'player_walk', path: 'player/animations/Player_walk_animation' },
      { key: 'player_attack', path: 'player/animations/Player_attack_animation' },
    ];

    for (const asset of playerAssets) {
      const image = this.loadedAssets.get(asset.path);
      if (image) {
        scene.textures.addImage(asset.key, image);
      }
    }

    // Create player animations
    this.createPlayerAnimations(scene);
  }

  /**
   * Setup NPC sprites for Phaser
   */
  private setupNPCSprites(scene: any): void {
    const npcs = ['Goblin', 'Cow', 'Chicken', 'Giant_rat', 'Skeleton'];

    for (const npc of npcs) {
      const npcKey = npc.toLowerCase();

      // Model
      const modelImage = this.loadedAssets.get(`npc/models/${npc}_model`);
      if (modelImage) {
        scene.textures.addImage(`${npcKey}_model`, modelImage);
      }

      // Animations
      const idleImage = this.loadedAssets.get(`npc/animations/${npc}_idle`);
      if (idleImage) {
        scene.textures.addImage(`${npcKey}_idle`, idleImage);
      }
    }
  }

  /**
   * Setup combat effect sprites
   */
  private setupCombatEffects(scene: any): void {
    const effects = [
      { key: 'hitsplat_red', path: 'effects/hitsplats/Red_hitsplat' },
      { key: 'hitsplat_blue', path: 'effects/hitsplats/Blue_hitsplat' },
      { key: 'hitsplat_green', path: 'effects/hitsplats/Green_hitsplat' },
      { key: 'arrow_projectile', path: 'effects/projectiles/Arrow_projectile' },
    ];

    for (const effect of effects) {
      const image = this.loadedAssets.get(effect.path);
      if (image) {
        scene.textures.addImage(effect.key, image);
      }
    }
  }

  /**
   * Create Phaser animations from loaded sprites
   */
  private createPlayerAnimations(scene: any): void {
    // Player idle animation
    if (scene.textures.exists('player_idle')) {
      scene.anims.create({
        key: 'player_idle',
        frames: scene.anims.generateFrameNumbers('player_idle', { start: 0, end: 3 }),
        frameRate: 4,
        repeat: -1,
      });
    }

    // Player walk animation
    if (scene.textures.exists('player_walk')) {
      scene.anims.create({
        key: 'player_walk',
        frames: scene.anims.generateFrameNumbers('player_walk', { start: 0, end: 7 }),
        frameRate: 8,
        repeat: -1,
      });
    }

    // Player attack animation
    if (scene.textures.exists('player_attack')) {
      scene.anims.create({
        key: 'player_attack',
        frames: scene.anims.generateFrameNumbers('player_attack', { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0,
      });
    }
  }

  /**
   * Create fallback placeholders for missing assets
   */
  createPlaceholderAssets(scene: any): void {
    console.log('🔧 Creating placeholder assets for missing OSRS assets...');

    // Create basic colored rectangles as placeholders
    const placeholders = [
      { key: 'hp_orb', color: 0xff0000, width: 32, height: 32 },
      { key: 'prayer_orb', color: 0x00ffff, width: 32, height: 32 },
      { key: 'player_base', color: 0xffff00, width: 32, height: 32 },
      { key: 'goblin_model', color: 0x00ff00, width: 32, height: 32 },
      { key: 'hitsplat_red', color: 0xff0000, width: 16, height: 16 },
    ];

    for (const placeholder of placeholders) {
      if (!scene.textures.exists(placeholder.key)) {
        // Create a simple colored rectangle
        const graphics = scene.add.graphics();
        graphics.fillStyle(placeholder.color);
        graphics.fillRect(0, 0, placeholder.width, placeholder.height);
        graphics.generateTexture(placeholder.key, placeholder.width, placeholder.height);
        graphics.destroy();
      }
    }

    console.log('✅ Placeholder assets created');
  }

  /**
   * Check if assets exist, extract if needed
   */
  private async ensureAssetsExist(): Promise<void> {
    const manifestPath = path.join(process.cwd(), 'assets/osrs-cache/manifest.json');

    if (!(await fs.pathExists(manifestPath))) {
      console.log('📦 OSRS assets not found, extracting from Wiki...');
      await this.extractor.extractAllAssets();
    } else {
      console.log('📦 OSRS assets found in cache');
    }
  }

  /**
   * Load asset manifest from disk
   */
  private async loadManifest(): Promise<void> {
    try {
      const manifestPath = path.join(process.cwd(), 'assets/osrs-cache/manifest.json');
      const manifestData = await fs.readJson(manifestPath);
      this.assetManifest = new Map(Object.entries(manifestData));
      console.log(`📋 Loaded manifest with ${this.assetManifest.size} assets`);
    } catch (error) {
      console.warn('⚠️ Failed to load asset manifest:', error);
      this.assetManifest = new Map();
    }
  }

  /**
   * Load image from file path
   */
  private async loadImageFromPath(imagePath: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = error => reject(error);

      // Convert file system path to web-accessible path
      // In production, this would be served by the web server
      const webPath = imagePath.replace(process.cwd(), '').replace(/\\/g, '/');
      image.src = webPath;
    });
  }

  /**
   * Get loading statistics
   */
  getStats(): {
    totalAssets: number;
    loadedAssets: number;
    categories: Record<string, number>;
  } {
    const categories: Record<string, number> = {};

    for (const [key] of this.assetManifest) {
      const category = key.split('/')[0];
      categories[category] = (categories[category] || 0) + 1;
    }

    return {
      totalAssets: this.assetManifest.size,
      loadedAssets: this.loadedAssets.size,
      categories,
    };
  }

  /**
   * Verify asset integrity
   */
  async verifyAssets(): Promise<{
    valid: boolean;
    missing: string[];
    corrupted: string[];
  }> {
    const missing: string[] = [];
    const corrupted: string[] = [];

    // Check essential assets
    const essentialAssets = [
      'ui/orbs/Hitpoints_orb',
      'ui/orbs/Prayer_orb',
      'player/models/Player_male_base',
      'npc/models/Goblin_model',
      'effects/hitsplats/Red_hitsplat',
    ];

    for (const assetPath of essentialAssets) {
      const metadata = this.assetManifest.get(assetPath);

      if (!metadata) {
        missing.push(assetPath);
        continue;
      }

      // Check if files exist
      for (const variant of metadata.variants) {
        if (!(await fs.pathExists(variant.path))) {
          corrupted.push(assetPath);
          break;
        }
      }
    }

    return {
      valid: missing.length === 0 && corrupted.length === 0,
      missing,
      corrupted,
    };
  }
}
