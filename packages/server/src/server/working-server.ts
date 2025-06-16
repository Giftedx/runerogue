/**
 * Working Colyseus Server - Alternative Approach
 * Using listen method with correct configuration
 */

import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import { Server as ColyseusServer } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { CleanGameRoom } from './rooms/CleanGameRoom';

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);

/* eslint-disable no-console */
console.log('🚀 Starting Working RuneRogue Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);

// Create Express app for static files
const app: express.Application = express();
app.use(express.static('static'));

// Create HTTP server
const httpServer = createServer(app);

// Create WebSocket transport
const transport = new WebSocketTransport({
  server: httpServer,
});

// Create Colyseus server with explicit transport
const gameServer = new ColyseusServer({
  // @ts-expect-error - Using internal transport option
  transport: transport,
});

// Alternative: Set transport after creation
if (!(gameServer as any).transport) {
  (gameServer as any).transport = transport;
}

// Register game room
gameServer.define('runerogue', CleanGameRoom);

// Start server
httpServer.listen(PORT, () => {
  console.log('✅ RuneRogue Server started successfully!');
  console.log(`🌐 HTTP: http://localhost:${PORT}`);
  console.log(`🎮 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔗 Game: ws://localhost:${PORT}/runerogue`);
  console.log(`🧪 Test Client: http://localhost:${PORT}/test-client.html`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  httpServer.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  httpServer.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});
/* eslint-enable no-console */

export { gameServer, httpServer, app };
