/**
 * Test minimal schema connection and state synchronization
 */

const { Client } = require("colyseus.js");

async function testMinimalConnection() {
  console.log("🔌 Testing minimal schema connection...");

  try {
    const client = new Client("ws://localhost:3001");

    console.log("💻 Connecting to room...");
    const room = await client.joinOrCreate("runerogue", {
      username: "TestPlayer1",
    });

    console.log("✅ Connected to room:", room.sessionId);

    // Listen for state changes
    room.onStateChange((state) => {
      console.log("📊 State update received:");
      console.log("  Tick:", state.tick);
      console.log("  Timestamp:", state.timestamp);
      console.log(
        "  Players count:",
        state.players ? state.players.size : "undefined"
      );

      // Log player details if available
      if (state.players) {
        state.players.forEach((player, sessionId) => {
          console.log(`  Player ${sessionId}:`, {
            id: player.id,
            username: player.username,
            x: player.x,
            y: player.y,
            health: player.health,
          });
        });
      }
    });

    // Listen for player additions
    room.state.players?.onAdd((player, sessionId) => {
      console.log(`➕ Player added: ${player.username} (${sessionId})`);
    });

    // Listen for player removals
    room.state.players?.onRemove((player, sessionId) => {
      console.log(`➖ Player removed: ${player.username} (${sessionId})`);
    });

    // Listen for room messages
    room.onMessage("*", (type, message) => {
      console.log("📨 Room message:", type, message);
    });

    // Test for 10 seconds
    setTimeout(() => {
      console.log("⏰ Test complete, disconnecting...");
      room.leave();
      client.close();
    }, 10000);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testMinimalConnection();
