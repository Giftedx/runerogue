/**
 * Test SSL/WSS connection to the game server with proper certificate handling
 */

const Colyseus = require("colyseus.js");
const WebSocket = require("ws");

// For development, we need to disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function testSSLConnection() {
  console.log("🔍 Testing SSL/WSS connection to game server...");

  try {
    // Test 1: Direct WebSocket connection
    console.log("\n1. Testing direct WSS connection...");
    const ws = new WebSocket("wss://localhost:2567", {
      rejectUnauthorized: false, // Allow self-signed certificates
    });

    ws.on("open", () => {
      console.log("✅ Direct WSS connection successful");
      ws.close();
    });

    ws.on("error", (error) => {
      console.log("❌ Direct WSS connection failed:", error.message);
    });

    // Wait a moment for the WebSocket test
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Test 2: Colyseus client connection
    console.log("\n2. Testing Colyseus client connection...");
    const client = new Colyseus.Client("wss://localhost:2567");

    const room = await client.joinOrCreate("test", {
      playerName: "TestPlayer",
    });

    console.log("✅ Successfully joined room:", room.id);
    console.log("📊 Room state:", room.state);

    // Listen for state changes
    room.onStateChange((state) => {
      console.log("🔄 Room state updated:", state);
    });

    // Clean disconnect after 2 seconds
    setTimeout(() => {
      room.leave();
      client.close();
      console.log("🚪 Left room and closed connection");
      process.exit(0);
    }, 2000);
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    process.exit(1);
  }
}

// Also test HTTP connection as fallback
async function testHTTPConnection() {
  console.log("\n🔍 Testing HTTP/WS connection as fallback...");

  try {
    const client = new Colyseus.Client("ws://localhost:2567");

    const room = await client.joinOrCreate("test", {
      playerName: "TestPlayer",
    });

    console.log("✅ Successfully joined room via HTTP:", room.id);

    // Clean disconnect
    setTimeout(() => {
      room.leave();
      client.close();
      console.log("🚪 Left room and closed HTTP connection");
    }, 1000);
  } catch (error) {
    console.error("❌ HTTP connection also failed:", error);
  }
}

// Run both tests
testSSLConnection().catch(() => {
  console.log("\n🔄 SSL failed, trying HTTP fallback...");
  testHTTPConnection();
});
