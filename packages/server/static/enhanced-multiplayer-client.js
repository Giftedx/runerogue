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
      this.createEnhancedPlayerSprite(player.id, player);
    });
  }

  createEnhancedPlayerSprite(playerId, player) {
    const x = player.x * 2 + 400; // Better scaling for larger game area
    const y = player.y * 2 + 300;

    // Create player sprite with enhanced visuals
    const isLocalPlayer = playerId === this.localPlayerId;
    const color = isLocalPlayer ? 0x3366ff : 0x44aa44; // Better colors

    // Player body
    const sprite = this.add.rectangle(x, y, 28, 36, color);
    sprite.setStrokeStyle(2, 0x000000);
    this.playerSprites.set(playerId, sprite);

    // Enhanced name text with background
    const nameText = this.add.text(x, y - 30, player.username || `Player${playerId.substr(0, 4)}`, {
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: isLocalPlayer ? '#0044aa' : '#009900',
      padding: { x: 3, y: 1 },
    });
    nameText.setOrigin(0.5, 0.5);
    this.nameTexts.set(playerId, nameText);

    // Combat level text
    const combatLevel = player.combatLevel || 3;
    const combatText = this.add.text(x, y - 45, `Lvl ${combatLevel}`, {
      fontSize: '10px',
      color: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 2, y: 1 },
    });
    combatText.setOrigin(0.5, 0.5);
    this.combatLevelTexts.set(playerId, combatText);

    // Enhanced health bar
    const healthBar = this.add.graphics();
    this.healthBars.set(playerId, healthBar);
    this.updateHealthBar(playerId, player.health || 100, 100);
  }

  updatePlayerSprite(playerId, player) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);
    const combatText = this.combatLevelTexts.get(playerId);

    if (sprite && nameText && combatText) {
      const x = player.x * 2 + 400;
      const y = player.y * 2 + 300;

      // Smooth movement animation
      this.tweens.add({
        targets: sprite,
        x: x,
        y: y,
        duration: 200,
        ease: 'Power2',
      });

      this.tweens.add({
        targets: nameText,
        x: x,
        y: y - 30,
        duration: 200,
        ease: 'Power2',
      });

      this.tweens.add({
        targets: combatText,
        x: x,
        y: y - 45,
        duration: 200,
        ease: 'Power2',
      });

      this.updateHealthBar(playerId, player.health || 100, 100);

      // Update local player coordinates
      if (playerId === this.localPlayerId) {
        this.updatePlayerCoordinates(player.x, player.y);
      }
    }
  }

  removePlayerSprite(playerId) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);
    const combatText = this.combatLevelTexts.get(playerId);
    const healthBar = this.healthBars.get(playerId);

    if (sprite) sprite.destroy();
    if (nameText) nameText.destroy();
    if (combatText) combatText.destroy();
    if (healthBar) healthBar.destroy();

    this.playerSprites.delete(playerId);
    this.nameTexts.delete(playerId);
    this.combatLevelTexts.delete(playerId);
    this.healthBars.delete(playerId);
  }

  updateHealthBar(playerId, health, maxHealth) {
    const healthBar = this.healthBars.get(playerId);
    if (!healthBar) return;

    const sprite = this.playerSprites.get(playerId);
    if (!sprite) return;

    const x = sprite.x - 18;
    const y = sprite.y - 24;
    const width = 36;
    const height = 5;

    healthBar.clear();

    // Background
    healthBar.fillStyle(0x220000);
    healthBar.fillRect(x, y, width, height);

    // Border
    healthBar.lineStyle(1, 0x000000);
    healthBar.strokeRect(x, y, width, height);

    // Health
    const healthPercent = health / maxHealth;
    const healthColor = healthPercent > 0.6 ? 0x00ff00 : healthPercent > 0.3 ? 0xffaa00 : 0xff0000;
    healthBar.fillStyle(healthColor);
    healthBar.fillRect(x + 1, y + 1, (width - 2) * healthPercent, height - 2);
  }

  setupEnhancedInput() {
    // Enhanced click-to-move system
    this.input.on('pointerdown', pointer => {
      if (!this.room) return;

      // Check if click is in game area (not on UI)
      if (pointer.x > 250 && pointer.x < 640 && pointer.y > 180) {
        const worldX = Math.floor((pointer.worldX - 400) / 2);
        const worldY = Math.floor((pointer.worldY - 300) / 2);

        console.log('🎯 Click-to-move to:', worldX, worldY);
        this.room.send('move', { x: worldX, y: worldY });

        // Show target marker
        this.showTargetMarker(pointer.worldX, pointer.worldY);
      }
    });

    // Enhanced keyboard controls
    let lastMoveTime = 0;
    const moveDelay = 100; // Faster response

    this.input.keyboard.on('keydown', event => {
      if (!this.room || Date.now() - lastMoveTime < moveDelay) return;

      const localPlayer = this.gameState.players[this.localPlayerId];
      if (!localPlayer) return;

      let dx = 0,
        dy = 0;
      const moveDistance = 8; // Larger movement steps

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          dy = -moveDistance;
          break;
        case 'ArrowDown':
        case 'KeyS':
          dy = moveDistance;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          dx = -moveDistance;
          break;
        case 'ArrowRight':
        case 'KeyD':
          dx = moveDistance;
          break;
        case 'Space':
          // Future: Attack or interact
          console.log('⚔️ Action key pressed');
          lastMoveTime = Date.now();
          return;
        case 'Enter':
          // Future: Open chat
          console.log('💬 Chat key pressed');
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

  showTargetMarker(x, y) {
    // Remove existing marker
    if (this.targetMarker) {
      this.targetMarker.destroy();
    }

    // Create new target marker
    this.targetMarker = this.add.graphics();
    this.targetMarker.lineStyle(2, 0xffff00, 1);
    this.targetMarker.strokeCircle(x, y, 15);

    // Animate the marker
    this.tweens.add({
      targets: this.targetMarker,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        if (this.targetMarker) {
          this.targetMarker.destroy();
          this.targetMarker = null;
        }
      },
    });
  }

  showGameMessage(message, color = '#ffffff') {
    // Create floating message
    const messageText = this.add.text(400, 100, message, {
      fontSize: '14px',
      color: color,
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 },
    });
    messageText.setOrigin(0.5);

    // Animate message
    this.tweens.add({
      targets: messageText,
      y: 80,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => messageText.destroy(),
    });
  }

  showChatMessage(chat) {
    // Enhanced chat display (placeholder for now)
    this.showGameMessage(`${chat.username}: ${chat.message}`, '#66ffff');
  }

  setupUI() {
    // UI update loop handled by game loop
  }

  updateGameInfo() {
    if (this.uiElements.playersText) {
      this.uiElements.playersText.setText(`Players: ${this.gameState.playerCount}`);
    }
  }

  updatePlayerStats() {
    const localPlayer = this.gameState.players[this.localPlayerId];
    if (localPlayer && this.uiElements.combatLevelText) {
      this.uiElements.combatLevelText.setText(`Combat Lvl: ${localPlayer.combatLevel || 3}`);
      this.uiElements.healthText.setText(`Health: ${localPlayer.health || 100}/100`);
    }
  }

  updatePlayerCoordinates(x, y) {
    if (this.uiElements.coordsText) {
      this.uiElements.coordsText.setText(`Position: (${x}, ${y})`);
    }
  }

  updateStatus(message, className) {
    if (this.uiElements.statusText) {
      this.uiElements.statusText.setText(`Status: ${message}`);
      // Color coding based on className
      const colors = {
        connecting: '#ffff00',
        connected: '#66ff66',
        disconnected: '#ff6666',
      };
      this.uiElements.statusText.setColor(colors[className] || '#ffffff');
    }
  }
}

// Enhanced game configuration
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

// Initialize the enhanced game
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Starting Enhanced RuneRogue JSON Multiplayer Client...');

  // Enhanced UI elements
  const gameContainer = document.getElementById('phaser-game') || document.body;

  // Enhanced connection status and controls
  const statusDiv = document.createElement('div');
  statusDiv.id = 'enhanced-controls';
  statusDiv.innerHTML = `
    <div style="position: absolute; top: 10px; right: 250px; background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 8px; font-family: Arial; z-index: 1000; min-width: 320px; border: 2px solid #8B4513;">
      <h3 style="margin-top: 0; color: #ffff00;">🎮 Enhanced RuneRogue Multiplayer</h3>
      <p><strong>🎯 Features:</strong></p>
      <ul style="margin: 5px 0; padding-left: 20px; font-size: 12px;">
        <li>Click-to-move OSRS-style movement</li>
        <li>Enhanced visual feedback</li>
        <li>Player stats and combat levels</li>
        <li>Real-time multiplayer sync</li>
      </ul>
      <hr style="margin: 10px 0; border: 1px solid #444;">
      <p><strong>⌨️ Controls:</strong></p>
      <ul style="margin: 5px 0; padding-left: 20px; font-size: 12px;">
        <li><strong>Click:</strong> Move to location (OSRS-style)</li>
        <li><strong>WASD/Arrows:</strong> Direct movement</li>
        <li><strong>Space:</strong> Action (future combat)</li>
        <li><strong>Enter:</strong> Chat (future feature)</li>
      </ul>
      <hr style="margin: 10px 0; border: 1px solid #444;">
      <p style="font-size: 10px; color: #aaa; margin: 5px 0;">
        🔵 Blue = You | 🟢 Green = Other players<br>
        Yellow circles = Move targets | Stats panel on left
      </p>
    </div>
  `;
  document.body.appendChild(statusDiv);

  // Start the enhanced game
  const game = new Phaser.Game(config);

  console.log('🎮 Enhanced Phaser game initialized with JSON multiplayer...');
});
