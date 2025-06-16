import Phaser from "phaser";

/**
 * BootScene handles preloading assets and initial setup for RuneRogue.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    // TODO: Preload assets (sprites, audio, etc.)
    this.load.image("player", "assets/sprites/player.png");
    // ...other assets
  }

  create(): void {
    this.scene.start("GameScene");
  }
}
