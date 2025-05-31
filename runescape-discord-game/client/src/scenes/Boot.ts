import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load assets for the preload scene here (e.g., loading bar)
    console.log('BootScene preload');
  }

  create() {
    console.log('BootScene create');
    this.scene.start('PreloadScene');
  }
}
