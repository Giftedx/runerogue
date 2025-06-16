import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";
import type { GameClient } from "./GameClient";
import type { GameRoomState, PlayerSchema, EnemySchema } from "@runerogue/shared";

/**
 * Phaser 3 game engine configuration for RuneRogue.
 * Handles rendering, input, and client-side game logic.
 */
export class PhaserGame extends Phaser.Game {
  constructor() {
    super({
      type: Phaser.AUTO,
      width: 1024,
      height: 768,
      parent: "game-container",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: [BootScene, GameScene, UIScene],
    });
  }

  /**
   * Set the GameClient instance on the GameScene for input handling
   */
  setGameClient(gameClient: GameClient): void {
    const gameScene = this.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.setGameClient(gameClient);
    }
  }

  /**
   * Update game objects based on server state
   * @param state - Latest server state from Colyseus
   */
  updateFromServerState(state: GameRoomState): void {
    // TODO: Implement interpolation and update logic
    const gameScene = this.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.updateFromServerState(state);
    }
  }

  /**
   * Create a new player entity in the game world
   */
  createPlayerEntity(player: PlayerSchema, key: string): void {
    const gameScene = this.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.createPlayerEntity(player, key);
    }
  }

  /**
   * Create a new enemy entity in the game world
   */
  createEnemyEntity(enemy: EnemySchema, key: string): void {
    const gameScene = this.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.createEnemyEntity(enemy, key);
    }
  }

  /**
   * Remove an enemy entity from the game world
   */
  removeEnemyEntity(key: string): void {
    const gameScene = this.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.removeEnemyEntity(key);
    }
  }

  /**
   * Remove a player entity from the game world
   */
  removePlayerEntity(key: string): void {
    const gameScene = this.scene.getScene("GameScene") as GameScene;
    if (gameScene) {
      gameScene.removePlayerEntity(key);
    }
  }
}
