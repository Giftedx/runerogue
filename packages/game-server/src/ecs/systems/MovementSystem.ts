/**
 * @file MovementSystem.ts
 * @description A system that handles the movement of entities with Position and Velocity components.
 * @author RuneRogue Development Team
 */

import { defineQuery } from "bitecs";
import { System } from "@colyseus/ecs";
import type { GameRoomState } from "@runerogue/shared";
import { Position, Velocity } from "../components";

/**
 * The MovementSystem is responsible for updating the position of entities
 * based on their velocity.
 */
export class MovementSystem extends System<GameRoomState> {
  private query = defineQuery([Position, Velocity]);

  /**
   * Executes the movement logic for all applicable entities.
   * @param delta The time elapsed since the last update, in milliseconds.
   */
  execute(delta: number): void {
    const entities = this.query(this.world);
    const speedFactor = delta / 1000; // Convert delta to seconds for speed calculation

    for (const eid of entities) {
      // This is a simple linear movement. In a real scenario,
      // you might have more complex logic for speed, acceleration, and collision.
      Position.x[eid] += Velocity.x[eid] * speedFactor;
      Position.y[eid] += Velocity.y[eid] * speedFactor;
    }
  }
}
