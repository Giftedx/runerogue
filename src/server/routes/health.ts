import { Request, Response, Router } from 'express';
import { getConnection } from 'typeorm';
import Redis from 'ioredis';
import logger from '../utils/logger';
import fs from 'fs';

const router = Router();

type Status = 'ok' | 'warning' | 'error';

interface HealthCheckResult {
  status: Status;
  timestamp: string;
  uptime: number;
  checks: {
    database: {
      status: Status;
      message?: string;
    };
    redis: {
      status: Status;
      message?: string;
    };
    memory: {
      status: Status;
      usage: NodeJS.MemoryUsage;
      message?: string;
    };
  };
  version: string;
  environment: string;
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the application
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Application is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.45
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                     redis:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                     memory:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: ok
 *                         usage:
 *                           type: object
 *                           properties:
 *                             rss:
 *                               type: number
 *                               example: 12345678
 *                             heapTotal:
 *                               type: number
 *                               example: 1234567
 *                             heapUsed:
 *                               type: number
 *                               example: 123456
 *                             external:
 *                               type: number
 *                               example: 12345
 *                             arrayBuffers:
 *                               type: number
 *                               example: 1234
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 environment:
 *                   type: string
 *                   example: production
 *       503:
 *         description: Service Unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 error:
 *                   type: string
 *                   example: Service Unavailable
 */
router.get('/health', async (_req: Request, res: Response) => {
  const result: HealthCheckResult = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'ok' },
      redis: { status: 'ok' },
      memory: {
        status: 'ok',
        usage: process.memoryUsage(),
      },
    },
    version: process.env.npm_package_version || '0.0.0',
    environment: process.env.NODE_ENV || 'development',
  };

  try {
    // Check database connection
    try {
      const connection = getConnection();
      if (!connection.isConnected) {
        result.checks.database.status = 'error';
        result.checks.database.message = 'Database connection not established';
        result.status = 'error';
      } else {
        await connection.query('SELECT 1');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Database health check failed', { error: errorMessage });
      result.checks.database.status = 'error';
      result.checks.database.message = errorMessage;
      result.status = 'error';
    }

    // Check Redis connection if configured
    if (process.env.REDIS_URL) {
      try {
        const redis = new Redis(process.env.REDIS_URL);
        await redis.ping();
        redis.quit();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Redis health check failed', { error: errorMessage });
        result.checks.redis.status = 'error';
        result.checks.redis.message = errorMessage;
        result.status = 'error';
      }
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const memoryThreshold = 0.9; // 90% of memory limit or available
    
    // If running in a container with memory limits
    if (process.platform === 'linux' && process.memoryUsage().heapTotal > 0) {
      try {
        const memoryLimit = parseInt(
          fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8').trim(),
          10
        );
        
        if (memoryLimit > 0) {
          const memoryUsagePercent = memoryUsage.heapUsed / memoryLimit;
          if (memoryUsagePercent > memoryThreshold) {
            result.checks.memory.status = 'warning';
            result.checks.memory.message = `Memory usage high: ${(memoryUsagePercent * 100).toFixed(2)}%`;
            if (result.status !== 'error') {
              result.status = 'warning';
            }
          }
        }
      } catch (error) {
        // Ignore errors reading memory limit
      }
    }

    // If any critical check failed, return 503
    if (result.status === 'error') {
      return res.status(503).json({
        ...result,
        error: 'Service Unavailable',
      });
    }

    return res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check failed', { error: errorMessage });
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
});

export default router;
