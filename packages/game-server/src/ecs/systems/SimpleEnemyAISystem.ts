/**
 * @file Simplified EnemyAISystem for immediate integration
 * @description Basic enemy AI without complex state management
 */

import { defineQuery, defineSystem } from "bitecs";
import type { CombatWorld } from "./CombatSystem";
import {
  Enemy,
  Position,
  Health,
  Player as PlayerComponent,
} from "../components";

const enemyQuery = defineQuery([Enemy, Position, Health]);
const playerQuery = defineQuery([PlayerComponent, Position, Health]);

export const createSimpleEnemyAISystem = () => {
  return defineSystem((world: CombatWorld) => {
    const enemies = enemyQuery(world).filter(
      (eid) => (Health.current[eid] as number) > 0
    );
    const players = playerQuery(world).filter(
      (eid) => (Health.current[eid] as number) > 0
    );

    if (players.length === 0) return world;

    // Simple AI: enemies move toward nearest player
    for (const enemyEid of enemies) {
      let nearestPlayer: number | null = null;
      let minDistance = Infinity;

      const enemyX = Position.x[enemyEid] as number;
      const enemyY = Position.y[enemyEid] as number;

      // Find nearest player
      for (const playerEid of players) {
        const playerX = Position.x[playerEid] as number;
        const playerY = Position.y[playerEid] as number;

        const dx = playerX - enemyX;
        const dy = playerY - enemyY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          nearestPlayer = playerEid;
        }
      }

      if (nearestPlayer && minDistance > 32) {
        // Move toward player if not in attack range
        const playerX = Position.x[nearestPlayer] as number;
        const playerY = Position.y[nearestPlayer] as number;

        const dx = playerX - enemyX;
        const dy = playerY - enemyY;
        const length = Math.sqrt(dx * dx + dy * dy) || 1;

        const moveSpeed = 30; // pixels per frame
        const normalizedX = dx / length;
        const normalizedY = dy / length;

        (Position.x[enemyEid] as any) = enemyX + normalizedX * moveSpeed;
        (Position.y[enemyEid] as any) = enemyY + normalizedY * moveSpeed;
      }
    }

    return world;
  });
};
