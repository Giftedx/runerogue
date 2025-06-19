/**
 * RuneRogue Phase 3: Combat Visualization & UI Implementation
 * Enhanced Phaser + Colyseus Client with OSRS-style combat effects and UI
 *
 * Features:
 * - Combat visual effects with authentic OSRS damage splats
 * - Health and prayer orbs
 * - XP counter and skill progression
 * - Mini-map with player tracking
 * - Performance optimiz      this.client = new Colyseus.Client('ws://localhost:2567');d for 60fps with 4+ players
 *
 * @author RuneRogue Team
 * @version Phase 3
 */

/**
 * Health Orb Component - OSRS-style health display
 */
class HealthOrb extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    // Background circle
    this.orbBg = scene.add.graphics();
    this.orbBg.fillStyle(0x4a4a4a);
    this.orbBg.fillCircle(0, 0, 30);
    this.orbBg.lineStyle(3, 0x8b4513);
    this.orbBg.strokeCircle(0, 0, 30);
    this.add(this.orbBg);

    // Health fill
    this.healthFill = scene.add.graphics();
    this.add(this.healthFill);

    // Health text
    this.healthText = scene.add.text(0, 0, "10", {
      fontFamily: "Arial Black",
      fontSize: "14px",
      color: "#00ff00",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.healthText.setOrigin(0.5, 0.5);
    this.add(this.healthText);

    // Set depth for UI
    this.setDepth(1000);
    this.setScrollFactor(0); // Stay fixed on screen

    this.currentHealth = 10;
    this.maxHealth = 10;

    scene.add.existing(this);
  }

  updateHealth(current, max) {
    this.currentHealth = current;
    this.maxHealth = max;

    const percentage = current / max;

    // Update fill
    this.healthFill.clear();

    let color = 0x00ff00; // Green
    if (percentage < 0.25) {
      color = 0xff0000; // Red
    } else if (percentage < 0.5) {
      color = 0xffff00; // Yellow
    }

    this.healthFill.fillStyle(color, 0.8);

    // Draw arc based on health percentage
    const startAngle = Phaser.Math.DegToRad(-90);
    const endAngle = startAngle + Phaser.Math.DegToRad(360 * percentage);

    this.healthFill.beginPath();
    this.healthFill.arc(0, 0, 25, startAngle, endAngle);
    this.healthFill.fillPath();

    // Update text
    this.healthText.setText(current.toString());

    // Update text color
    if (percentage < 0.25) {
      this.healthText.setColor("#ff0000");
    } else if (percentage < 0.5) {
      this.healthText.setColor("#ffff00");
    } else {
      this.healthText.setColor("#00ff00");
    }
  }
}

/**
 * XP Counter Component - Track and display experience gains
 */
class XPCounter extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.scene = scene;
    this.xpDrops = [];
    this.totalXP = 0;

    // Background
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x000000, 0.7);
    this.bg.fillRoundedRect(-60, -20, 120, 40, 5);
    this.bg.lineStyle(2, 0xffd700);
    this.bg.strokeRoundedRect(-60, -20, 120, 40, 5);
    this.add(this.bg);

    // Total XP text
    this.totalText = scene.add.text(0, 0, "Total XP: 0", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#ffffff",
    });
    this.totalText.setOrigin(0.5, 0.5);
    this.add(this.totalText);

    this.setDepth(999);
    this.setScrollFactor(0);

    scene.add.existing(this);
  }

  onXPGain(skill, amount) {
    // Create floating XP text
    const xpDrop = this.scene.add.text(
      this.x + (Math.random() - 0.5) * 40,
      this.y - 30,
      `+${amount} ${skill}`,
      {
        fontFamily: "Arial Black",
        fontSize: "14px",
        color: "#00ffff",
        stroke: "#000000",
        strokeThickness: 2,
      },
    );

    xpDrop.setOrigin(0.5, 0.5);
    xpDrop.setDepth(1001);
    xpDrop.setScrollFactor(0);

    this.xpDrops.push(xpDrop);

    // Animate upward
    this.scene.tweens.add({
      targets: xpDrop,
      y: xpDrop.y - 50,
      alpha: 0,
      duration: 2000,
      ease: "Power2",
      onComplete: () => {
        xpDrop.destroy();
        this.xpDrops = this.xpDrops.filter((d) => d !== xpDrop);
      },
    });

    // Update total
    this.totalXP += amount;
    this.totalText.setText(`Total XP: ${this.totalXP}`);
  }
}

/**
 * Mini-map Component - Show player positions and map overview
 */
class MiniMap extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);

    this.scene = scene;
    this.mapSize = 100;
    this.worldSize = 30; // Current world size
    this.playerDots = new Map();

    // Background
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x000000, 0.8);
    this.bg.fillRect(0, 0, this.mapSize, this.mapSize);
    this.bg.lineStyle(2, 0xffffff);
    this.bg.strokeRect(0, 0, this.mapSize, this.mapSize);
    this.add(this.bg);

    // Title
    this.title = scene.add.text(this.mapSize / 2, -15, "Mini-map", {
      fontFamily: "Arial",
      fontSize: "10px",
      color: "#ffffff",
    });
    this.title.setOrigin(0.5, 0.5);
    this.add(this.title);

    this.setDepth(998);
    this.setScrollFactor(0);

    scene.add.existing(this);
  }

  updatePlayerPositions(players) {
    // Clear existing dots
    this.playerDots.forEach((dot) => dot.destroy());
    this.playerDots.clear();

    // Add new dots
    players.forEach((player, id) => {
      const mapX = (player.x / this.worldSize) * this.mapSize;
      const mapY = (player.y / this.worldSize) * this.mapSize;

      const dot = this.scene.add.graphics();
      dot.fillStyle(id === this.scene.localPlayerId ? 0x00ff00 : 0xff0000);
      dot.fillCircle(mapX, mapY, 3);
      this.add(dot);

      this.playerDots.set(id, dot);
    });
  }
}

/**
 * Game UI Manager - Coordinates all UI elements
 */
class GameUI {
  constructor(scene) {
    this.scene = scene;

    // Create UI elements
    this.healthOrb = new HealthOrb(scene, 80, scene.scale.height - 80);
    this.xpCounter = new XPCounter(scene, scene.scale.width / 2, 50);
    this.miniMap = new MiniMap(scene, scene.scale.width - 120, 20);

    // Wave progress UI
    this.waveText = scene.add.text(20, 20, "Wave: 1", {
      fontFamily: "Arial Black",
      fontSize: "16px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.waveText.setDepth(1000);
    this.waveText.setScrollFactor(0);

    // Enemies killed counter
    this.killsText = scene.add.text(20, 45, "Kills: 0", {
      fontFamily: "Arial Black",
      fontSize: "14px",
      color: "#ffff00",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.killsText.setDepth(1000);
    this.killsText.setScrollFactor(0);

    // FPS counter (debug)
    this.fpsText = scene.add.text(
      scene.scale.width - 80,
      scene.scale.height - 20,
      "FPS: 60",
      {
        fontFamily: "Arial",
        fontSize: "12px",
        color: "#00ff00",
      },
    );
    this.fpsText.setDepth(1000);
    this.fpsText.setScrollFactor(0);
  }

  updateWave(waveNumber) {
    this.waveText.setText(`Wave: ${waveNumber}`);
  }

  updateKills(killCount) {
    this.killsText.setText(`Kills: ${killCount}`);
  }

  updateFPS(fps) {
    this.fpsText.setText(`FPS: ${Math.round(fps)}`);
  }
}

/**
 * Enhanced Game Scene with Combat Effects and UI
 */
class EnhancedGameScene extends Phaser.Scene {
  constructor() {
    super({ key: "EnhancedGameScene" });

    // Network
    this.client = null;
    this.room = null;
    this.localPlayerId = null;

    // Game objects
    this.playerSprites = new Map();
    this.enemySprites = new Map();
    this.nameTexts = new Map();
    this.healthBars = new Map();

    // Systems
    this.combatEffects = null;
    this.ui = null;

    // Performance tracking
    this.lastFPSUpdate = 0;
  }

  preload() {
    console.log("🎮 Enhanced GameScene preloading...");

    // Initialize combat effects manager
    this.combatEffects = new CombatEffectsManager(this);

    // Load combat assets
    this.combatEffects.preloadAssets();

    // Load basic sprites (colored rectangles for now)
    this.load.image(
      "player",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gIeFzAY4kUhgwAAACVJREFUCNdjYGBg+M+ABzAxMILEGBlQgP///0kzFNMUqBdAggIAbRAGC+xH+VMAAAAASUVORK5CYII=",
    );
    this.load.image(
      "enemy",
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gIeFzELxlFbtQAAACVJREFUCNdjYGBg+A+EJBmKaQrUCyBBAQAAAP//+/8HAADF7CY/1QgwwwAAAABJRU5ErkJggg==",
    );
  }

  async create() {
    console.log("🎮 Enhanced GameScene created");

    // Set background
    this.cameras.main.setBackgroundColor("#2d5a27");

    // Initialize UI
    this.ui = new GameUI(this);

    // Initialize connection
    await this.initializeConnection();

    // Setup input
    this.setupInput();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }
  async initializeConnection() {
    try {
      // Check for Colyseus availability
      let ClientClass;
      if (typeof Colyseus !== "undefined" && Colyseus.Client) {
        ClientClass = Colyseus.Client;
        console.log("🔌 Using Colyseus.Client");
      } else if (typeof ColyseusClient !== "undefined") {
        ClientClass = ColyseusClient;
        console.log("🔌 Using ColyseusClient (module)");
      } else {
        throw new Error("Colyseus client not available");
      }

      // Create client with correct server port
      this.client = new ClientClass("ws://localhost:2567");
      console.log("🔌 Connecting to RuneRogue server...");

      // Update status
      const statusElement = document.getElementById("status-text");
      if (statusElement) statusElement.textContent = "Connecting...";

      // Join the room
      this.room = await this.client.joinOrCreate("runerogue", {
        username: `Player_${Math.floor(Math.random() * 1000)}`,
      });

      this.localPlayerId = this.room.sessionId;
      console.log("✅ Connected! Player ID:", this.localPlayerId);

      // Update status
      if (statusElement)
        statusElement.textContent = "Connected - Phase 3 Enhanced Client";

      // Setup multiplayer event listeners
      this.setupMultiplayerEvents();
    } catch (error) {
      console.error("❌ Connection failed:", error);
      const statusElement = document.getElementById("status-text");
      if (statusElement)
        statusElement.textContent =
          "Connection Failed - Running in offline demo mode";

      // Run in offline demo mode instead of retrying
      this.setupOfflineDemo();
    }
  }

  setupMultiplayerEvents() {
    // Player state changes
    this.room.state.players.onAdd = (player, sessionId) => {
      console.log("➕ Player added:", sessionId);
      this.addPlayer(player, sessionId);
    };

    this.room.state.players.onRemove = (player, sessionId) => {
      console.log("➖ Player removed:", sessionId);
      this.removePlayer(sessionId);
    };

    this.room.state.players.onChange = (player, sessionId) => {
      this.updatePlayer(player, sessionId);
    };

    // Enemy state changes
    this.room.state.enemies.onAdd = (enemy, enemyId) => {
      console.log("👹 Enemy spawned:", enemyId, enemy.type);
      this.addEnemy(enemy, enemyId);
    };

    this.room.state.enemies.onRemove = (enemy, enemyId) => {
      console.log("💀 Enemy removed:", enemyId);
      this.removeEnemy(enemyId);
    };

    this.room.state.enemies.onChange = (enemy, enemyId) => {
      this.updateEnemy(enemy, enemyId);
    };
    // Combat events
    this.room.onMessage("damage_dealt", (data) => {
      this.handleCombatEvent(data);
    });

    this.room.onMessage("xp_gained", (data) => {
      this.handleXPGain(data);
    });

    this.room.onMessage("enemy_killed", (data) => {
      this.handleEnemyKilled(data);
    });

    this.room.onMessage("game_started", () => {
      console.log("🚀 Game started!");
    });

    // Game state updates
    this.room.state.onChange = () => {
      this.ui.updateWave(this.room.state.waveNumber || 1);
      this.ui.updateKills(this.room.state.enemiesKilled || 0);
      this.ui.miniMap.updatePlayerPositions(this.room.state.players);
    };
  }
  handleCombatEvent(data) {
    console.log("⚔️ Combat event:", data);

    // Use position data if available, otherwise fall back to entity lookup
    let targetX, targetY;

    if (data.position) {
      targetX = data.position.x * 32; // Convert to pixel coordinates
      targetY = data.position.y * 32;
    } else {
      // Fallback to entity lookup
      if (this.room.state.players.has(data.targetId)) {
        const target = this.room.state.players.get(data.targetId);
        targetX = target.x * 32;
        targetY = target.y * 32;
      } else if (this.room.state.enemies.has(data.targetId)) {
        const target = this.room.state.enemies.get(data.targetId);
        targetX = target.x * 32;
        targetY = target.y * 32;
      }
    }

    if (targetX !== undefined && targetY !== undefined) {
      // Show damage effect using the enhanced effect type
      this.combatEffects.showDamageEffect(
        targetX,
        targetY,
        data.damage,
        data.effectType || (data.damage === 0 ? "zero" : "damage"),
      );

      // Update health bar if it's a player
      if (this.room.state.players.has(data.targetId)) {
        const player = this.room.state.players.get(data.targetId);

        // Update local player's health orb
        if (data.targetId === this.localPlayerId) {
          this.ui.healthOrb.updateHealth(
            data.targetHealth,
            data.targetMaxHealth || player.maxHealth,
          );
        }
      }
    }
  }

  handleXPGain(data) {
    console.log("✨ XP gained:", data);

    // Show XP gain for the player who earned it
    if (data.playerId === this.localPlayerId) {
      this.ui.xpCounter.onXPGain(data.skill, data.amount);
    }
  }
  handleEnemyKilled(data) {
    console.log("💀 Enemy killed:", data);

    // Show death effect at enemy position
    if (data.position) {
      this.combatEffects.showDamageEffect(
        data.position.x * 32,
        data.position.y * 32,
        "DEAD",
        "heal", // Use green for death effect
      );
    } else if (this.room.state.enemies.has(data.enemyId)) {
      const enemy = this.room.state.enemies.get(data.enemyId);
      this.combatEffects.showDamageEffect(
        enemy.x * 32,
        enemy.y * 32,
        "DEAD",
        "heal",
      );
    }
  }

  addPlayer(player, sessionId) {
    // Create player sprite
    const sprite = this.add.rectangle(
      player.x * 32,
      player.y * 32,
      24,
      24,
      sessionId === this.localPlayerId ? 0x00ff00 : 0x0066ff,
    );
    sprite.setStrokeStyle(2, 0x000000);

    // Create name text
    const nameText = this.add.text(
      player.x * 32,
      player.y * 32 - 20,
      player.name || `Player${Math.floor(Math.random() * 100)}`,
      {
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 1,
      },
    );
    nameText.setOrigin(0.5, 0.5);

    this.playerSprites.set(sessionId, sprite);
    this.nameTexts.set(sessionId, nameText);

    // Update local player's health orb
    if (sessionId === this.localPlayerId) {
      this.ui.healthOrb.updateHealth(player.health, player.maxHealth);
    }
  }

  removePlayer(sessionId) {
    const sprite = this.playerSprites.get(sessionId);
    const nameText = this.nameTexts.get(sessionId);

    if (sprite) sprite.destroy();
    if (nameText) nameText.destroy();

    this.playerSprites.delete(sessionId);
    this.nameTexts.delete(sessionId);
  }

  updatePlayer(player, sessionId) {
    const sprite = this.playerSprites.get(sessionId);
    const nameText = this.nameTexts.get(sessionId);

    if (sprite) {
      // Smooth movement
      this.tweens.add({
        targets: sprite,
        x: player.x * 32,
        y: player.y * 32,
        duration: 100,
        ease: "Power2",
      });
    }

    if (nameText) {
      this.tweens.add({
        targets: nameText,
        x: player.x * 32,
        y: player.y * 32 - 20,
        duration: 100,
        ease: "Power2",
      });
    }

    // Update health orb for local player
    if (sessionId === this.localPlayerId) {
      this.ui.healthOrb.updateHealth(player.health, player.maxHealth);
    }
  }

  addEnemy(enemy, enemyId) {
    const sprite = this.add.rectangle(
      enemy.x * 32,
      enemy.y * 32,
      20,
      20,
      0xff4444,
    );
    sprite.setStrokeStyle(2, 0x000000);

    this.enemySprites.set(enemyId, sprite);
  }

  removeEnemy(enemyId) {
    const sprite = this.enemySprites.get(enemyId);
    if (sprite) sprite.destroy();
    this.enemySprites.delete(enemyId);
  }

  updateEnemy(enemy, enemyId) {
    const sprite = this.enemySprites.get(enemyId);
    if (sprite) {
      sprite.x = enemy.x * 32;
      sprite.y = enemy.y * 32;
    }
  }

  setupInput() {
    // Mouse/touch movement
    this.input.on("pointerdown", (pointer) => {
      if (this.room) {
        const worldX = Math.floor((pointer.x + this.cameras.main.scrollX) / 32);
        const worldY = Math.floor((pointer.y + this.cameras.main.scrollY) / 32);

        this.room.send("move", { x: worldX, y: worldY });
        console.log(`🏃 Move command sent: (${worldX}, ${worldY})`);
      }
    });

    // Start game with spacebar
    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.room) {
        this.room.send("start_game");
        console.log("🚀 Start game command sent");
      }
    });
  }

  setupPerformanceMonitoring() {
    // Update FPS counter every second
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.ui.updateFPS(this.game.loop.actualFps);
      },
      loop: true,
    });
  }

  setupOfflineDemo() {
    console.log("🎮 Running in offline demo mode - combat effects only");

    // Create a demo player
    this.localPlayer = this.add
      .sprite(400, 300, "osrs-ui", "Health_orb_background")
      .setScale(2)
      .setTint(0x0066ff);

    // Demo enemy spawning
    this.time.addEvent({
      delay: 3000,
      callback: () => {
        this.spawnDemoEnemy();
      },
      loop: true,
    });

    // Demo combat simulation
    this.time.addEvent({
      delay: 2000,
      callback: () => {
        this.simulateDemoCombat();
      },
      loop: true,
    });

    console.log(
      "✅ Offline demo ready! Combat effects will appear automatically",
    );
  }

  spawnDemoEnemy() {
    const x = Phaser.Math.Between(100, 700);
    const y = Phaser.Math.Between(100, 500);

    const enemy = this.add
      .sprite(x, y, "osrs-ui", "Health_orb_background")
      .setScale(1.5)
      .setTint(0xff6666);

    // Store in enemies array for cleanup
    if (!this.demoEnemies) this.demoEnemies = [];
    this.demoEnemies.push(enemy);

    console.log(`👹 Demo enemy spawned at (${x}, ${y})`);
  }

  simulateDemoCombat() {
    if (!this.demoEnemies || this.demoEnemies.length === 0) return;

    // Pick a random enemy
    const enemy = Phaser.Utils.Array.GetRandom(this.demoEnemies);
    if (!enemy || !enemy.active) return;

    // Simulate damage
    const damage = Phaser.Math.Between(1, 20);
    const isHeal = Math.random() < 0.1; // 10% chance for heal
    const isPoison = Math.random() < 0.15; // 15% chance for poison

    // Show damage splat
    if (this.combatEffects) {
      if (isHeal) {
        this.combatEffects.showDamageSplat(
          enemy.x,
          enemy.y - 20,
          damage,
          "heal",
        );
      } else if (isPoison) {
        this.combatEffects.showDamageSplat(
          enemy.x,
          enemy.y - 20,
          damage,
          "poison",
        );
      } else {
        this.combatEffects.showDamageSplat(
          enemy.x,
          enemy.y - 20,
          damage,
          "damage",
        );
      }

      // Show XP gain
      const xpGain = Math.floor(damage * 4);
      this.combatEffects.showXPSplat(
        this.localPlayer.x,
        this.localPlayer.y - 30,
        xpGain,
        "Attack",
      );
    }

    // Remove enemy with animation
    this.tweens.add({
      targets: enemy,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        enemy.destroy();
        this.demoEnemies = this.demoEnemies.filter((e) => e !== enemy);
      },
    });

    console.log(
      `⚔️ Demo combat! Damage: ${damage}, Type: ${
        isHeal ? "heal" : isPoison ? "poison" : "normal"
      }`,
    );
  }

  update() {
    // Any per-frame updates can go here
    // Currently handled by event-driven architecture
  }
}

/**
 * Enhanced Phaser Game Configuration
 */
const gameConfig = {
  type: Phaser.AUTO,
  width: 1024,
  height: 768,
  backgroundColor: "#2d5a27",
  scene: EnhancedGameScene,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  fps: {
    target: 60,
    forceSetTimeOut: true,
  },
};

// Initialize the enhanced game
console.log("🚀 RuneRogue Phase 3: Combat Visualization & UI");
console.log("📋 Features: Combat Effects, Health Orbs, XP Counter, Mini-map");
console.log("⚡ Performance Target: 60fps with 4+ players");

const game = new Phaser.Game(gameConfig);

// Global reference for debugging
window.runerogueGame = game;
