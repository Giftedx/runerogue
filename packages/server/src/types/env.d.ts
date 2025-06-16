// Environment variable type declarations for TypeScript
type NodeEnv = 'development' | 'production' | 'test';

interface ProcessEnv {
  // Server
  NODE_ENV: NodeEnv;
  PORT?: string;

  // Discord OAuth2
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
  DISCORD_REDIRECT_URI: string;

  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Frontend
  FRONTEND_URL: string;

  // Colyseus
  COLYSEUS_WS_PORT?: string;
}

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends ProcessEnv {}
  }
}

export {};
