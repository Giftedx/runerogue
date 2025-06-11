/**
 * MCP Asset Cataloger
 *
 * Extracts comprehensive entity lists from OSRS MCP data sources
 * to build complete asset requirements catalog.
 */

export interface OSRSEntity {
  id: string;
  name: string;
  type: 'npc' | 'object' | 'item' | 'sprite' | 'animation' | 'sound' | 'interface' | 'location';
  category?: string;
  metadata?: Record<string, any>;
}

export interface EntityCatalog {
  entities: OSRSEntity[];
  summary: {
    totalEntities: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
  };
  lastUpdated: string;
}

export class MCPAssetCataloguer {
  private entities: OSRSEntity[] = [];

  /**
   * Catalogs all available OSRS entities from MCP data sources
   */
  async catalogueAllEntities(): Promise<EntityCatalog> {
    console.log('🔍 Starting comprehensive OSRS entity cataloging...');

    // Clear existing entities
    this.entities = [];

    try {
      // Catalog all entity types
      await this.catalogueNPCs();
      await this.catalogueObjects();
      await this.catalogueSprites();
      await this.catalogueAnimations();
      await this.catalogueSounds();
      await this.catalogueInterfaces();
      await this.catalogueLocations();

      const summary = this.generateSummary();

      const catalog: EntityCatalog = {
        entities: this.entities,
        summary,
        lastUpdated: new Date().toISOString(),
      };

      console.log(`✅ Cataloging complete! Found ${summary.totalEntities} total entities`);
      console.log('📊 Summary by type:', summary.byType);

      return catalog;
    } catch (error) {
      console.error('❌ Error during entity cataloging:', error);
      throw error;
    }
  }

  /**
   * Catalogs NPCs (Non-Player Characters)
   */
  private async catalogueNPCs(): Promise<void> {
    console.log('📝 Cataloging NPCs...');

    try {
      // Get sample of NPCs to understand data structure
      const sampleSearch = await this.searchMCPData('npctypes', 'dragon', 10);
      console.log(`Found ${sampleSearch.totalResults} dragon NPCs in sample`);

      // Get comprehensive lists by searching common terms
      const searchTerms = [
        'dragon',
        'demon',
        'guard',
        'wizard',
        'warrior',
        'knight',
        'goblin',
        'skeleton',
        'zombie',
        'rat',
        'spider',
        'cow',
        'chicken',
        'farmer',
        'shop',
        'bank',
        'king',
        'queen',
        'boss',
        'giant',
        'dwarf',
        'elf',
      ];

      for (const term of searchTerms) {
        const results = await this.searchMCPData('npctypes', term, 50);
        for (const result of results.results) {
          this.addEntity({
            id: result.id,
            name: result.value,
            type: 'npc',
            category: this.categorizeNPC(result.value),
            metadata: { searchTerm: term, lineNumber: result.lineNumber },
          });
        }
      }

      console.log(`✅ Cataloged ${this.entities.filter(e => e.type === 'npc').length} NPCs`);
    } catch (error) {
      console.error('❌ Error cataloging NPCs:', error);
    }
  }

  /**
   * Catalogs Objects/Items
   */
  private async catalogueObjects(): Promise<void> {
    console.log('📝 Cataloging objects/items...');

    try {
      const searchTerms = [
        'sword',
        'axe',
        'bow',
        'staff',
        'shield',
        'helmet',
        'armor',
        'boots',
        'ring',
        'amulet',
        'potion',
        'food',
        'rune',
        'arrow',
        'bolt',
        'dart',
        'coin',
        'gem',
        'ore',
        'bar',
        'log',
        'fish',
        'seed',
        'herb',
        'bone',
      ];

      for (const term of searchTerms) {
        const results = await this.searchMCPData('objtypes', term, 100);
        for (const result of results.results) {
          this.addEntity({
            id: result.id,
            name: result.value,
            type: 'item',
            category: this.categorizeItem(result.value),
            metadata: { searchTerm: term, lineNumber: result.lineNumber },
          });
        }
      }

      console.log(`✅ Cataloged ${this.entities.filter(e => e.type === 'item').length} items`);
    } catch (error) {
      console.error('❌ Error cataloging objects:', error);
    }
  }

  /**
   * Catalogs Sprites/UI elements
   */
  private async catalogueSprites(): Promise<void> {
    console.log('📝 Cataloging sprites...');

    try {
      const searchTerms = [
        'interface',
        'icon',
        'button',
        'cursor',
        'tab',
        'scroll',
        'window',
        'inventory',
        'equipment',
        'spell',
        'prayer',
        'skill',
        'minimap',
      ];

      for (const term of searchTerms) {
        const results = await this.searchMCPData('spritetypes', term, 50);
        for (const result of results.results) {
          this.addEntity({
            id: result.id,
            name: result.value,
            type: 'sprite',
            category: this.categorizeSprite(result.value),
            metadata: { searchTerm: term, lineNumber: result.lineNumber },
          });
        }
      }

      console.log(`✅ Cataloged ${this.entities.filter(e => e.type === 'sprite').length} sprites`);
    } catch (error) {
      console.error('❌ Error cataloging sprites:', error);
    }
  }

  /**
   * Catalogs Animations/Sequences
   */
  private async catalogueAnimations(): Promise<void> {
    console.log('📝 Cataloging animations...');

    try {
      const searchTerms = [
        'walk',
        'run',
        'attack',
        'defend',
        'death',
        'idle',
        'cast',
        'shoot',
        'swing',
        'stab',
        'block',
        'bow',
        'magic',
        'prayer',
        'emote',
      ];

      for (const term of searchTerms) {
        const results = await this.searchMCPData('seqtypes', term, 30);
        for (const result of results.results) {
          this.addEntity({
            id: result.id,
            name: result.value,
            type: 'animation',
            category: this.categorizeAnimation(result.value),
            metadata: { searchTerm: term, lineNumber: result.lineNumber },
          });
        }
      }

      console.log(
        `✅ Cataloged ${this.entities.filter(e => e.type === 'animation').length} animations`
      );
    } catch (error) {
      console.error('❌ Error cataloging animations:', error);
    }
  }

  /**
   * Catalogs Sounds
   */
  private async catalogueSounds(): Promise<void> {
    console.log('📝 Cataloging sounds...');

    try {
      const searchTerms = [
        'hit',
        'miss',
        'death',
        'spell',
        'bow',
        'sword',
        'door',
        'step',
        'interface',
        'level',
        'coin',
        'eat',
        'drink',
        'fire',
        'water',
      ];

      for (const term of searchTerms) {
        const results = await this.searchMCPData('soundtypes', term, 20);
        for (const result of results.results) {
          this.addEntity({
            id: result.id,
            name: result.value,
            type: 'sound',
            category: this.categorizeSound(result.value),
            metadata: { searchTerm: term, lineNumber: result.lineNumber },
          });
        }
      }

      console.log(`✅ Cataloged ${this.entities.filter(e => e.type === 'sound').length} sounds`);
    } catch (error) {
      console.error('❌ Error cataloging sounds:', error);
    }
  }

  /**
   * Catalogs Interface elements
   */
  private async catalogueInterfaces(): Promise<void> {
    console.log('📝 Cataloging interfaces...');

    try {
      const searchTerms = [
        'bank',
        'shop',
        'inventory',
        'equipment',
        'spell',
        'prayer',
        'skill',
        'quest',
        'trade',
        'chat',
        'minimap',
        'combat',
        'login',
        'logout',
      ];

      for (const term of searchTerms) {
        const results = await this.searchMCPData('iftypes', term, 20);
        for (const result of results.results) {
          this.addEntity({
            id: result.id,
            name: result.value,
            type: 'interface',
            category: this.categorizeInterface(result.value),
            metadata: { searchTerm: term, lineNumber: result.lineNumber },
          });
        }
      }

      console.log(
        `✅ Cataloged ${this.entities.filter(e => e.type === 'interface').length} interfaces`
      );
    } catch (error) {
      console.error('❌ Error cataloging interfaces:', error);
    }
  }

  /**
   * Catalogs Locations/Objects in world
   */
  private async catalogueLocations(): Promise<void> {
    console.log('📝 Cataloging locations...');

    try {
      const searchTerms = [
        'door',
        'gate',
        'chest',
        'table',
        'chair',
        'tree',
        'rock',
        'altar',
        'furnace',
        'anvil',
        'bank',
        'shop',
        'stairs',
        'ladder',
        'portal',
      ];

      for (const term of searchTerms) {
        const results = await this.searchMCPData('loctypes', term, 30);
        for (const result of results.results) {
          this.addEntity({
            id: result.id,
            name: result.value,
            type: 'location',
            category: this.categorizeLocation(result.value),
            metadata: { searchTerm: term, lineNumber: result.lineNumber },
          });
        }
      }

      console.log(
        `✅ Cataloged ${this.entities.filter(e => e.type === 'location').length} locations`
      );
    } catch (error) {
      console.error('❌ Error cataloging locations:', error);
    }
  }

  /**
   * Generic MCP data search wrapper
   */
  private async searchMCPData(
    dataType: string,
    query: string,
    pageSize: number = 10
  ): Promise<any> {
    // This would be replaced with actual MCP calls
    // For now, return mock structure based on what we've seen
    return {
      results: [],
      totalResults: 0,
      pagination: { page: 1, pageSize, hasNextPage: false },
    };
  }

  /**
   * Add entity with deduplication
   */
  private addEntity(entity: OSRSEntity): void {
    // Check for duplicates by id and type
    const exists = this.entities.find(e => e.id === entity.id && e.type === entity.type);

    if (!exists) {
      this.entities.push(entity);
    }
  }

  /**
   * Generate summary statistics
   */
  private generateSummary() {
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const entity of this.entities) {
      byType[entity.type] = (byType[entity.type] || 0) + 1;
      if (entity.category) {
        byCategory[entity.category] = (byCategory[entity.category] || 0) + 1;
      }
    }

    return {
      totalEntities: this.entities.length,
      byType,
      byCategory,
    };
  }

  /**
   * Categorization helpers
   */
  private categorizeNPC(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('dragon')) return 'dragons';
    if (lowerName.includes('demon')) return 'demons';
    if (lowerName.includes('guard') || lowerName.includes('knight')) return 'guards';
    if (lowerName.includes('wizard') || lowerName.includes('mage')) return 'magic_users';
    if (lowerName.includes('shop') || lowerName.includes('store')) return 'merchants';
    if (lowerName.includes('bank')) return 'bankers';
    if (lowerName.includes('boss')) return 'bosses';
    return 'general';
  }

  private categorizeItem(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('sword') || lowerName.includes('axe') || lowerName.includes('mace'))
      return 'melee_weapons';
    if (lowerName.includes('bow') || lowerName.includes('arrow')) return 'ranged_weapons';
    if (lowerName.includes('staff') || lowerName.includes('wand')) return 'magic_weapons';
    if (lowerName.includes('shield')) return 'shields';
    if (lowerName.includes('helmet') || lowerName.includes('hat')) return 'headgear';
    if (lowerName.includes('armor') || lowerName.includes('platebody')) return 'armor';
    if (lowerName.includes('ring') || lowerName.includes('amulet')) return 'jewelry';
    if (lowerName.includes('potion')) return 'potions';
    if (lowerName.includes('food')) return 'food';
    if (lowerName.includes('rune')) return 'runes';
    return 'general';
  }

  private categorizeSprite(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('interface')) return 'ui_interface';
    if (lowerName.includes('icon')) return 'ui_icons';
    if (lowerName.includes('button')) return 'ui_buttons';
    if (lowerName.includes('cursor')) return 'ui_cursors';
    if (lowerName.includes('spell')) return 'spell_icons';
    if (lowerName.includes('prayer')) return 'prayer_icons';
    return 'general_ui';
  }

  private categorizeAnimation(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('walk') || lowerName.includes('run')) return 'movement';
    if (lowerName.includes('attack') || lowerName.includes('swing')) return 'combat';
    if (lowerName.includes('cast') || lowerName.includes('magic')) return 'magic';
    if (lowerName.includes('death')) return 'death';
    if (lowerName.includes('idle')) return 'idle';
    if (lowerName.includes('emote')) return 'emotes';
    return 'general';
  }

  private categorizeSound(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('hit') || lowerName.includes('attack')) return 'combat_sounds';
    if (lowerName.includes('interface')) return 'ui_sounds';
    if (lowerName.includes('spell') || lowerName.includes('magic')) return 'magic_sounds';
    if (lowerName.includes('step') || lowerName.includes('walk')) return 'movement_sounds';
    if (lowerName.includes('ambient')) return 'ambient_sounds';
    return 'general_sounds';
  }

  private categorizeInterface(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('bank')) return 'banking';
    if (lowerName.includes('shop')) return 'shopping';
    if (lowerName.includes('inventory')) return 'inventory';
    if (lowerName.includes('equipment')) return 'equipment';
    if (lowerName.includes('spell')) return 'magic';
    if (lowerName.includes('prayer')) return 'prayer';
    if (lowerName.includes('skill')) return 'skills';
    if (lowerName.includes('quest')) return 'quests';
    return 'general_ui';
  }

  private categorizeLocation(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('door') || lowerName.includes('gate')) return 'entrances';
    if (lowerName.includes('chest')) return 'containers';
    if (lowerName.includes('tree')) return 'nature';
    if (lowerName.includes('rock')) return 'mining';
    if (lowerName.includes('altar')) return 'religious';
    if (lowerName.includes('furnace') || lowerName.includes('anvil')) return 'crafting';
    return 'general_objects';
  }

  /**
   * Save catalog to file
   */
  async saveCatalog(catalog: EntityCatalog, filePath: string): Promise<void> {
    const fs = require('fs-extra');
    await fs.ensureDir(require('path').dirname(filePath));
    await fs.writeJSON(filePath, catalog, { spaces: 2 });
    console.log(`💾 Saved entity catalog to ${filePath}`);
  }

  /**
   * Load catalog from file
   */
  async loadCatalog(filePath: string): Promise<EntityCatalog> {
    const fs = require('fs-extra');
    const catalog = await fs.readJSON(filePath);
    console.log(`📁 Loaded entity catalog from ${filePath}`);
    console.log(`📊 Contains ${catalog.summary.totalEntities} entities`);
    return catalog;
  }
}
