import { EnemyType } from "./entities";

/**
 * Wave progression system for RuneRogue.
 * OSRS-inspired wave scaling with authentic enemy combinations.
 */

export interface Wave {
  number: number;
  enemiesRemaining: number;
  enemiesTotal: number;
  isActive: boolean;
  nextWaveTime: number;
  rewards: WaveRewards;
}

export interface WaveRewards {
  xpReward: number; // Total XP for completing wave
  goldReward: number; // Gold pieces (future)
  itemDrops: string[]; // Item IDs (future)
}

export interface EnemySpawnConfig {
  type: EnemyType;
  count: number;
  spawnDelay: number; // Delay between spawns (ms)
  spawnRadius: number; // Spawn radius from center (pixels)
}

export interface WaveConfig {
  waveNumber: number;
  enemies: EnemySpawnConfig[];
  rewards: WaveRewards;
  timeBeforeNextWave: number; // Rest time between waves (ms)
  difficultyMultiplier: number; // Multiplier for enemy stats
}

/**
 * OSRS-inspired wave progression.
 * Starts with low-level enemies and gradually increases difficulty.
 * Every 5 waves introduces a new enemy type or boss variant.
 */
export const WAVE_CONFIGS: WaveConfig[] = [
  // Wave 1: Tutorial wave - 3 Goblins
  {
    waveNumber: 1,
    enemies: [
      {
        type: EnemyType.Goblin,
        count: 3,
        spawnDelay: 1000, // 1 second between spawns
        spawnRadius: 200,
      },
    ],
    rewards: {
      xpReward: 30, // 10 XP per goblin
      goldReward: 15,
      itemDrops: [],
    },
    timeBeforeNextWave: 5000, // 5 seconds rest
    difficultyMultiplier: 1.0,
  },

  // Wave 2: Mixed enemies - 5 Goblins + 1 Giant Rat
  {
    waveNumber: 2,
    enemies: [
      {
        type: EnemyType.Goblin,
        count: 5,
        spawnDelay: 800,
        spawnRadius: 220,
      },
      {
        type: EnemyType.GiantRat,
        count: 1,
        spawnDelay: 2000,
        spawnRadius: 200,
      },
    ],
    rewards: {
      xpReward: 60, // 50 + 10 bonus
      goldReward: 30,
      itemDrops: [],
    },
    timeBeforeNextWave: 6000,
    difficultyMultiplier: 1.0,
  },

  // Wave 3: Challenging - 2 Skeletons
  {
    waveNumber: 3,
    enemies: [
      {
        type: EnemyType.Skeleton,
        count: 2,
        spawnDelay: 1500,
        spawnRadius: 180,
      },
    ],
    rewards: {
      xpReward: 100, // Higher XP for tougher enemies
      goldReward: 50,
      itemDrops: [],
    },
    timeBeforeNextWave: 8000,
    difficultyMultiplier: 1.0,
  },

  // Wave 4: Swarm - 8 Goblins + 2 Giant Rats
  {
    waveNumber: 4,
    enemies: [
      {
        type: EnemyType.Goblin,
        count: 8,
        spawnDelay: 600,
        spawnRadius: 250,
      },
      {
        type: EnemyType.GiantRat,
        count: 2,
        spawnDelay: 1200,
        spawnRadius: 200,
      },
    ],
    rewards: {
      xpReward: 120,
      goldReward: 60,
      itemDrops: [],
    },
    timeBeforeNextWave: 10000,
    difficultyMultiplier: 1.1, // 10% stronger
  },

  // Wave 5: Boss wave - 1 Strong Skeleton + 4 Goblins
  {
    waveNumber: 5,
    enemies: [
      {
        type: EnemyType.Skeleton,
        count: 1,
        spawnDelay: 0,
        spawnRadius: 150,
      },
      {
        type: EnemyType.Goblin,
        count: 4,
        spawnDelay: 1000,
        spawnRadius: 220,
      },
    ],
    rewards: {
      xpReward: 200, // Boss wave bonus
      goldReward: 100,
      itemDrops: ["bronze_sword"], // First equipment drop
    },
    timeBeforeNextWave: 15000, // Longer rest after boss
    difficultyMultiplier: 1.2, // 20% stronger
  },
];

/**
 * Generates wave config for waves beyond the predefined ones.
 * Implements exponential scaling with enemy variety.
 */
export function generateWaveConfig(waveNumber: number): WaveConfig {
  const baseWave = WAVE_CONFIGS[4]; // Use wave 5 as template
  const scalingFactor = Math.pow(1.15, waveNumber - 5); // 15% increase per wave

  // Determine enemy composition based on wave number
  const enemies: EnemySpawnConfig[] = [];

  if (waveNumber % 5 === 0) {
    // Boss waves every 5 waves
    enemies.push({
      type: EnemyType.Skeleton,
      count: Math.floor(1 + waveNumber / 10),
      spawnDelay: 2000,
      spawnRadius: 150,
    });
    enemies.push({
      type: EnemyType.GiantRat,
      count: Math.floor(2 + waveNumber / 8),
      spawnDelay: 1000,
      spawnRadius: 200,
    });
  } else {
    // Regular waves
    enemies.push({
      type: EnemyType.Goblin,
      count: Math.floor(3 + waveNumber / 2),
      spawnDelay: 800,
      spawnRadius: 220,
    });

    if (waveNumber > 2) {
      enemies.push({
        type: EnemyType.GiantRat,
        count: Math.floor(1 + waveNumber / 4),
        spawnDelay: 1200,
        spawnRadius: 200,
      });
    }

    if (waveNumber > 6) {
      enemies.push({
        type: EnemyType.Skeleton,
        count: Math.floor(waveNumber / 6),
        spawnDelay: 1500,
        spawnRadius: 180,
      });
    }
  }

  return {
    waveNumber,
    enemies,
    rewards: {
      xpReward: Math.floor(baseWave.rewards.xpReward * scalingFactor),
      goldReward: Math.floor(baseWave.rewards.goldReward * scalingFactor),
      itemDrops: waveNumber % 5 === 0 ? [`wave_${waveNumber}_reward`] : [],
    },
    timeBeforeNextWave: waveNumber % 5 === 0 ? 20000 : 8000,
    difficultyMultiplier: Math.min(2.0, 1.0 + (waveNumber - 1) * 0.1), // Cap at 2x
  };
}

/**
 * Calculates the total number of enemies for a wave.
 */
export function getTotalEnemiesInWave(wave: WaveConfig): number {
  return wave.enemies.reduce((total, enemy) => total + enemy.count, 0);
}

/**
 * Gets the appropriate wave config for a given wave number.
 */
export function getWaveConfig(waveNumber: number): WaveConfig {
  if (waveNumber <= WAVE_CONFIGS.length) {
    return WAVE_CONFIGS[waveNumber - 1];
  }
  return generateWaveConfig(waveNumber);
}
