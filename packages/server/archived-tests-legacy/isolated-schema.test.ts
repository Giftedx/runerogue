/**
 * Completely isolated Colyseus schema test - no external dependencies
 * This test creates fresh schema classes to avoid any registration conflicts
 */

// Import only the essentials for testing
import { ArraySchema, Encoder, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// Polyfill Symbol.metadata if needed
if (typeof Symbol.metadata === 'undefined') {
  (Symbol as any).metadata = Symbol('metadata');
}

describe('Pure Isolated Schema Test', () => {
  // Define schemas inside the test to avoid any global conflicts
  it('should create and serialize a simple schema without errors', () => {
    class TestItem extends Schema {
      @type('string') name: string = '';
      @type('number') value: number = 0;
    }

    class TestInventory extends Schema {
      @type([TestItem]) items: ArraySchema<TestItem> = new ArraySchema<TestItem>();
    }

    class TestPlayer extends Schema {
      @type('string') playerName: string = '';
      @type('number') health: number = 100;
      @type(TestInventory) inventory: TestInventory = new TestInventory();
    }

    expect(() => {
      // Create instances
      const player = new TestPlayer();
      player.playerName = 'TestUser';
      player.health = 100;

      const item = new TestItem();
      item.name = 'Test Sword';
      item.value = 50;

      player.inventory.items.push(item);

      console.log('✅ Schema instances created successfully');
      expect(player.playerName).toBe('TestUser');
      expect(player.inventory.items.length).toBe(1);
      expect(player.inventory.items[0].name).toBe('Test Sword');
    }).not.toThrow();
  });

  it('should serialize the schema using Encoder', () => {
    class SimpleSchema extends Schema {
      @type('string') message: string = 'hello';
      @type('number') count: number = 42;
    }

    const instance = new SimpleSchema();
    instance.message = 'test message';
    instance.count = 123;
    expect(() => {
      console.log('🔧 Creating Encoder with schema instance...');
      const encoder = new Encoder(instance);

      console.log('🔧 Encoding schema...');
      const encoded = encoder.encode();

      console.log('✅ Encoding successful, bytes:', encoded.length);
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });

  it('should handle complex nested schemas', () => {
    class NestedItem extends Schema {
      @type('string') itemId: string = '';
      @type('number') quantity: number = 1;
    }

    class NestedContainer extends Schema {
      @type([NestedItem]) contents: ArraySchema<NestedItem> = new ArraySchema<NestedItem>();
      @type('string') containerType: string = 'chest';
    }

    class NestedWorld extends Schema {
      @type([NestedContainer]) containers: ArraySchema<NestedContainer> =
        new ArraySchema<NestedContainer>();
      @type('number') worldId: number = 1;
    }

    expect(() => {
      const world = new NestedWorld();
      world.worldId = 42;

      const container = new NestedContainer();
      container.containerType = 'treasure_chest';

      const item1 = new NestedItem();
      item1.itemId = 'gold_coin';
      item1.quantity = 100;

      const item2 = new NestedItem();
      item2.itemId = 'silver_sword';
      item2.quantity = 1;

      container.contents.push(item1);
      container.contents.push(item2);
      world.containers.push(container);

      console.log('✅ Complex nested schema created');
      expect(world.containers.length).toBe(1);
      expect(world.containers[0].contents.length).toBe(2);

      // Try encoding the complex structure
      const encoder = new Encoder(world);
      const encoded = encoder.encode();
      console.log('✅ Complex schema encoded successfully:', encoded.length, 'bytes');
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });
});
