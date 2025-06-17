/**
 * Discord Activity Integration Service
 * Handles Discord SDK initialization, authentication, and social features
 */

import { DiscordSDK, Events, Commands } from "@discord/embedded-app-sdk";

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
}

export interface DiscordParticipant {
  id: string;
  nickname: string;
  user: DiscordUser;
}

export class DiscordActivityService {
  private sdk: DiscordSDK | null = null;
  private currentUser: DiscordUser | null = null;
  private participants: Map<string, DiscordParticipant> = new Map();
  private instanceId: string | null = null;
  private channelId: string | null = null;
  private guildId: string | null = null;

  /**
   * Initialize the Discord SDK and authenticate the user
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize Discord SDK
      const clientId =
        import.meta.env?.VITE_DISCORD_CLIENT_ID || "development_client_id";
      this.sdk = new DiscordSDK(clientId);

      // Wait for the SDK to be ready
      await this.sdk.ready();

      // Authenticate the user
      const { code } = await this.sdk.commands.authorize({
        client_id: clientId,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: ["identify", "guilds"],
      });

      // Exchange code for access token
      const response = await fetch("/api/discord/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error("Failed to exchange Discord code for token");
      }

      const { access_token } = await response.json();

      // Authenticate with Discord
      const auth = await this.sdk.commands.authenticate({
        access_token,
      });

      this.currentUser = auth.user;
      this.instanceId = this.sdk.instanceId;
      this.channelId = this.sdk.channelId;
      this.guildId = this.sdk.guildId;

      // Set up event listeners
      this.setupEventListeners();

      console.log("Discord Activity initialized:", {
        user: this.currentUser.username,
        instanceId: this.instanceId,
        channelId: this.channelId,
      });

      return true;
    } catch (error) {
      console.error("Failed to initialize Discord Activity:", error);
      return false;
    }
  }

  /**
   * Set up Discord SDK event listeners
   */
  private setupEventListeners(): void {
    if (!this.sdk) return;

    // Listen for activity participants updates
    this.sdk.subscribe(
      Events.ACTIVITY_INSTANCE_PARTICIPANTS_UPDATE,
      ({ participants }) => {
        this.participants.clear();
        participants.forEach((participant: DiscordParticipant) => {
          this.participants.set(participant.id, participant);
        });

        // Notify game about participant changes
        this.onParticipantsUpdate?.(Array.from(this.participants.values()));
      }
    );

    // Listen for speaking state changes (optional for voice features)
    this.sdk.subscribe(Events.SPEAKING_START, ({ user_id }) => {
      console.log(`User ${user_id} started speaking`);
    });

    this.sdk.subscribe(Events.SPEAKING_STOP, ({ user_id }) => {
      console.log(`User ${user_id} stopped speaking`);
    });
  }

  /**
   * Invite users to join the activity
   */
  async inviteUsers(): Promise<void> {
    if (!this.sdk) {
      throw new Error("Discord SDK not initialized");
    }

    try {
      await this.sdk.commands.openInviteDialog({});
    } catch (error) {
      console.error("Failed to open invite dialog:", error);
    }
  }

  /**
   * Update the activity status
   */
  async updateActivity(state: string, details?: string): Promise<void> {
    if (!this.sdk) return;

    try {
      await this.sdk.commands.setActivity({
        activity: {
          state,
          details,
          timestamps: {
            start: Date.now(),
          },
          assets: {
            large_image: "logo_large",
            large_text: "RuneRogue",
            small_image: "logo_small",
            small_text: "Playing",
          },
          instance: true,
        },
      });
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
  }

  /**
   * Share achievement or game event to Discord
   */
  async shareAchievement(message: string, imageUrl?: string): Promise<void> {
    if (!this.sdk || !this.channelId) return;

    try {
      // This would require a webhook or bot integration
      // For now, we'll just log it
      console.log("Achievement shared:", message);

      // TODO: Implement actual sharing via webhook
      // await this.shareToChannel(message, imageUrl);
    } catch (error) {
      console.error("Failed to share achievement:", error);
    }
  }

  /**
   * Get current Discord user
   */
  getCurrentUser(): DiscordUser | null {
    return this.currentUser;
  }

  /**
   * Get current participants
   */
  getParticipants(): DiscordParticipant[] {
    return Array.from(this.participants.values());
  }

  /**
   * Get instance information
   */
  getInstanceInfo() {
    return {
      instanceId: this.instanceId,
      channelId: this.channelId,
      guildId: this.guildId,
    };
  }

  /**
   * Check if running in Discord environment
   */
  isDiscordEnvironment(): boolean {
    return (
      typeof window !== "undefined" &&
      window.location.ancestorOrigins?.length > 0 &&
      window.location.ancestorOrigins[0].includes("discord.com")
    );
  }

  /**
   * Cleanup Discord SDK
   */
  destroy(): void {
    if (this.sdk) {
      this.sdk.close();
      this.sdk = null;
    }
    this.participants.clear();
    this.currentUser = null;
  }

  // Event callbacks - can be overridden by the game
  onParticipantsUpdate?: (participants: DiscordParticipant[]) => void;
  onUserJoin?: (user: DiscordParticipant) => void;
  onUserLeave?: (userId: string) => void;
}

// Singleton instance
export const discordActivity = new DiscordActivityService();
