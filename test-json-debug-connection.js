/**
 * Test client listening for JSON debug messages to verify communication
 */

const { Client } = require("colyseus.js");

async function testJsonDebugConnection() {
  console.log("🔌 Testing JSON debug message connection...");

  try {
    const client = new Client("ws://localhost:3001");

    console.log("💻 Connecting to room...");
    const room = await client.joinOrCreate("runerogue", { test: true });

    console.log("✅ Connected to room:", room.sessionId);

    // Listen for debug state messages
    room.onMessage("stateDebug", (data) => {
      console.log("📊 JSON Debug state received:", data);
      console.log("  Tick:", data.tick, typeof data.tick);
      console.log("  Player Count:", data.playerCount, typeof data.playerCount);
      console.log("  Message:", data.message, typeof data.message);
    });

    // Still check schema state for comparison
    room.onStateChange((state) => {
      console.log("📋 Schema state (for comparison):");
      console.log("  Tick:", state.tick, typeof state.tick);
      console.log(
        "  Player Count:",
        state.playerCount,
        typeof state.playerCount
      );
      console.log("  Message:", state.message, typeof state.message);
    });

    // Listen for any other messages
    room.onMessage("*", (type, message) => {
      if (type !== "stateDebug") {
        console.log("📨 Other message:", type, message);
      }
    });

    // Test for 6 seconds
    setTimeout(() => {
      console.log("⏰ Test complete, disconnecting...");
      room.leave();
    }, 6000);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testJsonDebugConnection();
