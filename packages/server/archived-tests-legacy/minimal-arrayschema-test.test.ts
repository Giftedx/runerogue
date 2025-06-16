/**
 * Minimal test to reproduce and fix ArraySchema registration warnings
 */

// Import ultimate schema fix first
import '../../utils/ultimate-schema-fix';

import { ArraySchema, Schema, type } from '@colyseus/schema';

// Simple item schema for testing
export class TestItem extends Schema {
  @type('string') name = '';
  @type('number') value = 0;
}

// Simple test schema with ArraySchema
export class TestSchema extends Schema {
  @type([TestItem]) items = new ArraySchema<TestItem>();
}

describe('ArraySchema Registration Fix', () => {
  beforeEach(() => {
    // Clear any existing test warnings
    jest.clearAllMocks();
  });

  test('should create TestSchema without ArraySchema registration warnings', () => {
    // Capture console warnings
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      // Create an instance of our test schema
      const testSchema = new TestSchema();

      // Add a test item
      const item = new TestItem();
      item.name = 'Test Item';
      item.value = 100;
      testSchema.items.push(item);

      // Try to encode the schema (this should trigger the warning if present)
      const encoded = testSchema.encode();

      // Check that we didn't get any ArraySchema registration warnings
      const warningCalls = consoleSpy.mock.calls.filter(call =>
        call.some(
          arg =>
            typeof arg === 'string' && arg.includes('ArraySchema') && arg.includes('not registered')
        )
      );

      expect(warningCalls).toHaveLength(0);
      expect(encoded).toBeDefined();
      expect(testSchema.items.length).toBe(1);
      expect(testSchema.items[0].name).toBe('Test Item');
    } finally {
      consoleSpy.mockRestore();
    }
  });

  test('should verify Symbol.metadata is available', () => {
    // Check that our polyfill worked
    expect(typeof (Symbol as unknown as { metadata?: symbol }).metadata).toBe('symbol');
  });

  test('should create and manipulate ArraySchema without errors', () => {
    const testSchema = new TestSchema();

    // Add multiple items
    for (let i = 0; i < 5; i++) {
      const item = new TestItem();
      item.name = `Item ${i}`;
      item.value = i * 10;
      testSchema.items.push(item);
    }

    expect(testSchema.items.length).toBe(5);
    expect(testSchema.items[0].name).toBe('Item 0');
    expect(testSchema.items[4].value).toBe(40);

    // Test removal
    testSchema.items.splice(2, 1);
    expect(testSchema.items.length).toBe(4);
  });
});
