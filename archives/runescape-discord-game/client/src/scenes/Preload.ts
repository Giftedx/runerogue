import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload() {
    console.log("PreloadScene preload");
    // Load all game assets here (images, spritesheets, audio etc.)
    // For now, just a placeholder
    this.load.image(
      "logo",
      "https://labs.phaser.io/assets/sprites/phaser3-logo.png",
    );
  }

  create() {
    console.log("PreloadScene create");
    this.scene.start("MainMenuScene");
  }
}
