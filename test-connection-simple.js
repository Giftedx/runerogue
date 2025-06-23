/**
 * Simple SSL connection test for the game server
 */

const Colyseus = require("colyseus.js");

// Disable SSL verification for development with self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testConnection() {
  console.log("🔍 Testing connection to game server...");

  try {
    // Test HTTP connection first (simpler)
    console.log("\n1. Testing HTTP/WS connection...");
    const httpClient = new Colyseus.Client("ws://localhost:2567");

    const httpRoom = await httpClient.joinOrCreate("test", {
      playerName: "TestPlayer",
    });

    console.log("✅ HTTP connection successful!");
    console.log("📊 Room ID:", httpRoom.id);
    console.log("📊 Room state keys:", Object.keys(httpRoom.state || {}));

    // Leave the room
    httpRoom.leave();
    httpClient.close();

    console.log("\n2. Testing HTTPS/WSS connection...");
    const httpsClient = new Colyseus.Client("wss://localhost:2567");

    const httpsRoom = await httpsClient.joinOrCreate("test", {
      playerName: "TestPlayer",
    });

    console.log("✅ HTTPS connection successful!");
    console.log("📊 Room ID:", httpsRoom.id);
    console.log("📊 Room state keys:", Object.keys(httpsRoom.state || {}));

    // Leave the room
    httpsRoom.leave();
    httpsClient.close();

    console.log("\n🎉 All connections successful!");
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    console.error("Stack:", error.stack);
  }

  process.exit(0);
}

testConnection();
