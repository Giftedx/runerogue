#!/usr/bin/env node

/**
 * Discord Application Setup Verification Script
 *
 * This script checks if your Discord application is configured correctly
 * and provides debugging information.
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

console.log("🔍 RuneRogue Discord Setup Verification");
console.log("=======================================\n");

/**
 * Check if environment files are properly configured
 */
function checkEnvironmentFiles() {
  console.log("📄 Checking environment files...");

  const files = [
    {
      path: path.join(__dirname, "..", "packages", "phaser-client", ".env"),
      name: "Client .env",
      requiredVars: ["VITE_DISCORD_CLIENT_ID", "VITE_GAME_SERVER_URL"],
    },
    {
      path: path.join(__dirname, "..", "packages", "game-server", ".env"),
      name: "Server .env",
      requiredVars: [
        "DISCORD_CLIENT_ID",
        "DISCORD_CLIENT_SECRET",
        "JWT_SECRET",
      ],
    },
  ];

  for (const file of files) {
    if (!fs.existsSync(file.path)) {
      console.log(`❌ ${file.name}: File not found at ${file.path}`);
      continue;
    }

    const content = fs.readFileSync(file.path, "utf8");
    const missing = [];

    for (const varName of file.requiredVars) {
      const regex = new RegExp(`^${varName}=(.+)$`, "m");
      const match = content.match(regex);

      if (!match || match[1].includes("YOUR_") || match[1].includes("your_")) {
        missing.push(varName);
      }
    }

    if (missing.length === 0) {
      console.log(`✅ ${file.name}: All variables configured`);
    } else {
      console.log(
        `⚠️  ${file.name}: Missing or placeholder values for: ${missing.join(", ")}`
      );
    }
  }
  console.log();
}

/**
 * Check SSL certificates
 */
function checkSSLCertificates() {
  console.log("🔒 Checking SSL certificates...");

  const certPaths = [
    path.join(__dirname, "..", "packages", "phaser-client", "key.pem"),
    path.join(__dirname, "..", "packages", "phaser-client", "cert.pem"),
  ];

  for (const certPath of certPaths) {
    if (fs.existsSync(certPath)) {
      console.log(`✅ ${path.basename(certPath)}: Found`);
    } else {
      console.log(`❌ ${path.basename(certPath)}: Not found at ${certPath}`);
      console.log(
        "   Run: mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1"
      );
    }
  }
  console.log();
}

/**
 * Test server connectivity
 */
async function testServerConnectivity() {
  console.log("🌐 Testing server connectivity...");

  const testUrls = [
    { name: "Client Server", url: "https://localhost:3000/" },
    { name: "Game Server", url: "https://localhost:2567/" },
  ];

  for (const test of testUrls) {
    try {
      await new Promise((resolve, reject) => {
        const req = https.get(
          test.url,
          { rejectUnauthorized: false },
          (res) => {
            console.log(`✅ ${test.name}: Responding (${res.statusCode})`);
            resolve();
          }
        );

        req.on("error", (err) => {
          console.log(`❌ ${test.name}: ${err.message}`);
          resolve(); // Don't reject, just log the error
        });

        req.setTimeout(5000, () => {
          console.log(`⏱️  ${test.name}: Timeout (server may not be running)`);
          req.destroy();
          resolve();
        });
      });
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  console.log();
}

/**
 * Check Discord Activity configuration
 */
function checkDiscordConfig() {
  console.log("🎮 Checking Discord Activity configuration...");

  const configPath = path.join(
    __dirname,
    "..",
    "packages",
    "phaser-client",
    "discord-activity.json"
  );

  if (!fs.existsSync(configPath)) {
    console.log("❌ discord-activity.json: Not found");
    return;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    if (config.activity?.client_id === "YOUR_DISCORD_APP_ID") {
      console.log("⚠️  discord-activity.json: Client ID not updated");
    } else {
      console.log("✅ discord-activity.json: Client ID configured");
    }

    if (config.activity?.url_mappings) {
      console.log("✅ discord-activity.json: URL mappings configured");
    } else {
      console.log("⚠️  discord-activity.json: URL mappings missing");
    }
  } catch (error) {
    console.log(`❌ discord-activity.json: Parse error - ${error.message}`);
  }
  console.log();
}

/**
 * Show next steps
 */
function showNextSteps() {
  console.log("📋 Next Steps:");
  console.log("=============");
  console.log("1. Complete Discord Developer Portal setup:");
  console.log("   - Go to https://discord.com/developers/applications");
  console.log("   - Create application and configure OAuth2 + Activities");
  console.log("");
  console.log("2. Update environment variables:");
  console.log("   - Run: node scripts/setup-discord.js");
  console.log(
    "   - Or manually update .env files with your Discord credentials"
  );
  console.log("");
  console.log("3. Generate SSL certificates (if missing):");
  console.log("   - Install mkcert: https://github.com/FiloSottile/mkcert");
  console.log("   - Run: mkcert -install");
  console.log(
    "   - Generate: mkcert -key-file packages/phaser-client/key.pem -cert-file packages/phaser-client/cert.pem localhost 127.0.0.1 ::1"
  );
  console.log("");
  console.log("4. Start development servers:");
  console.log("   - Run: pnpm dev");
  console.log("");
  console.log("5. Test in Discord:");
  console.log("   - Open Discord desktop app");
  console.log("   - Join a server and voice channel");
  console.log("   - Look for your activity in the activity launcher");
  console.log("");
}

// Run all checks
async function runVerification() {
  try {
    checkEnvironmentFiles();
    checkSSLCertificates();
    await testServerConnectivity();
    checkDiscordConfig();
    showNextSteps();
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

runVerification();
