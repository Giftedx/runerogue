import Phaser from "phaser";

/**
 * Configuration constants for the preload scene
 */
const PRELOAD_CONFIG = {
  LOADING_BAR: {
    WIDTH: 400,
    HEIGHT: 30,
    PADDING: 10,
    BORDER_WIDTH: 4,
  },
  COLORS: {
    BACKGROUND: 0x222222,
    BORDER: 0x666666,
    FILL: 0x4169e1,
    TEXT: "#ffffff",
    ERROR: "#ff6b6b",
  },
  PLACEHOLDER_SPRITES: {
    player: { width: 32, height: 32, color: 0x4169e1 },
    goblin: { width: 24, height: 24, color: 0x228b22 },
    giant_rat: { width: 20, height: 20, color: 0x8b4513 },
    skeleton: { width: 28, height: 28, color: 0x808080 },
    chicken: { width: 14, height: 14, color: 0xffffe0 },
    cow: { width: 28, height: 18, color: 0xf5deb3 },
    zombie: { width: 28, height: 28, color: 0x556b2f },
    chest: { width: 32, height: 32, color: 0xffd700 },
    projectile: { width: 8, height: 8, color: 0xff4500 },
  },
  TRANSITION_DELAY: 500,
  MIN_DISPLAY_TIME: 1000, // Minimum time to show loading screen
} as const;

/**
 * PreloadScene handles loading all game assets with visual feedback
 *
 * @class PreloadScene
 * @extends {Phaser.Scene}
 *
 * @example
 * ```typescript
 * const config = {
 *   scene: [PreloadScene, MainMenuScene, GameScene]
 * };
 * const game = new Phaser.Game(config);
 * ```
 */
export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Rectangle;
  private loadingBarBorder!: Phaser.GameObjects.Rectangle;
  private loadingText!: Phaser.GameObjects.Text;
  private percentText!: Phaser.GameObjects.Text;
  private assetText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private startTime!: number;
  private hasError = false;

  constructor() {
    super({ key: "PreloadScene" });
  }

  /**
   * Initialize scene data
   */
  init(): void {
    this.startTime = Date.now();
    this.hasError = false;
  }

  /**
   * Preload all game assets
   */
  preload(): void {
    this.createLoadingUI();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  /**
   * Create the loading UI elements
   */
  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;
    const centerX = width / 2;
    const centerY = height / 2;

    // Main loading text
    this.loadingText = this.add.text(
      centerX,
      centerY - 60,
      "Loading RuneRogue...",
      {
        fontSize: "32px",
        color: PRELOAD_CONFIG.COLORS.TEXT,
        fontFamily: "Arial, sans-serif",
      }
    );
    this.loadingText.setOrigin(0.5);

    // Loading bar background
    const barX = centerX - PRELOAD_CONFIG.LOADING_BAR.WIDTH / 2;
    const barY = centerY - PRELOAD_CONFIG.LOADING_BAR.HEIGHT / 2;

    this.loadingBarBorder = this.add.rectangle(
      centerX,
      centerY,
      PRELOAD_CONFIG.LOADING_BAR.WIDTH +
        PRELOAD_CONFIG.LOADING_BAR.BORDER_WIDTH,
      PRELOAD_CONFIG.LOADING_BAR.HEIGHT +
        PRELOAD_CONFIG.LOADING_BAR.BORDER_WIDTH,
      PRELOAD_CONFIG.COLORS.BORDER
    );

    // Loading bar fill
    this.loadingBar = this.add.rectangle(
      barX + PRELOAD_CONFIG.LOADING_BAR.PADDING,
      centerY,
      0,
      PRELOAD_CONFIG.LOADING_BAR.HEIGHT -
        PRELOAD_CONFIG.LOADING_BAR.PADDING * 2,
      PRELOAD_CONFIG.COLORS.FILL
    );
    this.loadingBar.setOrigin(0, 0.5);

    // Percentage text
    this.percentText = this.add.text(centerX, centerY + 40, "0%", {
      fontSize: "24px",
      color: PRELOAD_CONFIG.COLORS.TEXT,
      fontFamily: "Arial, sans-serif",
    });
    this.percentText.setOrigin(0.5);

    // Current asset text
    this.assetText = this.add.text(centerX, centerY + 70, "", {
      fontSize: "16px",
      color: PRELOAD_CONFIG.COLORS.TEXT,
      fontFamily: "Arial, sans-serif",
    });
    this.assetText.setOrigin(0.5);

    // Error text (hidden by default)
    this.errorText = this.add.text(centerX, centerY + 100, "", {
      fontSize: "16px",
      color: PRELOAD_CONFIG.COLORS.ERROR,
      fontFamily: "Arial, sans-serif",
    });
    this.errorText.setOrigin(0.5);
    this.errorText.setVisible(false);
  }

  /**
   * Setup loading event listeners
   */
  private setupLoadingEvents(): void {
    this.load.on("progress", (value: number) => {
      this.updateLoadingBar(value);
    });

    this.load.on("fileprogress", (file: Phaser.Loader.File) => {
      this.assetText.setText(`Loading: ${file.key}`);
    });

    this.load.on("complete", () => {
      this.assetText.setText("Loading complete!");
    });

    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      this.handleLoadError(file);
    });
  }

  /**
   * Update the loading bar based on progress
   * @param value - Progress value between 0 and 1
   */
  private updateLoadingBar(value: number): void {
    const percentage = Math.floor(value * 100);
    this.percentText.setText(`${percentage}%`);

    const maxWidth =
      PRELOAD_CONFIG.LOADING_BAR.WIDTH - PRELOAD_CONFIG.LOADING_BAR.PADDING * 2;
    this.loadingBar.width = maxWidth * value;
  }

  /**
   * Handle asset loading errors
   * @param file - The file that failed to load
   */
  private handleLoadError(file: Phaser.Loader.File): void {
    console.error(`Failed to load asset: ${file.key}`, file);
    this.hasError = true;
    this.errorText.setText(`Failed to load: ${file.key}`);
    this.errorText.setVisible(true);

    // Create placeholder for failed asset
    if (file.type === "image") {
      this.createErrorPlaceholder(file.key);
    }
  }

  /**
   * Create a placeholder texture for failed assets
   * @param key - The asset key
   */
  private createErrorPlaceholder(key: string): void {
    const graphics = this.add.graphics();
    graphics.fillStyle(0xff0000, 0.5);
    graphics.fillRect(0, 0, 32, 32);
    graphics.lineStyle(2, 0xff0000);
    graphics.strokeRect(0, 0, 32, 32);
    graphics.generateTexture(key, 32, 32);
    graphics.destroy();
  }

  /**
   * Load all game assets
   */
  private loadAssets(): void {
    // Load actual game assets if available
    this.loadImages();
    this.loadAudio();
    this.loadData();

    // Create placeholder sprites as fallback
    this.createPlaceholderSprites();
  }

  /**
   * Load image assets
   */
  private loadImages(): void {
    // Check if assets directory exists and load real assets
    // For now, we'll skip this as we're using placeholders
    // Example of how to load real assets:
    // this.load.image('player', 'assets/sprites/player.png');
    // this.load.spritesheet('player-walk', 'assets/sprites/player-walk.png', {
    //   frameWidth: 32,
    //   frameHeight: 32
    // });
  }

  /**
   * Load audio assets
   */
  private loadAudio(): void {
    // Example audio loading:
    // this.load.audio('bgm', ['assets/audio/bgm.ogg', 'assets/audio/bgm.mp3']);
    // this.load.audio('hit', ['assets/audio/hit.ogg', 'assets/audio/hit.mp3']);
  }

  /**
   * Load data files
   */
  private loadData(): void {
    // Example data loading:
    // this.load.json('gameConfig', 'assets/data/config.json');
    // this.load.json('items', 'assets/data/items.json');
  }

  /**
   * Create placeholder sprites for development
   */
  private createPlaceholderSprites(): void {
    Object.entries(PRELOAD_CONFIG.PLACEHOLDER_SPRITES).forEach(
      ([key, config]) => {
        this.createPlaceholderSprite(
          key,
          config.width,
          config.height,
          config.color
        );
      }
    );
  }

  /**
   * Create a single placeholder sprite
   * @param key - Sprite key
   * @param width - Sprite width
   * @param height - Sprite height
   * @param color - Fill color
   */
  private createPlaceholderSprite(
    key: string,
    width: number,
    height: number,
    color: number
  ): void {
    try {
      const graphics = this.add.graphics();

      // Add subtle gradient effect
      const gradient = this.add.graphics();
      gradient.fillGradientStyle(
        color,
        color,
        0xffffff,
        0xffffff,
        0.8,
        0.8,
        0.2,
        0.2
      );
      gradient.fillRect(0, 0, width, height);

      // Main color
      graphics.fillStyle(color, 0.9);
      graphics.fillRect(0, 0, width, height);

      // Add border
      graphics.lineStyle(1, 0x000000, 0.5);
      graphics.strokeRect(0, 0, width, height);

      // Generate texture
      graphics.generateTexture(key, width, height);

      // Cleanup
      graphics.destroy();
      gradient.destroy();
    } catch (error) {
      console.error(`Failed to create placeholder sprite: ${key}`, error);
      this.handleLoadError({ key, type: "image" } as Phaser.Loader.File);
    }
  }

  /**
   * Scene creation logic
   */
  create(): void {
    const elapsedTime = Date.now() - this.startTime;
    const remainingTime = Math.max(
      0,
      PRELOAD_CONFIG.MIN_DISPLAY_TIME - elapsedTime
    );

    // Ensure minimum display time for loading screen
    this.time.delayedCall(remainingTime, () => {
      if (this.hasError) {
        // Give user time to read error message
        this.time.delayedCall(2000, () => {
          this.transitionToNextScene();
        });
      } else {
        this.transitionToNextScene();
      }
    });
  }

  /**
   * Transition to the next scene with fade effect
   */
  private transitionToNextScene(): void {
    this.cameras.main.fadeOut(PRELOAD_CONFIG.TRANSITION_DELAY, 0, 0, 0);

    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        // Check if MainMenuScene exists, otherwise go to GameScene
        if (this.scene.get("MainMenuScene")) {
          this.scene.start("MainMenuScene");
        } else {
          console.warn("MainMenuScene not found, starting GameScene");
          this.scene.start("GameScene");
        }
      }
    );
  }

  /**
   * Clean up scene resources
   */
  shutdown(): void {
    // Remove all event listeners
    this.load.off("progress");
    this.load.off("fileprogress");
    this.load.off("complete");
    this.load.off("loaderror");
  }
}
