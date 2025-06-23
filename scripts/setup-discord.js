#!/usr/bin/env node

/**
 * Discord Application Setup Script for RuneRogue
 *
 * This script helps you configure your Discord Developer Application
 * and update the environment variables correctly.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("🎮 RuneRogue Discord Application Setup");
console.log("=====================================\n");

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function setupDiscordApp() {
  console.log("📋 Please follow these steps in the Discord Developer Portal:");
  console.log("1. Go to https://discord.com/developers/applications");
  console.log('2. Click "New Application" and name it "RuneRogue"');
  console.log(
    "3. Note down your Application ID from the General Information tab\n"
  );

  const appId = await askQuestion("Enter your Discord Application ID: ");

  console.log('\n4. Go to OAuth2 tab and click "Reset Secret"');
  console.log("5. Copy the new Client Secret (keep it secure!)\n");

  const clientSecret = await askQuestion("Enter your Discord Client Secret: ");

  console.log("\n6. In OAuth2 > Redirect URIs, add these URLs:");
  console.log("   - https://localhost:3000/auth/discord/callback");
  console.log("   - https://localhost:3000/");

  console.log("\n7. Go to Activities tab and add URL mapping:");
  console.log("   - Prefix: /");
  console.log("   - Target: https://localhost:3000");

  await askQuestion(
    "\nPress Enter when you have completed the Discord setup..."
  );

  // Generate JWT secret
  const jwtSecret = crypto.randomBytes(64).toString("hex");

  // Update client .env
  const clientEnvPath = path.join(
    __dirname,
    "..",
    "packages",
    "phaser-client",
    ".env"
  );
  let clientEnv = fs.readFileSync(clientEnvPath, "utf8");
  clientEnv = clientEnv.replace(
    /VITE_DISCORD_CLIENT_ID=.*/,
    `VITE_DISCORD_CLIENT_ID=${appId}`
  );
  fs.writeFileSync(clientEnvPath, clientEnv);

  // Update server .env
  const serverEnvPath = path.join(
    __dirname,
    "..",
    "packages",
    "game-server",
    ".env"
  );
  let serverEnv = fs.readFileSync(serverEnvPath, "utf8");
  serverEnv = serverEnv.replace(
    /DISCORD_CLIENT_ID=.*/,
    `DISCORD_CLIENT_ID=${appId}`
  );
  serverEnv = serverEnv.replace(
    /DISCORD_CLIENT_SECRET=.*/,
    `DISCORD_CLIENT_SECRET=${clientSecret}`
  );
  serverEnv = serverEnv.replace(/JWT_SECRET=.*/, `JWT_SECRET=${jwtSecret}`);
  fs.writeFileSync(serverEnvPath, serverEnv);

  console.log("\n✅ Configuration complete!");
  console.log("\n📁 Updated files:");
  console.log(`   - ${clientEnvPath}`);
  console.log(`   - ${serverEnvPath}`);

  console.log("\n🚀 Next steps:");
  console.log("1. Run: pnpm dev");
  console.log("2. Open Discord and test your activity");
  console.log(
    "3. In Discord, go to a server and start your activity from a voice channel"
  );

  rl.close();
}

// Error handling
process.on("unhandledRejection", (error) => {
  console.error("❌ Setup failed:", error.message);
  process.exit(1);
});

setupDiscordApp().catch(console.error);
