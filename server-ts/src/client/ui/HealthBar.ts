/**
 * HealthBar.ts
 *
 * Client-side health bar component for rendering entity health status.
 * Provides smooth animations, color transitions, and position tracking.
 *
 * @author RuneRogue Team
 * @version 1.0.0
 */

/**
 * Configuration for health bar appearance and behavior
 */
export interface HealthBarConfig {
  width: number;
  height: number;
  backgroundColor: number;
  borderColor: number;
  borderWidth: number;
  offsetY: number; // Vertical offset from entity
  animationDuration: number; // In milliseconds
  showBorder: boolean;
  showText: boolean;
  textColor: number;
  fontSize: number;
}

/**
 * Default health bar configuration
 */
export const DEFAULT_HEALTH_BAR_CONFIG: HealthBarConfig = {
  width: 40,
  height: 6,
  backgroundColor: 0x333333,
  borderColor: 0x000000,
  borderWidth: 1,
  offsetY: -15,
  animationDuration: 200,
  showBorder: true,
  showText: false,
  textColor: 0xffffff,
  fontSize: 10,
};

/**
 * HealthBar - Phaser-based health bar component
 *
 * Features:
 * - Smooth health percentage animations
 * - Color transitions based on health percentage
 * - Automatic positioning relative to entities
 * - Configurable appearance and behavior
 * - Efficient rendering with object pooling support
 */
export class HealthBar {
  private scene: Phaser.Scene;
  private entityId: number;
  private config: HealthBarConfig;

  // Phaser objects
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private border?: Phaser.GameObjects.Rectangle;
  private healthFill: Phaser.GameObjects.Rectangle;
  private healthText?: Phaser.GameObjects.Text;

  // Health state
  private currentHealth: number = 100;
  private maxHealth: number = 100;
  private targetHealth: number = 100;
  private isAnimating: boolean = false;

  // Position tracking
  private lastX: number = 0;
  private lastY: number = 0;

  constructor(
    scene: Phaser.Scene,
    entityId: number,
    x: number,
    y: number,
    config: Partial<HealthBarConfig> = {}
  ) {
    this.scene = scene;
    this.entityId = entityId;
    this.config = { ...DEFAULT_HEALTH_BAR_CONFIG, ...config };

    this.createHealthBar(x, y);
  }

  /**
   * Create the health bar graphics
   */
  private createHealthBar(x: number, y: number): void {
    // Create container for all health bar elements
    this.container = this.scene.add.container(x, y + this.config.offsetY);

    // Background rectangle
    this.background = this.scene.add.rectangle(
      0,
      0,
      this.config.width,
      this.config.height,
      this.config.backgroundColor
    );
    this.container.add(this.background);

    // Health fill rectangle (starts at full health)
    this.healthFill = this.scene.add.rectangle(
      0,
      0,
      this.config.width,
      this.config.height,
      this.getHealthColor(1.0)
    );
    this.container.add(this.healthFill);

    // Border (optional)
    if (this.config.showBorder) {
      this.border = this.scene.add.rectangle(0, 0, this.config.width, this.config.height);
      this.border.setStrokeStyle(this.config.borderWidth, this.config.borderColor);
      this.border.setFillStyle(0x000000); // Transparent fill
      this.container.add(this.border);
    }

    // Health text (optional)
    if (this.config.showText) {
      this.healthText = this.scene.add.text(0, 0, '100/100', {
        fontSize: `${this.config.fontSize}px`,
        color: `#${this.config.textColor.toString(16).padStart(6, '0')}`,
        align: 'center',
      });
      this.healthText.setOrigin(0.5, 0.5);
      this.container.add(this.healthText);
    }

    // Set initial depth to render above entities
    this.container.setDepth(1000);
  }

  /**
   * Update health bar with new health values
   */
  public updateHealth(current: number, max: number, animate: boolean = true): void {
    this.currentHealth = current;
    this.maxHealth = max;
    this.targetHealth = current;

    const healthPercent = Math.max(0, Math.min(1, current / max));

    if (animate && !this.isAnimating) {
      this.animateHealthChange(healthPercent);
    } else {
      this.setHealthPercent(healthPercent);
    }

    // Update text if enabled
    if (this.healthText) {
      this.healthText.setText(`${current}/${max}`);
    }
  }

  /**
   * Animate health bar to new percentage
   */
  private animateHealthChange(targetPercent: number): void {
    this.isAnimating = true;

    const startWidth = this.healthFill.width;
    const targetWidth = this.config.width * targetPercent;
    const startColor = this.healthFill.fillColor;
    const targetColor = this.getHealthColor(targetPercent);

    // Tween animation
    this.scene.tweens.add({
      targets: this.healthFill,
      width: targetWidth,
      duration: this.config.animationDuration,
      ease: 'Power2.easeOut',
      onUpdate: tween => {
        // Interpolate color during animation
        const progress = tween.progress;
        const currentColor = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.IntegerToColor(startColor),
          Phaser.Display.Color.IntegerToColor(targetColor),
          1,
          progress
        );

        this.healthFill.setFillStyle(
          Phaser.Display.Color.GetColor(currentColor.r, currentColor.g, currentColor.b)
        );
      },
      onComplete: () => {
        this.isAnimating = false;
      },
    });
  }

  /**
   * Set health percentage immediately without animation
   */
  private setHealthPercent(percent: number): void {
    const width = this.config.width * percent;
    this.healthFill.setSize(width, this.config.height);
    this.healthFill.setFillStyle(this.getHealthColor(percent));
  }

  /**
   * Get color based on health percentage
   */
  private getHealthColor(percent: number): number {
    if (percent > 0.6) {
      return 0x00ff00; // Green
    } else if (percent > 0.3) {
      return 0xffff00; // Yellow
    } else {
      return 0xff0000; // Red
    }
  }

  /**
   * Update position to follow entity
   */
  public updatePosition(x: number, y: number): void {
    if (this.container && (x !== this.lastX || y !== this.lastY)) {
      this.container.setPosition(x, y + this.config.offsetY);
      this.lastX = x;
      this.lastY = y;
    }
  }

  /**
   * Show the health bar
   */
  public show(): void {
    if (this.container) {
      this.container.setVisible(true);
    }
  }

  /**
   * Hide the health bar
   */
  public hide(): void {
    if (this.container) {
      this.container.setVisible(false);
    }
  }

  /**
   * Check if health bar is visible
   */
  public isVisible(): boolean {
    return this.container ? this.container.visible : false;
  }

  /**
   * Get the entity ID this health bar represents
   */
  public getEntityId(): number {
    return this.entityId;
  }

  /**
   * Get current health percentage
   */
  public getHealthPercent(): number {
    return this.maxHealth > 0 ? this.currentHealth / this.maxHealth : 0;
  }

  /**
   * Check if entity is dead (0 health)
   */
  public isDead(): boolean {
    return this.currentHealth <= 0;
  }

  /**
   * Destroy the health bar and clean up resources
   */
  public destroy(): void {
    if (this.container) {
      this.container.destroy();
    }
  }
}
