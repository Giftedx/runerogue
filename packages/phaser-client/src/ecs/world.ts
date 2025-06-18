/**
 * @file Initializes and exports the bitECS world and the main pipeline.
 */
import { createWorld, pipe } from "bitecs";
import { createMovementSystem } from "./systems/movement";
import { createRenderingSystem } from "./systems/rendering";
import { createDamageSplatSystem } from "./systems/damageSplatSystem";
import { createHealthBarSystem } from "./systems/healthBarSystem";
import GameScene from "@/scenes/GameScene";

/**
 * The main bitECS world instance.
 * All entities and components will be registered here.
 */
export const world = createWorld();

/**
 * The main system pipeline.
 * This function, when called, will execute all registered systems in sequence.
 * @param {GameScene} scene - The Phaser scene to pass to the systems.
 * @returns {void}
 */
export const createMainPipeline = (scene: GameScene) =>
  pipe(
    createMovementSystem(scene),
    createRenderingSystem(scene),
    createDamageSplatSystem(scene),
    createHealthBarSystem(scene)
    // Other systems will be added here
  );
