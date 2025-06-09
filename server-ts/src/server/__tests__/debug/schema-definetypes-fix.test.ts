import { ArraySchema, defineTypes, Schema } from '@colyseus/schema';
import 'reflect-metadata';

// Define schema classes using defineTypes instead of decorators
class TestInventoryItem extends Schema {
  public itemId: string = '';
  public quantity: number = 1;
  public name: string = '';

  constructor(itemId = '', quantity = 1, name = '') {
    super();
    this.itemId = itemId;
    this.quantity = quantity;
    this.name = name;
  }
}

class TestPlayer extends Schema {
  public id: string = '';
  public username: string = '';
  public inventory: ArraySchema<TestInventoryItem> = new ArraySchema();

  constructor(id = '', username = '') {
    super();
    this.id = id;
    this.username = username;
  }
}

// Explicitly define types using defineTypes
defineTypes(TestInventoryItem, {
  itemId: 'string',
  quantity: 'number',
  name: 'string',
});

defineTypes(TestPlayer, {
  id: 'string',
  username: 'string',
  inventory: [TestInventoryItem],
});

describe('Schema defineTypes Fix', () => {
  it('should create schema objects with proper metadata using defineTypes', () => {
    const item = new TestInventoryItem('test_item', 1, 'Test Item');
    const player = new TestPlayer('test_player', 'TestUser');

    // Check if metadata is properly set
    console.log('TestInventoryItem metadata check:', {
      constructor: item.constructor.name,
      hasMetadata: item['Symbol(Symbol.metadata)'] !== undefined,
      hasColyseus$: item['$colyseus'] !== undefined,
      itemId: item.itemId,
      name: item.name,
    });

    console.log('TestPlayer metadata check:', {
      constructor: player.constructor.name,
      hasMetadata: player['Symbol(Symbol.metadata)'] !== undefined,
      hasColyseus$: player['$colyseus'] !== undefined,
      id: player.id,
      username: player.username,
    });

    // Add item to player inventory
    player.inventory.push(item);

    console.log('Inventory after adding item:', {
      length: player.inventory.length,
      firstItem: player.inventory[0],
    });

    // Test serialization
    expect(() => {
      const encoder = new (require('@colyseus/schema').Encoder)();
      encoder.encode(player, {}, false);
    }).not.toThrow();

    expect(player.inventory.length).toBe(1);
    expect(player.inventory[0].itemId).toBe('test_item');
  });
});
