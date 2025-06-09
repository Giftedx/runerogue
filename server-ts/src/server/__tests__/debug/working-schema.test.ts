import { ArraySchema, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Test to see if we can create a minimal working schema
export class TestInventoryItem extends Schema {
  @type('string')
  public itemId: string = '';

  @type('number')
  public quantity: number = 1;

  @type('string')
  public name: string = '';

  constructor(itemId?: string, quantity?: number, name?: string) {
    super();
    if (itemId) this.itemId = itemId;
    if (quantity) this.quantity = quantity;
    if (name) this.name = name;
  }
}

export class TestPlayer extends Schema {
  @type('string')
  public id: string = '';

  @type('string')
  public username: string = '';

  @type([TestInventoryItem])
  public inventory = new ArraySchema<TestInventoryItem>();

  constructor() {
    super();
  }
}

describe('Working Schema Test', () => {
  it('should create schema with proper metadata', () => {
    const item = new TestInventoryItem('test', 1, 'Test Item');

    console.log('TestInventoryItem metadata check:', {
      constructor: item.constructor.name,
      hasMetadata: item['Symbol(Symbol.metadata)'] !== undefined,
      hasColyseus$: item['$'] !== undefined,
      itemId: item.itemId,
      toString: item.toString(),
    });

    const player = new TestPlayer();
    player.id = 'test';
    player.username = 'Test';
    player.inventory.push(item);

    console.log('TestPlayer metadata check:', {
      constructor: player.constructor.name,
      hasMetadata: player['Symbol(Symbol.metadata)'] !== undefined,
      hasColyseus$: player['$'] !== undefined,
      inventoryLength: player.inventory.length,
    });

    expect(item.itemId).toBe('test');
    expect(player.inventory.length).toBe(1);
  });
});
