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
    console.log("Session ID:", room.sessionId);

    // Listen for messages
    room.onMessage("joined", (data) => {
      console.log("🎮 Received joined message:", data);
    });

    room.onMessage("game_started", (data) => {
      console.log("🚀 Game started!", data);
    });

    room.onMessage("movement_rejected", (data) => {
      console.log("❌ Movement rejected:", data);
    });

    // Simple state logging
    room.onStateChange((state) => {
      console.log(
        "📊 State change - Game started:",
        state.gameStarted || false,
      );
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
      process.exit(0);
    }, 8000);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
}

testConnection();
