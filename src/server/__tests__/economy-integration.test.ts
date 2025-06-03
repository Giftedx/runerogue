import economyIntegration from '../economy-integration';
import economyClient from '../../services/economy-client';

// Mock the economy client
jest.mock('../../services/economy-client', () => ({
  __esModule: true,
  default: {
    getHealth: jest.fn(),
    getPlayer: jest.fn(),
    createPlayer: jest.fn(),
    updatePlayer: jest.fn(),
    getItem: jest.fn(),
    getItems: jest.fn(),
    getInventory: jest.fn(),
    addItemToInventory: jest.fn(),
    removeItemFromInventory: jest.fn(),
    getGrandExchangeOffers: jest.fn(),
    createGrandExchangeOffer: jest.fn(),
    getItemPriceHistory: jest.fn(),
  }
}));

describe('Economy Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isReady', () => {
    it('should return true when economy API is healthy', async () => {
      (economyClient.getHealth as jest.Mock).mockResolvedValue({ status: 'ok' });
      
      const result = await economyIntegration.isReady();
      
      expect(result).toBe(true);
      expect(economyClient.getHealth).toHaveBeenCalledTimes(1);
    });

    it('should return false when economy API is not healthy', async () => {
      (economyClient.getHealth as jest.Mock).mockRejectedValue(new Error('API unavailable'));
      
      const result = await economyIntegration.isReady();
      
      expect(result).toBe(false);
      expect(economyClient.getHealth).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPlayerProfile', () => {
    it('should get player profile and cache it', async () => {
      const mockPlayer = { id: '123', username: 'testPlayer', gold: 100 };
      (economyClient.getPlayer as jest.Mock).mockResolvedValue(mockPlayer);
      
      const result = await economyIntegration.getPlayerProfile('testPlayer');
      
      expect(result).toEqual(mockPlayer);
      expect(economyClient.getPlayer).toHaveBeenCalledWith('testPlayer');
      
      // Call again to test caching
      await economyIntegration.getPlayerProfile('testPlayer');
      expect(economyClient.getPlayer).toHaveBeenCalledTimes(1); // Should still be 1 if cached
    });
  });

  describe('getPlayerInventory', () => {
    it('should get player inventory and cache it', async () => {
      const mockInventory = [
        { id: 'item1', name: 'Bronze sword', quantity: 1 },
        { id: 'item2', name: 'Logs', quantity: 5 }
      ];
      (economyClient.getInventory as jest.Mock).mockResolvedValue(mockInventory);
      
      const result = await economyIntegration.getPlayerInventory('testPlayer');
      
      expect(result).toEqual(mockInventory);
      expect(economyClient.getInventory).toHaveBeenCalledWith('testPlayer');
    });
  });

  describe('addItemToPlayerInventory', () => {
    it('should add item to player inventory and invalidate cache', async () => {
      const mockAddResult = { success: true };
      (economyClient.addItemToInventory as jest.Mock).mockResolvedValue(mockAddResult);
      
      const result = await economyIntegration.addItemToPlayerInventory('testPlayer', 'item1', 2);
      
      expect(result).toEqual(mockAddResult);
      expect(economyClient.addItemToInventory).toHaveBeenCalledWith('testPlayer', 'item1', 2);
    });
  });

  describe('getMarketPrice', () => {
    it('should get current market price for an item', async () => {
      const mockPriceHistory = [
        { timestamp: Date.now() - 10000, price: 90 },
        { timestamp: Date.now() - 5000, price: 100 },
        { timestamp: Date.now(), price: 110 }
      ];
      (economyClient.getItemPriceHistory as jest.Mock).mockResolvedValue(mockPriceHistory);
      
      const result = await economyIntegration.getMarketPrice('item1');
      
      expect(result).toEqual(110); // Should return the most recent price
      expect(economyClient.getItemPriceHistory).toHaveBeenCalledWith('item1');
    });
    
    it('should return default price if no history exists', async () => {
      (economyClient.getItemPriceHistory as jest.Mock).mockResolvedValue([]);
      
      const result = await economyIntegration.getMarketPrice('item1');
      
      expect(result).toEqual(1); // Default price
      expect(economyClient.getItemPriceHistory).toHaveBeenCalledWith('item1');
    });
  });
});
