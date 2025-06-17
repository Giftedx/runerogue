// Note: This test file requires Jest types to be installed
// Run: npm i --save-dev @types/jest

import { createECSWorld, createPlayer, createNPC, runGameSystems } from '../world';
import { startCombat } from '../systems/CombatSystem';
import { setMovementTarget } from '../systems/MovementSystem';
import { activatePlayerPrayer } from '../systems/PrayerSystem';
import { addSkillXP, getLevelForXP } from '../systems/SkillSystem';
import { Transform, Health, Skills, SkillExperience, PrayerFlag } from '../components';

describe('ECS Integration Tests', () => {
  let world: any;

  beforeEach(() => {
    world = createECSWorld();
  });

  test('should create a player entity with correct initial values', () => {
    const playerId = createPlayer(world, 'test-session', 100, 200);

    expect(Transform.x[playerId]).toBe(100);
    expect(Transform.y[playerId]).toBe(200);
    expect(Health.current[playerId]).toBe(10);
    expect(Health.max[playerId]).toBe(10);
    expect(Skills.attack[playerId]).toBe(1);
    expect(Skills.hitpoints[playerId]).toBe(10);
    expect(SkillExperience.hitpoints[playerId]).toBe(1154); // XP for level 10
  });

  test('should create an NPC entity with correct combat level scaling', () => {
    const npcId = createNPC(world, 1, 50, 50, 20, true);

    expect(Transform.x[npcId]).toBe(50);
    expect(Transform.y[npcId]).toBe(50);
    expect(Health.max[npcId]).toBe(10 + 20 * 5); // 110 HP
    expect(Skills.attack[npcId]).toBe(Math.floor(20 * 0.8)); // 16
  });

  test('movement system should update entity position', () => {
    const playerId = createPlayer(world, 'test-session', 0, 0);

    // Set movement target
    setMovementTarget(world, playerId, 10, 0);

    // Run movement system multiple times
    for (let i = 0; i < 20; i++) {
      runGameSystems(world, 0.1); // 100ms per tick
    }

    // Player should have moved towards target
    expect(Transform.x[playerId]).toBeGreaterThan(0);
    expect(Transform.x[playerId]).toBeLessThanOrEqual(10);
  });

  test('combat system should handle combat between entities', () => {
    const playerId = createPlayer(world, 'test-session', 0, 0);
    const npcId = createNPC(world, 1, 1, 0, 5, true);

    // Give player better stats
    Skills.attack[playerId] = 10;
    Skills.strength[playerId] = 10;

    const initialNpcHealth = Health.current[npcId];

    // Start combat
    startCombat(world, playerId, npcId);

    // Run combat system multiple times
    for (let i = 0; i < 10; i++) {
      runGameSystems(world, 0.6); // 600ms per tick (OSRS tick rate)
    }

    // NPC should have taken some damage
    expect(Health.current[npcId]).toBeLessThan(initialNpcHealth);
  });

  test('prayer system should drain prayer points', () => {
    const playerId = createPlayer(world, 'test-session', 0, 0);

    // Give player prayer points
    Skills.prayer[playerId] = 10;

    // Activate a prayer
    const activated = activatePlayerPrayer(world, playerId, PrayerFlag.THICK_SKIN);
    expect(activated).toBe(true);

    // Run prayer system for 60 seconds
    for (let i = 0; i < 100; i++) {
      runGameSystems(world, 0.6);
    }

    // Prayer points should have drained
    expect(Skills.prayer[playerId]).toBeLessThan(10);
  });

  test('skill system should level up when XP is added', () => {
    const playerId = createPlayer(world, 'test-session', 0, 0);

    // Add XP to attack skill
    addSkillXP(world, playerId, 'attack' as any, 100);

    // Run skill system
    runGameSystems(world, 0.016);

    // Attack level should have increased
    expect(Skills.attack[playerId]).toBe(getLevelForXP(100));
    expect(Skills.attack[playerId]).toBeGreaterThan(1);
  });

  test('multiple systems should work together', () => {
    const playerId = createPlayer(world, 'test-session', 0, 0);
    const npcId = createNPC(world, 1, 5, 5, 10, true);

    // Setup player
    Skills.attack[playerId] = 20;
    Skills.strength[playerId] = 20;
    Skills.prayer[playerId] = 20;

    // Activate prayer
    activatePlayerPrayer(world, playerId, PrayerFlag.BURST_OF_STRENGTH);

    // Move towards NPC
    setMovementTarget(world, playerId, 5, 5);

    // Start combat when in range
    startCombat(world, playerId, npcId);

    const initialXP = SkillExperience.attack[playerId];

    // Run all systems
    for (let i = 0; i < 50; i++) {
      runGameSystems(world, 0.1);
    }

    // Player should have gained combat XP
    expect(SkillExperience.attack[playerId]).toBeGreaterThan(initialXP);

    // Prayer points should have drained
    expect(Skills.prayer[playerId]).toBeLessThan(20);
  });
});
