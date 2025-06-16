/**
 * OSRS Combat Test Client
 * Tests authentic OSRS combat mechanics and formulas
 */

const { Client } = require("colyseus.js");

class OSRSCombatTester {
  constructor() {
    this.client = null;
    this.room = null;
    this.players = new Map();
    this.sessionId = null;
  }

  async connect() {
    console.log("🔌 Connecting to Enhanced JsonGameRoom with OSRS Combat...");

    try {
      this.client = new Client("ws://localhost:3001");

      // Create player with specific combat stats for testing
      const testCombatStats = {
        attack: 60,
        strength: 60,
        defence: 45,
        hitpoints: 60,
        prayer: 30,
        ranged: 40,
        magic: 35,
      };

      this.room = await this.client.joinOrCreate("runerogue", {
        username: `CombatTester_${Math.floor(Math.random() * 1000)}`,
        combatStats: testCombatStats,
      });

      this.sessionId = this.room.sessionId;
      console.log(`✅ Connected as ${this.sessionId}`);

      this.setupEventHandlers();
    } catch (error) {
      console.error("❌ Connection failed:", error);
    }
  }

  setupEventHandlers() {
    // Handle full state
    this.room.onMessage("fullState", (gameState) => {
      console.log("📊 Full state received");
      console.log(`Players in game: ${gameState.playerCount}`);

      Object.values(gameState.players).forEach((player) => {
        this.players.set(player.id, player);
        if (player.id === this.sessionId) {
          console.log(
            `👤 Local Player: ${player.username} (CB: ${player.combatLevel})`
          );
          console.log(
            `📊 Stats: ATK:${player.combatStats.attack} STR:${player.combatStats.strength} DEF:${player.combatStats.defence} HP:${player.combatStats.hitpoints}`
          );
          console.log(`💚 Health: ${player.health}/${player.maxHealth}`);
        }
      });
    });

    // Handle player joined
    this.room.onMessage("playerJoined", (player) => {
      this.players.set(player.id, player);
      console.log(
        `👤 Player joined: ${player.username} (CB: ${player.combatLevel})`
      );
    });

    // Handle player left
    this.room.onMessage("playerLeft", (data) => {
      this.players.delete(data.sessionId);
      console.log(`👋 Player left: ${data.sessionId}`);
    });

    // Handle combat results - THIS IS THE KEY TEST
    this.room.onMessage("combatResult", (result) => {
      const attacker = this.players.get(result.attackerId);
      const defender = this.players.get(result.defenderId);

      console.log("\n⚔️ COMBAT RESULT:");
      console.log(
        `👊 Attacker: ${attacker?.username || "Unknown"} (${result.attackerId})`
      );
      console.log(
        `🛡️ Defender: ${defender?.username || "Unknown"} (${result.defenderId})`
      );
      console.log(`🎯 Hit: ${result.wasHit ? "YES" : "NO"}`);
      console.log(`💥 Damage: ${result.damage}/${result.maxHit}`);
      console.log(`🎲 Accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
      console.log(`💚 Defender Health: ${result.defenderHealth}`);
      console.log(
        `⏰ Timestamp: ${new Date(result.timestamp).toLocaleTimeString()}`
      );

      // Validate OSRS combat calculations
      this.validateCombatCalculations(result, attacker, defender);
    });

    // Handle health updates
    this.room.onMessage("playerHealthUpdate", (data) => {
      const player = this.players.get(data.sessionId);
      if (player) {
        player.health = data.health;
        player.maxHealth = data.maxHealth;
        console.log(
          `💚 ${player.username} health regenerated: ${data.health}/${data.maxHealth}`
        );
      }
    });

    // Handle player death
    this.room.onMessage("playerDeath", (data) => {
      const player = this.players.get(data.sessionId);
      console.log(
        `💀 ${player?.username || "Unknown"} died and respawned at (${data.respawnX}, ${data.respawnY})`
      );
    });

    // Handle combat errors
    this.room.onMessage("combatError", (error) => {
      console.log(`⚠️ Combat Error: ${error.message}`);
    });

    // Handle chat
    this.room.onMessage("chatMessage", (data) => {
      console.log(`💬 ${data.username}: ${data.message}`);
    });

    console.log("✅ Event handlers set up");
  }

  validateCombatCalculations(result, attacker, defender) {
    if (!attacker || !defender) {
      console.log("⚠️ Cannot validate: Missing player data");
      return;
    }

    console.log("\n🔍 VALIDATION:");

    // Check if max hit is reasonable for attacker's stats
    const expectedMaxHit = this.calculateExpectedMaxHit(
      attacker.combatStats,
      attacker.equipmentBonuses
    );
    const maxHitDiff = Math.abs(result.maxHit - expectedMaxHit);

    console.log(
      `📏 Expected Max Hit: ~${expectedMaxHit}, Actual: ${result.maxHit} (diff: ${maxHitDiff})`
    );

    // Check if accuracy is reasonable
    const expectedAccuracy = this.calculateExpectedAccuracy(
      attacker.combatStats,
      attacker.equipmentBonuses,
      defender.combatStats,
      defender.equipmentBonuses
    );
    const accuracyDiff = Math.abs(result.accuracy - expectedAccuracy);

    console.log(
      `🎯 Expected Accuracy: ~${(expectedAccuracy * 100).toFixed(1)}%, Actual: ${(result.accuracy * 100).toFixed(1)}% (diff: ${(accuracyDiff * 100).toFixed(1)}%)`
    );

    // Validate damage is within bounds
    if (result.wasHit && (result.damage < 0 || result.damage > result.maxHit)) {
      console.log(
        `❌ Invalid damage: ${result.damage} (should be 0-${result.maxHit})`
      );
    } else {
      console.log(`✅ Damage within valid range`);
    }

    console.log("");
  }

  calculateExpectedMaxHit(stats, equipment) {
    // Simplified OSRS max hit calculation
    const effectiveStrength = stats.strength + 8; // No prayer/style bonus for simplicity
    const maxHit = Math.floor(
      0.5 + (effectiveStrength * (equipment.strengthBonus + 64)) / 640
    );
    return maxHit;
  }

  calculateExpectedAccuracy(
    attackerStats,
    attackerEquipment,
    defenderStats,
    defenderEquipment
  ) {
    // Simplified OSRS accuracy calculation
    const effectiveAttack = attackerStats.attack + 8;
    const maxAttackRoll =
      effectiveAttack * (attackerEquipment.attackBonus + 64);

    const effectiveDefence = defenderStats.defence + 8;
    const maxDefenceRoll =
      effectiveDefence * (defenderEquipment.defenceBonus + 64);

    let accuracy;
    if (maxAttackRoll > maxDefenceRoll) {
      accuracy = 1 - (maxDefenceRoll + 2) / (2 * (maxAttackRoll + 1));
    } else {
      accuracy = maxAttackRoll / (2 * maxDefenceRoll + 1);
    }

    return Math.max(0, Math.min(1, accuracy));
  }

  async startCombatTest() {
    console.log("\n🧪 Starting Combat Test Sequence...");

    await this.sleep(2000); // Wait for connection to stabilize

    // Request current state
    this.room.send("requestState");

    await this.sleep(1000);

    // Find other players to attack
    const otherPlayers = Array.from(this.players.values()).filter(
      (p) => p.id !== this.sessionId
    );

    if (otherPlayers.length === 0) {
      console.log("⚠️ No other players found for combat testing");
      console.log(
        "💡 Open another browser tab at http://localhost:3001/combat to test PvP"
      );
      return;
    }

    console.log(
      `🎯 Found ${otherPlayers.length} other player(s) for combat testing`
    );

    // Test combat against each player
    for (const target of otherPlayers) {
      console.log(
        `\n⚔️ Testing combat against ${target.username} (CB: ${target.combatLevel})`
      );

      // Perform multiple attacks to test consistency
      for (let i = 0; i < 5; i++) {
        console.log(`🏹 Attack ${i + 1}/5 against ${target.username}`);
        this.room.send("attack", { targetSessionId: target.id });
        await this.sleep(2000); // Wait for attack cooldown
      }
    }

    console.log("\n✅ Combat test sequence completed");
  }

  async testMovement() {
    console.log("\n🚶 Testing movement system...");

    const positions = [
      { x: 50, y: 50 },
      { x: 100, y: 50 },
      { x: 100, y: 100 },
      { x: 50, y: 100 },
    ];

    for (const pos of positions) {
      console.log(`🎯 Moving to (${pos.x}, ${pos.y})`);
      this.room.send("move", pos);
      await this.sleep(1000);
    }

    console.log("✅ Movement test completed");
  }

  async testChat() {
    console.log("\n💬 Testing chat system...");

    const messages = [
      "Hello from OSRS Combat Tester!",
      "Testing authentic RuneScape combat mechanics",
      "Anyone want to PvP? 😈",
    ];

    for (const message of messages) {
      console.log(`📤 Sending: "${message}"`);
      this.room.send("chat", { message });
      await this.sleep(1500);
    }

    console.log("✅ Chat test completed");
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  disconnect() {
    if (this.room) {
      this.room.leave();
      console.log("👋 Disconnected from room");
    }
  }
}

// Run the test
async function runOSRSCombatTest() {
  console.log("🎮 RuneRogue OSRS Combat Integration Test");
  console.log("==========================================");

  const tester = new OSRSCombatTester();

  try {
    await tester.connect();
    await tester.testMovement();
    await tester.testChat();
    await tester.startCombatTest();

    // Keep connection alive for a while to observe behavior
    console.log(
      "\n⏳ Keeping connection alive for 60 seconds to observe behavior..."
    );
    await tester.sleep(60000);
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    tester.disconnect();
    process.exit(0);
  }
}

// Auto-start if run directly
if (require.main === module) {
  runOSRSCombatTest();
}

module.exports = { OSRSCombatTester };
