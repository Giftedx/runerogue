/**
 * OSRS Cache Reader Integration
 *
 * Integrates the osrscachereader JavaScript library to extract assets directly from OSRS cache
 * This provides the most comprehensive and authentic asset extraction possible
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

interface SpriteData {
  sprites: unknown[];
  [key: string]: unknown;
}

interface CacheAsset {
  id: number;
  name: string;
  category:
    | 'item'
    | 'npc'
    | 'object'
    | 'sprite'
    | 'model'
    | 'animation'
    | 'sound'
    | 'interface'
    | 'texture';
  data?: unknown;
  extractedFiles: string[];
  metadata: {
    combatLevel?: number;
    models?: number[];
    sprites?: SpriteData[];
    animations?: number[];
    [key: string]: unknown;
  };
}

interface CacheExtractionResult {
  totalAssets: number;
  categories: { [key: string]: number };
  extractedAssets: CacheAsset[];
  errors: string[];
  manifest: {
    version: string;
    extractedAt: string;
    cacheSource: string;
    assets: { [id: string]: CacheAsset };
  };
}

/**
 * OSRS Cache Reader and Extractor
 */
export class OSRSCacheReader {
  private cacheDir: string;
  private outputDir: string;
  private logFile: string;

  constructor(cacheDir?: string, outputDir?: string) {
    this.cacheDir = cacheDir || this.findOSRSCache();
    this.outputDir = outputDir || path.join(process.cwd(), 'cache-assets');
    this.logFile = path.join(this.outputDir, 'cache-extraction.log');
  }

  /**
   * Find OSRS cache directory on the system
   */
  private findOSRSCache(): string {
    const possiblePaths = [
      path.join(process.env.USERPROFILE || '', 'jagexcache', 'oldschool', 'LIVE'),
      path.join(process.env.HOME || '', 'jagexcache', 'oldschool', 'LIVE'),
      './cache', // Local cache directory
      './downloaded-cache', // Downloaded from OpenRS2
    ];

    for (const cachePath of possiblePaths) {
      if (fs.existsSync(path.join(cachePath, 'main_file_cache.dat2'))) {
        this.log(`Found OSRS cache at: ${cachePath}`);
        return cachePath;
      }
    }

    throw new Error(
      'OSRS cache not found. Please ensure OSRS is installed or download cache from OpenRS2'
    );
  }

  /**
   * Install osrscachereader dependency
   */
  async installCacheReader(): Promise<void> {
    try {
      // Check if already installed
      execSync('npm list osrscachereader', { stdio: 'ignore' });
      this.log('osrscachereader already installed');
    } catch {
      this.log('Installing osrscachereader...');
      execSync('npm install osrscachereader', { stdio: 'inherit' });
      this.log('osrscachereader installed successfully');
    }
  }
  /**
   * Extract all assets from cache
   */
  async extractAllAssets(): Promise<CacheExtractionResult> {
    await this.setupDirectories();
    await this.installCacheReader();

    const result: CacheExtractionResult = {
      totalAssets: 0,
      categories: {},
      extractedAssets: [],
      errors: [],
      manifest: {
        version: '1.0.0',
        extractedAt: new Date().toISOString(),
        cacheSource: this.cacheDir,
        assets: {},
      },
    };

    try {
      // Import the cache reader (dynamic import for runtime loading)
      this.log('Dynamically importing osrscachereader...');
      const osrsCacheModule = await import('osrscachereader');
      const { RSCache, IndexType, ConfigType } = osrsCacheModule;

      this.log('Initializing cache reader...');
      const cache = new RSCache(this.cacheDir);

      // Wait for cache to load
      await cache.onload;
      this.log('Cache loaded successfully');

      // Extract different asset types
      await this.extractItems(cache, result, { IndexType, ConfigType });
      await this.extractNPCs(cache, result, { IndexType, ConfigType });
      await this.extractObjects(cache, result, { IndexType, ConfigType });
      await this.extractSprites(cache, result, { IndexType, ConfigType });
      await this.extractModels(cache, result, { IndexType, ConfigType });
      await this.extractAnimations(cache, result, { IndexType, ConfigType });

      // Generate manifest
      result.totalAssets = result.extractedAssets.length;
      result.extractedAssets.forEach(asset => {
        result.manifest.assets[asset.id.toString()] = asset;
        result.categories[asset.category] = (result.categories[asset.category] || 0) + 1;
      });

      await this.saveManifest(result.manifest);
      this.log(`Extraction complete: ${result.totalAssets} assets extracted`);

      return result;
    } catch (error) {
      const errorMsg = `Cache extraction failed: ${error}`;
      this.log(errorMsg);
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Extract item definitions and sprites
   */
  private async extractItems(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting items...');

    try {
      // Use the proper cache API to get all items
      const allItems = await (cache as any).getAllDefs(
        (cacheTypes.IndexType as any).CONFIGS,
        (cacheTypes.ConfigType as any).ITEM
      );
      const itemsDir = path.join(this.outputDir, 'items');
      await fs.ensureDir(itemsDir);

      let extractedCount = 0;
      for (const item of allItems) {
        if (item && item.name && item.name !== 'null') {
          try {
            // Save item definition
            const itemFile = path.join(itemsDir, `${item.id}.json`);
            await fs.writeJson(itemFile, item, { spaces: 2 });

            // Try to extract inventory icon sprite
            if (item.inventoryModel) {
              await this.extractItemSprite(cache, item, itemsDir);
            }

            const asset: CacheAsset = {
              id: item.id,
              name: item.name,
              category: 'item',
              data: item,
              extractedFiles: [itemFile],
              metadata: {
                models: item.inventoryModel ? [item.inventoryModel] : [],
              },
            };

            result.extractedAssets.push(asset);
            extractedCount++;

            if (extractedCount % 100 === 0) {
              this.log(`Extracted ${extractedCount} items...`);
            }
          } catch (error) {
            this.log(`Failed to extract item ${item.id}: ${error}`, 'warn');
          }
        }
      }

      result.categories.items = extractedCount;
      this.log(`Extracted ${extractedCount} items`);
    } catch (error) {
      const errorMsg = `Item extraction failed: ${error}`;
      this.log(errorMsg, 'error');
      result.errors.push(errorMsg);
    }
  }
  /**
   * Helper: Save sprite data to PNG file
   */
  private async saveSpriteToPNG(sprite: unknown, filePath: string): Promise<void> {
    try {
      // Try to import canvas for image creation, make it optional
      let createCanvas: any;
      try {
        const canvasModule = await import('canvas');
        createCanvas = canvasModule.createCanvas;
      } catch (error) {
        this.log('Canvas not available, creating placeholder for sprite', 'warn');
        await fs.writeFile(
          filePath + '.placeholder',
          `Sprite extraction requires canvas package. Install with: npm install canvas\nError: ${error}`
        );
        return;
      }

      const spriteData = sprite as any;
      if (!spriteData.pixels || !spriteData.width || !spriteData.height) {
        throw new Error('Invalid sprite data');
      }

      const canvas = createCanvas(spriteData.width, spriteData.height);
      const ctx = canvas.getContext('2d');

      // Create image data from sprite pixels
      const imageData = ctx.createImageData(spriteData.width, spriteData.height);

      // Convert OSRS sprite format to RGBA
      for (let i = 0; i < spriteData.pixels.length; i++) {
        const pixel = spriteData.pixels[i];
        const r = (pixel >> 16) & 0xff;
        const g = (pixel >> 8) & 0xff;
        const b = pixel & 0xff;
        const a = pixel === 0 ? 0 : 255; // Transparent if pixel is 0

        imageData.data[i * 4] = r;
        imageData.data[i * 4 + 1] = g;
        imageData.data[i * 4 + 2] = b;
        imageData.data[i * 4 + 3] = a;
      }

      ctx.putImageData(imageData, 0, 0);

      // Save as PNG
      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(filePath, buffer);
    } catch (error) {
      this.log(`Failed to save sprite PNG: ${error}`, 'warn');
      // Create a placeholder file
      await fs.writeFile(filePath + '.placeholder', `Sprite extraction failed: ${error}`);
    }
  }

  /**
   * Helper: Export model to GLTF format
   */
  private async exportModelToGLTF(model: unknown, filePath: string, cache: unknown): Promise<void> {
    try {
      // Import GLTF exporter from osrscachereader
      const { GLTFExporter } = await import('osrscachereader');

      const exporter = new GLTFExporter();
      const gltfData = await exporter.export(model, cache);

      await fs.writeJson(filePath, gltfData, { spaces: 2 });
    } catch (error) {
      this.log(`Failed to export model to GLTF: ${error}`, 'warn');
      // Create a placeholder file
      await fs.writeFile(filePath + '.placeholder', `GLTF export failed: ${error}`);
    }
  }

  /**
   * Extract item sprite (simplified version)
   */
  private async extractItemSprite(cache: unknown, item: unknown, itemsDir: string): Promise<void> {
    try {
      const itemData = item as any;
      // This is a simplified version - actual sprite extraction is complex
      // and would require understanding the model-to-sprite rendering process

      // For now, we'll create a placeholder for item sprites
      const spritePath = path.join(itemsDir, `${itemData.id}_sprite.png.placeholder`);

      // In a full implementation, this would:
      // 1. Load the inventory model
      // 2. Render it to a bitmap
      // 3. Save as PNG

      await fs.writeFile(
        spritePath,
        `Item sprite placeholder for ${itemData.name} (ID: ${itemData.id})\nInventory Model: ${itemData.inventoryModel || 'None'}`
      );
    } catch (error) {
      this.log(`Failed to extract item sprite: ${error}`, 'warn');
    }
  }

  /**
   * Save extraction manifest
   */
  private async saveManifest(manifest: CacheExtractionResult['manifest']): Promise<void> {
    const manifestPath = path.join(this.outputDir, 'cache-manifest.json');
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    this.log(`Manifest saved to: ${manifestPath}`);
  }

  /**
   * Extract NPC definitions
   */
  private async extractNPCs(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting NPCs...');

    try {
      const allNPCs = await (cache as any).getAllDefs(
        (cacheTypes.IndexType as any).CONFIGS,
        (cacheTypes.ConfigType as any).NPC
      );
      const npcsDir = path.join(this.outputDir, 'npcs');
      await fs.ensureDir(npcsDir);

      let extractedCount = 0;
      for (const npc of allNPCs) {
        if (npc && npc.name && npc.name !== 'null') {
          try {
            const npcFile = path.join(npcsDir, `${npc.id}.json`);
            await fs.writeJson(npcFile, npc, { spaces: 2 });

            const asset: CacheAsset = {
              id: npc.id,
              name: npc.name,
              category: 'npc',
              data: npc,
              extractedFiles: [npcFile],
              metadata: {
                combatLevel: npc.combatLevel,
                models: npc.models || [],
                animations: npc.animations || [],
              },
            };

            result.extractedAssets.push(asset);
            extractedCount++;

            if (extractedCount % 100 === 0) {
              this.log(`Extracted ${extractedCount} NPCs...`);
            }
          } catch (error) {
            this.log(`Failed to extract NPC ${npc.id}: ${error}`, 'warn');
          }
        }
      }

      result.categories.npcs = extractedCount;
      this.log(`Extracted ${extractedCount} NPCs`);
    } catch (error) {
      const errorMsg = `NPC extraction failed: ${error}`;
      this.log(errorMsg, 'error');
      result.errors.push(errorMsg);
    }
  }

  /**
   * Extract object definitions
   */
  private async extractObjects(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting objects...');

    try {
      const allObjects = await (cache as any).getAllDefs(
        (cacheTypes.IndexType as any).CONFIGS,
        (cacheTypes.ConfigType as any).OBJECT
      );
      const objectsDir = path.join(this.outputDir, 'objects');
      await fs.ensureDir(objectsDir);

      let extractedCount = 0;
      for (const obj of allObjects) {
        if (obj && obj.name && obj.name !== 'null') {
          try {
            const objFile = path.join(objectsDir, `${obj.id}.json`);
            await fs.writeJson(objFile, obj, { spaces: 2 });

            const asset: CacheAsset = {
              id: obj.id,
              name: obj.name,
              category: 'object',
              data: obj,
              extractedFiles: [objFile],
              metadata: {
                models: obj.models || [],
                animations: obj.animations || [],
              },
            };

            result.extractedAssets.push(asset);
            extractedCount++;

            if (extractedCount % 100 === 0) {
              this.log(`Extracted ${extractedCount} objects...`);
            }
          } catch (error) {
            this.log(`Failed to extract object ${obj.id}: ${error}`, 'warn');
          }
        }
      }

      result.categories.objects = extractedCount;
      this.log(`Extracted ${extractedCount} objects`);
    } catch (error) {
      const errorMsg = `Object extraction failed: ${error}`;
      this.log(errorMsg, 'error');
      result.errors.push(errorMsg);
    }
  }

  /**
   * Extract sprite definitions and images
   */
  private async extractSprites(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting sprites...');

    try {
      // Get sprites index to enumerate all sprite archives
      const spritesIndex = (cache as any).getIndex((cacheTypes.IndexType as any).SPRITES);
      const archiveKeys = Object.keys(spritesIndex.archives);
      const spritesDir = path.join(this.outputDir, 'sprites');
      await fs.ensureDir(spritesDir);

      let extractedCount = 0;
      for (const archiveId of archiveKeys) {
        try {
          const spriteFile = await (cache as any).getFile(
            (cacheTypes.IndexType as any).SPRITES,
            parseInt(archiveId)
          );

          if (spriteFile && spriteFile.def && spriteFile.def.sprites) {
            // Save sprite definition
            const spriteDefFile = path.join(spritesDir, `${archiveId}.json`);
            await fs.writeJson(spriteDefFile, spriteFile.def, { spaces: 2 });

            // Extract individual sprite images using Canvas
            const extractedFiles = [spriteDefFile];
            for (let i = 0; i < spriteFile.def.sprites.length; i++) {
              const sprite = spriteFile.def.sprites[i];
              if (sprite && sprite.pixels) {
                const spriteImageFile = path.join(spritesDir, `${archiveId}_${i}.png`);
                await this.saveSpriteToPNG(sprite, spriteImageFile);
                extractedFiles.push(spriteImageFile);
              }
            }

            const asset: CacheAsset = {
              id: parseInt(archiveId),
              name: spriteFile.nameHash ? spriteFile.nameHash.toString() : `sprite_${archiveId}`,
              category: 'sprite',
              data: spriteFile.def,
              extractedFiles,
              metadata: {
                sprites: spriteFile.def.sprites,
                nameHash: spriteFile.nameHash,
              },
            };

            result.extractedAssets.push(asset);
            extractedCount++;

            if (extractedCount % 50 === 0) {
              this.log(`Extracted ${extractedCount} sprites...`);
            }
          }
        } catch (error) {
          this.log(`Failed to extract sprite ${archiveId}: ${error}`, 'warn');
        }
      }

      result.categories.sprites = extractedCount;
      this.log(`Extracted ${extractedCount} sprites`);
    } catch (error) {
      const errorMsg = `Sprite extraction failed: ${error}`;
      this.log(errorMsg, 'error');
      result.errors.push(errorMsg);
    }
  }

  /**
   * Extract model definitions
   */
  private async extractModels(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting models...');

    try {
      // Get models index to enumerate all model archives
      const modelsIndex = (cache as any).getIndex((cacheTypes.IndexType as any).MODELS);
      const archiveKeys = Object.keys(modelsIndex.archives);
      const modelsDir = path.join(this.outputDir, 'models');
      await fs.ensureDir(modelsDir);

      let extractedCount = 0;
      for (const archiveId of archiveKeys) {
        try {
          const model = await (cache as any).getDef(
            (cacheTypes.IndexType as any).MODELS,
            parseInt(archiveId)
          );

          if (model) {
            // Save model definition
            const modelFile = path.join(modelsDir, `${archiveId}.json`);
            await fs.writeJson(modelFile, model, { spaces: 2 });

            // Optionally export as GLTF if the exporter is available
            const gltfFile = path.join(modelsDir, `${archiveId}.gltf`);
            await this.exportModelToGLTF(model, gltfFile, cache);

            const asset: CacheAsset = {
              id: parseInt(archiveId),
              name: `model_${archiveId}`,
              category: 'model',
              data: model,
              extractedFiles: [modelFile, gltfFile],
              metadata: {
                vertexCount: model.vertexCount || 0,
                faceCount: model.faceCount || 0,
              },
            };

            result.extractedAssets.push(asset);
            extractedCount++;

            if (extractedCount % 50 === 0) {
              this.log(`Extracted ${extractedCount} models...`);
            }
          }
        } catch (error) {
          this.log(`Failed to extract model ${archiveId}: ${error}`, 'warn');
        }
      }

      result.categories.models = extractedCount;
      this.log(`Extracted ${extractedCount} models`);
    } catch (error) {
      const errorMsg = `Model extraction failed: ${error}`;
      this.log(errorMsg, 'error');
      result.errors.push(errorMsg);
    }
  }

  /**
   * Extract animation definitions
   */
  private async extractAnimations(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting animations...');

    try {
      const allAnimations = await (cache as any).getAllDefs(
        (cacheTypes.IndexType as any).CONFIGS,
        (cacheTypes.ConfigType as any).SEQUENCE
      );
      const animationsDir = path.join(this.outputDir, 'animations');
      await fs.ensureDir(animationsDir);

      let extractedCount = 0;
      for (const anim of allAnimations) {
        if (anim) {
          try {
            const animFile = path.join(animationsDir, `${anim.id}.json`);
            await fs.writeJson(animFile, anim, { spaces: 2 });

            const asset: CacheAsset = {
              id: anim.id,
              name: anim.name || `animation_${anim.id}`,
              category: 'animation',
              data: anim,
              extractedFiles: [animFile],
              metadata: {
                frameCount: anim.frameCount || 0,
                duration: anim.duration || 0,
              },
            };

            result.extractedAssets.push(asset);
            extractedCount++;

            if (extractedCount % 100 === 0) {
              this.log(`Extracted ${extractedCount} animations...`);
            }
          } catch (error) {
            this.log(`Failed to extract animation ${anim.id}: ${error}`, 'warn');
          }
        }
      }

      result.categories.animations = extractedCount;
      this.log(`Extracted ${extractedCount} animations`);
    } catch (error) {
      const errorMsg = `Animation extraction failed: ${error}`;
      this.log(errorMsg, 'error');
      result.errors.push(errorMsg);
    }
  }

  /**
   * Set up extraction directories
   */
  private async setupDirectories(): Promise<void> {
    const directories = [
      this.outputDir,
      path.join(this.outputDir, 'items'),
      path.join(this.outputDir, 'npcs'),
      path.join(this.outputDir, 'objects'),
      path.join(this.outputDir, 'sprites'),
      path.join(this.outputDir, 'models'),
      path.join(this.outputDir, 'animations'),
      path.join(this.outputDir, 'sounds'),
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
    }

    this.log(`Created extraction directories in: ${this.outputDir}`);
  }

  /**
   * Download OSRS cache from OpenRS2 archive
   */
  async downloadCache(outputPath?: string): Promise<string> {
    const cachePath = outputPath || path.join(process.cwd(), 'downloaded-cache');

    this.log('Downloading OSRS cache from OpenRS2 archive...');

    // This would need to be implemented to download and extract cache from OpenRS2
    // For now, provide instructions
    const instructions = `
To download OSRS cache:
1. Visit: https://archive.openrs2.org/caches
2. Find the latest "oldschool" "live" cache
3. Download the "Cache (.dat2/.idx)" ZIP file
4. Extract to: ${cachePath}
5. Run the extraction again

Example cache URL (check for latest):
https://archive.openrs2.org/caches/runescape/XXXX/disk.zip
`;

    await fs.writeFile(path.join(cachePath, 'DOWNLOAD_INSTRUCTIONS.txt'), instructions);
    this.log(
      'Cache download instructions written to: ' + path.join(cachePath, 'DOWNLOAD_INSTRUCTIONS.txt')
    );

    return cachePath;
  }

  /**
   * Log messages with timestamp
   */
  private log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    console.log(logMessage);

    // Append to log file
    try {
      fs.appendFileSync(this.logFile, logMessage + '\n');
    } catch {
      // Ignore log file errors
    }
  }
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const cacheReader = new OSRSCacheReader();

  try {
    console.log('=== OSRS Cache Asset Extraction ===');

    const result = await cacheReader.extractAllAssets();

    console.log('\n=== EXTRACTION RESULTS ===');
    console.log(`Total assets extracted: ${result.totalAssets}`);
    console.log('Categories:');
    for (const [category, count] of Object.entries(result.categories)) {
      console.log(`  ${category}: ${count}`);
    }

    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }
  } catch (error) {
    console.error('Cache extraction failed:', error.message);

    if (error.message.includes('cache not found')) {
      console.log('\nTo download OSRS cache from OpenRS2:');
      try {
        await cacheReader.downloadCache();
      } catch (downloadError) {
        console.error('Failed to create download instructions:', downloadError.message);
      }
    }

    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { OSRSCacheReader, CacheAsset, CacheExtractionResult };
