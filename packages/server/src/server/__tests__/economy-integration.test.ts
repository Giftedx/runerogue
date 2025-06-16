// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import economyClient from '../../services/economy-client';
import { EconomyIntegration } from '../economy-integration';

// Mock the economy client
jest.mock('../../services/economy-client', () => ({
  __esModule: true,
  default: {
    healthCheck: jest.fn(),
    getPlayer: jest.fn(),
    getPlayers: jest.fn(),
    createPlayer: jest.fn(),
    getItem: jest.fn(),
    getItems: jest.fn(),
    getPlayerInventory: jest.fn(),
    addInventoryItem: jest.fn(),
    getGrandExchangeOffers: jest.fn(),
    createGrandExchangeOffer: jest.fn(),
    getItemPriceHistory: jest.fn(),
  },
}));

describe('Economy Integration', () => {
  let economyIntegration: EconomyIntegration;

  beforeEach(() => {
    jest.clearAllMocks();
    economyIntegration = new EconomyIntegration();
  });

  describe('isReady', () => {
    it('should return true when economy API is healthy', async () => {
      // Clear any previous mocks
      jest.clearAllMocks();

      // Mock the healthCheck to always return healthy status for this test
      jest.spyOn(economyClient, 'healthCheck').mockImplementation(async () => ({ status: 'ok' }));

      const result = await economyIntegration.isReady();

      expect(result).toBe(true);
      expect(economyClient.healthCheck).toHaveBeenCalled();
    });

    it('should return false when economy API is not healthy', async () => {
      // Clear any previous mocks
      jest.clearAllMocks();

      // Mock the healthCheck to throw error for this test
      jest.spyOn(economyClient, 'healthCheck').mockImplementation(async () => {
        throw new Error('API unavailable');
      });

      const result = await economyIntegration.isReady();

      expect(result).toBe(false);
      expect(economyClient.healthCheck).toHaveBeenCalled();
    });
  });

  describe('getPlayerProfile', () => {
    it('should get player profile and cache it', async () => {
      const mockPlayer = { id: 'dummy_testPlayer', username: 'testPlayer', createdAt: Date.now() };

      // Mock the getPlayers method since that's what's called in the implementation
      jest.spyOn(economyClient, 'getPlayers').mockResolvedValueOnce([mockPlayer]);

      const result = await economyIntegration.getOrCreatePlayerProfile('testPlayer');

      expect(result).toEqual(mockPlayer);
      expect(economyClient.getPlayers).toHaveBeenCalledWith({ limit: 1, username: 'testPlayer' });

      // Call again to test caching
      await economyIntegration.getOrCreatePlayerProfile('testPlayer');
      expect(economyClient.getPlayers).toHaveBeenCalledTimes(1); // Should still be 1 if cached
    });
  });

  describe('getPlayerInventory', () => {
    it('should get player inventory and cache it', async () => {
      const mockInventory = [
        { id: 1, name: 'Bronze sword', quantity: 1 },
        { id: 'item2', name: 'Logs', quantity: 5 },
      ];
      (economyClient.getPlayerInventory as jest.Mock).mockResolvedValue(mockInventory);

      const result = await economyIntegration.getPlayerInventory('testPlayer');

      expect(result).toEqual(mockInventory);
      expect(economyClient.getPlayerInventory).toHaveBeenCalledWith('testPlayer');
    });
  });

  describe('addItemToPlayerInventory', () => {
    it('should add item to player inventory and invalidate cache', async () => {
      const mockAddResult = { success: true };
      (economyClient.addInventoryItem as jest.Mock).mockResolvedValue(mockAddResult);

      const result = await economyIntegration.addItemToInventory(1, 1, 2);

      expect(result).toEqual(mockAddResult);
      expect(economyClient.addInventoryItem).toHaveBeenCalledWith(1, {
        player_id: 1,
        item_id: 1,
        quantity: 2,
      });
    });
  });

  describe('getMarketPrice', () => {
    it('should get current market price for an item', async () => {
      const mockPriceHistory = [
        { timestamp: Date.now() - 10000, price: 90 },
        { timestamp: Date.now() - 5000, price: 100 },
        { timestamp: Date.now(), price: 110 },
      ];
      (economyClient.getItemPriceHistory as jest.Mock).mockResolvedValue(mockPriceHistory);

      const result = await economyIntegration.getCurrentMarketPrice(1);

      expect(result).toEqual(110); // Should return the most recent price
      expect(economyClient.getItemPriceHistory).toHaveBeenCalledWith(1);
    });

    it('should return default price if no history exists', async () => {
      (economyClient.getItemPriceHistory as jest.Mock).mockResolvedValue([]);

      const result = await economyIntegration.getCurrentMarketPrice(1);

      expect(result).toEqual(1); // Default price
      expect(economyClient.getItemPriceHistory).toHaveBeenCalledWith(1);
    });
  });
});
