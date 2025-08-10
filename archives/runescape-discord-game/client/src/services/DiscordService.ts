import { DiscordSDK, Events } from "@discord/embedded-app-sdk";

// It's good practice to use environment variables for Client ID,
// but for this prototype, we can hardcode it or use a placeholder.
// Vite uses import.meta.env.VITE_DISCORD_CLIENT_ID for env vars.
// We'll use a placeholder for now.
const VITE_DISCORD_CLIENT_ID = "YOUR_DISCORD_CLIENT_ID_PLACEHOLDER";

if (VITE_DISCORD_CLIENT_ID === "YOUR_DISCORD_CLIENT_ID_PLACEHOLDER") {
  console.warn(
    "DiscordService: VITE_DISCORD_CLIENT_ID is not set. Please set it in your environment or .env file.",
  );
}

export class DiscordService {
  private static instance: DiscordService;
  public discordSdk: DiscordSDK;
  private isReady = false;
  private authResult: { code: string } | null = null;

  private constructor() {
    this.discordSdk = new DiscordSDK(VITE_DISCORD_CLIENT_ID);
    this.setupListeners(); // Optional: setup listeners early if needed
  }

  public static getInstance(): DiscordService {
    if (!DiscordService.instance) {
      DiscordService.instance = new DiscordService();
    }
    return DiscordService.instance;
  }

  private setupListeners() {
    // Example: Subscribe to an event if needed upon initialization
    // this.discordSdk.subscribe(Events.VOICE_STATE_UPDATE, (voiceState) => {
    //   console.log('Voice state update:', voiceState);
    // });
  }

  async ready(): Promise<void> {
    if (this.isReady) {
      return Promise.resolve();
    }
    try {
      await this.discordSdk.ready();
      this.isReady = true;
      console.log("Discord SDK is ready");
    } catch (error) {
      console.error("Error making Discord SDK ready:", error);
      throw error; // Re-throw to be handled by caller
    }
  }

  async authorize(): Promise<{ code: string }> {
    if (!this.isReady) {
      throw new Error("Discord SDK is not ready. Call ready() first.");
    }
    if (this.authResult) {
      console.log("Already have auth code:", this.authResult.code);
      return this.authResult;
    }

    console.log("Requesting Discord authorization...");
    try {
      const { code } = await this.discordSdk.commands.authorize({
        client_id: VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "", // Optional: for CSRF protection, generate and validate on server
        prompt: "consent", // 'consent' or 'none'
        scope: [
          "identify", // Get user's Discord ID, username, avatar
          "rpc.activities.write", // To set activity status
          "rpc.voice.read", // To read voice state (e.g., who is in channel)
          // Add other scopes as needed, e.g., 'guilds.join' if you need to add users to guilds
        ],
      });
      console.log("Discord authorization successful, received code:", code);
      this.authResult = { code };
      return { code };
    } catch (error) {
      console.error("Discord authorization failed:", error);
      // Handle specific errors, e.g., user declining authorization
      throw error;
    }
  }

  // Placeholder for future use
  async authenticateSDK(accessToken: string): Promise<any> {
    if (!this.isReady) {
      throw new Error("Discord SDK is not ready.");
    }
    console.log("Authenticating Discord SDK instance with access token...");
    try {
      const auth = await this.discordSdk.commands.authenticate({
        access_token: accessToken,
      });
      console.log("Discord SDK instance authenticated successfully:", auth);
      return auth;
    } catch (error) {
      console.error("Discord SDK instance authentication failed:", error);
      throw error;
    }
  }

  // Example function to get instance connected participants (will be needed later)
  async getInstanceConnectedParticipants() {
    if (
      !this.isReady ||
      !this.discordSdk.commands.getInstanceConnectedParticipants
    ) {
      console.warn("Discord SDK not ready or command not available");
      return null;
    }
    try {
      const { participants } =
        await this.discordSdk.commands.getInstanceConnectedParticipants();
      console.log("Connected participants:", participants);
      return participants;
    } catch (error) {
      console.error("Failed to get connected participants:", error);
      return null;
    }
  }
}
