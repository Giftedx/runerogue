/**
 * @file DeathSystem.test.ts
 * @description Test suite for the DeathSystem.
 * @author Your Name
 */

import { GameState, Player, Enemy } from "../../schemas/GameState";
import { DeathSystem } from "./DeathSystem";
import { GameRoom } from "../../../server/rooms/RuneRogueGameRoom";

// A simplified mock of the GameRoom for testing purposes
const mockRoom = {
  state: new GameState(),
  broadcast: jest.fn(),
};

describe("DeathSystem", () => {
  let deathSystem: DeathSystem;
  let state: GameState;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    state = new GameState();
    // We cast to `any` then to `GameRoom` to satisfy TypeScript's type system
    // with our simplified mock object.
    deathSystem = new DeathSystem(state, mockRoom as any as GameRoom);
    state.gameStarted = true;
    state.enemiesKilled = 0;
    mockRoom.broadcast.mockClear();
  });

  describe("Player Death", () => {
    it("should mark a player as dead when health is zero or less", () => {
      const player = new Player();
      player.id = "player1";
      player.health = 0;
      state.players.set(player.id, player);

      deathSystem.execute(16); // delta time doesn't matter here

      expect(player.isDead).toBe(true);
      expect(mockRoom.broadcast).toHaveBeenCalledWith("entityDied", {
        entityId: player.id,
        isPlayer: true,
      });
    });

    it("should not process a player who is already dead", () => {
      const player = new Player();
      player.id = "player1";
      player.health = 0;
      player.isDead = true;
      state.players.set(player.id, player);

      deathSystem.execute(16);

      // Broadcast should not be called again for an already dead player
      expect(mockRoom.broadcast).not.toHaveBeenCalled();
    });

    it("should respawn a player after the respawn timer", () => {
      const player = new Player();
      player.id = "player1";
      player.health = 0;
      player.maxHealth = 50;
      state.players.set(player.id, player);

      deathSystem.execute(16);

      expect(player.isDead).toBe(true);

      // Fast-forward time by 5 seconds
      jest.advanceTimersByTime(5000);

      expect(player.isDead).toBe(false);
      expect(player.health).toBe(player.maxHealth);
      expect(player.x).toBe(0); // Should respawn at the starting location
      expect(player.y).toBe(0);
    });
  });

  describe("Enemy Death", () => {
    it("should mark an enemy as not alive and increment enemiesKilled count", () => {
      const enemy = new Enemy();
      enemy.id = "enemy1";
      enemy.health = 0;
      state.enemies.set(enemy.id, enemy);

      deathSystem.execute(16);

      expect(enemy.alive).toBe(false);
      expect(state.enemiesKilled).toBe(1);
      expect(mockRoom.broadcast).toHaveBeenCalledWith("entityDied", {
        entityId: enemy.id,
        isPlayer: false,
      });
    });

    it("should remove an enemy from the game state after a delay", () => {
      const enemy = new Enemy();
      enemy.id = "enemy1";
      enemy.health = 0;
      state.enemies.set(enemy.id, enemy);

      deathSystem.execute(16);

      expect(state.enemies.has(enemy.id)).toBe(true);

      // Fast-forward time by 1 second for the removal delay
      jest.advanceTimersByTime(1000);

      expect(state.enemies.has(enemy.id)).toBe(false);
    });

    it("should not process an enemy that is already marked as not alive", () => {
      const enemy = new Enemy();
      enemy.id = "enemy1";
      enemy.health = 0;
      enemy.alive = false;
      state.enemies.set(enemy.id, enemy);

      deathSystem.execute(16);

      expect(mockRoom.broadcast).not.toHaveBeenCalled();
      // The kill count should not be incremented again
      expect(state.enemiesKilled).toBe(0);
    });
  });
});
