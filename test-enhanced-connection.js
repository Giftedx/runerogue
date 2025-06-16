/**
 * Enhanced test client with better logging to debug state synchronization
 */

const { Client } = require("colyseus.js");

async function testEnhancedConnection() {
  console.log("🔌 Testing enhanced schema connection with detailed logging...");

  try {
    const client = new Client("ws://localhost:3001");

    console.log("💻 Connecting to room...");
    const room = await client.joinOrCreate("runerogue", { test: true });

    console.log("✅ Connected to room:", room.sessionId);
    console.log("📋 Room state type:", typeof room.state);
    console.log("📋 Room state constructor:", room.state?.constructor?.name);

    // Listen for state changes with more detail
    room.onStateChange((state) => {
      console.log("📊 State update received:");
      console.log("  State object:", state);
      console.log("  State keys:", Object.keys(state || {}));
      console.log("  Tick value:", state?.tick, typeof state?.tick);
      console.log(
        "  Player Count value:",
        state?.playerCount,
        typeof state?.playerCount
      );
      console.log("  Message value:", state?.message, typeof state?.message);

      // Try to access properties directly
      try {
        console.log("  Direct access - tick:", state.tick);
        console.log("  Direct access - playerCount:", state.playerCount);
        console.log("  Direct access - message:", state.message);
      } catch (err) {
        console.log("  Error accessing properties:", err.message);
      }
    });

    // Log initial state
    setTimeout(() => {
      console.log("🔍 Checking initial state after 1 second:");
      console.log("  State exists:", !!room.state);
      console.log("  State:", room.state);
      if (room.state) {
        console.log("  Properties:", {
          tick: room.state.tick,
          playerCount: room.state.playerCount,
          message: room.state.message,
        });
      }
    }, 1000);

    // Listen for room messages
    room.onMessage("*", (type, message) => {
      console.log("📨 Room message:", type, message);
    });

    // Test for 8 seconds
    setTimeout(() => {
      console.log("⏰ Test complete, disconnecting...");
      room.leave();
    }, 8000);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testEnhancedConnection();
