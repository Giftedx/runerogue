import { defineQuery, defineSystem, IWorld } from 'bitecs';
import {
  Player,
  SkillLevels,
  Prayer,
  PrayerFlag,
  isPrayerActive,
  activatePrayer,
  deactivatePrayer,
} from '../components';

// Query for players with active prayers
const activePrayersQuery = defineQuery([Player, Prayer, SkillLevels]);

// Prayer drain rates (points per minute)
const PRAYER_DRAIN_RATES: { [key in keyof typeof PrayerFlag]?: number } = {
  // Protection prayers
  [PrayerFlag.PROTECT_FROM_MELEE]: 2,
  [PrayerFlag.PROTECT_FROM_MISSILES]: 2,
  [PrayerFlag.PROTECT_FROM_MAGIC]: 2,

  // Offensive prayers
  [PrayerFlag.BURST_OF_STRENGTH]: 1,
  [PrayerFlag.SUPERHUMAN_STRENGTH]: 2,
  [PrayerFlag.ULTIMATE_STRENGTH]: 4,

  // Attack prayers
  [PrayerFlag.CLARITY_OF_THOUGHT]: 1,
  [PrayerFlag.IMPROVED_REFLEXES]: 2,
  [PrayerFlag.INCREDIBLE_REFLEXES]: 4,

  // Defence prayers
  [PrayerFlag.THICK_SKIN]: 1,
  [PrayerFlag.ROCK_SKIN]: 2,
  [PrayerFlag.STEEL_SKIN]: 4,

  // Other prayers
  [PrayerFlag.SHARP_EYE]: 1,
  [PrayerFlag.EAGLE_EYE]: 3,
  [PrayerFlag.MYSTIC_WILL]: 1,
  [PrayerFlag.MYSTIC_MIGHT]: 3,

  // Advanced prayers
  [PrayerFlag.CHIVALRY]: 6,
  [PrayerFlag.PIETY]: 8,
  [PrayerFlag.RIGOUR]: 8,
  [PrayerFlag.AUGURY]: 8,
};

// Prayer requirements (level needed)
const PRAYER_REQUIREMENTS: { [key in keyof typeof PrayerFlag]?: number } = {
  [PrayerFlag.THICK_SKIN]: 1,
  [PrayerFlag.BURST_OF_STRENGTH]: 4,
  [PrayerFlag.CLARITY_OF_THOUGHT]: 7,
  [PrayerFlag.SHARP_EYE]: 8,
  [PrayerFlag.MYSTIC_WILL]: 9,
  [PrayerFlag.ROCK_SKIN]: 10,
  [PrayerFlag.SUPERHUMAN_STRENGTH]: 13,
  [PrayerFlag.IMPROVED_REFLEXES]: 16,
  [PrayerFlag.PROTECT_FROM_MAGIC]: 37,
  [PrayerFlag.PROTECT_FROM_MISSILES]: 40,
  [PrayerFlag.PROTECT_FROM_MELEE]: 43,
  [PrayerFlag.EAGLE_EYE]: 44,
  [PrayerFlag.MYSTIC_MIGHT]: 45,
  [PrayerFlag.STEEL_SKIN]: 28,
  [PrayerFlag.ULTIMATE_STRENGTH]: 31,
  [PrayerFlag.INCREDIBLE_REFLEXES]: 34,
  [PrayerFlag.CHIVALRY]: 60,
  [PrayerFlag.PIETY]: 70,
  [PrayerFlag.RIGOUR]: 74,
  [PrayerFlag.AUGURY]: 77,
};

// Conflicting prayer groups
const PRAYER_CONFLICTS: { [key in keyof typeof PrayerFlag]?: Array<keyof typeof PrayerFlag> } = {
  // Attack prayers conflict with each other
  [PrayerFlag.CLARITY_OF_THOUGHT]: [PrayerFlag.IMPROVED_REFLEXES, PrayerFlag.INCREDIBLE_REFLEXES],
  [PrayerFlag.IMPROVED_REFLEXES]: [PrayerFlag.CLARITY_OF_THOUGHT, PrayerFlag.INCREDIBLE_REFLEXES],
  [PrayerFlag.INCREDIBLE_REFLEXES]: [PrayerFlag.CLARITY_OF_THOUGHT, PrayerFlag.IMPROVED_REFLEXES],

  // Strength prayers conflict with each other
  [PrayerFlag.BURST_OF_STRENGTH]: [PrayerFlag.SUPERHUMAN_STRENGTH, PrayerFlag.ULTIMATE_STRENGTH],
  [PrayerFlag.SUPERHUMAN_STRENGTH]: [PrayerFlag.BURST_OF_STRENGTH, PrayerFlag.ULTIMATE_STRENGTH],
  [PrayerFlag.ULTIMATE_STRENGTH]: [PrayerFlag.BURST_OF_STRENGTH, PrayerFlag.SUPERHUMAN_STRENGTH],

  // Defence prayers conflict with each other
  [PrayerFlag.THICK_SKIN]: [PrayerFlag.ROCK_SKIN, PrayerFlag.STEEL_SKIN],
  [PrayerFlag.ROCK_SKIN]: [PrayerFlag.THICK_SKIN, PrayerFlag.STEEL_SKIN],
  [PrayerFlag.STEEL_SKIN]: [PrayerFlag.THICK_SKIN, PrayerFlag.ROCK_SKIN],

  // Protection prayers conflict with each other
  [PrayerFlag.PROTECT_FROM_MELEE]: [
    PrayerFlag.PROTECT_FROM_MISSILES,
    PrayerFlag.PROTECT_FROM_MAGIC,
  ],
  [PrayerFlag.PROTECT_FROM_MISSILES]: [
    PrayerFlag.PROTECT_FROM_MELEE,
    PrayerFlag.PROTECT_FROM_MAGIC,
  ],
  [PrayerFlag.PROTECT_FROM_MAGIC]: [
    PrayerFlag.PROTECT_FROM_MELEE,
    PrayerFlag.PROTECT_FROM_MISSILES,
  ],

  // Advanced prayers conflict with basic ones
  [PrayerFlag.CHIVALRY]: [
    PrayerFlag.CLARITY_OF_THOUGHT,
    PrayerFlag.IMPROVED_REFLEXES,
    PrayerFlag.INCREDIBLE_REFLEXES,
    PrayerFlag.BURST_OF_STRENGTH,
    PrayerFlag.SUPERHUMAN_STRENGTH,
    PrayerFlag.ULTIMATE_STRENGTH,
    PrayerFlag.THICK_SKIN,
    PrayerFlag.ROCK_SKIN,
    PrayerFlag.STEEL_SKIN,
    PrayerFlag.PIETY,
  ],
  [PrayerFlag.PIETY]: [
    PrayerFlag.CLARITY_OF_THOUGHT,
    PrayerFlag.IMPROVED_REFLEXES,
    PrayerFlag.INCREDIBLE_REFLEXES,
    PrayerFlag.BURST_OF_STRENGTH,
    PrayerFlag.SUPERHUMAN_STRENGTH,
    PrayerFlag.ULTIMATE_STRENGTH,
    PrayerFlag.THICK_SKIN,
    PrayerFlag.ROCK_SKIN,
    PrayerFlag.STEEL_SKIN,
    PrayerFlag.CHIVALRY,
  ],
};

// Track last prayer drain time
const lastDrainTime = new Map<number, number>();

/**
 * PrayerSystem - Handles prayer activation, deactivation, and point drain
 */
/**
 * PrayerSystem - Handles prayer activation, deactivation, and point drain
 */
export const PrayerSystem = defineSystem((world: IWorld) => {
  const currentTime = Date.now();
  const players = activePrayersQuery(world);

  for (let i = 0; i < players.length; i++) {
    const playerId = players[i];
    const prayers = Prayer.activeMask[playerId];

    // Skip if no prayers are active
    if (prayers === 0) {
      continue;
    }

    // Calculate prayer drain
    const prayerLevel = SkillLevels.prayer[playerId];
    if (prayerLevel <= 0) {
      // No prayer points, deactivate all prayers
      Prayer.activeMask[playerId] = 0;
      continue;
    }

    // Calculate total drain rate
    let totalDrainRate = 0;
    for (const [flag, drainRate] of Object.entries(PRAYER_DRAIN_RATES)) {
      const prayerFlag = PrayerFlag[flag as keyof typeof PrayerFlag];
      if (isPrayerActive(prayers, prayerFlag)) {
        totalDrainRate += drainRate as number;
      }
    }

    // Apply prayer bonus (items/equipment can reduce drain rate)
    // TODO: Get from equipment bonuses
    const prayerBonus = 0;
    const drainReduction = 1 + (prayerBonus * 2) / 60;
    const effectiveDrainRate = totalDrainRate / drainReduction;

    // Drain prayer points
    const lastDrain = lastDrainTime.get(playerId) || currentTime;
    const timeSinceLastDrain = (currentTime - lastDrain) / 1000; // Convert to seconds
    const pointsToDrain = (effectiveDrainRate / 60) * timeSinceLastDrain;

    if (pointsToDrain >= 1) {
      const newPrayerLevel = Math.max(0, prayerLevel - Math.floor(pointsToDrain));
      SkillLevels.prayer[playerId] = newPrayerLevel;
      lastDrainTime.set(playerId, currentTime);

      // If out of prayer points, deactivate all prayers
      if (newPrayerLevel === 0) {
        Prayer.activeMask[playerId] = 0;
      }
    }
  }

  return world;
});

/**
 * Activate a prayer for a player
 */
export function activatePlayerPrayer(
  world: IWorld,
  playerId: number,
  prayer: keyof typeof PrayerFlag
): boolean {
  // Check if player has the required prayer level
  const prayerLevel = SkillLevels.prayer[playerId];
  const requiredLevel = PRAYER_REQUIREMENTS[prayer] || 1;

  if (prayerLevel < requiredLevel) {
    return false;
  }

  // Check if player has prayer points
  if (prayerLevel <= 0) {
    return false;
  }

  let currentPrayers = Prayer.activeMask[playerId] || 0;

  // Deactivate conflicting prayers
  const conflicts = PRAYER_CONFLICTS[prayer];
  if (conflicts) {
    for (const conflictingPrayer of conflicts) {
      currentPrayers = deactivatePrayer(currentPrayers, PrayerFlag[conflictingPrayer]);
    }
  }

  // Activate the prayer
  Prayer.activeMask[playerId] = activatePrayer(currentPrayers, PrayerFlag[prayer]);
  return true;
}

/**
 * Deactivate a prayer for a player
 */
export function deactivatePlayerPrayer(
  world: IWorld,
  playerId: number,
  prayer: keyof typeof PrayerFlag
): void {
  const currentPrayers = Prayer.activeMask[playerId] || 0;
  Prayer.activeMask[playerId] = deactivatePrayer(currentPrayers, PrayerFlag[prayer]);
}

/**
 * Deactivate all prayers for a player
 */
export function deactivateAllPrayers(world: IWorld, playerId: number): void {
  Prayer.activeMask[playerId] = 0;
}

/**
 * Get list of active prayers for a player
 */
export function getActivePrayers(world: IWorld, playerId: number): Array<keyof typeof PrayerFlag> {
  const prayers = Prayer.activeMask[playerId] || 0;
  const activePrayers: Array<keyof typeof PrayerFlag> = [];
  for (const flagKey of Object.keys(PrayerFlag) as Array<keyof typeof PrayerFlag>) {
    const flag = PrayerFlag[flagKey];
    if (isPrayerActive(prayers, flag)) {
      activePrayers.push(flagKey);
    }
  }
  return activePrayers;
}

/**
 * Check if a player can activate a prayer
 */
export function canActivatePrayer(
  world: IWorld,
  playerId: number,
  prayer: keyof typeof PrayerFlag
): boolean {
  const prayerLevel = SkillLevels.prayer[playerId];
  const requiredLevel = PRAYER_REQUIREMENTS[prayer] || 1;
  return prayerLevel >= requiredLevel && prayerLevel > 0;
}
