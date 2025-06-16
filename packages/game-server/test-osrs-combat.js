const { Client } = require("colyseus.js");

async function testOSRSCombat() {
  console.log("⚔️ ===== OSRS Combat System Test ===== ⚔️\\n");

  try {
    const client = new Client("ws://localhost:2567");
    const room = await client.joinOrCreate("runerogue", {
      name: "CombatTester",
    });

    console.log("✅ Connected to room:", room.sessionId);

    // Listen for combat messages
    room.onMessage("damage_dealt", (data) => {
      if (data.hitSuccess) {
        console.log(
          `💥 HIT! ${data.damage} damage dealt (${data.accuracy}% accuracy)`
        );
      } else {
        console.log(`💨 MISS! (${data.accuracy}% accuracy)`);
      }
      console.log(`   Target Health: ${data.targetHealth}`);
    });

    room.onMessage("enemy_killed", (data) => {
      console.log(`💀 Enemy killed! XP gained: ${data.xpGained}`);
    }); // Wait for state sync
    room.onStateChange.once((state) => {
      console.log("📊 Initial state received");

      // Start the game to spawn enemies
      console.log("🚀 Starting game to spawn enemies...");
      room.send("start_game");

      // Wait for enemies to spawn, then move close
      setTimeout(() => {
        console.log("📍 Moving closer to enemies...");
        // Move more gradually to avoid anti-cheat
        room.send("move", { x: 1, y: 1 });

        // Wait and then try combat
        setTimeout(() => {
          console.log("\\n⚔️ Testing manual combat...");

          // Get current state to find enemies
          const currentState = room.state;
          console.log(
            "Current enemies in state:",
            Object.keys(currentState.enemies || {})
          );

          // Try to attack any available enemies
          if (currentState && currentState.enemies) {
            const enemyIds = [];
            currentState.enemies.forEach((enemy, enemyId) => {
              if (enemy && enemy.alive) {
                enemyIds.push(enemyId);
              }
            });

            if (enemyIds.length > 0) {
              const targetId = enemyIds[0];
              console.log(`🎯 Attacking enemy: ${targetId}`);
              room.send("attack", { targetId });

              // Attack a few more times with proper delays
              setTimeout(() => room.send("attack", { targetId }), 2500);
              setTimeout(() => room.send("attack", { targetId }), 5000);
              setTimeout(() => room.send("attack", { targetId }), 7500);
            } else {
              console.log("❌ No living enemies found to attack");
            }
          } else {
            console.log("❌ No enemies in state");
          }
        }, 2000);
      }, 3000);
    });

    // Auto-disconnect after 15 seconds
    setTimeout(() => {
      console.log("\\n👋 Test complete - disconnecting...");
      room.leave();
      process.exit(0);
    }, 15000);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testOSRSCombat();
