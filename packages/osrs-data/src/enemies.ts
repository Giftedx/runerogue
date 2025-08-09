/**
 * OSRS Enemy Data Loader
 * Loads and provides access to OSRS-authentic enemy data for use in game systems.
 *
 * @author agent/osrs-data (The Lorekeeper)
 */

import path from "path";
import fs from "fs";

export interface OSRSEnemyData {
  id: string;
  name: string;
  description: string;
  combatLevel: number;
  hitpoints: number;
  maxHit: number;
  attackSpeed: number;
  aggressive: boolean;
  attackType: string;
  stats: {
    attack: number;
    strength: number;
    defence: number;
    hitpoints: number;
    prayer: number;
  };
  bonuses: {
    attackBonus: number;
    strengthBonus: number;
    defenceBonus: number;
  };
  loot: {
    item: string;
    chance: number;
    quantity: number;
  }[];
  experience: {
    attack: number;
    strength: number;
    defence: number;
    hitpoints: number;
  };
  spawns: {
    locations: string[];
    frequency: string;
  };
}

/**
 * Loads all initial OSRS enemies from the canonical JSON data file.
 * @returns Record<string, OSRSEnemyData>
 */
export function loadInitialEnemies(): Record<string, OSRSEnemyData> {
  const dataPath = path.resolve(
    __dirname,
    "../data/enemies/initial-enemies.json",
  );
  const raw = fs.readFileSync(dataPath, "utf-8");
  const parsed = JSON.parse(raw) as { enemies: Record<string, OSRSEnemyData> };
  return parsed.enemies;
}

/**
 * Get a single OSRS enemy by ID.
 * @param id Enemy ID (e.g., 'goblin')
 * @returns OSRSEnemyData | undefined
 */
export function getEnemyById(id: string): OSRSEnemyData | undefined {
  const all = loadInitialEnemies();
  return all[id];
}
