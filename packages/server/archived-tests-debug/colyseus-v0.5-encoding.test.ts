/**
 * Test the proper encoding approach for Colyseus v0.5.x
 */

import { ArraySchema, encode, MapSchema, Schema, type } from '@colyseus/schema';

class TestItem extends Schema {
  @type('string') name: string = '';
  @type('number') value: number = 0;
}

class TestPlayer extends Schema {
  @type('string') id: string = '';
  @type([TestItem]) items = new ArraySchema<TestItem>();
  @type({ map: TestItem }) itemMap = new MapSchema<TestItem>();
}

describe('Colyseus v0.5.x Encoding', () => {
  test('should encode schema using the encode function', () => {
    const player = new TestPlayer();
    player.id = 'test123';

    const item1 = new TestItem();
    item1.name = 'sword';
    item1.value = 100;

    player.items.push(item1);
    player.itemMap.set('weapon', item1);

    console.log('Testing encode function type:', typeof encode);

    // Test if encode function works
    try {
      const encoded = encode(player);
      console.log('Encoded successfully with encode function:', encoded.length, 'bytes');
    } catch (error) {
      console.log('encode function failed:', error.message);
    }

    // Test the old Encoder approach to see the exact error
    try {
      const { Encoder } = require('@colyseus/schema');
      console.log('Encoder type:', typeof Encoder);
      console.log('Encoder constructor:', Encoder.constructor);

      if (typeof Encoder === 'function') {
        const encoder = new Encoder();
        console.log('Encoder created successfully');
      } else {
        console.log('Encoder is not a constructor function');
      }
    } catch (error) {
      console.log('Encoder error:', error.message);
    }
  });

  test('should test ArraySchema.clear() and MapSchema.set() work correctly', () => {
    const player = new TestPlayer();
    player.id = 'test123';

    // Test ArraySchema
    const item1 = new TestItem();
    item1.name = 'sword';
    item1.value = 100;

    const item2 = new TestItem();
    item2.name = 'shield';
    item2.value = 50;

    player.items.push(item1);
    player.items.push(item2);

    console.log('Items before clear:', player.items.length);

    // Test clear method
    player.items.clear();
    console.log('Items after clear:', player.items.length);

    // Test MapSchema
    player.itemMap.set('weapon', item1);
    player.itemMap.set('armor', item2);

    console.log(
      'Map keys before clear:',
      Object.keys(player.itemMap).filter(k => !k.startsWith('$'))
    );

    player.itemMap.clear();
    console.log(
      'Map keys after clear:',
      Object.keys(player.itemMap).filter(k => !k.startsWith('$'))
    );

    expect(player.items.length).toBe(0);
  });
});
