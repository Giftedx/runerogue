/**
 * Application Configuration
 *
 * This module provides centralized configuration for the RuneRogue game server,
 * allowing environment-based configuration for different services
 * including the Economy API integration.
 */

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Environment detection
const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

// Configuration
export const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    host: process.env.HOST || '0.0.0.0',
    environment: nodeEnv,
    isDevelopment,
    isProduction,
    isTest,
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['*'],
  },

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'runerogue',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'runerogue',
    synchronize: !isProduction,
    logging: isDevelopment,
  },

  // Economy API configuration
  economyApi: {
    baseUrl: process.env.ECONOMY_API_URL || 'http://localhost:8001',
    timeout: parseInt(process.env.ECONOMY_API_TIMEOUT || '10000', 10), // 10 seconds
    authToken: process.env.ECONOMY_API_TOKEN,
    retryAttempts: parseInt(process.env.ECONOMY_API_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.ECONOMY_API_RETRY_DELAY || '1000', 10), // 1 second
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    prefix: 'runerogue:',
  },

  // Auth configuration
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-me-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    prettyPrint: isDevelopment,
  },
};

// Export default config
export default config;
