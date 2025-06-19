const { Client } = require("colyseus.js");

class TestPlayer {
  constructor(name, movePattern = "random") {
    this.name = name;
    this.movePattern = movePattern;
    this.client = null;
    this.room = null;
    this.position = { x: 0, y: 0 };
    this.connected = false;
  }

  async connect() {
    console.log(`🔌 ${this.name} connecting...`);

    this.client = new Client("ws://localhost:2567");
    this.room = await this.client.joinOrCreate("runerogue", {
      name: this.name,
    });

    console.log(`✅ ${this.name} connected! Session: ${this.room.sessionId}`);
    this.connected = true;

    // Set up message handlers
    this.room.onMessage("joined", (data) => {
      console.log(`🎮 ${this.name} received join data:`, data);
    });

    this.room.onMessage("game_started", (data) => {
      console.log(`🚀 ${this.name} sees game started!`);
    });

    this.room.onMessage("movement_rejected", (data) => {
      console.log(`❌ ${this.name} movement rejected:`, data.reason);
    });

    this.room.onMessage("damage", (_data) => {
      // Handle damage message
    });

    this.room.onMessage("*", (type, _data) => {
      console.log(`[Room 1] Message:`, type);
    });

    // Track state changes
    this.room.onStateChange((state) => {
      if (state.gameStarted !== this.lastGameState) {
        console.log(`📊 ${this.name} sees game state: ${state.gameStarted}`);
        this.lastGameState = state.gameStarted;
      }
    });

    return this.room;
  }

  move(x, y) {
    if (!this.connected) return;

    console.log(`📍 ${this.name} moving to (${x}, ${y})`);
    this.position = { x, y };
    this.room.send("move", { x, y });
  }

  startGame() {
    if (!this.connected) return;

    console.log(`🚀 ${this.name} starting game...`);
    this.room.send("start_game");
  }

  attack(targetId) {
    if (!this.connected) return;

    console.log(`⚔️ ${this.name} attacking ${targetId}`);
    this.room.send("attack", { targetId });
  }

  disconnect() {
    if (this.room) {
      console.log(`👋 ${this.name} disconnecting...`);
      this.room.leave();
      this.connected = false;
    }
  }

  simulateMovement() {
    if (!this.connected) return;

    // Simulate realistic movement (respecting speed limits)
    const currentTime = Date.now();
    if (!this.lastMoveTime || currentTime - this.lastMoveTime > 1000) {
      const deltaX = (Math.random() - 0.5) * 2; // -1 to 1
      const deltaY = (Math.random() - 0.5) * 2; // -1 to 1

      this.move(
        Math.max(0, Math.min(30, this.position.x + deltaX)),
        Math.max(0, Math.min(30, this.position.y + deltaY))
      );

      this.lastMoveTime = currentTime;
    }
  }
}

async function runMultiplayerTest() {
  console.log("🎮 ===== RuneRogue Multiplayer Test ===== 🎮\n");

  // Create test players
  const players = [
    new TestPlayer("Alice", "explorer"),
    new TestPlayer("Bob", "warrior"),
    new TestPlayer("Charlie", "mage"),
  ];

  try {
    // Phase 1: Connect all players
    console.log("\n📡 Phase 1: Connecting players...");
    for (const player of players) {
      await player.connect();
      await new Promise((resolve) => setTimeout(resolve, 500)); // Stagger connections
    }

    // Phase 2: Move players around
    console.log("\n🏃 Phase 2: Testing movement...");
    players[0].move(5, 5); // Alice moves slowly
    await new Promise((resolve) => setTimeout(resolve, 500));

    players[1].move(8, 8); // Bob moves
    await new Promise((resolve) => setTimeout(resolve, 500));

    players[2].move(100, 100); // Charlie tries to cheat (should be rejected)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Phase 3: Start game
    console.log("\n🚀 Phase 3: Starting game...");
    players[0].startGame(); // Alice starts the game
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Phase 4: Simulate gameplay
    console.log("\n⚔️ Phase 4: Simulating combat phase...");

    // Move players around for a few seconds
    const gameplayDuration = 5000; // 5 seconds of gameplay
    const intervalId = setInterval(() => {
      players.forEach((player) => player.simulateMovement());
    }, 1000);

    await new Promise((resolve) => setTimeout(resolve, gameplayDuration));
    clearInterval(intervalId);

    // Phase 5: Disconnect players
    console.log("\n👋 Phase 5: Disconnecting players...");
    for (let i = 0; i < players.length; i++) {
      players[i].disconnect();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log("\n✅ Multiplayer test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    // Ensure cleanup
    players.forEach((player) => player.disconnect());
    setTimeout(() => process.exit(0), 2000);
  }
}

// Run the test
runMultiplayerTest();
