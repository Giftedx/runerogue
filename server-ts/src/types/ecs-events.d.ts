/**
 * Temporary types for missing ECS systems
 * These should be implemented as actual systems later
 */

export interface DamageNumberEvent {
  entity: number;
  damage: number;
  value: number; // alias for damage
  x: number;
  y: number;
  position: { x: number; y: number };
  type: 'damage' | 'heal' | 'miss';
  color?: string;
  isCritical?: boolean;
  sizeMultiplier?: number;
}

export interface HealthBarEvent {
  entity: number;
  entityId: number; // alias for entity
  currentHealth: number;
  maxHealth: number;
  x: number;
  y: number;
  isDead?: boolean;
  isHealthUpdate?: boolean;
  healthPercent: number;
}

export interface XPGainEvent {
  entity: number;
  skill: string;
  xpGained: number;
  newLevel?: number;
  x: number;
  y: number;
}
