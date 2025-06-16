const { Client } = require("colyseus.js");

async function testMultiplayerGame() {
  console.log("🔌 Creating Colyseus client...");

  try {
    const client = new Client("ws://localhost:2567");
    console.log("✅ Client created successfully");

    console.log("🎮 Attempting to join room...");
    const room = await client.joinOrCreate("runerogue", {
      name: "TestPlayer_" + Math.floor(Math.random() * 1000),
    });

    console.log("🎉 Successfully connected!");
    console.log("Room ID:", room.id);
    console.log("Session ID:", room.sessionId);

    // Listen for room messages
    room.onMessage("joined", (data) => {
      console.log("📨 Received joined message:", data);
    });

    room.onMessage("damage_dealt", (data) => {
      console.log("⚔️ Damage dealt:", data);
    });

    room.onMessage("enemy_killed", (data) => {
      console.log("💀 Enemy killed:", data);
    });

    room.onMessage("game_started", (data) => {
      console.log("🚀 Game started!", data);
    });

    // Test movement after a short delay
    setTimeout(() => {
      console.log("📍 Sending movement to (15, 20)...");
      room.send("move", { x: 15, y: 20 });
    }, 1000);

    // Start game
    setTimeout(() => {
      console.log("🚀 Starting game...");
      room.send("start_game");
    }, 2000);

    // Send more movements during game
    setTimeout(() => {
      console.log("📍 Moving around during game...");
      room.send("move", { x: 25, y: 25 });
    }, 5000);

    // Keep alive for testing
    setTimeout(() => {
      console.log("👋 Test complete, disconnecting...");
      room.leave();
      process.exit(0);
    }, 15000);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    process.exit(1);
  }
}

console.log("🎮 Starting RuneRogue Multiplayer Test...");
testMultiplayerGame();
