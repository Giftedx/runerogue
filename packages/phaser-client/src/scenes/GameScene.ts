import Phaser from "phaser";

/**
 * Stub scene for RuneRogue; to be expanded with game logic.
 */
export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  /**
   * Preload assets
   */
  preload(): void {
    // TODO: load assets here
  }

  /**
   * Create game objects
   */
  create(): void {
    // TODO: initialize game objects here
    this.add.text(100, 100, "Game Scene", { color: "#ffffff" });
  }

  /**
   * Game loop update
   * @param time current time
   * @param delta elapsed time since last frame
   */
  update(time: number, delta: number): void {
    // TODO: add game update logic here
  }
}
