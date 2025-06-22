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
import { createServer as createHttpsServer } from "https";
import express from "express";
import { monitor } from "@colyseus/monitor";
import { WebSocketTransport } from "@colyseus/ws-transport";
import * as fs from "fs";
import * as path from "path";

import { GameRoom } from "./rooms/GameRoom";
import { SimpleTestRoom } from "./rooms/SimpleTestRoom";
import { SchemalessTestRoom } from "./rooms/SchemalessTestRoom";
import { configureApi } from "./api";

// Create Express app
const app = express() as any;

// Try to create HTTPS server if certificates exist, otherwise fallback to HTTP
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
    console.log("🔒 HTTPS server created with SSL certificates");
  } else {
    throw new Error("Certificates not found, using HTTP");
  }
} catch (error: any) {
  console.log(
    "📄 Creating HTTP server (certificates not available):",
    error.message
  );
  server = createServer(app);
}

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
