import { DiscordSDK } from '@discord/embedded-app-sdk';
import { CONFIG } from './config';
import { PhaserGameClient } from './game/PhaserGameClient';
import './styles/enhanced-client.css';

/**
 * Enhanced RuneRogue Client Entry Point
 *
 * This is the new Phaser-based client that connects to the enhanced GameRoom
 * with Phase 1 improvements: 20 TPS game loop, performance monitoring,
 * OSRS movement validation, and robust connection management.
 */

interface DiscordUser {
  username: string;
  id: string;
  avatar?: string;
  discriminator?: string;
}

// Global state
let discord: DiscordSDK;
let user: DiscordUser;
let gameClient: PhaserGameClient | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 RuneRogue Enhanced Client initializing...');

  try {
    // Initialize Discord SDK
    discord = new DiscordSDK(CONFIG.DISCORD_CLIENT_ID);
    await discord.ready();

    console.log('✅ Discord SDK ready');

    // Mock user for development (since Discord auth API has changed)
    user = {
      username: 'Player' + Math.floor(Math.random() * 1000),
      id: Date.now().toString(),
      avatar: null,
      discriminator: '0001',
    };

    // Show main game interface
    showGameInterface();
  } catch (error) {
    console.error('Failed to initialize Discord SDK:', error);
    showErrorScreen(
      'Failed to initialize Discord SDK. Please make sure you are running this app within Discord.'
    );
  }
});

/**
 * Show the main game interface with Phaser client
 */
function showGameInterface() {
  // Clear any existing content
  document.body.innerHTML = '';

  // Create main container
  const container = document.createElement('div');
  container.className = 'enhanced-client-container';

  // Create header
  const header = document.createElement('div');
  header.className = 'game-header';
  header.innerHTML = `
    <div class="header-left">
      <h1>🛡️ RuneRogue</h1>
      <span class="version">Enhanced Multiplayer v2.0</span>
    </div>
    <div class="header-right">
      <span class="player-info">👤 ${user.username}</span>
      <span class="status">🟢 Ready</span>
    </div>
  `;

  // Create game container
  const gameContainer = document.createElement('div');
  gameContainer.id = 'enhanced-game-container';
  gameContainer.className = 'game-container';

  // Add connection info
  const infoPanel = document.createElement('div');
  infoPanel.className = 'info-panel';
  infoPanel.innerHTML = `
    <div class="enhancement-info">
      <h3>🎯 Phase 1 Enhancements Active</h3>
      <ul>
        <li>✅ 20 TPS Enhanced GameRoom</li>
        <li>✅ OSRS Movement Validation</li>
        <li>✅ Performance Monitoring</li>
        <li>✅ Robust Connection Management</li>
        <li>✅ Real-time Multiplayer Sync</li>
      </ul>
    </div>
    <div class="server-info">
      <p><strong>Server:</strong> ${CONFIG.SERVER_URL}</p>
      <p><strong>Protocol:</strong> Colyseus WebSocket</p>
      <p><strong>Room Type:</strong> Enhanced GameRoom</p>
    </div>
  `;

  // Assemble interface
  container.appendChild(header);
  container.appendChild(infoPanel);
  container.appendChild(gameContainer);
  document.body.appendChild(container);

  // Initialize Phaser client
  initializePhaserClient(gameContainer);
}

/**
 * Initialize the Phaser game client
 */
async function initializePhaserClient(container: HTMLElement) {
  console.log('🎮 Initializing Enhanced Phaser Game Client...');

  // Create game container elements
  const phaserWrapper = document.createElement('div');
  phaserWrapper.className = 'phaser-wrapper';

  // Game info display
  const gameInfo = document.createElement('div');
  gameInfo.className = 'game-info-display';
  gameInfo.innerHTML = `
    <div class="connection-status">
      <span class="status-indicator">🔄</span>
      <span class="status-text">Initializing...</span>
    </div>
    <div class="player-info">
      <span>Player: ${user.username}</span>
    </div>
  `;

  // Phaser container
  const phaserContainer = document.createElement('div');
  phaserContainer.id = 'phaser-game-container';
  phaserContainer.className = 'phaser-container';

  // Status container
  const statusContainer = document.createElement('div');
  statusContainer.id = 'connection-status';
  statusContainer.className = 'connection-status-panel';

  // Controls info
  const controlsInfo = document.createElement('div');
  controlsInfo.className = 'controls-info';
  controlsInfo.innerHTML = `
    <p>🖱️ <strong>Click to move</strong> | ⌨️ <strong>WASD</strong> for grid movement</p>
    <p>🎯 <strong>Enhanced Features:</strong> Real-time sync, OSRS validation, Performance monitoring</p>
  `;

  // Assemble Phaser wrapper
  phaserWrapper.appendChild(gameInfo);
  phaserWrapper.appendChild(statusContainer);
  phaserWrapper.appendChild(phaserContainer);
  phaserWrapper.appendChild(controlsInfo);
  container.appendChild(phaserWrapper);

  // Initialize the Phaser Game Client
  try {
    gameClient = new PhaserGameClient('phaser-game-container', 'connection-status');
    await gameClient.initialize();

    console.log('✅ Enhanced Phaser Game Client initialized successfully');
    updateGameInfoStatus(gameInfo, '🟢', 'Game ready! Click to play.');
  } catch (error) {
    console.error('❌ Failed to initialize Phaser Game Client:', error);
    updateGameInfoStatus(gameInfo, '🔴', 'Failed to connect to server');
  }
}

/**
 * Update the game info status display
 */
function updateGameInfoStatus(gameInfo: HTMLElement, indicator: string, message: string) {
  const statusIndicator = gameInfo.querySelector('.status-indicator');
  const statusText = gameInfo.querySelector('.status-text');

  if (statusIndicator) statusIndicator.textContent = indicator;
  if (statusText) statusText.textContent = message;
}

/**
 * Cleanup function for graceful shutdown
 */
function cleanup() {
  if (gameClient) {
    gameClient.destroy();
    gameClient = null;
  }

  if (discord) {
    // Discord SDK cleanup if needed
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

/**
 * Show error screen
 */
function showErrorScreen(message: string) {
  document.body.innerHTML = `
    <div class="error-screen">
      <div class="error-content">
        <h2>❌ RuneRogue Error</h2>
        <p>${message}</p>
        <button onclick="window.location.reload()" class="retry-button">
          Reload Application
        </button>
      </div>
    </div>
  `;
}
