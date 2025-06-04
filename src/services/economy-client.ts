/**
 * Economy API Client
 *
 * This client provides TypeScript interfaces to the Python Economy API service.
 * As per ADR-001, it implements the REST API integration approach for connecting
 * the TypeScript game server with the Python economy models.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { Agent } from 'https';
import { config } from '../config';

// Type definitions for Economy API responses
export interface Player {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export interface Item {
  id: number;
  name: string;
  description?: string;
  is_tradeable: boolean;
  is_stackable: boolean;
  base_value: number;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  player_id: number;
  item_id: number;
  quantity: number;
  acquired_at: string;
}

export interface Trade {
  id: number;
  initiator_id: number;
  receiver_id: number;
  status: string;
  initiated_at: string;
  completed_at?: string;
  cancelled_at?: string;
  items: TradeItem[];
}

export interface TradeItem {
  item_id: number;
  quantity: number;
  from_player_id: number;
  to_player_id: number;
}

export interface GrandExchangeOffer {
  id: number;
  player_id: number;
  item_id: number;
  offer_type: 'buy' | 'sell';
  quantity: number;
  price_per_item: number;
  quantity_remaining: number;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  created_at: string;
  completed_at?: string;
  expires_at?: string;
}

export interface PriceHistory {
  id: number;
  item_id: number;
  price: number;
  volume: number;
  recorded_at: string;
  source: 'ge' | 'direct_trade';
}

export interface QueryOptions {
  skip?: number;
  limit?: number;
  [key: string]: any;
}

/**
 * Economy API client for interacting with the Python Economy API service
 */
export class EconomyClient {
  private readonly client: AxiosInstance;
  private readonly baseUrl: string;

  /**
   * Creates a new EconomyClient instance
   *
   * @param baseUrl Base URL of the Economy API service
   * @param authToken JWT authentication token
   */
  constructor(baseUrl?: string, authToken?: string) {
    this.baseUrl = baseUrl || config.economyApi?.baseUrl || 'http://localhost:8001';

    // Ensure the axios client is instantiated
    this.client = axios.create({
      baseURL: process.env.ECONOMY_API_URL || this.baseUrl,
      timeout: config.economyApi?.timeout || 10000, // 10 second default timeout
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      // Allow self-signed certificates in development
      ...(process.env.NODE_ENV !== 'production' && {
        httpsAgent: new Agent({
          rejectUnauthorized: false,
        }),
      }),
    });

    // Fallback: if interceptors is undefined (e.g., in a mocked environment), provide a stub
    if (!this.client.interceptors) {
      this.client.interceptors = {
        response: {
          use: (success: any, error: any) => {},
        },
      };
    }

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        console.error('Economy API error:', error.message);

        // Log details if available
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Health check to verify the Economy API service is available
   */
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Player methods

  /**
   * Get a list of players
   */
  async getPlayers(options: QueryOptions = {}): Promise<Player[]> {
    const response = await this.client.get('/players', { params: options });
    return response.data;
  }

  /**
   * Get a player by ID
   */
  async getPlayer(playerId: number): Promise<Player> {
    const response = await this.client.get(`/players/${playerId}`);
    return response.data;
  }

  /**
   * Create a new player
   */
  async createPlayer(player: Omit<Player, 'id' | 'created_at' | 'last_login'>): Promise<Player> {
    const response = await this.client.post('/players', player);
    return response.data;
  }

  // Item methods

  /**
   * Get a list of items
   */
  async getItems(options: QueryOptions = {}): Promise<Item[]> {
    const response = await this.client.get('/items', { params: options });
    return response.data;
  }

  /**
   * Get an item by ID
   */
  async getItem(itemId: number): Promise<Item> {
    const response = await this.client.get(`/items/${itemId}`);
    return response.data;
  }

  /**
   * Create a new item
   */
  async createItem(item: Omit<Item, 'id' | 'created_at'>): Promise<Item> {
    const response = await this.client.post('/items', item);
    return response.data;
  }

  // Inventory methods

  /**
   * Get a player's inventory
   */
  async getPlayerInventory(playerId: number): Promise<InventoryItem[]> {
    const response = await this.client.get(`/players/${playerId}/inventory`);
    return response.data;
  }

  /**
   * Add an item to a player's inventory
   */
  async addInventoryItem(
    playerId: number,
    inventoryItem: Omit<InventoryItem, 'id' | 'acquired_at'>
  ): Promise<InventoryItem> {
    const response = await this.client.post(`/players/${playerId}/inventory`, inventoryItem);
    return response.data;
  }

  // Trade methods

  /**
   * Get trades filtered by status and/or player
   */
  async getTrades(options: { status?: string; player_id?: number } = {}): Promise<Trade[]> {
    const response = await this.client.get('/trades', { params: options });
    return response.data;
  }

  /**
   * Create a new trade
   */
  async createTrade(trade: {
    initiator_id: number;
    receiver_id: number;
    items: {
      item_id: number;
      quantity: number;
      from_player_id: number;
      to_player_id: number;
    }[];
  }): Promise<Trade> {
    const response = await this.client.post('/trades', trade);
    return response.data;
  }

  /**
   * Update a trade status (accept/decline/cancel)
   */
  async updateTradeStatus(
    tradeId: number,
    status: 'accepted' | 'declined' | 'cancelled'
  ): Promise<Trade> {
    const response = await this.client.patch(`/trades/${tradeId}`, { status });
    return response.data;
  }

  /**
   * Get Grand Exchange offers with optional filters
   */
  async getGrandExchangeOffers(
    options: {
      item_id?: number;
      offer_type?: 'buy' | 'sell';
      status?: string;
    } = {}
  ): Promise<GrandExchangeOffer[]> {
    const response = await this.client.get('/grand-exchange/offers', { params: options });
    return response.data;
  }

  /**
   * Create a new Grand Exchange offer
   */
  async createGrandExchangeOffer(offer: {
    player_id: number;
    item_id: number;
    offer_type: 'buy' | 'sell';
    quantity: number;
    price_per_item: number;
  }): Promise<GrandExchangeOffer> {
    const response = await this.client.post('/grand-exchange/offers', offer);
    return response.data;
  }

  /**
   * Get price history for an item
   */
  async getItemPriceHistory(itemId: number, days?: number): Promise<PriceHistory[]> {
    const response = await this.client.get(`/items/${itemId}/price-history`, {
      params: { days },
    });
    return response.data;
  }
}

// Export a default instance that can be used throughout the application
export default new EconomyClient();
