/**
 * @file DeathSystem.ts
 * @description Handles the death of players and enemies.
 * @author Your Name
 */

import { defineSystem, type World } from "bitecs";
import type { GameState, Enemy, Player } from "../../schemas/GameState";
import type { GameRoom } from "../../../server/rooms/RuneRogueGameRoom";
import { type MapSchema } from "@colyseus/schema";

const RESPAWN_TIME = 5000; // 5 seconds
const ENEMY_REMOVAL_DELAY = 1000; // 1 second for death animation

/**
 * @class DeathSystem
 * @classdesc A system that manages entity death, including player respawning and enemy removal.
 */
export class DeathSystem {
  private state: GameState;
  private room: GameRoom;
  private playerMap: MapSchema<Player>;
  private enemyMap: MapSchema<Enemy>;

  constructor(
    world: World,
    state: GameState,
    room: GameRoom,
    playerMap: MapSchema<Player>,
    enemyMap: MapSchema<Enemy>
  ) {
    this.state = state;
    this.room = room;
    this.playerMap = playerMap;
    this.enemyMap = enemyMap;
  }

  /**
   * Executes the system logic for each entity on every game tick.
   * @param {number} _delta - The time elapsed since the last update (unused).
   */
  execute(_delta: number): void {
    if (!this.state.gameStarted) return;

    // Check for dead players
    const deadPlayers = this.getDeadPlayers();
    if (deadPlayers.length > 0) {
      console.info(
        "[DeathSystem] Processing dead players:",
        deadPlayers.length
      );

      deadPlayers.forEach((eid) => {
        const player = this.playerMap.get(eid);
        if (player) {
          this.handlePlayerDeath(player);
          console.info(
            `[DeathSystem] Player ${player.id} died at position (${player.x}, ${player.y})`
          );
        }
      });
    }

    // Check for dead enemies
    const deadEnemies = this.getDeadEnemies();
    if (deadEnemies.length > 0) {
      console.info(
        "[DeathSystem] Processing dead enemies:",
        deadEnemies.length
      );

      deadEnemies.forEach((eid) => {
        const enemy = this.enemyMap.get(eid);
        if (enemy) {
          this.handleEnemyDeath(enemy);
          console.info(`[DeathSystem] Enemy ${enemy.id} died`);
        }
      });
    }
  }

  private getDeadPlayers(): string[] {
    return Array.from(this.playerMap.keys()).filter((eid) => {
      const player = this.playerMap.get(eid);
      return player && player.health <= 0 && !player.isDead;
    });
  }

  private getDeadEnemies(): string[] {
    return Array.from(this.enemyMap.keys()).filter((eid) => {
      const enemy = this.enemyMap.get(eid);
      return enemy && enemy.health <= 0 && enemy.alive;
    });
  }

  /**
   * Handles the death of a player entity.
   * @param {Player} player - The player entity that has died.
   */
  private handlePlayerDeath(player: Player): void {
    player.isDead = true;
    console.info(`Player ${player.name} has died`);
    console.info(`Starting respawn timer for player ${player.name}`);

    // Respawn timer
    setTimeout(() => {
      player.isDead = false;
      player.health = player.maxHealth;
      player.x = 0; // Starting location
      player.y = 0;
      console.log(`Player ${player.name} has respawned.`);
    }, RESPAWN_TIME);

    // Broadcast death event
    this.room.broadcast("entityDied", { entityId: player.id, isPlayer: true });
  }

  /**
   * Handles the death of an enemy entity.
   * @param {Enemy} enemy - The enemy entity that has died.
   */
  private handleEnemyDeath(enemy: Enemy): void {
    enemy.alive = false;
    console.info(`Enemy ${enemy.id} has died`);
    console.info(`Enemy killed. Total: ${this.state.enemiesKilled + 1}`);
    this.state.enemiesKilled++;

    // TODO: Handle drops
    console.info("TODO: Implement enemy drops");

    // Delayed removal for animation
    setTimeout(() => {
      this.state.enemies.delete(enemy.id);
      console.log(`Enemy ${enemy.id} removed from game.`);
    }, ENEMY_REMOVAL_DELAY);

    // Broadcast death event
    this.room.broadcast("entityDied", { entityId: enemy.id, isPlayer: false });
  }
}

export const createDeathSystem = (
  playerMap: MapSchema<Player>,
  enemyMap: MapSchema<Enemy>
) => {
  return defineSystem((world: World) => {
    // ...existing code...
  });
};
