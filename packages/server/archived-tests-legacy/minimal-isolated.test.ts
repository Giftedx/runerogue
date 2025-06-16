/**
 * Minimal isolated schema test to verify Colyseus basic functionality
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';

// Create completely new, isolated schema classes for this test only
class TestSkill extends Schema {
  @type('number')
  public level: number = 1;

  @type('number')
  public experience: number = 0;

  constructor(level: number = 1) {
    super();
    this.level = level;
  }
}

class TestInventory extends Schema {
  @type('string')
  public itemName: string = '';

  @type('number')
  public quantity: number = 1;

  constructor(itemName: string = '', quantity: number = 1) {
    super();
    this.itemName = itemName;
    this.quantity = quantity;
  }
}

class TestPlayer extends Schema {
  @type('string')
  public playerId: string = '';

  @type('string')
  public name: string = '';

  @type('number')
  public posX: number = 0;

  @type('number')
  public posY: number = 0;

  @type('number')
  public hp: number = 100;

  @type(TestSkill)
  public attackSkill: TestSkill = new TestSkill();

  @type([TestInventory])
  public items = new ArraySchema<TestInventory>();

  constructor() {
    super();
  }
}

class TestGameRoom extends Schema {
  @type({ map: TestPlayer })
  public players = new MapSchema<TestPlayer>();

  @type('number')
  public timestamp: number = 0;

  constructor() {
    super();
    this.timestamp = Date.now();
  }
}

describe('Minimal Isolated Schema Test', () => {
  it('should create and serialize schemas without conflicts', () => {
    expect(() => {
      // Create test instances
      const gameRoom = new TestGameRoom();
      const player = new TestPlayer();
      player.playerId = 'test123';
      player.name = 'TestUser';
      player.posX = 50;
      player.posY = 75;

      // Add skill
      player.attackSkill.level = 10;
      player.attackSkill.experience = 1500;

      // Add inventory item
      const item = new TestInventory('sword', 1);
      player.items.push(item);

      // Add player to room
      gameRoom.players.set('test123', player);

      // Test serialization
      const encoded = gameRoom.encode();
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);

      // Test access
      const retrievedPlayer = gameRoom.players.get('test123');
      expect(retrievedPlayer).toBeDefined();
      expect(retrievedPlayer?.name).toBe('TestUser');
      expect(retrievedPlayer?.attackSkill.level).toBe(10);
      expect(retrievedPlayer?.items.length).toBe(1);
      expect(retrievedPlayer?.items[0].itemName).toBe('sword');
    }).not.toThrow();
  });

  it('should handle nested schemas correctly', () => {
    expect(() => {
      const player = new TestPlayer();

      // Test skill modification
      player.attackSkill.level = 25;
      expect(player.attackSkill.level).toBe(25);

      // Test inventory array operations
      player.items.push(new TestInventory('potion', 5));
      player.items.push(new TestInventory('gold', 100));

      expect(player.items.length).toBe(2);
      expect(player.items[0].itemName).toBe('potion');
      expect(player.items[1].quantity).toBe(100);
    }).not.toThrow();
  });

  it('should support MapSchema operations', () => {
    expect(() => {
      const gameRoom = new TestGameRoom();

      const player1 = new TestPlayer();
      player1.playerId = 'p1';
      player1.name = 'Player1';

      const player2 = new TestPlayer();
      player2.playerId = 'p2';
      player2.name = 'Player2';

      gameRoom.players.set('p1', player1);
      gameRoom.players.set('p2', player2);

      expect(gameRoom.players.size).toBe(2);
      expect(gameRoom.players.get('p1')?.name).toBe('Player1');
      expect(gameRoom.players.get('p2')?.name).toBe('Player2');

      // Test deletion
      gameRoom.players.delete('p1');
      expect(gameRoom.players.size).toBe(1);
      expect(gameRoom.players.get('p1')).toBeUndefined();
    }).not.toThrow();
  });
});
