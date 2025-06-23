# Discord Activity Troubleshooting Guide

## 🚨 Issue: "Start Activity" Button Not Appearing

### Step 1: Verify Discord Developer Portal Configuration

Go to [Discord Developer Portal](https://discord.com/developers/applications/1386478818365018254) and check:

#### ✅ **General Information**

- [ ] Application Name: "RuneRogue"
- [ ] Description filled out
- [ ] App Icon uploaded (required for activities)
- [ ] Tags include "Game" (recommended)

#### ✅ **OAuth2 Settings**

- [ ] Redirect URIs includes: `https://localhost:3000/auth/discord/callback`
- [ ] Scopes selected:
  - [ ] `applications.commands`
  - [ ] `identify`
  - [ ] `guilds`
  - [ ] `rpc.activities.write` ⚠️ **CRITICAL - THIS IS MISSING!**
- [ ] Bot permissions (if using bot features):
  - [ ] `Send Messages`
  - [ ] `Use Slash Commands`

#### ✅ **Activities Tab** (CRITICAL)

- [ ] Activity URL: `https://localhost:3000/`
- [ ] Activity Name: "RuneRogue"
- [ ] Activity Description: "A multiplayer OSRS-inspired roguelike survival game"
- [ ] Supported Platforms:
  - [ ] Desktop ✓
  - [ ] Mobile (optional)
- [ ] Activity Type: `Embedded`
- [ ] Orientation: `Landscape` or `Any`

#### ✅ **App Directory (Optional but Recommended)**

- [ ] Short Description
- [ ] Detailed Description
- [ ] Screenshots uploaded
- [ ] Privacy Policy URL (can be placeholder for development)
- [ ] Terms of Service URL (can be placeholder for development)

### Step 2: Check Discord Client Requirements

#### ✅ **Discord Client Version**

- [ ] Using Discord Desktop (not web browser)
- [ ] Discord version is up to date (Activities require recent versions)
- [ ] Restart Discord completely after making changes

#### ✅ **Voice Channel Requirements**

- [ ] You are in a voice channel
- [ ] Voice channel has at least 1 other person (some activities require this)
- [ ] You have permission to start activities in this server
- [ ] Server allows activities (check server settings)

### Step 3: Network and SSL Issues

#### ✅ **HTTPS Certificate**

- [ ] Servers running on HTTPS (localhost:3000, localhost:2567)
- [ ] SSL certificate is valid (mkcert generated)
- [ ] No browser security warnings when visiting <https://localhost:3000>
- [ ] Firewall allows connections on ports 3000 and 2567

### Step 4: Discord Activity Manifest

Check if the activity manifest is properly configured in your app.

### Step 5: Common Solutions

1. **Restart Discord completely** (close from system tray)
2. **Clear Discord cache**:
   - Close Discord
   - Delete cache folder: `%APPDATA%/discord/Cache`
   - Restart Discord
3. **Try different voice channel** (some servers disable activities)
4. **Invite another person** to the voice channel
5. **Check server permissions** - some servers disable activities

## 🔧 Quick Fix Commands

```powershell
# Restart your servers
# Stop all processes first (Ctrl+C in terminals)

# Terminal 1: Start game server
cd packages/game-server && pnpm dev

# Terminal 2: Start client
cd packages/phaser-client && pnpm dev
```

## 📞 Need Help?

If none of these work, the issue might be:

- Discord Developer Portal settings not saved properly
- Discord client cache issues
- Server-specific activity restrictions
- Account permissions (some accounts can't start activities)

Try the activity in a different Discord server or ask a friend to test it.
