import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as ColyseusServer } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { RedisPresence } from '@colyseus/redis-presence';
import { monitor } from '@colyseus/monitor';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createConnection } from 'typeorm';
import appConfig from './app.config';
import { authRouter } from './routes/auth';
// import healthRouter from './routes/health';
import { errorHandler } from './auth/middleware';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import logger from './logger';
import economyIntegration from './economy-integration';

// Load environment variables
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Initialize Express
export const app = express();
export let gameServer: ColyseusServer;
export let server = createServer(app);

// Initialize Economy Integration
let economyReady = false;
(async () => {
  try {
    economyReady = await economyIntegration.isReady();
    logger.info(`Economy integration status: ${economyReady ? 'Ready' : 'Not Ready'}`);
  } catch (error) {
    logger.error('Failed to initialize economy integration:', error);
  }
})();

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: isProduction,
  })
);

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
  app.use(
    morgan('combined', { stream: { write: (message: string) => logger.http(message.trim()) } })
  );
}

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Enhanced health check endpoint (no auth required)
app.get('/health', async (_req, res) => {
  try {
    const health = await checkHealth();
    const status = health.database && health.redis ? 'healthy' : 'degraded';

    // Check economy integration health
    let economyStatus = 'unknown';
    try {
      if (await economyIntegration.isReady()) {
        economyStatus = 'healthy';
      } else {
        economyStatus = 'unhealthy';
      }
    } catch (error) {
      economyStatus = 'error';
    }

    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '0.1.0',
      services: {
        database: health.database ? 'connected' : 'disconnected',
        redis: health.redis ? 'connected' : 'disconnected',
        economy: economyStatus,
      },
    });
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Error checking service health',
    });
  }
});

// Load Swagger YAML file
const swaggerDocument = YAML.load('./src/server/docs/swagger.yaml');

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Other API routes
app.use('/auth', authRouter);

// API Routes
app.use('/auth', authRouter);

// Colyseus monitor (protected in production)
app.use(
  '/colyseus',
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
app.use((_req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

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
    try {
      // Simplified check - just verify we can access the presence system
      if (gameServer.presence) {
        health.redis = true;
      }
    } catch (e) {
      health.redis = false;
    }
  } catch (error) {
    logger.error('Redis health check failed:', error);
  }

  return health;
};

export const startApplication = async (testMode: boolean = false) => {
  gameServer = new ColyseusServer({
    transport: new WebSocketTransport({
      server,
      pingInterval: 10000,
      pingMaxRetries: 3,
    }),
  });

  // Define Colyseus rooms
  appConfig(gameServer);

  // Configure Redis for Colyseus presence and locking
  // Only enable RedisPresence if not in test mode
  if (NODE_ENV !== 'test') {
    gameServer.presence = new RedisPresence({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      // Add password if provided
      password: process.env.REDIS_PASSWORD,
      // Add TLS support for production
      tls: isProduction ? { rejectUnauthorized: false } : undefined,
      // Add connection timeout
      connectTimeout: 30000,
      // Add retry strategy
      retryStrategy: (times: number) => {
        // reconnect after
        return Math.min(times * 50, 2000);
      },
    });
  }

  // Register room handlers
  gameServer.define('game', GameRoom);

  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000; // 5 seconds

  const connectToDatabase = async (retryCount = 0): Promise<boolean> => {
    try {
      logger.info(
        `Attempting to connect to database (Attempt ${retryCount + 1}/${MAX_RETRIES})...`
      );
      await createConnection({
        type: 'sqlite',
        database: isProduction ? 'database.sqlite' : 'database.test.sqlite',
        synchronize: true,
        logging: !isProduction ? ['query', 'error'] : ['error'],
        entities: [__dirname + '/game/EntitySchemas.ts'],
      });
      logger.info('Database connection established successfully.');
      return true;
    } catch (error) {
      logger.error('Database connection failed:', error);
      if (retryCount < MAX_RETRIES - 1) {
        logger.warn(`Retrying database connection in ${RETRY_DELAY / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return connectToDatabase(retryCount + 1);
      } else {
        logger.error('Maximum database connection retries reached. Could not connect to database.');
        return false;
      }
    }
  };

  // Handle process termination with enhanced error handling
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    const shutdownStages = {
      colyseusShutdown: false,
      httpServerClosed: false,
      dbDisconnected: false,
    };

    try {
      // Attempt to shutdown Colyseus game server
      if (gameServer) {
        logger.info('Shutting down Colyseus game server...');
        await gameServer.shutdown();
        shutdownStages.colyseusShutdown = true;
        logger.info('Colyseus game server shut down.');
      }

      // Close HTTP server
      if (server) {
        logger.info('Closing HTTP server...');
        await new Promise<void>((resolve, reject) => {
          server.close(err => {
            if (err) {
              logger.error('Error closing HTTP server:', err);
              return reject(err);
            }
            shutdownStages.httpServerClosed = true;
            logger.info('HTTP server closed.');
            resolve();
          });
        });
      }

      // Disconnect from database
      const connection = await createConnection(); // Get current connection
      if (connection && connection.isConnected) {
        logger.info('Disconnecting from database...');
        await connection.close();
        shutdownStages.dbDisconnected = true;
        logger.info('Database disconnected.');
      }

      logger.info('Graceful shutdown complete.');
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

  const dbConnected = await connectToDatabase();

  server.listen(PORT, () => {
    logger.info(`Server is running in ${NODE_ENV} mode on port ${PORT}`);
    if (isProduction) {
      logger.info(
        `Colyseus monitor available at https://<your-domain>/colyseus (protected by authentication)`
      );
    } else {
      logger.info(`Colyseus monitor available at http://localhost:${PORT}/colyseus`);
    }

    if (!dbConnected && isProduction) {
      logger.warn(
        'Server started without database connection. Some functionality will be limited.'
      );
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
    }, 60000);
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

if (require.main === module && !testMode) {
  startApplication();
}

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
