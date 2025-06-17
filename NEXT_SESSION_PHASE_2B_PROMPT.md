# RuneRogue Phase 2B: Discord Activity Integration - Complete Implementation Guide

## 🎯 **MISSION: Transform Working Client into Discord Activity**

**Context**: Phase 2A is COMPLETE! We have a fully working TypeScript React client that successfully connects to the Colyseus game server with real-time multiplayer functionality. The foundation is rock-solid and ready for Discord Activity integration.

## 🏆 **PHASE 2A ACHIEVEMENTS (COMPLETED)**

### ✅ **FULLY WORKING FOUNDATION**

- **TypeScript Client**: React + TypeScript client building successfully (0 errors)
- **Real-time Multiplayer**: Client ↔ Server communication working perfectly
- **Game Server**: Colyseus server running on port 2567 with anti-cheat validation
- **Simple Architecture**: Clean, maintainable code structure
- **Environment Setup**: Proper Vite configuration with TypeScript support

### 📊 **CURRENT WORKING STATE**

```bash
# Working Commands (all tested and functional):
cd c:\Users\aggis\GitHub\runerogue\client && npm run build  # ✅ Builds successfully
cd c:\Users\aggis\GitHub\runerogue\client && npm run dev    # ✅ Client on http://localhost:5173
cd c:\Users\aggis\GitHub\runerogue\packages\game-server && npm run dev  # ✅ Server on port 2567
```

### **Current Architecture**

```text
✅ client/                   - Working React + TypeScript client
✅ packages/game-server/     - Working Colyseus server
✅ packages/shared/          - Shared schemas and types
✅ packages/osrs-data/       - OSRS formulas and data
```

## 🎯 **PHASE 2B OBJECTIVES**

Transform the working HTTP client into a production-ready Discord Activity with HTTPS, Discord SDK integration, and proper embedding capabilities.

### **CRITICAL SUCCESS CRITERIA**

1. **✅ HTTPS Development Setup** - Local HTTPS certificates for Discord requirements
2. **✅ Discord Application Created** - Proper Discord Developer Portal configuration
3. **✅ Discord SDK Integration** - Add Discord authentication and user management
4. **✅ Activity Manifest** - Create proper Discord Activity configuration
5. **✅ Testing & Validation** - Verify Discord Activity works in Discord client

## 🔧 **STEP-BY-STEP IMPLEMENTATION PLAN**

### **Step 1: HTTPS Development Setup (CRITICAL)**

Discord Activities require HTTPS even in development. Set up local certificates:

```bash
# Install mkcert (Windows with Chocolatey)
choco install mkcert

# OR install manually from: https://github.com/FiloSottile/mkcert/releases

# Install root certificate
mkcert -install

# Generate certificates for client
cd c:\Users\aggis\GitHub\runerogue\client
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1

# Verify certificates created
dir *.pem
```

### **Step 2: Update Vite Configuration for HTTPS**

**File**: `client/vite.config.ts`

Add HTTPS support to the existing Vite config:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, "key.pem")),
      cert: fs.readFileSync(path.resolve(__dirname, "cert.pem")),
    },
    port: 5173,
    host: true, // Allow external connections
  },
});
```

### **Step 3: Discord Application Setup**

1. **Create Discord Application**:

   - Go to <https://discord.com/developers/applications>
   - Click "New Application"
   - Name: "RuneRogue"
   - Note the Application ID

2. **Configure Activity Settings**:

   - Go to "Activities" tab
   - Click "New Activity"
   - Activity Name: "RuneRogue"
   - Activity URL: `https://localhost:5173`
   - Enable "Local Activity URL Mappings"

3. **OAuth2 Configuration**:
   - Go to "OAuth2" tab
   - Add redirect URI: `https://localhost:5173/auth/discord/callback`
   - Scopes: `identify`, `guilds`

### **Step 4: Environment Variables Update**

**File**: `client/.env`

Update with Discord configuration:

```env
# Game Server Configuration
VITE_GAME_SERVER_URL=wss://localhost:2567
VITE_API_URL=http://localhost:2567

# Discord Activity Configuration
VITE_DISCORD_CLIENT_ID=YOUR_DISCORD_APP_ID_HERE
VITE_DISCORD_REDIRECT_URI=https://localhost:5173/auth/discord/callback

# HTTPS Configuration
VITE_HTTPS_KEY=./key.pem
VITE_HTTPS_CERT=./cert.pem
```

### **Step 5: Update Discord SDK and Add Discord Integration**

**File**: `client/package.json`

Update Discord SDK to latest version:

```bash
cd c:\Users\aggis\GitHub\runerogue\client
npm install @discord/embedded-app-sdk@latest
```

### **Step 6: Create Discord Activity Integration**

**File**: `client/src/discord/DiscordActivity.ts`

```typescript
import { DiscordSDK } from "@discord/embedded-app-sdk";

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name?: string | null;
}

export interface DiscordAuth {
  access_token: string;
  user: DiscordUser;
}

export class DiscordActivity {
  private discordSdk: DiscordSDK;
  private auth: DiscordAuth | null = null;
  private currentUser: DiscordUser | null = null;

  constructor() {
    this.discordSdk = new DiscordSDK(
      import.meta.env.VITE_DISCORD_CLIENT_ID || "development_client_id"
    );
  }

  async initialize(): Promise<DiscordUser> {
    try {
      // Initialize Discord SDK
      await this.discordSdk.ready();

      // Authenticate user
      const { code } = await this.discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify", "guilds"],
      });

      // Exchange code for access token
      // WARNING: Never expose your Discord OAuth2 client secret or sensitive credentials in client-side code.
      // The /api/token endpoint must be implemented securely on your backend server.
      // For development, you may use a mock endpoint, but in production, always handle OAuth2 token exchange server-side.

      const response = await fetch("/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });

      const { access_token } = await response.json();

      // Get user info
      const auth = await this.discordSdk.commands.authenticate({
        access_token,
      });

      this.auth = auth;
      this.currentUser = auth.user;

      return auth.user;
    } catch (error) {
      console.error("Discord initialization failed:", error);
      throw error;
    }
  }

  getCurrentUser(): DiscordUser | null {
    return this.currentUser;
  }

  async setActivity(details: string, state?: string): Promise<void> {
    if (!this.auth) return;

    try {
      await this.discordSdk.commands.setActivity({
        activity: {
          type: 0, // Playing
          details,
          state,
          timestamps: {
            start: Date.now(),
          },
        },
      });
    } catch (error) {
      console.error("Failed to set Discord activity:", error);
    }
  }

  async close(): Promise<void> {
    // Close Discord SDK gracefully
    this.discordSdk.close();
  }
}
```

### **Step 7: Update SimpleGameClient with Discord Integration**

**File**: `client/src/components/SimpleGameClient.tsx`

Add Discord integration to the existing working client:

```typescript
// Add these imports at the top
import { DiscordActivity, type DiscordUser } from "../discord/DiscordActivity";

// Add Discord state
const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
const [discordActivity] = useState(() => new DiscordActivity());

// Update the useEffect for initialization
useEffect(() => {
  const initializeApp = async () => {
    try {
      // Initialize Discord first
      updateStatus("Initializing Discord...");
      const user = await discordActivity.initialize();
      setDiscordUser(user);
      updateStatus(`Discord connected: ${user.username}`);

      // Then connect to game server
      await connect();
    } catch (error) {
      console.error("Initialization failed:", error);
      updateStatus("Discord initialization failed - running in development mode", true);
      // Fall back to non-Discord mode for development
      await connect();
    }
  };

  initializeApp();

  return () => {
    discordActivity.close();
    disconnect();
  };
}, []);

// Update Discord activity when game state changes
useEffect(() => {
  if (discordUser && playerId) {
    const playerCount = Object.keys(players).length;
    discordActivity.setActivity(
      `Playing RuneRogue`,
      `${playerCount} player${playerCount !== 1 ? 's' : ''} in room`
    );
  }
}, [discordUser, playerId, players]);

// Add Discord user info to the UI
{discordUser && (
  <div style={{ margin: "10px 0", padding: "10px", background: "#5865F2", borderRadius: "5px" }}>
    <h3>Discord User: {discordUser.global_name || discordUser.username}</h3>
  </div>
)}
```

### **Step 8: Create Discord Activity Manifest**

**File**: `client/public/discord-activity.json`

```json
{
  "name": "RuneRogue",
  "description": "OSRS-inspired multiplayer roguelike survival game",
  "developer": {
    "name": "RuneRogue Team"
  },
  "primary_sku_id": null,
  "type": 1,
  "executors": [
    {
      "name": "RuneRogue Game",
      "os": "web",
      "file": "",
      "arguments": [],
      "is_launcher": false
    }
  ],
  "overlay": {
    "locked": false
  },
  "guild_id": null,
  "bot_public": true,
  "bot_require_code_grant": false,
  "terms_of_service_url": "",
  "privacy_policy_url": "",
  "hook": true,
  "rpc_origins": ["https://localhost:5173"],
  "verify_key": ""
}
```

**File**: `client/public/api/token.js` (if using static hosting)

> ⚠️ **WARNING:**  
> The `client/public/api/token.js` approach is for **development only** and is **insecure** for production OAuth2 flows.  
> **Never use this method in production**—always implement a secure, server-side OAuth2 token exchange for live deployments.

For development, create a simple token exchange mock:

**File**: `client/public/api/token.js` (if using static hosting)

Or add to your game server for proper OAuth2 flow.

### **Step 10: Testing & Validation**

1. **Start HTTPS Development Server**:

   ```bash
   cd c:\Users\aggis\GitHub\runerogue\client
   npm run dev
   ```

2. **Verify HTTPS Access**:

   - Visit `https://localhost:5173`
   - Accept certificate warning
   - Verify client loads and connects to game server

3. **Test Discord Activity**:

   - Open Discord Desktop
   - Enable Developer Mode (Settings > Advanced > Developer Mode)
   - Create/join a voice channel
   - Launch activity from Activities tab

4. **Integration Testing**:
   - Verify Discord user authentication
   - Test multiplayer functionality within Discord
   - Validate Discord Rich Presence updates

## 🚨 **CRITICAL REQUIREMENTS**

### **Security & Compliance**

- **HTTPS Mandatory**: Discord Activities require HTTPS
- **CSP Headers**: Configure Content Security Policy for Discord iframe  
  **Example (Vite, Express, or Nginx):**  
  Set the following CSP header to allow Discord to embed your app in an iframe and to restrict resource loading for security:
  ```http
  Content-Security-Policy: default-src 'self'; frame-ancestors https://discord.com https://*.discord.com; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;
  ```
  - For Vite dev server, use the `configureServer` hook or a middleware to set headers.
  - For production (e.g., Nginx), add to your server config:
    ```
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors https://discord.com https://*.discord.com; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";
    ```
  - Adjust sources as needed for external assets.
- **OAuth2 Flow**: Proper Discord authentication required
- **Error Handling**: Graceful fallback for development mode
- **Voice Integration**: Respect Discord voice channel state
  > ℹ️ For details on integrating with Discord voice state in Activities, refer to the [Discord Activities Voice Integration documentation](https://discord.com/developers/docs/activities/voice).
- **Native Feel**: UI should integrate seamlessly with Discord
- **Error Recovery**: Handle Discord connection failures gracefully
- **Load Time**: < 3 seconds in Discord iframe
- **Memory Usage**: < 100MB within Discord
- **Frame Rate**: Maintain 60fps within Discord's iframe
- **Network**: Efficient WebSocket usage for multiplayer

### **User Experience**

- **Responsive Design**: Must work in Discord's resizable iframe
- **Voice Integration**: Respect Discord voice channel state
- **Native Feel**: UI should integrate seamlessly with Discord
- **Error Recovery**: Handle Discord connection failures gracefully

## 📁 **FILES TO CREATE/MODIFY**

### **New Files**

- `client/src/discord/DiscordActivity.ts` - Discord SDK integration
- `client/public/discord-activity.json` - Activity manifest
- `client/key.pem` - HTTPS certificate (generated)
- `client/cert.pem` - HTTPS certificate (generated)

### **Files to Modify**

- `client/vite.config.ts` - Add HTTPS support
- `client/.env` - Add Discord configuration
- `client/src/components/SimpleGameClient.tsx` - Add Discord integration
- `client/package.json` - Update Discord SDK version

## 🎯 **SUCCESS VALIDATION**

### **Phase 2B Complete When**

- ✅ Client runs on HTTPS (<https://localhost:5173>)
- ✅ Discord Application created and configured
- ✅ Discord SDK integrated and authenticating users
- ✅ Activity loads within Discord client
- ✅ Multiplayer functionality works within Discord iframe
- ✅ Discord Rich Presence updates with game state

### **Post-Completion Status**

After successful completion:

- **Production-Ready Discord Activity**: Fully functional within Discord
- **HTTPS Development Environment**: Proper certificates and security
- **Discord Integration**: User authentication and presence
- **Multiplayer Gaming**: Real-time collaborative gameplay in Discord
- **Scalable Architecture**: Ready for advanced features

## 💡 **TROUBLESHOOTING GUIDE**

### **Common Issues & Solutions**

1. **HTTPS Certificate Issues**:

   - Regenerate certificates with mkcert
   - Verify certificate paths in vite.config.ts
   - Check browser security settings

2. **Discord Activity Not Loading**:

   - Verify Application ID in environment variables
   - Check Activity URL configuration
   - Ensure HTTPS is working properly

3. **WebSocket Connection Failures**:

   - Mixed content issues (HTTP WebSocket from HTTPS page)
   - Update game server URL to WSS for production
   - Check firewall/network settings

4. **Discord SDK Errors**:
   - Verify SDK version compatibility
   - Check OAuth2 scope configuration
   - Validate redirect URI settings

## 🚀 **EXECUTION STRATEGY**

1. **Start with HTTPS Setup** - Foundation requirement
2. **Create Discord Application** - External dependency
3. **Implement SDK Integration** - Core functionality
4. **Test Incrementally** - Validate each step
5. **Deploy and Validate** - End-to-end testing

---

**CURRENT STATE**: Working HTTP client with real-time multiplayer ✅
**TARGET STATE**: Production-ready Discord Activity with HTTPS and Discord integration ✅

The foundation is solid. Execute this plan systematically to transform RuneRogue into a fully functional Discord Activity!

## 📋 **QUICK START CHECKLIST**

- [ ] Install mkcert and generate HTTPS certificates
- [ ] Create Discord Application and note Application ID
- [ ] Update Vite config for HTTPS
- [ ] Configure environment variables
- [ ] Update Discord SDK to latest version
- [ ] Implement Discord integration in SimpleGameClient
- [ ] Create Discord Activity manifest
- [ ] Test HTTPS development server
- [ ] Test Discord Activity in Discord client
- [ ] Validate multiplayer functionality in Discord iframe

**Execute this plan and RuneRogue will be a production-ready Discord Activity!** 🎯
