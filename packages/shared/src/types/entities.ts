export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  targetPlayerId?: string;
  state: EnemyState;
}

export enum EnemyType {
  Goblin = "goblin",
  Spider = "spider",
  Skeleton = "skeleton",
}

export enum EnemyState {
  Idle = "idle",
  Moving = "moving",
  Attacking = "attacking",
  Dead = "dead",
}

export interface Wave {
  number: number;
  enemiesRemaining: number;
  enemiesTotal: number;
  isActive: boolean;
  nextWaveTime: number;
}

export interface EnemyTypeConfig {
  type: EnemyType;
  health: number;
  damage: number;
  speed: number;
  spawnWeight: number;
  size: { width: number; height: number };
  color: number; // Phaser color value
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyTypeConfig> = {
  [EnemyType.Goblin]: {
    type: EnemyType.Goblin,
    health: 10,
    damage: 1,
    speed: 50,
    spawnWeight: 70,
    size: { width: 24, height: 24 },
    color: 0x228b22, // green
  },
  [EnemyType.Spider]: {
    type: EnemyType.Spider,
    health: 15,
    damage: 2,
    speed: 70,
    spawnWeight: 20,
    size: { width: 20, height: 20 },
    color: 0x8b4513, // brown
  },
  [EnemyType.Skeleton]: {
    type: EnemyType.Skeleton,
    health: 20,
    damage: 3,
    speed: 40,
    spawnWeight: 10,
    size: { width: 28, height: 28 },
    color: 0x808080, // gray
  },
};
