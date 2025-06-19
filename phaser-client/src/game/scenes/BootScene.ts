import { Scene } from "phaser";

/**
 * The BootScene is the initial scene that loads when the Phaser game starts.
 *
 * Its primary responsibility is to load essential assets that are required
 * globally across the game, such as a loading bar graphic or fonts.
 * Once the essential assets are loaded, it will typically transition to the
 * next scene, such as a PreloaderScene or a MainMenuScene.
 */
export class BootScene extends Scene {
  constructor() {
    super("BootScene");
  }

  /**
   * Preload any assets needed for the loading screen or global game usage.
   */
  preload() {
    // For example, load a logo or a progress bar background
    // this.load.image('logo', 'assets/logo.png');
    console.info("BootScene: Preloading assets...");
  }

  /**
   * Create scene objects and transition to the next scene.
   */
  create() {
    console.info("BootScene: Create method called.");
    // In a real game, you would transition to a preloader or main menu scene.
    // For now, we'll just log a message.
    // this.scene.start('PreloaderScene');
  }
}
