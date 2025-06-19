/**
 * @file EnemyAISystem.ts
 * @description Manages the behavior of non-player characters (NPCs), making them aggressive towards players.
 * @author RuneRogue Development Team
 */

import { defineSystem, defineQuery, hasComponent, type World } from "bitecs";
import type {
  Position,
  Velocity,
  Health,
  EntityType,
  Target,
} from "../components";
import type { GameState, Enemy, Player } from "../../schemas/GameState";
import { WEAPON_SPEEDS } from "../../../../shared/src/types/osrs";

// OSRS tick duration (0.6s per tick)
const OSRS_TICK_MS = 600;

const AGGRESSION_RADIUS = 4; // tiles
const MELEE_RANGE = 1; // tiles

/**
 * A system that controls enemy AI, including aggression, targeting, pathfinding, and attacking.
 * @class EnemyAISystem
 */
export class EnemyAISystem extends System {
  private state: GameState;

  /**
   * @param world ECS World
   * @param state Game state
   */
  constructor(world: World, state: GameState) {
    super(world);
    this.state = state;
  }

  /**
   * Executes the system logic for each enemy entity on every game tick.
   * @param delta The time elapsed since the last update.
   */
  execute(_delta: number): void {
    if (!this.state.gameStarted) return;

    this.state.enemies.forEach((enemy) => {
      if (!enemy.alive) return;
      const now = Date.now();
      switch (enemy.aiState) {
        case "IDLE":
          this.findTarget(enemy);
          break;
        case "ATTACKING":
          this.attackTarget(enemy, now);
          break;
      }
    });
  }

  /**
   * Finds the closest player within the aggression radius and sets it as the enemy's target.
   * @param enemy The enemy entity.
   */
  private findTarget(enemy: Enemy): void {
    let closestPlayer: Player | null = null;
    let minDistance = Infinity;
    this.state.players.forEach((player: Player) => {
      if (player.isDead) return;
      const distance = Math.sqrt(
        Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2)
      );
      if (distance < AGGRESSION_RADIUS && distance < minDistance) {
        minDistance = distance;
        closestPlayer = player;
      }
    });
    if (closestPlayer) {
      // Player.id is defined as string in schema
      enemy.targetId = (closestPlayer as Player).id;
      enemy.aiState = "ATTACKING";
    }
  }

  /**
   * Handles the enemy's movement and attack logic when a target is acquired.
   * @param enemy The enemy entity.
   * @param now The current timestamp.
   */
  private attackTarget(enemy: Enemy, now: number): void {
    const target = this.state.players.get(enemy.targetId);
    if (!target || target.isDead) {
      enemy.targetId = "";
      enemy.aiState = "IDLE";
      return;
    }
    const dx = target.x - enemy.x;
    const dy = target.y - enemy.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move towards target if not in melee range
    if (distance > MELEE_RANGE) {
      const angle = Math.atan2(dy, dx);
      const speed = 1 / OSRS_TICK_MS; // 1 tile per tick
      enemy.x += Math.cos(angle) * speed * OSRS_TICK_MS;
      enemy.y += Math.sin(angle) * speed * OSRS_TICK_MS;
    }
    // Attack target if in melee range and attack is off cooldown
    const attackSpeed = WEAPON_SPEEDS.SLOW * OSRS_TICK_MS; // Example: slow weapon
    if (distance <= MELEE_RANGE && now - enemy.lastAttackTime > attackSpeed) {
      enemy.lastAttackTime = now;
      // This is where the server would trigger the combat calculation.
      // For now, we'll just log it.
      console.info(`Enemy ${enemy.id} attacks Player ${target.id}`);
      // In a real implementation, you would call a method in your game room
      // to handle the damage calculation and state update.
      // e.g., this.room.handleAttack(enemy, target);
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
