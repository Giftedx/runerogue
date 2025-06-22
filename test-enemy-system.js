/**
 * Enemy System Test Client
 * Tests enemy spawning, movement, combat, and death in the SimpleTestRoom
 */

const { Client } = require("colyseus.js");

async function testEnemySystem() {
  console.log("🎮 Starting Enemy System Test...");
  console.log(
    "   Make sure the game server is running: pnpm --filter @runerogue/game-server dev"
  );
  console.log("");

  const client = new Client("ws://localhost:2567");

  try {
    const room = await client.joinOrCreate("test", { name: "EnemyTester" });
    console.log("✅ Connected to room:", room.id);
    console.log("👤 Session ID:", room.sessionId); // Wait for state initialization
    await new Promise((resolve) => {
      if (room.state && room.state.players) {
        console.log("📊 State already initialized");
        resolve();
      } else {
        console.log("⏳ Waiting for state initialization...");
        room.onStateChange((state) => {
          if (state && state.players) {
            console.log("📊 State initialized via onStateChange");
            resolve();
          }
        });

        // Fallback timeout
        setTimeout(() => {
          console.log("⚠️  State initialization timeout, proceeding anyway");
          resolve();
        }, 3000);
      }
    });

    console.log("📊 Initial state:");
    console.log(`  Players: ${room.state.players.size}`);
    console.log(`  Enemies: ${room.state.enemies.size}`);
    console.log(`  Wave: ${room.state.waveNumber}`);
    console.log(`  Kills: ${room.state.enemiesKilled}`);
    console.log("");

    // Track statistics
    let stats = {
      enemiesSpawned: 0,
      enemiesKilled: 0,
      playerAttacks: 0,
      enemyAttacks: 0,
      playerDeaths: 0,
    };

    // Listen for enemy events (with safety checks)
    if (room.state.enemies && typeof room.state.enemies.onAdd === "function") {
      room.state.enemies.onAdd((enemy, key) => {
        stats.enemiesSpawned++;
        console.log(
          `👹 Enemy spawned: ${key} (${enemy.enemyType}) at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) - HP: ${enemy.health}/${enemy.maxHealth}`
        );
      });
    } else {
      console.log(
        "⚠️  Enemies collection doesn't support onAdd - enemy count:",
        room.state.enemies ?
          room.state.enemies.size || Object.keys(room.state.enemies).length
        : "undefined"
      );

      // Since listeners don't work, let's manually show current enemies
      if (room.state.enemies && room.state.enemies.size > 0) {
        console.log("📊 Current enemies in room:");
        if (typeof room.state.enemies.forEach === "function") {
          room.state.enemies.forEach((enemy, key) => {
            console.log(
              `  ${key}: ${enemy.enemyType} at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) HP: ${enemy.health}/${enemy.maxHealth} State: ${enemy.state}`
            );
          });
        }
      }
    }
    if (
      room.state.enemies &&
      typeof room.state.enemies.onChange === "function"
    ) {
      room.state.enemies.onChange((enemy, key) => {
        // Only log significant movement (> 5 pixels)
        const lastPos = enemy._lastLoggedPos || { x: enemy.x, y: enemy.y };
        const distance = Math.sqrt(
          Math.pow(enemy.x - lastPos.x, 2) + Math.pow(enemy.y - lastPos.y, 2)
        );

        if (distance > 5) {
          console.log(
            `🚶 Enemy ${key} moved to (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) - HP: ${enemy.health}/${enemy.maxHealth}`
          );
          enemy._lastLoggedPos = { x: enemy.x, y: enemy.y };
        }
      });
    } else {
      console.log("⚠️  Enemies collection doesn't support onChange");
    }
    if (
      room.state.enemies &&
      typeof room.state.enemies.onRemove === "function"
    ) {
      room.state.enemies.onRemove((enemy, key) => {
        stats.enemiesKilled++;
        console.log(`💀 Enemy died: ${key} (${enemy.enemyType})`);
      });
    } else {
      console.log("⚠️  Enemies collection doesn't support onRemove");
    } // Listen for player events
    if (
      room.state.players &&
      typeof room.state.players.onChange === "function"
    ) {
      room.state.players.onChange((player, key) => {
        if (key === room.sessionId) {
          const health = player.health;
          const maxHealth = player.maxHealth;
          if (health < maxHealth) {
            console.log(`🩸 Player health: ${health}/${maxHealth}`);
          }

          if (health === 0) {
            stats.playerDeaths++;
            console.log(`💀 Player died! Total deaths: ${stats.playerDeaths}`);
          } else if (health === maxHealth && player._wasLowHealth) {
            console.log(`❤️  Player respawned with full health`);
          }

          player._wasLowHealth = health < maxHealth;
        }
      });
    } else {
      console.log("⚠️  Players collection doesn't support onChange");
    }

    // Since MapSchema listeners aren't working, periodically check enemy states manually
    const enemyCheckInterval = setInterval(() => {
      if (room.state && room.state.enemies && room.state.enemies.size > 0) {
        console.log(
          `🔍 Manual enemy check - ${room.state.enemies.size} enemies:`
        );
        room.state.enemies.forEach((enemy, key) => {
          console.log(
            `  ${key}: ${enemy.enemyType} at (${enemy.x.toFixed(1)}, ${enemy.y.toFixed(1)}) HP: ${enemy.health}/${enemy.maxHealth} State: ${enemy.state}`
          );
        });
      }
    }, 10000); // Check every 10 seconds

    // Listen for combat events
    room.onMessage("combat", (data) => {
      if (data.type === "playerAttack") {
        stats.playerAttacks++;
        console.log(
          `⚔️  Player attacked ${data.enemyId} for ${data.damage} damage`
        );
      } else if (data.type === "enemyAttack") {
        stats.enemyAttacks++;
        console.log(`🗡️  Enemy attacked player for ${data.damage} damage`);
      }
    });

    // Listen for other events
    room.onMessage("enemyDeath", (data) => {
      console.log(`💥 Enemy death event: ${data.enemyId} (${data.enemyType})`);
    });

    room.onMessage("playerRespawn", (data) => {
      console.log(`🔄 Player respawn event: ${data.playerId}`);
    });

    // Simulate intelligent player behavior
    let attackCooldown = 0;
    let moveTarget = { x: 400, y: 300 };

    const gameLoop = setInterval(() => {
      // Get current player position
      const player = room.state.players.get(room.sessionId);
      if (!player) return;

      // Strategy: Move towards enemies to engage them
      let targetEnemy = null;
      let closestDistance = Infinity;

      room.state.enemies.forEach((enemy, key) => {
        const distance = Math.sqrt(
          Math.pow(enemy.x - player.x, 2) + Math.pow(enemy.y - player.y, 2)
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          targetEnemy = { id: key, ...enemy };
        }
      });

      if (targetEnemy) {
        // Move towards enemy if far away
        if (closestDistance > 40) {
          const dx = targetEnemy.x - player.x;
          const dy = targetEnemy.y - player.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          moveTarget.x = player.x + (dx / distance) * 30;
          moveTarget.y = player.y + (dy / distance) * 30;

          // Clamp to bounds
          moveTarget.x = Math.max(50, Math.min(750, moveTarget.x));
          moveTarget.y = Math.max(50, Math.min(550, moveTarget.y));

          room.send("move", moveTarget);
        }

        // Attack if in range and cooldown ready
        attackCooldown--;
        if (attackCooldown <= 0 && closestDistance < 50) {
          room.send("attack", { targetId: targetEnemy.id });
          attackCooldown = 5; // 2.5 second cooldown
        }
      } else {
        // No enemies, move randomly
        if (Math.random() < 0.1) {
          // 10% chance to move each iteration
          moveTarget.x = 100 + Math.random() * 600;
          moveTarget.y = 100 + Math.random() * 400;
          room.send("move", moveTarget);
        }
      }
    }, 500); // 2Hz behavior update    // Status reporting
    const statusInterval = setInterval(() => {
      console.log("\n📈 Current Statistics:");
      console.log(`  Enemies spawned: ${stats.enemiesSpawned}`);
      console.log(`  Enemies killed: ${stats.enemiesKilled}`);
      console.log(`  Player attacks: ${stats.playerAttacks}`);
      console.log(`  Enemy attacks: ${stats.enemyAttacks}`);
      console.log(`  Player deaths: ${stats.playerDeaths}`);
      console.log(
        `  Current enemies alive: ${room.state.enemies ? Object.keys(room.state.enemies).length : "undefined"}`
      );
      console.log(`  Current wave: ${room.state.waveNumber}`);
      console.log(`  Total kills (server): ${room.state.enemiesKilled}`);

      // Manual enemy check
      if (room.state.enemies) {
        const enemyKeys = Object.keys(room.state.enemies);
        if (enemyKeys.length > 0) {
          console.log("  Manual enemy check - found enemies:", enemyKeys);
          enemyKeys.forEach((key) => {
            const enemy = room.state.enemies[key];
            if (enemy) {
              console.log(
                `    ${key}: ${enemy.enemyType || "unknown"} at (${enemy.x || 0}, ${enemy.y || 0})`
              );
            }
          });
        }
      }
      console.log("");
    }, 30000); // Every 30 seconds    // Graceful shutdown
    const cleanup = () => {
      clearInterval(gameLoop);
      clearInterval(statusInterval);
      if (enemyCheckInterval) clearInterval(enemyCheckInterval);
      console.log("\n🏁 Test completed. Final statistics:");
      console.log(`  Enemies spawned: ${stats.enemiesSpawned}`);
      console.log(`  Enemies killed: ${stats.enemiesKilled}`);
      console.log(`  Player attacks: ${stats.playerAttacks}`);
      console.log(`  Enemy attacks: ${stats.enemyAttacks}`);
      console.log(`  Player deaths: ${stats.playerDeaths}`);
      console.log(
        "   Combat ratio:",
        stats.playerAttacks > 0 ?
          `${((stats.enemiesKilled / stats.playerAttacks) * 100).toFixed(1)}% kill rate`
        : "No attacks"
      );
      room.leave();
    };

    // Run for 3 minutes then cleanup
    setTimeout(cleanup, 180000);

    // Handle Ctrl+C
    process.on("SIGINT", () => {
      console.log("\n⚡ Interrupted by user");
      cleanup();
      process.exit(0);
    });

    console.log("🎮 Test running... Press Ctrl+C to stop early");
    console.log(
      "   The test will run for 3 minutes and show statistics every 30 seconds"
    );
    console.log("");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error(
      "   Make sure the game server is running on ws://localhost:2567"
    );
    process.exit(1);
  }
}

// Add error handling for connection issues
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  process.exit(1);
});

testEnemySystem();
