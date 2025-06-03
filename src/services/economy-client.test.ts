/**
 * Economy API Client Tests
 * 
 * These tests verify the integration between the TypeScript game server
 * and the Python Economy API service.
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { EconomyClient } from './economy-client';

// Create a mock for axios
const mockAxios = new MockAdapter(axios);

describe('EconomyClient', () => {
  let economyClient: EconomyClient;
  
  beforeEach(() => {
    // Reset mock and create a new client instance for each test
    mockAxios.reset();
    economyClient = new EconomyClient('http://test-api');
  });
  
  afterEach(() => {
    mockAxios.restore();
  });
  
  describe('Health Check', () => {
    it('should return health status', async () => {
      // Mock the health check endpoint
      mockAxios.onGet('http://test-api/health').reply(200, {
        status: 'healthy',
        timestamp: Date.now()
      });
      
      const result = await economyClient.healthCheck();
      
      expect(result).toHaveProperty('status');
      expect(result.status).toEqual('healthy');
      expect(result).toHaveProperty('timestamp');
    });
    
    it('should throw an error when API is unavailable', async () => {
      // Mock a failed request
      mockAxios.onGet('http://test-api/health').networkError();
      
      await expect(economyClient.healthCheck()).rejects.toThrow();
    });
  });
  
  describe('Player Methods', () => {
    it('should get a list of players', async () => {
      const mockPlayers = [
        { id: 1, username: 'player1', email: 'player1@example.com', is_active: true, created_at: new Date().toISOString() },
        { id: 2, username: 'player2', email: 'player2@example.com', is_active: true, created_at: new Date().toISOString() }
      ];
      
      mockAxios.onGet('http://test-api/players').reply(200, mockPlayers);
      
      const players = await economyClient.getPlayers();
      
      expect(players).toHaveLength(2);
      expect(players[0]).toHaveProperty('id');
      expect(players[0]).toHaveProperty('username');
      expect(players[0]).toHaveProperty('email');
    });
    
    it('should get a player by ID', async () => {
      const mockPlayer = {
        id: 1,
        username: 'player1',
        email: 'player1@example.com',
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      mockAxios.onGet('http://test-api/players/1').reply(200, mockPlayer);
      
      const player = await economyClient.getPlayer(1);
      
      expect(player).toHaveProperty('id', 1);
      expect(player).toHaveProperty('username', 'player1');
      expect(player).toHaveProperty('email', 'player1@example.com');
    });
    
    it('should create a new player', async () => {
      const newPlayer = {
        username: 'newplayer',
        email: 'newplayer@example.com',
        is_active: true
      };
      
      const mockResponse = {
        ...newPlayer,
        id: 3,
        created_at: new Date().toISOString()
      };
      
      mockAxios.onPost('http://test-api/players').reply(200, mockResponse);
      
      const player = await economyClient.createPlayer(newPlayer);
      
      expect(player).toHaveProperty('id', 3);
      expect(player).toHaveProperty('username', 'newplayer');
      expect(player).toHaveProperty('created_at');
    });
  });
  
  describe('Item Methods', () => {
    it('should get a list of items', async () => {
      const mockItems = [
        { id: 1, name: 'Sword', description: 'A sharp sword', is_tradeable: true, is_stackable: false, base_value: 100, created_at: new Date().toISOString() },
        { id: 2, name: 'Gold', description: 'Currency', is_tradeable: true, is_stackable: true, base_value: 1, created_at: new Date().toISOString() }
      ];
      
      mockAxios.onGet('http://test-api/items').reply(200, mockItems);
      
      const items = await economyClient.getItems();
      
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveProperty('id');
      expect(items[0]).toHaveProperty('name');
      expect(items[0]).toHaveProperty('base_value');
    });
    
    it('should get an item by ID', async () => {
      const mockItem = {
        id: 1,
        name: 'Sword',
        description: 'A sharp sword',
        is_tradeable: true,
        is_stackable: false,
        base_value: 100,
        created_at: new Date().toISOString()
      };
      
      mockAxios.onGet('http://test-api/items/1').reply(200, mockItem);
      
      const item = await economyClient.getItem(1);
      
      expect(item).toHaveProperty('id', 1);
      expect(item).toHaveProperty('name', 'Sword');
      expect(item).toHaveProperty('base_value', 100);
    });
  });
  
  describe('Inventory Methods', () => {
    it('should get a player\'s inventory', async () => {
      const mockInventory = [
        { id: 1, player_id: 1, item_id: 1, quantity: 1, acquired_at: new Date().toISOString() },
        { id: 2, player_id: 1, item_id: 2, quantity: 100, acquired_at: new Date().toISOString() }
      ];
      
      mockAxios.onGet('http://test-api/players/1/inventory').reply(200, mockInventory);
      
      const inventory = await economyClient.getPlayerInventory(1);
      
      expect(inventory).toHaveLength(2);
      expect(inventory[0]).toHaveProperty('player_id', 1);
      expect(inventory[0]).toHaveProperty('item_id');
      expect(inventory[0]).toHaveProperty('quantity');
    });
    
    it('should add an item to a player\'s inventory', async () => {
      const newItem = {
        player_id: 1,
        item_id: 3,
        quantity: 5
      };
      
      const mockResponse = {
        ...newItem,
        id: 3,
        acquired_at: new Date().toISOString()
      };
      
      mockAxios.onPost('http://test-api/players/1/inventory').reply(200, mockResponse);
      
      const inventoryItem = await economyClient.addInventoryItem(1, newItem);
      
      expect(inventoryItem).toHaveProperty('id', 3);
      expect(inventoryItem).toHaveProperty('player_id', 1);
      expect(inventoryItem).toHaveProperty('item_id', 3);
      expect(inventoryItem).toHaveProperty('quantity', 5);
      expect(inventoryItem).toHaveProperty('acquired_at');
    });
  });
  
  describe('Trade Methods', () => {
    it('should get trades with filters', async () => {
      const mockTrades = [
        {
          id: 1,
          initiator_id: 1,
          receiver_id: 2,
          status: 'pending',
          initiated_at: new Date().toISOString(),
          items: [
            { item_id: 1, quantity: 1, from_player_id: 1, to_player_id: 2 }
          ]
        }
      ];
      
      mockAxios.onGet('http://test-api/trades').reply(config => {
        expect(config.params).toHaveProperty('status', 'pending');
        return [200, mockTrades];
      });
      
      const trades = await economyClient.getTrades({ status: 'pending' });
      
      expect(trades).toHaveLength(1);
      expect(trades[0]).toHaveProperty('id', 1);
      expect(trades[0]).toHaveProperty('status', 'pending');
      expect(trades[0].items).toHaveLength(1);
    });
  });
  
  describe('Grand Exchange Methods', () => {
    it('should get Grand Exchange offers', async () => {
      const mockOffers = [
        {
          id: 1,
          player_id: 1,
          item_id: 1,
          offer_type: 'sell',
          quantity: 1,
          price_per_item: 100,
          quantity_remaining: 1,
          status: 'active',
          created_at: new Date().toISOString()
        }
      ];
      
      mockAxios.onGet('http://test-api/grand-exchange/offers').reply(config => {
        expect(config.params).toHaveProperty('offer_type', 'sell');
        return [200, mockOffers];
      });
      
      const offers = await economyClient.getGrandExchangeOffers({ offer_type: 'sell' });
      
      expect(offers).toHaveLength(1);
      expect(offers[0]).toHaveProperty('id', 1);
      expect(offers[0]).toHaveProperty('offer_type', 'sell');
      expect(offers[0]).toHaveProperty('price_per_item', 100);
    });
  });
});
