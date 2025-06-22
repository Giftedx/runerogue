import { createWorld, addEntity, addComponent } from "bitecs";
import { Enemy } from "../../components/Enemy";
import { AIState, EnemyAIState } from "../../components/AIState";

/**
 * Tests for Enemy component following the established bitECS pattern.
 * Based on the PrayerSystem fix - all components must be registered with
 * `addComponent(world, Component, eid)` before setting component data.
 */

describe("Enemy Component", () => {
  it("should persist data when properly registered", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // CRITICAL: Always use addComponent first
    addComponent(world, Enemy, eid);

    // Set enemy data (using numeric values instead of enum for simplicity)
    Enemy.enemyType[eid] = 0; // Goblin type
    Enemy.level[eid] = 2;
    Enemy.aiState[eid] = EnemyAIState.Idle;
    Enemy.targetEid[eid] = 0;
    Enemy.aggroRadius[eid] = 100;
    Enemy.attackSpeed[eid] = 4;
    Enemy.maxAttackRange[eid] = 32;
    Enemy.moveSpeed[eid] = 60;

    // Verify data persists
    expect(Enemy.enemyType[eid]).toBe(0);
    expect(Enemy.level[eid]).toBe(2);
    expect(Enemy.aiState[eid]).toBe(EnemyAIState.Idle);
    expect(Enemy.targetEid[eid]).toBe(0);
    expect(Enemy.aggroRadius[eid]).toBe(100);
    expect(Enemy.attackSpeed[eid]).toBe(4);
    expect(Enemy.maxAttackRange[eid]).toBe(32);
    expect(Enemy.moveSpeed[eid]).toBe(60);
  });

  it("should handle OSRS-authentic enemy stats", () => {
    const world = createWorld();
    const eid = addEntity(world);

    addComponent(world, Enemy, eid);

    // Set OSRS Goblin stats
    Enemy.enemyType[eid] = 0; // Goblin
    Enemy.level[eid] = 2; // OSRS Goblin combat level
    Enemy.attackSpeed[eid] = 4; // OSRS 4-tick attack (2.4s)
    Enemy.maxAttackRange[eid] = 32; // 1 tile in pixels
    Enemy.aggroRadius[eid] = 100; // Aggressive within 100px

    // Verify OSRS authenticity
    expect(Enemy.level[eid]).toBe(2);
    expect(Enemy.attackSpeed[eid]).toBe(4);
    expect(Enemy.maxAttackRange[eid]).toBe(32);
  });

  it("should handle different enemy types", () => {
    const world = createWorld();

    // Test Goblin
    const goblinEid = addEntity(world);
    addComponent(world, Enemy, goblinEid);
    Enemy.enemyType[goblinEid] = 0; // Goblin
    Enemy.level[goblinEid] = 2;

    // Test Giant Rat
    const ratEid = addEntity(world);
    addComponent(world, Enemy, ratEid);
    Enemy.enemyType[ratEid] = 1; // Giant Rat
    Enemy.level[ratEid] = 3;

    // Test Skeleton
    const skeletonEid = addEntity(world);
    addComponent(world, Enemy, skeletonEid);
    Enemy.enemyType[skeletonEid] = 2; // Skeleton
    Enemy.level[skeletonEid] = 15;

    // Verify all types
    expect(Enemy.enemyType[goblinEid]).toBe(0);
    expect(Enemy.level[goblinEid]).toBe(2);

    expect(Enemy.enemyType[ratEid]).toBe(1);
    expect(Enemy.level[ratEid]).toBe(3);

    expect(Enemy.enemyType[skeletonEid]).toBe(2);
    expect(Enemy.level[skeletonEid]).toBe(15);
  });
});

describe("AIState Component", () => {
  it("should persist AI state data when properly registered", () => {
    const world = createWorld();
    const eid = addEntity(world);

    // CRITICAL: Register component first
    addComponent(world, AIState, eid);

    // Use simpler values for testing
    const testTime = 12345;

    // Set AI state data
    AIState.currentState[eid] = EnemyAIState.Idle;
    AIState.stateEnterTime[eid] = testTime;
    AIState.stateExitTime[eid] = 0;
    AIState.isAggressive[eid] = 1;
    AIState.canFlee[eid] = 0;
    AIState.fleeHealthThreshold[eid] = 25;
    AIState.lastTargetScanTime[eid] = testTime;
    AIState.targetScanCooldown[eid] = 1000;

    // Verify data persists
    expect(AIState.currentState[eid]).toBe(EnemyAIState.Idle);
    expect(AIState.stateEnterTime[eid]).toBe(testTime);
    expect(AIState.stateExitTime[eid]).toBe(0);
    expect(AIState.isAggressive[eid]).toBe(1);
    expect(AIState.canFlee[eid]).toBe(0);
    expect(AIState.fleeHealthThreshold[eid]).toBe(25);
    expect(AIState.lastTargetScanTime[eid]).toBe(testTime);
    expect(AIState.targetScanCooldown[eid]).toBe(1000);
  });

  it("should handle AI state transitions", () => {
    const world = createWorld();
    const eid = addEntity(world);

    addComponent(world, AIState, eid);

    // Start in Idle state
    AIState.currentState[eid] = EnemyAIState.Idle;
    expect(AIState.currentState[eid]).toBe(EnemyAIState.Idle);

    // Transition to Aggressive
    AIState.currentState[eid] = EnemyAIState.Aggressive;
    expect(AIState.currentState[eid]).toBe(EnemyAIState.Aggressive);

    // Transition to Combat
    AIState.currentState[eid] = EnemyAIState.Combat;
    expect(AIState.currentState[eid]).toBe(EnemyAIState.Combat);

    // Transition to Fleeing
    AIState.currentState[eid] = EnemyAIState.Fleeing;
    expect(AIState.currentState[eid]).toBe(EnemyAIState.Fleeing);
  });

  it("should handle aggressive and fleeing configurations", () => {
    const world = createWorld();

    // Aggressive enemy
    const aggressiveEid = addEntity(world);
    addComponent(world, AIState, aggressiveEid);
    AIState.isAggressive[aggressiveEid] = 1;
    AIState.canFlee[aggressiveEid] = 0;
    AIState.fleeHealthThreshold[aggressiveEid] = 0;

    // Fleeing enemy
    const fleeingEid = addEntity(world);
    addComponent(world, AIState, fleeingEid);
    AIState.isAggressive[fleeingEid] = 1;
    AIState.canFlee[fleeingEid] = 1;
    AIState.fleeHealthThreshold[fleeingEid] = 25;

    // Verify configurations
    expect(AIState.isAggressive[aggressiveEid]).toBe(1);
    expect(AIState.canFlee[aggressiveEid]).toBe(0);

    expect(AIState.isAggressive[fleeingEid]).toBe(1);
    expect(AIState.canFlee[fleeingEid]).toBe(1);
    expect(AIState.fleeHealthThreshold[fleeingEid]).toBe(25);
  });
});
