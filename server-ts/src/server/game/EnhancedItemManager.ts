/**
 * Enhanced Item Manager with OSRSReboxed Integration
 * Provides comprehensive item data and management using external OSRS data sources
 */

import { osrsReboxedClient, OSRSItemDefinition } from '../integrations/osrsreboxed-client';
import { ItemDefinition } from './EntitySchemas';

/**
 * Enhanced Item Manager that integrates OSRSReboxed data
 */
export class EnhancedItemManager {
  private itemDefinitions = new Map<string, ItemDefinition>();
  private osrsItemCache = new Map<number, OSRSItemDefinition>();

  constructor() {
    this.initializeItems();
  }

  /**
   * Initialize items from OSRSReboxed and custom definitions
   */
  private async initializeItems(): Promise<void> {
    try {
      console.log('🔄 Initializing Enhanced Item Manager...');

      // Wait for OSRSReboxed client to be ready
      setTimeout(async () => {
        const stats = osrsReboxedClient.getCacheStats();
        console.log(`📦 OSRSReboxed cache ready: ${stats.items} items`);

        // Load popular OSRS items into our item definitions
        await this.loadOSRSItems();

        console.log(`✅ Enhanced Item Manager initialized with ${this.itemDefinitions.size} items`);
      }, 2000);
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Item Manager:', error);
    }
  }

  /**
   * Load common OSRS items into our system
   */
  private async loadOSRSItems(): Promise<void> {
    // Common weapons
    const weaponNames = [
      'Bronze sword',
      'Iron sword',
      'Steel sword',
      'Mithril sword',
      'Adamant sword',
      'Rune sword',
      'Bronze scimitar',
      'Iron scimitar',
      'Steel scimitar',
      'Mithril scimitar',
      'Adamant scimitar',
      'Rune scimitar',
      'Dragon scimitar',
      'Abyssal whip',
      'Dragon dagger',
      'Rune dagger',
      'Shortbow',
      'Oak shortbow',
      'Maple shortbow',
      'Yew shortbow',
      'Magic shortbow',
      'Staff of fire',
      'Staff of water',
      'Staff of earth',
      'Staff of air',
    ];

    // Common armor
    const armorNames = [
      'Leather body',
      'Studded body',
      'Chain body',
      'Iron chainbody',
      'Steel chainbody',
      'Mithril chainbody',
      'Adamant chainbody',
      'Rune chainbody',
      'Iron platebody',
      'Steel platebody',
      'Mithril platebody',
      'Adamant platebody',
      'Rune platebody',
      'Iron med helm',
      'Steel med helm',
      'Mithril med helm',
      'Adamant med helm',
      'Rune med helm',
      'Leather chaps',
      'Studded chaps',
      'Iron platelegs',
      'Steel platelegs',
      'Mithril platelegs',
      'Adamant platelegs',
      'Rune platelegs',
    ];

    // Common consumables
    const consumableNames = [
      'Lobster',
      'Swordfish',
      'Shark',
      'Monkfish',
      'Trout',
      'Salmon',
      'Tuna',
      'Attack potion',
      'Strength potion',
      'Defence potion',
      'Prayer potion',
      'Antipoison',
      'Energy potion',
      'Super attack',
      'Super strength',
      'Super defence',
    ];

    // Common resources
    const resourceNames = [
      'Logs',
      'Oak logs',
      'Willow logs',
      'Maple logs',
      'Yew logs',
      'Magic logs',
      'Copper ore',
      'Tin ore',
      'Iron ore',
      'Coal',
      'Gold ore',
      'Mithril ore',
      'Adamantite ore',
      'Runite ore',
      'Bronze bar',
      'Iron bar',
      'Steel bar',
      'Gold bar',
      'Mithril bar',
      'Adamant bar',
      'Rune bar',
      'Raw shrimps',
      'Raw sardine',
      'Raw herring',
      'Raw trout',
      'Raw salmon',
      'Raw lobster',
      'Raw swordfish',
      'Raw shark',
    ];

    const allItemNames = [...weaponNames, ...armorNames, ...consumableNames, ...resourceNames];

    for (const itemName of allItemNames) {
      const osrsItem = osrsReboxedClient.getItemByName(itemName);
      if (osrsItem) {
        const itemDef = this.convertOSRSItemToDefinition(osrsItem);
        this.itemDefinitions.set(itemDef.itemId, itemDef);
        this.osrsItemCache.set(osrsItem.id, osrsItem);
      }
    }

    console.log(`📦 Loaded ${this.itemDefinitions.size} OSRS items into Enhanced Item Manager`);
  }

  /**
   * Convert OSRSReboxed item to our ItemDefinition format
   */
  private convertOSRSItemToDefinition(osrsItem: OSRSItemDefinition): ItemDefinition {
    return {
      itemId: osrsItem.id.toString(),
      name: osrsItem.name,
      description: osrsItem.description || osrsItem.examine || '',
      value: osrsItem.cost || osrsItem.highalch || 1,
      attack: osrsItem.attackBonus || osrsItem.weapon?.stab || 0,
      defense: osrsItem.defenceBonus || 0,
      isStackable: osrsItem.stackable || false,
      category: this.determineCategory(osrsItem),
      // Additional properties from OSRSReboxed
      weight: osrsItem.weight || 0,
      tradeable: osrsItem.tradeable ?? true,
      members: osrsItem.members || false,
      questItem: osrsItem.quest || false,
      equipable: osrsItem.equipable || false,
      // Combat requirements
      attackLevelRequired: osrsItem.attackLevelRequired || 1,
      strengthLevelRequired: osrsItem.strengthLevelRequired || 1,
      defenceLevelRequired: osrsItem.defenceLevelRequired || 1,
      rangedLevelRequired: osrsItem.rangedLevelRequired || 1,
      magicLevelRequired: osrsItem.magicLevelRequired || 1,
      prayerLevelRequired: osrsItem.prayerLevelRequired || 1,
      // Combat bonuses
      attackBonus: osrsItem.attackBonus || 0,
      strengthBonus: osrsItem.strengthBonus || 0,
      defenceBonus: osrsItem.defenceBonus || 0,
      rangedBonus: osrsItem.rangedBonus || 0,
      magicBonus: osrsItem.magicBonus || 0,
      prayerBonus: osrsItem.prayerBonus || 0,
      // Weapon specific
      weaponSpeed: osrsItem.weapon?.attackSpeed || 4,
      weaponType: osrsItem.weapon?.weaponType || 'none',
    };
  }

  /**
   * Determine item category from OSRS data
   */
  private determineCategory(osrsItem: OSRSItemDefinition): string {
    if (osrsItem.equipableWeapon || osrsItem.weapon) return 'weapon';
    if (
      osrsItem.equipable &&
      (osrsItem.name.includes('body') ||
        osrsItem.name.includes('chest') ||
        osrsItem.name.includes('plate'))
    )
      return 'armor';
    if (
      osrsItem.equipable &&
      (osrsItem.name.includes('helm') ||
        osrsItem.name.includes('hat') ||
        osrsItem.name.includes('coif'))
    )
      return 'helmet';
    if (
      osrsItem.equipable &&
      (osrsItem.name.includes('legs') ||
        osrsItem.name.includes('chaps') ||
        osrsItem.name.includes('skirt'))
    )
      return 'legs';
    if (
      osrsItem.equipable &&
      (osrsItem.name.includes('shield') || osrsItem.name.includes('defender'))
    )
      return 'shield';
    if (osrsItem.equipable && (osrsItem.name.includes('boots') || osrsItem.name.includes('shoes')))
      return 'boots';
    if (
      osrsItem.equipable &&
      (osrsItem.name.includes('gloves') || osrsItem.name.includes('gauntlets'))
    )
      return 'gloves';
    if (osrsItem.equipable && (osrsItem.name.includes('cape') || osrsItem.name.includes('cloak')))
      return 'cape';
    if (osrsItem.equipable && osrsItem.name.includes('ring')) return 'ring';
    if (
      osrsItem.equipable &&
      (osrsItem.name.includes('amulet') || osrsItem.name.includes('necklace'))
    )
      return 'amulet';
    if (osrsItem.name.includes('potion') || osrsItem.name.includes('brew')) return 'potion';
    if (osrsItem.name.includes('food') || this.isFood(osrsItem.name)) return 'food';
    if (osrsItem.name.includes('ore') || osrsItem.name.includes('bar')) return 'smithing';
    if (osrsItem.name.includes('logs') || osrsItem.name.includes('wood')) return 'woodcutting';
    if (osrsItem.name.includes('raw ') || osrsItem.name.includes('fish')) return 'fishing';
    if (osrsItem.name.includes('herb') || osrsItem.name.includes('seed')) return 'herblore';
    return 'misc';
  }

  /**
   * Check if item name represents food
   */
  private isFood(name: string): boolean {
    const foodKeywords = [
      'bread',
      'cake',
      'pie',
      'meat',
      'fish',
      'lobster',
      'shark',
      'tuna',
      'salmon',
      'trout',
      'shrimp',
      'crab',
      'cheese',
      'apple',
      'banana',
    ];
    return foodKeywords.some(keyword => name.toLowerCase().includes(keyword));
  }

  /**
   * Get item definition by ID
   */
  getItemDefinition(itemId: string): ItemDefinition | undefined {
    return this.itemDefinitions.get(itemId);
  }

  /**
   * Get item definition by name
   */
  getItemDefinitionByName(name: string): ItemDefinition | undefined {
    for (const item of this.itemDefinitions.values()) {
      if (item.name.toLowerCase() === name.toLowerCase()) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Search items by name fragment
   */
  searchItems(query: string): ItemDefinition[] {
    const lowerQuery = query.toLowerCase();
    const results: ItemDefinition[] = [];

    for (const item of this.itemDefinitions.values()) {
      if (item.name.toLowerCase().includes(lowerQuery)) {
        results.push(item);
      }
    }

    return results.slice(0, 20); // Limit results
  }

  /**
   * Get items by category
   */
  getItemsByCategory(category: string): ItemDefinition[] {
    const results: ItemDefinition[] = [];

    for (const item of this.itemDefinitions.values()) {
      if (item.category === category) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Get weapons
   */
  getWeapons(): ItemDefinition[] {
    return this.getItemsByCategory('weapon');
  }

  /**
   * Get armor pieces
   */
  getArmor(): ItemDefinition[] {
    const armorCategories = ['armor', 'helmet', 'legs', 'shield', 'boots', 'gloves', 'cape'];
    const results: ItemDefinition[] = [];

    for (const category of armorCategories) {
      results.push(...this.getItemsByCategory(category));
    }

    return results;
  }

  /**
   * Get consumable items (food, potions)
   */
  getConsumables(): ItemDefinition[] {
    const consumableCategories = ['food', 'potion'];
    const results: ItemDefinition[] = [];

    for (const category of consumableCategories) {
      results.push(...this.getItemsByCategory(category));
    }

    return results;
  }

  /**
   * Get items by combat level requirement
   */
  getItemsByLevel(skill: string, level: number): ItemDefinition[] {
    const results: ItemDefinition[] = [];

    for (const item of this.itemDefinitions.values()) {
      let requiredLevel = 1;

      switch (skill.toLowerCase()) {
        case 'attack':
          requiredLevel = item.attackLevelRequired || 1;
          break;
        case 'strength':
          requiredLevel = item.strengthLevelRequired || 1;
          break;
        case 'defence':
          requiredLevel = item.defenceLevelRequired || 1;
          break;
        case 'ranged':
          requiredLevel = item.rangedLevelRequired || 1;
          break;
        case 'magic':
          requiredLevel = item.magicLevelRequired || 1;
          break;
        case 'prayer':
          requiredLevel = item.prayerLevelRequired || 1;
          break;
      }

      if (requiredLevel <= level && requiredLevel > 1) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Get all item definitions
   */
  getAllItems(): ItemDefinition[] {
    return Array.from(this.itemDefinitions.values());
  }

  /**
   * Get enhanced item data from OSRSReboxed
   */
  getOSRSItemData(itemId: number): OSRSItemDefinition | undefined {
    return this.osrsItemCache.get(itemId) || osrsReboxedClient.getItem(itemId);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { definitions: number; osrsItems: number } {
    return {
      definitions: this.itemDefinitions.size,
      osrsItems: this.osrsItemCache.size,
    };
  }
}

// Singleton instance
export const enhancedItemManager = new EnhancedItemManager();
