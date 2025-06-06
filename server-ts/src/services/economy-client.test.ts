/**
 * Economy API Client Tests
 *
 * These tests verify the integration between the TypeScript game server
 * and the Python Economy API service.
 */

import axios from 'axios';
import {
  EconomyClient,
  Player,
  Item,
  InventoryItem,
  Trade,
  GrandExchangeOffer,
} from './economy-client';

// Mock the axios module
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EconomyClient', () => {
  let economyClient: EconomyClient;
  let mockAxiosInstance: {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    interceptors: {
      request: {
        use: jest.Mock;
        eject: jest.Mock;
      };
      response: {
        use: jest.Mock;
        eject: jest.Mock;
      };
    };
  };

  beforeEach(() => {
    // Create fresh mocks for the instance methods for each test
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn(),
          eject: jest.fn(),
        },
        response: {
          use: jest.fn(), // This is the one being called in the constructor
          eject: jest.fn(),
        },
      },
    };
    // Configure axios.create() to return our mock instance
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    // Instantiate the client, which will now use the mocked axios.create()
    economyClient = new EconomyClient('http://test-api');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const mockHealthData = { status: 'healthy', timestamp: Date.now() };
      mockAxiosInstance.get.mockResolvedValue({ data: mockHealthData });

      const result = await economyClient.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(mockHealthData);
    });

    it('should throw an error when API is unavailable', async () => {
      const networkError = new Error('Network Error');
      (networkError as any).isAxiosError = true;
      mockAxiosInstance.get.mockRejectedValue(networkError);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(economyClient.healthCheck()).rejects.toThrow('Network Error');
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Player Methods', () => {
    it('should get a list of players', async () => {
      const mockPlayers: Player[] = [
        {
          id: 1,
          username: 'player1',
          email: 'player1@example.com',
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          username: 'player2',
          email: 'player2@example.com',
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];
      mockAxiosInstance.get.mockResolvedValue({ data: mockPlayers });

      const players = await economyClient.getPlayers();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/players', { params: {} });
      expect(players).toEqual(mockPlayers);
    });

    it('should get a player by ID', async () => {
      const mockPlayer: Player = {
        id: 1,
        username: 'player1',
        email: 'player1@example.com',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockPlayer });

      const player = await economyClient.getPlayer(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/players/1');
      expect(player).toEqual(mockPlayer);
    });

    it('should create a new player', async () => {
      const newPlayerData = {
        username: 'newplayer',
        email: 'newplayer@example.com',
        is_active: true,
      };
      const mockResponse: Player = {
        ...newPlayerData,
        id: 3,
        created_at: new Date().toISOString(),
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const player = await economyClient.createPlayer(newPlayerData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/players', newPlayerData);
      expect(player).toEqual(mockResponse);
    });
  });

  describe('Item Methods', () => {
    it('should get a list of items', async () => {
      const mockItems: Item[] = [
        {
          id: 1,
          name: 'Sword',
          description: 'A sharp sword',
          is_tradeable: true,
          is_stackable: false,
          base_value: 100,
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'Gold',
          description: 'Currency',
          is_tradeable: true,
          is_stackable: true,
          base_value: 1,
          created_at: new Date().toISOString(),
        },
      ];
      mockAxiosInstance.get.mockResolvedValue({ data: mockItems });

      const items = await economyClient.getItems();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/items', { params: {} });
      expect(items).toEqual(mockItems);
    });

    it('should get an item by ID', async () => {
      const mockItem: Item = {
        id: 1,
        name: 'Sword',
        description: 'A sharp sword',
        is_tradeable: true,
        is_stackable: false,
        base_value: 100,
        created_at: new Date().toISOString(),
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockItem });

      const item = await economyClient.getItem(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/items/1');
      expect(item).toEqual(mockItem);
    });
  });

  describe('Inventory Methods', () => {
    it("should get a player's inventory", async () => {
      const mockInventory: InventoryItem[] = [
        { id: 1, player_id: 1, item_id: 1, quantity: 1, acquired_at: new Date().toISOString() },
        { id: 2, player_id: 1, item_id: 2, quantity: 100, acquired_at: new Date().toISOString() },
      ];
      mockAxiosInstance.get.mockResolvedValue({ data: mockInventory });

      const inventory = await economyClient.getPlayerInventory(1);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/players/1/inventory');
      expect(inventory).toEqual(mockInventory);
    });

    it("should add an item to a player's inventory", async () => {
      const newItemData = { player_id: 1, item_id: 3, quantity: 5 };
      const mockResponse: InventoryItem = {
        ...newItemData,
        id: 3,
        acquired_at: new Date().toISOString(),
      };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const inventoryItem = await economyClient.addInventoryItem(1, { item_id: 3, quantity: 5 });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/players/1/inventory', {
        item_id: 3,
        quantity: 5,
      });
      expect(inventoryItem).toEqual(mockResponse);
    });
  });

  describe('Trade Methods', () => {
    it('should get trades with filters', async () => {
      const mockTrades: Trade[] = [
        {
          id: 1,
          initiator_id: 1,
          receiver_id: 2,
          status: 'pending',
          initiated_at: new Date().toISOString(),
          items: [{ item_id: 1, quantity: 1, from_player_id: 1, to_player_id: 2 }],
        },
      ];
      mockAxiosInstance.get.mockResolvedValue({ data: mockTrades });

      const trades = await economyClient.getTrades({ status: 'pending' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/trades', {
        params: { status: 'pending' },
      });
      expect(trades).toEqual(mockTrades);
    });
  });

  describe('Grand Exchange Methods', () => {
    it('should get Grand Exchange offers', async () => {
      const mockOffers: GrandExchangeOffer[] = [
        {
          id: 1,
          player_id: 1,
          item_id: 1,
          offer_type: 'sell',
          quantity: 1,
          price_per_item: 100,
          quantity_remaining: 1,
          status: 'active',
          created_at: new Date().toISOString(),
        },
      ];
      mockAxiosInstance.get.mockResolvedValue({ data: mockOffers });

      const offers = await economyClient.getGrandExchangeOffers({ offer_type: 'sell' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/grand-exchange/offers', {
        params: { offer_type: 'sell' },
      });
      expect(offers).toEqual(mockOffers);
    });
  });
});
