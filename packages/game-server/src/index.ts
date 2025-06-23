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

// Create Colyseus server with HTTPS/WSS transport
const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
    // Force WSS when using HTTPS
    verifyClient: (info: {
      origin?: string;
      secure?: boolean;
      req: IncomingMessage;
    }) => {
      // Allow all connections for development
      return true;
    },
  }),
});

// Define rooms
gameServer.define("game", GameRoom);
gameServer.define("test", SimpleTestRoom);
gameServer.define("schemaless", SchemalessTestRoom);

// Configure Express middleware
app.use(express.json());

// Configure CORS for Discord Activities
app.use(
  cors({
    origin: [
      "https://localhost:3000",
      "https://localhost:3001", // Added port 3001 for client
      "https://127.0.0.1:3000",
      "https://127.0.0.1:3001", // Added port 3001 for client
      "https://discord.com",
      "https://canary.discord.com",
      "https://ptb.discord.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use("/colyseus", monitor());

// Add health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Add basic CORS preflight handling
app.options("*", (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With"
  );
  res.sendStatus(200);
});

// Configure API routes
configureApi(app);

// Start the server
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

export { gameServer, app };
