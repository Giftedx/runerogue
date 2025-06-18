/**
 * @file Manages the display of damage numbers (splats) when an entity takes damage.
 * @author Your Name/Alias
 */

import { defineQuery, IWorld } from "bitecs";
import { Health, Position } from "@/ecs/components";
import GameScene from "@/scenes/GameScene";

const healthQuery = defineQuery([Health, Position]);

// Store previous health values to detect changes
const lastHealth = new Map<number, number>();

/**
 * Creates a system that displays damage splats when an entity's health changes.
 * @param scene The Phaser scene to add the text objects to.
 * @returns A function that executes the damage splat logic.
 */
export const createDamageSplatSystem = (scene: GameScene) => {
  return (world: IWorld) => {
    const entities = healthQuery(world);

    for (const eid of entities) {
      const currentHealth = Health.current[eid];
      const previousHealth = lastHealth.get(eid) ?? currentHealth;

      if (currentHealth < previousHealth) {
        const damage = previousHealth - currentHealth;
        const x = Position.x[eid];
        const y = Position.y[eid];

        // Create a rising text object for the damage splat
        const splat = scene.add
          .text(x, y, damage.toString(), {
            fontFamily: "Arial",
            fontSize: "24px",
            color: "#ff0000", // Red for damage
            stroke: "#000000",
            strokeThickness: 4,
          })
          .setOrigin(0.5, 1);

        // Animate the splat
        scene.tweens.add({
          targets: splat,
          y: y - 50, // Move up
          alpha: 0, // Fade out
          duration: 1000,
          ease: "Cubic.easeOut",
          onComplete: () => {
            splat.destroy();
          },
        });
      }

      lastHealth.set(eid, currentHealth);
    }

    return world;
  };
};
