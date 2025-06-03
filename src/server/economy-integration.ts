/**
 * Economy Integration
 * 
 * This module integrates the TypeScript game server with the Python economy models
 * via the Economy API client. It provides game-specific wrappers around the API client
 * and handles authentication, caching, and error recovery.
 * 
 * Implementation follows ADR-001: Economy System Integration.
 */

import { Room } from 'colyseus';
import { Client } from 'colyseus';
import { logger } from './utils/logger';
import economyClient, { 
  EconomyClient, 
  Player as EconomyPlayer, 
  Item as EconomyItem,
  InventoryItem as EconomyInventoryItem,
  Trade as EconomyTrade,
  GrandExchangeOffer
} from '../services/economy-client';
import { performance } from 'perf_hooks';
import NodeCache from 'node-cache';

// Cache configuration
const CACHE_TTL_SECONDS = {
  ITEMS: 300, // 5 minutes for relatively static item data
  PLAYER: 60,  // 1 minute for player data
  INVENTORY: 30, // 30 seconds for inventory items
  PRICE_HISTORY: 600 // 10 minutes for historical data
};

/**
 * EconomyIntegration class provides game-specific methods for interacting
 * with the economy system from Colyseus rooms and other game components.
 */
export class EconomyIntegration {
  private client: EconomyClient;
  private cache: NodeCache;
  private ready: boolean = false;
  
  constructor(authToken?: string, baseUrl?: string) {
    // Create a new client instance or use the default
    this.client = authToken ? 
      new EconomyClient(baseUrl, authToken) : 
      economyClient;
    
    // Initialize cache
    this.cache = new NodeCache({
      stdTTL: 60, // Default TTL is 60 seconds
      checkperiod: 120 // Check for expired keys every 120 seconds
    });
    
    // Check connection on startup
    this.checkConnection();
  }
  
  /**
   * Check if the Economy API is available
   */
  private async checkConnection(): Promise<void> {
    try {
      const startTime = performance.now();
      const health = await this.client.healthCheck();
      const endTime = performance.now();
      
      if (health.status === 'healthy') {
        this.ready = true;
        logger.info(`Economy API connected in ${(endTime - startTime).toFixed(2)}ms`);
      } else {
        this.ready = false;
        logger.error(`Economy API unhealthy: ${JSON.stringify(health)}`);
      }
    } catch (error) {
      this.ready = false;
      logger.error('Economy API connection failed:', error);
    }
  }
  
  /**
   * Verify the Economy API is available
   */
  public async isReady(): Promise<boolean> {
    if (!this.ready) {
      await this.checkConnection();
    }
    return this.ready;
  }
  
  /**
   * Get a player's economy profile, creating it if it doesn't exist
   */
  public async getOrCreatePlayerProfile(username: string, email: string): Promise<EconomyPlayer> {
    const cacheKey = `player:${username}`;
    const cachedPlayer = this.cache.get<EconomyPlayer>(cacheKey);
    
    if (cachedPlayer) {
      return cachedPlayer;
    }
    
    try {
      // Try to find player by username
      const players = await this.client.getPlayers({ limit: 1, username });
      
      if (players.length > 0) {
        const player = players[0];
        this.cache.set(cacheKey, player, CACHE_TTL_SECONDS.PLAYER);
        return player;
      }
      
      // Create new player if not found
      const newPlayer = await this.client.createPlayer({
        username,
        email,
        is_active: true
      });
      
      this.cache.set(cacheKey, newPlayer, CACHE_TTL_SECONDS.PLAYER);
      return newPlayer;
    } catch (error) {
      logger.error(`Failed to get/create player profile for ${username}:`, error);
      throw new Error(`Economy service error: Could not get or create player profile`);
    }
  }
  
  /**
   * Get a player's inventory
   */
  public async getPlayerInventory(playerId: number): Promise<EconomyInventoryItem[]> {
    const cacheKey = `inventory:${playerId}`;
    const cachedInventory = this.cache.get<EconomyInventoryItem[]>(cacheKey);
    
    if (cachedInventory) {
      return cachedInventory;
    }
    
    try {
      const inventory = await this.client.getPlayerInventory(playerId);
      this.cache.set(cacheKey, inventory, CACHE_TTL_SECONDS.INVENTORY);
      return inventory;
    } catch (error) {
      logger.error(`Failed to get inventory for player ${playerId}:`, error);
      throw new Error(`Economy service error: Could not retrieve player inventory`);
    }
  }
  
  /**
   * Add an item to a player's inventory
   */
  public async addItemToInventory(
    playerId: number, 
    itemId: number, 
    quantity: number = 1
  ): Promise<EconomyInventoryItem> {
    try {
      const result = await this.client.addInventoryItem(playerId, {
        player_id: playerId,
        item_id: itemId,
        quantity
      });
      
      // Invalidate cache
      this.cache.del(`inventory:${playerId}`);
      
      return result;
    } catch (error) {
      logger.error(`Failed to add item ${itemId} to player ${playerId} inventory:`, error);
      throw new Error(`Economy service error: Could not add item to inventory`);
    }
  }
  
  /**
   * Get item details
   */
  public async getItem(itemId: number): Promise<EconomyItem> {
    const cacheKey = `item:${itemId}`;
    const cachedItem = this.cache.get<EconomyItem>(cacheKey);
    
    if (cachedItem) {
      return cachedItem;
    }
    
    try {
      const item = await this.client.getItem(itemId);
      this.cache.set(cacheKey, item, CACHE_TTL_SECONDS.ITEMS);
      return item;
    } catch (error) {
      logger.error(`Failed to get item ${itemId}:`, error);
      throw new Error(`Economy service error: Could not retrieve item details`);
    }
  }
  
  /**
   * Get all items matching criteria
   */
  public async getItems(options: {
    is_tradeable?: boolean;
    name_contains?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<EconomyItem[]> {
    // Create a cache key based on the options
    const cacheKey = `items:${JSON.stringify(options)}`;
    const cachedItems = this.cache.get<EconomyItem[]>(cacheKey);
    
    if (cachedItems) {
      return cachedItems;
    }
    
    try {
      const items = await this.client.getItems(options);
      this.cache.set(cacheKey, items, CACHE_TTL_SECONDS.ITEMS);
      return items;
    } catch (error) {
      logger.error(`Failed to get items:`, error);
      throw new Error(`Economy service error: Could not retrieve items`);
    }
  }
  
  /**
   * Create a trade between players
   */
  public async createTrade(
    initiatorId: number,
    receiverId: number,
    items: Array<{
      item_id: number;
      quantity: number;
      from_player_id: number;
      to_player_id: number;
    }>
  ): Promise<EconomyTrade> {
    try {
      const trade = await this.client.createTrade({
        initiator_id: initiatorId,
        receiver_id: receiverId,
        items
      });
      
      return trade;
    } catch (error) {
      logger.error(`Failed to create trade between players ${initiatorId} and ${receiverId}:`, error);
      throw new Error(`Economy service error: Could not create trade`);
    }
  }
  
  /**
   * Get current market price of an item based on recent trades
   */
  public async getCurrentMarketPrice(itemId: number): Promise<number> {
    try {
      const priceHistory = await this.client.getItemPriceHistory(itemId, 1);
      
      if (priceHistory && priceHistory.length > 0) {
        return priceHistory[0].price;
      } else {
        // Fallback to base value
        const item = await this.getItem(itemId);
        return item.base_value;
      }
    } catch (error) {
      logger.error(`Failed to get current market price for item ${itemId}:`, error);
      throw new Error(`Economy service error: Could not retrieve market price`);
    }
  }
}

/**
 * Create and export a default instance
 */
export default new EconomyIntegration();
