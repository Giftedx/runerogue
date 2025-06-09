import { GameState, InventoryItem, Player } from '../../game/EntitySchemas';

// Mock ItemManager to return basic definitions
const mockItemManager = {
  getItemDefinition: jest.fn((itemId: string) => {
    if (itemId === 'test_item') {
      return Promise.resolve({
        id: 'test_item_id',
        itemId: 'test_item',
        name: 'Test Item',
        description: 'A test item.',
        attack: 1,
        defense: 0,
        isStackable: false,
        baseValue: 1,
        isTradeable: true,
      });
    }
    return Promise.resolve(undefined);
  }),
};

describe('Minimal Schema Test', () => {
  test('should create a Player with basic properties', () => {
    const player = new Player();
    player.id = 'test-player';
    player.name = 'Test Player';
    player.x = 0;
    player.y = 0;

    expect(player.id).toBe('test-player');
    expect(player.name).toBe('Test Player');
    expect(player.x).toBe(0);
    expect(player.y).toBe(0);
  });

  test('should create an InventoryItem with basic properties', async () => {
    const itemDef = await mockItemManager.getItemDefinition('test_item');
    const item = new InventoryItem(itemDef, 1);

    expect(item.itemId).toBe('test_item');
    expect(item.name).toBe('Test Item');
    expect(item.quantity).toBe(1);
  });

  test('should create a GameState and add a player', () => {
    const state = new GameState();
    const player = new Player();
    player.id = 'test-player';
    player.name = 'Test Player';
    state.players['test-player'] = player;

    expect(state.players['test-player']).toBe(player);
    expect(state.players.size).toBe(1);
  });

  test('should add an inventory item to a player', async () => {
    const player = new Player();
    const itemDef = await mockItemManager.getItemDefinition('test_item');
    const item = new InventoryItem(itemDef, 1);

    player.inventory.push(item);

    expect(player.inventory.length).toBe(1);
    expect(player.inventory.at(0)?.itemId).toBe('test_item');
  });
});
