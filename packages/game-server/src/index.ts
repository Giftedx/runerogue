/**
 * @file RuneRogue Game Server - Main Entry Point
 * @description This file initializes and configures the Colyseus game server for RuneRogue.
 * It sets up an Express server, configures HTTPS (if certificates are available),
 * defines the game rooms, and applies necessary middleware like CORS and the Colyseus monitor.
 * @author The Architect
 * @package @runerogue/game-server
 */

import "reflect-metadata";
import { Server } from "colyseus";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import express from "express";
import cors from "cors";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";
import * as fs from "fs";
import * as path from "path";
import type { Request, Response } from "express";
import type { IncomingMessage } from "http";

import { GameRoom } from "./rooms/GameRoom";
import { SimpleTestRoom } from "./rooms/SimpleTestRoom";
import { SchemalessTestRoom } from "./rooms/SchemalessTestRoom";
import { configureApi } from "./api";

// --- Server Setup ---

/**
 * The Express application instance.
 * @type {express.Express}
 */
const app: express.Express = express();

/**
 * The underlying HTTP/HTTPS server instance.
 * @type {http.Server | https.Server}
 */
let server: any;

try {
  const keyPath = path.resolve(__dirname, "../key.pem");
  const certPath = path.resolve(__dirname, "../cert.pem");

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    server = createHttpsServer(httpsOptions, app);
    console.log("🔒 HTTPS server created with SSL certificates.");
  } else {
    throw new Error("SSL certificates not found, falling back to HTTP.");
  }
} catch (error: any) {
  console.log(`📄 Creating HTTP server: ${error.message}`);
  server = createServer(app);
}

/**
 * The Colyseus game server instance.
 * @type {Server}
 */
const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
    verifyClient: (info: {
      origin?: string;
      secure?: boolean;
      req: IncomingMessage;
    }) => {
      // Allow all connections during development
      return true;
    },
  }),
});

// --- Room Definitions ---

/**
 * Defines the available game rooms.
 * - "game": The main RuneRogue game room.
 * - "test": A simple room for testing basic schema synchronization.
 * - "schemaless": A room for testing without a state schema.
 */
gameServer.define("game", GameRoom);
gameServer.define("test", SimpleTestRoom);
gameServer.define("schemaless", SchemalessTestRoom);

// --- Express Middleware ---

app.use(express.json());

/**
 * Configures Cross-Origin Resource Sharing (CORS) for the server.
 * This is crucial for allowing the Discord Activity and web clients to connect.
 */
app.use(
  cors({
    origin: [
      "https://localhost:3000",
      "https://localhost:3001",
      "https://127.0.0.1:3000",
      "https://127.0.0.1:3001",
      "https://discord.com",
      "https://canary.discord.com",
      "https://ptb.discord.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

/**
 * Configures the API endpoints for the server.
 * @see {@link ./api.ts}
 */
configureApi(app);

/**
 * Attaches the Colyseus monitor panel for real-time server inspection.
 * Accessible at /colyseus
 */
app.use("/colyseus", monitor());

// --- Server Activation ---

const port = Number(process.env.PORT) || 2567;

async function start() {
  try {
    await gameServer.listen(port);
    const protocol = server.cert ? "wss" : "ws";
    const httpProtocol = server.cert ? "https" : "http";
    console.info(`🎮 Game Server: ${protocol}://localhost:${port}`);
    console.info(`🌐 HTTP API: ${httpProtocol}://localhost:${port}`);
    console.info(`📊 Monitor: ${httpProtocol}://localhost:${port}/colyseus`);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void start();

// Graceful shutdown logic
process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  gameServer.gracefullyShutdown().then(() => {
    console.log("Server has been shut down gracefully.");
    process.exit(0);
  });
});

export { gameServer, app };
