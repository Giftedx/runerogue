/**
 * Simple test to debug inventory issue
 */
import { ColyseusTestServer, boot } from '@colyseus/testing';
import appConfig from '../../app.config';
import { InventoryItem } from '../../game/EntitySchemas';

// Mock economy integration with Jest hoisting-safe approach
jest.mock('../../economy-integration', () => ({
  __esModule: true,
  default: {
    getOrCreatePlayerProfile: jest.fn().mockResolvedValue({
      id: 'test_profile_id',
      username: 'TestPlayer',
    }),
    getPlayerInventory: jest
      .fn()
      .mockImplementation(async (playerId: string): Promise<InventoryItem[]> => {
        console.log('🔍 MOCK: getPlayerInventory called with playerId:', playerId);
        const result: InventoryItem[] = [];
        console.log('🔍 MOCK: returning empty array:', result);
        return result;
      }),
    addItemToInventory: jest.fn().mockResolvedValue({ success: true }),
    removeItemFromInventory: jest.fn().mockResolvedValue({ success: true }),
    isReady: jest.fn().mockResolvedValue(true),
    getCurrentMarketPrice: jest.fn().mockResolvedValue(10),
  },
}));

// Mock PlayerPersistence to ensure fresh start
jest.mock('../../persistence/PlayerPersistence', () => ({
  __esModule: true,
  default: {
    loadPlayer: jest.fn().mockResolvedValue(null), // No save data
    savePlayer: jest.fn().mockResolvedValue(true),
    applyLoadedData: jest.fn().mockResolvedValue(undefined),
    getPlayerStats: jest.fn().mockResolvedValue({}),
  },
}));

describe('GameRoom Inventory Debug', () => {
  let colyseus: ColyseusTestServer;

  beforeAll(async () => {
    colyseus = await boot(appConfig);
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  it('should debug inventory loading', async () => {
    // Get access to mocked functions after module is imported
    const economyIntegration = require('../../economy-integration').default;

    const room = await colyseus.createRoom('game', {});
    const client = await colyseus.connectTo(room, { name: 'TestPlayer' });

    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    const player = room.state.players.get(client.sessionId);

    console.log('🔍 DEBUG: Player found:', !!player);
    console.log('🔍 DEBUG: Player inventory length:', player?.inventory?.length);
    console.log('🔍 DEBUG: Player inventory type:', typeof player?.inventory);
    console.log('🔍 DEBUG: Player inventory constructor:', player?.inventory?.constructor?.name);

    if (player?.inventory?.length && player.inventory.length > 0) {
      console.log(
        '🔍 DEBUG: First few items:',
        player.inventory.slice(0, 5).map((item: InventoryItem) => ({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
        }))
      );
    }

    // Check mock calls
    console.log(
      '🔍 DEBUG: getOrCreatePlayerProfile calls:',
      economyIntegration.getOrCreatePlayerProfile.mock.calls.length
    );
    console.log(
      '🔍 DEBUG: getPlayerInventory calls:',
      economyIntegration.getPlayerInventory.mock.calls.length
    );

    expect(player).toBeDefined();
    expect(player?.inventory?.length).toBeLessThan(100); // Should definitely not be 894!

    await client.leave();
  });
});
