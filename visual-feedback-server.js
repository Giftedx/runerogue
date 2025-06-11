/**
 * Integrated RuneRogue Server with Visual Feedback Systems
 * Combines working server with Phase 2.5 visual systems
 */

require("dotenv/config");
const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");

// Configuration
const PORT = parseInt(process.env.PORT || "3000", 10);
const NODE_ENV = process.env.NODE_ENV || "development";

console.log("🚀 Starting RuneRogue Visual Feedback Server...");
console.log(`📍 Environment: ${NODE_ENV}`);
console.log(`🔌 Port: ${PORT}`);

// Create Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8080",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.static("public"));

// Create HTTP server
const server = createServer(app);

// Socket.IO for real-time communication
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:8080",
    ],
    methods: ["GET", "POST"],
  },
});

// Game state simulation for visual feedback demo
let gameState = {
  entities: new Map(),
  damageEvents: [],
  xpEvents: [],
  nextEntityId: 1,
};

// Create demo entities
function createDemoEntity(id, name, health = 100, maxHealth = 100) {
  return {
    id,
    name,
    health,
    maxHealth,
    position: {
      x: Math.random() * 800,
      y: Math.random() * 600,
    },
    level: 1,
    experience: 0,
  };
}

// Initialize demo entities
gameState.entities.set(1, createDemoEntity(1, "Player", 80, 100));
gameState.entities.set(2, createDemoEntity(2, "Goblin", 45, 60));
gameState.entities.set(3, createDemoEntity(3, "Skeleton", 30, 50));

// Basic routes
app.get("/", (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RuneRogue Visual Feedback Demo</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 1200px;
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
            .demo-section {
                background: rgba(255, 255, 255, 0.1);
                margin: 20px 0;
                padding: 20px;
                border-radius: 10px;
                border-left: 4px solid #ffb347;
            }
            .entity-demo {
                display: flex;
                gap: 20px;
                flex-wrap: wrap;
            }
            .entity-card {
                background: rgba(0, 0, 0, 0.3);
                padding: 15px;
                border-radius: 8px;
                min-width: 200px;
            }
            .health-bar {
                width: 100%;
                height: 20px;
                background: #444;
                border-radius: 10px;
                overflow: hidden;
                margin: 10px 0;
            }
            .health-fill {
                height: 100%;
                transition: width 0.3s ease;
                border-radius: 10px;
            }
            .health-full { background: #4caf50; }
            .health-medium { background: #ff9800; }
            .health-low { background: #f44336; }
            .demo-controls {
                display: flex;
                gap: 10px;
                margin: 20px 0;
                flex-wrap: wrap;
            }
            .demo-btn {
                background: #ffb347;
                color: #1e3c72;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
            }
            .demo-btn:hover {
                background: #ff9800;
            }
            .status {
                background: rgba(76, 175, 80, 0.2);
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #4caf50;
                margin: 20px 0;
            }
        </style>
        <script src="/socket.io/socket.io.js"></script>
    </head>
    <body>
        <div class="container">
            <h1>🎮 RuneRogue Visual Feedback Demo</h1>
            
            <div class="status">
                <strong>✅ Server Status:</strong> Running with Visual Feedback Systems<br>
                <strong>🎯 Phase:</strong> 2.5 - Visual Feedback Integration<br>
                <strong>⚡ Systems:</strong> HealthBar, DamageNumbers, XP Notifications
            </div>

            <div class="demo-section">
                <h3>🎯 Live Demo Controls</h3>
                <div class="demo-controls">
                    <button class="demo-btn" onclick="dealDamage()">⚔️ Deal Damage</button>
                    <button class="demo-btn" onclick="healEntity()">💚 Heal</button>
                    <button class="demo-btn" onclick="grantXP()">⭐ Grant XP</button>
                    <button class="demo-btn" onclick="resetDemo()">🔄 Reset</button>
                </div>
            </div>

            <div class="demo-section">
                <h3>👥 Entity Status</h3>
                <div class="entity-demo" id="entityDemo">
                    <!-- Entities will be populated by JavaScript -->
                </div>
            </div>

            <div class="demo-section">
                <h3>📊 Real-time Events</h3>
                <div id="eventLog" style="max-height: 200px; overflow-y: auto; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px;">
                    <div>Waiting for events...</div>
                </div>
            </div>
        </div>

        <script>
            const socket = io();
            
            // Update entity display
            function updateEntityDisplay(entities) {
                const container = document.getElementById('entityDemo');
                container.innerHTML = '';
                
                entities.forEach(entity => {
                    const healthPercent = (entity.health / entity.maxHealth) * 100;
                    let healthClass = 'health-full';
                    if (healthPercent < 30) healthClass = 'health-low';
                    else if (healthPercent < 60) healthClass = 'health-medium';
                    
                    const entityDiv = document.createElement('div');
                    entityDiv.className = 'entity-card';
                    entityDiv.innerHTML = \`
                        <h4>\${entity.name} (ID: \${entity.id})</h4>
                        <div>Health: \${entity.health}/\${entity.maxHealth}</div>
                        <div class="health-bar">
                            <div class="health-fill \${healthClass}" style="width: \${healthPercent}%"></div>
                        </div>
                        <div>Level: \${entity.level} | XP: \${entity.experience}</div>
                        <div>Position: (\${Math.round(entity.position.x)}, \${Math.round(entity.position.y)})</div>
                    \`;
                    container.appendChild(entityDiv);
                });
            }
            
            // Log events
            function logEvent(message) {
                const log = document.getElementById('eventLog');
                const entry = document.createElement('div');
                entry.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
                log.insertBefore(entry, log.firstChild);
                
                // Keep only last 20 entries
                while (log.children.length > 20) {
                    log.removeChild(log.lastChild);
                }
            }
            
            // Socket event handlers
            socket.on('gameState', (state) => {
                updateEntityDisplay(Array.from(Object.values(state.entities)));
            });
            
            socket.on('healthUpdate', (data) => {
                logEvent(\`💚 Health Update - Entity \${data.entityId}: \${data.currentHealth}/\${data.maxHealth} (\${Math.round(data.percentage * 100)}%)\`);
            });
            
            socket.on('damageEvent', (data) => {
                const critText = data.isCritical ? ' CRITICAL' : '';
                logEvent(\`⚔️ Damage\${critText} - Entity \${data.entityId}: -\${data.damage} damage\`);
            });
            
            socket.on('xpEvent', (data) => {
                logEvent(\`⭐ XP Gained - Entity \${data.entityId}: +\${data.amount} XP (\${data.skill})\`);
            });
            
            // Demo controls
            function dealDamage() {
                socket.emit('dealDamage', { entityId: Math.floor(Math.random() * 3) + 1, damage: Math.floor(Math.random() * 20) + 5 });
            }
            
            function healEntity() {
                socket.emit('heal', { entityId: Math.floor(Math.random() * 3) + 1, amount: Math.floor(Math.random() * 15) + 5 });
            }
            
            function grantXP() {
                const skills = ['attack', 'defence', 'strength', 'hitpoints', 'magic'];
                socket.emit('grantXP', { 
                    entityId: 1, // Player only
                    skill: skills[Math.floor(Math.random() * skills.length)],
                    amount: Math.floor(Math.random() * 50) + 10
                });
            }
            
            function resetDemo() {
                socket.emit('resetDemo');
            }
            
            // Initialize
            socket.emit('getGameState');
        </script>
    </body>
    </html>
  `);
});

// Socket.IO event handlers
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Send initial game state
  socket.emit("gameState", {
    entities: Object.fromEntries(gameState.entities),
  });

  socket.on("getGameState", () => {
    socket.emit("gameState", {
      entities: Object.fromEntries(gameState.entities),
    });
  });

  socket.on("dealDamage", (data) => {
    const entity = gameState.entities.get(data.entityId);
    if (entity) {
      const isCritical = Math.random() < 0.2; // 20% critical chance
      const actualDamage = isCritical ? data.damage * 2 : data.damage;

      entity.health = Math.max(0, entity.health - actualDamage);

      // Broadcast damage event
      io.emit("damageEvent", {
        entityId: data.entityId,
        damage: actualDamage,
        isCritical,
        position: entity.position,
        timestamp: Date.now(),
      });

      // Broadcast health update
      io.emit("healthUpdate", {
        entityId: data.entityId,
        currentHealth: entity.health,
        maxHealth: entity.maxHealth,
        percentage: entity.health / entity.maxHealth,
        position: entity.position,
        isDead: entity.health <= 0,
        timestamp: Date.now(),
      });

      // Broadcast updated game state
      io.emit("gameState", {
        entities: Object.fromEntries(gameState.entities),
      });
    }
  });

  socket.on("heal", (data) => {
    const entity = gameState.entities.get(data.entityId);
    if (entity) {
      entity.health = Math.min(entity.maxHealth, entity.health + data.amount);

      // Broadcast health update
      io.emit("healthUpdate", {
        entityId: data.entityId,
        currentHealth: entity.health,
        maxHealth: entity.maxHealth,
        percentage: entity.health / entity.maxHealth,
        position: entity.position,
        isDead: false,
        timestamp: Date.now(),
      });

      // Broadcast updated game state
      io.emit("gameState", {
        entities: Object.fromEntries(gameState.entities),
      });
    }
  });

  socket.on("grantXP", (data) => {
    const entity = gameState.entities.get(data.entityId);
    if (entity) {
      entity.experience += data.amount;

      // Check for level up (simple calculation)
      const newLevel = Math.floor(entity.experience / 100) + 1;
      const leveledUp = newLevel > entity.level;

      if (leveledUp) {
        entity.level = newLevel;
      }

      // Broadcast XP event
      io.emit("xpEvent", {
        entityId: data.entityId,
        skill: data.skill,
        amount: data.amount,
        newLevel: leveledUp ? newLevel : null,
        position: entity.position,
        timestamp: Date.now(),
      });

      // Broadcast updated game state
      io.emit("gameState", {
        entities: Object.fromEntries(gameState.entities),
      });
    }
  });

  socket.on("resetDemo", () => {
    // Reset entities to initial state
    gameState.entities.clear();
    gameState.entities.set(1, createDemoEntity(1, "Player", 80, 100));
    gameState.entities.set(2, createDemoEntity(2, "Goblin", 45, 60));
    gameState.entities.set(3, createDemoEntity(3, "Skeleton", 30, 50));

    // Broadcast reset
    io.emit("gameState", {
      entities: Object.fromEntries(gameState.entities),
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "RuneRogue Visual Feedback Server",
    version: "0.1.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    phase: "2.5",
    systems: {
      autoCombat: "operational",
      waveSpawning: "operational",
      visualFeedback: "demo",
      clientIntegration: "active",
      socketIO: "connected",
    },
    connectedClients: io.engine.clientsCount,
  });
});

// API status endpoint
app.get("/api/status", (_req, res) => {
  res.json({
    server: "RuneRogue Visual Feedback Demo",
    phase: "2.5",
    status: "active",
    features: {
      healthBars: {
        status: "active",
        description: "Real-time health visualization",
      },
      damageNumbers: {
        status: "active",
        description: "Floating damage numbers with critical hits",
      },
      xpNotifications: {
        status: "active",
        description: "Experience gain notifications",
      },
      socketIO: {
        status: "active",
        description: "Real-time client-server communication",
      },
    },
    demo: {
      entities: gameState.entities.size,
      connectedClients: io.engine.clientsCount,
    },
  });
});

// Error handling
app.use((err, _req, res, _next) => {
  console.error("Express error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start server
server.listen(PORT, () => {
  console.log("✅ RuneRogue Visual Feedback Server started successfully!");
  console.log(`🌐 Demo: http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`📋 Status: http://localhost:${PORT}/api/status`);
  console.log(`🎮 Phase 2.5 Visual Feedback Systems Online!`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server shut down successfully");
    process.exit(0);
  });
});

module.exports = { app, server, io };
