/**
 * Detailed enemy system test client for RuneRogue
 * Tests enemy spawning, movement, and combat with full logging
 */

const { Client } = require("colyseus.js");

async function testEnemySystem() {
  console.log("🎮 Starting detailed enemy system test...");

  const client = new Client("ws://localhost:2567");

  try {
    const room = await client.joinOrCreate("test", { name: "TestPlayer" });
    console.log(`✅ Connected to test room: ${room.id}`);
    console.log(`👤 Session ID: ${room.sessionId}`);

    // Log initial state
    room.onStateChange.once((state) => {
      console.log("📊 Initial state received:");
      console.log(`- Players: ${state.players.size}`);
      console.log(`- Enemies: ${state.enemies.size}`);
      console.log(`- Wave: ${state.waveNumber}`);

      // Log player info
      state.players.forEach((player, playerId) => {
        console.log(
          `  Player ${playerId}: pos(${player.x.toFixed(1)}, ${player.y.toFixed(1)}) hp=${player.health}/${player.maxHealth}`
        );
      });

      // Log enemy info
      state.enemies.forEach((enemy, enemyId) => {
        console.log(
          `  Enemy ${enemyId}: ${enemy.enemyType} pos(${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) hp=${enemy.health}/${enemy.maxHealth} stats[atk=${enemy.attack}, str=${enemy.strength}, def=${enemy.defence}]`
        );
      });
    });

    // Monitor enemy additions
    room.state.enemies.onAdd((enemy, enemyId) => {
      console.log(
        `🆕 Enemy added: ${enemyId} (${enemy.enemyType}) at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)})`
      );
    });

    // Monitor enemy changes (movement, health)
    room.state.enemies.onChange((enemy, enemyId) => {
      console.log(
        `🔄 Enemy updated: ${enemyId} pos(${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) hp=${enemy.health}/${enemy.maxHealth} state=${enemy.state}`
      );
    });

    // Monitor enemy removals
    room.state.enemies.onRemove((enemy, enemyId) => {
      console.log(`💀 Enemy removed: ${enemyId} (${enemy.enemyType})`);
    });

    // Monitor combat messages
    room.onMessage("combat", (data) => {
      console.log(`⚔️  Combat: ${data.type} - ${JSON.stringify(data)}`);
    });

    // Monitor player respawn
    room.onMessage("playerRespawn", (data) => {
      console.log(`🔄 Player respawned: ${data.playerId}`);
    });

    // Send some movement commands to trigger enemy AI
    setTimeout(() => {
      console.log("📤 Moving player to trigger enemy AI...");
      room.send("move", { x: 400, y: 300 });
    }, 2000);

    setTimeout(() => {
      console.log("📤 Moving player again...");
      room.send("move", { x: 100, y: 100 });
    }, 5000);

    // Test attack after 8 seconds
    setTimeout(() => {
      if (room.state.enemies.size > 0) {
        const firstEnemyId = Array.from(room.state.enemies.keys())[0];
        console.log(`📤 Attacking enemy: ${firstEnemyId}`);
        room.send("attack", { targetId: firstEnemyId });
      }
    }, 8000);

    // Show state summary every 5 seconds
    const summaryInterval = setInterval(() => {
      console.log(`\n📊 Current state summary:`);
      console.log(`- Players: ${room.state.players.size}`);
      console.log(`- Enemies: ${room.state.enemies.size}`);
      console.log(`- Wave: ${room.state.waveNumber}`);
      console.log(`- Enemies killed: ${room.state.enemiesKilled}`);

      // List active enemies
      room.state.enemies.forEach((enemy, enemyId) => {
        console.log(
          `  ${enemyId}: ${enemy.enemyType} at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) hp=${enemy.health}/${enemy.maxHealth}`
        );
      });
      console.log("");
    }, 5000);

    // Keep connection open for testing
    console.log("⏳ Testing for 30 seconds...");
    setTimeout(() => {
      clearInterval(summaryInterval);
      console.log("✅ Test completed successfully!");
      room.leave();
    }, 30000);
  } catch (error) {
    console.error("❌ Failed to connect:", error);
  }
}

testEnemySystem().catch(console.error);
