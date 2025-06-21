import Phaser from "phaser";
import { type Enemy, EnemyState, ENEMY_CONFIGS } from "@runerogue/shared";

/**
 * Enemy sprite with health bar and state visualization
 */
export class EnemySprite extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Rectangle;
  private healthBar: Phaser.GameObjects.Graphics;
  private nameText: Phaser.GameObjects.Text;
  private currentState: EnemyState = EnemyState.Idle;
  private flashTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, enemy: Enemy) {
    super(scene, enemy.x, enemy.y);

    const config = ENEMY_CONFIGS[enemy.type];

    // Create the enemy sprite (colored rectangle for now)
    this.sprite = scene.add.rectangle(
      0,
      0,
      config.size.width,
      config.size.height,
      config.color
    );
    this.add(this.sprite);

    // Create health bar
    this.healthBar = scene.add.graphics();
    this.healthBar.y = -config.size.height / 2 - 10;
    this.add(this.healthBar);

    // Create name text
    this.nameText = scene.add.text(
      0,
      -config.size.height / 2 - 20,
      enemy.type,
      {
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      }
    );
    this.nameText.setOrigin(0.5);
    this.add(this.nameText);

    // Enable physics
    scene.physics.add.existing(this);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(config.size.width, config.size.height);

    this.updateFromState(enemy);
    scene.add.existing(this);
  }

  updateFromState(enemy: Enemy): void {
    // Update position
    this.setPosition(enemy.x, enemy.y);

    // Update health bar
    this.updateHealthBar(enemy.health, enemy.maxHealth);

    // Update state visualization
    if (enemy.state !== this.currentState) {
      this.currentState = enemy.state;
      this.updateStateVisualization();
    }

    // Handle death state
    if (enemy.state === EnemyState.Dead) {
      this.playDeathAnimation();
    }
  }

  private updateHealthBar(health: number, maxHealth: number): void {
    this.healthBar.clear();

    if (health <= 0) return;

    const barWidth = 30;
    const barHeight = 4;
    const healthPercent = health / maxHealth;

    // Background
    this.healthBar.fillStyle(0x000000);
    this.healthBar.fillRect(-barWidth / 2, 0, barWidth, barHeight);

    // Health
    const healthColor =
      healthPercent > 0.5 ? 0x00ff00
      : healthPercent > 0.25 ? 0xffff00
      : 0xff0000;
    this.healthBar.fillStyle(healthColor);
    this.healthBar.fillRect(
      -barWidth / 2,
      0,
      barWidth * healthPercent,
      barHeight
    );
  }

  private updateStateVisualization(): void {
    // Clear any existing tweens
    if (this.flashTween) {
      this.flashTween.stop();
      this.flashTween = undefined;
    }

    switch (this.currentState) {
      case EnemyState.Idle:
        this.sprite.setAlpha(1);
        break;

      case EnemyState.Moving:
        // Slight pulsing effect while moving
        this.flashTween = this.scene.tweens.add({
          targets: this.sprite,
          alpha: { from: 1, to: 0.8 },
          duration: 500,
          yoyo: true,
          repeat: -1,
        });
        break;

      case EnemyState.Attacking:
        // Flash red when attacking
        this.flashTween = this.scene.tweens.add({
          targets: this.sprite,
          scaleX: { from: 1, to: 1.2 },
          scaleY: { from: 1, to: 1.2 },
          duration: 200,
          yoyo: true,
          repeat: -1,
        });
        break;
    }
  }

  private playDeathAnimation(): void {
    // Stop all tweens
    if (this.flashTween) {
      this.flashTween.stop();
    }

    // Death animation
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0 },
      scale: { from: 1, to: 0.5 },
      duration: 500,
      onComplete: () => {
        this.destroy();
      },
    });
  }

  /**
   * Play damage effect
   */
  takeDamage(): void {
    // Flash white
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.3, to: 1 },
      duration: 100,
      yoyo: true,
      repeat: 1,
    });
  }

  destroy(): void {
    if (this.flashTween) {
      this.flashTween.stop();
    }
    super.destroy();
  }
}
