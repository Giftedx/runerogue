import 'reflect-metadata';
import { InventoryItem, Player } from '../../game/EntitySchemas';
import { ItemDefinition } from '../../game/ItemManager';

describe('Schema Metadata Debug', () => {
  it('should create InventoryItem with proper metadata', () => {
    const itemDef: ItemDefinition = {
      itemId: 'test_item',
      name: 'Test Item',
      description: 'A test item',
      attack: 1,
      defense: 0,
      isStackable: false,
    };

    const item = new InventoryItem(itemDef, 1);

    console.log('InventoryItem metadata check:', {
      constructor: item.constructor.name,
      hasMetadata: item['Symbol(Symbol.metadata)'] !== undefined,
      hasColyseus$: item['$'] !== undefined,
      itemId: item.itemId,
      name: item.name,
      prototype: Object.getOwnPropertyNames(Object.getPrototypeOf(item)),
    });

    expect(item.itemId).toBe('test_item');
    expect(item.name).toBe('Test Item');
  });

  it('should create Player with proper metadata', () => {
    const player = new Player();
    player.id = 'test_player';
    player.username = 'TestUser';

    console.log('Player metadata check:', {
      constructor: player.constructor.name,
      hasMetadata: player['Symbol(Symbol.metadata)'] !== undefined,
      hasColyseus$: player['$'] !== undefined,
      id: player.id,
      username: player.username,
      inventoryType: player.inventory.constructor.name,
      inventoryHasMetadata: player.inventory['Symbol(Symbol.metadata)'] !== undefined,
    });

    expect(player.id).toBe('test_player');
    expect(player.username).toBe('TestUser');
  });

  it('should add items to player inventory without duplication', () => {
    const player = new Player();
    const itemDef: ItemDefinition = {
      itemId: 'sword',
      name: 'Sword',
      description: 'A sword',
      attack: 10,
      defense: 0,
      isStackable: false,
    };

    console.log('Initial inventory length:', player.inventory.length);

    const item1 = new InventoryItem(itemDef, 1);
    player.inventory.push(item1);
    console.log('After adding item1:', player.inventory.length);

    const item2 = new InventoryItem(itemDef, 1);
    player.inventory.push(item2);
    console.log('After adding item2:', player.inventory.length);

    expect(player.inventory.length).toBe(2);
  });
});
