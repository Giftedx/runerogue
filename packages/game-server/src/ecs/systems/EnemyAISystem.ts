/**
 * @file EnemyAISystem.ts
 * @description Manages the behavior of non-player characters (NPCs), making them aggressive towards players.
 * @author RuneRogue Development Team
 */

import { defineQuery, defineSystem } from "bitecs";
import { System } from "@colyseus/ecs";

import type { GameRoomState } from "@runerogue/shared";
import { Position, Velocity, Health, EntityType, Target } from "../components";

const AGGRESSION_RADIUS = 4; // tiles
const MELEE_RANGE = 1; // tiles

/**
 * A system that controls enemy AI, including aggression, targeting, pathfinding, and attacking.
 * @class EnemyAISystem
 */
export class EnemyAISystem extends System<GameRoomState> {
  private enemyQuery = defineQuery([
    Position,
    Velocity,
    Health,
    EntityType,
    Target,
  ]);
  private playerQuery = defineQuery([Position, Health, EntityType]);

  /**
   * Executes the system logic for each enemy entity on every game tick.
   * @param delta The time elapsed since the last update.
   */
  execute(_delta: number): void {
    const enemies = this.enemyQuery(this.world);
    const players = this.playerQuery(this.world);

    for (const eid of enemies) {
      const enemySchema = this.room.state.enemies.get(String(eid));
      if (!enemySchema || enemySchema.health.current <= 0) {
        continue;
      }

      const targetId = Target.eid[eid];

      if (targetId === 0) {
        this.findTarget(eid, players);
      } else {
        this.attackTarget(eid, targetId);
      }
    }
  }

  /**
   * Finds the closest player within the aggression radius and sets it as the enemy's target.
   * @param enemyEid The entity ID of the enemy.
   * @param players An array of player entity IDs.
   */
  private findTarget(enemyEid: number, players: number[]): void {
    let closestPlayerEid = 0;
    let minDistance = Infinity;

    const enemyX = Position.x[enemyEid];
    const enemyY = Position.y[enemyEid];

    for (const playerEid of players) {
      const playerSchema = this.room.state.players.get(String(playerEid));
      if (!playerSchema || playerSchema.health.current <= 0) {
        continue;
      }

      const playerX = Position.x[playerEid];
      const playerY = Position.y[playerEid];

      const distance = Math.sqrt(
        Math.pow(playerX - enemyX, 2) + Math.pow(playerY - enemyY, 2)
      );

      if (distance < AGGRESSION_RADIUS && distance < minDistance) {
        minDistance = distance;
        closestPlayerEid = playerEid;
      }
    }

    if (closestPlayerEid !== 0) {
      Target.eid[enemyEid] = closestPlayerEid;
    }
  }

  /**
   * Handles the enemy's movement and attack logic when a target is acquired.
   * @param enemyEid The entity ID of the enemy.
   * @param targetEid The entity ID of the target player.
   */
  private attackTarget(enemyEid: number, targetEid: number): void {
    const targetSchema = this.room.state.players.get(String(targetEid));
    if (!targetSchema || targetSchema.health.current <= 0) {
      Target.eid[enemyEid] = 0; // Clear target
      return;
    }

    const enemyX = Position.x[enemyEid];
    const enemyY = Position.y[enemyEid];
    const targetX = Position.x[targetEid];
    const targetY = Position.y[targetEid];

    const dx = targetX - enemyX;
    const dy = targetY - enemyY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move towards target if not in melee range
    if (distance > MELEE_RANGE) {
      const angle = Math.atan2(dy, dx);
      const speed = 1; // 1 tile per tick
      Velocity.x[enemyEid] = Math.cos(angle) * speed;
      Velocity.y[enemyEid] = Math.sin(angle) * speed;
    } else {
      Velocity.x[enemyEid] = 0;
      Velocity.y[enemyEid] = 0;
    }
  }
}

export const createEnemyAISystem = (
  playerMap: MapSchema<Player>,
  enemyMap: MapSchema<Enemy>,
  worldBounds: { width: number; height: number }
) => {
  return defineSystem((world: World, _delta: number) => {
    // ...existing code...

    if (target !== 0) {
      // ...existing code...
    }

    if (enemy && !enemy.target) {
      console.warn(
        `[EnemyAI] Enemy ${enemy.id} target player ${playerId} not found`
      );
      // ...existing code...
    }

    return world;
  });
};
