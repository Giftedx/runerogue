/**
 * Advanced Sprite Animation System for RuneRogue
 * Handles complex animations, effects, and OSRS-style movement
 */

class SpriteAnimationManager {
  constructor(scene) {
    this.scene = scene;
    this.animations = new Map();
  }

  /**
   * Create walking animation for sprites
   */
  createWalkingAnimation(sprite, direction = "down") {
    const animKey = `walk_${direction}_${sprite.texture.key}`;

    if (!this.scene.anims.exists(animKey)) {
      // For now, create simple scale-based walking animation
      this.scene.anims.create({
        key: animKey,
        frames: this.scene.anims.generateFrameNumbers(sprite.texture.key, {
          start: 0,
          end: 0,
        }),
        frameRate: 8,
        repeat: -1,
      });
    }

    return animKey;
  }

  /**
   * Create combat animation
   */
  createCombatAnimation(sprite, type = "attack") {
    const animKey = `combat_${type}_${sprite.texture.key}`;

    if (!this.scene.anims.exists(animKey)) {
      this.scene.anims.create({
        key: animKey,
        frames: this.scene.anims.generateFrameNumbers(sprite.texture.key, {
          start: 0,
          end: 0,
        }),
        frameRate: 12,
        repeat: 0,
      });
    }

    return animKey;
  }

  /**
   * Play walking animation with movement
   */
  playWalkAnimation(sprite, fromX, fromY, toX, toY, duration = 200) {
    const direction = this.getDirection(fromX, fromY, toX, toY);
    const animKey = this.createWalkingAnimation(sprite, direction);

    // Play animation
    sprite.play(animKey);

    // Create movement tween
    this.scene.tweens.add({
      targets: sprite,
      x: toX,
      y: toY,
      duration: duration,
      ease: "Power2",
      onComplete: () => {
        sprite.stop(); // Stop animation when movement is done
      },
    });
  }

  /**
   * Play combat animation with effects
   */
  playCombatAnimation(attacker, target, damage) {
    const animKey = this.createCombatAnimation(attacker, "attack");

    // Play attack animation
    attacker.play(animKey);

    // Create attack effects
    this.createCombatEffect(attacker, target, damage);
  }

  /**
   * Create visual combat effect
   */
  createCombatEffect(attacker, target, damage) {
    // Flash effect on attacker
    this.scene.tweens.add({
      targets: attacker,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
      ease: "Power2",
    });

    // Hit effect on target
    this.scene.tweens.add({
      targets: target,
      tint: 0xff4444,
      duration: 200,
      yoyo: true,
      ease: "Power2",
    });

    // Create impact particles
    this.createImpactParticles(target.x, target.y);

    // Damage number
    this.createDamageNumber(target.x, target.y - 40, damage);
  }

  /**
   * Create impact particle effect
   */
  createImpactParticles(x, y) {
    for (let i = 0; i < 6; i++) {
      const particle = this.scene.add.circle(x, y, 2, 0xffaa00);
      particle.setDepth(30);

      const angle = (i / 6) * Math.PI * 2;
      const speed = 50;
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0.1,
        duration: 300,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Create floating damage number
   */
  createDamageNumber(x, y, damage) {
    const damageText = this.scene.add.text(x, y, `-${damage}`, {
      fontFamily: "Arial",
      fontSize: "18px",
      color: "#ff0000",
      stroke: "#ffffff",
      strokeThickness: 3,
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(25);

    this.scene.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      scale: 1.5,
      duration: 1500,
      ease: "Power2",
      onComplete: () => damageText.destroy(),
    });
  }

  /**
   * Get movement direction
   */
  getDirection(fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;

    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? "right" : "left";
    } else {
      return dy > 0 ? "down" : "up";
    }
  }
}

/**
 * OSRS-Style UI Manager
 */
class OSRSUIManager {
  constructor(scene) {
    this.scene = scene;
    this.chatBox = null;
    this.minimap = null;
    this.statsPanel = null;
  }

  /**
   * Create OSRS-style chat box
   */
  createChatBox() {
    const width = 500;
    const height = 120;
    const x = 10;
    const y = this.scene.cameras.main.height - height - 10;

    // Chat background
    const chatBg = this.scene.add.rectangle(x, y, width, height, 0x3d2914, 0.9);
    chatBg.setOrigin(0, 0);
    chatBg.setStrokeStyle(2, 0x8b4513);
    chatBg.setDepth(100);

    // Chat title
    const chatTitle = this.scene.add.text(x + 10, y + 5, "Chat", {
      fontFamily: "Arial",
      fontSize: "14px",
      color: "#ffff00",
      fontStyle: "bold",
    });
    chatTitle.setDepth(101);

    // Chat messages area
    this.chatMessages = this.scene.add.text(x + 10, y + 25, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#ffffff",
      wordWrap: { width: width - 20 },
    });
    this.chatMessages.setDepth(101);

    this.chatBox = {
      bg: chatBg,
      title: chatTitle,
      messages: this.chatMessages,
    };
  }

  /**
   * Add message to chat
   */
  addChatMessage(message, color = "#ffffff") {
    if (!this.chatBox) this.createChatBox();

    const timestamp = new Date().toLocaleTimeString();
    const formattedMessage = `[${timestamp}] ${message}`;

    // Add new message
    const currentText = this.chatMessages.text;
    const lines = currentText.split("\n");
    lines.push(formattedMessage);

    // Keep only last 6 lines
    if (lines.length > 6) {
      lines.shift();
    }

    this.chatMessages.setText(lines.join("\n"));
    this.chatMessages.setColor(color);
  }

  /**
   * Create OSRS-style minimap
   */
  createMinimap() {
    const size = 150;
    const x = this.scene.cameras.main.width - size - 10;
    const y = 10;

    // Minimap background
    const minimapBg = this.scene.add.rectangle(x, y, size, size, 0x2d5a27, 0.8);
    minimapBg.setOrigin(0, 0);
    minimapBg.setStrokeStyle(2, 0x4caf50);
    minimapBg.setDepth(100);

    // Minimap title
    const minimapTitle = this.scene.add.text(x + 5, y - 20, "Minimap", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    minimapTitle.setDepth(101);

    this.minimap = { bg: minimapBg, title: minimapTitle, x, y, size };
    this.minimapDots = new Map();
  }

  /**
   * Update minimap with player/enemy positions
   */
  updateMinimap(players, enemies) {
    if (!this.minimap) this.createMinimap();

    // Clear existing dots
    this.minimapDots.forEach((dot) => dot.destroy());
    this.minimapDots.clear();

    // Add player dots
    players.forEach((player, playerId) => {
      const dotX = this.minimap.x + player.x * 3 + 75;
      const dotY = this.minimap.y + player.y * 3 + 75;

      const dot = this.scene.add.circle(dotX, dotY, 3, 0x00ff00);
      dot.setDepth(102);
      this.minimapDots.set(playerId, dot);
    });

    // Add enemy dots
    enemies.forEach((enemy, enemyId) => {
      const dotX = this.minimap.x + enemy.x * 3 + 75;
      const dotY = this.minimap.y + enemy.y * 3 + 75;

      const dot = this.scene.add.circle(dotX, dotY, 2, 0xff0000);
      dot.setDepth(102);
      this.minimapDots.set(enemyId, dot);
    });
  }

  /**
   * Create stats panel
   */
  createStatsPanel() {
    const width = 200;
    const height = 300;
    const x = 10;
    const y = 10;

    // Stats background
    const statsBg = this.scene.add.rectangle(
      x,
      y,
      width,
      height,
      0x2d2d2d,
      0.9,
    );
    statsBg.setOrigin(0, 0);
    statsBg.setStrokeStyle(2, 0x666666);
    statsBg.setDepth(100);

    // Stats title
    const statsTitle = this.scene.add.text(x + 10, y + 10, "Player Stats", {
      fontFamily: "Arial",
      fontSize: "16px",
      color: "#ffff00",
      fontStyle: "bold",
    });
    statsTitle.setDepth(101);

    // Stats content
    this.statsContent = this.scene.add.text(x + 10, y + 40, "", {
      fontFamily: "Arial",
      fontSize: "12px",
      color: "#ffffff",
      lineSpacing: 5,
    });
    this.statsContent.setDepth(101);

    this.statsPanel = {
      bg: statsBg,
      title: statsTitle,
      content: this.statsContent,
    };
  }

  /**
   * Update stats panel
   */
  updateStats(playerData) {
    if (!this.statsPanel) this.createStatsPanel();

    const stats = [
      `Health: ${playerData.health}/${playerData.maxHealth}`,
      `Position: (${playerData.x}, ${playerData.y})`,
      `Level: ${playerData.level || 1}`,
      `Experience: ${playerData.experience || 0}`,
      "",
      "Skills:",
      `⚔️ Attack: ${playerData.attackLevel || 1}`,
      `🛡️ Defence: ${playerData.defenceLevel || 1}`,
      `💪 Strength: ${playerData.strengthLevel || 1}`,
      `🏹 Ranged: ${playerData.rangedLevel || 1}`,
      `🔮 Magic: ${playerData.magicLevel || 1}`,
      "",
      "Equipment:",
      `Weapon: ${playerData.weapon || "None"}`,
      `Armor: ${playerData.armor || "None"}`,
    ];

    this.statsContent.setText(stats.join("\n"));
  }
}

// Export classes for use in main client
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SpriteAnimationManager, OSRSUIManager };
} else {
  window.SpriteAnimationManager = SpriteAnimationManager;
  window.OSRSUIManager = OSRSUIManager;
}
