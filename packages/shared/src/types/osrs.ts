/**
 * OSRS-SPECIFIC CONSTANTS AND ENUMS
 * These MUST match OSRS exactly for authenticity
 */

// OSRS prayer names (exact spelling)
export enum Prayer {
  THICK_SKIN = "thick_skin",
  BURST_OF_STRENGTH = "burst_of_strength",
  CLARITY_OF_THOUGHT = "clarity_of_thought",
  SHARP_EYE = "sharp_eye",
  MYSTIC_WILL = "mystic_will",
  ROCK_SKIN = "rock_skin",
  SUPERHUMAN_STRENGTH = "superhuman_strength",
  IMPROVED_REFLEXES = "improved_reflexes",
  RAPID_RESTORE = "rapid_restore",
  RAPID_HEAL = "rapid_heal",
  PROTECT_ITEM = "protect_item",
  HAWK_EYE = "hawk_eye",
  MYSTIC_LORE = "mystic_lore",
  STEEL_SKIN = "steel_skin",
  ULTIMATE_STRENGTH = "ultimate_strength",
  INCREDIBLE_REFLEXES = "incredible_reflexes",
  PROTECT_FROM_MAGIC = "protect_from_magic",
  PROTECT_FROM_MISSILES = "protect_from_missiles",
  PROTECT_FROM_MELEE = "protect_from_melee",
  EAGLE_EYE = "eagle_eye",
  MYSTIC_MIGHT = "mystic_might",
  RETRIBUTION = "retribution",
  REDEMPTION = "redemption",
  SMITE = "smite",
  CHIVALRY = "chivalry",
  PIETY = "piety",
}

// Prayer effects (OSRS-accurate)
export interface PrayerEffect {
  drainRate: number; // Points per 3 seconds (OSRS standard)
  attackBonus?: number; // Percentage boost
  strengthBonus?: number;
  defenceBonus?: number;
  rangedBonus?: number;
  magicBonus?: number;
  protectionType?: "melee" | "ranged" | "magic";
  protectionAmount?: number; // Damage reduction percentage
}

export const PRAYER_EFFECTS: Record<Prayer, PrayerEffect> = {
  [Prayer.THICK_SKIN]: { drainRate: 1 / 6, defenceBonus: 0.05 },
  [Prayer.BURST_OF_STRENGTH]: { drainRate: 1 / 6, strengthBonus: 0.05 },
  [Prayer.CLARITY_OF_THOUGHT]: { drainRate: 1 / 6, attackBonus: 0.05 },
  [Prayer.SHARP_EYE]: { drainRate: 1 / 6, rangedBonus: 0.05 },
  [Prayer.MYSTIC_WILL]: { drainRate: 1 / 6, magicBonus: 0.05 },
  [Prayer.ROCK_SKIN]: { drainRate: 1 / 12, defenceBonus: 0.1 },
  [Prayer.SUPERHUMAN_STRENGTH]: { drainRate: 1 / 12, strengthBonus: 0.1 },
  [Prayer.IMPROVED_REFLEXES]: { drainRate: 1 / 12, attackBonus: 0.1 },
  [Prayer.RAPID_RESTORE]: { drainRate: 1 / 36 },
  [Prayer.RAPID_HEAL]: { drainRate: 1 / 18 },
  [Prayer.PROTECT_ITEM]: { drainRate: 1 / 18 },
  [Prayer.HAWK_EYE]: { drainRate: 1 / 18, rangedBonus: 0.1 },
  [Prayer.MYSTIC_LORE]: { drainRate: 1 / 18, magicBonus: 0.1 },
  [Prayer.STEEL_SKIN]: { drainRate: 1 / 24, defenceBonus: 0.15 },
  [Prayer.ULTIMATE_STRENGTH]: { drainRate: 1 / 24, strengthBonus: 0.15 },
  [Prayer.INCREDIBLE_REFLEXES]: { drainRate: 1 / 24, attackBonus: 0.15 },
  [Prayer.PROTECT_FROM_MAGIC]: {
    drainRate: 1 / 3,
    protectionType: "magic",
    protectionAmount: 1.0,
  },
  [Prayer.PROTECT_FROM_MISSILES]: {
    drainRate: 1 / 3,
    protectionType: "ranged",
    protectionAmount: 1.0,
  },
  [Prayer.PROTECT_FROM_MELEE]: {
    drainRate: 1 / 3,
    protectionType: "melee",
    protectionAmount: 1.0,
  },
  [Prayer.EAGLE_EYE]: { drainRate: 1 / 18, rangedBonus: 0.15 },
  [Prayer.MYSTIC_MIGHT]: { drainRate: 1 / 18, magicBonus: 0.15 },
  [Prayer.RETRIBUTION]: { drainRate: 1 / 12 },
  [Prayer.REDEMPTION]: { drainRate: 1 / 6 },
  [Prayer.SMITE]: { drainRate: 1 / 18 },
  [Prayer.CHIVALRY]: {
    drainRate: 1 / 6,
    attackBonus: 0.15,
    strengthBonus: 0.18,
    defenceBonus: 0.2,
  },
  [Prayer.PIETY]: {
    drainRate: 1 / 6,
    attackBonus: 0.2,
    strengthBonus: 0.23,
    defenceBonus: 0.25,
  },
};

// OSRS weapon attack speeds (in game ticks)
export const WEAPON_SPEEDS: Record<string, number> = {
  dagger: 4,
  shortsword: 4,
  scimitar: 4,
  sword: 5,
  longsword: 5,
  battleaxe: 6,
  mace: 5,
  warhammer: 6,
  spear: 5,
  halberd: 7,
  staff: 5,
  shortbow: 5,
  longbow: 6,
  crossbow: 5,
  dart: 3,
  javelin: 5,
  throwing_knife: 3,
};

// OSRS combat styles
export enum CombatStyle {
  ACCURATE = "accurate", // +3 attack levels
  AGGRESSIVE = "aggressive", // +3 strength levels
  DEFENSIVE = "defensive", // +3 defence levels
  CONTROLLED = "controlled", // +1 attack, strength, defence
}

// XP rates for different combat styles
export const COMBAT_XP_RATES = {
  [CombatStyle.ACCURATE]: {
    attack: 4,
    strength: 0,
    defence: 0,
    hitpoints: 1.33,
  },
  [CombatStyle.AGGRESSIVE]: {
    attack: 0,
    strength: 4,
    defence: 0,
    hitpoints: 1.33,
  },
  [CombatStyle.DEFENSIVE]: {
    attack: 0,
    strength: 0,
    defence: 4,
    hitpoints: 1.33,
  },
  [CombatStyle.CONTROLLED]: {
    attack: 1.33,
    strength: 1.33,
    defence: 1.33,
    hitpoints: 1.33,
  },
};

/**
 * OSRS Combat Stats Interface
 * Player combat levels for damage and accuracy calculations
 */
export interface OSRSCombatStats {
  attack: number;
  strength: number;
  defence: number;
  hitpoints: number;
  prayer: number;
  ranged?: number;
  magic?: number;
}

/**
 * OSRS Equipment Bonuses Interface
 * Equipment attack, strength, and defence bonuses
 */
export interface OSRSEquipmentBonuses {
  attackBonus: number; // Melee attack bonus
  strengthBonus: number; // Melee strength bonus
  defenceBonus: number; // Melee defence bonus

  // Optional specific attack bonuses
  attackStab?: number;
  attackSlash?: number;
  attackCrush?: number;
  attackMagic?: number;
  attackRanged?: number;

  // Optional defence bonuses
  defenceStab?: number;
  defenceSlash?: number;
  defenceCrush?: number;
  defenceMagic?: number;
  defenceRanged?: number;

  // Optional other bonuses
  rangedStrengthBonus?: number;
  magicDamageBonus?: number;
  prayerBonus?: number;
}
