/**
 * Minimal schema serialization test
 */

// Import reflect-metadata and setup Symbol.metadata first
import 'reflect-metadata';
if (!Symbol.metadata) {
  (Symbol as any).metadata = Symbol('Symbol.metadata');
}

import { MapSchema, Schema, type } from '@colyseus/schema';

// Define minimal test schemas directly in this file to avoid import issues
class TestSkill extends Schema {
  @type('number')
  public level: number = 1;

  @type('number')
  public xp: number = 0;

  constructor(level: number = 1, xp: number = 0) {
    super();
    this.level = level;
    this.xp = xp;
  }
}

class TestPlayer extends Schema {
  @type('string')
  public id: string = '';

  @type('string')
  public name: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public health: number = 100;

  @type(TestSkill)
  public attackSkill: TestSkill = new TestSkill();

  constructor() {
    super();
    this.attackSkill = new TestSkill();
  }
}

class TestGameState extends Schema {
  @type({ map: TestPlayer })
  public players: MapSchema<TestPlayer> = new MapSchema<TestPlayer>();

  @type('number')
  public timestamp: number = 0;

  constructor() {
    super();
    this.players = new MapSchema<TestPlayer>();
  }
}

describe('Minimal Schema Serialization Test', () => {
  test('should create TestSkill without errors', () => {
    expect(() => {
      const skill = new TestSkill(10, 1500);
      expect(skill.level).toBe(10);
      expect(skill.xp).toBe(1500);
    }).not.toThrow();
  });

  test('should create TestPlayer without errors', () => {
    expect(() => {
      const player = new TestPlayer();
      player.id = 'test-player';
      player.name = 'TestPlayer';
      player.x = 10;
      player.y = 20;
      expect(player.id).toBe('test-player');
      expect(player.attackSkill).toBeDefined();
      expect(player.attackSkill.level).toBe(1);
    }).not.toThrow();
  });

  test('should create TestGameState and add player', () => {
    expect(() => {
      const gameState = new TestGameState();
      const player = new TestPlayer();
      player.id = 'test-player';
      gameState.players.set('test-player', player);
      expect(gameState.players.has('test-player')).toBe(true);
    }).not.toThrow();
  });

  test('should be able to serialize with Encoder', () => {
    const gameState = new TestGameState();
    const player = new TestPlayer();
    player.id = 'test-player';
    player.name = 'Test';
    gameState.players.set('test-player', player);
    gameState.timestamp = Date.now();

    expect(() => {
      // This is the critical test - can we create an Encoder and serialize?
      const { Encoder } = require('@colyseus/schema');

      // Validate the instance has proper constructor
      expect(gameState.constructor).toBeDefined();
      expect(typeof gameState.constructor).toBe('function');

      // Create encoder with the instance
      const encoder = new Encoder(gameState);
      expect(encoder).toBeDefined();

      // Encode the state
      const encoded = encoder.encode();
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);

      console.log('✅ Successfully encoded gameState:', encoded.length, 'bytes');
    }).not.toThrow();
  });
});
