/**
 * Comprehensive test client for JSON-based multiplayer state synchronization
 */

const { Client } = require("colyseus.js");

async function testJsonMultiplayer() {
  console.log("🎮 Testing JSON-based multiplayer state synchronization...");

  try {
    const client = new Client("ws://localhost:3001");

    console.log("💻 Connecting to room...");
    const room = await client.joinOrCreate("runerogue", {
      username: "TestPlayer",
    });

    console.log("✅ Connected to room:", room.sessionId);

    // Listen for full state
    room.onMessage("fullState", (state) => {
      console.log("🌍 Full state received:");
      console.log(`  Tick: ${state.tick}`);
      console.log(`  Timestamp: ${state.timestamp}`);
      console.log(`  Player Count: ${state.playerCount}`);
      console.log(`  Players:`, Object.keys(state.players).length);

      // Log player details
      Object.values(state.players).forEach((player) => {
        console.log(
          `    Player: ${player.username} at (${player.x}, ${player.y}) health: ${player.health}`
        );
      });
    });

    // Listen for state updates
    room.onMessage("stateUpdate", (update) => {
      console.log("📊 State update:", update);
    });

    // Listen for player events
    room.onMessage("playerJoined", (player) => {
      console.log(
        `➕ Player joined: ${player.username} at (${player.x}, ${player.y})`
      );
    });

    room.onMessage("playerLeft", (data) => {
      console.log(`➖ Player left: ${data.sessionId}`);
    });

    room.onMessage("playerUpdate", (update) => {
      console.log(
        `🏃 Player moved: ${update.sessionId} to (${update.x}, ${update.y})`
      );
    });

    // Test movement after 2 seconds
    setTimeout(() => {
      console.log("🎯 Testing player movement...");
      room.send("move", { x: 50, y: 75 });
    }, 2000);

    // Request state update after 4 seconds
    setTimeout(() => {
      console.log("🔄 Requesting state update...");
      room.send("requestState");
    }, 4000);

    // Test for 10 seconds
    setTimeout(() => {
      console.log("⏰ Test complete, disconnecting...");
      room.leave();
    }, 10000);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testJsonMultiplayer();
