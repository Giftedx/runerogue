/**
 * @file Manages the display of floating health bars above entities.
 * @author Your Name/Alias
 */

import { defineQuery, IWorld } from "bitecs";
import { Health, Position } from "@/ecs/components";
import GameScene from "@/scenes/GameScene";

const healthQuery = defineQuery([Health, Position]);

const healthBars = new Map<number, Phaser.GameObjects.Graphics>();
const BAR_WIDTH = 40;
const BAR_HEIGHT = 5;
const Y_OFFSET = -30; // Position above the sprite

/**
 * Creates a system that renders health bars above entities.
 * @param scene The Phaser scene to add the graphics objects to.
 * @returns A function that executes the health bar logic.
 */
export const createHealthBarSystem = (scene: GameScene) => {
  const entitiesWithHealthBars = new Set<number>();

  return (world: IWorld) => {
    const entities = healthQuery(world);
    const currentEntities = new Set(entities);

    // Update existing health bars
    for (const eid of entities) {
      if (!healthBars.has(eid)) {
        const bar = scene.add.graphics();
        healthBars.set(eid, bar);
      }

      const bar = healthBars.get(eid)!;
      const sprite = scene.getSpriteMap().get(eid);

      if (!sprite) {
        bar.clear();
        continue;
      }

      const x = sprite.x - BAR_WIDTH / 2;
      const y = sprite.y + Y_OFFSET;

      const healthPercentage = Health.current[eid] / Health.max[eid];

      bar.clear();
      // Background
      bar.fillStyle(0x000000, 0.5);
      bar.fillRect(x, y, BAR_WIDTH, BAR_HEIGHT);

      // Foreground
      bar.fillStyle(
        healthPercentage > 0.5
          ? 0x00ff00
          : healthPercentage > 0.2
            ? 0xffff00
            : 0xff0000,
      );
      bar.fillRect(x, y, BAR_WIDTH * healthPercentage, BAR_HEIGHT);

      entitiesWithHealthBars.add(eid);
    }

    // Remove health bars for entities that no longer exist
    for (const eid of entitiesWithHealthBars) {
      if (!currentEntities.has(eid)) {
        healthBars.get(eid)?.destroy();
        healthBars.delete(eid);
        entitiesWithHealthBars.delete(eid);
      }
    }

    return world;
  };
};
