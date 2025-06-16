const { Client } = require("colyseus.js");

async function testAutoCombat() {
  console.log("⚔️ ===== Auto-Combat Test ===== ⚔️\\n");

  try {
    const client = new Client("ws://localhost:2567");
    const room = await client.joinOrCreate("runerogue", {
      name: "AutoCombatTester",
    });

    console.log("✅ Connected to room:", room.sessionId);

    // Listen for combat events
    room.onMessage("damage_dealt", (data) => {
      if (data.hitSuccess) {
        console.log(
          `💥 AUTO-COMBAT HIT! ${data.damage} damage (${data.accuracy}% accuracy)`
        );
        console.log(`   Target: ${data.targetId} health: ${data.targetHealth}`);
      } else {
        console.log(`💨 AUTO-COMBAT MISS! (${data.accuracy}% accuracy)`);
      }
    });

    room.onMessage("enemy_killed", (data) => {
      console.log(`💀 Enemy killed by auto-combat! XP: ${data.xpGained}`);
    });

    room.onMessage("joined", (data) => {
      console.log("🎮 Joined room:", data);
    });

    // Start game and let auto-combat do the work
    console.log("🚀 Starting game...");
    room.send("start_game");

    console.log("⏱️ Waiting for auto-combat to engage enemies...");
    console.log(
      "(Players automatically attack nearby enemies every 2.4 seconds)"
    );

    // Auto-disconnect after 20 seconds
    setTimeout(() => {
      console.log("\\n👋 Test complete - disconnecting...");
      room.leave();
      process.exit(0);
    }, 20000);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

testAutoCombat();
