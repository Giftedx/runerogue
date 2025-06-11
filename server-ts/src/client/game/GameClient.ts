import { Client, Room } from 'colyseus.js';
import { GameState } from './GameState';
import { GameRenderer } from './GameRenderer';
import { InputManager } from './InputManager';
import { UIManager } from './UIManager';
import { AudioManager } from './AudioManager';
import { CONFIG } from '../config';

export class GameClient {
  private client: Client;
  private room: Room | null = null;
  private gameState: GameState;
  private renderer: GameRenderer;
  private inputManager: InputManager;
  private uiManager: UIManager;
  private audioManager: AudioManager;
  private user: any; // Discord user info
  private lastUpdateTime: number = 0;
  private isRunning: boolean = false;

  constructor(
    serverUrl: string,
    gameState: GameState,
    renderer: GameRenderer,
    inputManager: InputManager,
    uiManager: UIManager,
    audioManager: AudioManager,
    user: any
  ) {
    this.client = new Client(serverUrl);
    this.gameState = gameState;
    this.renderer = renderer;
    this.inputManager = inputManager;
    this.uiManager = uiManager;
    this.audioManager = audioManager;
    this.user = user;

    // Set up input handlers
    this.inputManager.onMove = this.handleMove.bind(this);
    this.inputManager.onAttack = this.handleAttack.bind(this);
    this.inputManager.onCollectLoot = this.handleCollectLoot.bind(this);
    this.inputManager.onUseItem = this.handleUseItem.bind(this);
    this.inputManager.onEquipItem = this.handleEquipItem.bind(this);
  }

  async start(): Promise<void> {
    try {
      console.log('Connecting to game server...');

      // Connect to the Colyseus server
      this.room = await this.client.joinOrCreate('game_room', {
        username: this.user.username,
        avatarUrl: this.user.avatar,
        discordId: this.user.id,
      });

      console.log('Connected to room:', this.room.id);

      // Set up room message handlers
      this.setupRoomHandlers();

      // Start the game loop
      this.isRunning = true;
      this.gameLoop();

      // Update UI with initial state
      this.uiManager.updatePlayerInfo(this.gameState.player);
      this.uiManager.showGameUI();

      // Play background music
      this.audioManager.playMusic('main');
    } catch (error) {
      console.error('Failed to join room:', error);
      this.uiManager.showError('Failed to connect to game server');
    }
  }

  private setupRoomHandlers(): void {
    if (!this.room) return;

    // Handle state changes
    this.room.onStateChange(state => {
      this.gameState.updateFromServer(state);
      this.uiManager.updatePlayerInfo(this.gameState.player);
    });

    // Handle player join events
    this.room.state.players.onAdd((player, sessionId) => {
      console.log('Player joined:', sessionId);
      this.gameState.addPlayer(sessionId, player);

      // Play sound effect for new player
      if (sessionId !== this.room?.sessionId) {
        this.audioManager.playSfx('playerJoin');
      }
    });

    // Handle player leave events
    this.room.state.players.onRemove((player, sessionId) => {
      console.log('Player left:', sessionId);
      this.gameState.removePlayer(sessionId);
    });

    // Handle NPC updates
    this.room.state.npcs.onAdd((npc, id) => {
      this.gameState.addNPC(id, npc);
    });

    this.room.state.npcs.onRemove((npc, id) => {
      this.gameState.removeNPC(id);
    });

    // Handle loot drops
    this.room.state.lootDrops.onAdd((loot, id) => {
      this.gameState.addLootDrop(id, loot);
    });

    this.room.state.lootDrops.onRemove((loot, id) => {
      this.gameState.removeLootDrop(id);
    });

    // Handle custom messages from server
    this.room.onMessage('combat_result', message => {
      console.log('Combat result:', message);

      // Show combat feedback in UI
      this.uiManager.showCombatResult(message);

      // Play appropriate sound effect
      if (message.hit) {
        this.audioManager.playSfx('hit');
      } else {
        this.audioManager.playSfx('miss');
      }

      // Show damage numbers
      if (message.damage > 0) {
        this.renderer.showDamageNumber(message.targetId, message.damage);
      }
    });

    this.room.onMessage('skill_increase', message => {
      console.log('Skill increase:', message);
      this.uiManager.showSkillIncrease(message.skill, message.level, message.xp);
      this.audioManager.playSfx('levelUp');
    });

    this.room.onMessage('item_collected', message => {
      console.log('Item collected:', message);
      this.uiManager.showItemCollected(message.item);
      this.audioManager.playSfx('collect');
    });

    // Handle health bar updates from ECS systems
    this.room.onMessage('healthBar', message => {
      console.log('Health bar updates:', message);
      // The renderer can handle health bar updates directly
      if (message.events) {
        for (const event of message.events) {
          this.renderer.updateHealthBar(event.entityId, event);
        }
      }
    });

    // Handle damage number events from ECS systems
    this.room.onMessage('damageNumbers', message => {
      console.log('Damage numbers:', message);
      // Enhanced damage number display with type support
      if (message.events) {
        for (const event of message.events) {
          this.renderer.showEnhancedDamageNumber(event);
        }
      }
    });

    // Handle XP gain events from ECS systems
    this.room.onMessage('xpGains', message => {
      console.log('XP gains:', message);
      if (message.events) {
        this.renderer.showXPNotifications(message.events);
      }
    });

    // Handle disconnection
    this.room.onLeave(code => {
      console.log('Left room:', code);
      this.isRunning = false;
      this.uiManager.showDisconnected();
    });

    // Handle errors
    this.room.onError((code, message) => {
      console.error('Room error:', code, message);
      this.uiManager.showError(`Error: ${message}`);
    });
  }

  private gameLoop(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // Convert to seconds
    this.lastUpdateTime = currentTime;

    // Update game state
    this.gameState.update(deltaTime);

    // Render the game
    this.renderer.render(this.gameState, deltaTime);

    // Request next frame
    requestAnimationFrame(() => this.gameLoop());
  }

  // Update game client (called from main game loop)
  public update(deltaTime: number): void {
    if (!this.isRunning) return;

    // Update renderer with current game state
    if (this.renderer && this.gameState) {
      this.renderer.render(this.gameState, deltaTime);
    }

    // Handle any pending input
    this.inputManager.update();
  }

  // Input handlers
  private handleMove(x: number, y: number): void {
    if (!this.room) return;

    this.room.send('player_movement', { x, y });
    // Client-side prediction
    this.gameState.moveLocalPlayer(x, y);
  }

  private handleAttack(targetId: string): void {
    if (!this.room) return;

    this.room.send('player_action', {
      type: 'attack',
      targetId,
    });

    // Play attack animation and sound
    this.gameState.setPlayerAnimation('attack');
    this.audioManager.playSfx('attack');
  }

  private handleCollectLoot(lootId: string): void {
    if (!this.room) return;

    this.room.send('collect_loot', { lootId });
  }

  private handleUseItem(itemIndex: number): void {
    if (!this.room) return;

    this.room.send('use_item', { itemIndex });
  }

  private handleEquipItem(itemIndex: number, slot: string): void {
    if (!this.room) return;

    this.room.send('equip_item', { itemIndex, slot });
  }

  // Send movement command to server
  public sendMoveCommand(direction: string): void {
    if (!this.room) return;
    this.room.send('move', { direction });
  }

  // Send attack command to server
  public sendAttackCommand(targetId: string): void {
    if (!this.room) return;
    this.room.send('attack', { targetId });
  }

  // Send collect command to server
  public sendCollectCommand(itemId: string): void {
    if (!this.room) return;
    this.room.send('collect', { itemId });
  }

  // Send use item command to server
  public sendUseItemCommand(itemId: string): void {
    if (!this.room) return;
    this.room.send('use_item', { itemId });
  }

  // Connect method (alias for start for compatibility)
  public async connect(): Promise<void> {
    return this.start();
  }

  // Clean up resources when game is stopped
  public stop(): void {
    this.isRunning = false;
    if (this.room) {
      this.room.leave();
    }
    this.audioManager.stopAll();
  }
}
