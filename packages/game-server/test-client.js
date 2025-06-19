const { Client } = require("colyseus.js");

async function testConnection() {
  console.log("🔌 Creating Colyseus client...");

  try {
    const client = new Client("ws://localhost:2567");
    console.log("✅ Client created successfully");

    console.log("🎮 Attempting to join room...");
    const room = await client.joinOrCreate("runerogue", {
      name: "NodeTestPlayer",
    });

    console.log("🎉 Successfully connected!");
    console.log("Room ID:", room.id);
    console.log("Session ID:", room.sessionId); // Wait for state sync and then listen for changes
    room.onStateChange.once((state) => {
      console.log("📊 Initial state received!");
      console.log("Game started:", state.gameStarted);
      console.log("Players count:", state.players.size || 0);
      console.log("Enemies count:", state.enemies.size || 0);

      // Set up listeners for state changes
      room.state.onStateChange((state) => {
        console.log(
          "� State updated - Players:",
          state.players.size,
          "Enemies:",
          state.enemies.size,
        );
      });
    });

    // Test movement
    console.log("📍 Sending movement...");
    room.send("move", { x: 10, y: 10 });

    // Start game
    setTimeout(() => {
      console.log("🚀 Starting game...");
      room.send("start_game");
    }, 2000);

    // Keep alive for a few seconds
    setTimeout(() => {
      console.log("👋 Disconnecting...");
      room.leave();
    }, 10000);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("Full error:", error);
  }
}

testConnection();
