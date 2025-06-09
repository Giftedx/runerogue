import { MapSchema, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Test the MapSchema functionality
describe('MapSchema Debug', () => {
  test('should test MapSchema creation and methods', () => {
    console.log('Creating MapSchema...');
    const map = new MapSchema<string>();

    console.log('MapSchema created:', typeof map);
    console.log('MapSchema methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(map)));
    console.log('Has set method:', typeof map.set);

    if (typeof map.set === 'function') {
      map.set('test', 'value');
      console.log('Set worked, size:', map.size);
      console.log('Get test:', map.get('test'));
    } else {
      console.log('set method not available');
    }
  });

  test('should test MapSchema in schema class', () => {
    class TestState extends Schema {
      @type({ map: 'string' })
      public items = new MapSchema<string>();
    }

    const state = new TestState();
    console.log('Schema state created');
    console.log('Items type:', typeof state.items);
    console.log('Items constructor:', state.items.constructor.name);
    console.log('Items methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(state.items)));
    console.log('Has set method:', typeof state.items.set);

    if (typeof state.items.set === 'function') {
      state.items.set('test', 'value');
      console.log('Set worked, size:', state.items.size);
    } else {
      console.log('set method not available on schema items');
    }
  });
});
