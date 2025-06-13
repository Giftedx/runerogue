import { DiscordSDK } from '@discord/embedded-app-sdk';
import { Client, Room } from 'colyseus.js';
import { CONFIG } from './config';

/**
 * Simple Enhanced RuneRogue Client
 *
 * This is a minimal working version of the enhanced client that:
 * 1. Connects to Discord
 * 2. Connects to the Colyseus server
 * 3. Shows basic connection status
 * 4. Can be enhanced step by step
 */

interface DiscordUser {
  username: string;
  id: string;
  avatar?: string;
}

let discord: DiscordSDK;
let user: DiscordUser;
let client: Client | null = null;
let room: Room | null = null;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 RuneRogue Simple Enhanced Client starting...');

  try {
    // Initialize Discord SDK
    await initializeDiscord();

    // Show main interface
    showMainInterface();

    // Connect to game server
    await connectToGameServer();
  } catch (error) {
    console.error('❌ Failed to initialize client:', error);
    showErrorScreen(`Failed to initialize: ${error}`);
  }
});

/**
 * Initialize Discord SDK
 */
async function initializeDiscord(): Promise<void> {
  updateStatus('Initializing Discord...');

  discord = new DiscordSDK(CONFIG.DISCORD_CLIENT_ID);
  await discord.ready();

  // Mock user for now (Discord auth issues)
  user = {
    username: 'Player_' + Math.floor(Math.random() * 1000),
    id: 'mock_' + Date.now(),
  };

  console.log('✅ Discord initialized for user:', user.username);
}

/**
 * Connect to the game server
 */
async function connectToGameServer(): Promise<void> {
  updateStatus('Connecting to game server...');

  try {
    // Create Colyseus client
    client = new Client(CONFIG.SERVER_URL);

    // Connect to game room
    room = await client.joinOrCreate('runerogue', {
      playerName: user.username,
    });

    // Set up room event listeners
    setupRoomListeners();

    updateStatus('Connected! Ready to play.');
    updatePlayerCount(1); // We'll get the real count from the server

    console.log('✅ Connected to game room:', room.roomId);
  } catch (error) {
    console.error('❌ Failed to connect to server:', error);
    updateStatus('Connection failed. Retrying...');

    // Retry connection after 3 seconds
    setTimeout(() => {
      connectToGameServer();
    }, 3000);
  }
}

/**
 * Set up Colyseus room event listeners
 */
function setupRoomListeners(): void {
  if (!room) return;

  // State changes
  room.onStateChange(state => {
    console.log('📊 Room state updated');

    // Update player count if available
    if (state.players) {
      updatePlayerCount(Object.keys(state.players).length);
    }
  });

  // Custom messages
  room.onMessage('player_movement', data => {
    console.log('🚶 Player movement:', data);
  });

  room.onMessage('enemy_spawn', data => {
    console.log('👹 Enemy spawn:', data);
  });

  // Connection events
  room.onError((code, message) => {
    console.error('❌ Room error:', code, message);
    updateStatus(`Error: ${message}`);
  });

  room.onLeave(code => {
    console.log('👋 Left room with code:', code);
    updateStatus('Disconnected');
  });
}

/**
 * Show the main game interface
 */
function showMainInterface(): void {
  document.body.innerHTML = `
    <div class="simple-client">
      <div class="header">
        <h1>🛡️ RuneRogue Enhanced</h1>
        <div class="status-info">
          <div class="status">Status: <span id="status">Initializing...</span></div>
          <div class="player-info">Player: <span id="player-name">${user.username}</span></div>
          <div class="player-count">Players: <span id="player-count">-</span></div>
        </div>
      </div>
      
      <div class="game-area">
        <div class="info-panel">
          <h3>🎯 Phase 1 Enhancements Active</h3>
          <ul>
            <li>✅ 20 TPS Enhanced GameRoom</li>
            <li>✅ OSRS Movement Validation</li>
            <li>✅ Performance Monitoring</li>
            <li>✅ Robust Connection Management</li>
            <li>✅ Real-time Multiplayer Sync</li>
          </ul>
          
          <div class="server-info">
            <p><strong>Server:</strong> ${CONFIG.SERVER_URL}</p>
            <p><strong>Protocol:</strong> Colyseus WebSocket</p>
            <p><strong>Room Type:</strong> Enhanced GameRoom</p>
          </div>
        </div>
        
        <div class="game-canvas">
          <div class="placeholder-game">
            <h2>🎮 Game Canvas Ready</h2>
            <p>Phase 2 Phaser integration will be added here</p>
            <div class="game-controls">
              <button onclick="sendTestMessage()">🧪 Send Test Message</button>
              <button onclick="requestPlayerMove()">🚶 Test Movement</button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="footer">
        <p>RuneRogue Enhanced Client v2.0 | Phase 1 Complete</p>
      </div>
    </div>
  `;
}

/**
 * Update status display
 */
function updateStatus(message: string): void {
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

/**
 * Update player count display
 */
function updatePlayerCount(count: number): void {
  const countElement = document.getElementById('player-count');
  if (countElement) {
    countElement.textContent = count.toString();
  }
}

/**
 * Send test message to server
 */
function sendTestMessage(): void {
  if (room) {
    room.send('test_message', {
      message: 'Hello from enhanced client!',
      timestamp: Date.now(),
    });
    console.log('📤 Sent test message');
  }
}

/**
 * Request player movement test
 */
function requestPlayerMove(): void {
  if (room) {
    const x = Math.floor(Math.random() * 400) + 100;
    const y = Math.floor(Math.random() * 300) + 100;

    room.send('player_movement', { x, y });
    console.log('🚶 Requested movement to:', { x, y });
  }
}

/**
 * Show error screen
 */
function showErrorScreen(message: string): void {
  document.body.innerHTML = `
    <div class="error-screen">
      <div class="error-content">
        <h2>❌ RuneRogue Error</h2>
        <p>${message}</p>
        <button onclick="window.location.reload()">🔄 Reload</button>
      </div>
    </div>
  `;
}

// Make functions available globally for button clicks
(window as any).sendTestMessage = sendTestMessage;
(window as any).requestPlayerMove = requestPlayerMove;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (room) {
    room.leave();
  }
});
