/**
 * WSS-only connection test for the game server
 */

const Colyseus = require("colyseus.js");

// Disable SSL verification for development with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testConnection() {
  console.log("🔍 Testing WSS connection to game server...");
  console.log("🔒 Using self-signed certificate bypass");

  try {
    // Test HTTPS/WSS connection (this is what works based on our direct WebSocket test)
    console.log("\n1. Testing HTTPS/WSS connection...");
    const client = new Colyseus.Client("wss://localhost:2567");

    const room = await client.joinOrCreate("test", {
      playerName: "TestPlayer",
    });

    console.log("✅ HTTPS/WSS connection successful!");
    console.log("📊 Room ID:", room.id);
    console.log("📊 Room state keys:", Object.keys(room.state || {}));

    // Test room functionality
    room.onStateChange((state) => {
      console.log("🔄 Room state changed");
    });

    room.onMessage("*", (type, message) => {
      console.log("📨 Received message:", type, message);
    });

    // Wait a moment to see any state changes
    console.log("⏳ Waiting for state changes...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Leave the room
    room.leave();
    client.close();

    console.log("\n🎉 WSS connection test successful!");
  } catch (error) {
    console.error("❌ WSS Connection test failed:", error.message);
    if (error.stack) {
      console.error("Stack:", error.stack);
    }
  }

  process.exit(0);
}

testConnection();
