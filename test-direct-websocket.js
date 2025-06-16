/**
 * Direct WebSocket Test to Verify Server Connection
 * This bypasses Colyseus to test basic connectivity
 */

const WebSocket = require("ws");

function directWebSocketTest() {
  console.log("🧪 Direct WebSocket Connection Test");
  console.log("=".repeat(50));

  const ws = new WebSocket("ws://localhost:3001");

  ws.on("open", function open() {
    console.log("✅ WebSocket connection established");

    // Send a simple message
    ws.send(
      JSON.stringify({
        type: "test",
        message: "Hello from direct WebSocket test",
      })
    );

    console.log("📤 Test message sent");
  });

  ws.on("message", function message(data) {
    console.log("📥 Received message:", data.toString());
  });

  ws.on("error", function error(err) {
    console.error("❌ WebSocket error:", err.message);
  });

  ws.on("close", function close() {
    console.log("🔌 WebSocket connection closed");
  });

  // Close after 5 seconds
  setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  }, 5000);
}

directWebSocketTest();
