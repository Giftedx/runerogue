/**
 * @file EnemyAISystem.ts
 * @description Manages the behavior of non-player characters (NPCs), making them aggressive towards players.
 * @author Your Name
 */
import { System } from "@colyseus/ecs";
import { GameState } from "../../schemas/GameState";
/**
 * @class EnemyAISystem
 * @classdesc A system that controls enemy AI, including aggression, targeting, pathfinding, and attacking.
 */
export declare class EnemyAISystem extends System {
    private state;
    constructor(state: GameState);
    /**
     * Executes the system logic for each enemy entity on every game tick.
     * @param {number} delta - The time elapsed since the last update.
     */
    execute(delta: number): void;
    /**
     * Finds the closest player within the aggression radius and sets it as the enemy's target.
     * @param {Enemy} enemy - The enemy entity.
     */
    private findTarget;
    /**
     * Handles the enemy's movement and attack logic when a target is acquired.
     * @param {Enemy} enemy - The enemy entity.
     * @param {number} now - The current timestamp.
     */
    private attackTarget;
}
