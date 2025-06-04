// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for project goals and persistent AI context.
import { Room } from '@colyseus/core';
import { GameRoom } from '../game/GameRoom';
import economyIntegration from '../economy-integration';
import { Player, InventoryItem, LootDrop } from '../game/EntitySchemas';
import { LootManager } from '../game/LootManager';

jest.mock('../economy-integration');
const mockedEconomy = economyIntegration as jest.Mocked<typeof economyIntegration>;

describe('Loot/Inventory Sync Integration', () => {
  let gameRoom: GameRoom;
  let player: Player;
  let lootDrop: LootDrop;

  beforeEach(() => {
    gameRoom = new GameRoom();
    player = new Player();
    player.id = 'test-player';
    player.name = 'Test Player';
    player.inventory = [];
    gameRoom['state'] = { players: new Map([[player.id, player]]), lootDrops: new Map() } as any;
    mockedEconomy.addItemToInventory.mockClear();
    mockedEconomy.removeItemFromInventory.mockClear();
    mockedEconomy.getOrCreatePlayerProfile.mockResolvedValue({ id: 123 });
  });

  it('should sync collected loot to the economy API', async () => {
    lootDrop = new LootDrop();
    lootDrop.id = 'loot-1';
    lootDrop.items = [new InventoryItem({ itemId: 'sword', name: 'Sword' }, 1)];
    gameRoom['state'].lootDrops.set(lootDrop.id, lootDrop);

    // Simulate loot collection
    const collected = LootManager.collectLoot(gameRoom['state'], player, lootDrop.id);
    expect(collected).toBe(true);

    // Simulate economy sync
    await gameRoom['onMessage']?.('collectLoot', { lootId: lootDrop.id }, { sessionId: player.id });
    expect(mockedEconomy.addItemToInventory).toHaveBeenCalled();
  });

  it('should sync dropped inventory to the economy API on disconnect', async () => {
    player.inventory = [new InventoryItem({ itemId: 'shield', name: 'Shield' }, 1)];
    // Simulate disconnect
    await gameRoom.onLeave({ sessionId: player.id } as any, true);
    expect(mockedEconomy.removeItemFromInventory).toHaveBeenCalled();
  });

  it('should log errors but not throw when economy API fails', async () => {
    mockedEconomy.addItemToInventory.mockRejectedValueOnce(new Error('API Down'));
    lootDrop = new LootDrop();
    lootDrop.id = 'loot-2';
    lootDrop.items = [new InventoryItem({ itemId: 'axe', name: 'Axe' }, 1)];
    gameRoom['state'].lootDrops.set(lootDrop.id, lootDrop);
    const collected = LootManager.collectLoot(gameRoom['state'], player, lootDrop.id);
    expect(collected).toBe(true);
    // Should not throw
    await expect(gameRoom['onMessage']?.('collectLoot', { lootId: lootDrop.id }, { sessionId: player.id })).resolves.not.toThrow();
  });
});
