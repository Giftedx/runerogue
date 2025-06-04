import { CONFIG } from '../config';

export class AssetLoader {
  private images: Map<string, HTMLImageElement> = new Map();
  private audioFiles: Map<string, HTMLAudioElement> = new Map();
  private fonts: Map<string, FontFace> = new Map();
  private loadPromises: Promise<void>[] = [];
  private loadingComplete: boolean = false;
  
  constructor() {
    // Initialize loading promises
    this.loadPromises = [];
  }
  
  // Load all game assets
  public async loadAllAssets(): Promise<void> {
    try {
      console.log('Loading assets...');
      
      // Load sprite sheets
      await this.loadSpriteSheets();
      
      // Load audio files
      await this.loadAudioFiles();
      
      // Load fonts
      await this.loadFonts();
      
      // Wait for all assets to load
      await Promise.all(this.loadPromises);
      
      this.loadingComplete = true;
      console.log('All assets loaded successfully');
    } catch (error) {
      console.error('Failed to load assets:', error);
      throw error;
    }
  }
  
  // Load sprite sheets
  private async loadSpriteSheets(): Promise<void> {
    const spriteSheets = [
      { key: 'player', path: CONFIG.ASSETS.SPRITES.PLAYER },
      { key: 'npcs', path: CONFIG.ASSETS.SPRITES.NPCS },
      { key: 'tiles', path: CONFIG.ASSETS.SPRITES.TILES },
      { key: 'items', path: CONFIG.ASSETS.SPRITES.ITEMS },
      { key: 'effects', path: CONFIG.ASSETS.SPRITES.EFFECTS }
    ];
    
    for (const sheet of spriteSheets) {
      const loadPromise = this.loadImage(sheet.key, sheet.path);
      this.loadPromises.push(loadPromise);
    }
  }
  
  // Load audio files
  private async loadAudioFiles(): Promise<void> {
    // Load background music
    const musicPromise = this.loadAudio('main', CONFIG.ASSETS.AUDIO.MUSIC);
    this.loadPromises.push(musicPromise);
    
    // Load sound effects
    const sfxFiles = [
      { key: 'attack', path: CONFIG.ASSETS.AUDIO.SFX.ATTACK },
      { key: 'hit', path: CONFIG.ASSETS.AUDIO.SFX.HIT },
      { key: 'collect', path: CONFIG.ASSETS.AUDIO.SFX.COLLECT }
    ];
    
    for (const sfx of sfxFiles) {
      const loadPromise = this.loadAudio(sfx.key, sfx.path);
      this.loadPromises.push(loadPromise);
    }
  }
  
  // Load fonts
  private async loadFonts(): Promise<void> {
    const fontPromise = this.loadFont('main', CONFIG.ASSETS.FONTS.MAIN);
    this.loadPromises.push(fontPromise);
  }
  
  // Load a single image
  private loadImage(key: string, path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.images.set(key, img);
        console.log(`Loaded image: ${key}`);
        resolve();
      };
      
      img.onerror = (error) => {
        console.error(`Failed to load image ${key} from ${path}:`, error);
        reject(new Error(`Failed to load image: ${path}`));
      };
      
      img.src = path;
    });
  }
  
  // Load a single audio file
  private loadAudio(key: string, path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const audio = new Audio();
      
      audio.oncanplaythrough = () => {
        this.audioFiles.set(key, audio);
        console.log(`Loaded audio: ${key}`);
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error(`Failed to load audio ${key} from ${path}:`, error);
        reject(new Error(`Failed to load audio: ${path}`));
      };
      
      audio.src = path;
      audio.load();
    });
  }
  
  // Load a single font
  private loadFont(key: string, path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const fontFace = new FontFace(key, `url(${path})`);
      
      fontFace.load()
        .then((loadedFont) => {
          document.fonts.add(loadedFont);
          this.fonts.set(key, loadedFont);
          console.log(`Loaded font: ${key}`);
          resolve();
        })
        .catch((error) => {
          console.error(`Failed to load font ${key} from ${path}:`, error);
          reject(new Error(`Failed to load font: ${path}`));
        });
    });
  }
  
  // Get a loaded image
  public getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }
  
  // Get a loaded audio file
  public getAudio(key: string): HTMLAudioElement | undefined {
    return this.audioFiles.get(key);
  }
  
  // Get a loaded font
  public getFont(key: string): FontFace | undefined {
    return this.fonts.get(key);
  }
  
  // Check if all assets are loaded
  public isLoadingComplete(): boolean {
    return this.loadingComplete;
  }
  
  // Create placeholder assets for development
  public createPlaceholderAssets(): void {
    // Create placeholder canvas for player sprite
    const playerCanvas = document.createElement('canvas');
    playerCanvas.width = 128;
    playerCanvas.height = 256;
    const playerCtx = playerCanvas.getContext('2d');
    if (playerCtx) {
      // Draw player placeholder (different colors for different animations)
      playerCtx.fillStyle = '#3498db'; // Blue for idle
      playerCtx.fillRect(0, 0, 32, 32);
      playerCtx.fillRect(0, 32, 32, 32);
      playerCtx.fillRect(0, 64, 32, 32);
      playerCtx.fillRect(0, 96, 32, 32);
      
      playerCtx.fillStyle = '#2ecc71'; // Green for walking
      for (let i = 0; i < 4; i++) {
        playerCtx.fillRect(32 * i, 0, 32, 32);
        playerCtx.fillRect(32 * i, 32, 32, 32);
        playerCtx.fillRect(32 * i, 64, 32, 32);
        playerCtx.fillRect(32 * i, 96, 32, 32);
      }
      
      playerCtx.fillStyle = '#e74c3c'; // Red for attacking
      for (let i = 0; i < 3; i++) {
        playerCtx.fillRect(32 * i, 128, 32, 32);
        playerCtx.fillRect(32 * i, 160, 32, 32);
        playerCtx.fillRect(32 * i, 192, 32, 32);
        playerCtx.fillRect(32 * i, 224, 32, 32);
      }
      
      // Convert canvas to image
      const playerImg = new Image();
      playerImg.src = playerCanvas.toDataURL();
      this.images.set('player', playerImg);
    }
    
    // Create placeholder for NPC sprites
    const npcCanvas = document.createElement('canvas');
    npcCanvas.width = 128;
    npcCanvas.height = 256;
    const npcCtx = npcCanvas.getContext('2d');
    if (npcCtx) {
      // Draw NPC placeholder (different colors for different types)
      npcCtx.fillStyle = '#f39c12'; // Orange for goblin
      npcCtx.fillRect(0, 0, 32, 32);
      npcCtx.fillRect(0, 32, 32, 32);
      npcCtx.fillRect(0, 64, 32, 32);
      npcCtx.fillRect(0, 96, 32, 32);
      
      // Convert canvas to image
      const npcImg = new Image();
      npcImg.src = npcCanvas.toDataURL();
      this.images.set('npcs', npcImg);
    }
    
    // Create placeholder for tiles
    const tilesCanvas = document.createElement('canvas');
    tilesCanvas.width = 192;
    tilesCanvas.height = 32;
    const tilesCtx = tilesCanvas.getContext('2d');
    if (tilesCtx) {
      // Floor tile
      tilesCtx.fillStyle = '#7f8c8d';
      tilesCtx.fillRect(0, 0, 32, 32);
      
      // Wall tile
      tilesCtx.fillStyle = '#34495e';
      tilesCtx.fillRect(32, 0, 32, 32);
      
      // Exit tile
      tilesCtx.fillStyle = '#f1c40f';
      tilesCtx.fillRect(64, 0, 32, 32);
      tilesCtx.fillRect(96, 0, 32, 32);
      tilesCtx.fillRect(128, 0, 32, 32);
      tilesCtx.fillRect(160, 0, 32, 32);
      
      // Convert canvas to image
      const tilesImg = new Image();
      tilesImg.src = tilesCanvas.toDataURL();
      this.images.set('tiles', tilesImg);
    }
    
    // Create placeholder for items
    const itemsCanvas = document.createElement('canvas');
    itemsCanvas.width = 96;
    itemsCanvas.height = 64;
    const itemsCtx = itemsCanvas.getContext('2d');
    if (itemsCtx) {
      // Loot pile
      itemsCtx.fillStyle = '#9b59b6';
      itemsCtx.fillRect(0, 0, 32, 32);
      itemsCtx.fillRect(32, 0, 32, 32);
      itemsCtx.fillRect(64, 0, 32, 32);
      
      // Items
      itemsCtx.fillStyle = '#e67e22';
      itemsCtx.fillRect(0, 32, 32, 32);
      itemsCtx.fillRect(32, 32, 32, 32);
      itemsCtx.fillRect(64, 32, 32, 32);
      
      // Convert canvas to image
      const itemsImg = new Image();
      itemsImg.src = itemsCanvas.toDataURL();
      this.images.set('items', itemsImg);
    }
    
    // Create placeholder for effects
    const effectsCanvas = document.createElement('canvas');
    effectsCanvas.width = 128;
    effectsCanvas.height = 64;
    const effectsCtx = effectsCanvas.getContext('2d');
    if (effectsCtx) {
      // Sparkle effect
      effectsCtx.fillStyle = '#f1c40f';
      effectsCtx.fillRect(0, 0, 16, 16);
      effectsCtx.fillRect(16, 0, 16, 16);
      effectsCtx.fillRect(32, 0, 16, 16);
      effectsCtx.fillRect(48, 0, 16, 16);
      
      // Combat effect
      effectsCtx.fillStyle = '#e74c3c';
      effectsCtx.fillRect(0, 16, 16, 16);
      effectsCtx.fillRect(16, 16, 16, 16);
      
      // Hit effect
      effectsCtx.fillStyle = '#e74c3c';
      effectsCtx.fillRect(0, 32, 32, 32);
      effectsCtx.fillRect(32, 32, 32, 32);
      effectsCtx.fillRect(64, 32, 32, 32);
      effectsCtx.fillRect(96, 32, 32, 32);
      
      // Convert canvas to image
      const effectsImg = new Image();
      effectsImg.src = effectsCanvas.toDataURL();
      this.images.set('effects', effectsImg);
    }
    
    // Create placeholder audio
    const audio = new Audio();
    this.audioFiles.set('main', audio);
    this.audioFiles.set('attack', audio);
    this.audioFiles.set('hit', audio);
    this.audioFiles.set('collect', audio);
    
    this.loadingComplete = true;
    console.log('Placeholder assets created');
  }
}
