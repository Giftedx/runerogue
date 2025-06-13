import Phaser from 'phaser';
import { Room, Client } from 'colyseus.js';
import { GameRoomState, PlayerSchema, EnemySchema } from '../../server/schemas/GameRoomState';

/**
 * Main multiplayer game scene using Phaser + Colyseus
 * Handles real-time player movement, combat, and visual feedback
 */
export class GameScene extends Phaser.Scene {
  private room!: Room<GameRoomState>;
  private client!: Client;
  private localPlayerId!: string;

  // Sprite management
  private playerSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private enemySprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private nameTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private healthBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  // UI pools for performance
  private damageNumberPool: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    // Get Colyseus connection from registry (set by React component)
    this.room = this.registry.get('colyseusRoom');
    this.client = this.registry.get('colyseusClient');
    this.localPlayerId = this.room?.sessionId;

    if (!this.room || !this.client) {
      console.error('Colyseus Room or Client not found in registry!');
      this.scene.pause();
      return;
    }

    console.log('GameScene initialized for player:', this.localPlayerId);
  }

  create() {
    console.log('GameScene created. Player ID:', this.localPlayerId);

    // Set up game world
    this.cameras.main.setBackgroundColor('#2d5a27'); // OSRS grass-like color
    this.cameras.main.setBounds(0, 0, 1600, 1200); // Larger world

    // Initialize systems
    this.initializeDamageTextPool(20);
    this.setupEventHandlers();
    this.setupInputHandlers();

    // Add some debug info
    this.add
      .text(10, 10, `Player: ${this.localPlayerId}`, {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 5, y: 2 },
      })
      .setScrollFactor(0); // Fixed to camera
  }

  /**
   * Set up Colyseus event handlers for real-time sync
   */
  private setupEventHandlers() {
    // Player events
    this.room.state.players.onAdd = (player, sessionId) => {
      console.log('Player joined:', sessionId);
      this.addPlayerSprite(player, sessionId);
    };

    this.room.state.players.onChange = (player, sessionId) => {
      this.updatePlayerSprite(player, sessionId);
    };

    this.room.state.players.onRemove = (player, sessionId) => {
      console.log('Player left:', sessionId);
      this.removePlayerSprite(sessionId);
    };

    // Enemy events
    this.room.state.enemies.onAdd = (enemy, enemyId) => {
      console.log('Enemy spawned:', enemyId);
      this.addEnemySprite(enemy, enemyId);
    };

    this.room.state.enemies.onChange = (enemy, enemyId) => {
      this.updateEnemySprite(enemy, enemyId);
    };

    this.room.state.enemies.onRemove = (enemy, enemyId) => {
      console.log('Enemy removed:', enemyId);
      this.removeEnemySprite(enemyId);
    };

    // Enhanced movement messages from server
    this.room.onMessage('move_confirmed', data => {
      console.log('Movement confirmed:', data);
      this.handleMovementConfirmed(data);
    });

    this.room.onMessage('position_correction', data => {
      console.log('Position correction:', data);
      this.handlePositionCorrection(data);
    });

    this.room.onMessage('player_position_update', data => {
      this.handlePlayerPositionUpdate(data);
    });

    // Visual feedback messages
    this.room.onMessage('healthBar', message => {
      if (message.events) {
        message.events.forEach((event: any) => {
          this.updateHealthBarFromEvent(event);
        });
      }
    });

    this.room.onMessage('damageNumbers', message => {
      if (message.events) {
        message.events.forEach((event: any) => {
          this.showDamageNumber(event);
        });
      }
    });
  }

  /**
   * Set up input handlers for movement and interaction
   */
  private setupInputHandlers() {
    // Click to move
    this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
      if (pointer.button === 0) {
        // Left click
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        this.sendMoveCommand(worldPoint.x, worldPoint.y);
        this.createClickIndicator(worldPoint.x, worldPoint.y, 0xffff00);
      }
    });

    // WASD movement (optional)
    const wasd = this.input.keyboard?.addKeys('W,S,A,D');
    if (wasd) {
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        this.handleKeyMovement(event.code);
      });
    }
  }

  /**
   * Send movement command to server
   */
  private sendMoveCommand(x: number, y: number) {
    this.room.send('move', { target: { x, y } });
  }

  /**
   * Handle WASD movement
   */
  private handleKeyMovement(keyCode: string) {
    const localPlayer = this.playerSprites.get(this.localPlayerId);
    if (!localPlayer) return;

    const step = 32; // Grid-based movement
    let newX = localPlayer.x;
    let newY = localPlayer.y;

    switch (keyCode) {
      case 'KeyW':
        newY -= step;
        break;
      case 'KeyS':
        newY += step;
        break;
      case 'KeyA':
        newX -= step;
        break;
      case 'KeyD':
        newX += step;
        break;
      default:
        return;
    }

    this.sendMoveCommand(newX, newY);
  }

  /**
   * Add player sprite to scene
   */
  private addPlayerSprite(player: PlayerSchema, sessionId: string) {
    const sprite = this.add.sprite(player.x || 0, player.y || 0, 'player_default');
    sprite.setDepth(10); // Players above enemies

    // Highlight local player
    if (sessionId === this.localPlayerId) {
      sprite.setTint(0x00ff00); // Green for local player
    } else {
      sprite.setTint(0x0099ff); // Blue for other players
    }

    this.playerSprites.set(sessionId, sprite);

    // Add name text
    const nameText = this.add
      .text(sprite.x, sprite.y - 35, player.name || sessionId.slice(0, 8), {
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    this.nameTexts.set(sessionId, nameText);

    // Add health bar
    this.createHealthBar(sprite, sessionId);

    // Camera follows local player
    if (sessionId === this.localPlayerId) {
      this.cameras.main.startFollow(sprite, true, 0.1, 0.1);
    }
  }

  /**
   * Update player sprite position and state
   */
  private updatePlayerSprite(player: PlayerSchema, sessionId: string) {
    const sprite = this.playerSprites.get(sessionId);
    const nameText = this.nameTexts.get(sessionId);

    if (sprite && nameText) {
      // Smooth movement for remote players, instant for local player
      if (sessionId === this.localPlayerId) {
        sprite.setPosition(player.x || 0, player.y || 0);
      } else {
        this.tweens.add({
          targets: sprite,
          x: player.x || 0,
          y: player.y || 0,
          duration: 100,
          ease: 'Linear',
        });
      }

      nameText.setPosition(sprite.x, sprite.y - 35);
      this.updateHealthBar(sessionId, player);
    }
  }

  /**
   * Remove player sprite from scene
   */
  private removePlayerSprite(sessionId: string) {
    this.playerSprites.get(sessionId)?.destroy();
    this.playerSprites.delete(sessionId);
    this.nameTexts.get(sessionId)?.destroy();
    this.nameTexts.delete(sessionId);
    this.healthBars.get(sessionId)?.destroy();
    this.healthBars.delete(sessionId);
  }

  /**
   * Add enemy sprite to scene
   */
  private addEnemySprite(enemy: EnemySchema, enemyId: string) {
    const spriteKey = enemy.type || 'enemy_default';
    const sprite = this.add.sprite(enemy.x || 0, enemy.y || 0, spriteKey);
    sprite.setDepth(5); // Enemies below players
    sprite.setTint(0xff6666); // Reddish tint

    this.enemySprites.set(enemyId, sprite);
    this.createHealthBar(sprite, enemyId);
  }

  /**
   * Update enemy sprite position and state
   */
  private updateEnemySprite(enemy: EnemySchema, enemyId: string) {
    const sprite = this.enemySprites.get(enemyId);
    if (sprite) {
      this.tweens.add({
        targets: sprite,
        x: enemy.x || 0,
        y: enemy.y || 0,
        duration: 200,
        ease: 'Linear',
      });

      this.updateHealthBar(enemyId, enemy);
    }
  }

  /**
   * Remove enemy sprite from scene
   */
  private removeEnemySprite(enemyId: string) {
    this.enemySprites.get(enemyId)?.destroy();
    this.enemySprites.delete(enemyId);
    this.healthBars.get(enemyId)?.destroy();
    this.healthBars.delete(enemyId);
  }

  /**
   * Create health bar for entity
   */
  private createHealthBar(sprite: Phaser.GameObjects.Sprite, entityId: string) {
    const healthBar = this.add.graphics();
    this.healthBars.set(entityId, healthBar);
    this.updateHealthBarPosition(healthBar, sprite);
  }

  /**
   * Update health bar for entity
   */
  private updateHealthBar(entityId: string, entity: any) {
    const healthBar = this.healthBars.get(entityId);
    const sprite = this.playerSprites.get(entityId) || this.enemySprites.get(entityId);

    if (healthBar && sprite && entity.health) {
      const percentage = entity.health.current / entity.health.max;
      this.drawHealthBar(healthBar, percentage);
      this.updateHealthBarPosition(healthBar, sprite);
    }
  }

  /**
   * Draw health bar with color coding
   */
  private drawHealthBar(graphics: Phaser.GameObjects.Graphics, percentage: number) {
    graphics.clear();

    const width = 32;
    const height = 4;

    // Background
    graphics.fillStyle(0x000000);
    graphics.fillRect(-width / 2, 0, width, height);

    // Health color based on percentage
    let color = 0x00ff00; // Green
    if (percentage < 0.5) color = 0xffff00; // Yellow
    if (percentage < 0.25) color = 0xff0000; // Red

    // Health fill
    graphics.fillStyle(color);
    graphics.fillRect(-width / 2, 0, width * percentage, height);
  }

  /**
   * Update health bar position relative to sprite
   */
  private updateHealthBarPosition(
    healthBar: Phaser.GameObjects.Graphics,
    sprite: Phaser.GameObjects.Sprite
  ) {
    healthBar.setPosition(sprite.x, sprite.y - 20);
  }

  /**
   * Initialize damage number pool for performance
   */
  private initializeDamageTextPool(poolSize: number) {
    for (let i = 0; i < poolSize; i++) {
      const text = this.add.text(0, 0, '', {
        fontSize: '16px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 2,
      });
      text.setVisible(false);
      this.damageNumberPool.push(text);
    }
  }

  /**
   * Show damage number with animation
   */
  private showDamageNumber(event: any) {
    const { entityId, damage, isCritical } = event;
    const sprite = this.playerSprites.get(entityId) || this.enemySprites.get(entityId);

    if (!sprite) return;

    // Get available damage text from pool
    const damageText = this.damageNumberPool.find(text => !text.visible);
    if (!damageText) return;

    // Configure damage text
    damageText.setText(damage.toString());
    damageText.setFontSize(isCritical ? 20 : 16);
    damageText.setColor(isCritical ? '#ff0000' : '#ffff00');
    damageText.setPosition(sprite.x + Phaser.Math.Between(-10, 10), sprite.y - 10);
    damageText.setVisible(true);

    // Animate damage number
    this.tweens.add({
      targets: damageText,
      y: damageText.y - 30,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        damageText.setVisible(false);
        damageText.setAlpha(1);
      },
    });
  }

  /**
   * Handle movement confirmation from server
   */
  private handleMovementConfirmed(data: any) {
    // Server has confirmed our movement - can be used for lag compensation
    console.log('Movement confirmed:', data);
  }

  /**
   * Handle position correction from server
   */
  private handlePositionCorrection(data: any) {
    // Server is correcting our position - anti-cheat response
    const localPlayer = this.playerSprites.get(this.localPlayerId);
    if (localPlayer) {
      localPlayer.setPosition(data.x, data.y);
      console.warn('Position corrected by server:', data);
    }
  }

  /**
   * Handle real-time position updates from other players
   */
  private handlePlayerPositionUpdate(data: any) {
    const { playerId, x, y } = data;
    if (playerId !== this.localPlayerId) {
      const sprite = this.playerSprites.get(playerId);
      if (sprite) {
        this.tweens.add({
          targets: sprite,
          x: x,
          y: y,
          duration: 50, // Very fast for real-time feel
          ease: 'Linear',
        });
      }
    }
  }

  /**
   * Update health bar from server event
   */
  private updateHealthBarFromEvent(event: any) {
    const { entityId, healthPercentage } = event;
    const healthBar = this.healthBars.get(entityId);

    if (healthBar) {
      this.drawHealthBar(healthBar, healthPercentage);
    }
  }

  /**
   * Create click indicator
   */
  private createClickIndicator(x: number, y: number, color: number) {
    const circle = this.add.circle(x, y, 8, color, 0.7);
    this.tweens.add({
      targets: circle,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => circle.destroy(),
    });
  }

  update(time: number, delta: number) {
    // Any per-frame updates can go here
    // Most updates are handled by Colyseus events for multiplayer sync
  }
}
