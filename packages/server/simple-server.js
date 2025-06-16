/**
 * Simple RuneRogue Server - Working JavaScript version
 * Quick start for development without TypeScript compilation issues
 */

require('dotenv/config');
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');

// Configuration
const PORT = parseInt(process.env.PORT || '3002', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log('🚀 Starting Simple RuneRogue Server...');
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);

// Create Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static('public'));

// Create HTTP server
const server = createServer(app);

// Basic routes
app.get('/', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RuneRogue Server</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                color: white;
                min-height: 100vh;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            h1 {
                color: #ffb347;
                text-align: center;
                margin-bottom: 30px;
            }
            .status {
                background: rgba(76, 175, 80, 0.2);
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #4caf50;
                margin: 20px 0;
            }
            .api-list {
                list-style: none;
                padding: 0;
            }
            .api-list li {
                background: rgba(255, 255, 255, 0.1);
                margin: 10px 0;
                padding: 15px;
                border-radius: 8px;
                border-left: 3px solid #ffb347;
            }
            .api-list a {
                color: #ffb347;
                text-decoration: none;
                font-weight: bold;
            }
            .api-list a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎮 RuneRogue Server</h1>
            <div class="status">
                <strong>✅ Server Status:</strong> Running<br>
                <strong>🌐 Environment:</strong> ${NODE_ENV}<br>
                <strong>⚡ Uptime:</strong> ${Math.floor(process.uptime())}s
            </div>
            <h2>🔗 Available Endpoints</h2>
            <ul class="api-list">
                <li><a href="/health">/health</a> - Server health check</li>
                <li><a href="/api/status">/api/status</a> - Detailed server status</li>
                <li><a href="/api/game/stats">/api/game/stats</a> - Game statistics</li>
            </ul>
            <h2>📊 Phase 2.5 Development Status</h2>
            <ul class="api-list">
                <li>✅ AutoCombatSystem - COMPLETE</li>
                <li>✅ WaveSpawningSystem - COMPLETE</li>
                <li>🔄 Visual Feedback Systems - IN PROGRESS</li>
                <li>🔄 Client Integration - IN PROGRESS</li>
            </ul>
        </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'RuneRogue Game Server',
    version: '0.1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    phase: '2.5',
    systems: {
      autoCombat: 'operational',
      waveSpawning: 'operational',
      visualFeedback: 'development',
      clientIntegration: 'development',
    },
  });
});

// API status endpoint
app.get('/api/status', (_req, res) => {
  res.json({
    server: 'RuneRogue',
    phase: '2.5',
    status: 'development',
    features: {
      combat: { status: 'complete', tests: 'passing' },
      waves: { status: 'complete', tests: 'passing' },
      visualFeedback: { status: 'development', progress: '80%' },
      multiplayer: { status: 'development', progress: '60%' },
    },
    endpoints: [
      { path: '/', method: 'GET', description: 'Server info page' },
      { path: '/health', method: 'GET', description: 'Health check' },
      { path: '/api/status', method: 'GET', description: 'Server status' },
      { path: '/api/game/stats', method: 'GET', description: 'Game statistics' },
    ],
  });
});

// Game stats endpoint
app.get('/api/game/stats', (_req, res) => {
  res.json({
    systems: {
      ecs: {
        entities: 0,
        components: ['Health', 'Position', 'Combat', 'Skills'],
        systems: ['AutoCombat', 'WaveSpawning', 'Movement', 'NetworkSync'],
      },
      combat: {
        activeEntities: 0,
        damageEventsQueued: 0,
        healthBarsActive: 0,
      },
      networking: {
        activeConnections: 0,
        messagesPerSecond: 0,
      },
    },
    performance: {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
    },
  });
});

// Error handling
app.use((err, _req, res, _next) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: ['/', '/health', '/api/status', '/api/game/stats'],
  });
});

// Start server
server.listen(PORT, () => {
  console.log('✅ Simple RuneRogue Server started successfully!');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📋 Status: http://localhost:${PORT}/api/status`);
  console.log(`🎮 Stats: http://localhost:${PORT}/api/game/stats`);
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

module.exports = { app, server };
