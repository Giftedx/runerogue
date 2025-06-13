/**
 * XPNotification - Client-side XP gain notification component for Phaser
 * Displays floating XP notifications with skill icons and level up alerts
 */

export interface XPNotificationConfig {
  x: number;
  y: number;
  skill: string;
  xpGained: number;
  newLevel?: number;
  duration?: number;
  fontSize?: number;
  color?: string;
}

export class XPNotification {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private config: Required<XPNotificationConfig>;
  private isDestroyed = false;

  constructor(scene: Phaser.Scene, config: XPNotificationConfig) {
    this.scene = scene;
    this.config = {
      duration: 2000,
      fontSize: 14,
      color: '#00ff00',
      newLevel: undefined,
      ...config,
    };

    this.createNotification();
    this.startAnimation();
  }

  private createNotification(): void {
    // Create container for the notification
    this.container = this.scene.add.container(this.config.x, this.config.y);

    // Get skill-specific color
    const skillColor = this.getSkillColor(this.config.skill);

    // Create main XP gain text
    const xpText = `+${this.config.xpGained} ${this.capitalizeSkill(this.config.skill)} XP`;
    this.text = this.scene.add.text(0, 0, xpText, {
      fontSize: `${this.config.fontSize}px`,
      fill: skillColor,
      stroke: '#000000',
      strokeThickness: 2,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    });
    this.text.setOrigin(0.5, 0.5);

    this.container.add(this.text);

    // Create level up notification if applicable
    if (this.config.newLevel) {
      this.levelText = this.scene.add.text(0, -25, `Level ${this.config.newLevel}!`, {
        fontSize: `${this.config.fontSize + 4}px`,
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 3,
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'bold',
      });
      this.levelText.setOrigin(0.5, 0.5);
      this.levelText.setScale(1.2);

      this.container.add(this.levelText);
    }

    // Set initial state
    this.container.setAlpha(1);
    this.container.setScale(0.5);
  }

  private getSkillColor(skill: string): string {
    const skillColors: Record<string, string> = {
      attack: '#cc3232',
      defence: '#5555ff',
      strength: '#32cc32',
      hitpoints: '#ff5555',
      ranged: '#55cc55',
      magic: '#5555cc',
      prayer: '#cccc55',
      cooking: '#cc5555',
      woodcutting: '#55aa55',
      fletching: '#55cc55',
      fishing: '#5555aa',
      firemaking: '#cc8855',
      crafting: '#cc9955',
      smithing: '#888888',
      mining: '#996633',
      herblore: '#55aa33',
      agility: '#3366cc',
      thieving: '#cc3399',
      slayer: '#333333',
      farming: '#55cc33',
      runecraft: '#cccc33',
      hunter: '#996633',
      construction: '#cc9966',
    };

    return skillColors[skill.toLowerCase()] || '#ffffff';
  }

  private capitalizeSkill(skill: string): string {
    return skill.charAt(0).toUpperCase() + skill.slice(1);
  }

  private startAnimation(): void {
    if (this.isDestroyed) return;

    // Scale up animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        if (this.isDestroyed) return;
        this.floatAnimation();
      },
    });

    // Level up pulse animation (if applicable)
    if (this.levelText) {
      this.scene.tweens.add({
        targets: this.levelText,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 300,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: 2,
      });
    }
  }

  private floatAnimation(): void {
    if (this.isDestroyed) return;

    // Float upward
    this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 40,
      duration: this.config.duration * 0.8,
      ease: 'Quart.easeOut',
    });

    // Fade out
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: this.config.duration * 0.6,
      delay: this.config.duration * 0.4,
      ease: 'Quart.easeIn',
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Update notification position (for moving entities)
   */
  public updatePosition(x: number, y: number): void {
    if (!this.isDestroyed && this.container) {
      this.container.setPosition(x, y);
    }
  }

  /**
   * Destroy the notification
   */
  public destroy(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    if (this.container) {
      this.container.destroy();
    }
  }

  /**
   * Check if notification is still active
   */
  public isActive(): boolean {
    return !this.isDestroyed;
  }
}
