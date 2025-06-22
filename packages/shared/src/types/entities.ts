export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  level: number; // Combat level (OSRS-authentic)
  attackLevel: number; // Attack stat
  strengthLevel: number; // Strength stat
  defenceLevel: number; // Defence stat
  hitpointsLevel: number; // Hitpoints stat
  attackSpeed: number; // Attack speed in ticks (OSRS-authentic)
  maxAttackRange: number; // Attack range in tiles
  targetPlayerId?: string;
  state: EnemyState;
  aiState: EnemyAIState;
  moveSpeed: number; // Movement speed (pixels/second)
  aggroRadius: number; // Aggression radius in pixels
}

export enum EnemyType {
  Goblin = "goblin",
  GiantRat = "giant_rat",
  Skeleton = "skeleton",
}

export enum EnemyState {
  Idle = "idle",
  Moving = "moving",
  Attacking = "attacking",
  Dead = "dead",
}

export enum EnemyAIState {
  Idle = "idle",
  Aggressive = "aggressive",
  Combat = "combat",
  Fleeing = "fleeing",
  Stunned = "stunned",
}

// Legacy wave interface - use Wave from waves.ts for new implementation
export interface LegacyWave {
  number: number;
  enemiesRemaining: number;
  enemiesTotal: number;
  isActive: boolean;
  nextWaveTime: number;
}

export interface EnemyTypeConfig {
  type: EnemyType;
  // OSRS-authentic stats
  level: number; // Combat level
  hitpoints: number; // HP level and max health
  attack: number; // Attack level
  strength: number; // Strength level
  defence: number; // Defence level
  attackSpeed: number; // Attack speed in ticks (4=2.4s, 5=3.0s, 6=3.6s)
  maxAttackRange: number; // Attack range in tiles
  // Combat bonuses (equipment-style bonuses)
  attackBonus: number; // Attack accuracy bonus
  strengthBonus: number; // Strength bonus for damage
  defenceBonus: number; // Defence bonus
  // AI behavior
  isAggressive: boolean; // Attacks players on sight
  aggroRadius: number; // Aggro radius in pixels
  moveSpeed: number; // Movement speed in pixels per second
  canFlee: boolean; // Can flee when low health
  fleeHealthThreshold: number; // Health % to start fleeing (0-100)
  // Spawning
  spawnWeight: number; // Relative spawn chance
  // Rendering
  size: { width: number; height: number };
  color: number; // Phaser color value for placeholder sprites
}

// OSRS-authentic enemy configurations
// All stats cross-referenced with OSRS Wiki
export const ENEMY_CONFIGS: Record<EnemyType, EnemyTypeConfig> = {
  [EnemyType.Goblin]: {
    type: EnemyType.Goblin,
    // OSRS Goblin (Level 2) stats
    level: 2,
    hitpoints: 5,
    attack: 1,
    strength: 1,
    defence: 1,
    attackSpeed: 4, // 2.4 seconds (fast)
    maxAttackRange: 1, // Melee range
    attackBonus: 0,
    strengthBonus: 0,
    defenceBonus: 0,
    // AI behavior
    isAggressive: true,
    aggroRadius: 100, // pixels
    moveSpeed: 60, // pixels/second
    canFlee: false,
    fleeHealthThreshold: 0,
    // Spawning
    spawnWeight: 70,
    // Rendering
    size: { width: 24, height: 24 },
    color: 0x228b22, // green
  },
  [EnemyType.GiantRat]: {
    type: EnemyType.GiantRat,
    // OSRS Giant Rat (Level 3) stats
    level: 3,
    hitpoints: 8,
    attack: 2,
    strength: 2,
    defence: 1,
    attackSpeed: 4, // 2.4 seconds
    maxAttackRange: 1, // Melee range
    attackBonus: 0,
    strengthBonus: 0,
    defenceBonus: 0,
    // AI behavior
    isAggressive: true,
    aggroRadius: 80, // pixels
    moveSpeed: 80, // pixels/second (faster than goblin)
    canFlee: false,
    fleeHealthThreshold: 0,
    // Spawning
    spawnWeight: 20,
    // Rendering
    size: { width: 20, height: 20 },
    color: 0x8b4513, // brown
  },
  [EnemyType.Skeleton]: {
    type: EnemyType.Skeleton,
    // OSRS Skeleton (Level 15) stats
    level: 15,
    hitpoints: 18,
    attack: 12,
    strength: 14,
    defence: 9,
    attackSpeed: 5, // 3.0 seconds (medium)
    maxAttackRange: 1, // Melee range
    attackBonus: 6, // Has weapon
    strengthBonus: 7, // Weapon strength bonus
    defenceBonus: 3, // Some armour
    // AI behavior
    isAggressive: true,
    aggroRadius: 120, // pixels (higher level = larger aggro)
    moveSpeed: 50, // pixels/second (slower but strong)
    canFlee: false,
    fleeHealthThreshold: 0,
    // Spawning
    spawnWeight: 10,
    // Rendering
    size: { width: 28, height: 28 },
    color: 0x808080, // gray
  },
};
