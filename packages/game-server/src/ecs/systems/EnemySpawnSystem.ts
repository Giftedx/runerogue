/**
 * @file EnemySpawnSystem.ts
 * @description A system that handles spawning enemies in waves.
 * @author RuneRogue Development Team
 */

import { addComponent, addEntity, defineQuery, type IWorld } from "bitecs";
import type { GameRoom } from "../../rooms/GameRoom";
import {
  Enemy,
  Health,
  Position,
  Velocity,
  Target,
  Combat,
} from "../components";
import { EnemySchema } from "@runerogue/shared";

/**
 * @function createEnemySpawnSystem
 * @description Creates a system that spawns enemies.
 * @param {GameRoom} room The game room instance.
 * @returns A BiteCS system.
 */
export const createEnemySpawnSystem = (room: GameRoom) => {
  const enemyQuery = defineQuery([Enemy]);

  return (world: IWorld) => {
    // Simple spawn logic: if no enemies exist, spawn one.
    const enemies = enemyQuery(world);
    if (enemies.length === 0) {
      const enemyId = `e-${Math.random().toString(36).substring(7)}`;
      const enemySchema = new EnemySchema();
      enemySchema.id = enemyId;

      const eid = addEntity(world);

      addComponent(world, Position, eid);
      Position.x[eid] = Math.random() * 800;
      Position.y[eid] = Math.random() * 600;

      addComponent(world, Velocity, eid);
      addComponent(world, Health, eid);
      Health.current[eid] = 3;
      Health.max[eid] = 3;

      addComponent(world, Enemy, eid);
      addComponent(world, Target, eid);
      addComponent(world, Combat, eid);
      Combat.attack[eid] = 1;
      Combat.strength[eid] = 1;
      Combat.defence[eid] = 1;
      Combat.attackSpeed[eid] = 2400; // 4 ticks

      enemySchema.ecsId = eid;
      room.state.enemies.set(enemyId, enemySchema);
    }

    return world;
  };
};
