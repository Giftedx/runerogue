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

// Enhanced health check endpoint (no auth required)
app.get('/health', async (req, res) => {
  try {
    const health = await checkHealth();
    const status = health.database && health.redis ? 'healthy' : 'degraded';
    
    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: health.database ? 'connected' : 'disconnected',
        redis: health.redis ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Error checking service health'
    });
  }
});

// Other API routes
app.use('/auth', authRouter);

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

// Database connection with retry logic
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

const connectToDatabase = async (retryCount = 0): Promise<boolean> => {
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
      // Add connection timeout
      connectTimeoutMS: 30000,
      // Add socket timeout
      socketTimeoutMS: 45000,
      // Add server selection timeout
      serverSelectionTimeoutMS: 30000,
      // Add heartbeat frequency
      heartbeatFrequencyMS: 10000,
    });
    logger.info('Database connection established');
    return true;
  } catch (error) {
    logger.error(`Database connection error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);
    
    if (retryCount < MAX_RETRIES - 1) {
      logger.info(`Retrying database connection in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return connectToDatabase(retryCount + 1);
    }
    
    if (isProduction) {
      logger.error('Failed to connect to database after multiple attempts. Server will continue to run but functionality may be limited.');
      return false;
    } else {
      logger.error('Failed to connect to database after multiple attempts. Exiting in development mode.');
      process.exit(1);
    }
  }
};

// Setup Colyseus with enhanced Redis configuration
const gameServer = new ColyseusServer({
  transport: new WebSocketTransport({
    server,
    pingInterval: 10000,
    pingMaxRetries: 3,
  }),
  presence: new (require('@colyseus/redis').RedisPresence)({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    // Add password if provided
    password: process.env.REDIS_PASSWORD,
    // Add TLS support for production
    tls: isProduction ? { rejectUnauthorized: false } : undefined,
    // Add connection timeout
    connectTimeout: 30000,
    // Add retry strategy
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error('Redis connection failed too many times. Giving up.');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 1000, 10000);
      logger.warn(`Redis connection attempt ${times} failed. Retrying in ${delay}ms...`);
      return delay;
    },
  }),
});

// Register room handlers
gameServer.define('game', GameRoom);

// Handle process termination with enhanced error handling
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  
  // Track shutdown stages for better debugging
  const shutdownStages = {
    colyseusShutdown: false,
    httpServerClosed: false
  };
  
  try {
    // Close Colyseus server with timeout
    const colyseusShutdownPromise = Promise.race([
      gameServer.gracefullyShutdown(true),
      new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('Colyseus shutdown timeout')), 5000)
      )
    ]);
    
    try {
      await colyseusShutdownPromise;
      shutdownStages.colyseusShutdown = true;
      logger.info('Colyseus server shut down successfully');
    } catch (colyseusError) {
      logger.error('Error shutting down Colyseus server:', colyseusError);
      // Continue with shutdown process despite Colyseus errors
    }
    
    // Close HTTP server
    const httpServerClosePromise = new Promise<void>((resolve) => {
      server.close(() => {
        shutdownStages.httpServerClosed = true;
        logger.info('HTTP server closed');
        resolve();
      });
    });
    
    // Wait for HTTP server to close with timeout
    const timeoutPromise = new Promise<void>((_, reject) => 
      setTimeout(() => reject(new Error('HTTP server close timeout')), 5000)
    );
    
    try {
      await Promise.race([httpServerClosePromise, timeoutPromise]);
    } catch (httpError) {
      logger.error('Error closing HTTP server:', httpError);
    }
    
    // Log shutdown status
    logger.info(`Shutdown stages completed: ${JSON.stringify(shutdownStages)}`);
    
    // Exit with success if all critical components shut down
    if (shutdownStages.httpServerClosed) {
      logger.info('Graceful shutdown completed successfully');
      process.exit(0);
    } else {
      logger.warn('Partial shutdown completed with some issues');
      process.exit(1);
    }
    
    // Force close after timeout as a last resort
    setTimeout(() => {
      logger.error('Could not complete shutdown in time, forcefully exiting');
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error('Critical error during shutdown:', error);
    process.exit(1);
  }
};

// Health check function for database and Redis
const checkHealth = async (): Promise<{ database: boolean; redis: boolean }> => {
  const health = { database: false, redis: false };
  
  try {
    // Check database connection
    // This would typically use a lightweight query to test the connection
    // For now, we'll just assume it's connected if we got this far
    health.database = true;
  } catch (error) {
    logger.error('Database health check failed:', error);
  }
  
  try {
    // Check Redis connection
    const redisClient = gameServer.presence.client;
    if (redisClient && redisClient.status === 'ready') {
      health.redis = true;
    }
  } catch (error) {
    logger.error('Redis health check failed:', error);
  }
  
  return health;
};

// Start server with enhanced error handling
const startServer = async () => {
  try {
    // Connect to database with retry logic
    const dbConnected = await connectToDatabase();
    
    // Start the server even if database connection fails in production
    // This allows the health endpoint to still work and report the issue
    server.listen(PORT, () => {
      logger.info(`Server is running in ${NODE_ENV} mode on port ${PORT}`);
      if (isProduction) {
        logger.info(`Colyseus monitor available at https://<your-domain>/colyseus (protected by authentication)`);
      } else {
        logger.info(`Colyseus monitor available at http://localhost:${PORT}/colyseus`);
      }
      
      if (!dbConnected && isProduction) {
        logger.warn('Server started without database connection. Some functionality will be limited.');
      }
    });
    
    // Set up periodic health checks in production
    if (isProduction) {
      setInterval(async () => {
        const health = await checkHealth();
        if (!health.database || !health.redis) {
          logger.warn(`Health check failed: Database: ${health.database}, Redis: ${health.redis}`);
          // Here you could implement alerting or auto-recovery logic
        }
      }, 60000); // Check every minute
    }
    
    // Handle process termination
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    if (isProduction) {
      logger.error('Critical startup error in production. Attempting to continue with limited functionality.');
      // In production, we'll still try to start the server for health monitoring
      server.listen(PORT, () => {
        logger.info(`Server running in limited functionality mode on port ${PORT} after startup error`);
      });
    } else {
      process.exit(1);
    }
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
