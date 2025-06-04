import http from 'http';
import express, { Router, Request, Response } from 'express'; // Added Router, Request, Response
import { Server } from 'colyseus';
import { GameRoom } from './rooms/GameRoom';
import axios from 'axios'; // Import axios

const port = Number(process.env.PORT || 2567); // Cloud Run provides PORT, Colyseus default 2567
const app = express();

app.use(express.json()); // Middleware to parse JSON bodies

// API Router Setup
const apiRouter = Router();

// Placeholder for where Discord Client ID and Secret would be securely loaded
// For now, we are just receiving the code.
// const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
// const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;

apiRouter.post('/auth/discord-token-exchange', async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    console.error('Token Exchange: Missing or invalid authorization code.');
    return res.status(400).json({ error: 'Authorization code is required.' });
  }

  console.log(
    `Token Exchange: Received Discord auth code: ${code.substring(0, 10)}... Attempting to exchange for token.`
  );

  // !!! SECURITY WARNING !!!
  // These should be loaded from environment variables and managed securely (e.g., Google Secret Manager).
  // DO NOT commit actual secrets to your repository.
  const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_DISCORD_CLIENT_ID_PLACEHOLDER';
  const DISCORD_CLIENT_SECRET =
    process.env.DISCORD_CLIENT_SECRET || 'YOUR_DISCORD_CLIENT_SECRET_PLACEHOLDER';

  // This redirect URI must match exactly one of the URIs configured in your Discord Developer Portal
  // For Embedded App SDK, this is often a placeholder like http://127.0.0.1 or your main app URL.
  const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://127.0.0.1/callback'; // Example placeholder

  if (
    DISCORD_CLIENT_ID === 'YOUR_DISCORD_CLIENT_ID_PLACEHOLDER' ||
    DISCORD_CLIENT_SECRET === 'YOUR_DISCORD_CLIENT_SECRET_PLACEHOLDER'
  ) {
    console.error(
      'Token Exchange: CRITICAL - Discord Client ID or Secret is not configured in environment variables.'
    );
    return res
      .status(500)
      .json({ error: 'Server configuration error: Discord credentials missing.' });
  }

  const params = new URLSearchParams();
  params.append('client_id', DISCORD_CLIENT_ID);
  params.append('client_secret', DISCORD_CLIENT_SECRET);
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', REDIRECT_URI);

  try {
    const discordResponse = await axios.post('https://discord.com/api/oauth2/token', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token, refresh_token, expires_in, token_type, scope } = discordResponse.data;

    console.log(
      `Token Exchange: Successfully exchanged code for Discord access token. Token Type: ${token_type}, Scope: ${scope}`
    );
    // console.log('Access Token:', access_token); // Be careful logging tokens

    // TODO:
    // 1. Use this access_token to get Discord user ID (Next plan step)
    // 2. Generate Firebase custom token
    // 3. Return Firebase custom token & this Discord access_token to client

    // For now, return the access_token (or part of it) and a success message.
    // This is temporary for testing and will be replaced by the Firebase custom token flow.
    res.status(200).json({
      message: 'Discord token exchange successful.',
      discord_access_token: access_token, // Client will need this for Discord SDK auth
      // firebase_custom_token: "TODO" // This will be added in a later step
    });
  } catch (error: any) {
    console.error('Token Exchange: Error exchanging Discord authorization code for token:');
    if (axios.isAxiosError(error) && error.response) {
      console.error('Discord API Error Status:', error.response.status);
      console.error('Discord API Error Data:', error.response.data);
      res.status(error.response.status || 500).json({
        error: 'Failed to exchange code with Discord.',
        details: error.response.data,
      });
    } else {
      console.error('Unexpected error:', error.message);
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
  }
});

// Mount the API router
app.use('/api', apiRouter);

// Colyseus Game Server Setup
const server = http.createServer(app); // Use the express app for HTTP server
const gameServer = new Server({
  server, // Attach Colyseus to the same HTTP server
});

// Define "game_room" for Colyseus
gameServer.define('game_room', GameRoom);

// Dummy health check route (remains useful)
app.get('/health', (req, res) => {
  res.status(200).send('Server is healthy and Colyseus is attached.');
});

// Start listening
gameServer
  .listen(port)
  .then(() => {
    console.log(`[GameServer] Listening on http://localhost:${port}`);
    console.log(
      `[HttpServer] API endpoint for Discord auth available at POST /api/auth/discord-token-exchange`
    );
  })
  .catch(err => {
    console.error(`[GameServer] Failed to listen on port ${port}`, err);
  });
