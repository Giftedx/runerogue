/**
 * @file PlayerSprite.ts
 * @description Defines the visual representation of a player in the Phaser scene.
 * @author Your Name
 */

import * as Phaser from "phaser";
import type { Player } from "@/types";

/**
 * @class PlayerSprite
 * @extends Phaser.GameObjects.Graphics
 * @description A simple graphical representation of a player.
 * For now, it's a white circle. This will be replaced with actual character sprites.
 */
export class PlayerSprite extends Phaser.GameObjects.Graphics {
  /**
   * Creates an instance of PlayerSprite.
   * @param {Phaser.Scene} scene - The scene to add the sprite to.
   * @param {Player} player - The player data from the server.
   */
  constructor(scene: Phaser.Scene, player: Player) {
    super(scene);

    this.x = player.x;
    this.y = player.y;

    // A simple circle as a placeholder
    this.fillStyle(0xffffff, 1);
    this.fillCircle(0, 0, 16);

    // Add this sprite to the scene
    scene.add.existing(this);
  }
}
