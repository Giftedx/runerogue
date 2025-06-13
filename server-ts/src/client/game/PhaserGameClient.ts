import * as Phaser from 'phaser';
import { Client, Room } from 'colyseus.js';
import { CONFIG } from '../config';
import { PreloadScene } from '../scenes/PreloadScene';
import { GameScene } from '../scenes/GameScene';

/**
 * Enhanced Phaser Game Client (Pure TypeScript version)
 *
 * This manages the Phaser game instance and Colyseus connection
 * without React dependencies for easier integration.
 */
export class PhaserGameClient {
  private game: Phaser.Game | null = null;
  private client: Client | null = null;
  private room: Room | null = null;
  private gameContainer: HTMLElement;
  private statusContainer: HTMLElement;
  private isConnected: boolean = false;

  constructor(
    gameContainerId: string = 'phaser-game',
    statusContainerId: string = 'connection-status'
  ) {
    this.gameContainer = document.getElementById(gameContainerId) || document.body;
    this.statusContainer = document.getElementById(statusContainerId) || this.createStatusElement();
  }

  /**
   * Initialize the Phaser game and connection
   */
  async initialize(): Promise<void> {
    console.log('🎮 Initializing Enhanced Phaser Game Client...');

    try {
      // Create status UI
      this.createStatusUI();

      // Initialize Colyseus client
      await this.initializeClient();

      // Initialize Phaser game
      this.initializeGame();

      console.log('✅ Enhanced Phaser Game Client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize game client:', error);
      this.updateStatus('Failed to initialize game', 'error');
    }
  }

  /**
   * Initialize Colyseus client and connect to server
   */
  private async initializeClient(): Promise<void> {
    this.updateStatus('Connecting to server...', 'connecting');

    try {
      // Create Colyseus client
      this.client = new Client(CONFIG.SERVER_URL);

      // Connect to game room
      this.room = await this.client.joinOrCreate('runerogue', {
        playerName: 'Player_' + Math.floor(Math.random() * 1000),
      });

      this.isConnected = true;
      this.updateStatus('Connected to server', 'connected');

      // Set up room event listeners
      this.setupRoomListeners();

      console.log('✅ Connected to Colyseus room:', this.room.roomId);
    } catch (error) {
      console.error('❌ Failed to connect to server:', error);
      this.updateStatus('Connection failed', 'error');
      throw error;
    }
  }

  /**
   * Initialize Phaser game
   */
  private initializeGame(): void {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1024,
      height: 768,
      parent: this.gameContainer,
      backgroundColor: '#2c3e50',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [PreloadScene, GameScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    this.game = new Phaser.Game(config);

    // Pass the room connection to the game scene
    this.game.registry.set('room', this.room);
    this.game.registry.set('client', this.client);
  }

  /**
   * Set up Colyseus room event listeners
   */
  private setupRoomListeners(): void {
    if (!this.room) return;

    // Connection events
    this.room.onError((code, message) => {
      console.error('❌ Room error:', code, message);
      this.updateStatus(`Error: ${message}`, 'error');
    });

    this.room.onLeave(code => {
      console.log('👋 Left room with code:', code);
      this.isConnected = false;
      this.updateStatus('Disconnected', 'disconnected');
    });

    // State synchronization events
    this.room.onStateChange(state => {
      console.log('📊 Room state updated:', state);
    });

    // Custom message events
    this.room.onMessage('player_movement', data => {
      console.log('🚶 Player movement:', data);
    });

    this.room.onMessage('enemy_spawn', data => {
      console.log('👹 Enemy spawn:', data);
    });

    this.room.onMessage('enemy_movement', data => {
      console.log('👹 Enemy movement:', data);
    });

    this.room.onMessage('player_damage', data => {
      console.log('💥 Player damage:', data);
    });

    this.room.onMessage('enemy_damage', data => {
      console.log('💥 Enemy damage:', data);
    });
  }

  /**
   * Create status UI elements
   */
  private createStatusElement(): HTMLElement {
    const statusDiv = document.createElement('div');
    statusDiv.id = 'connection-status';
    statusDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      border-radius: 5px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 1000;
    `;
    document.body.appendChild(statusDiv);
    return statusDiv;
  }

  /**
   * Create full status UI
   */
  private createStatusUI(): void {
    // Connection status indicator
    this.statusContainer.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong>RuneRogue Enhanced Client</strong>
      </div>
      <div id="status-text">Initializing...</div>
      <div style="margin-top: 10px; font-size: 12px;">
        <div>Players: <span id="player-count">-</span></div>
        <div>Enemies: <span id="enemy-count">-</span></div>
        <div>FPS: <span id="fps-counter">-</span></div>
      </div>
    `;

    // Start FPS counter
    this.startFPSCounter();
  }

  /**
   * Update connection status
   */
  private updateStatus(
    message: string,
    type: 'connecting' | 'connected' | 'error' | 'disconnected'
  ): void {
    const statusText = document.getElementById('status-text');
    if (statusText) {
      statusText.textContent = message;

      // Update color based on status type
      const colors = {
        connecting: '#ffa500',
        connected: '#00ff00',
        error: '#ff0000',
        disconnected: '#888888',
      };

      statusText.style.color = colors[type];
    }
  }

  /**
   * Start FPS counter
   */
  private startFPSCounter(): void {
    let lastTime = performance.now();
    let frames = 0;

    const updateFPS = () => {
      frames++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        const fpsElement = document.getElementById('fps-counter');
        if (fpsElement) {
          fpsElement.textContent = fps.toString();
        }
        frames = 0;
        lastTime = now;
      }
      requestAnimationFrame(updateFPS);
    };

    updateFPS();
  }

  /**
   * Send message to server
   */
  sendMessage(type: string, data: any): void {
    if (this.room && this.isConnected) {
      this.room.send(type, data);
    } else {
      console.warn('Cannot send message: not connected to room');
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): { connected: boolean; room?: Room; client?: Client } {
    return {
      connected: this.isConnected,
      room: this.room || undefined,
      client: this.client || undefined,
    };
  }

  /**
   * Cleanup and destroy game instance
   */
  destroy(): void {
    console.log('🧹 Cleaning up Phaser Game Client...');

    if (this.room) {
      this.room.leave();
      this.room = null;
    }

    if (this.client) {
      // Note: Colyseus client doesn't have a destroy method, just disconnect
      this.client = null;
    }

    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }

    this.isConnected = false;
    console.log('✅ Phaser Game Client cleaned up');
  }
}
