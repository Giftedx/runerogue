/**
 * Alternative schema definitions using defineTypes for better compatibility
 * with Colyseus v0.16.x and newer schema versions.
 */

import { ArraySchema, Schema, defineTypes } from '@colyseus/schema';
import '../utils/early-metadata-init';

// Re-export for consistency
export { ArraySchema };

/**
 * Test if defineTypes approach works better for ArraySchema registration
 */
export class TestPlayer extends Schema {
  public id: string = '';
  public username: string = '';
  public x: number = 0;
  public y: number = 0;
  public health: number = 100;
  public inventory = new ArraySchema<string>();
  public activeEffects = new ArraySchema<string>();

  constructor() {
    super();
  }
}

// Use defineTypes instead of decorators
defineTypes(TestPlayer, {
  id: 'string',
  username: 'string',
  x: 'number',
  y: 'number',
  health: 'number',
  inventory: ['string'],
  activeEffects: ['string'],
});

/**
 * Test inventory item with defineTypes
 */
export class TestInventoryItem extends Schema {
  public itemId: string = '';
  public quantity: number = 1;
  public name: string = '';

  constructor() {
    super();
  }
}

defineTypes(TestInventoryItem, {
  itemId: 'string',
  quantity: 'number',
  name: 'string',
});

/**
 * Test player with inventory items using defineTypes
 */
export class TestPlayerWithItems extends Schema {
  public id: string = '';
  public username: string = '';
  public inventory = new ArraySchema<TestInventoryItem>();

  constructor() {
    super();
  }
}

defineTypes(TestPlayerWithItems, {
  id: 'string',
  username: 'string',
  inventory: [TestInventoryItem],
});

console.log('✅ Alternative schemas with defineTypes loaded');
