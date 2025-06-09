/**
 * OSRS Combat Calculations
 * Must implement formulas exactly as specified in OSRS Wiki
 * 
 * @author agent/osrs-data (The Lorekeeper)
 * @wiki https://oldschool.runescape.wiki/w/Combat_level
 * @wiki https://oldschool.runescape.wiki/w/Damage_per_second/Melee
 */

import { OSRSCombatStats, OSRSEquipmentBonuses } from '../../../shared/src/types/osrs';

/**
 * Calculate maximum hit for melee combat
 * Formula must match OSRS Wiki exactly
 * 
 * @param stats Player combat stats
 * @param equipment Equipment bonuses
 * @param prayerMultiplier Prayer damage multiplier (1.0 = no prayer)
 * @param styleBonus Combat style bonus (0-3)
 * @returns Maximum damage that can be dealt
 */
export function calculateMaxHit(
  stats: OSRSCombatStats,
  equipment: OSRSEquipmentBonuses,
  prayerMultiplier: number = 1.0,
  styleBonus: number = 0
): number {
  // OSRS max hit formula
  // Effective strength = floor(strength * prayerMultiplier) + styleBonus + 8
  // Max hit = floor(0.5 + (effective_strength * (strength_bonus + 64)) / 640)
  
  const effectiveStrength = Math.floor(stats.strength * prayerMultiplier) + styleBonus + 8;
  const maxHit = Math.floor(0.5 + (effectiveStrength * (equipment.strengthBonus + 64)) / 640);
  
  return maxHit;
}

/**
 * Calculate combat accuracy (hit chance)
 * Formula must match OSRS Wiki exactly
 * 
 * @param attackerStats Attacker combat stats
 * @param attackerEquipment Attacker equipment bonuses
 * @param defenderStats Defender combat stats  
 * @param defenderEquipment Defender equipment bonuses
 * @param attackerPrayerMultiplier Attacker prayer multiplier (1.0 = no prayer)
 * @param defenderPrayerMultiplier Defender prayer multiplier (1.0 = no prayer)
 * @param attackerStyleBonus Attacker combat style bonus (0-3)
 * @param defenderStyleBonus Defender combat style bonus (0-3)
 * @returns Hit chance as decimal (0.0 to 1.0)
 */
export function calculateAccuracy(
  attackerStats: OSRSCombatStats,
  attackerEquipment: OSRSEquipmentBonuses,
  defenderStats: OSRSCombatStats,
  defenderEquipment: OSRSEquipmentBonuses,
  attackerPrayerMultiplier: number = 1.0,
  defenderPrayerMultiplier: number = 1.0,
  attackerStyleBonus: number = 0,
  defenderStyleBonus: number = 0
): number {
  // OSRS accuracy formula
  // Effective attack = floor(attack * prayerMultiplier) + styleBonus + 8
  // Max attack roll = effective_attack * (attack_bonus + 64)
  // Effective defence = floor(defence * prayerMultiplier) + styleBonus + 8  
  // Max defence roll = effective_defence * (defence_bonus + 64)
  
  const effectiveAttack = Math.floor(attackerStats.attack * attackerPrayerMultiplier) + attackerStyleBonus + 8;
  const maxAttackRoll = effectiveAttack * (attackerEquipment.attackBonus + 64);
  
  const effectiveDefence = Math.floor(defenderStats.defence * defenderPrayerMultiplier) + defenderStyleBonus + 8;
  const maxDefenceRoll = effectiveDefence * (defenderEquipment.defenceBonus + 64);
  
  // Calculate accuracy based on OSRS formula
  let accuracy: number;
  if (maxAttackRoll > maxDefenceRoll) {
    accuracy = 1 - (maxDefenceRoll + 2) / (2 * (maxAttackRoll + 1));
  } else {
    accuracy = maxAttackRoll / (2 * maxDefenceRoll + 1);
  }
  
  return Math.max(0, Math.min(1, accuracy));
}

/**
 * Calculate combat level
 * Formula must match OSRS Wiki exactly
 * 
 * @param stats Player combat stats
 * @returns Combat level (1-126)
 */
export function calculateCombatLevel(stats: OSRSCombatStats): number {
  // OSRS combat level formula
  const defenceLevel = stats.defence;
  const hitpointsLevel = stats.hitpoints;
  const prayerLevel = stats.prayer || 1;
  
  // Calculate base combat level
  const baseCombatLevel = (defenceLevel + hitpointsLevel + Math.floor(prayerLevel / 2)) * 0.25;
  
  // Calculate melee combat level
  const meleeCombatLevel = (stats.attack + stats.strength) * 0.325;
  
  // For now, assume melee combat (can extend for ranged/magic later)
  const combatLevel = Math.floor(baseCombatLevel + meleeCombatLevel);
  
  return Math.max(3, Math.min(126, combatLevel));
}

/**
 * Get attack speed for weapon type
 * Values must match OSRS Wiki exactly
 * 
 * @param weaponType Weapon type identifier
 * @returns Attack speed in ticks
 */
export function getAttackSpeed(weaponType: string): number {
  // OSRS weapon attack speeds (in ticks)
  const attackSpeeds: Record<string, number> = {
    // Fast weapons (4 ticks)
    'dagger': 4,
    'dragon_dagger': 4,
    'sword': 4,
    'bronze_sword': 4,
    'scimitar': 4,
    'dragon_scimitar': 4,
    
    // Medium weapons (5 ticks)
    'longsword': 5,
    'dragon_longsword': 5,
    'mace': 5,
    'rune_mace': 5,
    
    // Slow weapons (6+ ticks)
    'battleaxe': 6,
    'dragon_battleaxe': 6,
    'warhammer': 6,
    'dragon_warhammer': 6,
    'rune_2h_sword': 7,
    
    // Default cases
    'unarmed': 4,
    'default': 4
  };
  
  return attackSpeeds[weaponType.toLowerCase()] || attackSpeeds.default;
}