// DEPRECATED: Use osrs-combat-client.js and osrs-combat-client.html for the current client.
/**
 * Enhanced Phaser + Colyseus Client for JSON-based multiplayer
 *
 * Features:
 * - Click-to-move OSRS-style movement
 * - Enhanced UI with OSRS-inspired elements
 * - Player stats display
 * - Improved visual feedback
 * - Basic chat system
 */

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.client = null;
    this.room = null;
    this.playerSprites = new Map();
    this.nameTexts = new Map();
    this.healthBars = new Map();
    this.combatLevelTexts = new Map();
    this.localPlayerId = null;
    this.gameState = {
      tick: 0,
      timestamp: 0,
      playerCount: 0,
      players: {},
    };

    // Movement and UI state
    this.isMoving = false;
    this.targetMarker = null;
    this.chatMessages = [];
    this.chatInput = null;
    this.uiElements = {};
  }

  async create() {
    console.log('🎮 Enhanced GameScene created for JSON multiplayer');

    // Set background to OSRS-inspired green
    this.cameras.main.setBackgroundColor('#2d5a27');

    // Create enhanced visual elements
    this.createEnhancedBackground();
    this.createOSRSInterface();

    // Initialize Colyseus connection
    await this.initializeConnection();

    // Setup enhanced input system
    this.setupEnhancedInput();

    // Setup UI updates
    this.setupUI();
  }

  createEnhancedBackground() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x1a3d1a, 0.2);

    // Create more authentic OSRS-style grid
    for (let x = 0; x < 800; x += 64) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, 600);
    }
    for (let y = 0; y < 600; y += 64) {
      graphics.moveTo(0, y);
      graphics.lineTo(800, y);
    }
    graphics.strokePath();

    // Add some environmental details
    this.createEnvironmentalElements();
  }

  createEnvironmentalElements() {
    // Add some trees and objects for better visual reference
    const environmentGraphics = this.add.graphics();

    // Trees (simple circles)
    environmentGraphics.fillStyle(0x2d4a2d);
    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 150;
      const y = 100 + Math.random() * 50;
      environmentGraphics.fillCircle(x, y, 20);
    }

    // Rocks (small rectangles)
    environmentGraphics.fillStyle(0x666666);
    for (let i = 0; i < 8; i++) {
      const x = 50 + Math.random() * 700;
      const y = 400 + Math.random() * 150;
      environmentGraphics.fillRect(x, y, 16, 12);
    }
  }

  createOSRSInterface() {
    // Create OSRS-style interface elements
    const uiGraphics = this.add.graphics();

    // Main game area border (classic OSRS style)
    uiGraphics.lineStyle(3, 0x8b4513, 1);
    uiGraphics.strokeRect(5, 5, 790, 590);

    // Add minimap placeholder
    uiGraphics.fillStyle(0x1a1a1a);
    uiGraphics.fillRect(650, 20, 140, 140);
    uiGraphics.lineStyle(2, 0x8b4513);
    uiGraphics.strokeRect(650, 20, 140, 140);

    const minimapText = this.add.text(720, 90, 'Minimap\n(Future)', {
      fontSize: '12px',
      color: '#ffffff',
      align: 'center',
    });
    minimapText.setOrigin(0.5);

    // Add player stats panel
    this.createStatsPanel();
  }

  createStatsPanel() {
    const statsGraphics = this.add.graphics();
    statsGraphics.fillStyle(0x2a2a2a);
    statsGraphics.fillRect(20, 450, 200, 130);
    statsGraphics.lineStyle(2, 0x8b4513);
    statsGraphics.strokeRect(20, 450, 200, 130);

    // Stats title
    this.add
      .text(120, 465, 'Player Stats', {
        fontSize: '14px',
        color: '#ffff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5, 0);

    // Combat level display
    this.uiElements.combatLevelText = this.add.text(30, 485, 'Combat Lvl: --', {
      fontSize: '12px',
      color: '#ffffff',
    });

    // Health display
    this.uiElements.healthText = this.add.text(30, 505, 'Health: --/--', {
      fontSize: '12px',
      color: '#ff6666',
    });

    // Coordinates display
    this.uiElements.coordsText = this.add.text(30, 525, 'Position: (---, ---)', {
      fontSize: '12px',
      color: '#cccccc',
    });

    // Connection status
    this.uiElements.statusText = this.add.text(30, 545, 'Status: Connecting...', {
      fontSize: '12px',
      color: '#ffff00',
    });

    // Player count
    this.uiElements.playersText = this.add.text(30, 565, 'Players: 0', {
      fontSize: '12px',
      color: '#66ff66',
    });
  }
  async initializeConnection() {
    try {
      this.client = new Colyseus.Client('ws://localhost:3001');
      console.log('🔌 Connecting to Enhanced JsonGameRoom server...');

      // Update status
      this.updateStatus('Connecting...', 'connecting');

      // Join the room with enhanced player data
      this.room = await this.client.joinOrCreate('runerogue', {
        username: `Player_${Math.floor(Math.random() * 1000)}`,
        combatLevel: Math.floor(Math.random() * 50) + 3, // Random combat level
        skills: {
          attack: Math.floor(Math.random() * 40) + 1,
          strength: Math.floor(Math.random() * 40) + 1,
          defence: Math.floor(Math.random() * 40) + 1,
          hitpoints: 10,
        },
      });

      this.localPlayerId = this.room.sessionId;
      console.log('✅ Enhanced connection established! Player ID:', this.localPlayerId);

      // Update status
      this.updateStatus('Connected', 'connected');

      this.setupEnhancedMessageHandlers();
    } catch (error) {
      console.error('❌ Enhanced connection failed:', error);
      this.updateStatus('Connection Failed', 'disconnected');
    }
  }

  setupEnhancedMessageHandlers() {
    // Handle full state updates
    this.room.onMessage('fullState', state => {
      console.log('🌍 Enhanced state received:', state);
      this.gameState = state;
      this.renderAllPlayers();
      this.updateGameInfo();
      this.updatePlayerStats();
    });

    // Handle state updates
    this.room.onMessage('stateUpdate', update => {
      console.log('📊 Enhanced state update:', update);
      this.gameState.tick = update.tick;
      this.gameState.timestamp = update.timestamp;
      this.gameState.playerCount = update.playerCount;
      this.updateGameInfo();
    });

    // Handle player joined
    this.room.onMessage('playerJoined', player => {
      console.log('➕ Enhanced player joined:', player);
      this.gameState.players[player.id] = player;
      this.createEnhancedPlayerSprite(player.id, player);
      this.updateGameInfo();
      this.showGameMessage(`${player.username} joined the game`, '#66ff66');
    });

    // Handle player left
    this.room.onMessage('playerLeft', data => {
      console.log('➖ Enhanced player left:', data.sessionId);
      const player = this.gameState.players[data.sessionId];
      if (player) {
        this.showGameMessage(`${player.username} left the game`, '#ff6666');
      }
      delete this.gameState.players[data.sessionId];
      this.removePlayerSprite(data.sessionId);
      this.updateGameInfo();
    });

    // Handle player movement updates
    this.room.onMessage('playerUpdate', update => {
      console.log('🏃 Enhanced player moved:', update);
      const player = this.gameState.players[update.sessionId];
      if (player) {
        player.x = update.x;
        player.y = update.y;
        this.updatePlayerSprite(update.sessionId, player);
      }
    });

    // Handle chat messages
    this.room.onMessage('chatMessage', chat => {
      console.log('💬 Enhanced chat:', chat);
      this.showChatMessage(chat);
    });

    // Request initial state
    this.room.send('requestState');
  }

  renderAllPlayers() {
    // Clear existing sprites
    this.playerSprites.forEach((sprite, playerId) => {
      this.removePlayerSprite(playerId);
    });

    // Create sprites for all players
    Object.values(this.gameState.players).forEach(player => {
      this.createPlayerSprite(player.id, player);
    });
  }

  createPlayerSprite(playerId, player) {
    const x = player.x * 4 + 400; // Scale and center (reduced scale for better movement)
    const y = player.y * 4 + 300;

    // Create player sprite (colored rectangle based on whether it's local player)
    const isLocalPlayer = playerId === this.localPlayerId;
    const color = isLocalPlayer ? 0x4444ff : 0x44ff44; // Blue for local, green for others

    const sprite = this.add.rectangle(x, y, 24, 32, color);
    sprite.setStrokeStyle(2, 0x000000);
    this.playerSprites.set(playerId, sprite);

    // Add name text
    const nameText = this.add.text(x, y - 25, player.username || `Player${playerId.substr(0, 4)}`, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: isLocalPlayer ? '#0044aa' : '#009900',
      padding: { x: 4, y: 2 },
    });
    nameText.setOrigin(0.5, 0.5);
    this.nameTexts.set(playerId, nameText);

    // Add health bar
    const healthBar = this.add.graphics();
    this.healthBars.set(playerId, healthBar);
    this.updateHealthBar(playerId, player.health, 100); // Assuming max health is 100
  }

  updatePlayerSprite(playerId, player) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);

    if (sprite && nameText) {
      const x = player.x * 4 + 400;
      const y = player.y * 4 + 300;

      // Smooth movement animation
      this.tweens.add({
        targets: [sprite, nameText],
        x: x,
        y: playerId === nameText ? y - 25 : y, // Name text offset
        duration: 200,
        ease: 'Power2',
      });

      this.updateHealthBar(playerId, player.health, 100);
    }
  }

  removePlayerSprite(playerId) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);
    const healthBar = this.healthBars.get(playerId);

    if (sprite) sprite.destroy();
    if (nameText) nameText.destroy();
    if (healthBar) healthBar.destroy();

    this.playerSprites.delete(playerId);
    this.nameTexts.delete(playerId);
    this.healthBars.delete(playerId);
  }

  updateHealthBar(playerId, health, maxHealth) {
    const healthBar = this.healthBars.get(playerId);
    if (!healthBar) return;

    const sprite = this.playerSprites.get(playerId);
    if (!sprite) return;

    const x = sprite.x - 15;
    const y = sprite.y - 20;
    const width = 30;
    const height = 4;

    healthBar.clear();

    // Background
    healthBar.fillStyle(0x000000);
    healthBar.fillRect(x, y, width, height);

    // Health
    const healthPercent = health / maxHealth;
    const healthColor = healthPercent > 0.6 ? 0x00ff00 : healthPercent > 0.3 ? 0xffff00 : 0xff0000;
    healthBar.fillStyle(healthColor);
    healthBar.fillRect(x, y, width * healthPercent, height);
  }

  showChatMessage(chat) {
    // Simple chat display - could be enhanced later
    console.log(`💬 ${chat.username}: ${chat.message}`);
  }

  setupInput() {
    // Click to move
    this.input.on('pointerdown', pointer => {
      if (!this.room) return;

      const worldX = Math.floor((pointer.worldX - 400) / 4);
      const worldY = Math.floor((pointer.worldY - 300) / 4);

      console.log('🚶 Moving to:', worldX, worldY);
      this.room.send('move', { x: worldX, y: worldY });
    });

    // Keyboard controls
    let lastMoveTime = 0;
    const moveDelay = 150; // Prevent spam

    this.input.keyboard.on('keydown', event => {
      if (!this.room || Date.now() - lastMoveTime < moveDelay) return;

      const localPlayer = this.gameState.players[this.localPlayerId];
      if (!localPlayer) return;

      let dx = 0,
        dy = 0;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          dy = -5;
          break;
        case 'ArrowDown':
        case 'KeyS':
          dy = 5;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          dx = -5;
          break;
        case 'ArrowRight':
        case 'KeyD':
          dx = 5;
          break;
        case 'Space':
          // Future: Attack or interact
          console.log('⚔️ Action key pressed');
          lastMoveTime = Date.now();
          return;
      }

      if (dx !== 0 || dy !== 0) {
        const newX = Math.max(0, Math.min(1000, localPlayer.x + dx));
        const newY = Math.max(0, Math.min(1000, localPlayer.y + dy));
        this.room.send('move', { x: newX, y: newY });
        lastMoveTime = Date.now();
      }
    });
  }

  setupUI() {
    // This will be called by the update loop to refresh UI elements
  }

  updateGameInfo() {
    // Update the UI with current game state
    const statusText = document.getElementById('game-info');
    if (statusText) {
      statusText.innerHTML = `
        Tick: ${this.gameState.tick} | 
        Players: ${this.gameState.playerCount} | 
        You: ${this.localPlayerId ? this.localPlayerId.substr(0, 6) : 'None'}
      `;
    }
  }

  updateStatus(message, className) {
    const statusElement = document.getElementById('status-text');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = className;
    }
  }
}

// Game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'phaser-game',
  backgroundColor: '#2d5a27',
  scene: GameScene,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
};

// Initialize the game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Starting RuneRogue JSON Multiplayer Client...');

  // Create UI elements
  const gameContainer = document.getElementById('phaser-game') || document.body;

  // Add connection status and game info
  const statusDiv = document.createElement('div');
  statusDiv.id = 'connection-status';
  statusDiv.innerHTML = `
    <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-family: Arial; z-index: 1000; min-width: 300px;">
      <h3>🎮 RuneRogue JSON Multiplayer</h3>
      <p>🔌 Status: <span id="status-text">Connecting...</span></p>
      <p>📊 Game: <span id="game-info">Waiting...</span></p>
      <hr style="margin: 8px 0; border: 1px solid #444;">
      <p>⌨️ <strong>Controls:</strong></p>
      <p>• WASD/Arrow keys: Move player</p>
      <p>• Mouse click: Move to location</p>
      <p>• Space: Action (future use)</p>
      <hr style="margin: 8px 0; border: 1px solid #444;">
      <p style="font-size: 10px; color: #aaa;">
        Blue = You, Green = Other players<br>
        Grid shows world coordinates
      </p>
    </div>
  `;
  document.body.appendChild(statusDiv);

  // Start the game
  const game = new Phaser.Game(config);

  console.log('🎮 Phaser game initialized, connecting to JSON multiplayer...');
});
