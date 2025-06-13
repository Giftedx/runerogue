import Phaser from 'phaser';

/**
 * PreloadScene - Loads all game assets before starting the main game
 * This scene runs first and displays a loading screen
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Show loading UI
    this.createLoadingBar();

    // Load placeholder assets for development
    this.createPlaceholderAssets();

    // Load any actual assets if available
    this.loadGameAssets();
  }

  private createLoadingBar() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    // Progress bar
    const progressBar = this.add.graphics();

    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading RuneRogue...',
      style: { font: '20px monospace', color: '#ffffff' },
    });
    loadingText.setOrigin(0.5, 0.5);

    // Percentage text
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: { font: '18px monospace', color: '#ffffff' },
    });
    percentText.setOrigin(0.5, 0.5);

    // Update loading bar
    this.load.on('progress', (value: number) => {
      percentText.setText(parseInt(String(value * 100)) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      this.scene.start('GameScene');
    });
  }

  private createPlaceholderAssets() {
    // Create simple colored rectangles as placeholders
    const graphics = this.add.graphics();

    // Player sprite (green)
    graphics.fillStyle(0x00ff00, 1);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('player_default', 32, 32);

    // Enemy sprites
    graphics.clear();
    graphics.fillStyle(0xff0000, 1);
    graphics.fillRect(0, 0, 24, 24);
    graphics.generateTexture('enemy_default', 24, 24);

    // Different enemy types
    graphics.clear();
    graphics.fillStyle(0xff4444, 1);
    graphics.fillRect(0, 0, 20, 20);
    graphics.generateTexture('chicken', 20, 20);

    graphics.clear();
    graphics.fillStyle(0xff6666, 1);
    graphics.fillRect(0, 0, 22, 22);
    graphics.generateTexture('rat', 22, 22);

    graphics.clear();
    graphics.fillStyle(0xff8888, 1);
    graphics.fillRect(0, 0, 26, 26);
    graphics.generateTexture('goblin', 26, 26);

    // UI elements
    graphics.clear();
    graphics.fillStyle(0x444444, 1);
    graphics.fillRect(0, 0, 100, 20);
    graphics.generateTexture('ui_panel', 100, 20);

    graphics.destroy();
  }

  private loadGameAssets() {
    // TODO: Load actual OSRS-style assets when available
    // For now, we use placeholders
    console.log('PreloadScene: Using placeholder assets for development');
  }

  create() {
    console.log('PreloadScene: Assets loaded, starting GameScene');
    // The loading bar completion handler will start the GameScene
  }
}
