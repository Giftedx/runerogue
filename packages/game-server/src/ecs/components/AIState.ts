import { defineComponent, Types } from "bitecs";

/**
 * AI State component for enemy entities.
 * Manages artificial intelligence behavior states and transitions.
 *
 * OSRS-inspired AI behaviors:
 * - Idle: Random movement, scanning for players
 * - Aggressive: Chase and attack players within aggro radius
 * - Combat: Actively fighting a target
 * - Fleeing: Retreating when low health (rare, boss-specific)
 * - Stunned: Temporarily disabled (e.g., from special attacks)
 */
export const AIState = defineComponent({
  // Current AI state (enum value)
  currentState: Types.ui8,

  // State timing
  stateEnterTime: Types.ui32, // When current state was entered (ms)
  stateExitTime: Types.ui32, // When to exit current state (0 = no limit)

  // Behavior modifiers
  isAggressive: Types.ui8, // Boolean: 1 if naturally aggressive, 0 otherwise
  canFlee: Types.ui8, // Boolean: 1 if can flee when low health, 0 otherwise
  fleeHealthThreshold: Types.ui8, // Health % to start fleeing (0-100)

  // Cooldowns
  lastTargetScanTime: Types.ui32, // Last time scanned for targets (ms)
  targetScanCooldown: Types.ui16, // Cooldown between target scans (ms)

  // State-specific data
  idleWanderTimer: Types.ui32, // Timer for random movement in idle state
  combatRetreatTimer: Types.ui32, // Timer for tactical retreats in combat
});

/**
 * Enemy AI state enumeration.
 * Maps to AIState.currentState values.
 */
export enum EnemyAIState {
  Idle = 0,
  Aggressive = 1,
  Combat = 2,
  Fleeing = 3,
  Stunned = 4,
  Dead = 5,
}

export default AIState;
