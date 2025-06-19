"use strict";
/**
 * @file EnemyAISystem.ts
 * @description Manages the behavior of non-player characters (NPCs), making them aggressive towards players.
 * @author Your Name
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnemyAISystem = void 0;
const ecs_1 = require("@colyseus/ecs");
const constants_1 = require("../../../../../packages/shared/src/constants");
const AGGRESSION_RADIUS = 4; // tiles
const MELEE_RANGE = 1; // tiles
/**
 * @class EnemyAISystem
 * @classdesc A system that controls enemy AI, including aggression, targeting, pathfinding, and attacking.
 */
class EnemyAISystem extends ecs_1.System {
  state;
  constructor(state) {
    super();
    this.state = state;
  }
  /**
   * Executes the system logic for each enemy entity on every game tick.
   * @param {number} delta - The time elapsed since the last update.
   */
  execute(delta) {
    if (!this.state.gameStarted) return;
    this.state.enemies.forEach((enemy) => {
      if (!enemy.alive) {
        return;
      }
      const now = Date.now();
      // 1. Handle AI State
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
   * @param {Enemy} enemy - The enemy entity.
   */
  findTarget(enemy) {
    let closestPlayer = null;
    let minDistance = Infinity;
    this.state.players.forEach((player) => {
      if (player.isDead) return;
      const distance = Math.sqrt(
        Math.pow(player.x - enemy.x, 2) + Math.pow(player.y - enemy.y, 2),
      );
      if (distance < AGGRESSION_RADIUS && distance < minDistance) {
        minDistance = distance;
        closestPlayer = player;
      }
    });
    if (closestPlayer) {
      enemy.targetId = closestPlayer.id;
      enemy.aiState = "ATTACKING";
    }
  }
  /**
   * Handles the enemy's movement and attack logic when a target is acquired.
   * @param {Enemy} enemy - The enemy entity.
   * @param {number} now - The current timestamp.
   */
  attackTarget(enemy, now) {
    const target = this.state.players.get(enemy.targetId);
    if (!target || target.isDead) {
      enemy.targetId = "";
      enemy.aiState = "IDLE";
      return;
    }
    const distance = Math.sqrt(
      Math.pow(target.x - enemy.x, 2) + Math.pow(target.y - enemy.y, 2),
    );
    // 2. Move towards target if not in melee range
    if (distance > MELEE_RANGE) {
      const angle = Math.atan2(target.y - enemy.y, target.x - enemy.x);
      // Assuming a simple movement speed for now
      const speed = 1 / constants_1.OSRS_TICK_MS; // 1 tile per tick
      enemy.x += Math.cos(angle) * speed * constants_1.OSRS_TICK_MS;
      enemy.y += Math.sin(angle) * speed * constants_1.OSRS_TICK_MS;
    }
    // 3. Attack target if in melee range and attack is off cooldown
    const attackSpeed =
      constants_1.WEAPON_SPEEDS.SLOW * constants_1.OSRS_TICK_MS; // Example: slow weapon
    if (distance <= MELEE_RANGE && now - enemy.lastAttackTime > attackSpeed) {
      enemy.lastAttackTime = now;
      // This is where the server would trigger the combat calculation.
      // For now, we'll just log it.
      console.log(`Enemy ${enemy.id} attacks Player ${target.id}`);
      // In a real implementation, you would call a method in your game room
      // to handle the damage calculation and state update.
      // e.g., this.room.handleAttack(enemy, target);
    }
  }
}
exports.EnemyAISystem = EnemyAISystem;
//# sourceMappingURL=EnemyAISystem.js.map
