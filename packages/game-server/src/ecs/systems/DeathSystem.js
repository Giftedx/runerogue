"use strict";
/**
 * @file DeathSystem.ts
 * @description Handles the death of players and enemies.
 * @author Your Name
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeathSystem = void 0;
const ecs_1 = require("@colyseus/ecs");
const RESPAWN_TIME = 5000; // 5 seconds
const ENEMY_REMOVAL_DELAY = 1000; // 1 second for death animation
/**
 * @class DeathSystem
 * @classdesc A system that manages entity death, including player respawning and enemy removal.
 */
class DeathSystem extends ecs_1.System {
    state;
    room; // Replace with your GameRoom type
    constructor(state, room) {
        super();
        this.state = state;
        this.room = room;
    }
    /**
     * Executes the system logic for each entity on every game tick.
     * @param {number} delta - The time elapsed since the last update.
     */
    execute(delta) {
        if (!this.state.gameStarted)
            return;
        // Check for dead players
        this.state.players.forEach((player) => {
            if (player.health <= 0 && !player.isDead) {
                this.handlePlayerDeath(player);
            }
        });
        // Check for dead enemies
        this.state.enemies.forEach((enemy) => {
            if (enemy.health <= 0 && enemy.alive) {
                this.handleEnemyDeath(enemy);
            }
        });
    }
    /**
     * Handles the death of a player entity.
     * @param {Player} player - The player entity that has died.
     */
    handlePlayerDeath(player) {
        player.isDead = true;
        this.room.broadcast("entityDied", { entityId: player.id, isPlayer: true });
        console.log(`Player ${player.name} has died.`);
        // Respawn timer
        setTimeout(() => {
            player.isDead = false;
            player.health = player.maxHealth;
            player.x = 0; // Starting location
            player.y = 0;
            console.log(`Player ${player.name} has respawned.`);
        }, RESPAWN_TIME);
    }
    /**
     * Handles the death of an enemy entity.
     * @param {Enemy} enemy - The enemy entity that has died.
     */
    handleEnemyDeath(enemy) {
        enemy.alive = false;
        this.room.broadcast("entityDied", { entityId: enemy.id, isPlayer: false });
        console.log(`Enemy ${enemy.id} has died.`);
        // Delayed removal for animation
        setTimeout(() => {
            this.state.enemies.delete(enemy.id);
            console.log(`Enemy ${enemy.id} removed from game.`);
        }, ENEMY_REMOVAL_DELAY);
    }
}
exports.DeathSystem = DeathSystem;
//# sourceMappingURL=DeathSystem.js.map