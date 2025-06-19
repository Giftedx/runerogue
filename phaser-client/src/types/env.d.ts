/**
 * Environment variable type definitions for Vite
 */

interface ImportMetaEnv {
  readonly VITE_GAME_SERVER_URL: string;
  readonly VITE_DISCORD_CLIENT_ID: string;
  readonly VITE_API_URL: string;
  readonly VITE_HTTPS_KEY: string;
  readonly VITE_HTTPS_CERT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
