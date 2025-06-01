import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as ColyseusServer } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { monitor } from '@colyseus/monitor';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createConnection } from 'typeorm';
import { GameRoom } from './game/GameRoom';
import { authRouter } from './routes/auth';
import healthRouter from './routes/health';
import { errorHandler } from './auth/middleware';
import logger from './utils/logger';

// Load environment variables
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Initialize Express
const app = express();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: isProduction,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

// Apply rate limiting to all routes
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Request logging
if (isProduction) {
  const morgan = require('morgan');
  app.use(morgan('combined', { stream: { write: (message: string) => logger.http(message.trim()) } }));
}

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check endpoint (no auth required)
app.use('/health', healthRouter);

// API Routes
app.use('/auth', authRouter);

// Colyseus monitor (protected in production)
app.use(
  '/colyseus',
  (req, res, next) => {
    if (isProduction) {
      const auth = { login: 'admin', password: process.env.ADMIN_PASSWORD || 'admin' };
      const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
      const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');
      
      if (login === auth.login && password === auth.password) {
        return next();
      }
      
      res.set('WWW-Authenticate', 'Basic');
      return res.status(401).send('Authentication required.');
    }
    return next();
  },
  monitor()
);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Create HTTP server
const server = createServer(app);

// Database connection
const connectToDatabase = async () => {
  try {
    await createConnection({
      type: 'mongodb',
      url: process.env.MONGODB_URI,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      entities: [
        __dirname + '/**/*.entity{.ts,.js}',
      ],
      synchronize: !isProduction, // Auto-create database schema in development
      logging: !isProduction,
    });
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
};

// Setup Colyseus
const gameServer = new ColyseusServer({
  transport: new WebSocketTransport({
    server,
    pingInterval: 10000,
    pingMaxRetries: 3,
  }),
  presence: new (require('@colyseus/redis').RedisPresence)({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  }),
});

// Register room handlers
gameServer.define('game', GameRoom);

// Handle process termination
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  try {
    // Close Colyseus server
    await gameServer.gracefullyShutdown(true);
    
    // Close HTTP server
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force close after timeout
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await connectToDatabase();
    
    server.listen(PORT, () => {
      logger.info(`Server is running in ${NODE_ENV} mode on port ${PORT}`);
      logger.info(`Colyseus monitor available at http://localhost:${PORT}/colyseus`);
    });
    
    // Handle process termination
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  if (isProduction) {
    // In production, log the error and continue running
    // Consider sending an alert to your monitoring system
  } else {
    // In development, crash the process to surface the error
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  if (isProduction) {
    // In production, log the error and continue running
    // Consider sending an alert to your monitoring system
  } else {
    // In development, crash the process to surface the error
    process.exit(1);
  }
});
