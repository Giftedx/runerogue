/**
 * RuneRogue Game Server - Main Entry Point
 * Colyseus multiplayer server for RuneRogue
 *
 * @author agent/backend-infra (The Architect)
 * @package @runerogue/game-server
 */

// Patch Node.js fs module to handle EMFILE errors gracefully
import * as fs from "fs";
import * as gracefulFs from "graceful-fs";
gracefulFs.gracefulify(fs);

import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { RuneRogueRoom } from "./rooms/RuneRogueRoom.js";

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

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
