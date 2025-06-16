/**
 * Combat Effects Manager for RuneRogue
 * Handles damage splats, healing effects, and projectiles using authentic OSRS assets
 *
 * @author RuneRogue Team
 * @license CC BY-NC-SA 3.0 (Attribution required for OSRS Wiki content)
 */

class CombatEffectsManager {
  constructor(scene) {
    this.scene = scene;
    this.effects = new Map();
    this.projectiles = [];

    // Asset paths for OSRS combat effects
    this.assetPaths = {
      hitsplats: {
        damage: "osrs/effects/hitsplats/Damage_hitsplat.png",
        zero: "osrs/effects/hitsplats/Zero_damage_hitsplat.png",
        heal: "osrs/effects/hitsplats/Heal_hitsplat.png",
        poison: "osrs/effects/hitsplats/Poison_hitsplat.png",
        venom: "osrs/effects/hitsplats/Venom_hitsplat.png",
      },
      projectiles: {
        bronze_arrow: "osrs/effects/projectiles/Bronze_arrow.png",
        iron_arrow: "osrs/effects/projectiles/Iron_arrow.png",
      },
    };
  }

  /**
   * Preload all combat effect assets
   * Call this in your scene's preload() method
   */
  preloadAssets() {
    console.log("🎮 Loading OSRS combat effects...");

    // Load hitsplat assets
    Object.entries(this.assetPaths.hitsplats).forEach(([key, path]) => {
      this.scene.load.image(`hitsplat_${key}`, `assets/${path}`);
    });

    // Load projectile assets
    Object.entries(this.assetPaths.projectiles).forEach(([key, path]) => {
      this.scene.load.image(`projectile_${key}`, `assets/${path}`);
    });

    console.log("✅ Combat effects assets queued for loading");
  }

  /**
   * Show a damage splat at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} amount - Damage amount (0 for miss/block)
   * @param {string} type - Effect type: 'damage', 'heal', 'poison', 'venom'
   * @param {string} playerId - Optional player ID for tracking
   */
  showDamageEffect(x, y, amount, type = "damage", playerId = null) {
    // Determine which hitsplat to use
    let hitsplatKey = "damage";
    if (amount === 0) {
      hitsplatKey = "zero";
    } else if (type === "heal") {
      hitsplatKey = "heal";
    } else if (type === "poison") {
      hitsplatKey = "poison";
    } else if (type === "venom") {
      hitsplatKey = "venom";
    }

    // Create hitsplat sprite
    const hitsplat = this.scene.add.image(x, y - 20, `hitsplat_${hitsplatKey}`);
    hitsplat.setOrigin(0.5, 0.5);
    hitsplat.setScale(1.5); // Make it visible

    // Add damage text if amount > 0
    if (amount > 0) {
      const textColor = type === "heal" ? "#00ff00" : "#ffffff";
      const damageText = this.scene.add.text(x, y - 20, amount.toString(), {
        fontSize: "12px",
        fontFamily: "Arial Black",
        color: textColor,
        stroke: "#000000",
        strokeThickness: 2,
      });
      damageText.setOrigin(0.5, 0.5);

      // Animate text rising and fading
      this.scene.tweens.add({
        targets: damageText,
        y: y - 50,
        alpha: 0,
        duration: 1500,
        ease: "Power2",
        onComplete: () => damageText.destroy(),
      });
    }

    // Animate hitsplat appearance and fade
    hitsplat.setAlpha(0);
    this.scene.tweens.add({
      targets: hitsplat,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: 800,
      onComplete: () => hitsplat.destroy(),
    });

    console.log(`💥 Combat effect: ${type} (${amount}) at (${x}, ${y})`);
  }

  /**
   * Alias for showDamageEffect for compatibility
   */
  showDamageSplat(x, y, amount, type = "damage") {
    return this.showDamageEffect(x, y, amount, type);
  }

  /**
   * Show XP splat (reusing damage effect with different styling)
   */
  showXPSplat(x, y, amount, skill = "Combat") {
    // Create XP text effect
    const xpText = this.scene.add
      .text(x, y, `+${amount} ${skill}`, {
        fontSize: "14px",
        fill: "#00ff00",
        stroke: "#000000",
        strokeThickness: 2,
        align: "center",
      })
      .setOrigin(0.5);

    // Animate XP text
    this.scene.tweens.add({
      targets: xpText,
      y: y - 40,
      alpha: 0,
      duration: 2000,
      ease: "Power2",
      onComplete: () => {
        xpText.destroy();
      },
    });

    return xpText;
  }

  /**
   * Get count of active effects for performance monitoring
   */
  getActiveEffectCount() {
    return this.effects.size + this.projectiles.length;
  }

  /**
   * Fire a projectile from source to target
   * @param {number} fromX - Starting X coordinate
   * @param {number} fromY - Starting Y coordinate
   * @param {number} toX - Target X coordinate
   * @param {number} toY - Target Y coordinate
   * @param {string} projectileType - Type: 'bronze_arrow', 'iron_arrow'
   * @param {function} onComplete - Callback when projectile reaches target
   */
  fireProjectile(
    fromX,
    fromY,
    toX,
    toY,
    projectileType = "bronze_arrow",
    onComplete = null
  ) {
    // Create projectile sprite
    const projectile = this.scene.add.image(
      fromX,
      fromY,
      `projectile_${projectileType}`
    );
    projectile.setOrigin(0.5, 0.5);

    // Calculate angle and rotation
    const angle = Phaser.Math.Angle.Between(fromX, fromY, toX, toY);
    projectile.setRotation(angle);

    // Calculate flight duration based on distance
    const distance = Phaser.Math.Distance.Between(fromX, fromY, toX, toY);
    const duration = Math.max(300, distance * 2); // Min 300ms, scale with distance

    // Animate projectile flight
    this.scene.tweens.add({
      targets: projectile,
      x: toX,
      y: toY,
      duration: duration,
      ease: "Power2",
      onComplete: () => {
        projectile.destroy();
        if (onComplete) onComplete();
      },
    });

    this.projectiles.push(projectile);
    console.log(
      `🏹 Projectile fired: ${projectileType} from (${fromX}, ${fromY}) to (${toX}, ${toY})`
    );
  }

  /**
   * Show combined attack effect: projectile followed by damage
   * @param {object} attacker - Attacker with x, y properties
   * @param {object} target - Target with x, y properties
   * @param {number} damage - Damage amount
   * @param {string} attackType - 'ranged' or 'melee'
   * @param {string} weaponType - Weapon type for projectile selection
   */
  showAttackEffect(
    attacker,
    target,
    damage,
    attackType = "melee",
    weaponType = "bronze_arrow"
  ) {
    if (attackType === "ranged") {
      // Fire projectile then show damage
      this.fireProjectile(
        attacker.x,
        attacker.y,
        target.x,
        target.y,
        weaponType,
        () => {
          // Show damage when projectile hits
          this.showDamageEffect(target.x, target.y, damage, "damage");
        }
      );
    } else {
      // Immediate damage for melee
      this.showDamageEffect(target.x, target.y, damage, "damage");
    }
  }

  /**
   * Handle multiplayer combat effect synchronization
   * @param {object} effectData - Combat effect data from server
   */
  handleMultiplayerEffect(effectData) {
    const { type, x, y, amount, effectType, projectileType, targetId } =
      effectData;

    switch (type) {
      case "damage":
        this.showDamageEffect(x, y, amount, effectType);
        break;

      case "projectile":
        this.fireProjectile(
          effectData.fromX,
          effectData.fromY,
          x,
          y,
          projectileType
        );
        break;

      case "attack":
        this.showAttackEffect(
          { x: effectData.fromX, y: effectData.fromY },
          { x, y },
          amount,
          effectData.attackType,
          projectileType
        );
        break;
    }
  }

  /**
   * Clean up all active effects
   */
  cleanup() {
    this.effects.clear();
    this.projectiles.forEach((projectile) => {
      if (projectile && projectile.scene) {
        projectile.destroy();
      }
    });
    this.projectiles = [];
  }
}

/**
 * Example usage in a Phaser scene
 */
class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    // Initialize combat effects manager
    this.combatEffects = new CombatEffectsManager(this);

    // Load combat assets
    this.combatEffects.preloadAssets();

    // Load other game assets...
  }

  create() {
    // Scene setup...

    // Example: Show damage when players attack
    this.input.on("pointerdown", (pointer) => {
      // Test combat effects
      this.combatEffects.showDamageEffect(
        pointer.x,
        pointer.y,
        Math.floor(Math.random() * 20) + 1,
        "damage"
      );
    });

    // Example: Handle multiplayer combat events
    this.scene.get("NetworkManager")?.on("combat_effect", (data) => {
      this.combatEffects.handleMultiplayerEffect(data);
    });
  }

  update() {
    // Game update logic...
  }

  shutdown() {
    // Clean up combat effects
    this.combatEffects.cleanup();
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { CombatEffectsManager, GameScene };
}

// Global access for browser environments
if (typeof window !== "undefined") {
  window.CombatEffectsManager = CombatEffectsManager;
}
