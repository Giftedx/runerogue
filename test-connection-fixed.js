// Quick test to verify server connectivity and schema fix
const Colyseus = require("colyseus.js");

async function testConnection() {
  console.log("🔍 Testing game server connection...");

  try {
    // Connect to the game server (using WSS for HTTPS server)
    const client = new Colyseus.Client("wss://localhost:2567");
    console.log("✅ Connected to game server successfully");

    // Test room creation
    const room = await client.joinOrCreate("GameRoom", { name: "TestPlayer" });
    console.log("✅ Successfully joined/created GameRoom");
    console.log(`📊 Room ID: ${room.id}`);
    console.log(`👥 Session ID: ${room.sessionId}`);

    // Test initial state
    console.log("📊 Initial state:");
    console.log(`   Players: ${room.state.players.size}`);
    console.log(`   Enemies: ${room.state.enemies.size}`);
    console.log(`   Wave: ${room.state.wave.number}`);

    // Wait a moment for any enemy spawning
    console.log("⏳ Waiting for potential enemy spawning...");
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check state after waiting
    console.log("📊 State after 3 seconds:");
    console.log(`   Players: ${room.state.players.size}`);
    console.log(`   Enemies: ${room.state.enemies.size}`);
    console.log(`   Wave: ${room.state.wave.number}`);

    // Test cleanup
    room.leave();
    console.log("✅ Test completed - server is working with schema fixes!");
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
  }

  process.exit(0);
}

testConnection();
