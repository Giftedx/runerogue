/**
 * Simple WebSocket connection test for RuneRogue server
 */

const { Client } = require("colyseus.js");

async function testConnection() {
  console.log("🔌 Testing connection to RuneRogue server...");

  try {
    const client = new Client("ws://localhost:3001");
    console.log("✅ Client created, attempting to join room...");

    const room = await client.joinOrCreate("runerogue", {
      username: "TestPlayer",
    });

    console.log("🎉 Successfully connected! Room ID:", room.id);
    console.log("👤 Session ID:", room.sessionId);
    console.log("🎮 Room state:", room.state);

    // Leave the room after a brief pause
    setTimeout(async () => {
      await room.leave();
      console.log("👋 Left the room successfully");
      process.exit(0);
    }, 2000);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("📋 Error details:", error);
    process.exit(1);
  }
}

testConnection();
