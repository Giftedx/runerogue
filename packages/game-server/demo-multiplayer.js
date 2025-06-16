const { Client } = require("colyseus.js");

async function simulateMultiplayerGame() {
  console.log("🎮 Starting RuneRogue Multiplayer Demo");
  console.log("=====================================");

  const players = [];

  try {
    // Create 3 players joining the same room
    console.log("👥 Creating 3 players...");

    for (let i = 1; i <= 3; i++) {
      const client = new Client("ws://localhost:2567");
      const room = await client.joinOrCreate("runerogue", {
        name: `Player${i}`,
      });

      players.push({ id: i, client, room, sessionId: room.sessionId });
      console.log(`✅ Player${i} joined room ${room.id} (${room.sessionId})`);

      // Set up event listeners for each player
      room.onMessage("joined", (data) => {
        console.log(`📨 Player${i} received joined:`, data);
      });

      room.onMessage("game_started", () => {
        console.log(`🚀 Player${i} notified: Game Started!`);
      });

      room.onMessage("enemy_killed", (data) => {
        console.log(`💀 Player${i} saw enemy kill:`, data);
      });

      room.onMessage("damage_dealt", (data) => {
        console.log(`⚔️ Player${i} saw damage:`, data);
      });

      // Small delay between joins
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\\n🏃 Testing movement synchronization...");

    // Test movement for all players
    await new Promise((resolve) => setTimeout(resolve, 1000));

    players.forEach((player, index) => {
      const x = 10 + index * 5;
      const y = 10 + index * 3;
      console.log(`Player${player.id} moving to (${x}, ${y})`);
      player.room.send("move", { x, y });
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("\\n🚀 Starting the game...");
    players[0].room.send("start_game");

    console.log("\\n🎯 Waiting for enemy spawning and combat...");
    await new Promise((resolve) => setTimeout(resolve, 8000));

    console.log("\\n🏃 More movement during gameplay...");
    players.forEach((player, index) => {
      const x = 20 + index * 4;
      const y = 15 + index * 4;
      console.log(`Player${player.id} moving to (${x}, ${y})`);
      player.room.send("move", { x, y });
    });

    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("\\n👋 Disconnecting players...");
    for (const player of players) {
      console.log(`Player${player.id} leaving...`);
      player.room.leave();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\\n🎉 Multiplayer demo completed successfully!");
    console.log("=====================================");
  } catch (error) {
    console.error("❌ Demo failed:", error);
  }

  process.exit(0);
}

simulateMultiplayerGame();
