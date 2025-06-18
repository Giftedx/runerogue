/**
 * @file DeathSystem.ts
 * @description Handles the death of players and enemies.
 * @author Your Name
 */
import { System } from "@colyseus/ecs";
import { GameState } from "../../schemas/GameState";
/**
 * @class DeathSystem
 * @classdesc A system that manages entity death, including player respawning and enemy removal.
 */
export declare class DeathSystem extends System {
    private state;
    private room;
    constructor(state: GameState, room: any);
    /**
     * Executes the system logic for each entity on every game tick.
     * @param {number} delta - The time elapsed since the last update.
     */
    execute(delta: number): void;
    /**
     * Handles the death of a player entity.
     * @param {Player} player - The player entity that has died.
     */
    private handlePlayerDeath;
    /**
     * Handles the death of an enemy entity.
     * @param {Enemy} enemy - The enemy entity that has died.
     */
    private handleEnemyDeath;
}
