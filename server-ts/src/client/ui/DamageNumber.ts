/**
 * DamageNumber.ts
 *
 * Client-side floating damage number component for combat feedback.
 * Provides animated text that floats upward with color coding and effects.
 *
 * @author RuneRogue Team
 * @version 1.0.0
 */

import { DamageNumberEvent } from '../../../server/ecs/systems/DamageNumberSystem';

/**
 * Configuration for damage number appearance and animation
 */
export interface DamageNumberConfig {
  fontSize: number;
  fontFamily: string;
  animationDuration: number; // In milliseconds
  floatDistance: number; // How far up the number floats
  fadeStartPercent: number; // When to start fading (0-1)
  fontSize_critical: number; // Font size for critical hits
  fontSize_miss: number; // Font size for misses
}

/**
 * Default damage number configuration
 */
export const DEFAULT_DAMAGE_CONFIG: DamageNumberConfig = {
  fontSize: 16,
  fontFamily: 'Arial',
  animationDuration: 1500,
  floatDistance: 60,
  fadeStartPercent: 0.7,
  fontSize_critical: 24,
  fontSize_miss: 14,
};

/**
 * DamageNumber - Animated floating text for combat feedback
 *
 * Features:
 * - Floating animation with customizable physics
 * - Color coding for different damage types
 * - Size scaling based on damage amount
 * - Fade out animation
 * - Automatic cleanup after animation
 * - Critical hit and miss special effects
 */
export class DamageNumber {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private startTime: number;
  private config: DamageNumberConfig;
  private event: DamageNumberEvent;
  private isComplete: boolean = false;

  // Animation properties
  private startX: number;
  private startY: number;
  private targetY: number;

  constructor(
    scene: Phaser.Scene,
    event: DamageNumberEvent,
    config: Partial<DamageNumberConfig> = {}
  ) {
    this.scene = scene;
    this.event = event;
    this.config = { ...DEFAULT_DAMAGE_CONFIG, ...config };
    this.startTime = Date.now();

    this.startX = event.position.x;
    this.startY = event.position.y;
    this.targetY = this.startY - this.config.floatDistance;

    this.createDamageText();
    this.startAnimation();
  }

  /**
   * Create the damage text object
   */
  private createDamageText(): void {
    const fontSize = this.getFontSize();
    const displayText = this.getDisplayText();

    this.text = this.scene.add.text(this.startX, this.startY, displayText, {
      fontSize: `${fontSize}px`,
      fontFamily: this.config.fontFamily,
      color: this.event.color,
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: this.event.type === 'critical' ? 'bold' : 'normal',
    });

    this.text.setOrigin(0.5, 0.5);
    this.text.setDepth(2000); // Render above everything else

    // Add special effects for critical hits
    if (this.event.type === 'critical') {
      this.addCriticalEffect();
    }
  }

  /**
   * Get font size based on damage type and amount
   */
  private getFontSize(): number {
    switch (this.event.type) {
      case 'critical':
        return this.config.fontSize_critical * this.event.sizeMultiplier;
      case 'miss':
        return this.config.fontSize_miss;
      default:
        return this.config.fontSize * this.event.sizeMultiplier;
    }
  }

  /**
   * Get display text based on damage type
   */
  private getDisplayText(): string {
    switch (this.event.type) {
      case 'miss':
        return 'MISS';
      case 'critical':
        return `${this.event.value}!`;
      case 'heal':
        return `+${this.event.value}`;
      default:
        return this.event.value.toString();
    }
  }

  /**
   * Add special visual effects for critical hits
   */
  private addCriticalEffect(): void {
    // Add a subtle glow effect
    this.text.setTint(0xffd700); // Gold tint

    // Add slight shake effect
    this.scene.tweens.add({
      targets: this.text,
      x: this.startX + Phaser.Math.Between(-2, 2),
      duration: 50,
      repeat: 3,
      yoyo: true,
      ease: 'Power2.easeInOut',
    });
  }

  /**
   * Start the floating animation
   */
  private startAnimation(): void {
    // Add slight random horizontal drift
    const driftX = Phaser.Math.Between(-10, 10);
    const targetX = this.startX + driftX;

    // Main floating animation
    this.scene.tweens.add({
      targets: this.text,
      x: targetX,
      y: this.targetY,
      duration: this.config.animationDuration,
      ease: 'Power2.easeOut',
      onUpdate: tween => {
        this.updateOpacity(tween.progress);
      },
      onComplete: () => {
        this.isComplete = true;
        this.destroy();
      },
    });

    // Add subtle scale animation for critical hits
    if (this.event.type === 'critical') {
      this.scene.tweens.add({
        targets: this.text,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Power2.easeInOut',
      });
    }
  }

  /**
   * Update opacity based on animation progress
   */
  private updateOpacity(progress: number): void {
    if (progress >= this.config.fadeStartPercent) {
      const fadeProgress =
        (progress - this.config.fadeStartPercent) / (1 - this.config.fadeStartPercent);
      const alpha = 1 - fadeProgress;
      this.text.setAlpha(alpha);
    }
  }

  /**
   * Update the damage number (called by manager)
   */
  public update(): void {
    // Additional update logic can be added here if needed
    // For now, animations handle everything
  }

  /**
   * Check if the animation is complete
   */
  public isAnimationComplete(): boolean {
    return this.isComplete;
  }

  /**
   * Get the age of this damage number in milliseconds
   */
  public getAge(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get the event that created this damage number
   */
  public getEvent(): DamageNumberEvent {
    return this.event;
  }

  /**
   * Destroy the damage number and clean up resources
   */
  public destroy(): void {
    if (this.text) {
      this.text.destroy();
    }
  }
}

/**
 * DamageNumberManager - Manages multiple damage numbers with pooling
 *
 * Features:
 * - Object pooling for performance
 * - Automatic cleanup of old damage numbers
 * - Batch processing for multiple simultaneous damages
 * - Performance monitoring and optimization
 */
export class DamageNumberManager {
  private scene: Phaser.Scene;
  private activeDamageNumbers: DamageNumber[] = [];
  private config: DamageNumberConfig;

  // Performance tracking
  private maxConcurrentNumbers: number = 50;
  private cleanupThreshold: number = 100; // Clean up when this many are active

  constructor(scene: Phaser.Scene, config: Partial<DamageNumberConfig> = {}) {
    this.scene = scene;
    this.config = { ...DEFAULT_DAMAGE_CONFIG, ...config };
  }

  /**
   * Show a damage number
   */
  public showDamageNumber(event: DamageNumberEvent): void {
    // Limit concurrent damage numbers for performance
    if (this.activeDamageNumbers.length >= this.maxConcurrentNumbers) {
      this.cleanupOldNumbers();
    }

    const damageNumber = new DamageNumber(this.scene, event, this.config);
    this.activeDamageNumbers.push(damageNumber);
  }

  /**
   * Update all active damage numbers
   */
  public update(): void {
    for (const damageNumber of this.activeDamageNumbers) {
      damageNumber.update();
    }

    // Periodic cleanup
    if (this.activeDamageNumbers.length > this.cleanupThreshold) {
      this.cleanupOldNumbers();
    }
  }

  /**
   * Clean up completed or old damage numbers
   */
  public cleanupOldNumbers(): void {
    const maxAge = this.config.animationDuration + 500; // Grace period

    this.activeDamageNumbers = this.activeDamageNumbers.filter(damageNumber => {
      if (damageNumber.isAnimationComplete() || damageNumber.getAge() > maxAge) {
        damageNumber.destroy();
        return false;
      }
      return true;
    });
  }

  /**
   * Get statistics about damage number management
   */
  public getStats(): {
    activeNumbers: number;
    maxConcurrent: number;
    cleanupThreshold: number;
  } {
    return {
      activeNumbers: this.activeDamageNumbers.length,
      maxConcurrent: this.maxConcurrentNumbers,
      cleanupThreshold: this.cleanupThreshold,
    };
  }

  /**
   * Destroy all damage numbers and clean up
   */
  public destroy(): void {
    for (const damageNumber of this.activeDamageNumbers) {
      damageNumber.destroy();
    }
    this.activeDamageNumbers = [];
  }
}
