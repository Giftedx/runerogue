/**
 * @file Defines the Enemy component for the ECS.
 */
import { defineComponent, Types } from "bitecs";

/**
 * Enemy component for ECS entities.
 * Tracks enemy-specific properties like type, AI state, and combat behavior.
 *
 * OSRS Authenticity: All enemy stats must match OSRS Wiki values exactly.
 * Component follows the bitECS pattern - entities must be registered with
 * `addComponent(world, Enemy, eid)` before setting component data.
 */
export const Enemy = defineComponent({
  // Enemy identification
  enemyType: Types.ui8, // EnemyType enum value
  level: Types.ui8, // Combat level (1-126)

  // AI state
  aiState: Types.ui8, // AIState enum value
  targetEid: Types.ui32, // Current target entity ID (0 = no target)
  lastAttackTime: Types.ui32, // Timestamp of last attack (ms)
  aggroRadius: Types.ui16, // Aggression radius in pixels

  // Combat timing
  attackSpeed: Types.ui8, // Attack speed in ticks (4-6 for most OSRS enemies)
  maxAttackRange: Types.ui16, // Maximum attack range in pixels

  // Movement
  moveSpeed: Types.f32, // Movement speed in pixels per second
  lastMoveTime: Types.ui32, // Last movement update timestamp

  // Pathfinding
  pathTargetX: Types.f32, // Target X position for pathfinding
  pathTargetY: Types.f32, // Target Y position for pathfinding
  isPathfinding: Types.ui8, // Boolean: 1 if currently pathfinding, 0 otherwise
});

/**
 * Type definitions for Enemy component fields.
 * This helps with TypeScript inference for component data access.
 */
export type EnemyComponent = {
  enemyType: number;
  level: number;
  aiState: number;
  targetEid: number;
  lastAttackTime: number;
  aggroRadius: number;
  attackSpeed: number;
  maxAttackRange: number;
  moveSpeed: number;
  lastMoveTime: number;
  pathTargetX: number;
  pathTargetY: number;
  isPathfinding: number;
};

/**
 * Type-safe helper functions for Enemy component access.
 * Use these to avoid TypeScript 'unknown' type warnings with bitECS.
 */
export const EnemyComponentUtils = {
  getEnemyType: (eid: number): number => Enemy.enemyType[eid] as number,
  setEnemyType: (eid: number, value: number) => {
    Enemy.enemyType[eid] = value as any;
  },

  getLevel: (eid: number): number => Enemy.level[eid] as number,
  setLevel: (eid: number, value: number) => {
    Enemy.level[eid] = value as any;
  },

  getAiState: (eid: number): number => Enemy.aiState[eid] as number,
  setAiState: (eid: number, value: number) => {
    Enemy.aiState[eid] = value as any;
  },

  getTargetEid: (eid: number): number => Enemy.targetEid[eid] as number,
  setTargetEid: (eid: number, value: number) => {
    Enemy.targetEid[eid] = value as any;
  },

  getLastAttackTime: (eid: number): number =>
    Enemy.lastAttackTime[eid] as number,
  setLastAttackTime: (eid: number, value: number) => {
    Enemy.lastAttackTime[eid] = value as any;
  },

  getAggroRadius: (eid: number): number => Enemy.aggroRadius[eid] as number,
  setAggroRadius: (eid: number, value: number) => {
    Enemy.aggroRadius[eid] = value as any;
  },

  getAttackSpeed: (eid: number): number => Enemy.attackSpeed[eid] as number,
  setAttackSpeed: (eid: number, value: number) => {
    Enemy.attackSpeed[eid] = value as any;
  },

  getMaxAttackRange: (eid: number): number =>
    Enemy.maxAttackRange[eid] as number,
  setMaxAttackRange: (eid: number, value: number) => {
    Enemy.maxAttackRange[eid] = value as any;
  },

  getMoveSpeed: (eid: number): number => Enemy.moveSpeed[eid] as number,
  setMoveSpeed: (eid: number, value: number) => {
    Enemy.moveSpeed[eid] = value as any;
  },

  getLastMoveTime: (eid: number): number => Enemy.lastMoveTime[eid] as number,
  setLastMoveTime: (eid: number, value: number) => {
    Enemy.lastMoveTime[eid] = value as any;
  },

  getPathTargetX: (eid: number): number => Enemy.pathTargetX[eid] as number,
  setPathTargetX: (eid: number, value: number) => {
    Enemy.pathTargetX[eid] = value as any;
  },

  getPathTargetY: (eid: number): number => Enemy.pathTargetY[eid] as number,
  setPathTargetY: (eid: number, value: number) => {
    Enemy.pathTargetY[eid] = value as any;
  },

  getIsPathfinding: (eid: number): number => Enemy.isPathfinding[eid] as number,
  setIsPathfinding: (eid: number, value: number) => {
    Enemy.isPathfinding[eid] = value as any;
  },
};

export default Enemy;
