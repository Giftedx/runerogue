import { ArraySchema, Schema, type } from '@colyseus/schema';

/**
 * Test minimal schema to debug metadata issues
 */
export class MinimalInventoryItem extends Schema {
  @type('string')
  public itemId: string = '';

  @type('number')
  public quantity: number = 1;

  constructor(itemId?: string, quantity: number = 1) {
    super();
    if (itemId) {
      this.itemId = itemId;
    }
    this.quantity = quantity;
  }
}

/**
 * Test minimal player schema
 */
export class MinimalPlayer extends Schema {
  @type('string')
  public id: string = '';

  @type('string')
  public username: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type([MinimalInventoryItem])
  public inventory = new ArraySchema<MinimalInventoryItem>();

  constructor() {
    super();
  }
}

/**
 * Test game state
 */
export class TestGameState extends Schema {
  @type({ map: MinimalPlayer })
  public players = new Map<string, MinimalPlayer>();

  constructor() {
    super();
  }
}
