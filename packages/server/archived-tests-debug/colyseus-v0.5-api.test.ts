import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';

// Test schema classes for Colyseus v0.5.x API
class TestItem extends Schema {
  @type('string') name: string = '';
  @type('number') value: number = 0;
}

class TestPlayer extends Schema {
  @type('string') id: string = '';
  @type([TestItem]) items = new ArraySchema<TestItem>();
  @type({ map: TestItem }) itemMap = new MapSchema<TestItem>();
}

describe('Colyseus v0.5.x API Investigation', () => {
  test('should show available methods for ArraySchema in v0.5.x', () => {
    const arraySchema = new ArraySchema<TestItem>();
    const arrayMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(arraySchema)).filter(
      name => typeof arraySchema[name] === 'function' && name !== 'constructor'
    );

    console.log('ArraySchema methods:', arrayMethods);

    // Test basic functionality
    const item = new TestItem();
    item.name = 'test';
    item.value = 42;

    arraySchema.push(item);
    console.log('Array length after push:', arraySchema.length);

    // Test if clear method exists
    if (typeof arraySchema['clear'] === 'function') {
      console.log('ArraySchema has clear method');
    } else {
      console.log('ArraySchema does NOT have clear method');
      // Find alternative methods
      if (typeof arraySchema['splice'] === 'function') {
        console.log('ArraySchema has splice method - can use splice(0) to clear');
      }
      if (typeof arraySchema['length'] !== 'undefined') {
        console.log('ArraySchema has length property - can set length = 0 to clear');
      }
    }
  });

  test('should show available methods for MapSchema in v0.5.x', () => {
    const mapSchema = new MapSchema<TestItem>();
    const mapMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(mapSchema)).filter(
      name => typeof mapSchema[name] === 'function' && name !== 'constructor'
    );

    console.log('MapSchema methods:', mapMethods);

    // Test basic functionality
    const item = new TestItem();
    item.name = 'test';
    item.value = 42;

    // Test if set method exists
    if (typeof mapSchema['set'] === 'function') {
      console.log('MapSchema has set method');
      mapSchema.set('testKey', item);
    } else {
      console.log('MapSchema does NOT have set method');
      // Find alternative methods
      if (mapSchema['testKey'] !== undefined || true) {
        console.log('MapSchema supports direct property assignment');
        mapSchema['testKey'] = item;
      }
    }

    console.log('Map keys:', Object.keys(mapSchema));
  });

  test('should test basic schema encoding with v0.5.x', () => {
    const player = new TestPlayer();
    player.id = 'test123';

    const item1 = new TestItem();
    item1.name = 'sword';
    item1.value = 100;

    const item2 = new TestItem();
    item2.name = 'shield';
    item2.value = 50;

    // Add to array
    player.items.push(item1);
    player.items.push(item2);

    // Add to map
    player.itemMap['weapon'] = item1;
    player.itemMap['armor'] = item2;

    console.log('Player items length:', player.items.length);
    console.log('Player item map keys:', Object.keys(player.itemMap));

    // Test encoding
    try {
      const encoded = player.encode();
      console.log('Encoding successful, bytes:', encoded.length);
    } catch (error) {
      console.log('Encoding failed:', error.message);
    }
  });
});
