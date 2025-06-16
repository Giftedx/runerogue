/**
 * RuneRogue Server - Main Entry Point
 * Clean server implementation with working Colyseus schemas
 */

import 'dotenv/config';
import { Server as ColyseusServer } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { CleanGameRoom } from './rooms/CleanGameRoom';
import { SimpleGameRoom } from './rooms/SimpleGameRoom';
import { MinimalGameRoom } from './rooms/MinimalGameRoom';
import { UltraSimpleRoom } from './rooms/UltraSimpleRoom';
import { JsonGameRoom } from './rooms/JsonGameRoom';

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Starting RuneRogue Server...');
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);

// Create Express app
const app: express.Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the static directory
// When running from dist/, we need to go up 3 levels to get to the static folder
const staticPath =
  NODE_ENV === 'development'
    ? path.join(__dirname, '../../../static') // From dist/src/server to static
    : path.join(__dirname, '../../static'); // From src/server to static
app.use(express.static(staticPath));
console.log(`📁 Serving static files from: ${staticPath}`);

// Create HTTP server
const server = createServer(app);

// Create WebSocket transport
const transport = new WebSocketTransport({
  server: server,
});

// Create Colyseus server
const gameServer = new ColyseusServer({
  // @ts-expect-error - Using internal transport option
  transport: transport,
});

// Register game room - using JsonGameRoom for working multiplayer state sync
gameServer.define('runerogue', JsonGameRoom);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'RuneRogue Game Server',
    version: '0.1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
  });
});

// API endpoint for room info
app.get('/api/rooms', async (_req, res) => {
  try {
    // Simple room count - presence API may not be available in all Colyseus versions
    res.json({
      rooms: 0, // Will be updated when rooms are created
      activeRooms: [],
      message: 'Room listing will be implemented when rooms are active',
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch room information' });
  }
});

// Serve the enhanced client
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../static/enhanced-index.html'));
});

// Serve the new OSRS combat client
app.get('/combat', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../static/osrs-combat-client.html'));
});

// Also serve the original client for comparison
app.get('/original', (_req, res) => {
  res.sendFile(path.join(__dirname, '../../static/index.html'));
});

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
server.listen(PORT, () => {
  console.log('✅ RuneRogue Server started successfully!');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🎮 WebSocket: ws://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📋 Rooms: http://localhost:${PORT}/api/rooms`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

export { app, gameServer, server };
