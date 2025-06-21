/**
 * @file EnemyAISystem.ts
 * @description Manages the behavior of non-player characters (NPCs), making them aggressive towards players.
 * @author RuneRogue Development Team
 */

import { defineQuery, defineSystem, hasComponent, type IWorld } from "bitecs";
import { Position, Target, Velocity, Player, Enemy } from "../components";

/**
 * A system that controls enemy AI, including aggression, targeting, pathfinding, and attacking.
 * @class EnemyAISystem
 */
export class EnemyAISystem extends System<GameRoomState> {
  private enemyQuery = defineQuery([Position, Velocity, Target, Enemy]);
  private playerQuery = defineQuery([Position, Player]);

  /**
   * Executes the system logic for each enemy entity on every game tick.
   * @param delta The time elapsed since the last update.
   */
  execute(_delta: number): void {
    const enemies = this.enemyQuery(this.world);
    const players = this.playerQuery(this.world);

    for (const eid of enemies) {
      // If enemy has no target, find the closest player
      if (!hasComponent(this.world, Target, eid) || Target.eid[eid] === 0) {
        let closestPlayerEid = 0;
        let minDistance = Infinity;

        for (const playerEid of players) {
          const distance = Math.hypot(
            Position.x[playerEid] - Position.x[eid],
            Position.y[playerEid] - Position.y[eid]
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestPlayerEid = playerEid;
          }
        }

        if (closestPlayerEid !== 0) {
          Target.eid[eid] = closestPlayerEid;
        }
      }

      // Move enemy towards its target
      const targetEid = Target.eid[eid];
      if (targetEid !== 0) {
        const targetPositionX = Position.x[targetEid];
        const targetPositionY = Position.y[targetEid];

        const dx = targetPositionX - Position.x[eid];
        const dy = targetPositionY - Position.y[eid];
        const distance = Math.hypot(dx, dy);

        if (distance > 1) {
          // Normalize vector
          Velocity.x[eid] = dx / distance;
          Velocity.y[eid] = dy / distance;
        } else {
          Velocity.x[eid] = 0;
          Velocity.y[eid] = 0;
        }
      }
    }

    return this.world;
  }
}

/**
 * @function createEnemyAISystem
 * @description A system that controls enemy AI behavior, such as finding and moving towards targets.
 * @returns A BiteCS system.
 */
export const createEnemyAISystem = () => {
  const enemyQuery = defineQuery([Position, Velocity, Target, Enemy]);
  const playerQuery = defineQuery([Position, Player]);

  return defineSystem((world: IWorld) => {
    const enemies = enemyQuery(world);
    const players = playerQuery(world);

    for (const eid of enemies) {
      // If enemy has no target, find the closest player
      if (!hasComponent(world, Target, eid) || Target.eid[eid] === 0) {
        let closestPlayerEid = 0;
        let minDistance = Infinity;

        for (const playerEid of players) {
          const distance = Math.hypot(
            Position.x[playerEid] - Position.x[eid],
            Position.y[playerEid] - Position.y[eid]
          );

          if (distance < minDistance) {
            minDistance = distance;
            closestPlayerEid = playerEid;
          }
        }

        if (closestPlayerEid !== 0) {
          Target.eid[eid] = closestPlayerEid;
        }
      }

      // Move enemy towards its target
      const targetEid = Target.eid[eid];
      if (targetEid !== 0) {
        const targetPositionX = Position.x[targetEid];
        const targetPositionY = Position.y[targetEid];

        const dx = targetPositionX - Position.x[eid];
        const dy = targetPositionY - Position.y[eid];
        const distance = Math.hypot(dx, dy);

        if (distance > 1) {
          // Normalize vector
          Velocity.x[eid] = dx / distance;
          Velocity.y[eid] = dy / distance;
        } else {
          Velocity.x[eid] = 0;
          Velocity.y[eid] = 0;
        }
      }
    }

    return world;
  });
};
