/**
 * OSRS-ACCURATE SHARED TYPES
 * These MUST match OSRS data structures exactly for authenticity
 */
export interface Vector2 {
  x: number;
  y: number;
}
export interface SkillLevel {
  level: number;
  xp: number;
  boosted?: number;
}
export interface CombatStats {
  attack: SkillLevel;
  strength: SkillLevel;
  defence: SkillLevel;
  hitpoints: SkillLevel;
  ranged: SkillLevel;
  prayer: SkillLevel;
  magic: SkillLevel;
}
export interface EquipmentBonuses {
  attackStab: number;
  attackSlash: number;
  attackCrush: number;
  attackMagic: number;
  attackRanged: number;
  defenceStab: number;
  defenceSlash: number;
  defenceCrush: number;
  defenceMagic: number;
  defenceRanged: number;
  meleeStrength: number;
  rangedStrength: number;
  magicDamage: number;
  prayer: number;
}
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
  attackSpeed?: number;
  attackRange?: number;
  specialAttack?: {
    energyCost: number;
    effect: string;
  };
}
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
export interface PrayerState {
  points: number;
  activePrayers: string[];
  drainRate: number;
}
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
    energy: number;
    available: boolean;
  };
  target?: string;
  lastAttackTick: number;
  inCombat: boolean;
}
export type EnemyType =
  | "chicken"
  | "rat"
  | "spider"
  | "cow"
  | "goblin"
  | "imp"
  | "guard"
  | "wizard"
  | "dark_wizard"
  | "hobgoblin"
  | "hill_giant"
  | "moss_giant"
  | "fire_giant"
  | "lesser_demon"
  | "greater_demon"
  | "black_demon";
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
  target?: string;
  lastAttackTick: number;
  aggroRange: number;
}
export interface GameState {
  players: Map<string, PlayerState>;
  enemies: Map<string, EnemyState>;
  wave: {
    current: number;
    enemiesRemaining: number;
    nextWaveIn: number;
  };
  gameTime: {
    tick: number;
    elapsed: number;
  };
}
export type ClientMessage =
  | {
      type: "move";
      target: Vector2;
    }
  | {
      type: "attack";
      targetId: string;
    }
  | {
      type: "stopAttack";
    }
  | {
      type: "prayer";
      action: "activate" | "deactivate";
      prayer: string;
    }
  | {
      type: "specialAttack";
      targetId?: string;
    }
  | {
      type: "equipItem";
      itemId: number;
      slot: string;
    }
  | {
      type: "chat";
      message: string;
    };
export type ServerMessage =
  | {
      type: "stateUpdate";
      state: Partial<GameState>;
    }
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
  | {
      type: "levelUp";
      skill: keyof CombatStats;
      newLevel: number;
    }
  | {
      type: "waveComplete";
      wave: number;
      bonusXp: number;
    }
  | {
      type: "waveStart";
      wave: number;
      enemyCount: number;
      enemyTypes: EnemyType[];
    }
  | {
      type: "playerDeath";
      playerId: string;
      respawnIn: number;
    }
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
export interface WaveConfig {
  wave: number;
  enemyCount: number;
  enemyTypes: EnemyType[];
  spawnDelay: number;
  combatLevelBonus: number;
  specialRules?: {
    fastSpawn?: boolean;
    eliteEnemies?: boolean;
    bossEnemy?: EnemyType;
  };
}
export interface GameSettings {
  maxPlayers: number;
  tickRate: number;
  waveDelay: number;
  respawnTime: number;
  xpMultiplier: number;
  friendlyFire: boolean;
}
