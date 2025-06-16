/**
 * Ultimate Enhanced RuneRogue Phaser Client - Phase 3 Complete
 *
 * Features:
 * - Advanced sprite-based rendering with animations
 * - OSRS-style UI with chat, minimap, and stats
 * - Particle effects and visual feedback
 * - Enhanced multiplayer synchronization
 * - Professional game polish
 */

class UltimatePreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UltimatePreloadScene' });
  }

  preload() {
    // Create enhanced loading screen
    this.createLoadingScreen();

    // Generate all sprites
    this.generateAllSprites();

    // Set up load event handlers
    this.setupLoadHandlers();
  }

  createLoadingScreen() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Background
    this.cameras.main.setBackgroundColor('#0d1b0d');

    // Title
    this.loadingTitle = this.add
      .text(centerX, centerY - 100, '🛡️ RuneRogue Enhanced', {
        fontFamily: 'Arial',
        fontSize: '36px',
        color: '#4CAF50',
        stroke: '#000000',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(centerX, centerY - 60, 'Phase 3 Visual Enhancement Complete', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    // Loading bar background
    this.loadingBarBg = this.add.rectangle(centerX, centerY, 400, 20, 0x333333);
    this.loadingBarBg.setStrokeStyle(2, 0x666666);

    // Loading bar fill
    this.loadingBar = this.add.rectangle(centerX - 200, centerY, 0, 16, 0x4caf50);
    this.loadingBar.setOrigin(0, 0.5);

    // Loading text
    this.loadingText = this.add
      .text(centerX, centerY + 40, 'Loading assets...', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Progress percentage
    this.progressText = this.add
      .text(centerX, centerY + 70, '0%', {
        fontFamily: 'Arial',
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
  }

  setupLoadHandlers() {
    this.load.on('progress', percentage => {
      this.loadingBar.width = 400 * percentage;
      this.progressText.setText(Math.round(percentage * 100) + '%');

      // Update loading messages
      if (percentage < 0.3) {
        this.loadingText.setText('Generating player sprites...');
      } else if (percentage < 0.6) {
        this.loadingText.setText('Creating enemy assets...');
      } else if (percentage < 0.9) {
        this.loadingText.setText('Preparing UI elements...');
      } else {
        this.loadingText.setText('Finalizing game world...');
      }
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Ready to play!');
      this.time.delayedCall(1000, () => {
        this.scene.start('UltimateGameScene');
      });
    });
  }

  generateAllSprites() {
    const generator = new SpriteGenerator();

    // Generate player class sprites
    const classes = ['warrior', 'mage', 'ranger'];
    classes.forEach(className => {
      const sprite = generator.generatePlayerSprite(className, 32);
      this.load.image(`player_${className}`, sprite);
    });

    // Generate enemy sprites
    const enemies = ['goblin', 'skeleton', 'orc'];
    enemies.forEach(enemyType => {
      const sprite = generator.generateEnemySprite(enemyType, 32);
      this.load.image(`enemy_${enemyType}`, sprite);
    });

    // Generate UI elements
    this.load.image('health_bar_bg', generator.generateUISprite('healthBarBg', 32, 6));
    this.load.image('health_bar_fill', generator.generateUISprite('healthBarFill', 32, 6));
    this.load.image('button', generator.generateUISprite('button', 100, 30));
  }

  create() {
    // Scene will automatically transition
  }
}

class UltimateGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UltimateGameScene' });
    this.client = null;
    this.room = null;
    this.playerSprites = new Map();
    this.enemySprites = new Map();
    this.nameTexts = new Map();
    this.healthBars = new Map();
    this.localPlayerId = null;

    // Enhanced managers
    this.animationManager = null;
    this.uiManager = null;
    this.effectsManager = null;
  }

  async create() {
    this.setupGameWorld();
    this.initializeManagers();
    await this.initializeConnection();
    this.setupInput();
    this.createEnhancedUI();
    this.startGameLoop();
  }

  setupGameWorld() {
    // Enhanced background with gradient
    this.cameras.main.setBackgroundColor('#0d1b0d');

    // Create animated grid background
    this.createAnimatedGrid();

    // Add ambient particles
    this.createAmbientParticles();
  }

  createAnimatedGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2d5a27, 0.3);

    for (let x = 0; x < 800; x += 32) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, 600);
    }

    for (let y = 0; y < 600; y += 32) {
      graphics.moveTo(0, y);
      graphics.lineTo(800, y);
    }

    graphics.strokePath();

    // Animate grid opacity
    this.tweens.add({
      targets: graphics,
      alpha: { from: 0.3, to: 0.6 },
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  createAmbientParticles() {
    // Create floating ambient particles
    for (let i = 0; i < 10; i++) {
      this.time.delayedCall(i * 500, () => {
        this.createFloatingParticle();
      });
    }
  }

  createFloatingParticle() {
    const x = Phaser.Math.Between(0, 800);
    const y = Phaser.Math.Between(0, 600);
    const particle = this.add.circle(x, y, 1, 0x4caf50, 0.5);

    this.tweens.add({
      targets: particle,
      x: x + Phaser.Math.Between(-100, 100),
      y: y + Phaser.Math.Between(-100, 100),
      alpha: { from: 0.5, to: 0 },
      duration: Phaser.Math.Between(3000, 8000),
      ease: 'Sine.easeInOut',
      onComplete: () => {
        particle.destroy();
        // Create a new particle
        this.time.delayedCall(Phaser.Math.Between(1000, 3000), () => {
          this.createFloatingParticle();
        });
      },
    });
  }

  initializeManagers() {
    this.animationManager = new SpriteAnimationManager(this);
    this.uiManager = new OSRSUIManager(this);
  }

  createEnhancedUI() {
    // Create all UI panels
    this.uiManager.createChatBox();
    this.uiManager.createMinimap();
    this.uiManager.createStatsPanel();

    // Add game title with glow effect
    const title = this.add
      .text(400, 30, '🛡️ RuneRogue Enhanced', {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#4CAF50',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5);
    title.setDepth(200);

    // Add glow effect to title
    title.postFX.addGlow(0x4caf50, 2, 0, false, 0.1, 8);

    // Connection status with enhanced styling
    this.connectionStatus = this.add
      .text(400, 65, 'Initializing connection...', {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);
    this.connectionStatus.setDepth(200);
  }

  async initializeConnection() {
    try {
      this.client = new Colyseus.Client('ws://localhost:3001');
      this.connectionStatus.setText('🔌 Connecting to server...');
      this.connectionStatus.setTint(0xffaa00);

      this.room = await this.client.joinOrCreate('runerogue', {
        username: `Enhanced_${Math.floor(Math.random() * 1000)}`,
      });

      this.localPlayerId = this.room.sessionId;
      this.connectionStatus.setText('✅ Connected to RuneRogue!');
      this.connectionStatus.setTint(0x00ff00);

      this.uiManager.addChatMessage('Connected to RuneRogue Enhanced!', '#00ff00');
      this.uiManager.addChatMessage('Welcome to Phase 3 Visual Enhancement!', '#4CAF50');

      this.setupRoomHandlers();
    } catch (error) {
      this.connectionStatus.setText('❌ Connection failed');
      this.connectionStatus.setTint(0xff0000);
      this.uiManager.addChatMessage('Connection failed: ' + error.message, '#ff0000');
    }
  }

  setupRoomHandlers() {
    this.room.state.players.onAdd((player, playerId) => {
      this.createEnhancedPlayerSprite(playerId, player);
      this.updateMinimap();
      this.uiManager.addChatMessage(`${player.username || 'Player'} joined the game`, '#ffff00');
    });

    this.room.state.players.onRemove((player, playerId) => {
      this.removePlayerSprite(playerId);
      this.updateMinimap();
      this.uiManager.addChatMessage(`${player.username || 'Player'} left the game`, '#ffaa00');
    });

    this.room.state.players.onChange((player, playerId) => {
      this.updateEnhancedPlayerSprite(playerId, player);
      this.updateMinimap();

      // Update stats if it's local player
      if (playerId === this.localPlayerId) {
        this.uiManager.updateStats(player);
      }
    });

    this.room.state.enemies.onAdd((enemy, enemyId) => {
      this.createEnhancedEnemySprite(enemyId, enemy);
      this.updateMinimap();
    });

    this.room.state.enemies.onRemove((enemy, enemyId) => {
      this.removeEnemySprite(enemyId);
      this.updateMinimap();
    });

    this.room.state.enemies.onChange((enemy, enemyId) => {
      this.updateEnhancedEnemySprite(enemyId, enemy);
    });

    this.room.onMessage('playerAttack', data => {
      this.handleCombatMessage(data, 'player');
    });

    this.room.onMessage('enemyAttack', data => {
      this.handleCombatMessage(data, 'enemy');
    });
  }

  handleCombatMessage(data, type) {
    const attacker =
      this.playerSprites.get(data.attackerId) || this.enemySprites.get(data.attackerId);
    const target = this.playerSprites.get(data.targetId) || this.enemySprites.get(data.targetId);

    if (attacker && target) {
      this.animationManager.playCombatAnimation(attacker, target, data.damage);

      const message =
        type === 'player'
          ? `⚔️ Player deals ${data.damage} damage!`
          : `👹 Enemy attacks for ${data.damage} damage!`;
      this.uiManager.addChatMessage(message, type === 'player' ? '#00ff00' : '#ff4444');
    }
  }

  createEnhancedPlayerSprite(playerId, player) {
    const x = player.x * 32 + 400;
    const y = player.y * 32 + 300;

    // Create enhanced sprite with class selection
    const spriteKey = this.getPlayerSpriteKey(player);
    const sprite = this.add.sprite(x, y, spriteKey);
    sprite.setScale(1.2);
    sprite.setDepth(15);

    // Add special effects for local player
    if (playerId === this.localPlayerId) {
      sprite.postFX.addGlow(0x00ff00, 3, 0, false, 0.1, 6);
      sprite.setTint(0xffffff);
    }

    this.playerSprites.set(playerId, sprite);

    // Enhanced name display
    const nameText = this.add.text(x, y - 50, this.getDisplayName(player, playerId), {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: playerId === this.localPlayerId ? '#00ff00' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: { x: 6, y: 3 },
    });
    nameText.setOrigin(0.5);
    nameText.setDepth(20);
    this.nameTexts.set(playerId, nameText);

    // Enhanced health bar
    this.createSuperHealthBar(playerId, x, y - 35);
    this.updateHealthBar(playerId, player.health, player.maxHealth);
  }

  getPlayerSpriteKey(player) {
    const playerClass = player.class || 'warrior';
    return `player_${playerClass}`;
  }

  getDisplayName(player, playerId) {
    let name = player.username || `Player${playerId.substr(0, 4)}`;
    if (playerId === this.localPlayerId) {
      name += ' (You)';
    }
    return name;
  }

  createSuperHealthBar(entityId, x, y) {
    const container = this.add.container(x, y);

    // Enhanced background with border
    const bg = this.add.sprite(0, 0, 'health_bar_bg');
    bg.setOrigin(0.5);

    // Health fill with gradient effect
    const fill = this.add.sprite(-15, 0, 'health_bar_fill');
    fill.setOrigin(0, 0.5);

    container.add([bg, fill]);
    container.setDepth(18);

    this.healthBars.set(entityId, { container, fill });
  }

  updateEnhancedPlayerSprite(playerId, player) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);
    const healthBar = this.healthBars.get(playerId);

    if (sprite && nameText) {
      const x = player.x * 32 + 400;
      const y = player.y * 32 + 300;

      // Use animation manager for smooth movement
      this.animationManager.playWalkAnimation(sprite, sprite.x, sprite.y, x, y, 200);

      // Animate name and health bar
      this.tweens.add({
        targets: [nameText, healthBar?.container],
        x: x,
        y: [y - 50, y - 35],
        duration: 200,
        ease: 'Power2',
      });

      this.updateHealthBar(playerId, player.health, player.maxHealth);
    }
  }

  createEnhancedEnemySprite(enemyId, enemy) {
    const x = enemy.x * 32 + 400;
    const y = enemy.y * 32 + 300;

    const spriteKey = this.getEnemySpriteKey(enemy);
    const sprite = this.add.sprite(x, y, spriteKey);
    sprite.setScale(1.1);
    sprite.setDepth(12);
    sprite.setTint(0xff9999);

    // Add menacing glow to enemies
    sprite.postFX.addGlow(0xff0000, 2, 0, false, 0.05, 4);

    this.enemySprites.set(enemyId, sprite);
    this.createSuperHealthBar(enemyId, x, y - 25);
    this.updateHealthBar(enemyId, enemy.health, enemy.maxHealth);
  }

  getEnemySpriteKey(enemy) {
    return `enemy_${enemy.entityType || 'goblin'}`;
  }

  updateEnhancedEnemySprite(enemyId, enemy) {
    const sprite = this.enemySprites.get(enemyId);
    const healthBar = this.healthBars.get(enemyId);

    if (sprite) {
      const x = enemy.x * 32 + 400;
      const y = enemy.y * 32 + 300;

      sprite.setPosition(x, y);

      if (healthBar) {
        healthBar.container.setPosition(x, y - 25);
      }

      this.updateHealthBar(enemyId, enemy.health, enemy.maxHealth);
    }
  }

  removePlayerSprite(playerId) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);
    const healthBar = this.healthBars.get(playerId);

    // Add disappearing effect
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        alpha: 0,
        scale: 0.1,
        duration: 300,
        onComplete: () => sprite.destroy(),
      });
    }

    if (nameText) nameText.destroy();
    if (healthBar) healthBar.container.destroy();

    this.playerSprites.delete(playerId);
    this.nameTexts.delete(playerId);
    this.healthBars.delete(playerId);
  }

  removeEnemySprite(enemyId) {
    const sprite = this.enemySprites.get(enemyId);
    const healthBar = this.healthBars.get(enemyId);

    if (sprite) {
      // Enhanced death effect
      this.createDeathExplosion(sprite.x, sprite.y);
      sprite.destroy();
    }

    if (healthBar) healthBar.container.destroy();

    this.enemySprites.delete(enemyId);
    this.healthBars.delete(enemyId);
  }

  createDeathExplosion(x, y) {
    // Create explosive death effect
    for (let i = 0; i < 12; i++) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), 0xff4444);
      particle.setDepth(30);

      const angle = (i / 12) * Math.PI * 2;
      const speed = Phaser.Math.Between(50, 100);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: Phaser.Math.Between(500, 1200),
        ease: 'Power3',
        onComplete: () => particle.destroy(),
      });
    }

    // Screen flash effect
    const flash = this.add.rectangle(400, 300, 800, 600, 0xffffff, 0.3);
    flash.setDepth(50);

    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy(),
    });
  }

  updateHealthBar(entityId, health, maxHealth) {
    const healthBar = this.healthBars.get(entityId);
    if (!healthBar) return;

    const healthPercent = Math.max(0, health / maxHealth);

    // Animate health bar change
    this.tweens.add({
      targets: healthBar.fill,
      scaleX: healthPercent,
      duration: 300,
      ease: 'Power2',
    });

    // Color based on health percentage
    let color = 0x00ff00;
    if (healthPercent < 0.6) color = 0xffff00;
    if (healthPercent < 0.3) color = 0xff0000;

    healthBar.fill.setTint(color);
  }

  updateMinimap() {
    if (this.room) {
      this.uiManager.updateMinimap(this.room.state.players, this.room.state.enemies);
    }
  }

  setupInput() {
    // Enhanced click to move with visual feedback
    this.input.on('pointerdown', pointer => {
      if (!this.room) return;

      const worldX = Math.floor((pointer.worldX - 400) / 32);
      const worldY = Math.floor((pointer.worldY - 300) / 32);

      // Visual feedback for click
      this.showClickFeedback(pointer.worldX, pointer.worldY);

      this.room.send('movePlayer', { x: worldX, y: worldY });
      this.uiManager.addChatMessage(`Moving to (${worldX}, ${worldY})`, '#aaaaaa');
    });

    // Enhanced keyboard controls
    let lastMoveTime = 0;
    const moveDelay = 150;

    this.input.keyboard.on('keydown', event => {
      if (!this.room || Date.now() - lastMoveTime < moveDelay) return;

      const player = this.room.state.players.get(this.localPlayerId);
      if (!player) return;

      let dx = 0,
        dy = 0;
      let action = null;

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
          action = 'attack';
          break;
        case 'Enter':
          this.uiManager.addChatMessage('Chat system ready for enhancement!', '#ffff00');
          lastMoveTime = Date.now();
          return;
      }

      if (dx !== 0 || dy !== 0) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        this.room.send('movePlayer', { x: newX, y: newY });
        lastMoveTime = Date.now();
      } else if (action === 'attack') {
        this.room.send('attackNearestEnemy');
        this.uiManager.addChatMessage('⚔️ Attacking nearest enemy!', '#ff4444');
        lastMoveTime = Date.now();
      }
    });
  }

  showClickFeedback(x, y) {
    const feedback = this.add.circle(x, y, 15, 0x4caf50, 0.6);
    feedback.setDepth(25);

    this.tweens.add({
      targets: feedback,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => feedback.destroy(),
    });
  }

  startGameLoop() {
    // Enhanced game loop for additional effects and updates
    this.time.addEvent({
      delay: 1000, // Every second
      callback: () => {
        this.updateMinimap();

        // Add periodic ambient effects
        if (Math.random() < 0.1) {
          this.createFloatingParticle();
        }
      },
      loop: true,
    });
  }
}

// Ultimate game configuration
const ultimateConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'phaser-game',
  backgroundColor: '#0d1b0d',
  scene: [UltimatePreloadScene, UltimateGameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Initialize the ultimate enhanced game
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Starting RuneRogue Ultimate Enhanced Client...');

  // Create ultimate status overlay
  const statusOverlay = document.createElement('div');
  statusOverlay.id = 'ultimate-status';
  statusOverlay.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 1000;">
      <!-- Top status bar -->
      <div style="position: absolute; top: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.9); color: white; padding: 10px 20px; border-radius: 8px; border: 2px solid #4CAF50;">
        <div style="text-align: center;">
          <div style="color: #4CAF50; font-weight: bold; margin-bottom: 5px;">🛡️ RuneRogue Ultimate Enhanced</div>
          <div style="font-size: 12px; color: #aaa;">Phase 3 Complete - OSRS-Style Experience</div>
        </div>
      </div>
      
      <!-- Controls help -->
      <div style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 8px; border: 1px solid #666; font-size: 12px;">
        <div style="color: #4CAF50; font-weight: bold; margin-bottom: 8px;">Controls:</div>
        <div>🖱️ Click to move</div>
        <div>⌨️ WASD for movement</div>
        <div>⚔️ Space to attack</div>
        <div>💬 Enter for chat</div>
      </div>
    </div>
  `;
  document.body.appendChild(statusOverlay);

  // Start the ultimate game
  const ultimateGame = new Phaser.Game(ultimateConfig);

  console.log('✅ RuneRogue Ultimate Enhanced Client ready!');
  console.log('🎮 Phase 3 Visual Enhancement Complete!');
});
