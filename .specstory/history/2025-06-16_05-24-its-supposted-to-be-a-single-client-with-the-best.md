<!-- Generated by SpecStory -->

# its supposted to be a single client with the best (2025-06-16 06:24:14)

_**User**_

its supposted to be a single client with the best option (im no expert so it was your job to make the client and pick the framework and engine etc) soo phaser, godot, react, tailwind all combined maybe? or just the best option. it will be an embedded app within discord to play the game with friend in discord (no other way to play the game, just discord) since its essentially a frame within discord (i think - check discord embedded app sdk offical documentation from discord as i really dont know what im doing)

---

_**Assistant**_

I'll help you update the architecture to reflect a single Discord Activity client using the best technology stack for an embedded web-based game. Based on Discord's Embedded App SDK requirements, we need a web-based solution that runs in an iframe within Discord.

Let me update the architecture documentation to reflect the correct approach:

### [architecture.instructions.md](file:///c%3A/Users/aggis/GitHub/runerogue/.github/instructions/architecture.instructions.md)

Update the architecture to use a single web-based client optimized for Discord Activities, using Phaser 3 for the game engine with React for UI components.

````markdown
---
applyTo: "**"
---

# RuneRogue Technical Architecture

## System Overview

RuneRogue uses a modern multiplayer game architecture designed for real-time collaboration while maintaining OSRS authenticity. The system follows a server-authoritative model with client-side prediction for responsive gameplay, specifically optimized for Discord Activities.

```
┌─────────────────────────────────────────┐
│      Discord Activity (iframe)          │
│  ┌──────────────────────────────────┐  │
│  │   RuneRogue Web Client           │  │
│  │  ┌────────────┐ ┌─────────────┐  │  │
│  │  │  Phaser 3  │ │  React UI   │  │  │
│  │  │   (Game)   │ │ (Menus/HUD) │  │  │
│  │  └──────┬─────┘ └──────┬──────┘  │  │
│  │         └───────┬───────┘         │  │
│  │                 │                 │  │
│  │         Discord SDK               │  │
│  └─────────────────┼─────────────────┘  │
└────────────────────┼────────────────────┘
                     │
              WebSocket (Colyseus)
                     │
         ┌───────────┴─────────────────────┐
         │                                 │
┌────────▼────────┐     ┌─────────────────┐     ┌──────────────────┐
│   Game Server   │     │   OSRS Data     │     │  Express API     │
│   (Colyseus)    │◄────┤   Pipeline      ├────►│    Server        │
└─────────────────┘     └─────────────────┘     └──────────────────┘
         │                                                 │
         └───────────────────────┬─────────────────────────┘
                                 │
                          ┌──────▼──────┐
                          │  PostgreSQL │
                          │   Database  │
                          └─────────────┘
```

## Discord Activity Architecture

RuneRogue is built as a Discord Activity - a web application that runs inside Discord's embedded iframe environment. This requires specific architectural considerations:

### Technology Stack for Discord Activities

```typescript
/**
 * Discord Activity client configuration
 * Must be a web-based application that runs in an iframe
 */
export const clientStack = {
  // Game Engine - Phaser 3 for 2D game rendering
  gameEngine: "Phaser 3",

  // UI Framework - React for menus, HUD, and Discord integration
  uiFramework: "React 18",

  // Styling - Tailwind CSS for consistent Discord-like UI
  styling: "Tailwind CSS",

  // Build Tool - Vite for fast development and optimized builds
  buildTool: "Vite",

  // State Management - Zustand for game state outside of Phaser
  stateManagement: "Zustand",

  // Discord Integration - Official Discord Embedded App SDK
  discordSDK: "@discord/embedded-app-sdk",

  // Multiplayer - Colyseus client for WebSocket communication
  networking: "colyseus.js",
};
```

### Discord Activity Setup

```typescript
import { DiscordSDK } from "@discord/embedded-app-sdk";

/**
 * Initialize Discord Activity and authenticate
 */
export class DiscordActivity {
  private discordSdk: DiscordSDK;
  private auth: { access_token: string } | null = null;

  async initialize(): Promise<void> {
    // Initialize Discord SDK with your app ID
    this.discordSdk = new DiscordSDK(process.env.VITE_DISCORD_CLIENT_ID!);

    // Wait for Discord to be ready
    await this.discordSdk.ready();

    // Authenticate and get user info
    const { code } = await this.discordSdk.commands.authorize({
      client_id: process.env.VITE_DISCORD_CLIENT_ID!,
      response_type: "code",
      state: "",
      prompt: "none",
      scope: ["identify", "guilds"],
    });

    // Exchange code for access token
    const response = await fetch("/api/discord/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    this.auth = await response.json();

    // Subscribe to Discord events
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle voice channel changes
    this.discordSdk.subscribe("VOICE_CHANNEL_SELECT", (data) => {
      console.log("Voice channel changed:", data);
    });

    // Handle activity instance updates
    this.discordSdk.subscribe("ACTIVITY_INSTANCE_UPDATE", (data) => {
      console.log("Activity instance updated:", data);
    });
  }

  /**
   * Get current Discord user info
   */
  async getCurrentUser() {
    if (!this.auth) throw new Error("Not authenticated");

    const response = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${this.auth.access_token}`,
      },
    });

    return response.json();
  }

  /**
   * Update activity status
   */
  async setActivity(state: string, details: string) {
    await this.discordSdk.commands.setActivity({
      state,
      details,
      timestamps: {
        start: Date.now(),
      },
    });
  }
}
```

### Client Architecture (Single Web Client)

```typescript
/**
 * Main application structure combining Phaser and React
 */
export class RuneRogueApp {
  private discord: DiscordActivity;
  private game: Phaser.Game;
  private root: ReactDOM.Root;

  async initialize(): Promise<void> {
    // Initialize Discord Activity
    this.discord = new DiscordActivity();
    await this.discord.initialize();

    // Get user info from Discord
    const user = await this.discord.getCurrentUser();

    // Initialize React UI
    this.initializeReactUI(user);

    // Initialize Phaser game
    this.initializePhaserGame(user);

    // Connect to game server
    await this.connectToGameServer(user);
  }

  private initializeReactUI(user: DiscordUser): void {
    // React app handles menus, HUD, chat, inventory
    const container = document.getElementById("ui-root")!;
    this.root = ReactDOM.createRoot(container);

    this.root.render(
      <React.StrictMode>
        <DiscordActivityProvider discord={this.discord}>
          <GameUIProvider>
            <App user={user} />
          </GameUIProvider>
        </DiscordActivityProvider>
      </React.StrictMode>
    );
  }

  private initializePhaserGame(user: DiscordUser): void {
    // Phaser handles game rendering
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: "game-container",
      width: 1280,
      height: 720,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [BootScene, GameScene],
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: process.env.NODE_ENV === "development",
        },
      },
    };

    this.game = new Phaser.Game(config);

    // Pass

---
```
````
