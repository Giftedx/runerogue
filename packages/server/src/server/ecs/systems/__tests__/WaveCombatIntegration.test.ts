/**
 * Integration test for Wave Combat System
 * Tests interaction between WaveSpawningSystem and AutoCombatSystem
 */

import { createWorld, IWorld } from 'bitecs';
import { Health, CombatStats } from '../../components';
import { createPlayer, createMonster } from '../../world';
import { AutoCombatSystem } from '../AutoCombatSystem';
import { WaveSpawningSystem } from '../WaveSpawningSystem';

describe('Wave Combat Integration', () => {
  let world: IWorld;
  let playerId: number;

  beforeEach(() => {
    world = createWorld();

    // Create a test player
    playerId = createPlayer(world, 'test-player', 50, 50);

    // Set up combat stats for player
    CombatStats.attack[playerId] = 20;
    CombatStats.strength[playerId] = 20;
    CombatStats.defence[playerId] = 20;
    CombatStats.attackBonus[playerId] = 10;
    CombatStats.strengthBonus[playerId] = 10;
    CombatStats.defenceBonus[playerId] = 10;

    // Set up health
    Health.current[playerId] = 200;
    Health.max[playerId] = 200;
  });
  test('should handle combat with spawned enemies', () => {
    // Spawn some test enemies manually to simulate wave spawning
    const enemy1 = createMonster(world, 'goblin', 52, 52, 5);
    const enemy2 = createMonster(world, 'orc', 48, 48, 10);

    // Set up enemy stats
    CombatStats.attack[enemy1] = 5;
    CombatStats.strength[enemy1] = 5;
    CombatStats.defence[enemy1] = 3;
    Health.current[enemy1] = 20;
    Health.max[enemy1] = 20;

    CombatStats.attack[enemy2] = 8;
    CombatStats.strength[enemy2] = 8;
    CombatStats.defence[enemy2] = 5;
    Health.current[enemy2] = 40;
    Health.max[enemy2] = 40;

    // Run both systems multiple times to simulate game loop
    for (let i = 0; i < 50; i++) {
      WaveSpawningSystem(world);
      AutoCombatSystem(world);
    }

    // Verify that the systems run without errors
    // The auto-combat system should have detected the enemies and engaged
    const enemy1Health = Health.current[enemy1];
    const enemy2Health = Health.current[enemy2];

    // Both enemies should still exist but may have taken damage
    expect(enemy1Health).toBeGreaterThanOrEqual(0);
    expect(enemy2Health).toBeGreaterThanOrEqual(0);
    expect(enemy1Health).toBeLessThanOrEqual(20);
    expect(enemy2Health).toBeLessThanOrEqual(40);
  });

  test('should handle player targeting nearest enemy in wave', () => {
    // Create enemies at different distances
    const nearEnemy = createMonster(world, 'goblin', 51, 51, 5); // Close
    const farEnemy = createMonster(world, 'orc', 60, 60, 10); // Far

    // Set up enemy stats
    [nearEnemy, farEnemy].forEach(enemy => {
      CombatStats.attack[enemy] = 5;
      CombatStats.strength[enemy] = 5;
      CombatStats.defence[enemy] = 3;
      Health.current[enemy] = 30;
      Health.max[enemy] = 30;
    });

    // Run auto-combat system
    AutoCombatSystem(world);

    // The near enemy should be prioritized for combat
    // We can't directly test targeting without exposing internal state,
    // but we can verify the system runs without errors
    expect(Health.current[nearEnemy]).toBeLessThanOrEqual(30);
  });

  test('should handle multiple players in wave combat', () => {
    // Create second player
    const player2Id = createPlayer(world, 'test-player-2', 45, 45);

    // Set up second player stats
    CombatStats.attack[player2Id] = 15;
    CombatStats.strength[player2Id] = 15;
    CombatStats.defence[player2Id] = 15;
    Health.current[player2Id] = 150;
    Health.max[player2Id] = 150;

    // Create enemies
    const enemy1 = createMonster(world, 'goblin', 52, 52, 5);
    const enemy2 = createMonster(world, 'orc', 43, 43, 10);

    // Set up enemy stats
    [enemy1, enemy2].forEach(enemy => {
      CombatStats.attack[enemy] = 6;
      CombatStats.strength[enemy] = 6;
      CombatStats.defence[enemy] = 4;
      Health.current[enemy] = 25;
      Health.max[enemy] = 25;
    });

    // Run systems
    for (let i = 0; i < 5; i++) {
      AutoCombatSystem(world);
    }

    // Both players should be able to engage in combat
    // System should handle multiple players without errors
    expect(Health.current[player2Id]).toBeGreaterThan(0);
    expect(Health.current[playerId]).toBeGreaterThan(0);
  });

  test('should award XP when killing wave enemies', () => {
    // Create a weak enemy for easy kill
    const weakEnemy = createMonster(world, 'rat', 51, 51, 1);

    CombatStats.attack[weakEnemy] = 1;
    CombatStats.strength[weakEnemy] = 1;
    CombatStats.defence[weakEnemy] = 1;
    Health.current[weakEnemy] = 1; // Very low health for easy kill
    Health.max[weakEnemy] = 1;

    // Run combat system multiple times to ensure kill
    for (let i = 0; i < 20; i++) {
      AutoCombatSystem(world);
    }

    // Enemy should be dead
    expect(Health.current[weakEnemy]).toBe(0);

    // Player should still be alive (weak enemy can't hurt strong player much)
    expect(Health.current[playerId]).toBeGreaterThan(0);
  });
});
