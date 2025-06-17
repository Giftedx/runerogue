import Phaser from "phaser";
import type { GameClient } from "../GameClient";
import type {
  GameRoomState,
  PlayerSchema,
  EnemySchema,
} from "@runerogue/shared";

/**
 * Main game scene that renders the game world and handles player/enemy entities.
 */
export class GameScene extends Phaser.Scene {
  private players: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private enemies: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private damageTextPool: Phaser.GameObjects.Text[] = [];
  private activeDamageTexts: Set<Phaser.GameObjects.Text> = new Set();
  // TODO: Add enemies map and other game objects
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveTarget: { x: number; y: number } | null = null;
  private gameClient: GameClient | null = null;
  private localPlayerId: string | null = null;
  private predictionBuffer: { tick: number; x: number; y: number }[] = [];
  private lastServerTick: number = 0;

  constructor() {
    super({ key: "GameScene" });
  }

  /**
   * Set the GameClient instance for sending movement commands
   */
  /**
   * Set the GameClient instance for sending movement commands
   * @param gameClient - The GameClient instance
   */
  setGameClient(gameClient: GameClient): void {
    this.gameClient = gameClient;
    if (gameClient && typeof gameClient.getLocalPlayerId === "function") {
      this.localPlayerId = gameClient.getLocalPlayerId();
    }
    // Subscribe to combat events
    if (gameClient && gameClient.events) {
      gameClient.events.on("damage", (msg: ServerMessage) => {
        if (msg.type === "damage") {
          this.showDamageNumber(msg.targetId, msg.damage, msg.hitType);
        }
      });
    }
  }

  /**
   * Show animated damage number at the target entity's position
   * @param targetId - Entity ID (player or enemy)
   * @param damage - Amount of damage
   * @param hitType - Type of hit ("hit", "max", "miss")
   */
  private showDamageNumber(
    targetId: string,
    damage: number,
    hitType: "hit" | "max" | "miss"
  ): void {
    // Look up in players first, then enemies
    let sprite = this.players.get(targetId);
    if (!sprite) sprite = this.enemies.get(targetId);
    if (!sprite) return;
    let textObj: Phaser.GameObjects.Text | undefined =
      this.damageTextPool.pop();
    if (!textObj) {
      textObj = this.add.text(0, 0, "", {
        font: "20px Arial",
        color: "#fff",
        stroke: "#000",
        strokeThickness: 3,
      });
      textObj.setDepth(10);
    }
    textObj.setText(hitType === "miss" ? "0" : damage.toString());
    textObj.setPosition(sprite.x, sprite.y - 32);
    textObj.setAlpha(1);
    textObj.setColor(
      hitType === "max" ? "#ff0"
      : hitType === "miss" ? "#aaa"
      : "#f00"
    );
    textObj.setVisible(true);
    this.activeDamageTexts.add(textObj);
    // Animate upward and fade out
    this.tweens.add({
      targets: textObj,
      y: sprite.y - 64,
      alpha: 0,
      duration: 700,
      ease: "Cubic.easeOut",
      onComplete: () => {
        textObj?.setVisible(false);
        this.activeDamageTexts.delete(textObj!);
        this.damageTextPool.push(textObj!);
      },
    });
  }

  /**
   * Update game objects based on server state
   * Implements smooth interpolation between server updates
   * @param state - Latest server state from Colyseus
   */
  /**
   * Update game objects based on server state
   * Implements smooth interpolation between server updates
   * @param state - Latest server state from Colyseus
   */
  updateFromServerState(state: GameRoomState): void {
    // Interpolate and update player positions
    state.players.forEach((serverPlayer: PlayerState, playerId: string) => {
      const playerSprite = this.players.get(playerId);
      if (!playerSprite) return;
      try {
        if (playerId === this.localPlayerId) {
          // Local player: interpolate from predicted to server position
          const bufferIdx = this.predictionBuffer.findIndex(
            (p) =>
              Math.abs(p.x - serverPlayer.position.x) < 1 &&
              Math.abs(p.y - serverPlayer.position.y) < 1
          );
          if (bufferIdx >= 0) {
            this.predictionBuffer.splice(0, bufferIdx + 1);
          }
          // Lerp toward server position for smooth correction
          playerSprite.x += (serverPlayer.position.x - playerSprite.x) * 0.5;
          playerSprite.y += (serverPlayer.position.y - playerSprite.y) * 0.5;
        } else {
          // Remote players: interpolate
          playerSprite.x += (serverPlayer.position.x - playerSprite.x) * 0.5;
          playerSprite.y += (serverPlayer.position.y - playerSprite.y) * 0.5;
        }
        // TODO: Update health/prayer bars
      } catch (err) {
        // Log and continue
        // eslint-disable-next-line no-console
        console.error(`Error updating player ${playerId}:`, err);
      }
    });
    // Interpolate and update enemy positions
    if (state.enemies && typeof state.enemies.forEach === "function") {
      state.enemies.forEach((enemy, enemyId: string) => {
        const enemySprite = this.enemies.get(enemyId);
        if (!enemySprite) return;
        try {
          enemySprite.x += (enemy.position.x - enemySprite.x) * 0.5;
          enemySprite.y += (enemy.position.y - enemySprite.y) * 0.5;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`Error updating enemy ${enemyId}:`, err);
        }
      });
    }
  }

  /**
   * Create a new player entity in the game world
   */
  /**
   * Create a new player entity in the game world
   * @param player - Player state object
   * @param key - Player ID
   */
  createPlayerEntity(player: PlayerState, key: string): void {
    if (!this.players.has(key)) {
      const sprite = this.add.sprite(
        player.position.x,
        player.position.y,
        "player"
      );
      this.players.set(key, sprite);
    }
  }

  /**
   * Create a new enemy entity in the game world
   * @param enemy - Enemy state object
   * @param key - Enemy ID
   */
  createEnemyEntity(enemy: any, key: string): void {
    if (!this.enemies.has(key)) {
      const sprite = this.add.sprite(
        enemy.position.x,
        enemy.position.y,
        "enemy"
      );
      this.enemies.set(key, sprite);
    }
  }

  /**
   * Phaser update loop - handle input and send movement commands
   */
  /**
   * Phaser update loop - handle input and send movement commands
   * Handles both click-to-move and WASD/arrow movement for dev/debug
   */
  update(): void {
    if (!this.cursors) {
      this.cursors = this.input.keyboard.createCursorKeys();
      // Add click-to-move support for OSRS authenticity
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (!this.gameClient) return;
        try {
          const worldPoint = pointer.positionToCamera(
            this.cameras.main
          ) as Phaser.Math.Vector2;
          this.moveTarget = { x: worldPoint.x, y: worldPoint.y };
          this.gameClient.sendMoveCommand(this.moveTarget);
          // Predict local player movement immediately
          if (this.localPlayerId) {
            const playerSprite = this.players.get(this.localPlayerId);
            if (playerSprite) {
              this.predictionBuffer.push({
                tick: Date.now(),
                x: this.moveTarget.x,
                y: this.moveTarget.y,
              });
              playerSprite.x = this.moveTarget.x;
              playerSprite.y = this.moveTarget.y;
            }
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Error in click-to-move:", err);
        }
      });
    }
    if (!this.gameClient) return;
    // Optionally, update active damage texts if needed

    // Optional: Keep WASD/arrow movement for dev/debug
    let dx = 0,
      dy = 0;
    if (this.cursors.left.isDown) dx -= 1;
    if (this.cursors.right.isDown) dx += 1;
    if (this.cursors.up.isDown) dy -= 1;
    if (this.cursors.down.isDown) dy += 1;

    if (dx !== 0 || dy !== 0) {
      if (this.localPlayerId) {
        const playerSprite = this.players.get(this.localPlayerId);
        if (playerSprite) {
          const target = {
            x: playerSprite.x + dx * 32,
            y: playerSprite.y + dy * 32,
          };
          if (
            !this.moveTarget ||
            this.moveTarget.x !== target.x ||
            this.moveTarget.y !== target.y
          ) {
            this.moveTarget = target;
            this.gameClient.sendMoveCommand(target);
            // Predict local player movement immediately
            this.predictionBuffer.push({
              tick: Date.now(),
              x: target.x,
              y: target.y,
            });
            playerSprite.x = target.x;
            playerSprite.y = target.y;
          }
        }
      }
    }
  }

  /**
   * Remove a player entity from the game world
   */
  /**
   * Remove a player entity from the game world
   * @param key - Player ID
   */
  removePlayerEntity(key: string): void {
    const sprite = this.players.get(key);
    if (sprite) {
      sprite.destroy();
      this.players.delete(key);
    }
  }

  /**
   * Remove an enemy entity from the game world
   * @param key - Enemy ID
   */
  removeEnemyEntity(key: string): void {
    const sprite = this.enemies.get(key);
    if (sprite) {
      sprite.destroy();
      this.enemies.delete(key);
    }
  }
}
