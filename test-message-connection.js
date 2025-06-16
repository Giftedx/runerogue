/**
 * Test using Colyseus messages instead of schema to verify basic communication
 */

const { Client } = require("colyseus.js");

async function testMessageBasedConnection() {
  console.log("🔌 Testing message-based communication (no schema)...");

  try {
    const client = new Client("ws://localhost:3001");

    console.log("💻 Connecting to room...");
    const room = await client.joinOrCreate("runerogue", { test: true });

    console.log("✅ Connected to room:", room.sessionId);

    // Listen for custom messages instead of state
    room.onMessage("gameState", (data) => {
      console.log("📊 Game state message received:", data);
    });

    room.onMessage("playerUpdate", (data) => {
      console.log("👤 Player update message received:", data);
    });

    // Send a message to request state
    room.send("requestState");
    console.log("📤 Sent requestState message");

    // Listen for room messages
    room.onMessage("*", (type, message) => {
      console.log("📨 General message:", type, message);
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

testMessageBasedConnection();
