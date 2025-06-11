import { DiscordSDK } from '@discord/embedded-app-sdk';
import { Client } from 'colyseus.js';
import { CONFIG } from './config';
import { AssetLoader } from './game/AssetLoader';
import { AudioManager } from './game/AudioManager';
import { GameClient } from './game/GameClient';
import { GameState } from './game/GameState';
import { IGameRenderer } from './game/IGameRenderer';
import { InputManager } from './game/InputManager';
import { OSRSStyleRenderer } from './game/OSRSStyleRenderer';
import { SpriteManager } from './game/SpriteManager';
import { UIManager } from './game/UIManager';

// Main entry point for the RuneRogue Discord-embedded game client
document.addEventListener('DOMContentLoaded', async () => {
  console.log('RuneRogue Discord Game Client initializing...');

  try {
    // Initialize Discord SDK
    const discord = new DiscordSDK(CONFIG.DISCORD_CLIENT_ID);
    await discord.ready();

    // Get authenticated user
    const user = await discord.user.fetch();
    console.log(`Authenticated as Discord user: ${user.username}`);

    // Create loading screen
    showLoadingScreen('Loading RuneRogue...');

    // Initialize asset loader and load assets
    const assetLoader = new AssetLoader();

    try {
      // Try to load assets
      await assetLoader.loadAllAssets();
    } catch (error) {
      console.warn('Failed to load assets, using placeholders instead:', error);
      assetLoader.createPlaceholderAssets();
    }

    // Initialize audio manager
    const audioManager = new AudioManager();

    // Initialize sprite manager
    const spriteManager = new SpriteManager(assetLoader);

    // Create game canvas
    const canvas = createGameCanvas();
    const ctx = canvas.getContext('2d')!;

    // Enable pixelated rendering
    ctx.imageSmoothingEnabled = false;

    // Initialize game state
    const gameState = new GameState();

    // Make gameState available globally for debugging
    (window as any).gameState = gameState;

    // Initialize OSRS-style game renderer
    const gameRenderer = new OSRSStyleRenderer(spriteManager);

    // Initialize UI manager
    const uiManager = new UIManager(discord, user);

    // Initialize input manager
    const inputManager = new InputManager(discord);

    // Set up input callbacks
    inputManager.onMove = (x, y) => {
      if (gameClient) {
        gameClient.sendMoveCommand(x, y);
      }
    };

    inputManager.onAttack = targetId => {
      if (gameClient) {
        gameClient.sendAttackCommand(targetId);
        audioManager.playAttackSound();
      }
    };

    inputManager.onCollectLoot = lootId => {
      if (gameClient) {
        gameClient.sendCollectCommand(lootId);
      }
    };

    inputManager.onUseItem = itemIndex => {
      if (gameClient) {
        gameClient.sendUseItemCommand(itemIndex);
      }
    };

    // Initialize game client
    const gameClient = new GameClient(
      CONFIG.SERVER_URL,
      gameState,
      gameRenderer,
      inputManager,
      uiManager,
      audioManager,
      user
    );

    // Set up event listeners for game events
    document.addEventListener('item-use', (event: any) => {
      const itemIndex = event.detail.itemIndex;
      if (gameClient) {
        gameClient.sendUseItemCommand(itemIndex);
      }
    });

    // Connect to game server
    updateLoadingScreen('Connecting to server...');

    try {
      await gameClient.connect();
      console.log('Connected to game server');

      // Hide loading screen
      hideLoadingScreen();

      // Show game UI
      uiManager.showGameUI();

      // Start playing background music
      audioManager.playMusic();

      // Update Discord rich presence
      updateDiscordPresence(discord, gameState);

      // Start the game loop
      gameLoop(gameClient, gameState, gameRenderer, uiManager, audioManager, discord);
    } catch (error) {
      console.error('Failed to connect to game server:', error);
      showErrorScreen('Failed to connect to game server. Please try again later.');
    }
  } catch (error) {
    console.error('Failed to initialize Discord SDK:', error);
    showErrorScreen(
      'Failed to initialize Discord SDK. Please make sure you are running this app within Discord.'
    );
  }
});

// Create game canvas
function createGameCanvas(): HTMLCanvasElement {
  // Remove any existing canvas
  const existingCanvas = document.getElementById('game-canvas');
  if (existingCanvas) {
    existingCanvas.remove();
  }

  // Create game container if it doesn't exist
  let gameContainer = document.getElementById('game-container');
  if (!gameContainer) {
    gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    document.body.appendChild(gameContainer);
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  canvas.width = CONFIG.CANVAS_WIDTH;
  canvas.height = CONFIG.CANVAS_HEIGHT;

  // Add canvas to container
  gameContainer.appendChild(canvas);

  return canvas;
}

// Show loading screen
function showLoadingScreen(message: string): void {
  // Create loading screen if it doesn't exist
  let loadingScreen = document.getElementById('loading-screen');
  if (!loadingScreen) {
    loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100%';
    loadingScreen.style.height = '100%';
    loadingScreen.style.backgroundColor = '#000';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.flexDirection = 'column';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.zIndex = '1000';

    // Add RuneRogue logo
    const logo = document.createElement('div');
    logo.textContent = 'RuneRogue';
    logo.style.fontSize = '48px';
    logo.style.fontFamily = 'RuneScape, monospace';
    logo.style.color = '#ffcc00';
    logo.style.marginBottom = '20px';
    loadingScreen.appendChild(logo);

    // Add loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.id = 'loading-message';
    loadingMessage.style.color = '#fff';
    loadingMessage.style.fontSize = '18px';
    loadingScreen.appendChild(loadingMessage);

    // Add loading bar
    const loadingBarContainer = document.createElement('div');
    loadingBarContainer.style.width = '300px';
    loadingBarContainer.style.height = '20px';
    loadingBarContainer.style.backgroundColor = '#333';
    loadingBarContainer.style.marginTop = '20px';
    loadingBarContainer.style.border = '2px solid #3e2415';

    const loadingBar = document.createElement('div');
    loadingBar.id = 'loading-bar';
    loadingBar.style.width = '0%';
    loadingBar.style.height = '100%';
    loadingBar.style.backgroundColor = '#ffcc00';
    loadingBar.style.transition = 'width 0.5s';

    loadingBarContainer.appendChild(loadingBar);
    loadingScreen.appendChild(loadingBarContainer);

    document.body.appendChild(loadingScreen);
  }

  // Update loading message
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.textContent = message;
  }

  // Animate loading bar
  const loadingBar = document.getElementById('loading-bar');
  if (loadingBar) {
    loadingBar.style.width = '0%';

    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      if (progress > 100) {
        clearInterval(interval);
      } else {
        loadingBar.style.width = `${progress}%`;
      }
    }, 50);
  }
}

// Update loading screen
function updateLoadingScreen(message: string): void {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.textContent = message;
  }

  const loadingBar = document.getElementById('loading-bar');
  if (loadingBar) {
    loadingBar.style.width = '50%';
  }
}

// Hide loading screen
function hideLoadingScreen(): void {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.5s';

    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
}

// Show error screen
function showErrorScreen(message: string): void {
  // Hide loading screen first
  hideLoadingScreen();

  // Create error screen
  const errorScreen = document.createElement('div');
  errorScreen.id = 'error-screen';
  errorScreen.style.position = 'fixed';
  errorScreen.style.top = '0';
  errorScreen.style.left = '0';
  errorScreen.style.width = '100%';
  errorScreen.style.height = '100%';
  errorScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
  errorScreen.style.display = 'flex';
  errorScreen.style.flexDirection = 'column';
  errorScreen.style.justifyContent = 'center';
  errorScreen.style.alignItems = 'center';
  errorScreen.style.zIndex = '1000';

  // Add error message
  const errorMessage = document.createElement('div');
  errorMessage.textContent = message;
  errorMessage.style.color = '#ff0000';
  errorMessage.style.fontSize = '24px';
  errorMessage.style.maxWidth = '80%';
  errorMessage.style.textAlign = 'center';
  errorMessage.style.marginBottom = '20px';
  errorScreen.appendChild(errorMessage);

  // Add retry button
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  retryButton.style.padding = '10px 20px';
  retryButton.style.fontSize = '18px';
  retryButton.style.backgroundColor = '#3e2415';
  retryButton.style.color = '#fff';
  retryButton.style.border = '2px solid #ffcc00';
  retryButton.style.cursor = 'pointer';

  retryButton.addEventListener('click', () => {
    window.location.reload();
  });

  errorScreen.appendChild(retryButton);
  document.body.appendChild(errorScreen);
}

// Update Discord rich presence
function updateDiscordPresence(discord: DiscordSDK, gameState: GameState): void {
  if (!gameState.player) return;

  // Set Discord rich presence
  discord.presence
    .update({
      details: `Level ${gameState.player.combatLevel} Player`,
      state: `Room ${gameState.roomId || 'Lobby'}`,
      partySize: gameState.players.size,
      partyMax: CONFIG.MAX_PLAYERS_PER_ROOM,
      startTimestamp: Date.now(),
      largeImageKey: 'game_logo',
      largeImageText: 'RuneRogue',
      smallImageKey: 'player_icon',
      smallImageText: gameState.player.username,
      instance: false,
    })
    .catch(error => {
      console.error('Failed to update Discord presence:', error);
    });

  // Update presence every 60 seconds
  setTimeout(() => {
    updateDiscordPresence(discord, gameState);
  }, 60000);
}

// Main game loop
function gameLoop(
  gameClient: GameClient,
  gameState: GameState,
  gameRenderer: IGameRenderer,
  uiManager: UIManager,
  audioManager: AudioManager,
  discord: DiscordSDK
): void {
  let lastTime = performance.now();

  // Animation frame loop
  function animate(currentTime: number): void {
    // Calculate delta time
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // Update game state
    gameClient.update(deltaTime);

    // Update UI
    if (gameState.player) {
      uiManager.updatePlayerInfo(gameState.player);
      uiManager.updateMinimap(gameState);
    }

    // Render game
    gameRenderer.render(gameState, deltaTime);

    // Request next frame
    requestAnimationFrame(animate);
  }

  // Start animation loop
  requestAnimationFrame(animate);
}
