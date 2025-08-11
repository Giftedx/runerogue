/**
 * OSRS Data Package - Main Entry Point
 * Canonical source of truth for all OSRS mechanics in RuneRogue
 *
 * @author agent/osrs-data (The Lorekeeper)
 * @package @runerogue/osrs-data
 */

// Gathering skills data and calculators
export * from "./skills/gathering-data";

// Combat calculators
export * from "./calculators/combat";

// Data API
export * from "./api/server";

// Enemies data loader
export { loadInitialEnemies, getEnemyById } from "./enemies";

// Wiki scrapers
export * from "./scrapers/wiki-scraper";

// Re-export types from shared package
export type { OSRSCombatStats, OSRSEquipmentBonuses } from "@runerogue/shared";

export interface OSRSEnemy {
  id: string;
  name: string;
  combatLevel: number;
  hitpoints: number;
  attackLevel: number;
  defenceLevel: number;
  attackBonus: number;
  defenceBonus: number;
  maxHit: number;
  attackSpeed: number;
  aggressive: boolean;
}

export interface CombatCalculationResult {
  maxHit: number;
  accuracy: number;
  attackSpeed: number;
}

// Constants for OSRS formulas
export const OSRS_CONSTANTS = {
  BASE_COMBAT_LEVEL: 3,
  MAX_SKILL_LEVEL: 99,
  BASE_MAX_HIT_DIVISOR: 2.5,
  ACCURACY_ROLL_MAX: 512,
} as const;

/**
 * Initial enemy IDs that must be implemented
 */
export const INITIAL_ENEMIES = [
  "goblin",
  "cow",
  "chicken",
  "giant_rat",
  "zombie",
] as const;

export type InitialEnemyId = (typeof INITIAL_ENEMIES)[number];
