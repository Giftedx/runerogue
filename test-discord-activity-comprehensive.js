#!/usr/bin/env node
/**
 * Comprehensive test of all Discord Activity fixes
 * Tests CORS, WebSocket connection, schema serialization, and state sync
 */

const https = require("https");
const { Client } = require("colyseus.js");

// Disable SSL verification for self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

async function runComprehensiveTest() {
  console.log("🧪 Running comprehensive Discord Activity test...\n");

  let testsPassed = 0;
  let testsTotal = 0;

  // Test 1: HTTPS API endpoint
  testsTotal++;
  console.log("1️⃣ Testing HTTPS API endpoint...");
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.get("https://localhost:2567/health", (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, data }));
      });
      req.on("error", reject);
      req.setTimeout(5000, () => reject(new Error("Timeout")));
    });

    if (response.statusCode === 200) {
      console.log("   ✅ HTTPS API working");
      testsPassed++;
    } else {
      console.log(`   ❌ HTTPS API returned ${response.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ HTTPS API failed: ${error.message}`);
  }

  // Test 2: WebSocket connection
  testsTotal++;
  console.log("\n2️⃣ Testing WebSocket connection...");
  try {
    const client = new Client("wss://localhost:2567");
    const room = await client.joinOrCreate("game", {
      accessToken: "test-user",
    });

    console.log("   ✅ WebSocket connection established");
    console.log(`   📊 Room ID: ${room.id}`);
    console.log(`   📊 Session ID: ${room.sessionId}`);
    testsPassed++;

    // Test 3: State synchronization
    testsTotal++;
    console.log("\n3️⃣ Testing state synchronization...");

    if (room.state) {
      console.log("   ✅ Room state available");
      console.log(`   📊 State keys: ${Object.keys(room.state)}`);

      if (room.state.players) {
        console.log("   ✅ Players map exists");
        console.log(`   👥 Players count: ${room.state.players.size}`);
      }

      if (room.state.enemies) {
        console.log("   ✅ Enemies map exists");
        console.log(`   👹 Enemies count: ${room.state.enemies.size}`);
      }

      testsPassed++;
    } else {
      console.log("   ❌ Room state not available");
    }

    // Test 4: Schema change handling
    testsTotal++;
    console.log("\n4️⃣ Testing schema change handling...");

    let stateChanges = 0;
    const stateChangePromise = new Promise((resolve) => {
      room.onStateChange((state) => {
        stateChanges++;
        if (stateChanges >= 3) {
          resolve();
        }
      });
    });

    // Wait for a few state changes
    setTimeout(() => stateChangePromise, 2000);
    await stateChangePromise;

    console.log(`   ✅ Received ${stateChanges} state changes`);
    testsPassed++;

    // Clean up
    await room.leave();
  } catch (error) {
    console.log(`   ❌ WebSocket test failed: ${error.message}`);
  }

  // Test 5: CORS headers
  testsTotal++;
  console.log("\n5️⃣ Testing CORS headers...");
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: "localhost",
          port: 2567,
          path: "/health",
          method: "OPTIONS",
          headers: {
            Origin: "https://localhost:3000",
            "Access-Control-Request-Method": "GET",
          },
        },
        (res) => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
          });
        }
      );
      req.on("error", reject);
      req.setTimeout(5000, () => reject(new Error("Timeout")));
      req.end();
    });

    if (response.headers["access-control-allow-origin"]) {
      console.log("   ✅ CORS headers present");
      console.log(
        `   🌐 Allow-Origin: ${response.headers["access-control-allow-origin"]}`
      );
      testsPassed++;
    } else {
      console.log("   ❌ CORS headers missing");
    }
  } catch (error) {
    console.log(`   ❌ CORS test failed: ${error.message}`);
  }

  // Results
  console.log("\n" + "=".repeat(50));
  console.log("🧪 TEST RESULTS");
  console.log("=".repeat(50));
  console.log(`✅ Tests Passed: ${testsPassed}/${testsTotal}`);
  console.log(
    `📊 Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`
  );

  if (testsPassed === testsTotal) {
    console.log(
      "\n🎉 ALL TESTS PASSED! Discord Activity is fully operational."
    );
    console.log("\n📋 Ready for:");
    console.log("   🔸 Browser testing at https://localhost:3000");
    console.log("   🔸 Discord Activity testing in Discord");
    console.log("   🔸 Multiplayer gameplay development");
    console.log("   🔸 End-to-end feature implementation");
  } else {
    console.log("\n⚠️  Some tests failed. Check the issues above.");
  }

  console.log("\n" + "=".repeat(50));
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n\n🛑 Test interrupted by user");
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  console.error("\n❌ Uncaught exception:", error.message);
  process.exit(1);
});

// Run the test
runComprehensiveTest().catch((error) => {
  console.error("\n❌ Test suite failed:", error.message);
  process.exit(1);
});
