/**
 * Simple inventory test to isolate the issue
 */

// Import the schema class patcher first
import { patchAllSchemas } from '../../utils/schema-class-patcher';
patchAllSchemas();

import { InventoryItem, Player } from '../../game/EntitySchemas';

describe('Inventory Isolation Test', () => {
  beforeEach(() => {
    // Ensure clean state
    jest.clearAllMocks();
  });

  test('should create a player with empty inventory', () => {
    const player = new Player();
    player.username = 'test-user';
    player.id = 'test-id';

    console.log('Player created with inventory length:', player.inventory.length);
    console.log('Player inventory constructor:', player.inventory.constructor.name);
    console.log('Player inventory type:', typeof player.inventory);

    expect(player.inventory.length).toBe(0);
    expect(player.username).toBe('test-user');
  });

  test('should add exactly 2 items correctly', () => {
    const player = new Player();
    player.username = 'test-user';
    player.id = 'test-id';

    // Create simple test items
    const item1 = new InventoryItem();
    item1.itemId = 'starter_sword';
    item1.name = 'Starter Sword';
    item1.quantity = 1;

    const item2 = new InventoryItem();
    item2.itemId = 'starter_shield';
    item2.name = 'Starter Shield';
    item2.quantity = 1;

    console.log('Initial inventory length:', player.inventory.length);

    // Add items one by one
    player.inventory.push(item1);
    console.log('After adding item 1, length:', player.inventory.length);

    player.inventory.push(item2);
    console.log('After adding item 2, length:', player.inventory.length);

    expect(player.inventory.length).toBe(2);
    expect(player.inventory[0].name).toBe('Starter Sword');
    expect(player.inventory[1].name).toBe('Starter Shield');
  });

  test('should not have memory corruption', () => {
    // Create multiple players to check for shared state issues
    const player1 = new Player();
    const player2 = new Player();

    player1.username = 'player1';
    player2.username = 'player2';

    // Add item to player1
    const item = new InventoryItem();
    item.itemId = 'test_item';
    item.name = 'Test Item';
    item.quantity = 1;

    player1.inventory.push(item);

    console.log('Player1 inventory length:', player1.inventory.length);
    console.log('Player2 inventory length:', player2.inventory.length);

    // Player2 should still have empty inventory
    expect(player1.inventory.length).toBe(1);
    expect(player2.inventory.length).toBe(0);
  });
});
