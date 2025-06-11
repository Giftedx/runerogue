/**
 * OSRS-ACCURATE SHARED TYPES
 * These MUST match OSRS data structures exactly for authenticity
 */

// Core position and movement
export interface Vector2 {
  x: number;
  y: number;
}

// OSRS skill levels (1-99)
export interface SkillLevel {
  level: number;
  xp: number;
  boosted?: number; // For potions/prayers
}

// OSRS combat stats (must match OSRS exactly)
export interface CombatStats {
  attack: SkillLevel;
  strength: SkillLevel;
  defence: SkillLevel;
  hitpoints: SkillLevel;
  ranged: SkillLevel;
  prayer: SkillLevel;
  magic: SkillLevel;
}

// OSRS equipment bonuses (exact format from game)
export interface EquipmentBonuses {
  // Attack bonuses
  attackStab: number;
  attackSlash: number;
  attackCrush: number;
  attackMagic: number;
  attackRanged: number;
  // Defence bonuses
  defenceStab: number;
  defenceSlash: number;
  defenceCrush: number;
  defenceMagic: number;
  defenceRanged: number;
  // Other bonuses
  meleeStrength: number;
  rangedStrength: number;
  magicDamage: number;
  prayer: number;
}

// OSRS item definition
export interface ItemData {
  id: number;
  name: string;
  examine: string;
  equipmentSlot?:
    | "weapon"
    | "helmet"
    | "chest"
    | "legs"
    | "shield"
    | "gloves"
    | "boots"
    | "ring"
    | "amulet";
  bonuses: EquipmentBonuses;
  attackSpeed?: number; // Weapon attack speed in game ticks
  attackRange?: number; // Weapon range in tiles
  specialAttack?: {
    energyCost: number; // 25%, 50%, etc.
    effect: string; // Special attack effect ID
  };
}

// Player equipment loadout
export interface Equipment {
  weapon?: ItemData;
  helmet?: ItemData;
  chest?: ItemData;
  legs?: ItemData;
  shield?: ItemData;
  gloves?: ItemData;
  boots?: ItemData;
  ring?: ItemData;
  amulet?: ItemData;
}

// OSRS prayer state
export interface PrayerState {
  points: number; // Current prayer points (0-99)
  activePrayers: string[]; // Active prayer names
  drainRate: number; // Points per second drain
}

// Complete player state for synchronization
export interface PlayerState {
  id: string;
  name: string;
  position: Vector2;
  health: {
    current: number;
    max: number;
  };
  stats: CombatStats;
  equipment: Equipment;
  prayer: PrayerState;
  specialAttack: {
    energy: number; // 0-100%
    available: boolean;
  };
  // Combat state
  target?: string; // Entity ID being attacked
  lastAttackTick: number;
  inCombat: boolean;
}

// Enemy types (OSRS creatures)
export type EnemyType =
  | "chicken"
  | "rat"
  | "spider"
  | "cow" // Wave 1-3
  | "goblin"
  | "imp"
  | "guard" // Wave 4-6
  | "wizard"
  | "dark_wizard"
  | "hobgoblin" // Wave 7-10
  | "hill_giant"
  | "moss_giant"
  | "fire_giant" // Wave 11-15
  | "lesser_demon"
  | "greater_demon"
  | "black_demon"; // Wave 16+;

// Enemy state for synchronization
export interface EnemyState {
  id: string;
  type: EnemyType;
  position: Vector2;
  health: {
    current: number;
    max: number;
  };
  combatLevel: number;
  stats: {
    attack: number;
    strength: number;
    defence: number;
    hitpoints: number;
  };
  bonuses: EquipmentBonuses;
  // AI state
  target?: string; // Player ID being attacked
  lastAttackTick: number;
  aggroRange: number;
}

// Complete game state
export interface GameState {
  players: Map<string, PlayerState>;
  enemies: Map<string, EnemyState>;
  wave: {
    current: number;
    enemiesRemaining: number;
    nextWaveIn: number; // Seconds until next wave
  };
  gameTime: {
    tick: number; // Game tick counter
    elapsed: number; // Total seconds elapsed
  };
}

// Network message types (client -> server)
export type ClientMessage =
  | { type: "move"; target: Vector2 }
  | { type: "attack"; targetId: string }
  | { type: "stopAttack" }
  | { type: "prayer"; action: "activate" | "deactivate"; prayer: string }
  | { type: "specialAttack"; targetId?: string }
  | { type: "equipItem"; itemId: number; slot: string }
  | { type: "chat"; message: string };

// Network message types (server -> client)
export type ServerMessage =
  | { type: "stateUpdate"; state: Partial<GameState> }
  | {
      type: "damage";
      attackerId: string;
      targetId: string;
      damage: number;
      hitType: "hit" | "max" | "miss";
    }
  | {
      type: "xpGain";
      skill: keyof CombatStats;
      amount: number;
      newLevel?: number;
    }
  | { type: "levelUp"; skill: keyof CombatStats; newLevel: number }
  | { type: "waveComplete"; wave: number; bonusXp: number }
  | {
      type: "waveStart";
      wave: number;
      enemyCount: number;
      enemyTypes: EnemyType[];
    }
  | { type: "playerDeath"; playerId: string; respawnIn: number }
  | {
      type: "gameOver";
      survivedWaves: number;
      totalXp: number;
      timePlayed: number;
    }
  | {
      type: "chatMessage";
      playerId: string;
      playerName: string;
      message: string;
    };

// Wave configuration
export interface WaveConfig {
  wave: number;
  enemyCount: number;
  enemyTypes: EnemyType[];
  spawnDelay: number; // MS between spawns
  combatLevelBonus: number; // Added to base enemy stats
  specialRules?: {
    fastSpawn?: boolean;
    eliteEnemies?: boolean;
    bossEnemy?: EnemyType;
  };
}

// Game settings
export interface GameSettings {
  maxPlayers: number;
  tickRate: number; // Server ticks per second (should be ~1.67 for OSRS accuracy)
  waveDelay: number; // Seconds between waves
  respawnTime: number; // Seconds to respawn after death
  xpMultiplier: number; // XP rate multiplier (1.0 = OSRS rates)
  friendlyFire: boolean;
}
