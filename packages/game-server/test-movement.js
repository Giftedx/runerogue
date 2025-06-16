const { Client } = require("colyseus.js");

async function testPlayerMovement() {
  console.log("🎮 Testing Player Movement System...");

  try {
    const client = new Client("ws://localhost:2567");
    const room = await client.joinOrCreate("runerogue", {
      name: "MovementTester",
    });

    console.log("✅ Connected to room:", room.id);

    // Wait for state sync
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Check initial player state
    room.onStateChange((state) => {
      console.log("🔄 State Update:");
      console.log("  Game Time:", state.gameTime);
      console.log("  Game Started:", state.gameStarted);
      console.log("  Wave:", state.waveNumber);
      console.log("  Enemies Killed:", state.enemiesKilled);
      console.log(
        "  Players:",
        state.players ? state.players.size : "undefined"
      );
      console.log(
        "  Enemies:",
        state.enemies ? state.enemies.size : "undefined"
      );
    });

    // Test movement sequence
    console.log("📍 Testing movement sequence...");

    setTimeout(() => {
      console.log("Move 1: (10, 10)");
      room.send("move", { x: 10, y: 10 });
    }, 1000);

    setTimeout(() => {
      console.log("Move 2: (20, 15)");
      room.send("move", { x: 20, y: 15 });
    }, 2000);

    setTimeout(() => {
      console.log("🚀 Starting game...");
      room.send("start_game");
    }, 3000);

    setTimeout(() => {
      console.log("Move 3 (during game): (25, 25)");
      room.send("move", { x: 25, y: 25 });
    }, 5000);

    // Listen for game events
    room.onMessage("joined", (data) => {
      console.log("📨 Joined:", data);
    });

    room.onMessage("damage_dealt", (data) => {
      console.log("⚔️ Damage:", data);
    });

    room.onMessage("enemy_killed", (data) => {
      console.log("💀 Kill:", data);
    });

    room.onMessage("game_started", () => {
      console.log("🎯 Game Started!");
    });

    room.onMessage("movement_rejected", (data) => {
      console.log("🚫 Movement Rejected:", data);
    });

    // Test for 10 seconds
    setTimeout(() => {
      console.log("✅ Test complete!");
      room.leave();
      process.exit(0);
    }, 10000);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testPlayerMovement();
