/**
 * @file Defines the movement system for updating entity positions based on their velocity.
 */
import { defineQuery, defineSystem } from "bitecs";
import { Position, Velocity } from "../components";

/**
 * Creates a movement system.
 * This system updates the position of all entities that have both a Position and Velocity component.
 * @param {Phaser.Scene} scene - The Phaser scene, used for accessing delta time.
 * @returns {System} A bitECS system function.
 */
export const createMovementSystem = (scene: Phaser.Scene) => {
  const query = defineQuery([Position, Velocity]);

  return defineSystem((world) => {
    const entities = query(world);
    const dt = scene.game.loop.delta / 1000; // Delta time in seconds

    for (let i = 0; i < entities.length; ++i) {
      const eid = entities[i];
      Position.x[eid] += Velocity.x[eid] * dt;
      Position.y[eid] += Velocity.y[eid] * dt;
    }

    return world;
  });
};
