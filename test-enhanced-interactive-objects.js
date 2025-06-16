/**
 * Interactive Objects Integration Test
 * Tests the new Skills and Inventory systems with Interactive Objects
 */

const WebSocket = require("ws");

// Create a simple test client
function createTestClient() {
  const ws = new WebSocket("ws://localhost:3001");

  ws.on("open", () => {
    console.log("✓ Connected to server");

    // Join the room
    ws.send(
      JSON.stringify({
        method: "joinRoom",
        roomName: "JsonGameRoom",
        options: {
          username: "TestPlayer",
        },
      })
    );
  });

  ws.on("message", (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log("📨 Received:", message.type || message.method, message);

      // When we get full state, test interaction with a tree
      if (message.type === "fullState" && message.data) {
        const gameState = message.data;
        console.log("🎮 Game state received");
        console.log(`Players: ${gameState.playerCount}`);
        console.log(
          `Interactive objects: ${Object.keys(gameState.interactiveObjects).length}`
        );

        // Find a tree to interact with
        const objects = Object.values(gameState.interactiveObjects);
        const tree = objects.find((obj) => obj.type === "tree");

        if (tree) {
          console.log(`🌳 Found tree: ${tree.name} at (${tree.x}, ${tree.y})`);

          // Test woodcutting interaction
          setTimeout(() => {
            console.log("🪓 Attempting to chop tree...");
            ws.send(
              JSON.stringify({
                type: "interact",
                data: {
                  objectId: tree.id,
                  skillType: "woodcutting",
                },
              })
            );
          }, 1000);
        }
      }

      // Handle interaction results
      if (message.type === "interactionResult") {
        const result = message.data;
        console.log("⚡ Interaction result:", result);

        if (result.success) {
          console.log(`✓ Success: ${result.message}`);
          console.log(`📈 XP gained: ${result.xpGained}`);
          console.log(
            `📦 Resources: ${JSON.stringify(result.resourcesGained)}`
          );

          // Request updated player data
          setTimeout(() => {
            ws.send(JSON.stringify({ type: "requestSkills" }));
            ws.send(JSON.stringify({ type: "requestInventory" }));
          }, 500);
        } else {
          console.log(`❌ Failed: ${result.message}`);
        }
      }

      // Handle level ups
      if (message.type === "levelUp") {
        const levelUp = message.data;
        console.log(
          `🎉 LEVEL UP! ${levelUp.skillName}: ${levelUp.oldLevel} → ${levelUp.newLevel}`
        );
      }

      // Handle skills data
      if (message.type === "skillsData") {
        const skills = message.data;
        console.log("📊 Skills data:");
        console.log(
          `  Woodcutting: Level ${skills.woodcutting.level} (${skills.woodcutting.totalExperience} XP)`
        );
        console.log(
          `  Mining: Level ${skills.mining.level} (${skills.mining.totalExperience} XP)`
        );
      }

      // Handle inventory data
      if (message.type === "inventoryData") {
        const inventory = message.data;
        console.log("🎒 Inventory:");
        inventory.forEach((item) => {
          console.log(`  Slot ${item.slot}: ${item.quantity}x ${item.itemId}`);
        });
      }
    } catch (error) {
      console.error("❌ Error parsing message:", error);
    }
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
  });

  ws.on("close", () => {
    console.log("❌ Connection closed");
  });

  return ws;
}

console.log("🧪 Testing Enhanced Interactive Objects System");
console.log("🔗 Connecting to ws://localhost:3001...");

const client = createTestClient();

// Close after 30 seconds
setTimeout(() => {
  console.log("⏰ Test complete, closing connection");
  client.close();
  process.exit(0);
}, 30000);
