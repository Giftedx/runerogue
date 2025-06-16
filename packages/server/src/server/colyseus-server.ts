/**
 * RuneRogue Colyseus Server
 * Simple working server with CleanGameRoom
 */

import 'dotenv/config';
import { Server as ColyseusServer } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer } from 'http';
import { CleanGameRoom } from './rooms/CleanGameRoom';

// Configuration
const PORT = parseInt(process.env.PORT || '3001', 10);

/* eslint-disable no-console */
console.log('🚀 Starting RuneRogue Colyseus Server...');
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);

// Create HTTP server and Colyseus server directly with options
const httpServer = createServer();

// Create Colyseus server without auto-attach
const gameServer = new ColyseusServer({
  // @ts-expect-error - Internal option to prevent auto-attach
  autoAttach: false,
});

// Manually attach with WebSocket transport
// @ts-expect-error - Setting internal transport before attach
gameServer.transport = new WebSocketTransport();
gameServer.attach({
  server: httpServer,
});

// Register game room
gameServer.define('runerogue', CleanGameRoom);

// Start server with WebSocket transport
async function startServer() {
  try {
    httpServer.listen(PORT, () => {
      console.log('✅ RuneRogue Server started successfully!');
      console.log(`🎮 WebSocket: ws://localhost:${PORT}`);
      console.log(`🔗 Connect: ws://localhost:${PORT}/runerogue`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  process.exit(0);
});
/* eslint-enable no-console */

export { gameServer };
