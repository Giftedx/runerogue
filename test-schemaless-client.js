/**
 * Test client for the schema-less room
 * This bypasses Colyseus schema entirely and uses plain object state sync
 */

const colyseus = require("colyseus.js");

async function testSchemalessRoom() {
  console.log("🎮 Connecting to schema-less test room...");

  try {
    const client = new colyseus.Client("ws://localhost:2567");
    const room = await client.joinOrCreate("schemaless", {
      name: "TestPlayer",
    });

    console.log("✅ Connected to schema-less room:", room.id);
    console.log("👤 Session ID:", room.sessionId);

    // Listen for game state updates
    room.onMessage("gameState", (state) => {
      console.log("📊 Received game state:", {
        playerCount: Object.keys(state.players).length,
        players: Object.keys(state.players),
      });
    });

    // Listen for player events
    room.onMessage("playerJoined", (data) => {
      console.log(
        `👤 Player joined: ${data.playerId} at (${data.player.x}, ${data.player.y})`
      );
    });

    room.onMessage("playerMoved", (data) => {
      console.log(
        `🏃 Player moved: ${data.playerId} to (${data.x}, ${data.y})`
      );
    });

    room.onMessage("playerLeft", (data) => {
      console.log(`👋 Player left: ${data.playerId}`);
    });

    // Test sending a move command
    setTimeout(() => {
      console.log("📤 Sending move command...");
      room.send("move", { x: 200, y: 150 });
    }, 2000);

    // Keep connection alive for testing
    console.log("⏳ Testing for 10 seconds...");
    setTimeout(() => {
      console.log("📊 Test completed");
      room.leave();
      process.exit(0);
    }, 10000);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

// Run the test
testSchemalessRoom();
