/**
 * Working Phaser + Colyseus Client (Pure JavaScript)
 *
 * This integrates with the working server at localhost:3001
 * and provides a visual multiplayer experience.
 */

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.client = null;
    this.room = null;
    this.playerSprites = new Map();
    this.enemySprites = new Map();
    this.nameTexts = new Map();
    this.healthBars = new Map();
    this.localPlayerId = null;
  }

  async create() {
    console.log('🎮 GameScene created');

    // Set background
    this.cameras.main.setBackgroundColor('#2d5a27');

    // Initialize Colyseus connection
    await this.initializeConnection();

    // Setup input
    this.setupInput();
  }

  async initializeConnection() {
    try {
      this.client = new Colyseus.Client('ws://localhost:3001');
      console.log('🔌 Connecting to RuneRogue server...');

      // Update status
      const statusElement = document.getElementById('status-text');
      if (statusElement) statusElement.textContent = 'Connecting...';

      // Join the room
      this.room = await this.client.joinOrCreate('runerogue', {
        username: `Player_${Math.floor(Math.random() * 1000)}`,
      });

      this.localPlayerId = this.room.sessionId;
      console.log('✅ Connected! Player ID:', this.localPlayerId);

      // Update status
      if (statusElement) {
        statusElement.textContent = 'Connected';
        statusElement.className = 'connected';
      }

      this.setupRoomHandlers();
    } catch (error) {
      console.error('❌ Connection failed:', error);
      const statusElement = document.getElementById('status-text');
      if (statusElement) {
        statusElement.textContent = 'Connection Failed';
        statusElement.className = 'disconnected';
      }
    }
  }

  setupRoomHandlers() {
    // Player state changes
    this.room.state.players.onAdd((player, playerId) => {
      console.log('👤 Player joined:', playerId, player);
      this.createPlayerSprite(playerId, player);
    });

    this.room.state.players.onRemove((player, playerId) => {
      console.log('👋 Player left:', playerId);
      this.removePlayerSprite(playerId);
    });

    this.room.state.players.onChange((player, playerId) => {
      this.updatePlayerSprite(playerId, player);
    });

    // Enemy state changes
    this.room.state.enemies.onAdd((enemy, enemyId) => {
      console.log('👹 Enemy spawned:', enemyId, enemy);
      this.createEnemySprite(enemyId, enemy);
    });

    this.room.state.enemies.onRemove((enemy, enemyId) => {
      console.log('💀 Enemy removed:', enemyId);
      this.removeEnemySprite(enemyId);
    });

    this.room.state.enemies.onChange((enemy, enemyId) => {
      this.updateEnemySprite(enemyId, enemy);
    });

    // Room messages
    this.room.onMessage('playerAttack', data => {
      console.log('⚔️ Player attack:', data);
      this.showDamageNumber(data.targetId, data.damage);
    });

    this.room.onMessage('enemyAttack', data => {
      console.log('💥 Enemy attack:', data);
      this.showDamageNumber(data.targetId, data.damage);
    });
  }

  createPlayerSprite(playerId, player) {
    const x = player.x * 32 + 400; // Scale and center
    const y = player.y * 32 + 300;

    // Create player sprite (simple colored rectangle for now)
    const sprite = this.add.rectangle(x, y, 24, 32, 0x4444ff);
    sprite.setStrokeStyle(2, 0x000000);
    this.playerSprites.set(playerId, sprite);

    // Add name text
    const nameText = this.add.text(x, y - 25, player.username || `Player${playerId.substr(0, 4)}`, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    });
    nameText.setOrigin(0.5, 0.5);
    this.nameTexts.set(playerId, nameText);

    // Add health bar
    const healthBar = this.add.graphics();
    this.healthBars.set(playerId, healthBar);
    this.updateHealthBar(playerId, player.health, player.maxHealth);
  }

  updatePlayerSprite(playerId, player) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);

    if (sprite && nameText) {
      const x = player.x * 32 + 400;
      const y = player.y * 32 + 300;

      sprite.setPosition(x, y);
      nameText.setPosition(x, y - 25);

      this.updateHealthBar(playerId, player.health, player.maxHealth);
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

  createEnemySprite(enemyId, enemy) {
    const x = enemy.x * 32 + 400;
    const y = enemy.y * 32 + 300;

    // Create enemy sprite (red rectangle)
    const sprite = this.add.rectangle(x, y, 20, 28, 0xff4444);
    sprite.setStrokeStyle(2, 0x000000);
    this.enemySprites.set(enemyId, sprite);

    // Add health bar for enemy
    const healthBar = this.add.graphics();
    this.healthBars.set(enemyId, healthBar);
    this.updateHealthBar(enemyId, enemy.health, enemy.maxHealth);
  }

  updateEnemySprite(enemyId, enemy) {
    const sprite = this.enemySprites.get(enemyId);

    if (sprite) {
      const x = enemy.x * 32 + 400;
      const y = enemy.y * 32 + 300;

      sprite.setPosition(x, y);
      this.updateHealthBar(enemyId, enemy.health, enemy.maxHealth);
    }
  }

  removeEnemySprite(enemyId) {
    const sprite = this.enemySprites.get(enemyId);
    const healthBar = this.healthBars.get(enemyId);

    if (sprite) sprite.destroy();
    if (healthBar) healthBar.destroy();

    this.enemySprites.delete(enemyId);
    this.healthBars.delete(enemyId);
  }

  updateHealthBar(entityId, health, maxHealth) {
    const healthBar = this.healthBars.get(entityId);
    if (!healthBar) return;

    const sprite = this.playerSprites.get(entityId) || this.enemySprites.get(entityId);
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

  showDamageNumber(targetId, damage) {
    const sprite = this.playerSprites.get(targetId) || this.enemySprites.get(targetId);
    if (!sprite) return;

    const damageText = this.add.text(sprite.x, sprite.y - 10, `-${damage}`, {
      fontSize: '14px',
      color: '#ff0000',
      fontStyle: 'bold',
    });
    damageText.setOrigin(0.5, 0.5);

    // Animate damage number
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => damageText.destroy(),
    });
  }

  setupInput() {
    // Click to move
    this.input.on('pointerdown', pointer => {
      if (!this.room) return;

      const worldX = Math.floor((pointer.worldX - 400) / 32);
      const worldY = Math.floor((pointer.worldY - 300) / 32);

      console.log('🚶 Moving to:', worldX, worldY);
      this.room.send('movePlayer', { x: worldX, y: worldY });
    });

    // Keyboard controls
    let lastMoveTime = 0;
    const moveDelay = 200; // Prevent spam

    this.input.keyboard.on('keydown', event => {
      if (!this.room || Date.now() - lastMoveTime < moveDelay) return;

      const player = this.room.state.players.get(this.localPlayerId);
      if (!player) return;

      let dx = 0,
        dy = 0;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          dy = -1;
          break;
        case 'ArrowDown':
        case 'KeyS':
          dy = 1;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          dx = -1;
          break;
        case 'ArrowRight':
        case 'KeyD':
          dx = 1;
          break;
        case 'Space':
          // Attack nearest enemy
          this.room.send('attackNearestEnemy');
          lastMoveTime = Date.now();
          return;
      }

      if (dx !== 0 || dy !== 0) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        this.room.send('movePlayer', { x: newX, y: newY });
        lastMoveTime = Date.now();
      }
    });
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
  console.log('🎮 Starting RuneRogue Phaser Client...');

  // Create UI elements
  const gameContainer = document.getElementById('phaser-game') || document.body;

  // Add connection status
  const statusDiv = document.createElement('div');
  statusDiv.id = 'connection-status';
  statusDiv.innerHTML = `
    <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; border-radius: 5px; font-family: Arial; z-index: 1000;">
      <h3>🎮 RuneRogue Multiplayer</h3>
      <p>🔌 Status: <span id="status-text">Connecting...</span></p>
      <p>⌨️ Controls: WASD/Arrow keys to move, Space to attack</p>
      <p>🖱️ Click to move to location</p>
    </div>
  `;
  document.body.appendChild(statusDiv);

  // Start the game
  const game = new Phaser.Game(config);
});
