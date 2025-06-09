/**
 * Test for the fixed entity schemas
 */

import { FixedEntitySchemas } from '../FixedEntitySchemas';

const { GameState, Player, Skill, Skills, InventoryItem, Inventory } = FixedEntitySchemas;

describe('Fixed Entity Schemas', () => {
  beforeEach(() => {
    // Clear any existing registrations
    jest.clearAllMocks();
  });

  test('should create Skill without errors', () => {
    expect(() => {
      const skill = new Skill(10, 1500);
      expect(skill.level).toBe(10);
      expect(skill.xp).toBe(1500);
    }).not.toThrow();
  });

  test('should create Skills collection without errors', () => {
    expect(() => {
      const skills = new Skills();
      expect(skills.attack).toBeDefined();
      expect(skills.attack.level).toBe(1);
    }).not.toThrow();
  });

  test('should create InventoryItem without errors', () => {
    expect(() => {
      const item = new InventoryItem();
      item.itemId = 'bronze_sword';
      item.name = 'Bronze Sword';
      item.attack = 5;
      expect(item.itemId).toBe('bronze_sword');
      expect(item.attack).toBe(5);
    }).not.toThrow();
  });

  test('should create Player without errors', () => {
    expect(() => {
      const player = new Player();
      player.id = 'test-player-1';
      player.name = 'TestPlayer';
      player.x = 10;
      player.y = 20;
      expect(player.id).toBe('test-player-1');
      expect(player.skills).toBeDefined();
      expect(player.inventory).toBeDefined();
    }).not.toThrow();
  });

  test('should create GameState without errors', () => {
    expect(() => {
      const gameState = new GameState();
      const player = new Player();
      player.id = 'test-player';
      gameState.players.set('test-player', player);
      expect(gameState.players.has('test-player')).toBe(true);
    }).not.toThrow();
  });

  test('should be able to serialize without Encoder errors', () => {
    const gameState = new GameState();
    const player = new Player();
    player.id = 'test-player';
    player.name = 'Test';
    gameState.players.set('test-player', player);

    expect(() => {
      // Try to create encoder and encode
      const { Encoder } = require('@colyseus/schema');
      const encoder = new Encoder(gameState);
      const encoded = encoder.encode();
      expect(encoded).toBeDefined();
      expect(encoded.length).toBeGreaterThan(0);
    }).not.toThrow();
  });
});
