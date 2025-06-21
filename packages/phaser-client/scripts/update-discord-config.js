#!/usr/bin/env node

/**
 * Updates Discord Activity configuration files with environment variables
 * Run this after setting up your Discord application
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Read environment variables
const DISCORD_CLIENT_ID = process.env.VITE_DISCORD_CLIENT_ID;
const DISCORD_SKU_ID = process.env.VITE_DISCORD_SKU_ID || DISCORD_CLIENT_ID; // Default to client ID if no SKU

if (!DISCORD_CLIENT_ID) {
  console.error("❌ VITE_DISCORD_CLIENT_ID environment variable not set");
  console.log("Please set it in your .env file or environment");
  process.exit(1);
}

// Paths to update
const manifestPath = path.join(
  __dirname,
  "..",
  "public",
  ".well-known",
  "discord-activity.json"
);
const indexPath = path.join(__dirname, "..", "public", "index.html");
const configPath = path.join(__dirname, "..", "src", "config.ts");

// Ensure .well-known directory exists
const wellKnownDir = path.dirname(manifestPath);
if (!fs.existsSync(wellKnownDir)) {
  fs.mkdirSync(wellKnownDir, { recursive: true });
  console.log("✅ Created .well-known directory");
}

// Update discord-activity.json
try {
  let manifestData;

  if (fs.existsSync(manifestPath)) {
    manifestData = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } else {
    // Create default manifest if it doesn't exist
    manifestData = {
      application_id: "YOUR_APPLICATION_ID",
      version: "1.0.0",
      default_route: "/",
      sku_id: "YOUR_SKU_ID",
      name: "RuneRogue",
      activity_type: 0,
      supported_platforms: ["web"],
      age_rating: "E10+",
      max_participants: 4,
      classifications: ["game"],
      proxy_url: "/.proxy/discord",
      orientation_lock_state: "unlocked",
      tablet_default_orientation: "landscape",
      requires_age_gate: false,
      developer: {
        name: "RuneRogue Team",
      },
      embedded_activity_config: {
        description: "OSRS-inspired multiplayer roguelike survival game",
      },
    };
  }

  manifestData.application_id = DISCORD_CLIENT_ID;
  manifestData.sku_id = DISCORD_SKU_ID;

  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), "utf8");
  console.log("✅ Updated discord-activity.json");
} catch (error) {
  console.error("❌ Failed to update discord-activity.json:", error.message);
}

// Update index.html
try {
  let htmlContent;

  if (fs.existsSync(indexPath)) {
    htmlContent = fs.readFileSync(indexPath, "utf8");
    htmlContent = htmlContent.replace(
      /content="YOUR_APPLICATION_ID"/g,
      `content="${DISCORD_CLIENT_ID}"`
    );
  } else {
    // Create default index.html if it doesn't exist
    htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="OSRS-inspired multiplayer roguelike survival game"
    />
    <meta name="theme-color" content="#5865F2" />

    <!-- Discord Activity specific meta tags -->
    <meta name="discord:activity:version" content="1.0.0" />
    <meta
      name="discord:activity:application_id"
      content="${DISCORD_CLIENT_ID}"
    />

    <title>RuneRogue</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  }

  fs.writeFileSync(indexPath, htmlContent, "utf8");
  console.log("✅ Updated index.html");
} catch (error) {
  console.error("❌ Failed to update index.html:", error.message);
}

// Check if the config file exists, and if not, create it.
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, "");
}

const discordConfig = {
  DISCORD_CLIENT_ID: process.env.VITE_DISCORD_CLIENT_ID || "",
};

fs.writeFileSync(
  configPath,
  `// This file is auto-generated. Do not edit directly.

export const discordConfig = ${JSON.stringify(discordConfig, null, 2)};
`
);

console.log("✅ Updated config.ts");

console.log(`
📋 Discord Activity Configuration Updated:
   Application ID: ${DISCORD_CLIENT_ID}
   SKU ID: ${DISCORD_SKU_ID}

🚀 Next steps:
   1. Run 'pnpm dev' to start the development server
   2. Open Discord and test your activity
`);
