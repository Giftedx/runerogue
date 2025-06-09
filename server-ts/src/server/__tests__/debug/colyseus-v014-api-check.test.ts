/**
 * Test to understand Colyseus v0.14.x Schema API methods
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';

class TestPlayer extends Schema {
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
}

class TestItem extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
}

describe('Colyseus v0.14.x API Check', () => {
  it('should check ArraySchema methods available', () => {
    const items = new ArraySchema<TestItem>();

    console.log('ArraySchema methods:', Object.getOwnPropertyNames(ArraySchema.prototype));
    console.log('ArraySchema instance methods:', Object.getOwnPropertyNames(items));

    // Check if these methods exist
    console.log('has push?', typeof items.push === 'function');
    console.log('has pop?', typeof items.pop === 'function');
    console.log('has length?', typeof items.length === 'number');
    console.log('has splice?', typeof items.splice === 'function');
    console.log('has clear?', typeof (items as any).clear === 'function');
    console.log('has filter?', typeof items.filter === 'function');

    // Test adding items
    const item1 = new TestItem();
    item1.id = 'test1';
    item1.name = 'Test Item 1';

    items.push(item1);
    console.log('After push, length:', items.length);

    // Alternative to clear() - use splice or length
    if (typeof (items as any).clear === 'function') {
      (items as any).clear();
    } else {
      // Clear by setting length to 0
      items.splice(0, items.length);
    }
    console.log('After clear alternative, length:', items.length);
  });

  it('should check MapSchema methods available', () => {
    const players = new MapSchema<TestPlayer>();

    console.log('MapSchema methods:', Object.getOwnPropertyNames(MapSchema.prototype));
    console.log('MapSchema instance methods:', Object.getOwnPropertyNames(players));

    // Check if these methods exist
    console.log('has set?', typeof (players as any).set === 'function');
    console.log('has get?', typeof (players as any).get === 'function');
    console.log('has delete?', typeof (players as any).delete === 'function');
    console.log('has has?', typeof (players as any).has === 'function');

    // Test adding items using bracket notation
    const player1 = new TestPlayer();
    player1.name = 'Test Player';
    player1.x = 100;
    player1.y = 200;

    // Use bracket notation instead of .set()
    players['player1'] = player1;
    console.log('Added player with bracket notation');

    // Access using bracket notation
    console.log('Retrieved player:', players['player1']?.name);

    // Check if we can iterate
    console.log('Can iterate with for...in?');
    for (const key in players) {
      console.log('Player key:', key, 'name:', players[key]?.name);
    }
  });
});
