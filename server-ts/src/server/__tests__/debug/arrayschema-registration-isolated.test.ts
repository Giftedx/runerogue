/**
 * Isolated test to reproduce and fix the ArraySchema registration issue
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';

// Simple test schemas
class SimpleItem extends Schema {
  @type('string') name: string = '';
  @type('number') value: number = 0;
}

class SimplePlayer extends Schema {
  @type('string') username: string = '';
  @type([SimpleItem]) inventory = new ArraySchema<SimpleItem>();
  @type({ SimpleItem }) items = new MapSchema<SimpleItem>();
}

class SimpleRoom extends Schema {
  @type({ SimplePlayer }) players = new MapSchema<SimplePlayer>();
  @type([SimplePlayer]) playerList = new ArraySchema<SimplePlayer>();
}

describe('ArraySchema Registration Isolation Test', () => {
  let mockConsoleWarn: jest.SpyInstance;

  beforeEach(() => {
    mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    mockConsoleWarn.mockRestore();
  });

  test('should create ArraySchema instances without warnings', () => {
    const room = new SimpleRoom();
    const player = new SimplePlayer();
    const item = new SimpleItem();

    item.name = 'Test Item';
    item.value = 100;

    player.username = 'TestPlayer';
    player.inventory.push(item);
    player.items.set('item1', item);

    room.players.set('player1', player);
    room.playerList.push(player);

    expect(room.players.size).toBe(1);
    expect(room.playerList.length).toBe(1);
    expect(player.inventory.length).toBe(1);
    expect(player.items.size).toBe(1);
  });

  test('should serialize without ArraySchema warnings - minimal case', async () => {
    const { Reflection } = await import('@colyseus/schema');

    const room = new SimpleRoom();
    const player = new SimplePlayer();

    player.username = 'TestPlayer';
    room.players.set('player1', player);

    try {
      // Try to serialize the room - this should trigger the warning
      const reflection = new Reflection();
      const encoded = reflection.encode(room);

      // Check if any ArraySchema warnings were logged
      const arraySchemaWarnings = mockConsoleWarn.mock.calls.filter(
        call =>
          call[0]?.includes && call[0].includes('ArraySchema') && call[0].includes('not registered')
      );

      console.log(`Serialization successful. Encoded ${encoded.length} bytes`);
      console.log(`ArraySchema warnings: ${arraySchemaWarnings.length}`);

      if (arraySchemaWarnings.length > 0) {
        console.log('ArraySchema warning details:', arraySchemaWarnings[0]);
      }
    } catch (error) {
      console.error('Serialization failed:', error);
      throw error;
    }
  });

  test('should test manual ArraySchema registration', () => {
    const { registerType } = require('@colyseus/schema');

    // Try to manually register ArraySchema
    try {
      registerType('ArraySchema', ArraySchema);
      console.log('✅ ArraySchema manually registered');
    } catch (error) {
      console.log('❌ Manual ArraySchema registration failed:', error);
    }

    // Try to manually register MapSchema
    try {
      registerType('MapSchema', MapSchema);
      console.log('✅ MapSchema manually registered');
    } catch (error) {
      console.log('❌ Manual MapSchema registration failed:', error);
    }
  });
});
