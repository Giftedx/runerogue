import { DiscordSDK } from "@discord/embedded-app-sdk";

/**
 * Represents an authenticated Discord user.
 */
export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

/**
 * DiscordActivity handles authentication and user context via Discord SDK.
 */
export class DiscordActivity {
  private sdk: DiscordSDK;

  /**
   * Initialize with your Discord application client ID.
   * @param clientId Discord application client ID (VITE_DISCORD_CLIENT_ID)
   */
  constructor(clientId: string) {
    this.sdk = new DiscordSDK({ clientId });
  }

  /**
   * Performs OAuth2 login and retrieves user information.
   * @returns Authenticated DiscordUser
   */
  async login(): Promise<DiscordUser> {
    try {
      await this.sdk.login();
      const user = await this.sdk.getCurrentUser();
      return {
        id: user.id,
        username: user.username,
        avatar: user.avatar || null,
      };
    } catch (error) {
      console.error("Discord login error", error);
      throw error;
    }
  }
}
