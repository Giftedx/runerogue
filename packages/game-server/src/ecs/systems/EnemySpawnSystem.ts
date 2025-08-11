/**
 * @file EnemySpawnSystem.ts
 * @description ECS Enemy Spawn System with OSRS-authentic wave progression
 * @author RuneRogue Development Team
 */

import { defineQuery, defineSystem, addEntity, addComponent } from "bitecs";
import type { CombatWorld } from "./CombatSystem";
import { Enemy, Position, Health, CombatStats } from "../components";
import { AIState, EnemyAIState } from "../components/AIState";
import { EnemyType, ENEMY_CONFIGS } from "@runerogue/shared";
import { getWaveConfig, getTotalEnemiesInWave } from "@runerogue/shared";

/**
 * ECS Enemy Spawn System
 * Handles wave-based enemy spawning with OSRS-authentic enemy stats.
 *
 * Features:
 * - Wave progression system
 * - OSRS-authentic enemy stats from shared configs
 * - Proper bitECS component registration
 * - Multiplayer scaling
 * - Performance optimized spawning
 *
 * **CRITICAL**: All components must be registered with `addComponent(world, Component, eid)`
 * before setting component data, following the established bitECS pattern.
 */

export interface EnemySpawnSystemOptions {
  getPlayerCount: () => number; // Returns current player count for scaling
  getMapBounds: () => {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  onEnemySpawned?: (enemyEid: number, enemyType: EnemyType) => void;
  onWaveCompleted?: (waveNumber: number) => void;
  onWaveStarted?: (waveNumber: number) => void;
}

export interface WaveState {
  currentWave: number;
  enemiesRemaining: number;
  enemiesTotal: number;
  isActive: boolean;
  nextWaveTime: number;
  spawnQueue: Array<{
    type: EnemyType;
    spawnTime: number;
    spawnRadius: number;
  }>;
}

// Query for all enemies (to count remaining)
const enemyQuery = defineQuery([Enemy, Health]);

export const createEnemySpawnSystem = (options: EnemySpawnSystemOptions) => {
  // Initialize wave state
  const waveState: WaveState = {
    currentWave: 0,
    enemiesRemaining: 0,
    enemiesTotal: 0,
    isActive: false,
    nextWaveTime: 0,
    spawnQueue: [],
  };

  return defineSystem((world: CombatWorld) => {
    const currentTime = Date.now();
    const mapBounds = options.getMapBounds();
    const playerCount = options.getPlayerCount();

    // Count remaining enemies
    const remainingEnemies = enemyQuery(world).filter(
      (eid) => Health.current[eid] > 0
    );
    waveState.enemiesRemaining = remainingEnemies.length;

    // Check if wave is complete
    if (waveState.isActive && waveState.enemiesRemaining === 0) {
      waveState.isActive = false;
      waveState.nextWaveTime = currentTime + 5000; // 5 second delay

      if (options.onWaveCompleted) {
        options.onWaveCompleted(waveState.currentWave);
      }
    }

    // Start next wave if it's time
    if (!waveState.isActive && currentTime >= waveState.nextWaveTime) {
      startNextWave(waveState, playerCount, currentTime, options);
    }

    // Process spawn queue
    processSpawnQueue(world, waveState, currentTime, mapBounds, options);

    return world;
  });
}; /**
 * Starts the next wave based on wave configuration.
 */
function startNextWave(
  waveState: WaveState,
  playerCount: number,
  currentTime: number,
  options: EnemySpawnSystemOptions
): void {
  waveState.currentWave++;
  waveState.isActive = true;

  const waveConfig = getWaveConfig(waveState.currentWave);

  // Calculate scaling based on player count
  const playerScaling = Math.max(1, playerCount * 0.75); // 75% more enemies per extra player

  // Build spawn queue
  waveState.spawnQueue = [];
  let spawnTime = currentTime;

  for (const enemyConfig of waveConfig.enemies) {
    const scaledCount = Math.ceil(enemyConfig.count * playerScaling);

    for (let i = 0; i < scaledCount; i++) {
      waveState.spawnQueue.push({
        type: enemyConfig.type,
        // Ensure first spawn occurs after at least one delay tick to avoid immediate spawn in same tick
        spawnTime: spawnTime + (i + 1) * enemyConfig.spawnDelay,
        spawnRadius: enemyConfig.spawnRadius,
      });
    }
  }

  waveState.enemiesTotal = waveState.spawnQueue.length;
  waveState.enemiesRemaining = waveState.enemiesTotal;

  if (options.onWaveStarted) {
    options.onWaveStarted(waveState.currentWave);
  }
}

/**
 * Processes the spawn queue and creates enemies.
 */
function processSpawnQueue(
  world: CombatWorld,
  waveState: WaveState,
  currentTime: number,
  mapBounds: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  },
  options: EnemySpawnSystemOptions
): void {
  const currentWaveConfig = getWaveConfig(waveState.currentWave);

  // Process ready spawns
  for (let i = waveState.spawnQueue.length - 1; i >= 0; i--) {
    const spawn = waveState.spawnQueue[i];

    if (currentTime >= spawn.spawnTime) {
      // Create enemy entity
      const enemyEid = createEnemyEntity(
        world,
        spawn.type,
        mapBounds,
        spawn.spawnRadius,
        currentWaveConfig.difficultyMultiplier
      );

      // Remove from queue
      waveState.spawnQueue.splice(i, 1);

      if (options.onEnemySpawned) {
        options.onEnemySpawned(enemyEid, spawn.type);
      }
    }
  }
}

/**
 * Creates a new enemy entity with OSRS-authentic stats.
 *
 * **CRITICAL**: Follows the bitECS pattern - all components must be registered
 * with `addComponent(world, Component, eid)` before setting component data.
 */
function createEnemyEntity(
  world: CombatWorld,
  enemyType: EnemyType,
  mapBounds: {
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  },
  spawnRadius: number,
  difficultyMultiplier: number
): number {
  const config = ENEMY_CONFIGS[enemyType];
  const eid = addEntity(world);

  // CRITICAL: Register all components first
  addComponent(world, Enemy, eid);
  addComponent(world, Position, eid);
  addComponent(world, Health, eid);
  addComponent(world, CombatStats, eid);
  addComponent(world, AIState, eid);

  // Calculate spawn position (random position around map center)
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * spawnRadius;
  const spawnX = mapBounds.centerX + Math.cos(angle) * distance;
  const spawnY = mapBounds.centerY + Math.sin(angle) * distance;

  // Clamp to map bounds
  const clampedX = Math.max(50, Math.min(mapBounds.width - 50, spawnX));
  const clampedY = Math.max(50, Math.min(mapBounds.height - 50, spawnY));
  // Set Enemy component data (with type assertions for bitECS)
  (Enemy.enemyType[eid] as any) = Object.values(EnemyType).indexOf(enemyType);
  (Enemy.level[eid] as any) = Math.floor(config.level * difficultyMultiplier);
  (Enemy.aiState[eid] as any) = EnemyAIState.Idle;
  (Enemy.targetEid[eid] as any) = 0;
  (Enemy.lastAttackTime[eid] as any) = 0;
  (Enemy.aggroRadius[eid] as any) = config.aggroRadius;
  (Enemy.attackSpeed[eid] as any) = config.attackSpeed;
  (Enemy.maxAttackRange[eid] as any) = config.maxAttackRange * 32; // Convert tiles to pixels
  (Enemy.moveSpeed[eid] as any) = config.moveSpeed;
  (Enemy.lastMoveTime[eid] as any) = 0;
  (Enemy.pathTargetX[eid] as any) = clampedX;
  (Enemy.pathTargetY[eid] as any) = clampedY;
  (Enemy.isPathfinding[eid] as any) = 0;

  // Set Position component data
  Position.x[eid] = clampedX;
  Position.y[eid] = clampedY;

  // Set Health component data (scaled by difficulty)
  const scaledHealth = Math.floor(config.hitpoints * difficultyMultiplier);
  Health.current[eid] = scaledHealth;
  Health.max[eid] = scaledHealth;

  // Set CombatStats component data (OSRS-authentic)
  CombatStats.attackLevel[eid] = Math.floor(
    config.attack * difficultyMultiplier
  );
  CombatStats.strengthLevel[eid] = Math.floor(
    config.strength * difficultyMultiplier
  );
  CombatStats.defenceLevel[eid] = Math.floor(
    config.defence * difficultyMultiplier
  );
  CombatStats.rangedLevel[eid] = 1; // Enemies typically don't use ranged
  CombatStats.magicLevel[eid] = 1; // Enemies typically don't use magic
  CombatStats.hitpointsLevel[eid] = scaledHealth;
  CombatStats.prayerLevel[eid] = 1; // Enemies don't use prayer
  CombatStats.attackBonus[eid] = Math.floor(
    config.attackBonus * difficultyMultiplier
  );
  CombatStats.strengthBonus[eid] = Math.floor(
    config.strengthBonus * difficultyMultiplier
  );
  CombatStats.defenceBonus[eid] = Math.floor(
    config.defenceBonus * difficultyMultiplier
  );
  CombatStats.rangedBonus[eid] = 0;
  CombatStats.rangedStrengthBonus[eid] = 0;
  CombatStats.magicBonus[eid] = 0;
  CombatStats.magicDamageBonus[eid] = 0;
  CombatStats.prayerBonus[eid] = 0;
  CombatStats.combatStyle[eid] = 0; // Aggressive style
  CombatStats.combatType[eid] = 0; // Melee

  // Set AIState component data
  AIState.currentState[eid] = EnemyAIState.Idle;
  AIState.stateEnterTime[eid] = Date.now();
  AIState.stateExitTime[eid] = 0;
  AIState.isAggressive[eid] = config.isAggressive ? 1 : 0;
  AIState.canFlee[eid] = config.canFlee ? 1 : 0;
  AIState.fleeHealthThreshold[eid] = config.fleeHealthThreshold;
  AIState.lastTargetScanTime[eid] = 0;
  AIState.targetScanCooldown[eid] = 1000; // 1 second scan cooldown
  AIState.idleWanderTimer[eid] = Date.now() + Math.random() * 3000; // Random wander time
  AIState.combatRetreatTimer[eid] = 0;

  return eid;
}

/**
 * Gets the current wave state (for UI display).
 */
export function getWaveState(
  system: ReturnType<typeof createEnemySpawnSystem>
): WaveState {
  // This would need to be implemented with a way to access the internal state
  // For now, we'll return a default state
  return {
    currentWave: 1,
    enemiesRemaining: 0,
    enemiesTotal: 0,
    isActive: false,
    nextWaveTime: 0,
    spawnQueue: [],
  };
}
