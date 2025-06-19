/**
 * RuneRogue Game Server - Main Entry Point
 * Colyseus multiplayer server for RuneRogue
 *
 * @author agent/backend-infra (The Architect)
 * @package @runerogue/game-server
 */

// Patch Node.js fs module to handle EMFILE errors gracefully
// import * as fs from "fs";
// import * as gracefulFs from "graceful-fs";
// gracefulFs.gracefulify(fs);

import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { RuneRogueRoom } from "./rooms/RuneRogueRoom";

// Create Express app
const app: import("express").Express = express();
app.use(cors());
app.use(express.json());

/**
 * @api {post} /api/discord/token Discord OAuth2 Token Exchange
 * @apiDescription Exchanges a Discord OAuth2 authorization code for an access token.
 * In development, returns a mock token. In production, securely exchanges the code with Discord.
 * @apiBody {string} code The Discord OAuth2 authorization code.
 * @apiSuccess {string} access_token The Discord access token.
 * @apiSuccess {string} token_type The token type (usually "Bearer").
 * @apiSuccess {number} expires_in Token expiration time in seconds.
 * @apiSuccess {string} scope The scopes granted.
 * @apiError (400) {string} error Code is required.
 * @apiError (500) {string} error Internal server error.
 * @apiError (501) {string} error Production OAuth2 not implemented.
 */
app.post("/api/discord/token", async (req: any, res: any) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Code is required" });
  }

  try {
    // DEVELOPMENT: Return a mock token for local testing
    if (process.env.NODE_ENV === "development") {
      return res.json({
        access_token: "dev_token_" + Date.now(),
        token_type: "Bearer",
        expires_in: 604800,
        scope: "identify guilds",
        note: "Mock token for development only. Do not use in production.",
      });
    }

    // PRODUCTION: Securely exchange code for token with Discord
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      console.error("Discord OAuth2 environment variables missing.");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    });

    const fetch = (await import("node-fetch")).default;
    const discordResponse = await fetch(
      "https://discord.com/api/oauth2/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      },
    );

    if (!discordResponse.ok) {
      const errorBody = await discordResponse.json().catch(() => ({}));
      console.error("Discord token exchange failed:", errorBody);
      return res.status(discordResponse.status).json({
        error: "Failed to exchange code with Discord",
        details: errorBody,
      });
    }

    const tokenData = await discordResponse.json();
    return res.json(tokenData);
  } catch (error) {
    console.error("Token exchange error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create HTTP server
const server = createServer(app);

// Create Colyseus server
const gameServer = new Server({
  server: server,
});

// Register room handlers
gameServer.define("runerogue", RuneRogueRoom);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    package: "@runerogue/game-server",
    uptime: process.uptime(),
    rooms: 0, // TODO: Implement proper room counting
    timestamp: new Date().toISOString(),
    note: "Basic Colyseus server - agent/backend-infra task pending",
  });
});

// Basic room info endpoint
app.get("/rooms", (req, res) => {
  // TODO: Implement room listing
  res.json({
    rooms: [],
    note: "Room management not yet implemented - agent/backend-infra task pending",
  });
});

const PORT = Number(process.env.PORT) || 2567;

// Start server
gameServer
  .listen(PORT)
  .then(() => {
    console.log(`RuneRogue Game Server listening on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Rooms info: http://localhost:${PORT}/rooms`);
  })
  .catch((error) => {
    console.error("Failed to start game server:", error);
  });

export { gameServer, app };
