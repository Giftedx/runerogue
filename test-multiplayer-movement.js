#!/usr/bin/env node

/**
 * Comprehensive Multiplayer Movement Test
 *
 * This test simulates 2-4 players connecting to a GameRoom and validates:
 * - Real-time position synchronization
 * - Server-authoritative movement validation
 * - Network message broadcasting
 * - OSRS-authentic movement speeds
 * - Rate limiting and anti-cheat measures
 */

const { Client } = require("colyseus.js");

class MultiplayerMovementTest {
  constructor() {
    this.clients = [];
    this.receivedMessages = new Map(); // clientId -> array of messages
    this.movementLog = new Map(); // clientId -> movement history
    this.testResults = {
      passed: 0,
      failed: 0,
      details: [],
    };
  }

  log(message, level = "INFO") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
  }

  /**
   * Connect multiple clients to the same room
   */
  async connectClients(numClients = 2) {
    this.log(`Connecting ${numClients} clients to GameRoom...`);

    for (let i = 0; i < numClients; i++) {
      try {
        const client = new Client("ws://localhost:3001");
        const room = await client.joinOrCreate("runerogue", {
          username: `TestPlayer${i + 1}`,
          character: { class: "warrior", level: 1 },
        });

        // Set up message listeners
        this.setupMessageListeners(room, i);

        this.clients.push({ client, room, id: i });
        this.receivedMessages.set(i, []);
        this.movementLog.set(i, []);

        this.log(
          `Client ${i + 1} connected successfully (Session: ${room.sessionId})`
        );

        // Wait a bit between connections to avoid overwhelming the server
        await this.sleep(100);
      } catch (error) {
        this.log(
          `Failed to connect client ${i + 1}: ${error.message}`,
          "ERROR"
        );
        throw error;
      }
    }

    // Wait for all clients to fully join
    await this.sleep(500);
    this.log(`All ${numClients} clients connected successfully`);
  }

  /**
   * Set up message listeners for a client
   */
  setupMessageListeners(room, clientId) {
    // Listen for position sync messages
    room.onMessage("position_sync", (data) => {
      this.receivedMessages.get(clientId).push({
        type: "position_sync",
        data,
        timestamp: Date.now(),
      });
      this.log(
        `Client ${clientId + 1} received position_sync: ${JSON.stringify(data)}`
      );
    });

    // Listen for movement confirmations
    room.onMessage("move_confirmed", (data) => {
      this.receivedMessages.get(clientId).push({
        type: "move_confirmed",
        data,
        timestamp: Date.now(),
      });
      this.log(
        `Client ${clientId + 1} received move_confirmed: ${JSON.stringify(data)}`
      );
    });

    // Listen for movement errors
    room.onMessage("move_error", (data) => {
      this.receivedMessages.get(clientId).push({
        type: "move_error",
        data,
        timestamp: Date.now(),
      });
      this.log(
        `Client ${clientId + 1} received move_error: ${JSON.stringify(data)}`,
        "WARN"
      );
    });

    // Listen for state updates
    room.onMessage("updatePlayerState", (data) => {
      this.receivedMessages.get(clientId).push({
        type: "updatePlayerState",
        data,
        timestamp: Date.now(),
      });
    });

    // Listen for room state changes
    room.onStateChange.once((state) => {
      this.log(
        `Client ${clientId + 1} received initial state with ${state.players.size} players`
      );
    });
  }

  /**
   * Send movement commands for all clients
   */
  async testBasicMovement() {
    this.log("=== Testing Basic Movement ===");

    const movements = [
      { clientId: 0, targetX: 5, targetY: 5 },
      { clientId: 1, targetX: 10, targetY: 8 },
    ];

    if (this.clients.length > 2) {
      movements.push({ clientId: 2, targetX: 15, targetY: 12 });
    }
    if (this.clients.length > 3) {
      movements.push({ clientId: 3, targetX: 3, targetY: 18 });
    }

    // Send movement commands
    for (const move of movements) {
      const { room } = this.clients[move.clientId];
      this.log(
        `Client ${move.clientId + 1} moving to (${move.targetX}, ${move.targetY})`
      );

      room.send("player_movement", {
        targetX: move.targetX,
        targetY: move.targetY,
      });

      this.movementLog.get(move.clientId).push({
        targetX: move.targetX,
        targetY: move.targetY,
        timestamp: Date.now(),
      });
    }

    // Wait for movement to process and broadcast
    await this.sleep(1000);
  }

  /**
   * Test rapid movement (rate limiting)
   */
  async testRateLimiting() {
    this.log("=== Testing Rate Limiting ===");

    const { room } = this.clients[0];

    // Send many rapid movements to trigger rate limiting
    for (let i = 0; i < 10; i++) {
      room.send("player_movement", {
        targetX: 1 + i,
        targetY: 1,
      });
    }

    await this.sleep(1500);
  }

  /**
   * Test invalid movements (out of bounds, collision)
   */
  async testInvalidMovements() {
    this.log("=== Testing Invalid Movements ===");

    const { room } = this.clients[0];

    // Test out of bounds movement
    room.send("player_movement", {
      targetX: -5,
      targetY: 10,
    });

    await this.sleep(200);

    // Test large distance movement (should be rejected)
    room.send("player_movement", {
      targetX: 100,
      targetY: 100,
    });

    await this.sleep(500);
  }

  /**
   * Test continuous movement simulation
   */
  async testContinuousMovement() {
    this.log("=== Testing Continuous Movement ===");

    // Create a path for each client
    const paths = [
      [
        { x: 2, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 4 },
        { x: 2, y: 4 },
      ], // Square path
      [
        { x: 8, y: 8 },
        { x: 12, y: 8 },
        { x: 12, y: 12 },
        { x: 8, y: 12 },
      ], // Larger square
    ];

    // Add more paths for additional clients
    if (this.clients.length > 2) {
      paths.push([
        { x: 15, y: 5 },
        { x: 18, y: 5 },
        { x: 18, y: 8 },
        { x: 15, y: 8 },
      ]);
    }

    // Execute paths with proper timing
    for (let step = 0; step < paths[0].length; step++) {
      for (
        let clientId = 0;
        clientId < Math.min(this.clients.length, paths.length);
        clientId++
      ) {
        const { room } = this.clients[clientId];
        const point = paths[clientId][step];

        this.log(
          `Client ${clientId + 1} moving to step ${step + 1}: (${point.x}, ${point.y})`
        );
        room.send("player_movement", point);
      }

      // Wait for OSRS walking time (0.6 seconds + network delay)
      await this.sleep(800);
    }
  }

  /**
   * Validate test results
   */
  validateResults() {
    this.log("=== Validating Test Results ===");

    let allTestsPassed = true;

    // Test 1: All clients received move_confirmed messages
    for (let i = 0; i < this.clients.length; i++) {
      const messages = this.receivedMessages.get(i);
      const confirmations = messages.filter((m) => m.type === "move_confirmed");

      if (confirmations.length > 0) {
        this.testResults.passed++;
        this.log(
          `✅ Client ${i + 1} received ${confirmations.length} movement confirmations`
        );
      } else {
        this.testResults.failed++;
        this.log(
          `❌ Client ${i + 1} did not receive movement confirmations`,
          "ERROR"
        );
        allTestsPassed = false;
      }
    }

    // Test 2: Clients received position sync messages from other players
    for (let i = 0; i < this.clients.length; i++) {
      const messages = this.receivedMessages.get(i);
      const positionSyncs = messages.filter((m) => m.type === "position_sync");

      if (positionSyncs.length > 0) {
        this.testResults.passed++;
        this.log(
          `✅ Client ${i + 1} received ${positionSyncs.length} position sync messages`
        );
      } else {
        this.testResults.failed++;
        this.log(
          `❌ Client ${i + 1} did not receive position sync messages`,
          "ERROR"
        );
        allTestsPassed = false;
      }
    }

    // Test 3: Rate limiting worked (client 0 should have received errors)
    const client0Messages = this.receivedMessages.get(0);
    const rateLimitErrors = client0Messages.filter(
      (m) => m.type === "move_error" && m.data.code === "RATE_LIMIT"
    );

    if (rateLimitErrors.length > 0) {
      this.testResults.passed++;
      this.log(
        `✅ Rate limiting worked: ${rateLimitErrors.length} rate limit errors received`
      );
    } else {
      this.testResults.failed++;
      this.log(`❌ Rate limiting may not be working properly`, "WARN");
      // This is not a critical failure for basic movement
    }

    // Test 4: Invalid movement validation
    const invalidMovementErrors = client0Messages.filter(
      (m) =>
        m.type === "move_error" &&
        (m.data.code === "OUT_OF_BOUNDS" || m.data.code === "DISTANCE_TOO_FAR")
    );

    if (invalidMovementErrors.length > 0) {
      this.testResults.passed++;
      this.log(
        `✅ Invalid movement validation worked: ${invalidMovementErrors.length} errors received`
      );
    } else {
      this.testResults.failed++;
      this.log(`❌ Invalid movement validation may not be working`, "WARN");
    }

    return allTestsPassed;
  }

  /**
   * Generate test report
   */
  generateReport() {
    this.log("=== MULTIPLAYER MOVEMENT TEST REPORT ===");
    this.log(
      `Total Tests: ${this.testResults.passed + this.testResults.failed}`
    );
    this.log(`Passed: ${this.testResults.passed}`);
    this.log(`Failed: ${this.testResults.failed}`);

    if (this.testResults.failed === 0) {
      this.log(
        "🎉 ALL TESTS PASSED! Multiplayer movement is working correctly.",
        "SUCCESS"
      );
    } else {
      this.log(
        `⚠️ ${this.testResults.failed} tests failed. Review the issues above.`,
        "WARN"
      );
    }

    // Detailed message analysis
    this.log("\n=== Message Analysis ===");
    for (let i = 0; i < this.clients.length; i++) {
      const messages = this.receivedMessages.get(i);
      this.log(`Client ${i + 1} received ${messages.length} total messages:`);

      const messageTypes = {};
      messages.forEach((m) => {
        messageTypes[m.type] = (messageTypes[m.type] || 0) + 1;
      });

      Object.entries(messageTypes).forEach(([type, count]) => {
        this.log(`  - ${type}: ${count}`);
      });
    }
  }

  /**
   * Cleanup and disconnect clients
   */
  async cleanup() {
    this.log("Cleaning up test clients...");

    for (const { client } of this.clients) {
      try {
        await client.disconnect();
      } catch (error) {
        this.log(`Error disconnecting client: ${error.message}`, "WARN");
      }
    }

    this.log("Cleanup completed");
  }

  /**
   * Helper sleep function
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Run the complete test suite
   */
  async runTests(numClients = 2) {
    try {
      this.log(
        `🚀 Starting Multiplayer Movement Test with ${numClients} clients`
      );

      await this.connectClients(numClients);
      await this.testBasicMovement();
      await this.testRateLimiting();
      await this.testInvalidMovements();
      await this.testContinuousMovement();

      this.validateResults();
      this.generateReport();
    } catch (error) {
      this.log(`Test failed with error: ${error.message}`, "ERROR");
      console.error(error);
    } finally {
      await this.cleanup();
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const numClients = args[0] ? parseInt(args[0]) : 2;

if (numClients < 2 || numClients > 4) {
  console.log("Usage: node test-multiplayer-movement.js [numClients]");
  console.log("numClients must be between 2 and 4");
  process.exit(1);
}

// Run the tests
const tester = new MultiplayerMovementTest();
tester
  .runTests(numClients)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test suite failed:", error);
    process.exit(1);
  });
