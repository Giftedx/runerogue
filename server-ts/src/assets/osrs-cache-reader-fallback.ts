/**
 * OSRS Cache Reader Integration Plan & Fallback Implementation
 *
 * This file documents the comprehensive approach to integrating OSRS cache reading
 * and provides a fallback implementation when the osrscachereader package has compatibility issues.
 */

import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

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
    sprites?: unknown[];
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
 * OSRS Cache Reader Integration with Fallback Support
 */
class OSRSCacheReaderFallback {
  private cacheDir: string;
  private outputDir: string;
  private logFile: string;
  private osrsCacheReaderAvailable = false;

  constructor(cacheDir?: string, outputDir?: string) {
    this.cacheDir = cacheDir || this.findOSRSCache();
    this.outputDir = outputDir || path.join(process.cwd(), 'cache-assets');
    this.logFile = path.join(this.outputDir, 'cache-extraction.log');
  }

  /**
   * Check if osrscachereader is available and working
   */
  async checkOSRSCacheReaderAvailability(): Promise<boolean> {
    try {
      this.log('Checking osrscachereader availability...');

      // Try to import osrscachereader
      const osrsCacheModule = await import('osrscachereader');
      const { RSCache } = osrsCacheModule;

      if (RSCache) {
        this.osrsCacheReaderAvailable = true;
        this.log('✓ osrscachereader is available');
        return true;
      }
    } catch (error) {
      this.log(`✗ osrscachereader not available: ${error}`, 'warn');
    }

    this.osrsCacheReaderAvailable = false;
    return false;
  }

  /**
   * Extract all assets using best available method
   */
  async extractAllAssets(): Promise<CacheExtractionResult> {
    await this.setupDirectories();

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

    // Try osrscachereader first
    if (await this.checkOSRSCacheReaderAvailability()) {
      this.log('Using osrscachereader for extraction');
      return await this.extractWithOSRSCacheReader(result);
    }

    // Fallback to alternative extraction methods
    this.log('Using fallback extraction methods');
    return await this.extractWithFallbackMethods(result);
  }

  /**
   * Extract using osrscachereader package
   */
  private async extractWithOSRSCacheReader(
    result: CacheExtractionResult
  ): Promise<CacheExtractionResult> {
    try {
      const osrsCacheModule = await import('osrscachereader');
      const { RSCache, IndexType, ConfigType } = osrsCacheModule;

      this.log('Initializing osrscachereader...');
      const cache = new RSCache(this.cacheDir);

      // Wait for cache to load
      await cache.onload;
      this.log('Cache loaded successfully');

      // Extract different asset types
      await this.extractItemsWithOSRSCacheReader(cache, result, { IndexType, ConfigType });
      await this.extractNPCsWithOSRSCacheReader(cache, result, { IndexType, ConfigType });
      await this.extractObjectsWithOSRSCacheReader(cache, result, { IndexType, ConfigType });
      await this.extractSpritesWithOSRSCacheReader(cache, result, { IndexType, ConfigType });

      // Generate manifest
      result.totalAssets = result.extractedAssets.length;
      result.extractedAssets.forEach(asset => {
        result.manifest.assets[asset.id.toString()] = asset;
        result.categories[asset.category] = (result.categories[asset.category] || 0) + 1;
      });

      await this.saveManifest(result.manifest);
      this.log(`OSRSCacheReader extraction complete: ${result.totalAssets} assets extracted`);

      return result;
    } catch (error) {
      const errorMsg = `OSRSCacheReader extraction failed: ${error}`;
      this.log(errorMsg, 'error');
      result.errors.push(errorMsg);
      return result;
    }
  }

  /**
   * Extract using fallback methods (MCP, web scraping, etc.)
   */
  private async extractWithFallbackMethods(
    result: CacheExtractionResult
  ): Promise<CacheExtractionResult> {
    this.log('Starting fallback asset extraction...');

    // Method 1: Use MCP OSRS tools for asset enumeration
    await this.extractFromMCPTools(result);

    // Method 2: Use our existing OSRS Wiki extraction
    await this.extractFromOSRSWiki(result);

    // Method 3: Use web scraping for additional assets
    await this.extractFromWebSources(result);

    // Method 4: Create comprehensive asset manifest for future downloads
    await this.createAssetDownloadPlan(result);

    result.totalAssets = result.extractedAssets.length;
    result.extractedAssets.forEach(asset => {
      result.manifest.assets[asset.id.toString()] = asset;
      result.categories[asset.category] = (result.categories[asset.category] || 0) + 1;
    });

    await this.saveManifest(result.manifest);
    this.log(`Fallback extraction complete: ${result.totalAssets} assets extracted`);

    return result;
  }

  /**
   * Extract asset metadata from MCP OSRS tools
   */
  private async extractFromMCPTools(result: CacheExtractionResult): Promise<void> {
    this.log('Extracting asset metadata from MCP OSRS tools...');

    try {
      // This would use our existing MCP integration
      // Import the MCP extractor
      const { searchOSRSAssets } = await import('./mcp-osrs-extractor.js'); // Search for various asset types
      const itemResults = await searchOSRSAssets('dragon scimitar');
      const npcResults = await searchOSRSAssets('zulrah');
      const spriteResults = await searchOSRSAssets('interface');

      // Convert MCP results to our asset format
      // This would be implemented to parse MCP results into CacheAsset format
      this.log(
        `Found ${itemResults.length + npcResults.length + spriteResults.length} assets via MCP`
      );
    } catch (error) {
      this.log(`MCP extraction failed: ${error}`, 'warn');
      result.errors.push(`MCP extraction failed: ${error}`);
    }
  }

  /**
   * Use existing OSRS Wiki extraction
   */
  private async extractFromOSRSWiki(result: CacheExtractionResult): Promise<void> {
    this.log('Extracting assets from OSRS Wiki...');

    try {
      // Import and use our existing Wiki extractor
      const { OSRSAssetExtractor } = await import('./osrs-asset-extractor.js');
      const wikiExtractor = new OSRSAssetExtractor();
      await wikiExtractor.extractAllAssets(); // Extract all assets

      // Create a mock result for now since extractAllAssets returns void
      const wikiResult = {
        assets: {},
        totalAssets: 0,
      };
      for (const [category, assets] of Object.entries(wikiResult.assets)) {
        if (Array.isArray(assets)) {
          for (const asset of assets) {
            const assetData = asset as {
              name: string;
              files?: Array<{ path: string }>;
              [key: string]: unknown;
            };
            const cacheAsset: CacheAsset = {
              id: parseInt(assetData.name.replace(/\D/g, '') ?? '0'),
              name: assetData.name,
              category: category as any,
              data: assetData,
              extractedFiles: assetData.files?.map(f => f.path) ?? [],
              metadata: {
                source: 'osrs-wiki',
                ...(assetData.metadata && typeof assetData.metadata === 'object'
                  ? assetData.metadata
                  : {}),
              },
            };
            result.extractedAssets.push(cacheAsset);
          }
        }
      }

      this.log(`Extracted ${wikiResult.totalAssets} assets from OSRS Wiki`);
    } catch (error) {
      this.log(`Wiki extraction failed: ${error}`, 'warn');
      result.errors.push(`Wiki extraction failed: ${error}`);
    }
  }

  /**
   * Extract assets from web sources (RuneMonk, etc.)
   */
  private async extractFromWebSources(result: CacheExtractionResult): Promise<void> {
    this.log('Extracting assets from web sources...');

    try {
      // This would use Firecrawl or other web scraping to get assets
      // from RuneMonk, OSRSBox, etc.

      // Placeholder implementation
      this.log('Web source extraction - creating download plan');
    } catch (error) {
      this.log(`Web source extraction failed: ${error}`, 'warn');
      result.errors.push(`Web source extraction failed: ${error}`);
    }
  }

  /**
   * Create a comprehensive asset download plan
   */
  private async createAssetDownloadPlan(result: CacheExtractionResult): Promise<void> {
    this.log('Creating comprehensive asset download plan...');

    const downloadPlan = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      sources: [
        {
          name: 'OpenRS2 Cache Archive',
          url: 'https://archive.openrs2.org/caches',
          description: 'Complete OSRS cache files for direct extraction',
          priority: 1,
          assetTypes: ['sprites', 'models', 'animations', 'sounds'],
        },
        {
          name: 'OSRSBox Database',
          url: 'https://www.osrsbox.com/',
          description: 'Comprehensive item and NPC database with images',
          priority: 2,
          assetTypes: ['items', 'npcs', 'objects'],
        },
        {
          name: 'RuneMonk Entity Viewer',
          url: 'https://runemonk.com/',
          description: 'Interactive entity viewer with model previews',
          priority: 3,
          assetTypes: ['models', 'animations', 'sprites'],
        },
        {
          name: 'OSRS Wiki Images',
          url: 'https://oldschool.runescape.wiki/',
          description: 'High-quality images and documentation',
          priority: 4,
          assetTypes: ['sprites', 'icons', 'interfaces'],
        },
      ],
      extractionStrategy: {
        phase1: 'Download complete cache from OpenRS2',
        phase2: 'Extract using osrscachereader or alternative tools',
        phase3: 'Supplement with web-sourced assets',
        phase4: 'Generate unified manifest and optimize for game client',
      },
      instructions: [
        '1. Download latest OSRS cache from OpenRS2 archive',
        '2. Install osrscachereader or use alternative cache tools',
        '3. Run comprehensive extraction script',
        '4. Validate and optimize assets for web deployment',
        '5. Generate final manifest for game client integration',
      ],
    };

    const planPath = path.join(this.outputDir, 'asset-download-plan.json');
    await fs.writeJson(planPath, downloadPlan, { spaces: 2 });
    this.log(`Asset download plan saved: ${planPath}`);
  }

  /**
   * OSRSCacheReader specific extraction methods
   */
  private async extractItemsWithOSRSCacheReader(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    // Implementation would be similar to our main osrs-cache-reader.ts file
    this.log('Extracting items with OSRSCacheReader...');
    // ... implementation
  }

  private async extractNPCsWithOSRSCacheReader(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting NPCs with OSRSCacheReader...');
    // ... implementation
  }

  private async extractObjectsWithOSRSCacheReader(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting objects with OSRSCacheReader...');
    // ... implementation
  }

  private async extractSpritesWithOSRSCacheReader(
    cache: unknown,
    result: CacheExtractionResult,
    cacheTypes: { IndexType: unknown; ConfigType: unknown }
  ): Promise<void> {
    this.log('Extracting sprites with OSRSCacheReader...');
    // ... implementation
  }

  /**
   * Utility methods
   */
  private findOSRSCache(): string {
    const possiblePaths = [
      path.join(process.env.USERPROFILE || '', 'jagexcache', 'oldschool', 'LIVE'),
      path.join(process.env.HOME || '', 'jagexcache', 'oldschool', 'LIVE'),
      './cache',
      './downloaded-cache',
    ];

    for (const cachePath of possiblePaths) {
      if (fs.existsSync(path.join(cachePath, 'main_file_cache.dat2'))) {
        this.log(`Found OSRS cache at: ${cachePath}`);
        return cachePath;
      }
    }

    // Don't throw error, just return default path and let extraction handle it
    return './downloaded-cache';
  }

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

  private async saveManifest(manifest: CacheExtractionResult['manifest']): Promise<void> {
    const manifestPath = path.join(this.outputDir, 'cache-manifest.json');
    await fs.writeJson(manifestPath, manifest, { spaces: 2 });
    this.log(`Manifest saved to: ${manifestPath}`);
  }

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
  const cacheReader = new OSRSCacheReaderFallback();

  try {
    console.log('=== OSRS Cache Asset Extraction (with Fallback) ===');

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

    console.log('\nExtraction completed. Check the asset-download-plan.json for next steps.');
  } catch (error) {
    console.error('Cache extraction failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { OSRSCacheReaderFallback };
export type { CacheAsset, CacheExtractionResult };
