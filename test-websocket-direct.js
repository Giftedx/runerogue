/**
 * Direct WebSocket test to check WSS connection
 */

const WebSocket = require("ws");

// Test direct WebSocket connection to see what protocols are supported
async function testDirectWebSocket() {
  console.log("🔍 Testing direct WebSocket connections...");

  // Test HTTP WebSocket
  console.log("\n1. Testing WS (HTTP) connection...");
  try {
    const ws1 = new WebSocket("ws://localhost:2567");

    ws1.on("open", () => {
      console.log("✅ WS connection opened successfully");
      ws1.close();
    });

    ws1.on("error", (error) => {
      console.log("❌ WS connection failed:", error.message);
    });

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.log("❌ WS error:", error.message);
  }

  // Test HTTPS WebSocket
  console.log("\n2. Testing WSS (HTTPS) connection...");
  try {
    const ws2 = new WebSocket("wss://localhost:2567", {
      rejectUnauthorized: false, // Allow self-signed certificates
    });

    ws2.on("open", () => {
      console.log("✅ WSS connection opened successfully");
      ws2.close();
    });

    ws2.on("error", (error) => {
      console.log("❌ WSS connection failed:", error.message);
    });

    // Wait a moment
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (error) {
    console.log("❌ WSS error:", error.message);
  }

  console.log("\n✅ WebSocket tests completed");
}

testDirectWebSocket()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Test failed:", error);
    process.exit(1);
  });
