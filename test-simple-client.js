/**
 * Simple test client to verify connectivity with the test room
 */

const colyseus = require("colyseus.js");

async function testSimpleRoom() {
  console.log("🎮 Connecting to simple test room...");

  try {
    const client = new colyseus.Client("ws://localhost:2567");
    const room = await client.joinOrCreate("test", { name: "TestPlayer" });

    console.log("✅ Connected to test room:", room.id);
    console.log("👤 Session ID:", room.sessionId);

    // Wait for state to be initialized
    await new Promise((resolve) => {
      const checkState = () => {
        if (room.state && room.state.players) {
          console.log("📊 State initialized - Players:", room.state.players.size);
          resolve();
        } else {
          console.log("⏳ Waiting for state initialization...");
          setTimeout(checkState, 100);
        }
      };
      checkState();
    });

    // Listen for state changes
    room.state.players.onAdd = (player, playerId) => {
      console.log(
        `👤 Player joined: ${playerId} at (${player.x}, ${player.y})`
      );
    };

      room.state.players.onChange = (player, playerId) => {
        console.log(
          `🔄 Player updated: ${playerId} at (${player.x}, ${player.y}) health: ${player.health}`
        );
      };

      room.state.players.onRemove = (player, playerId) => {
        console.log(`👋 Player left: ${playerId}`);
      };
    } else {
      console.log("⚠️ Players collection not initialized yet");
    }

    // Test sending a move command
    setTimeout(() => {
      console.log("📤 Sending move command...");
      room.send("move", { x: 200, y: 150 });
    }, 2000);

    // Keep connection alive for testing
    console.log("⏳ Testing for 10 seconds...");
    setTimeout(() => {
      console.log("📊 Final state:");
      console.log("- Players:", room.state.players.size);
      console.log("🔌 Disconnecting...");
      room.leave();
    }, 10000); // 10 seconds
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testSimpleRoom();
