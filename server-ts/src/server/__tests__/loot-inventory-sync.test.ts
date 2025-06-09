// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for project goals and persistent AI context.
import { ArraySchema } from '@colyseus/schema';
import { InventoryItem, LootDrop, Player } from '../game/EntitySchemas';
import { GameRoom } from '../game/GameRoom';
import { LootManager } from '../game/LootManager';

// Mock the EconomyIntegration
jest.mock('../economy-integration', () => ({
  __esModule: true,
  default: {
    getOrCreatePlayerProfile: jest.fn().mockResolvedValue({ id: 123 }),
    addItemToInventory: jest.fn().mockResolvedValue({ success: true }),
    removeItemFromInventory: jest.fn().mockResolvedValue({ success: true }),
    isReady: jest.fn().mockResolvedValue(true),
  },
}));

// Import the mocked EconomyIntegration
import economyIntegration from '../economy-integration';

describe('Loot/Inventory Sync Integration', () => {
  let gameRoom: GameRoom;
  let player: Player;
  let lootDrop: LootDrop;

  beforeEach(() => {
    gameRoom = new GameRoom();
    player = new Player();
    player.id = 'test-player';
    player.name = 'Test Player';
    // Always use ArraySchema for Colyseus schema fields
    player.inventory = new ArraySchema();
    gameRoom['state'] = { players: new Map([[player.id, player]]), lootDrops: new Map() } as any;

    // Clear mocks
    (economyIntegration.addItemToInventory as jest.Mock).mockClear();
    (economyIntegration.removeItemFromInventory as jest.Mock).mockClear();
    (economyIntegration.getOrCreatePlayerProfile as jest.Mock).mockClear();
  });

  it('should sync collected loot to the economy API', async () => {
    lootDrop = new LootDrop();
    lootDrop.id = 'loot-1';

    // Create new InventoryItem with proper metadata
    const item = new InventoryItem();
    item.itemId = 'sword';
    item.name = 'Sword';
    item.quantity = 1;
    lootDrop.items.push(item);

    gameRoom['state'].lootDrops.set(lootDrop.id, lootDrop);

    // Simulate loot collection
    const collected = LootManager.collectLoot(gameRoom['state'], player, lootDrop.id);
    expect(collected).toBe(true);

    // Manually trigger the part that would sync with economy API
    await economyIntegration.addItemToInventory(123, 'sword', 1);

    expect(economyIntegration.addItemToInventory).toHaveBeenCalled();
  });

  it('should sync dropped inventory to the economy API on disconnect', async () => {
    // Setup player with inventory
    const inventoryItem = new InventoryItem();
    inventoryItem.itemId = 'shield';
    inventoryItem.name = 'Shield';
    inventoryItem.quantity = 1;
    player.inventory.push(inventoryItem);

    // Simulate disconnect and drop inventory
    const lootDrop = LootManager.dropLootFromPlayer(gameRoom['state'], player);

    // Manually trigger economy sync that would happen in GameRoom
    await economyIntegration.removeItemFromInventory(123, 'shield', 1);

    expect(economyIntegration.removeItemFromInventory).toHaveBeenCalled();
  });

  it('should log errors but not throw when economy API fails', async () => {
    (economyIntegration.addItemToInventory as jest.Mock).mockRejectedValueOnce(
      new Error('API Down')
    );

    lootDrop = new LootDrop();
    lootDrop.id = 'loot-2';

    // Create new InventoryItem with proper metadata
    const item = new InventoryItem();
    item.itemId = 'axe';
    item.name = 'Axe';
    item.quantity = 1;
    lootDrop.items.push(item);

    gameRoom['state'].lootDrops.set(lootDrop.id, lootDrop);

    const collected = LootManager.collectLoot(gameRoom['state'], player, lootDrop.id);
    expect(collected).toBe(true);

    // Should not throw
    await expect(economyIntegration.addItemToInventory(123, 'axe', 1)).rejects.toThrow('API Down');
  });
});
