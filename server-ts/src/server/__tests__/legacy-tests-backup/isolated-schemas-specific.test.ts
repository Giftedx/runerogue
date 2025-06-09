/**
 * Test the IsolatedSchemas.ts file specifically to verify isolation works
 */

import { Encoder } from '@colyseus/schema';
import 'reflect-metadata';
import { IsolatedItem, IsolatedPlayer } from '../game/IsolatedSchemas';

describe('IsolatedSchemas.ts Test', () => {
  test('should create IsolatedItem without errors', () => {
    const item = new IsolatedItem();
    item.isolatedItemId = 'test_item';
    item.isolatedItemName = 'Test Item';
    item.isolatedQuantity = 5;

    expect(item.isolatedItemId).toBe('test_item');
    expect(item.isolatedItemName).toBe('Test Item');
    expect(item.isolatedQuantity).toBe(5);
  });

  test('should attempt to serialize IsolatedItem with Encoder', () => {
    const item = new IsolatedItem();
    item.isolatedItemId = 'test_item';
    item.isolatedItemName = 'Test Item';
    item.isolatedQuantity = 5;

    console.log('Attempting to serialize IsolatedItem...');
    console.log('Item properties:', {
      isolatedItemId: item.isolatedItemId,
      isolatedItemName: item.isolatedItemName,
      isolatedQuantity: item.isolatedQuantity,
    });

    try {
      const encoder = new Encoder(item);
      console.log('✅ Encoder created successfully');
      console.log('hasChanges:', encoder.hasChanges);

      const encoded = encoder.encode();
      console.log('✅ Encoding successful, bytes:', encoded.length);
      expect(encoded.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('❌ Encoding failed:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  });

  test('should create and attempt to serialize IsolatedPlayer', () => {
    const player = new IsolatedPlayer();
    player.isolatedPlayerId = 'player123';
    player.isolatedPlayerName = 'TestPlayer';
    player.isolatedPlayerX = 10;
    player.isolatedPlayerY = 20;
    player.isolatedHealth = 100;

    console.log('Attempting to serialize IsolatedPlayer...');
    console.log('Player properties:', {
      isolatedPlayerId: player.isolatedPlayerId,
      isolatedPlayerName: player.isolatedPlayerName,
      isolatedPlayerX: player.isolatedPlayerX,
      isolatedPlayerY: player.isolatedPlayerY,
      isolatedHealth: player.isolatedHealth,
    });

    try {
      const encoder = new Encoder(player);
      console.log('✅ Encoder created successfully');
      console.log('hasChanges:', encoder.hasChanges);

      const encoded = encoder.encode();
      console.log('✅ Encoding successful, bytes:', encoded.length);
      expect(encoded.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('❌ Encoding failed:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  });
});
