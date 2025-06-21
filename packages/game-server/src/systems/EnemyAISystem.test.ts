/**
 * Unit tests for EnemyAISystem (OSRS-authentic enemy AI and combat event emission).
 *
 * Covers:
 * - Enemy moves toward nearest player
 * - Enemy attacks when in range, using OSRS formulas
 * - CombatEvent is emitted for every attack
 * - Robust error handling
 */
import { createWorld, addEntity, addComponent, type IWorld } from "bitecs";
import {
  Position,
  Health,
  Enemy,
  Combat,
  Player as PlayerComponent,
} from "../ecs/components";
import { createEnemyAISystem, type CombatEvent } from "./EnemyAISystem";
import { gameEventEmitter } from "../events/GameEventEmitter";

// Mock OSRS constants
const PLAYER_START_X = 100;
const PLAYER_START_Y = 100;
const ENEMY_START_X = 50;
const ENEMY_START_Y = 50;

describe("EnemyAISystem", () => {
  let world: IWorld;
  let playerEid: number;
  let enemyEid: number;
  let emittedEvents: CombatEvent[];
  beforeEach(() => {
    world = createWorld();
    // Create player
    playerEid = addEntity(world);
    addComponent(world, PlayerComponent, playerEid);
    addComponent(world, Position, playerEid);
    addComponent(world, Health, playerEid);
    Position.x[playerEid] = PLAYER_START_X;
    Position.y[playerEid] = PLAYER_START_Y;
    Health.current[playerEid] = 10;
    Health.max[playerEid] = 10;
    // Create enemy
    enemyEid = addEntity(world);
    addComponent(world, Enemy, enemyEid);
    addComponent(world, Position, enemyEid);
    addComponent(world, Health, enemyEid);
    addComponent(world, Combat, enemyEid);
    Position.x[enemyEid] = ENEMY_START_X;
    Position.y[enemyEid] = ENEMY_START_Y;
    Health.current[enemyEid] = 10;
    Health.max[enemyEid] = 10;
    Combat.attack[enemyEid] = 10;
    Combat.strength[enemyEid] = 10;
    Combat.defence[enemyEid] = 10;
    Combat.ranged[enemyEid] = 1;
    Combat.magic[enemyEid] = 1;
    Combat.attackBonus[enemyEid] = 0;
    Combat.strengthBonus[enemyEid] = 0;
    Combat.defenceBonus[enemyEid] = 0;
    Combat.rangedStrengthBonus[enemyEid] = 0;
    Combat.magicBonus[enemyEid] = 0;
    Combat.magicDamageBonus[enemyEid] = 0;
    Combat.attackSpeed[enemyEid] = 600; // 1 tick
    Combat.lastAttackTime[enemyEid] = 0;
    // Set up event capture
    emittedEvents = [];
    gameEventEmitter.removeAllListeners();
    gameEventEmitter.on("combat", (event: CombatEvent) => {
      emittedEvents.push(event);
    });
  });

  it("moves enemy toward player if out of range", () => {
    const system = createEnemyAISystem();
    const prevX = Position.x[enemyEid];
    const prevY = Position.y[enemyEid];
    system(world);
    expect(Position.x[enemyEid]).not.toBe(prevX);
    expect(Position.y[enemyEid]).not.toBe(prevY);
    expect(emittedEvents.length).toBe(0);
  });

  it("attacks player if in range and emits CombatEvent", () => {
    // Place enemy next to player
    Position.x[enemyEid] = PLAYER_START_X;
    Position.y[enemyEid] = PLAYER_START_Y + 1;
    const system = createEnemyAISystem();
    system(world);
    expect(emittedEvents.length).toBe(1);
    const event: CombatEvent = emittedEvents[0];
    expect(event.attacker).toBe(enemyEid);
    expect(event.defender).toBe(playerEid);
    expect(typeof event.damage).toBe("number");
    expect(typeof event.hit).toBe("boolean");
    expect(typeof event.timestamp).toBe("number");
  });

  it("does not attack if cooldown not elapsed", () => {
    // Place enemy in range
    Position.x[enemyEid] = PLAYER_START_X;
    Position.y[enemyEid] = PLAYER_START_Y + 1;
    Combat.lastAttackTime[enemyEid] = Date.now();
    const system = createEnemyAISystem();
    system(world);
    expect(emittedEvents.length).toBe(0);
  });

  it("does not throw if no players are alive", () => {
    Health.current[playerEid] = 0;
    const system = createEnemyAISystem();
    expect(() => system(world)).not.toThrow();
  });

  it("handles combat errors gracefully", () => {
    // Simulate error in combat calculation
    const system = createEnemyAISystem();
    // Remove required stat to cause error
    Combat.attack[enemyEid] = undefined as unknown as number;
    Position.x[enemyEid] = PLAYER_START_X;
    Position.y[enemyEid] = PLAYER_START_Y + 1;
    expect(() => system(world)).not.toThrow();
  });
});
