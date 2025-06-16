/**
 * Test for minimal schema to debug export issue
 */

import {
  MinimalTestItem,
  MinimalTestPlayer,
  createTestItem,
  createTestPlayer,
} from '../game/MinimalTestSchema';

describe('Minimal Schema Export Test', () => {
  it('should export classes correctly', () => {
    const exported = require('../game/MinimalTestSchema');
    console.log('MinimalTestSchema exports:', Object.keys(exported));
    console.log('MinimalTestPlayer type:', typeof exported.MinimalTestPlayer);
    console.log('MinimalTestItem type:', typeof exported.MinimalTestItem);
  });

  it('should create MinimalTestPlayer instance', () => {
    expect(() => {
      const player = new MinimalTestPlayer();
      player.id = 'test-player';
      player.username = 'TestUser';
      console.log('Created player:', player);
    }).not.toThrow();
  });

  it('should create MinimalTestItem instance', () => {
    expect(() => {
      const item = new MinimalTestItem();
      item.itemId = 'test-item';
      item.name = 'Test Item';
      console.log('Created item:', item);
    }).not.toThrow();
  });

  it('should use factory functions', () => {
    expect(() => {
      const player = createTestPlayer('test-id', 'TestUser');
      const item = createTestItem('sword', 'Iron Sword');

      expect(player.id).toBe('test-id');
      expect(player.username).toBe('TestUser');
      expect(item.itemId).toBe('sword');
      expect(item.name).toBe('Iron Sword');

      console.log('Factory created player:', player);
      console.log('Factory created item:', item);
    }).not.toThrow();
  });
});
