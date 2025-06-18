/**
 * @file Defines the rendering system for updating sprite positions based on ECS data.
 */
import { defineQuery, IWorld } from "bitecs";
import { Position, Player, Enemy } from "../components";
import GameScene from "@/scenes/GameScene";

/**
 * Creates a rendering system.
 * This system is responsible for updating the visual representation (Phaser sprites)
 * of entities based on their current state in the ECS world.
 * @param {GameScene} scene - The Phaser scene, used for accessing tweens and the sprite map.
 * @returns {(world: IWorld) => IWorld} A bitECS system function.
 */
export const createRenderingSystem = (scene: GameScene) => {
  const playerQuery = defineQuery([Position, Player]);
  const enemyQuery = defineQuery([Position, Enemy]);

  return (world: IWorld) => {
    const spriteMap = scene.getSpriteMap();

    // Render players
    const playerEntities = playerQuery(world);
    for (let i = 0; i < playerEntities.length; ++i) {
      const eid = playerEntities[i];
      const sprite = spriteMap.get(eid);
      if (sprite) {
        const targetX = Position.x[eid];
        const targetY = Position.y[eid];

        if (
          Math.abs(sprite.x - targetX) > 0.1 ||
          Math.abs(sprite.y - targetY) > 0.1
        ) {
          scene.tweens.add({
            targets: sprite,
            x: targetX,
            y: targetY,
            duration: 100,
            ease: "Linear",
          });
        }
      }
    }

    // Render enemies
    const enemyEntities = enemyQuery(world);
    for (let i = 0; i < enemyEntities.length; ++i) {
      const eid = enemyEntities[i];
      const sprite = spriteMap.get(eid);
      if (sprite) {
        const targetX = Position.x[eid];
        const targetY = Position.y[eid];

        if (
          Math.abs(sprite.x - targetX) > 0.1 ||
          Math.abs(sprite.y - targetY) > 0.1
        ) {
          scene.tweens.add({
            targets: sprite,
            x: targetX,
            y: targetY,
            duration: 100,
            ease: "Linear",
          });
        }
      }
    }

    return world;
  };
};
