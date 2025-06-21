/**
 * Combat event interface for analytics/UI integration.
 */
export interface CombatEvent {
  attacker: number;
  defender: number;
  damage: number;
  hit: boolean;
  timestamp: number;
}
