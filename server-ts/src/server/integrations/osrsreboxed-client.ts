/**
 * OSRSReboxed Database Integration Client
 * Provides comprehensive OSRS item, monster, and prayer data
 */

import { Items, Monsters } from 'oldschooljs';

/**
 * Enhanced Item Definition with OSRSReboxed data
 */
export interface OSRSItemDefinition {
  id: number;
  name: string;
  description?: string;
  cost?: number;
  lowalch?: number;
  highalch?: number;
  weight?: number;
  tradeable?: boolean;
  stackable?: boolean;
  noted?: boolean;
  notedId?: number;
  linkedIdNote?: number;
  linkedIdNoted?: number;
  equipable?: boolean;
  equipableByPlayer?: boolean;
  equipableWeapon?: boolean;
  members?: boolean;
  quest?: boolean;
  releaseDate?: string;
  examine?: string;
  wikiName?: string;
  wikiURL?: string;
  category?: string;
  subcategory?: string;
  // Combat stats
  attackLevelRequired?: number;
  strengthLevelRequired?: number;
  defenceLevelRequired?: number;
  rangedLevelRequired?: number;
  magicLevelRequired?: number;
  prayerLevelRequired?: number;
  attackBonus?: number;
  strengthBonus?: number;
  defenceBonus?: number;
  rangedBonus?: number;
  magicBonus?: number;
  prayerBonus?: number;
  // Special properties
  weapon?: {
    attackSpeed: number;
    weaponType: string;
    stab: number;
    slash: number;
    crush: number;
    magic: number;
    ranged: number;
  };
  // Custom properties for game
  itemId?: string;
  attack?: number;
  defense?: number;
  isStackable?: boolean;
}

/**
 * Enhanced Monster Definition with OSRSReboxed data
 */
export interface OSRSMonsterDefinition {
  id: number;
  name: string;
  description?: string;
  examine?: string;
  wikiName?: string;
  wikiURL?: string;
  category?: string;
  // Combat stats
  hitpoints?: number;
  attack?: number;
  strength?: number;
  defence?: number;
  ranged?: number;
  magic?: number;
  combatLevel?: number;
  // Attack properties
  attackSpeed?: number;
  maxHit?: number;
  attackStyles?: string[];
  attackType?: string;
  // Defensive properties
  stabDefence?: number;
  slashDefence?: number;
  crushDefence?: number;
  magicDefence?: number;
  rangedDefence?: number;
  // Metadata
  members?: boolean;
  releaseDate?: string;
  slayerLevel?: number;
  slayerXP?: number;
  // Custom properties for game
  npcId?: string;
  type?: string;
  aggroRange?: number;
  attackRange?: number;
  lootTable?: Array<{
    itemId: string | number;
    probability: number;
    quantity?: { min: number; max: number };
  }>;
}

/**
 * OSRSReboxed Database Client
 */
export class OSRSReboxedClient {
  private itemsCache = new Map<number, OSRSItemDefinition>();
  private monstersCache = new Map<number, OSRSMonsterDefinition>();
  private itemsByNameCache = new Map<string, OSRSItemDefinition>();
  private monstersByNameCache = new Map<string, OSRSMonsterDefinition>();

  constructor() {
    this.initializeCache();
  }

  /**
   * Initialize the cache with data from oldschooljs
   */
  private async initializeCache(): Promise<void> {
    try {
      console.log('🔄 Initializing OSRSReboxed cache...');

      // Load items from oldschooljs
      const itemCount = Object.keys(Items).length;
      console.log(`📦 Loading ${itemCount} items...`);

      for (const [id, item] of Object.entries(Items)) {
        const itemId = parseInt(id);
        if (isNaN(itemId)) continue;

        const enhancedItem: OSRSItemDefinition = {
          id: itemId,
          name: item.name,
          ...item,
          // Add custom properties
          itemId: itemId.toString(),
          attack: item.equipment?.attack_stab || 0,
          defense: item.equipment?.defence_stab || 0,
          isStackable: item.stackable || false,
        };

        this.itemsCache.set(itemId, enhancedItem);
        this.itemsByNameCache.set(item.name.toLowerCase(), enhancedItem);
      }

      // Load monsters from oldschooljs
      const monsterCount = Object.keys(Monsters).length;
      console.log(`👹 Loading ${monsterCount} monsters...`);

      for (const [id, monster] of Object.entries(Monsters)) {
        const monsterId = parseInt(id);
        if (isNaN(monsterId)) continue;

        const enhancedMonster: OSRSMonsterDefinition = {
          id: monsterId,
          name: monster.name,
          ...monster,
          // Add custom properties
          npcId: monsterId.toString(),
          type: 'monster',
          aggroRange: 5,
          attackRange: 1,
          lootTable: [], // Will be populated from external sources
        };

        this.monstersCache.set(monsterId, enhancedMonster);
        this.monstersByNameCache.set(monster.name.toLowerCase(), enhancedMonster);
      }

      console.log(
        `✅ OSRSReboxed cache initialized: ${this.itemsCache.size} items, ${this.monstersCache.size} monsters`
      );
    } catch (error) {
      console.error('❌ Failed to initialize OSRSReboxed cache:', error);
    }
  }

  /**
   * Get item by ID
   */
  getItem(id: number): OSRSItemDefinition | undefined {
    return this.itemsCache.get(id);
  }

  /**
   * Get item by name (case-insensitive)
   */
  getItemByName(name: string): OSRSItemDefinition | undefined {
    return this.itemsByNameCache.get(name.toLowerCase());
  }

  /**
   * Search items by name fragment
   */
  searchItems(query: string): OSRSItemDefinition[] {
    const lowerQuery = query.toLowerCase();
    const results: OSRSItemDefinition[] = [];

    for (const item of this.itemsCache.values()) {
      if (item.name.toLowerCase().includes(lowerQuery)) {
        results.push(item);
      }
    }

    return results.slice(0, 50); // Limit results
  }

  /**
   * Get monster by ID
   */
  getMonster(id: number): OSRSMonsterDefinition | undefined {
    return this.monstersCache.get(id);
  }

  /**
   * Get monster by name (case-insensitive)
   */
  getMonsterByName(name: string): OSRSMonsterDefinition | undefined {
    return this.monstersByNameCache.get(name.toLowerCase());
  }

  /**
   * Search monsters by name fragment
   */
  searchMonsters(query: string): OSRSMonsterDefinition[] {
    const lowerQuery = query.toLowerCase();
    const results: OSRSMonsterDefinition[] = [];

    for (const monster of this.monstersCache.values()) {
      if (monster.name.toLowerCase().includes(lowerQuery)) {
        results.push(monster);
      }
    }

    return results.slice(0, 50); // Limit results
  }

  /**
   * Get all items in a category
   */
  getItemsByCategory(category: string): OSRSItemDefinition[] {
    const results: OSRSItemDefinition[] = [];

    for (const item of this.itemsCache.values()) {
      if (item.category === category) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Get all monsters in a category
   */
  getMonstersByCategory(category: string): OSRSMonsterDefinition[] {
    const results: OSRSMonsterDefinition[] = [];

    for (const monster of this.monstersCache.values()) {
      if (monster.category === category) {
        results.push(monster);
      }
    }

    return results;
  }

  /**
   * Get equipment items
   */
  getEquipableItems(): OSRSItemDefinition[] {
    const results: OSRSItemDefinition[] = [];

    for (const item of this.itemsCache.values()) {
      if (item.equipable || item.equipableByPlayer) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Get weapons
   */
  getWeapons(): OSRSItemDefinition[] {
    const results: OSRSItemDefinition[] = [];

    for (const item of this.itemsCache.values()) {
      if (item.equipableWeapon || item.weapon) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Get items by combat level requirement
   */
  getItemsByLevel(skill: string, level: number): OSRSItemDefinition[] {
    const results: OSRSItemDefinition[] = [];

    for (const item of this.itemsCache.values()) {
      let requiredLevel = 0;

      switch (skill.toLowerCase()) {
        case 'attack':
          requiredLevel = item.attackLevelRequired || 0;
          break;
        case 'strength':
          requiredLevel = item.strengthLevelRequired || 0;
          break;
        case 'defence':
          requiredLevel = item.defenceLevelRequired || 0;
          break;
        case 'ranged':
          requiredLevel = item.rangedLevelRequired || 0;
          break;
        case 'magic':
          requiredLevel = item.magicLevelRequired || 0;
          break;
        case 'prayer':
          requiredLevel = item.prayerLevelRequired || 0;
          break;
      }

      if (requiredLevel <= level && requiredLevel > 0) {
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Get monsters by combat level range
   */
  getMonstersByLevel(minLevel: number, maxLevel: number): OSRSMonsterDefinition[] {
    const results: OSRSMonsterDefinition[] = [];

    for (const monster of this.monstersCache.values()) {
      const combatLevel = monster.combatLevel || 0;
      if (combatLevel >= minLevel && combatLevel <= maxLevel) {
        results.push(monster);
      }
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { items: number; monsters: number } {
    return {
      items: this.itemsCache.size,
      monsters: this.monstersCache.size,
    };
  }
}

// Singleton instance
export const osrsReboxedClient = new OSRSReboxedClient();
