import { ItemManager } from "../../game/ItemManager";
import { Room } from '@colyseus/core';
import { GameRoom } from '../../game/GameRoom';
import { InventoryItem, Player, GameState } from '../../game/EntitySchemas';
import { JoinOptions } from '../../game/GameRoom';
import appConfig from '../../app.config';

import { LootManager } from "../../game/LootManager";
import { sendDiscordNotification } from '../../discord-bot';

import { boot, ColyseusTestServer, Client } from '@colyseus/testing';

const mockSwordOfHeroesDefinition = {
  id: 'sword_of_heroes_id',
  itemId: 'sword_of_heroes',
  name: 'sword_of_heroes',
  description: 'A mighty sword.',
  attack: 10,
  defense: 0,
  isStackable: false,
  baseValue: 100,
  isTradeable: true,
};

jest.mock('../../game/ItemManager', () => ({
  ItemManager: {
    getInstance: jest.fn(() => ({
      getItemDefinition: jest.fn((itemId: string) => {
        if (itemId === 'sword_of_heroes') {
          return mockSwordOfHeroesDefinition;
        } else if (itemId === 'health_potion') {
          return { id: 'health_potion_id', itemId: 'health_potion', name: 'Health Potion', description: 'Restores health.', attack: 0, defense: 0, isStackable: true, baseValue: 5, isTradeable: true };
        }
        return undefined;
      }),
    })),
  },
}));

// Mock the economyIntegration module
jest.mock('../../economy-integration', () => ({
  __esModule: true,
  default: {
    getOrCreatePlayerProfile: jest.fn(() => Promise.resolve({ id: 'mockEconomyId', name: 'MockPlayer' })),
    getPlayerInventory: jest.fn(() => Promise.resolve([])),
    addItemToInventory: jest.fn(() => Promise.resolve()),
    removeItemFromInventory: jest.fn(() => Promise.resolve()),
  },
}));
import economyIntegration from '../../economy-integration';

jest.mock('../../game/multiplayerSync', () => ({
  broadcastPlayerState: jest.fn(),
}));
import { broadcastPlayerState } from '../../game/multiplayerSync';

process.env.COLYSEUS_URI = "ws://localhost:2567";

describe('GameRoom', () => {
  let colyseus: ColyseusTestServer;
  let room: Room<GameState>;

  beforeAll(async () => {
    colyseus = await boot();
    colyseus.app.define('game', GameRoom);
  });

  beforeEach(async () => {
    await colyseus.cleanup();
    room = await colyseus.createRoom('game', {});
  });

  afterEach(async () => {
    await room.disconnect();
  });

  afterAll(async () => {
    await colyseus.shutdown();
  });

  it('should create a game room', () => {
    expect(typeof room.roomId).toBe('string');
    expect(room.roomId.length).toBeGreaterThan(0);
  });

  describe('Player Management', () => {
    let client: Client;

    beforeEach(async () => {
      client = await colyseus.connectTo(room, { name: 'TestPlayer' });
    });

    it('should allow a player to join', async () => {
      expect(room.state.players.size).toBe(1);
      expect(room.state.players.has(client.sessionId)).toBe(true);

      const player = room.state.players.get(client.sessionId);
      expect(player).toBeDefined();
      expect(player?.name).toBe('TestPlayer');
      expect(client.send).toHaveBeenCalledWith('welcome', { message: 'Welcome to RuneScape Discord Game!', playerId: client.sessionId });
    });

    it('should update player position on move', async () => {
      // Send movement message
      await client.send('move', {
        x: 100,
        y: 200,
        animation: 'walking',
        direction: 'left',
      });

      const player = room.state.players.get(client.sessionId);
      expect(player?.x).toBe(100);
      expect(player?.y).toBe(200);
    });
  });

  describe('Player Disconnection', () => {
    let client: Client;

    beforeEach(async () => {
      client = await colyseus.connectTo(room, { name: 'TestPlayer' });
    });

    it('should remove player on leave', async () => {
      expect(room.state.players.has(client.sessionId)).toBe(true);
      await client.leave();
      expect(room.state.players.has(client.sessionId)).toBe(false);
    });

    it('should handle player reconnection', async () => {
      jest.spyOn(room, 'allowReconnection').mockResolvedValue(client);

      await client.leave(true);
      expect(room.state.players.has(client.sessionId)).toBe(false);
      expect(room.allowReconnection).toHaveBeenCalledWith(client, 10);
    });
  });

  describe('Trade Management', () => {
    let client1: Client;
    let client2: Client;
    let player1: Player;
    let player2: Player;

    beforeEach(async () => {
      // Connect two clients and create two players
      client1 = await colyseus.connectTo(room, { name: 'Player1' });
      client2 = await colyseus.connectTo(room, { name: 'Player2' });

      player1 = room.state.players.get(client1.sessionId)!;
      player2 = room.state.players.get(client2.sessionId)!;

      // Clear any previous mock calls for economyIntegration
      (economyIntegration.getOrCreatePlayerProfile as jest.Mock).mockClear();
      (economyIntegration.getPlayerInventory as jest.Mock).mockClear();
      (economyIntegration.addItemToInventory as jest.Mock).mockClear();
      (economyIntegration.removeItemFromInventory as jest.Mock).mockClear();
    });

    it('should handle a trade request successfully', async () => {
      // Simulate Player1 sending a trade request to Player2
      await client1.send('trade_request', { targetPlayerId: player2.id });

      // Expect trade to be created in game state
      expect(room.state.trades.size).toBe(1);
      const trade = Array.from(room.state.trades.values())[0];
      expect(trade.proposerId).toBe(player1.id);
      expect(trade.accepterId).toBe(player2.id);
      expect(trade.status).toBe('pending');

      // Expect clients to receive appropriate messages
      expect(client1.send).toHaveBeenCalledWith('trade_request_sent', {
        tradeId: trade.tradeId,
        targetPlayerName: player2.name,
      });
      expect(client2.send).toHaveBeenCalledWith('trade_request_received', {
        tradeId: trade.tradeId,
        proposerPlayerId: player1.id,
        proposerPlayerName: player1.name,
      });
    });

    it('should not allow a player to trade if target not found', async () => {
      await client1.send('trade_request', { targetPlayerId: 'nonExistentPlayer' });
      expect(room.state.trades.size).toBe(0);
      expect(client1.send).toHaveBeenCalledWith('trade_error', { message: 'Player or target not found.' });
    });

    it('should not allow a player to trade if already in a trade', async () => {
      // Simulate an existing trade for player1
      const existingTradeId = `trade_${Date.now()}_${player1.id}_${player2.id}`;
      room.state.trades.set(existingTradeId, new Trade(existingTradeId, player1.id, player2.id));

      await client1.send('trade_request', { targetPlayerId: player2.id });
      expect(room.state.trades.size).toBe(1); // Still only the initial trade
      expect(client1.send).toHaveBeenCalledWith('trade_error', { message: 'One of the players is already in a trade.' });
    });

    it('should handle a trade offer successfully', async () => {
      // Setup: Initiate a trade request first
      await client1.send('trade_request', { targetPlayerId: player2.id });
      const trade = Array.from(room.state.trades.values())[0];

      // Add items to player1's inventory for testing
      const swordDef = ItemManager.getInstance().getItemDefinition('bronze_sword');
      if (swordDef) {
        player1.inventory.push(new InventoryItem(swordDef, 5));
      }

      // Simulate Player1 offering items
      const offeredItems = [{ itemId: 'bronze_sword', quantity: 2 }];
      await client1.send('trade_offer', { tradeId: trade.tradeId, offeredItems });

      // Expect trade state to be updated
      expect(trade.proposerItems.length).toBe(1);
      expect(trade.proposerItems[0].itemId).toBe('bronze_sword');
      expect(trade.proposerItems[0].quantity).toBe(2);
      expect(trade.status).toBe('offered');

      // Expect player's inventory to be updated
      expect(player1.inventory.find(item => item.itemId === 'bronze_sword')?.quantity).toBe(3);

      // Expect economyIntegration.removeItemFromInventory to be called
      expect(economyIntegration.removeItemFromInventory).toHaveBeenCalledWith(
        'mockEconomyId', 'bronze_sword', 2
      );

      // Expect clients to receive trade_offer_updated message
      expect(client1.send).toHaveBeenCalledWith('trade_offer_updated', {
        tradeId: trade.tradeId,
        offeredItems: offeredItems,
        isProposer: true,
      });
      expect(client2.send).toHaveBeenCalledWith('trade_offer_updated', {
        tradeId: trade.tradeId,
        offeredItems: offeredItems,
        isProposer: false,
      });
    });

    it('should not allow trade offer with insufficient items', async () => {
      // Setup: Initiate a trade request first
      await client1.send('trade_request', { targetPlayerId: player2.id });
      const trade = Array.from(room.state.trades.values())[0];

      // Simulate Player1 offering more items than they have
      const offeredItems = [{ itemId: 'bronze_sword', quantity: 10 }];
      await client1.send('trade_offer', { tradeId: trade.tradeId, offeredItems });

      // Expect trade state not to be updated
      expect(trade.proposerItems.length).toBe(0);
      expect(trade.status).toBe('pending');

      // Expect error message to be sent
      expect(client1.send).toHaveBeenCalledWith('trade_error', { message: 'Not enough Bronze Sword in inventory.' });
      expect(economyIntegration.removeItemFromInventory).not.toHaveBeenCalled();
    });

    it('should clear previous offer when new offer is made', async () => {
      // Setup: Initiate a trade request and make an initial offer
      await client1.send('trade_request', { targetPlayerId: player2.id });
      const trade = Array.from(room.state.trades.values())[0];

      const swordDef = ItemManager.getInstance().getItemDefinition('bronze_sword');
      const potionDef = ItemManager.getInstance().getItemDefinition('health_potion');
      if (swordDef && potionDef) {
        player1.inventory.push(new InventoryItem(swordDef, 5));
        player1.inventory.push(new InventoryItem(potionDef, 3));
      }

      await client1.send('trade_offer', { tradeId: trade.tradeId, offeredItems: [{ itemId: 'bronze_sword', quantity: 1 }] });

      // Simulate Player1 making a new offer
      const newOfferedItems = [{ itemId: 'health_potion', quantity: 1 }];
      await client1.send('trade_offer', { tradeId: trade.tradeId, offeredItems: newOfferedItems });

      // Expect previous items to be returned to inventory and new items to be in trade
      expect(player1.inventory.find(item => item.itemId === 'bronze_sword')?.quantity).toBe(5); // Item returned
      expect(player1.inventory.find(item => item.itemId === 'health_potion')?.quantity).toBe(2); // New item removed
      expect(trade.proposerItems.length).toBe(1);
      expect(trade.proposerItems[0].itemId).toBe('health_potion');
      expect(trade.proposerItems[0].quantity).toBe(1);
    });

    it('should handle trade acceptance successfully', async () => {
      // Setup: Initiate a trade and both players make offers
      await client1.send('trade_request', { targetPlayerId: player2.id });
      const trade = Array.from(room.state.trades.values())[0];

      const swordDef = ItemManager.getInstance().getItemDefinition('bronze_sword');
      const potionDef = ItemManager.getInstance().getItemDefinition('health_potion');
      if (swordDef && potionDef) {
        player1.inventory.push(new InventoryItem(swordDef, 5));
        player2.inventory.push(new InventoryItem(potionDef, 3));

        await client1.send('trade_offer', { tradeId: trade.tradeId, offeredItems: [{ itemId: 'bronze_sword', quantity: 1 }] });
        await client2.send('trade_offer', { tradeId: trade.tradeId, offeredItems: [{ itemId: 'health_potion', quantity: 1 }] });

        // Simulate Player1 accepting the trade
        await client1.send('trade_accept', { tradeId: trade.tradeId });

        // Expect trade status to be updated
        expect(trade.proposerAccepted).toBe(true);
        expect(trade.status).toBe('accepted');

        // Simulate Player2 accepting the trade
        await client2.send('trade_accept', { tradeId: trade.tradeId });

        // Expect trade to be completed and removed from state
        expect(trade.accepterAccepted).toBe(true);
        expect(room.state.trades.size).toBe(0);

        // Expect inventories to be swapped
        expect(player1.inventory.find(item => item.itemId === 'health_potion')?.quantity).toBe(1);
        expect(player2.inventory.find(item => item.itemId === 'bronze_sword')?.quantity).toBe(1);

        // Expect economyIntegration to be called for item transfers
        expect(economyIntegration.addItemToInventory).toHaveBeenCalledWith('mockEconomyId', 'health_potion', 1);
        expect(economyIntegration.removeItemFromInventory).toHaveBeenCalledWith('mockEconomyId', 'bronze_sword', 1);
        expect(economyIntegration.addItemToInventory).toHaveBeenCalledWith('mockEconomyId', 'bronze_sword', 1);
        expect(economyIntegration.removeItemFromInventory).toHaveBeenCalledWith('mockEconomyId', 'health_potion', 1);

        // Expect clients to receive trade_completed message
        expect(client1.send).toHaveBeenCalledWith('trade_completed', { tradeId: trade.tradeId });
        expect(client2.send).toHaveBeenCalledWith('trade_completed', { tradeId: trade.tradeId });
      }
    });

    it('should handle trade cancellation successfully', async () => {
      // Setup: Initiate trade and Player1 makes an offer
      await client1.send('trade_request', { targetPlayerId: player2.id });
      const trade = Array.from(room.state.trades.values())[0];

      const swordDef = ItemManager.getInstance().getItemDefinition('bronze_sword');
      if (swordDef) {
        player1.inventory.push(new InventoryItem(swordDef, 5));
        await client1.send('trade_offer', { tradeId: trade.tradeId, offeredItems: [{ itemId: 'bronze_sword', quantity: 1 }] });
      }

      // Simulate Player1 cancelling the trade
      await client1.send('trade_cancel', { tradeId: trade.tradeId });

      // Expect trade to be removed from state
      expect(room.state.trades.size).toBe(0);

      // Expect player's inventory to be restored
      expect(player1.inventory.find(item => item.itemId === 'bronze_sword')?.quantity).toBe(5);

      // Expect economyIntegration.addItemToInventory to be called for item restoration
      expect(economyIntegration.addItemToInventory).toHaveBeenCalledWith(
        'mockEconomyId', 'bronze_sword', 1
      );

      // Expect clients to receive trade_cancelled message
      expect(client1.send).toHaveBeenCalledWith('trade_cancelled', { tradeId: trade.tradeId });
      expect(client2.send).toHaveBeenCalledWith('trade_cancelled', { tradeId: trade.tradeId });
    });

    it('should not allow trade actions for non-existent tradeId', async () => {
      await client1.send('trade_offer', { tradeId: 'nonExistentTrade', offeredItems: [] });
      expect(client1.send).toHaveBeenCalledWith('trade_error', { message: 'Trade not found.' });

      await client1.send('trade_accept', { tradeId: 'nonExistentTrade' });
      expect(client1.send).toHaveBeenCalledWith('trade_error', { message: 'Trade not found.' });

      await client1.send('trade_cancel', { tradeId: 'nonExistentTrade' });
      expect(client1.send).toHaveBeenCalledWith('trade_error', { message: 'Trade not found.' });
    });

    it('should not allow trade actions if not part of the trade', async () => {
      // Setup: Player1 requests trade with Player2
      await client1.send('trade_request', { targetPlayerId: player2.id });
      const trade = Array.from(room.state.trades.values())[0];

      // Connect a third client (Player3)
      const client3 = await colyseus.connectTo(room, { name: 'Player3' });
      const player3 = room.state.players.get(client3.sessionId)!;

      // Player3 tries to offer items in Player1-Player2 trade
      await client3.send('trade_offer', { tradeId: trade.tradeId, offeredItems: [] });
      expect(client3.send).toHaveBeenCalledWith('trade_error', { message: 'You are not part of this trade.' });

      // Player3 tries to accept trade
      await client3.send('trade_accept', { tradeId: trade.tradeId });
      expect(client3.send).toHaveBeenCalledWith('trade_error', { message: 'You are not part of this trade.' });

      // Player3 tries to cancel trade
      await client3.send('trade_cancel', { tradeId: trade.tradeId });
      expect(client3.send).toHaveBeenCalledWith('trade_error', { message: 'You are not part of this trade.' });
    });
  });

  describe('Item Management', () => {
    let client: Client;

    beforeEach(async () => {
      client = await colyseus.connectTo(room, { name: 'TestPlayer' });
    });

    it('should add starter items to a new player', async () => {
      const player = room.state.players.get(client.sessionId);
      expect(player?.inventory.length).toBe(2);
      expect(player?.inventory[0].name).toBe('Starter Sword');
      expect(player?.inventory[1].name).toBe('Starter Shield');
    });

    it('should drop player inventory as loot drops on leave', async () => {
      // Add a player and some items to their inventory

      const player = room.state.players.get(client.sessionId);

      // Manually add an item to the player's inventory for testing drop
      const testItemDef = ItemManager.getInstance().getItemDefinition('sword_of_heroes');
      let testItem: InventoryItem | undefined;
      if (testItemDef) {
        testItem = new InventoryItem(testItemDef, 1);
      }
      if (testItem) {
        player?.inventory.push(testItem);
      }

      const initialLootDropsCount = room.state.lootDrops.size;
      await room.simulateLeave(client); // Simulate disconnection without reconnection

      expect(room.state.lootDrops.size).toBeGreaterThan(initialLootDropsCount);
      const droppedLoot = Array.from(room.state.lootDrops.values());
      expect(droppedLoot[0].items.length).toBeGreaterThan(0);
      const droppedItemNames = droppedLoot[0].items.map((item: any) => item.name);
      expect(droppedItemNames).toContain('Starter Sword');
      expect(droppedItemNames).toContain('Starter Shield');
      expect(droppedItemNames).toContain('sword_of_heroes');
    });

    it('should create a loot drop with correct properties', () => {
      const initialLootDropsCount = room.state.lootDrops.size;
      const testItems = [
        // Use ItemManager to get item definition for loot
        (() => {
          const lootItemDef = ItemManager.getInstance().getItemDefinition('health_potion');
          if (lootItemDef) {
            return new InventoryItem(lootItemDef, 10);
          }
          return undefined;
        })(),
      ];
      const testPosition = { x: 50, y: 50 };

      // Simulate the action that would create a loot drop (e.g., a monster dying)
      // Since createLootDrop is a protected method, we'll test its indirect effect.
      // For now, we'll directly call it for testing purposes, but ideally this would be part of a larger action.
      room.gameRoom['createLootDrop'](testItems, testPosition.x, testPosition.y);

      expect(room.state.lootDrops.size).toBe(initialLootDropsCount + 1);
      const newLootDrop = Array.from(room.state.lootDrops.values()).find(
        (drop: any) => drop.x === testPosition.x && drop.y === testPosition.y
      );
      expect(newLootDrop).toBeDefined();
      expect(newLootDrop?.items.length).toBe(testItems.length);
      expect(newLootDrop?.items[0].name).toBe(testItems[0].name);
      // The createdAt and lootDropId are generated within the method, so we can't directly assert their values,
      // but we can assert they are defined.
      expect(newLootDrop?.timestamp).toBeDefined();
      expect(newLootDrop?.id).toBeDefined();
    });
  });
});
