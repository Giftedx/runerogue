/**
 * Debug Schemas Encoder Test - Isolate the encoder issue
 */

import { Encoder } from '@colyseus/schema';
import { CleanItem, CleanPlayer, createCleanPlayer } from '../game/CleanSchemas';

describe('Debug Schemas Encoder Test', () => {
  it('should serialize basic CleanItem without nested schemas', () => {
    const item = new CleanItem();
    item.itemId = 'test';
    item.itemName = 'Test Item';
    item.itemQuantity = 1;
    item.itemValue = 10;
    item.itemStackable = true;

    expect(() => {
      const encoder = new Encoder(item);
      console.log('✅ CleanItem encoder created successfully');
      const hasChanges = encoder.hasChanges;
      console.log('✅ hasChanges:', hasChanges);
    }).not.toThrow();
  });

  it('should debug CleanPlayer initialization step by step', () => {
    // Create empty player to check what fails
    const player = new CleanPlayer();
    console.log('Player instance created:', {
      playerId: player.playerId,
      playerUsername: player.playerUsername,
      playerInventory: player.playerInventory,
      playerSkills: player.playerSkills,
      playerEquipment: player.playerEquipment,
    });

    expect(() => {
      const encoder = new Encoder(player);
      console.log('✅ CleanPlayer encoder created successfully');
    }).not.toThrow();
  });

  it('should test createCleanPlayer factory', () => {
    const player = createCleanPlayer('test_id', 'test_user', 10, 20);
    console.log('Factory-created player:', {
      playerId: player.playerId,
      playerUsername: player.playerUsername,
      playerX: player.playerX,
      playerY: player.playerY,
      playerInventory: player.playerInventory,
      playerSkills: player.playerSkills,
      playerEquipment: player.playerEquipment,
    });

    expect(() => {
      const encoder = new Encoder(player);
      console.log('✅ Factory-created CleanPlayer encoder created successfully');
    }).not.toThrow();
  });
});
