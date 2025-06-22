/**
 * @file Quick test client to verify enemy system integration
 * @description Connects to the game server and verifies enemy spawning
 */

import * as Colyseus from "colyseus.js";

async function testEnemySystem() {
  console.log("🎮 Connecting to game server...");

  try {
    const client = new Colyseus.Client("ws://localhost:2567");
    const room = await client.joinOrCreate("game");

    console.log("✅ Connected to game room:", room.id);
    console.log("👤 Session ID:", room.sessionId);

    // Listen for state changes
    room.onStateChange((state) => {
      console.log("🔄 State updated:", {
        playersCount: state.players.size,
        enemiesCount: state.enemies ? state.enemies.size : 0,
        waveNumber: state.wave ? state.wave.number : 0,
      });
    });

    // Listen for enemy spawns
    room.onMessage("damage", (data) => {
      console.log("⚔️ Combat event:", data);
    });

    // Keep connection alive for testing
    setTimeout(() => {
      console.log("🔌 Disconnecting...");
      room.leave();
    }, 30000); // 30 seconds
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testEnemySystem();
