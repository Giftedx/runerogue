/**
 * Enhanced RuneRogue Phaser Client - Phase 3 Visual Enhancement
 *
 * This is an improved version of the working Phaser client with:
 * - Proper sprite-based rendering instead of rectangles
 * - OSRS-style visual design
 * - Enhanced animations and effects
 * - Better asset management
 * - Improved UI and health bars
 */

class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    console.log("🔄 PreloadScene: Loading assets...");

    // Create loading bar
    const loadingBar = this.add.graphics({
      fillStyle: { color: 0x2d5a27 },
    });

    const loadingText = this.add
      .text(400, 250, "Loading RuneRogue...", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const progressText = this.add
      .text(400, 300, "0%", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    // Update loading bar
    this.load.on("progress", (percentage) => {
      loadingBar.clear();
      loadingBar.fillStyle(0x2d5a27);
      loadingBar.fillRect(200, 320, 400 * percentage, 20);

      progressText.setText(Math.round(percentage * 100) + "%");
    });

    // Generate sprites dynamically for now
    this.generateSprites();
  }

  generateSprites() {
    console.log("🎨 Generating sprite assets...");

    // Use sprite generator to create basic sprites
    const generator = new SpriteGenerator();

    // Generate player sprites
    const warriorSprite = generator.generatePlayerSprite("warrior", 32);
    const mageSprite = generator.generatePlayerSprite("mage", 32);
    const rangerSprite = generator.generatePlayerSprite("ranger", 32);

    // Generate enemy sprites
    const goblinSprite = generator.generateEnemySprite("goblin", 32);
    const skeletonSprite = generator.generateEnemySprite("skeleton", 32);
    const orcSprite = generator.generateEnemySprite("orc", 32);

    // Generate UI sprites
    const healthBarBg = generator.generateUISprite("healthBarBg", 30, 4);
    const healthBarFill = generator.generateUISprite("healthBarFill", 30, 4);

    // Load generated sprites as textures
    this.load.image("player_warrior", warriorSprite);
    this.load.image("player_mage", mageSprite);
    this.load.image("player_ranger", rangerSprite);

    this.load.image("enemy_goblin", goblinSprite);
    this.load.image("enemy_skeleton", skeletonSprite);
    this.load.image("enemy_orc", orcSprite);

    this.load.image("health_bar_bg", healthBarBg);
    this.load.image("health_bar_fill", healthBarFill);
  }

  create() {
    console.log("✅ PreloadScene: Assets loaded, starting game...");
    this.scene.start("GameScene");
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
    this.client = null;
    this.room = null;
    this.playerSprites = new Map();
    this.enemySprites = new Map();
    this.nameTexts = new Map();
    this.healthBars = new Map();
    this.localPlayerId = null;
  }

  async create() {
    console.log("🎮 Enhanced GameScene created");

    // Set up the game world
    this.setupGameWorld();

    // Initialize Colyseus connection
    await this.initializeConnection();

    // Setup input
    this.setupInput();

    // Add UI elements
    this.createUI();
  }

  setupGameWorld() {
    // Create a more appealing background
    this.cameras.main.setBackgroundColor("#1a3d1a");

    // Add grid pattern for better visual reference
    this.createGridBackground();

    // Add game title
    this.add
      .text(400, 30, "🛡️ RuneRogue Enhanced", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);
  }

  createGridBackground() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x2d5a27, 0.5);

    // Draw grid lines
    for (let x = 0; x < 800; x += 32) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, 600);
    }

    for (let y = 0; y < 600; y += 32) {
      graphics.moveTo(0, y);
      graphics.lineTo(800, y);
    }

    graphics.strokePath();
  }

  createUI() {
    // Connection status
    this.connectionStatus = this.add.text(10, 10, "Status: Connecting...", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
    });

    // Player count
    this.playerCountText = this.add.text(10, 40, "Players: 0", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 8, y: 4 },
    });

    // Controls info
    this.add
      .text(400, 570, "🖱️ Click to move | ⌨️ WASD to move | Space to attack", {
        fontFamily: "Arial",
        fontSize: "14px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 1,
      })
      .setOrigin(0.5);
  }

  async initializeConnection() {
    try {
      this.client = new Colyseus.Client("ws://localhost:2567");
      console.log("🔌 Connecting to RuneRogue server...");

      this.connectionStatus.setText("Status: Connecting...");

      // Join the room
      this.room = await this.client.joinOrCreate("runerogue", {
        username: `Player_${Math.floor(Math.random() * 1000)}`,
      });

      this.localPlayerId = this.room.sessionId;
      console.log("✅ Connected! Player ID:", this.localPlayerId);

      this.connectionStatus.setText("Status: Connected");
      this.connectionStatus.setTint(0x00ff00);

      this.setupRoomHandlers();
    } catch (error) {
      console.error("❌ Connection failed:", error);
      this.connectionStatus.setText("Status: Connection Failed");
      this.connectionStatus.setTint(0xff0000);
    }
  }

  setupRoomHandlers() {
    // Player state changes
    this.room.state.players.onAdd((player, playerId) => {
      console.log("👤 Player joined:", playerId, player);
      this.createPlayerSprite(playerId, player);
      this.updatePlayerCount();
    });

    this.room.state.players.onRemove((player, playerId) => {
      console.log("👋 Player left:", playerId);
      this.removePlayerSprite(playerId);
      this.updatePlayerCount();
    });

    this.room.state.players.onChange((player, playerId) => {
      this.updatePlayerSprite(playerId, player);
    });

    // Enemy state changes
    this.room.state.enemies.onAdd((enemy, enemyId) => {
      console.log("👹 Enemy spawned:", enemyId, enemy);
      this.createEnemySprite(enemyId, enemy);
    });

    this.room.state.enemies.onRemove((enemy, enemyId) => {
      console.log("💀 Enemy removed:", enemyId);
      this.removeEnemySprite(enemyId);
    });

    this.room.state.enemies.onChange((enemy, enemyId) => {
      this.updateEnemySprite(enemyId, enemy);
    });

    // Room messages
    this.room.onMessage("playerAttack", (data) => {
      console.log("⚔️ Player attack:", data);
      this.showDamageNumber(data.targetId, data.damage);
      this.addAttackEffect(data.attackerId, data.targetId);
    });

    this.room.onMessage("enemyAttack", (data) => {
      console.log("💥 Enemy attack:", data);
      this.showDamageNumber(data.targetId, data.damage);
    });
  }

  updatePlayerCount() {
    const count = this.room ? this.room.state.players.size : 0;
    this.playerCountText.setText(`Players: ${count}`);
  }

  createPlayerSprite(playerId, player) {
    const x = player.x * 32 + 400;
    const y = player.y * 32 + 300;

    // Create enhanced player sprite
    const sprite = this.add.sprite(x, y, "player_warrior");
    sprite.setScale(1);
    sprite.setDepth(10);

    // Add slight glow effect for local player
    if (playerId === this.localPlayerId) {
      sprite.setTint(0xffffff);
      sprite.postFX.addGlow(0x00ff00, 2, 0, false, 0.1, 4);
    }

    this.playerSprites.set(playerId, sprite);

    // Add enhanced name text
    const nameText = this.add.text(
      x,
      y - 45,
      player.username || `Player${playerId.substr(0, 4)}`,
      {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        padding: { x: 4, y: 2 },
      }
    );
    nameText.setOrigin(0.5, 0.5);
    nameText.setDepth(15);
    this.nameTexts.set(playerId, nameText);

    // Create enhanced health bar
    this.createEnhancedHealthBar(playerId, x, y - 30);
    this.updateHealthBar(playerId, player.health, player.maxHealth);
  }

  createEnhancedHealthBar(entityId, x, y) {
    const container = this.add.container(x, y);

    // Background
    const bg = this.add.sprite(0, 0, "health_bar_bg");
    bg.setOrigin(0.5, 0.5);

    // Health fill
    const fill = this.add.sprite(0, 0, "health_bar_fill");
    fill.setOrigin(0.5, 0.5);

    container.add([bg, fill]);
    container.setDepth(12);

    this.healthBars.set(entityId, { container, fill });
  }

  updatePlayerSprite(playerId, player) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);
    const healthBar = this.healthBars.get(playerId);

    if (sprite && nameText) {
      const x = player.x * 32 + 400;
      const y = player.y * 32 + 300;

      // Smooth movement with tweens
      this.tweens.add({
        targets: sprite,
        x: x,
        y: y,
        duration: 200,
        ease: "Power2",
      });

      this.tweens.add({
        targets: nameText,
        x: x,
        y: y - 45,
        duration: 200,
        ease: "Power2",
      });

      if (healthBar) {
        this.tweens.add({
          targets: healthBar.container,
          x: x,
          y: y - 30,
          duration: 200,
          ease: "Power2",
        });
      }

      this.updateHealthBar(playerId, player.health, player.maxHealth);
    }
  }

  removePlayerSprite(playerId) {
    const sprite = this.playerSprites.get(playerId);
    const nameText = this.nameTexts.get(playerId);
    const healthBar = this.healthBars.get(playerId);

    if (sprite) sprite.destroy();
    if (nameText) nameText.destroy();
    if (healthBar) healthBar.container.destroy();

    this.playerSprites.delete(playerId);
    this.nameTexts.delete(playerId);
    this.healthBars.delete(playerId);
  }

  createEnemySprite(enemyId, enemy) {
    const x = enemy.x * 32 + 400;
    const y = enemy.y * 32 + 300;

    // Choose enemy sprite based on type
    let spriteKey = "enemy_goblin";
    if (enemy.entityType === "skeleton") spriteKey = "enemy_skeleton";
    if (enemy.entityType === "orc") spriteKey = "enemy_orc";

    const sprite = this.add.sprite(x, y, spriteKey);
    sprite.setScale(1);
    sprite.setDepth(8);
    sprite.setTint(0xff8888); // Slight red tint for enemies

    this.enemySprites.set(enemyId, sprite);

    // Create enemy health bar
    this.createEnhancedHealthBar(enemyId, x, y - 20);
    this.updateHealthBar(enemyId, enemy.health, enemy.maxHealth);
  }

  updateEnemySprite(enemyId, enemy) {
    const sprite = this.enemySprites.get(enemyId);
    const healthBar = this.healthBars.get(enemyId);

    if (sprite) {
      const x = enemy.x * 32 + 400;
      const y = enemy.y * 32 + 300;

      sprite.setPosition(x, y);

      if (healthBar) {
        healthBar.container.setPosition(x, y - 20);
      }

      this.updateHealthBar(enemyId, enemy.health, enemy.maxHealth);
    }
  }

  removeEnemySprite(enemyId) {
    const sprite = this.enemySprites.get(enemyId);
    const healthBar = this.healthBars.get(enemyId);

    if (sprite) {
      // Add death effect
      this.addDeathEffect(sprite.x, sprite.y);
      sprite.destroy();
    }

    if (healthBar) healthBar.container.destroy();

    this.enemySprites.delete(enemyId);
    this.healthBars.delete(enemyId);
  }

  updateHealthBar(entityId, health, maxHealth) {
    const healthBar = this.healthBars.get(entityId);
    if (!healthBar) return;

    const healthPercent = health / maxHealth;

    // Update fill width
    healthBar.fill.setScale(healthPercent, 1);

    // Change color based on health
    let color = 0x00ff00; // Green
    if (healthPercent < 0.6) color = 0xffff00; // Yellow
    if (healthPercent < 0.3) color = 0xff0000; // Red

    healthBar.fill.setTint(color);
  }

  showDamageNumber(targetId, damage) {
    const sprite =
      this.playerSprites.get(targetId) || this.enemySprites.get(targetId);
    if (!sprite) return;

    const damageText = this.add.text(sprite.x, sprite.y - 50, `-${damage}`, {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ff0000",
      stroke: "#ffffff",
      strokeThickness: 2,
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(20);

    // Animate damage number
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1000,
      ease: "Power2",
      onComplete: () => damageText.destroy(),
    });
  }

  addAttackEffect(attackerId, targetId) {
    const attacker =
      this.playerSprites.get(attackerId) || this.enemySprites.get(attackerId);
    const target =
      this.playerSprites.get(targetId) || this.enemySprites.get(targetId);

    if (!attacker || !target) return;

    // Flash effect on attacker
    this.tweens.add({
      targets: attacker,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 100,
      yoyo: true,
      ease: "Power2",
    });

    // Hit effect on target
    this.tweens.add({
      targets: target,
      tint: 0xff0000,
      duration: 150,
      yoyo: true,
      ease: "Power2",
    });
  }

  addDeathEffect(x, y) {
    // Simple death particle effect
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 3, 0xff0000);
      particle.setDepth(25);

      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-50, 50),
        y: y + Phaser.Math.Between(-50, 50),
        alpha: 0,
        duration: Phaser.Math.Between(500, 1000),
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  setupInput() {
    // Click to move
    this.input.on("pointerdown", (pointer) => {
      if (!this.room) return;

      const worldX = Math.floor((pointer.worldX - 400) / 32);
      const worldY = Math.floor((pointer.worldY - 300) / 32);

      console.log("🚶 Moving to:", worldX, worldY);
      this.room.send("movePlayer", { x: worldX, y: worldY });
    });

    // Keyboard controls
    const cursors = this.input.keyboard.createCursorKeys();
    const wasd = this.input.keyboard.addKeys("W,S,A,D");

    let lastMoveTime = 0;
    const moveDelay = 200;

    this.input.keyboard.on("keydown", (event) => {
      if (!this.room || Date.now() - lastMoveTime < moveDelay) return;

      const player = this.room.state.players.get(this.localPlayerId);
      if (!player) return;

      let dx = 0,
        dy = 0;

      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          dy = -1;
          break;
        case "ArrowDown":
        case "KeyS":
          dy = 1;
          break;
        case "ArrowLeft":
        case "KeyA":
          dx = -1;
          break;
        case "ArrowRight":
        case "KeyD":
          dx = 1;
          break;
        case "Space":
          this.room.send("attackNearestEnemy");
          lastMoveTime = Date.now();
          return;
      }

      if (dx !== 0 || dy !== 0) {
        const newX = player.x + dx;
        const newY = player.y + dy;
        this.room.send("movePlayer", { x: newX, y: newY });
        lastMoveTime = Date.now();
      }
    });
  }
}

// Enhanced game configuration
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: "phaser-game",
  backgroundColor: "#1a3d1a",
  scene: [PreloadScene, GameScene],
  physics: {
    default: "arcade",
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

// Initialize the enhanced game when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("🎮 Starting RuneRogue Enhanced Phaser Client...");

  // Add enhanced connection status
  const statusDiv = document.createElement("div");
  statusDiv.id = "connection-status";
  statusDiv.innerHTML = `
    <div style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.9); color: white; padding: 15px; border-radius: 8px; font-family: Arial; z-index: 1000; border: 2px solid #2d5a27;">
      <h3 style="margin: 0 0 10px 0; color: #4CAF50;">🛡️ RuneRogue Enhanced</h3>
      <p style="margin: 5px 0;">🔌 Status: <span id="status-text">Initializing...</span></p>
      <p style="margin: 5px 0;">⌨️ WASD/Arrow keys to move</p>
      <p style="margin: 5px 0;">🖱️ Click to move to location</p>
      <p style="margin: 5px 0;">⚔️ Space to attack nearest enemy</p>
      <div style="margin-top: 10px; font-size: 12px; color: #888;">
        Phase 3 Enhanced - OSRS-Style Graphics
      </div>
    </div>
  `;
  document.body.appendChild(statusDiv);

  // Start the enhanced game
  const game = new Phaser.Game(config);

  console.log("✅ RuneRogue Enhanced Client initialized!");
});
