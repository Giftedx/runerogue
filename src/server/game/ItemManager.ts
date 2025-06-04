import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';

import economyIntegration from '../economy-integration';
import NodeCache from 'node-cache';
import logger from '../logger';

// Cache configuration
const CACHE_TTL_SECONDS = {
  ITEM_DEFINITION: 300, // 5 minutes
  ITEM_LOOKUP: 60, // 1 minute
};

export interface ItemDefinition {
  id: string;
  itemId: string;
  name: string;
  description: string;
  attack: number;
  defense: number;
  isStackable: boolean;
  baseValue: number;
  isTradeable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class ItemManager {
  private static instance: ItemManager;
  private itemDefinitions: Map<string, ItemDefinition> = new Map();
  private cache: NodeCache;
  private syncInProgress: boolean = false;
  private lastSyncTime: number = 0;
  private readonly SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: CACHE_TTL_SECONDS.ITEM_DEFINITION,
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false,
    });
    
    this.initialize();
  }

  public static getInstance(): ItemManager {
    if (!ItemManager.instance) {
      ItemManager.instance = new ItemManager();
    }
    return ItemManager.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Load from local definitions first
      this.loadLocalItemDefinitions();
      
      // Then sync with economy service
      await this.syncWithEconomy();
      
      // Set up periodic sync
      setInterval(() => this.syncWithEconomy(), this.SYNC_INTERVAL);
    } catch (error) {
      console.error('Failed to initialize ItemManager:', error);
    }
  }

  private loadLocalItemDefinitions(): void {
    try {
      const itemsPath = path.join(__dirname, '../data/items.json');
      if (fs.existsSync(itemsPath)) {
        const data = fs.readFileSync(itemsPath, 'utf8');
        const items: ItemDefinition[] = JSON.parse(data);
        items.forEach(item => {
          this.cache.set(`item:${item.itemId}`, item, CACHE_TTL_SECONDS.ITEM_DEFINITION);
          this.itemDefinitions.set(item.itemId, item);
        });
        logger.info(`Loaded ${items.length} local item definitions`);
      }
    } catch (error) {
      logger.error('Failed to load local item definitions:', error);
    }
  }

  public async syncWithEconomy(): Promise<void> {
    if (this.syncInProgress) {
      logger.debug('Item sync already in progress');
      return;
    }

    const startTime = performance.now();
    this.syncInProgress = true;
    
    try {
      // Check if economy integration is ready
      if (!(await economyIntegration.isReady())) {
        throw new Error('Economy service not available');
      }

      // Get all items from economy service
      // Note: This assumes the economy client has a getItems method
      const items = await economyIntegration.getItems();
      
      // Update local cache and definitions
      let updatedCount = 0;
      for (const item of items) {
        const cacheKey = `item:${item.itemId}`;
        const existingItem = this.cache.get<ItemDefinition>(cacheKey);
        
        // Only update if item is new or modified
        if (!existingItem || 
            existingItem.name !== item.name || 
            existingItem.description !== item.description) {
          this.cache.set(cacheKey, item, CACHE_TTL_SECONDS.ITEM_DEFINITION);
          this.itemDefinitions.set(item.itemId, item);
          updatedCount++;
        }
      }
      
      this.lastSyncTime = Date.now();
      logger.info(`Synced ${items.length} items with economy service (${updatedCount} updated)`);
    } catch (error) {
      logger.error('Failed to sync items with economy service:', error);
      throw error;
    } finally {
      this.syncInProgress = false;
      logger.debug(`Item sync completed in ${performance.now() - startTime}ms`);
    }
  }

  public async getItemDefinition(itemId: string): Promise<ItemDefinition | undefined> {
    // Check cache first
    const cacheKey = `item:${itemId}`;
    const cachedItem = this.cache.get<ItemDefinition>(cacheKey);
    if (cachedItem) {
      return cachedItem;
    }

    // Check local definitions
    const localItem = this.itemDefinitions.get(itemId);
    if (localItem) {
      this.cache.set(cacheKey, localItem, CACHE_TTL_SECONDS.ITEM_DEFINITION);
      return localItem;
    }

    // Try to fetch from economy service if not found
    try {
      if (await economyIntegration.isReady()) {
        const item = await economyIntegration.getItemById(itemId);
        if (item) {
          this.cache.set(cacheKey, item, CACHE_TTL_SECONDS.ITEM_DEFINITION);
          this.itemDefinitions.set(itemId, item);
          return item;
        }
      }
    } catch (error) {
      logger.error(`Failed to fetch item ${itemId} from economy service:`, error);
    }

    return undefined;
  }

  public async getItemDefinitions(ids: string[]): Promise<Map<string, ItemDefinition>> {
    const result = new Map<string, ItemDefinition>();
    const missingIds: string[] = [];

    // Check cache first
    for (const id of ids) {
      const cacheKey = `item:${id}`;
      const cachedItem = this.cache.get<ItemDefinition>(cacheKey);
      if (cachedItem) {
        result.set(id, cachedItem);
      } else {
        missingIds.push(id);
      }
    }

    // If we have missing items and economy service is available, try to fetch them
    if (missingIds.length > 0 && await economyIntegration.isReady()) {
      try {
        const items = await economyIntegration.getItemsByIds(missingIds);
        for (const item of items) {
          const cacheKey = `item:${item.itemId}`;
          this.cache.set(cacheKey, item, CACHE_TTL_SECONDS.ITEM_DEFINITION);
          this.itemDefinitions.set(item.itemId, item);
          result.set(item.itemId, item);
        }
      } catch (error) {
        logger.error('Failed to fetch multiple items from economy service:', error);
      }
    }

    return result;
  }
}
