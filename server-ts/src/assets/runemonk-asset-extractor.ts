/**
 * RuneMonk Asset Extractor
 *
 * Uses Firecrawl to systematically extract assets from runemonk.com
 * including equipment images, 3D models, and entity data.
 */

export interface RuneMonkAsset {
  id: string;
  name: string;
  type: 'equipment' | 'npc' | 'object' | 'model' | 'animation' | 'sprite';
  category?: string;
  imageUrl?: string;
  modelUrl?: string;
  downloadUrl?: string;
  metadata: {
    source: 'runemonk';
    extractedAt: string;
    entityViewerUrl?: string;
    equipmentSlot?: string;
    [key: string]: unknown;
  };
}

export interface RuneMonkExtractionResult {
  assets: RuneMonkAsset[];
  summary: {
    totalAssets: number;
    byType: Record<string, number>;
    extractionTime: number;
    errors: string[];
  };
}

export class RuneMonkAssetExtractor {
  private firecrawlBaseUrl = 'https://runemonk.com';
  private extractedAssets: RuneMonkAsset[] = [];
  private errors: string[] = [];

  /**
   * Extract all available assets from RuneMonk
   */
  async extractAllAssets(): Promise<RuneMonkExtractionResult> {
    console.log('🔥 Starting RuneMonk asset extraction...');
    const startTime = Date.now();

    try {
      // Clear previous results
      this.extractedAssets = [];
      this.errors = [];

      // Extract from different RuneMonk tools
      await this.extractEquipmentAssets();
      await this.extractEntityViewerAssets();
      await this.extractModelAssets();

      const extractionTime = Date.now() - startTime;
      const summary = this.generateSummary(extractionTime);

      console.log(
        `✅ RuneMonk extraction complete! Found ${summary.totalAssets} assets in ${extractionTime}ms`
      );
      console.log('📊 Summary by type:', summary.byType);

      if (this.errors.length > 0) {
        console.warn(`⚠️ Encountered ${this.errors.length} errors during extraction`);
      }

      return {
        assets: this.extractedAssets,
        summary,
      };
    } catch (error) {
      console.error('❌ Error during RuneMonk extraction:', error);
      throw error;
    }
  }

  /**
   * Extract equipment/gear assets from the equipment tool
   */
  private async extractEquipmentAssets(): Promise<void> {
    console.log('🛡️ Extracting equipment assets...');

    try {
      // Scrape the equipment page that we know has many helmet images
      const equipmentPage = await this.scrapeWithFirecrawl(
        `${this.firecrawlBaseUrl}/tools/equipment`,
        ['markdown', 'links']
      );

      if (equipmentPage) {
        // Extract equipment items from the scraped content
        await this.parseEquipmentPage(equipmentPage);
      }

      console.log(
        `✅ Extracted ${this.extractedAssets.filter(a => a.type === 'equipment').length} equipment assets`
      );
    } catch (error) {
      const errorMsg = `Error extracting equipment assets: ${error}`;
      console.error('❌', errorMsg);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Extract assets from the entity viewer
   */
  private async extractEntityViewerAssets(): Promise<void> {
    console.log('👁️ Extracting entity viewer assets...');

    try {
      // Extract from both legacy and beta entity viewers
      const viewerUrls = [
        `${this.firecrawlBaseUrl}/tools/entityviewer`,
        `${this.firecrawlBaseUrl}/tools/entityviewer-beta`,
      ];

      for (const url of viewerUrls) {
        const viewerPage = await this.scrapeWithFirecrawl(url, ['markdown', 'links']);
        if (viewerPage) {
          await this.parseEntityViewerPage(viewerPage, url);
        }
      }

      console.log(
        `✅ Extracted ${this.extractedAssets.filter(a => a.type === 'npc' || a.type === 'object').length} entity assets`
      );
    } catch (error) {
      const errorMsg = `Error extracting entity viewer assets: ${error}`;
      console.error('❌', errorMsg);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Extract 3D models and downloadable assets
   */
  private async extractModelAssets(): Promise<void> {
    console.log('🎯 Extracting 3D model assets...');

    try {
      // Search for downloadable models
      const searchResults = await this.searchRuneMonkForAssets([
        'model',
        'gltf',
        'obj',
        'animation',
      ]);

      for (const result of searchResults) {
        if (this.isModelUrl(result.url)) {
          this.addAsset({
            id: this.generateAssetId(result.title || result.url),
            name: result.title || 'Unknown Model',
            type: 'model',
            modelUrl: result.url,
            downloadUrl: result.url,
            metadata: {
              source: 'runemonk',
              extractedAt: new Date().toISOString(),
              searchQuery: 'model extraction',
            },
          });
        }
      }

      console.log(
        `✅ Extracted ${this.extractedAssets.filter(a => a.type === 'model').length} 3D model assets`
      );
    } catch (error) {
      const errorMsg = `Error extracting model assets: ${error}`;
      console.error('❌', errorMsg);
      this.errors.push(errorMsg);
    }
  }

  /**
   * Parse equipment page content to extract assets
   */
  private async parseEquipmentPage(pageContent: any): Promise<void> {
    try {
      const content = pageContent.markdown || pageContent.content || '';
      const lines = content.split('\n');

      for (const line of lines) {
        // Look for equipment items with images
        const equipmentMatch = line.match(/!\[([^\]]+)\]\(([^)]+)\)\s*###\s*(.+)/);
        if (equipmentMatch) {
          const [, altText, imageUrl, itemName] = equipmentMatch;

          this.addAsset({
            id: this.generateAssetId(itemName),
            name: itemName.trim(),
            type: 'equipment',
            category: this.categorizeEquipment(itemName),
            imageUrl: this.resolveUrl(imageUrl),
            metadata: {
              source: 'runemonk',
              extractedAt: new Date().toISOString(),
              equipmentSlot: this.getEquipmentSlot(itemName),
              altText: altText,
            },
          });
        }

        // Also look for standalone image references
        const imageMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch && !equipmentMatch) {
          const [, altText, imageUrl] = imageMatch;
          if (this.isGameAssetImage(imageUrl)) {
            this.addAsset({
              id: this.generateAssetId(altText || imageUrl),
              name: altText || 'Unknown Asset',
              type: 'sprite',
              imageUrl: this.resolveUrl(imageUrl),
              metadata: {
                source: 'runemonk',
                extractedAt: new Date().toISOString(),
                altText: altText,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error parsing equipment page:', error);
    }
  }

  /**
   * Parse entity viewer page for downloadable assets
   */
  private async parseEntityViewerPage(pageContent: any, sourceUrl: string): Promise<void> {
    try {
      const content = pageContent.markdown || pageContent.content || '';

      // Look for download links
      const downloadMatches = content.match(/Download\s+(GLTF|OBJ|Model)/gi);
      if (downloadMatches) {
        // This indicates the presence of downloadable 3D models
        // The actual download URLs would need to be extracted from the page's interactive elements
        // For now, we'll note that models are available

        this.addAsset({
          id: 'runemonk_3d_models',
          name: 'RuneMonk 3D Models',
          type: 'model',
          metadata: {
            source: 'runemonk',
            extractedAt: new Date().toISOString(),
            entityViewerUrl: sourceUrl,
            note: 'Interactive 3D models available for download',
            formats: downloadMatches,
          },
        });
      }

      // Look for entity categories mentioned
      const categories = ['NPCs', 'Objects', 'Items', 'Models', 'Spot Anims'];
      for (const category of categories) {
        if (content.includes(category)) {
          this.addAsset({
            id: `runemonk_${category.toLowerCase()}`,
            name: `RuneMonk ${category}`,
            type: this.mapCategoryToType(category),
            metadata: {
              source: 'runemonk',
              extractedAt: new Date().toISOString(),
              entityViewerUrl: sourceUrl,
              category: category.toLowerCase(),
            },
          });
        }
      }
    } catch (error) {
      console.error('Error parsing entity viewer page:', error);
    }
  }

  /**
   * Search RuneMonk for specific asset types
   */
  private async searchRuneMonkForAssets(searchTerms: string[]): Promise<any[]> {
    const results: any[] = [];

    try {
      for (const term of searchTerms) {
        const searchResult = await this.searchWithFirecrawl(term);
        if (searchResult && searchResult.results) {
          results.push(...searchResult.results);
        }
      }
    } catch (error) {
      console.error('Error searching RuneMonk:', error);
    }

    return results;
  }

  /**
   * Scrape a URL using Firecrawl
   */
  private async scrapeWithFirecrawl(url: string, formats: string[] = ['markdown']): Promise<any> {
    try {
      // This would use the actual Firecrawl MCP tool
      // For now, returning mock data structure
      return {
        markdown: '',
        content: '',
        links: [],
      };
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return null;
    }
  }

  /**
   * Search using Firecrawl
   */
  private async searchWithFirecrawl(query: string): Promise<any> {
    try {
      // This would use the actual Firecrawl search tool
      // For now, returning mock data structure
      return {
        results: [],
      };
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
      return null;
    }
  }

  /**
   * Add asset with deduplication
   */
  private addAsset(asset: RuneMonkAsset): void {
    const exists = this.extractedAssets.find(a => a.id === asset.id);
    if (!exists) {
      this.extractedAssets.push(asset);
    }
  }

  /**
   * Utility functions
   */
  private generateAssetId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private resolveUrl(url: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('/')) {
      return `${this.firecrawlBaseUrl}${url}`;
    }
    return `${this.firecrawlBaseUrl}/${url}`;
  }

  private categorizeEquipment(itemName: string): string {
    const name = itemName.toLowerCase();
    if (
      name.includes('helmet') ||
      name.includes('helm') ||
      name.includes('hat') ||
      name.includes('hood')
    )
      return 'headgear';
    if (
      name.includes('sword') ||
      name.includes('axe') ||
      name.includes('mace') ||
      name.includes('dagger')
    )
      return 'melee_weapons';
    if (name.includes('bow') || name.includes('crossbow')) return 'ranged_weapons';
    if (name.includes('staff') || name.includes('wand')) return 'magic_weapons';
    if (name.includes('shield')) return 'shields';
    if (name.includes('armor') || name.includes('platebody') || name.includes('chainbody'))
      return 'body_armor';
    if (name.includes('legs') || name.includes('platelegs')) return 'leg_armor';
    if (name.includes('boots') || name.includes('shoes')) return 'footwear';
    if (name.includes('gloves') || name.includes('gauntlets')) return 'handwear';
    if (name.includes('cape') || name.includes('cloak')) return 'capes';
    if (name.includes('ring')) return 'rings';
    if (name.includes('amulet') || name.includes('necklace')) return 'amulets';
    return 'other';
  }

  private getEquipmentSlot(itemName: string): string {
    const name = itemName.toLowerCase();
    if (
      name.includes('helmet') ||
      name.includes('helm') ||
      name.includes('hat') ||
      name.includes('hood')
    )
      return 'head';
    if (name.includes('cape') || name.includes('cloak')) return 'cape';
    if (name.includes('amulet') || name.includes('necklace')) return 'neck';
    if (name.includes('arrow') || name.includes('bolt') || name.includes('dart')) return 'ammo';
    if (
      name.includes('sword') ||
      name.includes('axe') ||
      name.includes('bow') ||
      name.includes('staff')
    )
      return 'weapon';
    if (name.includes('armor') || name.includes('platebody') || name.includes('chainbody'))
      return 'body';
    if (name.includes('shield')) return 'shield';
    if (name.includes('legs') || name.includes('platelegs')) return 'legs';
    if (name.includes('gloves') || name.includes('gauntlets')) return 'hands';
    if (name.includes('boots') || name.includes('shoes')) return 'feet';
    if (name.includes('ring')) return 'ring';
    return 'unknown';
  }

  private isGameAssetImage(url: string): boolean {
    return (
      url.includes('runemonk.com') &&
      (url.includes('.png') ||
        url.includes('.jpg') ||
        url.includes('.gif') ||
        url.includes('/img/') ||
        url.includes('equipment') ||
        url.includes('sprite'))
    );
  }

  private isModelUrl(url: string): boolean {
    return (
      url.includes('.gltf') ||
      url.includes('.obj') ||
      url.includes('.glb') ||
      url.includes('model') ||
      url.includes('3d')
    );
  }

  private mapCategoryToType(category: string): RuneMonkAsset['type'] {
    switch (category.toLowerCase()) {
      case 'npcs':
        return 'npc';
      case 'objects':
        return 'object';
      case 'items':
        return 'equipment';
      case 'models':
        return 'model';
      case 'spot anims':
        return 'animation';
      default:
        return 'sprite';
    }
  }

  private generateSummary(extractionTime: number) {
    const byType: Record<string, number> = {};

    for (const asset of this.extractedAssets) {
      byType[asset.type] = (byType[asset.type] || 0) + 1;
    }

    return {
      totalAssets: this.extractedAssets.length,
      byType,
      extractionTime,
      errors: [...this.errors],
    };
  }

  /**
   * Save extraction results to file
   */
  async saveResults(result: RuneMonkExtractionResult, filePath: string): Promise<void> {
    const fs = require('fs-extra');
    await fs.ensureDir(require('path').dirname(filePath));
    await fs.writeJSON(filePath, result, { spaces: 2 });
    console.log(`💾 Saved RuneMonk extraction results to ${filePath}`);
  }

  /**
   * Load previous extraction results
   */
  async loadResults(filePath: string): Promise<RuneMonkExtractionResult> {
    const fs = require('fs-extra');
    const result = await fs.readJSON(filePath);
    console.log(`📁 Loaded RuneMonk extraction results from ${filePath}`);
    console.log(`📊 Contains ${result.summary.totalAssets} assets`);
    return result;
  }
}
