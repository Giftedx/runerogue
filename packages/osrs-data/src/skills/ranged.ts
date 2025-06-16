/**
 * OSRS Ranged System - Complete ranged combat and weapon database
 * Data sourced from OSRS Wiki for authenticity
 *
 * @author RuneRogue Development Team
 * @package @runerogue/osrs-data
 */

export interface RangedWeapon {
  id: number;
  name: string;
  level: number;
  attackSpeed: number; // In game ticks
  rangedBonus: number;
  strengthBonus: number;
  ammunitionType: "arrow" | "bolt" | "thrown" | "dart" | "none";
  special?: boolean;
  twoHanded: boolean;
}

export interface Ammunition {
  id: number;
  name: string;
  level: number;
  strengthBonus: number;
  type: "arrow" | "bolt" | "thrown" | "dart";
  special?: boolean;
}

export interface RangedAttackStyle {
  name: string;
  type: "accurate" | "rapid" | "longrange";
  experienceType: "ranged" | "defence";
  accuracyBonus: number;
  strengthBonus: number;
  defenceBonus: number;
  rangeBonus: number;
}

// Ranged weapons from bronze to rune tier
export const RANGED_WEAPONS: RangedWeapon[] = [
  // Shortbows
  {
    id: 841,
    name: "Shortbow",
    level: 1,
    attackSpeed: 5,
    rangedBonus: 8,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 843,
    name: "Oak shortbow",
    level: 5,
    attackSpeed: 5,
    rangedBonus: 14,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 849,
    name: "Willow shortbow",
    level: 20,
    attackSpeed: 5,
    rangedBonus: 20,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 853,
    name: "Maple shortbow",
    level: 30,
    attackSpeed: 5,
    rangedBonus: 29,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 857,
    name: "Yew shortbow",
    level: 40,
    attackSpeed: 5,
    rangedBonus: 47,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 861,
    name: "Magic shortbow",
    level: 50,
    attackSpeed: 5,
    rangedBonus: 69,
    strengthBonus: 0,
    ammunitionType: "arrow",
    special: true,
    twoHanded: true,
  },

  // Longbows
  {
    id: 839,
    name: "Longbow",
    level: 1,
    attackSpeed: 6,
    rangedBonus: 12,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 845,
    name: "Oak longbow",
    level: 5,
    attackSpeed: 6,
    rangedBonus: 17,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 847,
    name: "Willow longbow",
    level: 20,
    attackSpeed: 6,
    rangedBonus: 26,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 851,
    name: "Maple longbow",
    level: 30,
    attackSpeed: 6,
    rangedBonus: 41,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 855,
    name: "Yew longbow",
    level: 40,
    attackSpeed: 6,
    rangedBonus: 60,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },
  {
    id: 859,
    name: "Magic longbow",
    level: 50,
    attackSpeed: 6,
    rangedBonus: 83,
    strengthBonus: 0,
    ammunitionType: "arrow",
    twoHanded: true,
  },

  // Crossbows
  {
    id: 9174,
    name: "Bronze crossbow",
    level: 1,
    attackSpeed: 5,
    rangedBonus: 18,
    strengthBonus: 0,
    ammunitionType: "bolt",
    twoHanded: true,
  },
  {
    id: 9177,
    name: "Iron crossbow",
    level: 1,
    attackSpeed: 5,
    rangedBonus: 46,
    strengthBonus: 0,
    ammunitionType: "bolt",
    twoHanded: true,
  },
  {
    id: 9179,
    name: "Steel crossbow",
    level: 5,
    attackSpeed: 5,
    rangedBonus: 54,
    strengthBonus: 0,
    ammunitionType: "bolt",
    twoHanded: true,
  },
  {
    id: 9181,
    name: "Mithril crossbow",
    level: 20,
    attackSpeed: 5,
    rangedBonus: 62,
    strengthBonus: 0,
    ammunitionType: "bolt",
    twoHanded: true,
  },
  {
    id: 9183,
    name: "Adamant crossbow",
    level: 30,
    attackSpeed: 5,
    rangedBonus: 78,
    strengthBonus: 0,
    ammunitionType: "bolt",
    twoHanded: true,
  },
  {
    id: 9185,
    name: "Rune crossbow",
    level: 61,
    attackSpeed: 5,
    rangedBonus: 90,
    strengthBonus: 0,
    ammunitionType: "bolt",
    twoHanded: true,
  },
];

// Arrows and bolts
export const AMMUNITION: Ammunition[] = [
  // Arrows
  {
    id: 882,
    name: "Bronze arrow",
    level: 1,
    strengthBonus: 7,
    type: "arrow",
  },
  {
    id: 884,
    name: "Iron arrow",
    level: 1,
    strengthBonus: 10,
    type: "arrow",
  },
  {
    id: 886,
    name: "Steel arrow",
    level: 5,
    strengthBonus: 16,
    type: "arrow",
  },
  {
    id: 888,
    name: "Mithril arrow",
    level: 20,
    strengthBonus: 22,
    type: "arrow",
  },
  {
    id: 890,
    name: "Adamant arrow",
    level: 30,
    strengthBonus: 31,
    type: "arrow",
  },
  {
    id: 892,
    name: "Rune arrow",
    level: 40,
    strengthBonus: 49,
    type: "arrow",
  },
  {
    id: 11212,
    name: "Dragon arrow",
    level: 60,
    strengthBonus: 60,
    type: "arrow",
  },

  // Bolts
  {
    id: 877,
    name: "Bronze bolts",
    level: 1,
    strengthBonus: 10,
    type: "bolt",
  },
  {
    id: 9140,
    name: "Iron bolts",
    level: 1,
    strengthBonus: 46,
    type: "bolt",
  },
  {
    id: 9141,
    name: "Steel bolts",
    level: 5,
    strengthBonus: 54,
    type: "bolt",
  },
  {
    id: 9142,
    name: "Mithril bolts",
    level: 20,
    strengthBonus: 62,
    type: "bolt",
  },
  {
    id: 9143,
    name: "Adamant bolts",
    level: 30,
    strengthBonus: 78,
    type: "bolt",
  },
  {
    id: 9144,
    name: "Runite bolts",
    level: 61,
    strengthBonus: 115,
    type: "bolt",
  },
];

// Ranged attack styles
export const RANGED_ATTACK_STYLES: RangedAttackStyle[] = [
  {
    name: "Accurate",
    type: "accurate",
    experienceType: "ranged",
    accuracyBonus: 3,
    strengthBonus: 0,
    defenceBonus: 0,
    rangeBonus: 0,
  },
  {
    name: "Rapid",
    type: "rapid",
    experienceType: "ranged",
    accuracyBonus: 0,
    strengthBonus: 0,
    defenceBonus: 0,
    rangeBonus: 0,
  },
  {
    name: "Longrange",
    type: "longrange",
    experienceType: "defence",
    accuracyBonus: 0,
    strengthBonus: 0,
    defenceBonus: 3,
    rangeBonus: 2,
  },
];

/**
 * Calculate ranged max hit using OSRS formula
 */
export function calculateRangedMaxHit(
  rangedLevel: number,
  rangedStrength: number,
  prayerMultiplier: number = 1.0,
  styleBonus: number = 0
): number {
  // OSRS ranged max hit formula
  const effectiveRanged =
    Math.floor(rangedLevel * prayerMultiplier) + styleBonus + 8;
  const maxHit = Math.floor(
    0.5 + (effectiveRanged * (rangedStrength + 64)) / 640
  );

  return Math.max(1, maxHit);
}

/**
 * Calculate ranged accuracy using OSRS formula
 */
export function calculateRangedAccuracy(
  rangedLevel: number,
  attackBonus: number,
  targetDefenceLevel: number,
  targetRangedDefence: number,
  prayerMultiplier: number = 1.0,
  styleBonus: number = 0
): number {
  // Effective ranged level
  const effectiveRangedLevel =
    Math.floor(rangedLevel * prayerMultiplier) + styleBonus + 8;

  // Max attack roll
  const maxAttackRoll = effectiveRangedLevel * (attackBonus + 64);

  // Target's effective ranged defence
  const effectiveDefenceLevel =
    Math.floor(targetDefenceLevel * prayerMultiplier) + 8;
  const maxDefenceRoll = effectiveDefenceLevel * (targetRangedDefence + 64);

  // Accuracy calculation
  if (maxAttackRoll > maxDefenceRoll) {
    return 1 - (maxDefenceRoll + 2) / (2 * (maxAttackRoll + 1));
  } else {
    return maxAttackRoll / (2 * (maxDefenceRoll + 1));
  }
}

/**
 * Get weapon attack speed modifier based on style
 */
export function getAttackSpeedModifier(style: RangedAttackStyle): number {
  switch (style.type) {
    case "rapid":
      return -1; // 1 tick faster
    case "accurate":
    case "longrange":
    default:
      return 0; // Normal speed
  }
}

/**
 * Check if weapon can use ammunition
 */
export function canUseAmmunition(
  weapon: RangedWeapon,
  ammo: Ammunition
): boolean {
  return weapon.ammunitionType === ammo.type;
}

/**
 * Get weapon by ID
 */
export function getRangedWeaponById(
  weaponId: number
): RangedWeapon | undefined {
  return RANGED_WEAPONS.find((weapon) => weapon.id === weaponId);
}

/**
 * Get ammunition by ID
 */
export function getAmmunitionById(ammoId: number): Ammunition | undefined {
  return AMMUNITION.find((ammo) => ammo.id === ammoId);
}

/**
 * Get available weapons at ranged level
 */
export function getAvailableWeapons(rangedLevel: number): RangedWeapon[] {
  return RANGED_WEAPONS.filter((weapon) => weapon.level <= rangedLevel);
}

/**
 * Get available ammunition at ranged level
 */
export function getAvailableAmmunition(rangedLevel: number): Ammunition[] {
  return AMMUNITION.filter((ammo) => ammo.level <= rangedLevel);
}

/**
 * Calculate total ranged strength bonus
 */
export function calculateTotalRangedStrength(
  weapon: RangedWeapon,
  ammo: Ammunition | null = null
): number {
  let totalStrength = weapon.strengthBonus;

  if (ammo && canUseAmmunition(weapon, ammo)) {
    totalStrength += ammo.strengthBonus;
  }

  return totalStrength;
}
