import fs from 'fs-extra';
import path from 'path';

interface ComprehensiveAssetManifest {
  version: string;
  extractedAt: string;
  sources: string[];
  totalAssets: number;
  categories: {
    items: number;
    npcs: number;
    objects: number;
    sprites: number;
    models: number;
    animations: number;
    sounds: number;
    interfaces: number;
  };
  assets: AssetEntry[];
}

interface AssetEntry {
  id: string;
  name: string;
  category: string;
  sources: string[];
  files: AssetFile[];
  metadata: Record<string, unknown>;
  verified: boolean;
}

interface AssetFile {
  format: string;
  path: string;
  size: number;
  url?: string;
  hash?: string;
}

/**
 * Comprehensive OSRS Asset Coordinator
 * Orchestrates extraction from all available sources and creates unified manifest
 */
export class ComprehensiveAssetCoordinator {
  private outputDir: string;
  private extractedAssets: Map<string, AssetEntry> = new Map();
  private manifest: ComprehensiveAssetManifest;

  constructor(outputDir: string = './comprehensive-assets') {
    this.outputDir = outputDir;
    this.manifest = this.initializeManifest();
  }

  private initializeManifest(): ComprehensiveAssetManifest {
    return {
      version: '1.0.0',
      extractedAt: new Date().toISOString(),
      sources: [
        'osrs-cache-reader',
        'mcp-osrs-data',
        'runemonk-viewer',
        'osrs-wiki',
        'firecrawl-scraping',
      ],
      totalAssets: 0,
      categories: {
        items: 0,
        npcs: 0,
        objects: 0,
        sprites: 0,
        models: 0,
        animations: 0,
        sounds: 0,
        interfaces: 0,
      },
      assets: [],
    };
  }

  /**
   * Coordinate extraction from all sources
   */
  async coordinateExtraction(): Promise<ComprehensiveAssetManifest> {
    console.log('=== Starting Comprehensive OSRS Asset Extraction ===');

    await this.setupDirectories();

    // Phase 1: Cache-based extraction (most comprehensive)
    await this.extractFromCache();

    // Phase 2: MCP metadata enrichment
    await this.enrichWithMCPData();

    // Phase 3: Web-based asset discovery
    await this.extractFromWebSources();

    // Phase 4: Asset verification and optimization
    await this.verifyAndOptimizeAssets();

    // Phase 5: Generate final manifest
    await this.generateFinalManifest();

    console.log(`\n=== Extraction Complete ===`);
    console.log(`Total assets: ${this.manifest.totalAssets}`);
    console.log(`Output directory: ${this.outputDir}`);

    return this.manifest;
  }

  /**
   * Extract assets from OSRS cache
   */
  private async extractFromCache(): Promise<void> {
    console.log('\nPhase 1: Cache-based extraction...');

    try {
      // Check if osrscachereader is available
      const { OSRSCacheReader } = await import('./osrs-cache-reader');
      const cacheReader = new OSRSCacheReader(undefined, path.join(this.outputDir, 'cache'));

      const result = await cacheReader.extractAllAssets();
      this.integrateCacheResults(result);

      console.log(`Cache extraction: ${result.totalAssets} assets`);
    } catch (error) {
      console.warn(`Cache extraction failed: ${error.message}`);
      await this.createCacheInstructions();
    }
  }

  /**
   * Enrich with MCP OSRS data
   */
  private async enrichWithMCPData(): Promise<void> {
    console.log('\nPhase 2: MCP data enrichment...');

    try {
      // Use existing MCP extractors
      const mcpAssets = await this.extractMCPAssets();
      this.integrateMCPResults(mcpAssets);

      console.log(`MCP enrichment: ${mcpAssets.length} definitions`);
    } catch (error) {
      console.warn(`MCP enrichment failed: ${error.message}`);
    }
  }

  /**
   * Extract from web sources
   */
  private async extractFromWebSources(): Promise<void> {
    console.log('\nPhase 3: Web-based extraction...');

    try {
      // Wiki extraction
      await this.extractFromWiki();

      // RuneMonk extraction guide
      await this.createRuneMonkGuide();

      // Firecrawl scraping
      await this.extractViaFirecrawl();
    } catch (error) {
      console.warn(`Web extraction failed: ${error.message}`);
    }
  }

  /**
   * Verify and optimize assets
   */
  private async verifyAndOptimizeAssets(): Promise<void> {
    console.log('\nPhase 4: Asset verification and optimization...');

    let verifiedCount = 0;
    for (const [id, asset] of this.extractedAssets) {
      try {
        await this.verifyAsset(asset);
        asset.verified = true;
        verifiedCount++;
      } catch (error) {
        console.warn(`Asset verification failed for ${id}: ${error.message}`);
        asset.verified = false;
      }
    }

    console.log(`Verified ${verifiedCount} assets`);
  }

  /**
   * Generate final manifest
   */
  private async generateFinalManifest(): Promise<void> {
    console.log('\nPhase 5: Generating manifest...');

    this.manifest.assets = Array.from(this.extractedAssets.values());
    this.manifest.totalAssets = this.manifest.assets.length;

    // Update category counts
    for (const asset of this.manifest.assets) {
      if (asset.category in this.manifest.categories) {
        this.manifest.categories[asset.category as keyof typeof this.manifest.categories]++;
      }
    }

    const manifestPath = path.join(this.outputDir, 'comprehensive-manifest.json');
    await fs.writeJson(manifestPath, this.manifest, { spaces: 2 });

    console.log(`Manifest saved to: ${manifestPath}`);
  }

  /**
   * Set up directory structure
   */
  private async setupDirectories(): Promise<void> {
    const directories = [
      this.outputDir,
      path.join(this.outputDir, 'cache'),
      path.join(this.outputDir, 'mcp'),
      path.join(this.outputDir, 'wiki'),
      path.join(this.outputDir, 'runemonk'),
      path.join(this.outputDir, 'firecrawl'),
      path.join(this.outputDir, 'optimized'),
      path.join(this.outputDir, 'manifests'),
    ];

    for (const dir of directories) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * Create cache extraction instructions
   */
  private async createCacheInstructions(): Promise<void> {
    const instructions = `
# OSRS Cache Extraction Instructions

The cache-based extraction provides the most comprehensive and authentic assets.

## Option 1: Use Local OSRS Cache

If you have OSRS installed:
1. The cache should be automatically detected at:
   - Windows: C:\\Users\\{username}\\jagexcache\\oldschool\\LIVE
   - Linux: /home/{username}/jagexcache/oldschool/LIVE

2. Install osrscachereader:
   npm install osrscachereader

3. Run the cache extractor:
   npm run extract-cache

## Option 2: Download Complete Cache from OpenRS2

1. Visit: https://archive.openrs2.org/caches
2. Find the latest "oldschool" "live" cache
3. Download "Cache (.dat2/.idx)" ZIP file
4. Extract to ./downloaded-cache/
5. Run extraction again

## What Cache Extraction Provides

- All item definitions and sprites
- All NPC models and animations  
- All object/environment models
- UI sprites and interface elements
- Sound effects and music
- Complete texture sets
- Animation sequences

This is the gold standard for OSRS asset extraction.
`;

    await fs.writeFile(path.join(this.outputDir, 'CACHE_INSTRUCTIONS.md'), instructions);
  }

  /**
   * Extract MCP assets (placeholder)
   */
  private async extractMCPAssets(): Promise<AssetEntry[]> {
    // This would integrate with the MCP OSRS tools
    // For now, return empty array
    return [];
  }

  /**
   * Extract from OSRS Wiki (placeholder)
   */
  private async extractFromWiki(): Promise<void> {
    // This would use the existing wiki extractor
    console.log('Wiki extraction: Use existing osrs-asset-extractor.ts');
  }

  /**
   * Create RuneMonk extraction guide
   */
  private async createRuneMonkGuide(): Promise<void> {
    const guide = `
# RuneMonk Asset Extraction Guide

RuneMonk provides high-quality 3D models and textures.

## Manual Extraction Process

1. Visit: https://runemonk.com/tools/entityviewer-beta/
2. Browse NPCs, Objects, Items, Models
3. Download GLTF/OBJ files for entities with models
4. Save to ./runemonk/ subdirectories

## Automated Extraction (Advanced)

For automated extraction, implement:
- Browser automation with Puppeteer/Playwright
- API reverse engineering
- Bulk download scripts

## Asset Quality

RuneMonk assets are ideal for:
- High-quality 3D rendering
- Complete model geometry
- Proper textures and materials
- Animation data
`;

    await fs.writeFile(path.join(this.outputDir, 'RUNEMONK_GUIDE.md'), guide);
  }

  /**
   * Extract via Firecrawl (placeholder)
   */
  private async extractViaFirecrawl(): Promise<void> {
    // This would use Firecrawl MCP tools for web scraping
    console.log('Firecrawl extraction: Implement with MCP Firecrawl tools');
  }

  /**
   * Integrate cache extraction results
   */
  private integrateCacheResults(result: any): void {
    // Transform cache results into our asset format
    // This would need the actual cache reader result structure
  }

  /**
   * Integrate MCP results
   */
  private integrateMCPResults(assets: AssetEntry[]): void {
    for (const asset of assets) {
      this.extractedAssets.set(asset.id, asset);
    }
  }

  /**
   * Verify individual asset
   */
  private async verifyAsset(asset: AssetEntry): Promise<void> {
    for (const file of asset.files) {
      if (!(await fs.pathExists(file.path))) {
        throw new Error(`File not found: ${file.path}`);
      }

      const stats = await fs.stat(file.path);
      file.size = stats.size;
    }
  }

  /**
   * Get extraction summary
   */
  getSummary(): string {
    return `
=== OSRS Asset Extraction Summary ===

Total Assets: ${this.manifest.totalAssets}
Categories:
  - Items: ${this.manifest.categories.items}
  - NPCs: ${this.manifest.categories.npcs}  
  - Objects: ${this.manifest.categories.objects}
  - Sprites: ${this.manifest.categories.sprites}
  - Models: ${this.manifest.categories.models}
  - Animations: ${this.manifest.categories.animations}
  - Sounds: ${this.manifest.categories.sounds}
  - Interfaces: ${this.manifest.categories.interfaces}

Sources Used:
${this.manifest.sources.map(s => `  - ${s}`).join('\n')}

Output Directory: ${this.outputDir}
Manifest: ${path.join(this.outputDir, 'comprehensive-manifest.json')}

Next Steps:
1. Review extraction logs for any issues
2. Verify asset quality and completeness
3. Integrate assets into game client
4. Update asset loader to use new manifest
`;
  }
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const coordinator = new ComprehensiveAssetCoordinator('./ultimate-osrs-assets');

  try {
    const manifest = await coordinator.coordinateExtraction();
    console.log(coordinator.getSummary());

    return manifest;
  } catch (error) {
    console.error('Asset extraction failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { ComprehensiveAssetCoordinator, ComprehensiveAssetManifest, AssetEntry };
