/**
 * Test to verify ArraySchema registration warnings are resolved
 */

import { ArraySchema, Schema, type } from '@colyseus/schema';
import '../../utils/safe-metadata-fix';

class TestItem extends Schema {
  @type('string') name!: string;
}

class TestPlayer extends Schema {
  @type('string') username!: string;
  @type([TestItem]) inventory = new ArraySchema<TestItem>();
}

describe('ArraySchema Registration Verification', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('should not produce ArraySchema registration warnings', () => {
    // Create a schema that uses ArraySchema
    const player = new TestPlayer();
    player.username = 'test-user';

    // Add an item to the ArraySchema
    const item = new TestItem();
    item.name = 'test-item';
    player.inventory.push(item);

    // Check that no ArraySchema registration warnings were produced
    const arraySchemaWarnings = consoleSpy.mock.calls.filter(
      call => call[0] && call[0].includes('ArraySchema') && call[0].includes('not registered')
    );

    expect(arraySchemaWarnings).toHaveLength(0);
    expect(player.inventory.length).toBe(1);
    expect(player.inventory[0].name).toBe('test-item');
  });

  test('should show registration success messages', () => {
    const consoleLogSpy = jest.spyOn(console, 'log');

    // Look for our registration success messages
    const registrationMessages = consoleLogSpy.mock.calls.filter(
      call => call[0] && call[0].includes('ArraySchema') && call[0].includes('registered')
    );

    // We should have seen at least one registration message
    expect(registrationMessages.length).toBeGreaterThan(0);

    consoleLogSpy.mockRestore();
  });
});
