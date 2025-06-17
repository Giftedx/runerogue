/**
 * Discord Activity Validation Script
 *
 * This script validates that the Discord Activity setup is working correctly.
 * Run this from browser console to check integration status.
 */

console.log("🎮 RuneRogue Discord Activity Validation");
console.log("=====================================");

// Check environment variables
console.log("📋 Environment Check:");
console.log("- Discord Client ID:", import.meta.env.VITE_DISCORD_CLIENT_ID);
console.log("- Game Server URL:", import.meta.env.VITE_GAME_SERVER_URL);
console.log("- API URL:", import.meta.env.VITE_API_URL);

// Check if running in Discord iframe
const isInDiscord = window.parent !== window;
console.log("- Running in Discord iframe:", isInDiscord);

// Check Discord SDK availability
try {
  const { DiscordSDK } = await import("@discord/embedded-app-sdk");
  console.log("✅ Discord SDK loaded successfully");
} catch (error) {
  console.error("❌ Discord SDK not available:", error);
}

// Check if HTTPS is working
console.log("- Protocol:", window.location.protocol);
console.log("- Host:", window.location.host);

// Check WebSocket connection capability
if (typeof WebSocket !== "undefined") {
  console.log("✅ WebSocket available");
} else {
  console.error("❌ WebSocket not available");
}

console.log("=====================================");
console.log("🎯 Next Steps:");
if (import.meta.env.VITE_DISCORD_CLIENT_ID === "your_discord_app_id_here") {
  console.log("1. ⚠️  Set up Discord Application ID in .env file");
  console.log("   See: client/DISCORD_SETUP_GUIDE.md");
} else {
  console.log("1. ✅ Discord Application ID configured");
}

if (window.location.protocol !== "https:") {
  console.log("2. ⚠️  HTTPS required for Discord Activity");
} else {
  console.log("2. ✅ HTTPS configured correctly");
}

console.log("3. Test the client by clicking Connect → Join Room");
console.log("4. Check Discord presence updates");
console.log("=====================================");
