/**
 * Test to understand Colyseus v2.x API changes
 */
import 'reflect-metadata';
import '../../utils/symbol-metadata-polyfill';

describe('Colyseus v2.x API', () => {
  it('should check available exports from @colyseus/schema', () => {
    const colyseusSchema = require('@colyseus/schema');
    console.log('Colyseus schema exports:', Object.keys(colyseusSchema));

    // Check if encode function exists
    expect(colyseusSchema.encode).toBeDefined();
    expect(typeof colyseusSchema.encode).toBe('function');
  });

  it('should use encode function instead of Encoder class', () => {
    const { encode, Schema, type } = require('@colyseus/schema');

    // Create a simple schema class
    class TestSchema extends Schema {
      @type('string') name: string = 'test';
      @type('number') value: number = 42;
    }

    const instance = new TestSchema();

    expect(() => {
      const encoded = encode(instance);
      console.log('Encoded successfully with v2.x API:', encoded.length, 'bytes');
    }).not.toThrow();
  });

  it('should test our actual schema classes with v2.x API', () => {
    const { encode } = require('@colyseus/schema');
    const { InventoryItem, Player } = require('../../game/EntitySchemas');

    const item = new InventoryItem();
    item.itemId = 'test_item';
    item.name = 'Test Item';
    item.quantity = 1;

    expect(() => {
      const encoded = encode(item);
      console.log('InventoryItem encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();

    const player = new Player();
    player.id = 'test_player';
    player.username = 'TestUser';

    expect(() => {
      const encoded = encode(player);
      console.log('Player encoded successfully:', encoded.length, 'bytes');
    }).not.toThrow();
  });
});
