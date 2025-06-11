/**
 * Multi-Source Asset Coordinator
 *
 * Coordinates asset extraction from multiple sources (Wiki API, MCP, RuneMonk, etc.)
 * Handles deduplication, prioritization, and comprehensive asset management.
 */

import { OSRSEntity, EntityCatalog } from './mcp-asset-cataloger';
import { RuneMonkAsset, RuneMonkExtractionResult } from './runemonk-asset-extractor';

export interface UnifiedAsset {
  id: string;
  name: string;
  type:
    | 'npc'
    | 'object'
    | 'item'
    | 'sprite'
    | 'animation'
    | 'sound'
    | 'interface'
    | 'location'
    | 'equipment'
    | 'model';
  category?: string;

  // Asset URLs from different sources
  urls: {
    image?: string;
    model?: string;
    download?: string;
    wiki?: string;
  };

  // Source information
  sources: {
    wiki?: boolean;
    mcp?: boolean;
    runemonk?: boolean;
    firecrawl?: boolean;
  };

  // Metadata from all sources
  metadata: {
    mcpData?: any;
    runemonkData?: any;
    wikiData?: any;
    firecrawlData?: any;
    confidence: number; // 0-1 score based on source availability
    lastUpdated: string;
  };

  // Asset quality/priority
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'available' | 'missing' | 'partial' | 'error';
}

export interface ComprehensiveAssetManifest {
  assets: UnifiedAsset[];
  summary: {
    totalAssets: number;
    byType: Record<string, number>;
    bySource: Record<string, number>;
    byStatus: Record<string, number>;
    coverage: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  extraction: {
    startTime: string;
    endTime: string;
    duration: number;
    sources: string[];
    errors: string[];
  };
}

export class MultiSourceAssetCoordinator {
  private unifiedAssets: Map<string, UnifiedAsset> = new Map();
  private errors: string[] = [];

  /**
   * Coordinate comprehensive asset extraction from all sources
   */
  async extractComprehensiveAssets(): Promise<ComprehensiveAssetManifest> {
    console.log('🎯 Starting comprehensive multi-source asset extraction...');
    const startTime = new Date();

    try {
      // Clear previous results
      this.unifiedAssets.clear();
      this.errors = [];

      // Extract from all sources
      console.log('📚 Step 1: Extracting from OSRS Wiki API...');
      await this.extractFromWikiAPI();

      console.log('🗄️ Step 2: Cataloging from OSRS MCP data...');
      await this.extractFromMCP();

      console.log('🔥 Step 3: Extracting from RuneMonk...');
      await this.extractFromRuneMonk();

      console.log('🌐 Step 4: Enhanced web crawling...');
      await this.extractWithFirecrawl();

      console.log('🔗 Step 5: Cross-referencing and unifying...');
      await this.unifyAndPrioritize();

      const endTime = new Date();
      const manifest = this.generateManifest(startTime, endTime);

      console.log(`✅ Comprehensive extraction complete!`);
      console.log(`📊 Total assets: ${manifest.summary.totalAssets}`);
      console.log(`⏱️ Duration: ${manifest.extraction.duration}ms`);
      console.log(
        `📈 Coverage: ${manifest.summary.coverage.critical + manifest.summary.coverage.high} critical/high priority assets`
      );

      return manifest;
    } catch (error) {
      console.error('❌ Error during comprehensive extraction:', error);
      throw error;
    }
  }

  /**
   * Extract assets using existing Wiki API approach
   */
  private async extractFromWikiAPI(): Promise<void> {
    try {
      // Use existing OSRS asset extractor logic
      const wikiAssets = await this.getWikiAssets();

      for (const asset of wikiAssets) {
        this.addOrUpdateAsset({
          id: asset.id,
          name: asset.name,
          type: this.mapWikiType(asset.type),
          urls: {
            image: asset.imageUrl,
            wiki: asset.wikiUrl,
          },
          sources: { wiki: true },
          metadata: {
            wikiData: asset,
            confidence: 0.7,
            lastUpdated: new Date().toISOString(),
          },
          priority: this.calculatePriority(asset.type, asset.name),
          status: asset.imageUrl ? 'available' : 'partial',
        });
      }

      console.log(`✅ Wiki API: ${this.unifiedAssets.size} assets processed`);
    } catch (error) {
      console.error('❌ Wiki API extraction error:', error);
      this.errors.push(`Wiki API: ${error}`);
    }
  }

  /**
   * Extract and integrate MCP catalog data
   */
  private async extractFromMCP(): Promise<void> {
    try {
      const mcpCatalog = await this.getMCPCatalog();

      for (const entity of mcpCatalog.entities) {
        const assetId = this.generateUnifiedId(entity.name, entity.type);
        const existing = this.unifiedAssets.get(assetId);

        if (existing) {
          // Update existing asset with MCP data
          existing.sources.mcp = true;
          existing.metadata.mcpData = entity;
          existing.metadata.confidence = Math.min(existing.metadata.confidence + 0.2, 1.0);
        } else {
          // Create new asset from MCP data
          this.addOrUpdateAsset({
            id: assetId,
            name: entity.name,
            type: entity.type,
            category: entity.category,
            urls: {},
            sources: { mcp: true },
            metadata: {
              mcpData: entity,
              confidence: 0.6,
              lastUpdated: new Date().toISOString(),
            },
            priority: this.calculatePriority(entity.type, entity.name),
            status: 'missing', // MCP provides data but not assets
          });
        }
      }

      console.log(`✅ MCP: ${mcpCatalog.entities.length} entities processed`);
    } catch (error) {
      console.error('❌ MCP extraction error:', error);
      this.errors.push(`MCP: ${error}`);
    }
  }

  /**
   * Extract assets from RuneMonk
   */
  private async extractFromRuneMonk(): Promise<void> {
    try {
      const runemonkResults = await this.getRuneMonkAssets();

      for (const asset of runemonkResults.assets) {
        const assetId = this.generateUnifiedId(asset.name, asset.type);
        const existing = this.unifiedAssets.get(assetId);

        if (existing) {
          // Update existing asset with RuneMonk data
          existing.sources.runemonk = true;
          existing.urls.image = existing.urls.image || asset.imageUrl;
          existing.urls.model = existing.urls.model || asset.modelUrl;
          existing.urls.download = existing.urls.download || asset.downloadUrl;
          existing.metadata.runemonkData = asset;
          existing.metadata.confidence = Math.min(existing.metadata.confidence + 0.3, 1.0);

          if (asset.imageUrl || asset.modelUrl) {
            existing.status = 'available';
          }
        } else {
          // Create new asset from RuneMonk data
          this.addOrUpdateAsset({
            id: assetId,
            name: asset.name,
            type: asset.type,
            category: asset.category,
            urls: {
              image: asset.imageUrl,
              model: asset.modelUrl,
              download: asset.downloadUrl,
            },
            sources: { runemonk: true },
            metadata: {
              runemonkData: asset,
              confidence: 0.8,
              lastUpdated: new Date().toISOString(),
            },
            priority: this.calculatePriority(asset.type, asset.name),
            status: asset.imageUrl || asset.modelUrl ? 'available' : 'partial',
          });
        }
      }

      console.log(`✅ RuneMonk: ${runemonkResults.assets.length} assets processed`);
    } catch (error) {
      console.error('❌ RuneMonk extraction error:', error);
      this.errors.push(`RuneMonk: ${error}`);
    }
  }

  /**
   * Enhanced web crawling using Firecrawl
   */
  private async extractWithFirecrawl(): Promise<void> {
    try {
      console.log('🔍 Performing enhanced web crawling...');

      // Crawl additional OSRS resource sites
      const crawlTargets = [
        'https://oldschool.runescape.wiki',
        'https://runemonk.com',
        // Add more OSRS resource sites as needed
      ];

      for (const target of crawlTargets) {
        try {
          const crawlResults = await this.crawlWithFirecrawl(target);
          await this.processFirecrawlResults(crawlResults, target);
        } catch (error) {
          console.error(`Error crawling ${target}:`, error);
          this.errors.push(`Firecrawl ${target}: ${error}`);
        }
      }

      console.log('✅ Firecrawl processing complete');
    } catch (error) {
      console.error('❌ Firecrawl extraction error:', error);
      this.errors.push(`Firecrawl: ${error}`);
    }
  }

  /**
   * Unify assets and calculate final priorities
   */
  private async unifyAndPrioritize(): Promise<void> {
    console.log('🔗 Unifying assets and calculating priorities...');

    for (const [id, asset] of this.unifiedAssets) {
      // Recalculate confidence based on source diversity
      const sourceCount = Object.values(asset.sources).filter(Boolean).length;
      asset.metadata.confidence = Math.min(0.4 + sourceCount * 0.2, 1.0);

      // Update status based on available URLs
      if (asset.urls.image || asset.urls.model) {
        asset.status = 'available';
      } else if (Object.keys(asset.urls).length > 0) {
        asset.status = 'partial';
      } else {
        asset.status = 'missing';
      }

      // Boost priority for assets with multiple sources
      if (sourceCount >= 3 && asset.priority === 'medium') {
        asset.priority = 'high';
      }
      if (sourceCount >= 2 && asset.priority === 'low') {
        asset.priority = 'medium';
      }
    }

    console.log(`✅ Unified ${this.unifiedAssets.size} unique assets`);
  }

  /**
   * Helper methods for data acquisition (these would integrate with actual extractors)
   */
  private async getWikiAssets(): Promise<any[]> {
    // Placeholder - would use actual OSRS asset extractor
    return [];
  }

  private async getMCPCatalog(): Promise<EntityCatalog> {
    // Placeholder - would use actual MCP cataloger
    return {
      entities: [],
      summary: { totalEntities: 0, byType: {}, byCategory: {} },
      lastUpdated: new Date().toISOString(),
    };
  }

  private async getRuneMonkAssets(): Promise<RuneMonkExtractionResult> {
    // Placeholder - would use actual RuneMonk extractor
    return {
      assets: [],
      summary: { totalAssets: 0, byType: {}, extractionTime: 0, errors: [] },
    };
  }

  private async crawlWithFirecrawl(url: string): Promise<any> {
    // Placeholder - would use actual Firecrawl
    return {};
  }

  private async processFirecrawlResults(results: any, source: string): Promise<void> {
    // Placeholder - would process Firecrawl results
  }

  /**
   * Utility methods
   */
  private addOrUpdateAsset(asset: UnifiedAsset): void {
    this.unifiedAssets.set(asset.id, asset);
  }

  private generateUnifiedId(name: string, type: string): string {
    return `${type}_${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')}`;
  }

  private mapWikiType(wikiType: string): UnifiedAsset['type'] {
    // Map wiki types to unified types
    switch (wikiType.toLowerCase()) {
      case 'equipment':
        return 'equipment';
      case 'weapon':
        return 'equipment';
      case 'armor':
        return 'equipment';
      default:
        return 'item';
    }
  }

  private calculatePriority(type: string, name: string): UnifiedAsset['priority'] {
    const criticalTypes = ['equipment', 'npc', 'interface'];
    const criticalItems = ['player', 'warrior', 'sword', 'shield', 'armor'];

    if (criticalTypes.includes(type)) return 'critical';
    if (criticalItems.some(item => name.toLowerCase().includes(item))) return 'high';
    if (type === 'sprite' || type === 'sound') return 'medium';
    return 'low';
  }

  private generateManifest(startTime: Date, endTime: Date): ComprehensiveAssetManifest {
    const assets = Array.from(this.unifiedAssets.values());

    const byType: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const coverage = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const asset of assets) {
      byType[asset.type] = (byType[asset.type] || 0) + 1;
      byStatus[asset.status] = (byStatus[asset.status] || 0) + 1;
      coverage[asset.priority]++;

      for (const [source, hasSource] of Object.entries(asset.sources)) {
        if (hasSource) {
          bySource[source] = (bySource[source] || 0) + 1;
        }
      }
    }

    return {
      assets,
      summary: {
        totalAssets: assets.length,
        byType,
        bySource,
        byStatus,
        coverage,
      },
      extraction: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: endTime.getTime() - startTime.getTime(),
        sources: Object.keys(bySource),
        errors: [...this.errors],
      },
    };
  }

  /**
   * Save comprehensive manifest
   */
  async saveManifest(manifest: ComprehensiveAssetManifest, filePath: string): Promise<void> {
    const fs = require('fs-extra');
    await fs.ensureDir(require('path').dirname(filePath));
    await fs.writeJSON(filePath, manifest, { spaces: 2 });
    console.log(`💾 Saved comprehensive asset manifest to ${filePath}`);
  }

  /**
   * Load comprehensive manifest
   */
  async loadManifest(filePath: string): Promise<ComprehensiveAssetManifest> {
    const fs = require('fs-extra');
    const manifest = await fs.readJSON(filePath);
    console.log(`📁 Loaded comprehensive asset manifest from ${filePath}`);
    console.log(`📊 Contains ${manifest.summary.totalAssets} unified assets`);
    return manifest;
  }

  /**
   * Get assets by priority for loading optimization
   */
  getAssetsByPriority(
    manifest: ComprehensiveAssetManifest,
    priority: UnifiedAsset['priority']
  ): UnifiedAsset[] {
    return manifest.assets.filter(asset => asset.priority === priority);
  }

  /**
   * Get available assets only (have actual URLs)
   */
  getAvailableAssets(manifest: ComprehensiveAssetManifest): UnifiedAsset[] {
    return manifest.assets.filter(asset => asset.status === 'available');
  }
}
