# 🚨 URGENT: Discord Activity Scope Error Fix

## Error You're Seeing:

```
https://localhost:3000/?error=invalid_scope&error_description=The+requested+scope+is+invalid%2C+unknown%2C+or+malformed.
```

## 🎯 **THE EXACT FIX:**

### **Step 1: Go to Discord Developer Portal**

**Direct Link**: https://discord.com/developers/applications/1386478818365018254/oauth2/general

### **Step 2: Find OAuth2 Scopes Section**

Scroll down to the "Scopes" section in your OAuth2 settings.

### **Step 3: Add the Missing Scope**

Look for this specific scope and **CHECK THE BOX**:

```
☐ rpc.activities.write
```

**Description**: "allows your app to update a user's activity - not currently available for bots"

### 2. Complete OAuth2 URL with All Scopes

After adding the scopes, your OAuth2 URL should look like this:

```
https://discord.com/oauth2/authorize?client_id=1386478818365018254&response_type=code&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fauth%2Fdiscord%2Fcallback&scope=identify+guilds+applications.commands+rpc.activities.write
```

### 3. Test the Activity

1. **Save the scope changes** in Discord Developer Portal
2. **Restart Discord completely**
3. **Join a voice channel**
4. **Look for the activity rocket/controller icon** near the voice controls
5. **Click it and look for "RuneRogue"**

## 🔍 Alternative: Check for Activities Tab

If you still don't see activity options after adding the scopes:

1. **Look for "Activities" tab** in your Discord Developer Portal (left sidebar)
2. **If found**, configure:
   - Activity URL: `https://localhost:3000/`
   - Activity Name: `RuneRogue`
   - Supported Platforms: Desktop

## 🧪 Test Your Setup

Visit this URL to test your configuration:
https://localhost:3000/activity-test.html

This will show you:

- Whether your servers are running
- If Discord SDK can initialize
- What URL parameters Discord provides

## ⚡ Quick Commands to Restart Your Servers

```powershell
# If you need to restart your servers:
# Terminal 1: Game Server
cd packages/game-server && pnpm dev

# Terminal 2: Phaser Client
cd packages/phaser-client && pnpm dev
```

## 🎯 Expected Result

After adding `rpc.activities.write` scope:

- ✅ Activity button appears in voice channels
- ✅ "RuneRogue" shows up in activities list
- ✅ Clicking it opens your game at https://localhost:3000/

This scope is the most commonly missed requirement for Discord Activities!
