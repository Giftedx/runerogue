/**
 * WaveSpawningSystem - ECS system for spawning enemy waves
 * Integrates with the WaveManager to create enemies in the ECS world
 */

import { defineSystem, IWorld } from 'bitecs';
import { createNPC } from '../world';

/**
 * Track wave spawning state
 */
interface WaveSpawnState {
  lastSpawnTime: number;
  currentWave: number;
  enemiesThisWave: number;
  maxEnemiesThisWave: number;
  spawnDelay: number;
}

// Global wave state
let waveState: WaveSpawnState = {
  lastSpawnTime: 0,
  currentWave: 0,
  enemiesThisWave: 0,
  maxEnemiesThisWave: 5,
  spawnDelay: 2000, // 2 seconds between spawns
};

/**
 * WaveSpawningSystem for ECS
 * Spawns enemies in waves for survivor gameplay
 */
export const WaveSpawningSystem = defineSystem((world: IWorld) => {
  const currentTime = Date.now();

  // Check if it's time to spawn next enemy
  if (currentTime < waveState.lastSpawnTime + waveState.spawnDelay) {
    return world;
  }

  // Check if current wave is complete
  if (waveState.enemiesThisWave >= waveState.maxEnemiesThisWave) {
    // Wait before starting next wave
    if (currentTime >= waveState.lastSpawnTime + 10000) {
      // 10 second break
      startNextWave();
    }
    return world;
  }

  // Spawn next enemy
  spawnWaveEnemy(world);
  waveState.lastSpawnTime = currentTime;
  waveState.enemiesThisWave++;

  return world;
});

/**
 * Start the next wave
 */
function startNextWave(): void {
  waveState.currentWave++;
  waveState.enemiesThisWave = 0;

  // Scale difficulty with wave number
  waveState.maxEnemiesThisWave = Math.floor(5 + waveState.currentWave * 1.5);
  waveState.spawnDelay = Math.max(500, 2000 - waveState.currentWave * 100);

  console.log(
    `Starting Wave ${waveState.currentWave} with ${waveState.maxEnemiesThisWave} enemies`
  );
}

/**
 * Spawn an enemy for the current wave
 */
function spawnWaveEnemy(world: IWorld): void {
  // Get spawn position around map edges
  const spawnPos = getRandomSpawnPosition();

  // Choose enemy type based on wave
  const enemyType = getEnemyTypeForWave(waveState.currentWave);
  const enemyLevel = Math.max(1, Math.floor(waveState.currentWave / 2) + 1);

  // Create NPC entity in ECS
  const npcId = createNPC(
    world,
    `${enemyType}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    spawnPos.x,
    spawnPos.y,
    enemyType
  );

  // Scale stats based on level
  scaleEnemyStats(npcId, enemyLevel);

  console.log(`Spawned ${enemyType} (Level ${enemyLevel}) at ${spawnPos.x}, ${spawnPos.y}`);
}

/**
 * Get random spawn position around map edges
 */
function getRandomSpawnPosition(): { x: number; y: number } {
  const mapWidth = 800; // pixels
  const mapHeight = 600; // pixels
  const margin = 50; // spawn outside visible area

  const side = Math.floor(Math.random() * 4); // 0=top, 1=right, 2=bottom, 3=left

  switch (side) {
    case 0: // Top
      return {
        x: Math.random() * mapWidth,
        y: -margin,
      };
    case 1: // Right
      return {
        x: mapWidth + margin,
        y: Math.random() * mapHeight,
      };
    case 2: // Bottom
      return {
        x: Math.random() * mapWidth,
        y: mapHeight + margin,
      };
    case 3: // Left
      return {
        x: -margin,
        y: Math.random() * mapHeight,
      };
    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Get enemy type for current wave
 */
function getEnemyTypeForWave(waveNumber: number): string {
  if (waveNumber <= 3) {
    return 'goblin';
  } else if (waveNumber <= 7) {
    return Math.random() < 0.6 ? 'goblin' : 'orc';
  } else {
    const rand = Math.random();
    if (rand < 0.4) return 'goblin';
    if (rand < 0.7) return 'orc';
    return 'skeleton';
  }
}

/**
 * Scale enemy stats based on level
 */
function scaleEnemyStats(entityId: number, level: number): void {
  // This would integrate with the ECS components
  // For now, we'll log the scaling
  console.log(`Scaling enemy ${entityId} to level ${level}`);

  // TODO: Apply level scaling to:
  // - Health.max and Health.current
  // - CombatStats.attack, strength, defence
  // - Combat level
}

/**
 * Get current wave information
 */
export function getCurrentWaveInfo(): WaveSpawnState {
  return { ...waveState };
}

/**
 * Reset wave system
 */
export function resetWaveSystem(): void {
  waveState = {
    lastSpawnTime: 0,
    currentWave: 0,
    enemiesThisWave: 0,
    maxEnemiesThisWave: 5,
    spawnDelay: 2000,
  };
}
