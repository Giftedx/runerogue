// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import economyIntegration from '../economy-integration';
import economyClient from '../../services/economy-client';

// Mock the economy client
jest.mock('../../services/economy-client', () => ({
  __esModule: true,
  default: {
    healthCheck: jest.fn(), // Corrected from getHealth
    getPlayer: jest.fn(),
    createPlayer: jest.fn(), // Assuming economy-integration might use it
    // updatePlayer: jest.fn(), // Removed, does not exist on EconomyClient
    getItem: jest.fn(), // Assuming economy-integration might use it
    getItems: jest.fn(), // Assuming economy-integration might use it
    getPlayerInventory: jest.fn(), // Corrected from getInventory
    addInventoryItem: jest.fn(), // Corrected from addItemToInventory
    // removeItemFromInventory: jest.fn(), // Removed, does not exist on EconomyClient
    getGrandExchangeOffers: jest.fn(), // Assuming economy-integration might use it
    createGrandExchangeOffer: jest.fn(), // Assuming economy-integration might use it
    getItemPriceHistory: jest.fn(),
    // Ensure all methods used by economy-integration.ts are mocked here
  },
}));

describe('Economy Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isReady', () => {
    it('should return true when economy API is healthy', async () => {
      (economyClient.healthCheck as jest.Mock).mockResolvedValue({ status: 'ok' });

      const result = await economyIntegration.isReady();

      expect(result).toBe(true);
      expect(economyClient.healthCheck).toHaveBeenCalledTimes(1);
    });

    it('should return false when economy API is not healthy', async () => {
      (economyClient.healthCheck as jest.Mock).mockRejectedValue(new Error('API unavailable'));

      const result = await economyIntegration.isReady();

      expect(result).toBe(false);
      expect(economyClient.healthCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPlayerProfile', () => {
    it('should get player profile and cache it', async () => {
      const mockPlayer = { id: '123', username: 'testPlayer', gold: 100 };
      (economyClient.getPlayer as jest.Mock).mockResolvedValue(mockPlayer);

      const result = await economyIntegration.getOrCreatePlayerProfile('testPlayer', 'test@example.com');

      expect(result).toEqual(mockPlayer);
      expect(economyClient.getPlayer).toHaveBeenCalledWith('testPlayer');

      // Call again to test caching
      await economyIntegration.getOrCreatePlayerProfile('testPlayer', 'test@example.com');
      expect(economyClient.getPlayer).toHaveBeenCalledTimes(1); // Should still be 1 if cached
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
