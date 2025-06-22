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

import "reflect-metadata";
import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";

import { GameRoom } from "./rooms/GameRoom";
import { SimpleTestRoom } from "./rooms/SimpleTestRoom";
import { SchemalessTestRoom } from "./rooms/SchemalessTestRoom";
import { configureApi } from "./api";

// Create Express app
const app = express() as any;

// Create HTTP server
const server = createServer(app);

// Create Colyseus server
const gameServer = new Server({
  transport: new WebSocketTransport({ server }),
});

// Define rooms
gameServer.define("game", GameRoom);
gameServer.define("test", SimpleTestRoom);
gameServer.define("schemaless", SchemalessTestRoom);

// Configure Express middleware
app.use(express.json());
app.use("/colyseus", monitor());

// Configure API routes
configureApi(app);

// Start the server
const port = Number(process.env.PORT) || 2567;

async function start() {
  try {
    await gameServer.listen(port);
    console.info(`Listening on ws://localhost:${port}`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void start();

export { gameServer, app };
