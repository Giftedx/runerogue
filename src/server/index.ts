import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as ColyseusServer } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import { GameRoom } from './game/GameRoom';
import { authRouter } from './routes/auth';
import { errorHandler } from './auth/middleware';

const PORT = process.env.PORT || 3001;

// Initialize Express
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json());

// Routes
app.use('/auth', authRouter);

// Colyseus monitor
app.use('/colyseus', monitor());

// Error handling
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);
  
// Setup Colyseus
const gameServer = new ColyseusServer({
  transport: new WebSocketTransport({
    server,
    pingInterval: 10000,
    pingMaxRetries: 3,
  }),
});

// Register room handlers
gameServer.define('game', GameRoom);

// Start server
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Colyseus monitor available at http://localhost:${PORT}/colyseus`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});
