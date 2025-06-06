/**
 * Core game types for the RuneScape Rogue Prime client
 */

export namespace GameTypes {
  /** Player skill types available in the game */
  export type SkillType = 'attack' | 'strength' | 'defence' | 'mining' | 'woodcutting' | 'fishing';

  /** Combat styles affecting XP distribution */
  export type CombatStyle = 'accurate' | 'aggressive' | 'defensive';

  /** Available biome types for procedural generation */
  export type BiomeType = 'lumbridge' | 'varrock' | 'wilderness';

  /** Monster types per biome */
  export type MonsterType =
    | 'goblin'
    | 'cow'
    | 'chicken'
    | 'guard'
    | 'thief'
    | 'rat'
    | 'skeleton'
    | 'spider'
    | 'demon';

  /** Resource types for gathering */
  export type ResourceType =
    | 'tree'
    | 'oak_tree'
    | 'rock'
    | 'iron_rock'
    | 'rune_rock'
    | 'fishing_spot'
    | 'fountain'
    | 'lava';

  /** Item types in the game */
  export type ItemType =
    | 'logs'
    | 'oak_logs'
    | 'copper_ore'
    | 'iron_ore'
    | 'raw_shrimp'
    | 'bones'
    | 'bronze_sword'
    | 'wooden_shield';

  /** Player skill data structure */
  export interface Skill {
    readonly level: number;
    readonly xp: number;
  }

  /** Immutable skill collection */
  export interface Skills {
    readonly attack: Skill;
    readonly strength: Skill;
    readonly defence: Skill;
    readonly mining: Skill;
    readonly woodcutting: Skill;
    readonly fishing: Skill;
  }

  /** Equipment slots */
  export interface Equipment {
    readonly weapon: ItemType | null;
    readonly armor: ItemType | null;
    readonly shield: ItemType | null;
  }

  /** Inventory item with quantity */
  export interface InventoryItem {
    readonly type: ItemType;
    readonly quantity: number;
  }

  /** Player position */
  export interface Position {
    readonly x: number;
    readonly y: number;
  }

  /** Player state - immutable for state management */
  export interface PlayerState {
    readonly id: string;
    readonly position: Position;
    readonly hp: number;
    readonly maxHp: number;
    readonly prayer: number;
    readonly maxPrayer: number;
    readonly energy: number;
    readonly maxEnergy: number;
    readonly gold: number;
    readonly skills: Skills;
    readonly inventory: ReadonlyArray<InventoryItem | null>;
    readonly equipped: Equipment;
    readonly combatStyle: CombatStyle;
    readonly isMoving: boolean;
    readonly targetPosition: Position | null;
    readonly inCombat: boolean;
    readonly currentTargetId: string | null;
  }

  /** Monster configuration */
  export interface MonsterConfig {
    readonly name: string;
    readonly hp: number;
    readonly maxHp: number;
    readonly attack: number;
    readonly strength: number;
    readonly defence: number;
    readonly color: string;
    readonly size: number;
    readonly aggression: number;
  }

  /** Monster entity */
  export interface MonsterEntity extends MonsterConfig {
    readonly id: string;
    readonly type: MonsterType;
    readonly position: Position;
    readonly targetId: string | null;
  }

  /** Resource configuration */
  export interface ResourceConfig {
    readonly name: string;
    readonly skill: SkillType;
    readonly level: number;
    readonly xp: number;
    readonly color: string;
    readonly respawnTime: number;
  }

  /** Resource entity */
  export interface ResourceEntity extends ResourceConfig {
    readonly id: string;
    readonly type: ResourceType;
    readonly position: Position;
    readonly depleted: boolean;
  }

  /** Biome configuration */
  export interface BiomeConfig {
    readonly name: string;
    readonly groundColor: string;
    readonly treeColor: string;
    readonly rockColor: string;
    readonly waterColor: string;
    readonly monsters: ReadonlyArray<MonsterType>;
    readonly resources: ReadonlyArray<ResourceType>;
  }

  /** Room tile */
  export interface Tile {
    readonly position: Position;
    readonly type: 'ground' | 'wall';
    readonly walkable: boolean;
  }

  /** Room exit */
  export interface RoomExit {
    readonly position: Position;
    readonly direction: 'north' | 'south' | 'east' | 'west';
  }

  /** Generated room */
  export interface Room {
    readonly id: string;
    readonly width: number;
    readonly height: number;
    readonly tiles: ReadonlyArray<Tile>;
    readonly exits: ReadonlyArray<RoomExit>;
    readonly monsters: ReadonlyArray<MonsterEntity>;
    readonly resources: ReadonlyArray<ResourceEntity>;
    readonly biome: BiomeType;
  }

  /** Game world state */
  export interface WorldState {
    readonly currentBiome: BiomeType;
    readonly seed: number;
    readonly rooms: ReadonlyArray<Room>;
    readonly currentRoomId: string | null;
  }

  /** UI damage splat */
  export interface DamageSplat {
    readonly position: Position;
    readonly value: number;
    readonly color: string;
    readonly timestamp: number;
  }

  /** UI skill popup */
  export interface SkillPopup {
    readonly position: Position;
    readonly text: string;
    readonly color?: string;
    readonly timestamp: number;
  }

  /** UI state */
  export interface UIState {
    readonly selectedInventorySlot: number | null;
    readonly damageNumbers: ReadonlyArray<DamageSplat>;
    readonly skillPopups: ReadonlyArray<SkillPopup>;
  }

  /** Complete game state */
  export interface GameState {
    readonly player: PlayerState;
    readonly world: WorldState;
    readonly ui: UIState;
  }
}
