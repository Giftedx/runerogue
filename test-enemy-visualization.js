/**
 * Enhanced test client that shows real-time enemy and player state
 */

const colyseus = require("colyseus.js");

async function testEnemyVisualization() {
  console.log("🎮 Starting RuneRogue Enemy System Test...");

  try {
    const client = new colyseus.Client("ws://localhost:2567");
    const room = await client.joinOrCreate("test", {
      name: "VisualTestPlayer",
    });

    console.log("✅ Connected to test room:", room.id);
    console.log("👤 Session ID:", room.sessionId);

    // Wait for state to be initialized
    await new Promise((resolve) => {
      const checkState = () => {
        if (room.state && room.state.players && room.state.enemies) {
          console.log("📊 State initialized");
          console.log("- Players:", room.state.players.size);
          console.log("- Enemies:", room.state.enemies.size);
          resolve();
        } else {
          setTimeout(checkState, 100);
        }
      };
      checkState();
    });

    // Display initial state
    console.log("\n=== INITIAL STATE ===");
    room.state.players.forEach((player, playerId) => {
      console.log(
        `👤 Player ${playerId}: pos(${player.x}, ${player.y}) hp:${player.health}/${player.maxHealth}`
      );
    });

    room.state.enemies.forEach((enemy, enemyId) => {
      console.log(
        `👹 Enemy ${enemyId} (${enemy.enemyType}): pos(${enemy.x}, ${enemy.y}) hp:${enemy.health}/${enemy.maxHealth} atk:${enemy.attack} str:${enemy.strength} def:${enemy.defence} state:${enemy.state}`
      );
    });

    // Listen for player changes
    room.state.players.onAdd = (player, playerId) => {
      console.log(
        `\n🆕 Player ${playerId} joined at (${player.x}, ${player.y})`
      );
    };

    room.state.players.onChange = (player, playerId) => {
      console.log(
        `🔄 Player ${playerId} updated: pos(${player.x}, ${player.y}) hp:${player.health}/${player.maxHealth}`
      );
    };

    room.state.players.onRemove = (player, playerId) => {
      console.log(`👋 Player ${playerId} left`);
    };

    // Listen for enemy changes
    room.state.enemies.onAdd = (enemy, enemyId) => {
      console.log(
        `\n🆕 Enemy spawned: ${enemyId} (${enemy.enemyType}) at (${enemy.x}, ${enemy.y})`
      );
    };

    room.state.enemies.onChange = (enemy, enemyId) => {
      console.log(
        `🔄 Enemy ${enemyId} updated: pos(${enemy.x}, ${enemy.y}) hp:${enemy.health}/${enemy.maxHealth} state:${enemy.state}`
      );
    };

    room.state.enemies.onRemove = (enemy, enemyId) => {
      console.log(`💀 Enemy ${enemyId} was killed`);
    };

    // Listen for messages
    room.onMessage("combat", (message) => {
      console.log(`⚔️  COMBAT: ${message.text || JSON.stringify(message)}`);
    });

    room.onMessage("*", (type, message) => {
      if (type !== "combat") {
        console.log(`📨 Message [${type}]:`, message);
      }
    });

    // Test movement
    setTimeout(() => {
      console.log("\n📤 Testing movement...");
      room.send("move", { x: 100, y: 100 });
    }, 2000);

    setTimeout(() => {
      room.send("move", { x: 200, y: 200 });
    }, 4000);

    setTimeout(() => {
      room.send("move", { x: 300, y: 300 });
    }, 6000);

    // Display periodic state summaries
    const stateInterval = setInterval(() => {
      console.log("\n=== STATE SUMMARY ===");
      console.log(
        `Players: ${room.state.players.size}, Enemies: ${room.state.enemies.size}`
      );

      if (room.state.players.size > 0) {
        room.state.players.forEach((player, playerId) => {
          console.log(
            `  👤 ${playerId}: (${player.x}, ${player.y}) hp:${player.health}/${player.maxHealth}`
          );
        });
      }

      if (room.state.enemies.size > 0) {
        room.state.enemies.forEach((enemy, enemyId) => {
          console.log(
            `  👹 ${enemyId}: (${enemy.x}, ${enemy.y}) hp:${enemy.health}/${enemy.maxHealth} ${enemy.state}`
          );
        });
      }
    }, 5000);

    // Keep connection alive for testing
    console.log("\n⏳ Running test for 30 seconds...");
    setTimeout(() => {
      clearInterval(stateInterval);
      console.log("\n📊 Test completed!");
      console.log("🔌 Disconnecting...");
      room.leave();
    }, 30000);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testEnemyVisualization();
