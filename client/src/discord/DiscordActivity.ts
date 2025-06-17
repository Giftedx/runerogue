import { DiscordSDK, DiscordSDKMock } from "@discord/embedded-app-sdk";

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
  private discordSdk: DiscordSDK | DiscordSDKMock;
  private auth: DiscordAuth | null = null;
  private currentUser: DiscordUser | null = null;
  private isReady: boolean = false;

  constructor() {
    const clientId =
      import.meta.env.VITE_DISCORD_CLIENT_ID || "development_client_id";

    // Use mock SDK in development if not running in Discord iframe
    const isDiscordEnvironment = window.parent !== window;

    if (isDiscordEnvironment && clientId !== "development_client_id") {
      this.discordSdk = new DiscordSDK(clientId);
    } else {
      console.warn("Running in development mode with Discord SDK Mock");
      this.discordSdk = new DiscordSDKMock(
        clientId,
        null,
        null
      ) as unknown as DiscordSDK;
    }
  }

  async initialize(): Promise<DiscordUser> {
    try {
      // Initialize Discord SDK
      await this.discordSdk.ready();
      this.isReady = true;

      // Skip auth in mock mode
      if (this.discordSdk instanceof DiscordSDKMock) {
        this.currentUser = {
          id: "dev_user_123",
          username: "DevUser",
          discriminator: "0000",
          avatar: null,
          global_name: "Development User",
        };
        return this.currentUser;
      }

      // Authenticate user
      const { code } = await this.discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify", "guilds"],
      });

      // Exchange code for access token via backend
      const response = await fetch("/api/discord/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const { access_token } = await response.json();

      // Get user info
      const auth = await this.discordSdk.commands.authenticate({
        access_token,
      });

      this.auth = auth;
      this.currentUser = auth.user;

      // Subscribe to Discord events
      this.setupEventHandlers();

      return auth.user;
    } catch (error) {
      console.error("Discord initialization failed:", error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (this.discordSdk instanceof DiscordSDKMock) return;

    // Handle voice channel changes
    this.discordSdk.subscribe("VOICE_CHANNEL_SELECT", (data) => {
      console.log("Voice channel changed:", data);
    });

    // Handle activity instance updates
    this.discordSdk.subscribe("ACTIVITY_INSTANCE_UPDATE", (data) => {
      console.log("Activity instance updated:", data);
    });
  }

  getCurrentUser(): DiscordUser | null {
    return this.currentUser;
  }

  async setActivity(details: string, state?: string): Promise<void> {
    if (!this.isReady || this.discordSdk instanceof DiscordSDKMock) return;

    try {
      await this.discordSdk.commands.setActivity({
        activity: {
          type: 0, // Playing
          details,
          state,
          timestamps: {
            start: Date.now(),
          },
          assets: {
            large_image: "runerogue_logo",
            large_text: "RuneRogue",
          },
        },
      });
    } catch (error) {
      console.error("Failed to set Discord activity:", error);
    }
  }

  async close(): Promise<void> {
    if (this.discordSdk && !(this.discordSdk instanceof DiscordSDKMock)) {
      this.discordSdk.close();
    }
  }

  isInDiscordActivity(): boolean {
    return (
      window.parent !== window &&
      this.isReady &&
      !(this.discordSdk instanceof DiscordSDKMock)
    );
  }
}
