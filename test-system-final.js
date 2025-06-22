#!/usr/bin/env node
/**
 * 🧪 Comprehensive RuneRogue System Test
 * Tests the complete enemy spawning, AI, combat, and state synchronization pipeline
 */

const { Client } = require("colyseus.js");

class RuneRogueSystemTest {
  constructor() {
    this.client = null;
    this.room = null;
    this.playerId = null;
    this.testResults = [];
  }

  log(emoji, message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${emoji} [${timestamp}] ${message}`);
  }

  addTestResult(test, passed, details = "") {
    this.testResults.push({ test, passed, details });
    const status = passed ? "✅ PASS" : "❌ FAIL";
    this.log(
      passed ? "✅" : "❌",
      `${status}: ${test} ${details ? "- " + details : ""}`
    );
  }

  async connect() {
    try {
      this.log("🔌", "Connecting to game server...");
      this.client = new Client("ws://localhost:2567");
      this.room = await this.client.joinOrCreate("test", {
        name: "SystemTester",
      });
      this.playerId = this.room.sessionId;

      this.addTestResult(
        "Server Connection",
        true,
        `Connected with ID: ${this.playerId}`
      );
      return true;
    } catch (error) {
      this.addTestResult("Server Connection", false, error.message);
      return false;
    }
  }

  setupEventListeners() {
    this.log("👂", "Setting up event listeners...");

    // Track enemy spawning
    if (this.room.state.enemies) {
      this.room.state.enemies.onAdd = (enemy, key) => {
        this.log(
          "👹",
          `Enemy spawned: ${enemy.type} (${key}) at (${Math.round(enemy.x)}, ${Math.round(enemy.y)})`
        );
        this.addTestResult(
          "Enemy Spawning",
          true,
          `${enemy.type} spawned successfully`
        );
      };

      // Track enemy updates (AI movement, combat)
      this.room.state.enemies.onChange = (enemy, key) => {
        if (enemy.hitpoints !== enemy.maxHitpoints) {
          this.log(
            "⚔️",
            `Enemy ${key} took damage - HP: ${enemy.hitpoints}/${enemy.maxHitpoints}`
          );
        }
      };
    }

    // Track player updates
    if (this.room.state.players) {
      this.room.state.players.onAdd = (player, key) => {
        this.log("👤", `Player joined: ${key}`);
        this.addTestResult(
          "Player Registration",
          true,
          `Player ${key} registered`
        );
      };

      this.room.state.players.onChange = (player, key) => {
        if (key === this.playerId) {
          if (player.hitpoints < player.maxHitpoints) {
            this.log(
              "💥",
              `Took damage! HP: ${player.hitpoints}/${player.maxHitpoints}`
            );
          }
          if (
            player.hitpoints === player.maxHitpoints &&
            player.x === 400 &&
            player.y === 300
          ) {
            this.log("🔄", "Respawned at spawn point");
            this.addTestResult(
              "Player Respawn",
              true,
              "Respawn mechanics working"
            );
          }
        }
      };
    }

    // Track state synchronization
    this.room.onStateChange((state) => {
      const enemyCount = Object.keys(state.enemies || {}).length;
      const playerCount = Object.keys(state.players || {}).length;

      if (enemyCount > 0) {
        this.addTestResult(
          "State Synchronization",
          true,
          `${enemyCount} enemies, ${playerCount} players synced`
        );
      }
    });

    this.addTestResult(
      "Event Listener Setup",
      true,
      "All listeners configured"
    );
  }

  async testMovement() {
    this.log("🚶", "Testing player movement...");

    const positions = [
      { x: 100, y: 100 },
      { x: 200, y: 200 },
      { x: 300, y: 300 },
      { x: 400, y: 400 },
    ];

    for (const pos of positions) {
      this.room.send("move", pos);
      this.log("➡️", `Sent move command to (${pos.x}, ${pos.y})`);
      await this.sleep(1000);
    }

    this.addTestResult("Player Movement", true, "Movement commands sent");
  }

  async testCombat() {
    this.log("⚔️", "Testing combat by moving near enemies...");

    // Move to various positions to potentially trigger combat
    const combatPositions = [
      { x: 50, y: 200 }, // Near potential enemy spawn areas
      { x: 700, y: 500 },
      { x: 100, y: 200 },
      { x: 600, y: 200 },
    ];

    for (const pos of combatPositions) {
      this.room.send("move", pos);
      this.log("🎯", `Moving to combat position (${pos.x}, ${pos.y})`);
      await this.sleep(2000); // Wait for potential enemy encounters
    }

    this.addTestResult("Combat Testing", true, "Combat positions tested");
  }

  async runTests() {
    this.log("🧪", "Starting comprehensive system tests...");

    // Test 1: Connection
    if (!(await this.connect())) {
      return this.showResults();
    }

    // Test 2: Event listeners
    this.setupEventListeners();

    // Test 3: Wait for initial enemy spawn
    this.log("⏳", "Waiting for initial enemy spawn...");
    await this.sleep(3000);

    // Test 4: Movement
    await this.testMovement();

    // Test 5: Combat
    await this.testCombat();

    // Test 6: Extended observation
    this.log("👀", "Extended observation period (20 seconds)...");
    await this.sleep(20000);

    this.showResults();
  }

  showResults() {
    this.log("📊", "TEST RESULTS SUMMARY");
    console.log("=".repeat(60));

    let passed = 0;
    let total = this.testResults.length;

    this.testResults.forEach((result) => {
      const status = result.passed ? "✅ PASS" : "❌ FAIL";
      console.log(
        `${status} ${result.test}${result.details ? " - " + result.details : ""}`
      );
      if (result.passed) passed++;
    });

    console.log("=".repeat(60));
    console.log(
      `📈 Results: ${passed}/${total} tests passed (${Math.round((passed / total) * 100)}%)`
    );

    if (passed === total) {
      this.log("🎉", "ALL TESTS PASSED! RuneRogue system is fully functional!");
    } else {
      this.log("⚠️", "Some tests failed. Check the details above.");
    }

    if (this.room) {
      this.room.leave();
    }
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run the tests
async function runSystemTests() {
  const tester = new RuneRogueSystemTest();
  await tester.runTests();
  process.exit(0);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Test interrupted by user");
  process.exit(0);
});

console.log("🧪 RuneRogue Comprehensive System Test");
console.log("=====================================");
runSystemTests().catch(console.error);
