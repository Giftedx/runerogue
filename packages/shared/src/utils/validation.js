/**
 * Validation Utilities
 * Common validation functions for RuneRogue
 */
// import { OSRSCombatStats, OSRSEnemy } from '../types/osrs';
// These types are no longer exported from osrs.ts, so we comment out or remove related validation functions.
/**
 * Validate OSRS combat stats
 */
// export function validateCombatStats(stats: OSRSCombatStats): boolean {
//   return (
//     stats.attack >= 1 && stats.attack <= 99 &&
//     stats.strength >= 1 && stats.strength <= 99 &&
//     stats.defence >= 1 && stats.defence <= 99 &&
//     stats.hitpoints >= 10 && stats.hitpoints <= 99 &&
//     stats.prayer >= 1 && stats.prayer <= 99
//   );
// }
/**
 * Validate enemy data
 */
// export function validateEnemyData(enemy: OSRSEnemy): boolean {
//   return (
//     Boolean(enemy.id) && enemy.id.length > 0 &&
//     Boolean(enemy.name) && enemy.name.length > 0 &&
//     enemy.combatLevel >= 1 &&
//     enemy.hitpoints >= 1 &&
//     enemy.attackLevel >= 1 &&
//     enemy.defenceLevel >= 1 &&
//     enemy.maxHit >= 0 &&
//     enemy.attackSpeed >= 1
//   );
// }
/**
 * Validate calculation result
 */
export function validateCalculationResult(result) {
  return !isNaN(result) && isFinite(result) && result >= 0;
}
//# sourceMappingURL=validation.js.map
