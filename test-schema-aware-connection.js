/**
 * Client with proper schema registration for decoding
 */

const { Client } = require("colyseus.js");

// Define the same schema on the client side for proper decoding
const { Schema, defineTypes } = require("@colyseus/schema");

// Mirror the server-side UltraSimpleState schema
class UltraSimpleState extends Schema {
  constructor() {
    super();
    this.tick = 0;
    this.playerCount = 0;
    this.message = "Hello World";
  }
}

// Define types exactly as on server
defineTypes(UltraSimpleState, {
  tick: "number",
  playerCount: "number",
  message: "string",
});

async function testSchemaAwareConnection() {
  console.log("🔌 Testing connection with client-side schema registration...");

  try {
    const client = new Client("ws://localhost:3001");

    console.log("💻 Connecting to room...");
    const room = await client.joinOrCreate("runerogue", { test: true });

    console.log("✅ Connected to room:", room.sessionId);
    console.log("📋 Room state type:", typeof room.state);
    console.log("📋 Room state constructor:", room.state?.constructor?.name);

    // Listen for state changes
    room.onStateChange((state) => {
      console.log("📊 State update received:");
      console.log("  Tick:", state.tick, typeof state.tick);
      console.log(
        "  Player Count:",
        state.playerCount,
        typeof state.playerCount
      );
      console.log("  Message:", state.message, typeof state.message);
    });

    // Log initial state after a moment
    setTimeout(() => {
      console.log("🔍 Initial state after 1 second:");
      if (room.state) {
        console.log("  Properties:", {
          tick: room.state.tick,
          playerCount: room.state.playerCount,
          message: room.state.message,
        });
      }
    }, 1000);

    // Test for 8 seconds
    setTimeout(() => {
      console.log("⏰ Test complete, disconnecting...");
      room.leave();
    }, 8000);
  } catch (error) {
    console.error("❌ Connection failed:", error);
  }
}

testSchemaAwareConnection();
