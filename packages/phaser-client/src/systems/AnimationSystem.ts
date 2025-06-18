/**
 * @file AnimationSystem.ts
 * @description A system to manage character animations based on game state.
 * @author Your Name
 */

import Phaser from "phaser";
import { IWorld } from "bitecs";
import { GameState } from "@runerogue/shared";
import { Velocity } from "@/ecs/components";

/**
 * @function createAnimationSystem
 * @description Creates a system that handles playing animations for entities based on their state.
 * @param {Phaser.Scene} scene - The Phaser scene.
 * @param {Map<number, Phaser.GameObjects.Sprite>} eidToSprite - A map from entity ID to the Phaser sprite.
 * @param {Map<string, number>} sessionIdToEid - A map from server session ID to client entity ID for players.
 * @param {Map<string, number>} enemyIdToEid - A map from server enemy ID to client entity ID for enemies.
 * @returns A function that can be used as a system in the game loop.
 */
export const createAnimationSystem = (
  scene: Phaser.Scene,
  eidToSprite: Map<number, Phaser.GameObjects.Sprite>,
  sessionIdToEid: Map<string, number>,
  enemyIdToEid: Map<string, number>
) => {
  return (world: IWorld, gameState: GameState) => {
    // Animate players
    gameState.players.forEach((player, sessionId) => {
      const eid = sessionIdToEid.get(sessionId);
      if (eid === undefined) return;

      const sprite = eidToSprite.get(eid);
      if (!sprite) return;

      const currentAnim = sprite.anims.currentAnim?.key;

      if (player.isDead) {
        if (currentAnim !== "player-death") {
          sprite.play("player-death", true);
        }
      } else if (player.inCombat) {
        if (currentAnim !== "player-attack") {
          sprite.play("player-attack", true);
        }
      } else {
        const vx = Velocity.x[eid] ?? 0;
        const vy = Velocity.y[eid] ?? 0;
        if (vx !== 0 || vy !== 0) {
          if (currentAnim !== "player-walk") {
            sprite.play("player-walk", true);
          }
        } else {
          if (currentAnim !== "player-idle") {
            sprite.play("player-idle", true);
          }
        }
      }
    });

    // Animate enemies
    gameState.enemies.forEach((enemy, enemyId) => {
      const eid = enemyIdToEid.get(enemyId);
      if (eid === undefined) return;

      const sprite = eidToSprite.get(eid);
      if (!sprite) return;

      const animPrefix = enemy.type; // e.g., 'goblin'
      const currentAnim = sprite.anims.currentAnim?.key;

      if (!enemy.alive) {
        if (currentAnim !== `${animPrefix}-death`) {
          sprite.play(`${animPrefix}-death`, true);
        }
      } else if (enemy.aiState === "ATTACKING") {
        if (currentAnim !== `${animPrefix}-attack`) {
          sprite.play(`${animPrefix}-attack`, true);
        }
      } else {
        const vx = Velocity.x[eid] ?? 0;
        const vy = Velocity.y[eid] ?? 0;
        if (vx !== 0 || vy !== 0) {
          if (currentAnim !== `${animPrefix}-walk`) {
            sprite.play(`${animPrefix}-walk`, true);
          }
        } else {
          if (currentAnim !== `${animPrefix}-idle`) {
            sprite.play(`${animPrefix}-idle`, true);
          }
        }
      }
    });

    return world;
  };
};
