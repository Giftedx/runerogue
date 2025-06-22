/**
 * @file Simplified EnemySpawnSystem for immediate integration
 * @description Basic enemy spawning without complex wave system
 */

import { defineQuery, defineSystem, addEntity, addComponent } from "bitecs";
import type { CombatWorld } from "./CombatSystem";
import { Enemy, Position, Health } from "../components";
import { EnemyType, ENEMY_CONFIGS } from "@runerogue/shared";

export interface SimpleEnemySpawnOptions {
  getPlayerCount: () => number;
  getMapBounds: () => {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  onEnemySpawned?: (enemyEid: number, enemyType: EnemyType) => void;
}

const enemyQuery = defineQuery([Enemy, Health]);

export const createSimpleEnemySpawnSystem = (
  options: SimpleEnemySpawnOptions
) => {
  let lastSpawnTime = 0;
  const SPAWN_INTERVAL = 5000; // 5 seconds
  const MAX_ENEMIES = 10;

  return defineSystem((world: CombatWorld) => {
    const currentTime = Date.now();
    const mapBounds = options.getMapBounds();

    // Count existing enemies
    const remainingEnemies = enemyQuery(world).filter(
      (eid) => (Health.current[eid] as number) > 0
    );

    // Spawn new enemy if needed
    if (
      currentTime - lastSpawnTime >= SPAWN_INTERVAL &&
      remainingEnemies.length < MAX_ENEMIES
    ) {
      const enemyType = EnemyType.Goblin; // Simple: just spawn goblins for now
      const config = ENEMY_CONFIGS[enemyType];

      const enemyEid = addEntity(world);

      // Register components
      addComponent(world, Enemy, enemyEid);
      addComponent(world, Position, enemyEid);
      addComponent(world, Health, enemyEid);

      // Set spawn position
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * 100;
      const spawnX = mapBounds.centerX + Math.cos(angle) * distance;
      const spawnY = mapBounds.centerY + Math.sin(angle) * distance;

      // Set component data with type assertions
      (Enemy.enemyType[enemyEid] as any) =
        Object.values(EnemyType).indexOf(enemyType);
      (Enemy.level[enemyEid] as any) = config.level;
      (Enemy.attackSpeed[enemyEid] as any) = config.attackSpeed;
      (Enemy.maxAttackRange[enemyEid] as any) = config.maxAttackRange * 32;
      (Enemy.aggroRadius[enemyEid] as any) = config.aggroRadius;
      (Enemy.moveSpeed[enemyEid] as any) = config.moveSpeed;

      (Position.x[enemyEid] as any) = spawnX;
      (Position.y[enemyEid] as any) = spawnY;

      (Health.current[enemyEid] as any) = config.hitpoints;
      (Health.max[enemyEid] as any) = config.hitpoints;

      lastSpawnTime = currentTime;

      if (options.onEnemySpawned) {
        options.onEnemySpawned(enemyEid, enemyType);
      }
    }

    return world;
  });
};
