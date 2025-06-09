import 'reflect-metadata';
import { ItemDefinition } from '../../../shared/types/Economy';
import { InventoryItem, Player } from '../../game/EntitySchemas';

describe('ArraySchema Isolation Test', () => {
  let testItemDef: ItemDefinition;

  beforeEach(() => {
    testItemDef = {
      id: 'test_sword',
      name: 'Test Sword',
      description: 'A test sword',
      type: 'weapon',
      subtype: 'sword',
      value: 100,
      stats: {
        attack_stab: 5,
        attack_slash: 10,
        attack_crush: 0,
        defence_stab: 0,
        defence_slash: 0,
        defence_crush: 0,
        defence_magic: 0,
        defence_ranged: 0,
        strength: 8,
        prayer: 0,
        magic: 0,
        ranged_strength: 0,
      },
      requirements: {
        attack: 1,
      },
    };
  });

  test('should create empty player inventory correctly', () => {
    const player = new Player('test-user', 100, 50, 50);

    console.log('🔍 Fresh player inventory:');
    console.log('  - Length:', player.inventory.length);
    console.log('  - Constructor:', player.inventory.constructor.name);
    console.log('  - Is Array:', Array.isArray(player.inventory));
    console.log('  - toString:', player.inventory.toString());

    expect(player.inventory.length).toBe(0);
    expect(player.username).toBe('test-user');
  });

  test('should add exactly 2 items correctly', () => {
    const player = new Player('test-user', 100, 50, 50);

    console.log('🔍 Initial state:');
    console.log('  - Length before:', player.inventory.length);

    // Create two test items
    const item1 = new InventoryItem(testItemDef, 1);
    const item2 = new InventoryItem(testItemDef, 1);

    console.log('🔍 Created items:');
    console.log('  - Item1:', item1.name, item1.quantity);
    console.log('  - Item2:', item2.name, item2.quantity);

    // Add items using push
    player.inventory.push(item1);
    console.log('  - Length after item1:', player.inventory.length);

    player.inventory.push(item2);
    console.log('  - Length after item2:', player.inventory.length);

    // Check final state
    console.log('🔍 Final state:');
    console.log('  - Final length:', player.inventory.length);
    console.log(
      '  - Item names:',
      player.inventory.map(item => item?.name)
    );

    expect(player.inventory.length).toBe(2);
    expect(player.inventory[0].name).toBe('Test Sword');
    expect(player.inventory[1].name).toBe('Test Sword');
  });

  test('should behave like normal array for basic operations', () => {
    const player = new Player('test-user', 100, 50, 50);

    // Test array-like behavior
    expect(player.inventory.length).toBe(0);

    const item = new InventoryItem(testItemDef, 1);
    player.inventory.push(item);

    expect(player.inventory.length).toBe(1);
    expect(player.inventory[0]).toBe(item);

    // Test pop
    const popped = player.inventory.pop();
    expect(popped).toBe(item);
    expect(player.inventory.length).toBe(0);
  });
});
