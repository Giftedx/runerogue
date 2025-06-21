/**
 * @file EnemySpawnSystem.ts
 * @description A system that handles spawning enemies in waves.
 * @author RuneRogue Development Team
 */

import { defineSystem, addEntity, addComponent, type IWorld } from "bitecs";
import {
  Position,
  Velocity,
  Health,
  Target,
  Combat,
  Enemy,
} from "../components";
import { EnemySchema } from "@runerogue/shared";
import { type GameRoom } from "../../rooms/GameRoom";

interface SpawnConfig {
  health: number;
  attack: number;
  strength: number;
  defence: number;
  attackSpeed: number;
  combatLevel: number;
}

const ENEMY_CONFIGS: Record<string, SpawnConfig> = {
  goblin: {
    health: 5,
    attack: 1,
    strength: 1,
    defence: 1,
    attackSpeed: 2400, // 4 ticks
    combatLevel: 2,
  },
  spider: {
    health: 8,
    attack: 2,
    strength: 2,
    defence: 1,
    attackSpeed: 2400,
    combatLevel: 3,
  },
  orc: {
    health: 12,
    attack: 3,
    strength: 3,
    defence: 2,
    attackSpeed: 3000,
    combatLevel: 5,
  },
};

/**
 * Create enemy spawn system that manages wave-based enemy spawning
 * @param room - The game room instance
 * @returns The enemy spawn system function
 */
export const createEnemySpawnSystem = (room: GameRoom) => {
  let lastSpawnTime = 0;
  const SPAWN_INTERVAL = 5000; // 5 seconds

  return defineSystem((world: IWorld) => {
    const currentTime = room.clock.elapsedTime;
    const wave = room.state.wave;

    // Start first wave
    if (wave.waveNumber === 0) {
      wave.waveNumber = 1;
      wave.enemiesToSpawn = 3;
      wave.enemiesRemaining = 3;
      room.broadcast("waveStart", {
        waveNumber: wave.waveNumber,
        enemyCount: wave.enemiesRemaining,
      });
    }

    // Update wave when all enemies are defeated
    if (room.state.enemies.size === 0 && wave.enemiesRemaining <= 0) {
      wave.waveNumber++;
      wave.enemiesToSpawn = 3 + wave.waveNumber * 2;
      wave.enemiesRemaining = wave.enemiesToSpawn;
      room.broadcast("waveStart", {
        waveNumber: wave.waveNumber,
        enemyCount: wave.enemiesRemaining,
      });
    }

    if (currentTime - lastSpawnTime < SPAWN_INTERVAL) {
      return world;
    }

    // Check if we should spawn enemies
    if (wave.enemiesToSpawn > 0) {
      lastSpawnTime = currentTime;
      wave.enemiesToSpawn--;

      // Choose enemy type based on wave
      const enemyType =
        wave.waveNumber > 2 ?
          wave.waveNumber > 4 ?
            "orc"
          : "spider"
        : "goblin";
      const config = ENEMY_CONFIGS[enemyType];

      // Create ECS entity
      const eid = addEntity(world);

      // Add components
      addComponent(
        world,
        Position,
        { x: 100 + Math.random() * 600, y: 100 + Math.random() * 400 },
        eid
      );
      addComponent(world, Velocity, { x: 0, y: 0 }, eid);
      addComponent(
        world,
        Health,
        { current: config.health, max: config.health },
        eid
      );
      addComponent(world, Enemy, eid);
      addComponent(world, Target, { targetId: -1 }, eid);
      addComponent(
        world,
        Combat,
        {
          attack: config.attack,
          strength: config.strength,
          defence: config.defence,
          attackSpeed: config.attackSpeed,
          lastAttackTime: 0,
        },
        eid
      );

      // Create and sync schema
      const enemyId = `enemy_${eid}`;
      const enemySchema = new EnemySchema().assign({
        id: enemyId,
        ecsId: eid,
        x: Position.x[eid],
        y: Position.y[eid],
        health: { current: Health.current[eid], max: Health.max[eid] },
        enemyType: enemyType,
        combatLevel: config.combatLevel,
      });

      room.state.enemies.set(enemyId, enemySchema);
    }

    return world;
  });
};
