import { Client, Room } from '@colyseus/core';
import { ArraySchema } from '@colyseus/schema';
import 'reflect-metadata';
import appConfig from '../../app.config';
import { GameState, InventoryItem, LootDrop } from '../../game/EntitySchemas';
import '../../utils/symbol-metadata-polyfill';

// Simple utility to flush pending promises
const flushPromises = () => new Promise(setImmediate);

import { boot, ColyseusTestServer } from '@colyseus/testing';

// Create minimal mocks that won't cause loops
const mockItemManagerInstance = {
  getItemDefinition: jest.fn(async () => ({
    id: 'test_item_id',
    itemId: 'test_item',
    name: 'Test Item',
    description: 'A test item.',
    attack: 0,
    defense: 0,
    isStackable: false,
    baseValue: 1,
    isTradeable: true,
  })),
  syncWithEconomy: jest.fn().mockResolvedValue(undefined),
};

// Mock ItemManager
jest.mock('../../game/ItemManager', () => ({
  ItemManager: {
    getInstance: jest.fn(() => mockItemManagerInstance),
  },
}));

// Mock LootManager
jest.mock('../../game/LootManager', () => ({
  LootManager: {
    dropLootFromNPC: jest.fn().mockResolvedValue(null),
    dropLootFromPlayer: jest.fn().mockResolvedValue(null),
    collectLoot: jest.fn().mockReturnValue(true),
    dropSpecificItem: jest.fn().mockResolvedValue(null),
  },
}));

// Mock economy integration
jest.mock('../../economy-integration', () => ({
  __esModule: true,
  default: {
    getOrCreatePlayerProfile: jest.fn().mockResolvedValue({
      id: 'mockEconomyId',
      username: 'testPlayer',
    }),
    getPlayerInventory: jest.fn().mockResolvedValue([]),
    addItemToInventory: jest.fn().mockResolvedValue({ success: true }),
    removeItemFromInventory: jest.fn().mockResolvedValue({ success: true }),
    isReady: jest.fn().mockResolvedValue(true),
    getCurrentMarketPrice: jest.fn().mockResolvedValue(10),
  },
}));

// Mock multiplayer sync
jest.mock('../../game/multiplayerSync', () => ({
  broadcastPlayerState: jest.fn(),
}));

process.env.COLYSEUS_URI = 'ws://localhost:2567';

describe('GameRoom Simple Test', () => {
  let colyseus: ColyseusTestServer;
  let room: Room<GameState>;

  beforeAll(async () => {
    colyseus = await boot(appConfig);
  });

  beforeEach(async () => {
    await colyseus.cleanup();
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  it('should create a room without hanging', async () => {
    console.log('Starting room creation test...');

    // Set a timeout to detect infinite loops
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Test timeout - possible infinite loop')), 10000);
    });

    const roomCreation = colyseus.createRoom('game', {});

    try {
      room = await Promise.race([roomCreation, timeout]);
      console.log('Room created successfully');
      expect(room).toBeDefined();
      expect(typeof room.roomId).toBe('string');
    } finally {
      if (room) {
        await room.disconnect();
      }
    }
  }, 15000); // 15 second timeout for the test itself
});
