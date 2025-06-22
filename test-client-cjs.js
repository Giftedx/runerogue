/**
 * @file Quick test client to verify enemy system integration (CommonJS)
 * @description Connects to the game server and verifies enemy spawning
 */

const Colyseus = require("colyseus");

async function testEnemySystem() {
  console.log("🎮 Connecting to game server...");

  try {
    const client = new Colyseus.Client("ws://localhost:2567");
    const room = await client.joinOrCreate("game", { name: "TestPlayer" });

    console.log("✅ Connected to game room:", room.id);
    console.log("👤 Session ID:", room.sessionId);

    console.log("📊 Initial state:");
    console.log("- Players:", room.state.players.size);
    console.log("- Enemies:", room.state.enemies.size);
    console.log("- Wave:", room.state.wave.number);

    // Listen for enemy spawns
    room.state.enemies.onAdd = (enemy, enemyId) => {
      console.log(
        `👹 Enemy spawned: ${enemyId} (${enemy.type}) at (${enemy.x}, ${enemy.y})`
      );
    };

    room.state.enemies.onChange = (enemy, enemyId) => {
      console.log(
        `🔄 Enemy updated: ${enemyId} at (${enemy.x}, ${enemy.y}) health: ${enemy.health}/${enemy.maxHealth}`
      );
    };

    room.state.enemies.onRemove = (enemy, enemyId) => {
      console.log(`💀 Enemy removed: ${enemyId}`);
    };

    // Listen for combat events
    room.onMessage("damage", (data) => {
      console.log("⚔️ Combat event:", data);
    });

    // Keep connection alive for testing
    console.log("⏳ Waiting for enemy spawning (15 seconds)...");
    setTimeout(() => {
      console.log("📊 Final state:");
      console.log("- Players:", room.state.players.size);
      console.log("- Enemies:", room.state.enemies.size);
      console.log("🔌 Disconnecting...");
      room.leave();
    }, 15000); // 15 seconds
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testEnemySystem();
