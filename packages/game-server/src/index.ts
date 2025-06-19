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
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import Redis from "ioredis";
import { RuneRogueRoom } from "./rooms/RuneRogueRoom";

interface TypedRequest<T = any> extends Request {
  body: T;
}

// Create Express app
const app = express();
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
app.post(
  "/api/discord/token",
  (req: TypedRequest<{ code: string }>, res: Response) => {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: "Code is required" });
      return;
    }

    // In development, return a mock token
    if (process.env.NODE_ENV === "development") {
      res.json({
        access_token: "mock-token-" + code,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "identify",
      });
      return;
    }

    // In production, this would exchange the code with Discord
    res.status(501).json({ error: "Production OAuth2 not implemented" });
  }
);

// Create HTTP server
const server = createServer(app);

// Create Colyseus server
const gameServer = new Server({
  server,
  express: app,
});

// Define room
gameServer.define("RuneRogue", RuneRogueRoom);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
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
app.get("/rooms", (_req: Request, res: Response) => {
  // TODO: Implement room listing
  res.json({
    rooms: [],
    note: "Room management not yet implemented - agent/backend-infra task pending",
  });
});

// OSRS data endpoints
app.get("/api/osrs/:dataType", async (req: Request, res: Response) => {
  try {
    const osrsDataModule = await import("@runerogue/osrs-data");
    const { dataType } = req.params;

    if (!osrsDataModule[dataType]) {
      return res.status(404).json({ error: `Data type ${dataType} not found` });
    }

    return res.json(osrsDataModule[dataType]);
  } catch (error) {
    console.error(`Failed to load OSRS data:`, error);
    return res.status(500).json({ error: "Failed to load OSRS data" });
  }
});

// Game stats endpoint
app.get("/api/stats", (_req: Request, res: Response) => {
  const rooms = gameServer.matchMaker.query({});
  const stats = {
    totalRooms: rooms.length,
    totalPlayers: rooms.reduce((sum, room) => sum + room.clients, 0),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  res.json(stats);
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Express error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 2567;

// Start server
async function start() {
  try {
    await gameServer.listen(PORT);
    console.info(`RuneRogue Game Server listening on port ${PORT}`);
    console.info(`Health check: http://localhost:${PORT}/health`);
    console.info(`Rooms info: http://localhost:${PORT}/rooms`);
  } catch (error) {
    console.error("Failed to start game server:", error);
  }
}

start().catch((error: unknown) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});

export { gameServer, app };
