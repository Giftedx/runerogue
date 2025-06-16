import { Router, Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { authenticateToken, generateAccessToken, UserPayload } from '../auth/middleware';

// Extend Express Request type to include user
declare module 'express' {
  interface Request {
    user?: UserPayload;
  }
}

const router: Router = Router();

// Initialize Discord OAuth2 configuration
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface DiscordUser {
  id: string;
  username: string;
  avatar?: string;
  discriminator: string;
  email?: string;
  verified?: boolean;
}

// Alias for authenticated requests
type AuthenticatedRequest = Request & {
  user: UserPayload;
};

// Extend Request type to include query parameters
interface DiscordCallbackRequest extends Request {
  query: {
    code?: string;
    error?: string;
    error_description?: string;
  };
}

// Redirect to Discord OAuth2
router.get('/discord', (_req: Request, res: Response) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: 'identify email',
  });

  res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
});

// OAuth2 callback
router.get('/discord/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const discordReq = req as unknown as DiscordCallbackRequest;
    const { code } = discordReq.query;

    if (!code) {
      res.status(400).json({ error: 'No code provided' });
      return;
    }

    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code as string,
      redirect_uri: DISCORD_REDIRECT_URI,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: tokenParams,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokens = (await tokenResponse.json()) as DiscordTokenResponse;

    if (!tokenResponse.ok) {
      const error = tokens.error_description || 'Failed to get access token';
      throw new Error(error);
    }

    // Get user info
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        authorization: `${tokens.token_type} ${tokens.access_token}`,
      },
    });

    const user = (await userResponse.json()) as DiscordUser;

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    // Generate JWT token
    const token = generateAccessToken({
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      discriminator: user.discriminator,
    });

    // Redirect to frontend with token
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Auth error:', error);
    next(error);
  }
});

// Get current user
router.get('/me', authenticateToken, (req: Request, res: Response) => {
  const authenticatedReq = req as unknown as AuthenticatedRequest;
  if (!authenticatedReq.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  res.json(authenticatedReq.user);
});

export { router as authRouter };
