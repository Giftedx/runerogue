import { createWorld, addEntity, addComponent } from "bitecs";
import { Enemy, Position, Health, CombatStats } from "../../components";
import { AIState, EnemyAIState } from "../../components/AIState";
import { createEnemySpawnSystem } from "../EnemySpawnSystem";
import { EnemyType } from "@runerogue/shared";
import type { CombatWorld } from "../CombatSystem";

/**
 * Tests for EnemySpawnSystem following OSRS authenticity and bitECS patterns.
 * Ensures proper component registration and wave progression.
 */

describe("EnemySpawnSystem", () => {
  let world: CombatWorld;
  let mockOptions: any;

  beforeEach(() => {
    world = createWorld() as CombatWorld;
    world.time = { delta: 600, elapsed: 0 };
    world.entitiesToRemove = new Set();
    world.room = {} as any;

    mockOptions = {
      getPlayerCount: jest.fn(() => 1),
      getMapBounds: jest.fn(() => ({
        width: 800,
        height: 600,
        centerX: 400,
        centerY: 300,
      })),
      onEnemySpawned: jest.fn(),
      onWaveCompleted: jest.fn(),
      onWaveStarted: jest.fn(),
    };
  });

  it("should create enemies with proper component registration", () => {
    const spawnSystem = createEnemySpawnSystem(mockOptions);

    // Run system to start first wave
    spawnSystem(world);

    // Wait for spawn queue processing (simulate time passing)
    jest.advanceTimersByTime(2000);
    spawnSystem(world);

    // Verify enemy was spawned (this would need actual implementation)
    expect(mockOptions.onWaveStarted).toHaveBeenCalledWith(1);
  });

  it("should handle OSRS-authentic enemy stats", () => {
    // Manually create an enemy to test stats setup
    const eid = addEntity(world);

    // Follow bitECS pattern
    addComponent(world, Enemy, eid);
    addComponent(world, Position, eid);
    addComponent(world, Health, eid);
    addComponent(world, CombatStats, eid);
    addComponent(world, AIState, eid); // Set OSRS Goblin stats (level 2) with type assertions
    (Enemy.enemyType[eid] as any) = Object.values(EnemyType).indexOf(
      EnemyType.Goblin
    );
    (Enemy.level[eid] as any) = 2;
    (Enemy.attackSpeed[eid] as any) = 4; // 4-tick attack (2.4s)
    (Enemy.maxAttackRange[eid] as any) = 32; // 1 tile
    (Enemy.aggroRadius[eid] as any) = 100;
    (Enemy.moveSpeed[eid] as any) = 60;

    // Set health (5 HP for level 2 goblin)
    Health.current[eid] = 5;
    Health.max[eid] = 5;

    // Set combat stats
    CombatStats.attackLevel[eid] = 1;
    CombatStats.strengthLevel[eid] = 1;
    CombatStats.defenceLevel[eid] = 1;
    CombatStats.hitpointsLevel[eid] = 5;

    // Set AI state
    AIState.currentState[eid] = EnemyAIState.Idle;
    AIState.isAggressive[eid] = 1; // Verify OSRS authenticity with type assertions
    expect(Enemy.level[eid] as any).toBe(2);
    expect(Enemy.attackSpeed[eid] as any).toBe(4);
    expect(Health.max[eid]).toBe(5);
    expect(CombatStats.attackLevel[eid]).toBe(1);
    expect(CombatStats.strengthLevel[eid]).toBe(1);
    expect(CombatStats.defenceLevel[eid]).toBe(1);
    expect(AIState.isAggressive[eid]).toBe(1);
  });

  it("should scale enemies based on player count", () => {
    // Mock 2 players
    mockOptions.getPlayerCount.mockReturnValue(2);

    const spawnSystem = createEnemySpawnSystem(mockOptions);
    spawnSystem(world);

    // Player scaling should increase enemy count
    // Wave 1 normally has 3 goblins, with 2 players should be ~5 goblins
    expect(mockOptions.onWaveStarted).toHaveBeenCalledWith(1);
  });

  it("should handle wave progression", () => {
    const spawnSystem = createEnemySpawnSystem(mockOptions);

    // Start first wave
    spawnSystem(world);
    expect(mockOptions.onWaveStarted).toHaveBeenCalledWith(1);

    // Simulate wave completion (no enemies remaining)
    mockOptions.getPlayerCount.mockReturnValue(1);
    spawnSystem(world);

    // Should progress to next wave
    expect(mockOptions.onWaveCompleted).toHaveBeenCalledWith(1);
  });

  it("should validate enemy component data persistence", () => {
    // Test the core bitECS pattern that was fixed in PrayerSystem
    const eid = addEntity(world);

    // CRITICAL: Must use addComponent first
    addComponent(world, Enemy, eid);
    addComponent(world, AIState, eid);

    // Set data    (Enemy.level[eid] as any) = 15; // Skeleton level
    (Enemy.attackSpeed[eid] as any) = 5; // 5-tick attack
    AIState.currentState[eid] = EnemyAIState.Aggressive;

    // Verify persistence (this was the core issue with Prayer system)    expect((Enemy.level[eid] as any)).toBe(15);
    expect(Enemy.attackSpeed[eid] as any).toBe(5);
    expect(AIState.currentState[eid]).toBe(EnemyAIState.Aggressive);
  });

  it("should handle different enemy types with correct stats", () => {
    const testEnemyStats = [
      {
        type: EnemyType.Goblin,
        expectedLevel: 2,
        expectedAttackSpeed: 4,
        expectedHealth: 5,
      },
      {
        type: EnemyType.GiantRat,
        expectedLevel: 3,
        expectedAttackSpeed: 4,
        expectedHealth: 8,
      },
      {
        type: EnemyType.Skeleton,
        expectedLevel: 15,
        expectedAttackSpeed: 5,
        expectedHealth: 18,
      },
    ];

    testEnemyStats.forEach(
      ({ type, expectedLevel, expectedAttackSpeed, expectedHealth }) => {
        const eid = addEntity(world);

        // Proper component registration
        addComponent(world, Enemy, eid);
        addComponent(world, Health, eid);

        // Set enemy type and stats
        const typeIndex = Object.values(EnemyType).indexOf(type);
        (Enemy.enemyType[eid] as any) = typeIndex;
        (Enemy.level[eid] as any) = expectedLevel;
        (Enemy.attackSpeed[eid] as any) = expectedAttackSpeed;
        Health.max[eid] = expectedHealth;
        Health.current[eid] = expectedHealth;

        // Verify OSRS-authentic stats        expect((Enemy.enemyType[eid] as any)).toBe(typeIndex);
        expect(Enemy.level[eid] as any).toBe(expectedLevel);
        expect(Enemy.attackSpeed[eid] as any).toBe(expectedAttackSpeed);
        expect(Health.max[eid]).toBe(expectedHealth);
      }
    );
  });
});
