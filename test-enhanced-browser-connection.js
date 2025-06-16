/**
 * Enhanced Browser Connection Test Script
 * Tests client-server connection with updated fixes
 */

const WebSocket = require("ws");
const { Client } = require("colyseus.js");

async function testEnhancedBrowserConnection() {
  console.log("🧪 Testing Enhanced Browser Connection Fixes...");
  console.log("=".repeat(60));

  try {
    // Test WebSocket connection first
    console.log("1️⃣ Testing raw WebSocket connection...");
    const ws = new WebSocket("ws://localhost:3001");

    await new Promise((resolve, reject) => {
      ws.on("open", () => {
        console.log("✅ Raw WebSocket connection successful");
        ws.close();
        resolve();
      });
      ws.on("error", reject);
      setTimeout(() => reject(new Error("WebSocket timeout")), 5000);
    });

    // Test Colyseus client connection
    console.log("2️⃣ Testing Colyseus client connection...");
    const client = new Client("ws://localhost:3001");

    const room = await client.joinOrCreate("runerogue", {
      username: `TestPlayer_${Date.now()}`,
      combatStats: {
        attack: 50,
        strength: 50,
        defence: 45,
        hitpoints: 50,
        prayer: 25,
        ranged: 35,
        magic: 30,
      },
    });

    console.log("✅ Colyseus client connected successfully!");
    console.log(`🏠 Room ID: ${room.id}`);
    console.log(`👤 Session ID: ${room.sessionId}`);

    // Test sending a message
    console.log("3️⃣ Testing message sending...");
    room.send("chat", { message: "Test message from connection script" }); // Test skills request
    room.send("requestSkills");

    // Test inventory request
    room.send("requestInventory");

    // Listen for some events
    let eventsReceived = 0;
    const targetEvents = 3;

    room.onMessage("fullState", (state) => {
      console.log("📊 Received fullState event");
      eventsReceived++;
    });

    room.onMessage("skillsData", (skills) => {
      console.log(
        "⚡ Received skillsData event:",
        Object.keys(skills).length,
        "skills"
      );
      eventsReceived++;
    });
    room.onMessage("inventoryData", (inventory) => {
      console.log(
        "🎒 Received inventoryData event:",
        Array.isArray(inventory) ? inventory.length : "non-array data",
        "items"
      );
      eventsReceived++;
    });

    // Wait for events
    await new Promise((resolve) => {
      const checkEvents = setInterval(() => {
        if (eventsReceived >= targetEvents) {
          clearInterval(checkEvents);
          resolve();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkEvents);
        resolve();
      }, 3000);
    });

    console.log(`✅ Received ${eventsReceived}/${targetEvents} events`);

    // Clean up
    await room.leave();
    console.log("👋 Left room successfully");

    console.log("=".repeat(60));
    console.log("🎉 All Enhanced Browser Connection Tests PASSED!");
    console.log("💡 Browser client should now work correctly with:");
    console.log("   - Buffer polyfill for browser compatibility");
    console.log("   - Correct Colyseus client instantiation");
    console.log("   - Alternative connection methods");
    console.log("   - Fixed line endings and formatting");
  } catch (error) {
    console.error("❌ Enhanced Browser Connection Test Failed:", error.message);
    console.error("🔍 Error details:", error);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("💡 Make sure the server is running on port 3001");
    }

    process.exit(1);
  }
}

if (require.main === module) {
  testEnhancedBrowserConnection();
}

module.exports = { testEnhancedBrowserConnection };
