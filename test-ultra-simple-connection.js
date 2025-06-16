/**
 * Test ultra simple schema connection to isolate encoding issues
 */

const { Client } = require("colyseus.js");

async function testUltraSimpleConnection() {
  console.log("🔌 Testing ultra simple schema connection...");

  try {
    const client = new Client("ws://localhost:3001");

    console.log("💻 Connecting to room...");
    const room = await client.joinOrCreate("runerogue", { test: true });

    console.log("✅ Connected to room:", room.sessionId);

    // Listen for state changes
    room.onStateChange((state) => {
      console.log("📊 State update received:");
      console.log("  Tick:", state.tick);
      console.log("  Player Count:", state.playerCount);
      console.log("  Message:", state.message);
    });

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

testUltraSimpleConnection();
