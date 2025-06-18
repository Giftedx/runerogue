/**
 * @file EnemyAISystem.test.ts
 * @description Test suite for the EnemyAISystem.
 * @author Your Name
 */

import { GameState, Player, Enemy } from "../../schemas/GameState";
import { EnemyAISystem } from "./EnemyAISystem";
import {
  OSRS_TICK_MS,
  WEAPON_SPEEDS,
} from "../../../../../packages/shared/src/constants";

// Mock the GameRoom and its state
const mockRoom = {
  state: new GameState(),
  handleAttack: jest.fn(),
};

describe("EnemyAISystem", () => {
  let enemyAISystem: EnemyAISystem;
  let state: GameState;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    state = new GameState();
    // Casting to any to satisfy the constructor while using a simplified mock
    enemyAISystem = new EnemyAISystem(state, mockRoom as any);
    state.gameStarted = true;
    mockRoom.handleAttack.mockClear();
    jest.clearAllTimers();
  });

  it("should transition from IDLE to ATTACKING when a player is in aggression range", () => {
    const player = new Player();
    player.id = "player1";
    player.x = 5;
    player.y = 5;
    state.players.set(player.id, player);

    const enemy = new Enemy();
    enemy.id = "enemy1";
    enemy.x = 8; // Within 4 tiles radius
    enemy.y = 8;
    state.enemies.set(enemy.id, enemy);

    enemyAISystem.execute(16);

    expect(enemy.aiState).toBe("ATTACKING");
    expect(enemy.targetId).toBe(player.id);
  });

  it("should target the nearest player", () => {
    const nearPlayer = new Player();
    nearPlayer.id = "player_near";
    nearPlayer.x = 6;
    nearPlayer.y = 6;
    state.players.set(nearPlayer.id, nearPlayer);

    const farPlayer = new Player();
    farPlayer.id = "player_far";
    farPlayer.x = 15;
    farPlayer.y = 15;
    state.players.set(farPlayer.id, farPlayer);

    const enemy = new Enemy();
    enemy.id = "enemy1";
    enemy.x = 5;
    enemy.y = 5;
    state.enemies.set(enemy.id, enemy);

    enemyAISystem.execute(16);

    expect(enemy.targetId).toBe(nearPlayer.id);
  });

  it("should move towards the target at the correct speed", () => {
    const player = new Player();
    player.id = "player1";
    player.x = 10;
    player.y = 10;
    state.players.set(player.id, player);

    const enemy = new Enemy();
    enemy.id = "enemy1";
    enemy.x = 5;
    enemy.y = 5;
    enemy.aiState = "ATTACKING";
    enemy.targetId = player.id;
    state.enemies.set(enemy.id, enemy);

    const initialDistance = Math.sqrt(
      Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
    );

    // Simulate one game tick
    enemyAISystem.execute(OSRS_TICK_MS);

    const newDistance = Math.sqrt(
      Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
    );

    // The enemy should move 1 tile per tick
    expect(newDistance).toBeCloseTo(initialDistance - 1, 1);
  });

  it("should attack the target when in melee range and off cooldown", () => {
    const player = new Player();
    player.id = "player1";
    player.x = 5;
    player.y = 6; // In melee range
    state.players.set(player.id, player);

    const enemy = new Enemy();
    enemy.id = "enemy1";
    enemy.x = 5;
    enemy.y = 5;
    enemy.aiState = "ATTACKING";
    enemy.targetId = player.id;
    enemy.lastAttackTime = 0; // Ready to attack
    state.enemies.set(enemy.id, enemy);

    const now = Date.now();
    jest.spyOn(Date, "now").mockReturnValue(now);

    enemyAISystem.execute(16);

    expect(mockRoom.handleAttack).toHaveBeenCalledWith(enemy, player);
    expect(enemy.lastAttackTime).toBe(now);
  });

  it("should not attack if on cooldown", () => {
    const player = new Player();
    player.id = "player1";
    player.x = 5;
    player.y = 6;
    state.players.set(player.id, player);

    const enemy = new Enemy();
    enemy.id = "enemy1";
    enemy.x = 5;
    enemy.y = 5;
    enemy.aiState = "ATTACKING";
    enemy.targetId = player.id;
    // Set last attack time to be recent
    enemy.lastAttackTime = Date.now() - 1000;
    state.enemies.set(enemy.id, enemy);

    enemyAISystem.execute(16);

    expect(mockRoom.handleAttack).not.toHaveBeenCalled();
  });

  it("should return to IDLE state if the target moves out of aggression range", () => {
    const player = new Player();
    player.id = "player1";
    player.x = 20; // Out of range
    player.y = 20;
    state.players.set(player.id, player);

    const enemy = new Enemy();
    enemy.id = "enemy1";
    enemy.x = 5;
    enemy.y = 5;
    enemy.aiState = "ATTACKING";
    enemy.targetId = player.id;
    state.enemies.set(enemy.id, enemy);

    enemyAISystem.execute(16);

    expect(enemy.aiState).toBe("IDLE");
    expect(enemy.targetId).toBe("");
  });

  it("should return to IDLE state if the target dies", () => {
    const player = new Player();
    player.id = "player1";
    player.x = 5;
    player.y = 6;
    player.isDead = true; // Target is dead
    state.players.set(player.id, player);

    const enemy = new Enemy();
    enemy.id = "enemy1";
    enemy.x = 5;
    enemy.y = 5;
    enemy.aiState = "ATTACKING";
    enemy.targetId = player.id;
    state.enemies.set(enemy.id, enemy);

    enemyAISystem.execute(16);

    expect(enemy.aiState).toBe("IDLE");
    expect(enemy.targetId).toBe("");
  });
});
