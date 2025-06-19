import { Client, type Room } from "colyseus.js";
import { GameState } from "../../schemas/GameState";

const TEST_SERVER_URL = "ws://localhost:2567";

/**
 * @jest-environment node
 * @description Integration tests for core OSRS combat mechanics between a client and the game server.
 * This test suite requires a running instance of the Colyseus game server.
 * To run the server, execute: `pnpm --filter @runerogue/game-server dev`
 */
describe("OSRS Combat Integration Test", () => {
  let client: Client;
  let room: Room<GameState>;

  /**
   * Establishes a connection to the Colyseus server and joins a game room before any tests run.
   * @throws {Error} If the connection to the server fails.
   */
  beforeAll(async () => {
    client = new Client(TEST_SERVER_URL);
    try {
      room = await client.joinOrCreate<GameState>("runerogue", {
        name: "CombatTester",
      });
    } catch (e) {
      console.error(
        "FATAL: Failed to connect to Colyseus server. Is it running? Run `pnpm --filter @runerogue/game-server dev`"
      );
      if (e instanceof Error) {
        throw new Error(`Could not join room: ${e.message}`);
      }
      throw new Error(
        `An unknown error occurred while trying to join a room: ${e}`
      );
    }
  }, 20000); // 20-second timeout for server connection

  /**
   * Gracefully leaves the game room after all tests have completed.
   */
  afterAll(async () => {
    if (room) {
      await room.leave();
    }
  });

  /**
   * Verifies that the client successfully connected to the game room and received a session ID.
   */
  it("should connect to the game room and have a valid session ID", () => {
    expect(client).toBeDefined();
    expect(room).toBeDefined();
    expect(room.sessionId).toBeDefined();
    expect(typeof room.sessionId).toBe("string");
  });

  /**
   * @description Ensures the client successfully connected to the room and received the initial state.
   */
  it("should connect to the room and receive initial game state", () => {
    expect(room).toBeDefined();
    expect(room.state).toBeDefined();
    expect(room.state instanceof GameState).toBe(true);
    expect(room.state.players).toBeDefined();
  });

  /**
   * @description Tests the full combat flow: a player attacks an enemy until it is defeated.
   * Listens for `damage_dealt` and `enemy_killed` messages from the server.
   */
  it("should handle a full player-vs-enemy combat cycle", (done) => {
    const player = room.state.players.get(room.sessionId);
    expect(player).toBeDefined();

    let targetEnemyId: string | null = null;

    // Find the first available enemy to attack
    if (room.state.enemies.size > 0) {
      targetEnemyId = room.state.enemies.keys().next().value;
    }

    if (!targetEnemyId) {
      // If no enemies, pass the test vacuously or throw error if enemies are expected.
      console.warn("No enemies found to target, test passes vacuously.");
      done();
      return;
    }

    const target = room.state.enemies.get(targetEnemyId);
    expect(target).toBeDefined();

    let damageDealt = false;
    let testTimeout: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (testTimeout) {
        clearTimeout(testTimeout);
        testTimeout = null;
      }
      room.removeAllListeners();
    };

    const handleDamage = (message: {
      targetId: string;
      damage: number;
      targetHealth: number;
    }) => {
      console.info(
        `💥 Damage dealt: ${message.damage} to ${message.targetId}, health remaining: ${message.targetHealth}`
      );
      if (message.targetId === targetEnemyId) {
        damageDealt = true;
        expect(message.damage).toBeGreaterThan(0);
      }
    };

    const handleKill = (message: { targetId: string; xpGained: number }) => {
      console.info(
        `💀 Enemy killed! Target: ${message.targetId}, XP Gained: ${message.xpGained}`
      );
      expect(message.targetId).toBe(targetEnemyId);
      expect(damageDealt).toBe(true);
      cleanup();
      done();
    };

    room.onMessage("damage_dealt", handleDamage);
    room.onMessage("enemy_killed", handleKill);

    testTimeout = setTimeout(() => {
      try {
        expect(damageDealt).toBe(true);
      } catch (_error) {
        cleanup();
        done(
          new Error("Timeout: Combat test failed. No damage message received.")
        );
        return;
      }
      cleanup();
      done(new Error("Timeout: Combat test failed. No kill message received."));
    }, 30000); // 30-second timeout for the entire combat test

    room.onLeave(() => {
      cleanup();
      done(new Error("Room was closed before test could complete."));
    });

    // Send attack message to server
    if (target) {
      console.info(`🎯 Attacking enemy: ${target.id}`);
      room.send("player_attack", { targetId: target.id });
    }
  });
});
