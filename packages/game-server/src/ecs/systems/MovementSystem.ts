/**
 * @file MovementSystem.ts
 * @description A system that handles the movement of entities with Position and Velocity components.
 * @author RuneRogue Development Team
 */

import { defineQuery, defineSystem, type IWorld } from "bitecs";
import { Position, Velocity } from "../components";

/**
 * @function createMovementSystem
 * @description A system that updates entity positions based on their velocity.
 * @returns A BiteCS system.
 */
export const createMovementSystem = () => {
  const query = defineQuery([Position, Velocity]);

  return defineSystem((world: IWorld) => {
    const entities = query(world);
    // In a real game, you'd use the delta time provided by the game loop
    // for frame-rate independent movement.
    // const speedFactor = delta / 1000;

    for (const eid of entities) {
      Position.x[eid] += Velocity.x[eid];
      Position.y[eid] += Velocity.y[eid];
    }

    return world;
  });
};
