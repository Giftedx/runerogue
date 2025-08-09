/**
 * OSRS Magic System - Complete spell database and combat calculations
 * Data sourced from OSRS Wiki for authenticity
 *
 * @author RuneRogue Development Team
 * @package @runerogue/osrs-data
 */

export interface Rune {
  id: number;
  name: string;
  shopPrice: number;
}

export interface RuneRequirement {
  runeId: number;
  amount: number;
}

export interface Spell {
  id: number;
  name: string;
  level: number;
  maxHit: number;
  runes: RuneRequirement[];
  experience: number;
  spellbook: "standard" | "ancient" | "lunar";
  combatSpell: boolean;
  autocast: boolean;
  description: string;
}

export interface MagicWeapon {
  id: number;
  name: string;
  level: number;
  magicBonus: number;
  autocastSpells: number[]; // Spell IDs that can be autocasted
}

// Standard Runes
export const RUNES: Record<string, Rune> = {
  air: { id: 556, name: "Air rune", shopPrice: 4 },
  water: { id: 555, name: "Water rune", shopPrice: 4 },
  earth: { id: 557, name: "Earth rune", shopPrice: 4 },
  fire: { id: 554, name: "Fire rune", shopPrice: 4 },
  mind: { id: 558, name: "Mind rune", shopPrice: 3 },
  body: { id: 559, name: "Body rune", shopPrice: 2 },
  cosmic: { id: 564, name: "Cosmic rune", shopPrice: 100 },
  chaos: { id: 562, name: "Chaos rune", shopPrice: 90 },
  nature: { id: 561, name: "Nature rune", shopPrice: 180 },
  law: { id: 563, name: "Law rune", shopPrice: 180 },
  death: { id: 560, name: "Death rune", shopPrice: 200 },
  blood: { id: 565, name: "Blood rune", shopPrice: 330 },
  soul: { id: 566, name: "Soul rune", shopPrice: 220 },
  astral: { id: 9075, name: "Astral rune", shopPrice: 120 },
};

// Standard Spellbook Combat Spells
export const STANDARD_COMBAT_SPELLS: Spell[] = [
  {
    id: 1152,
    name: "Wind Strike",
    level: 1,
    maxHit: 2,
    runes: [
      { runeId: RUNES.air.id, amount: 1 },
      { runeId: RUNES.mind.id, amount: 1 },
    ],
    experience: 5.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A basic wind spell that deals 2 damage",
  },
  {
    id: 1154,
    name: "Water Strike",
    level: 5,
    maxHit: 4,
    runes: [
      { runeId: RUNES.water.id, amount: 1 },
      { runeId: RUNES.air.id, amount: 1 },
      { runeId: RUNES.mind.id, amount: 1 },
    ],
    experience: 7.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A water spell that deals 4 damage",
  },
  {
    id: 1156,
    name: "Earth Strike",
    level: 9,
    maxHit: 6,
    runes: [
      { runeId: RUNES.earth.id, amount: 2 },
      { runeId: RUNES.air.id, amount: 1 },
      { runeId: RUNES.mind.id, amount: 1 },
    ],
    experience: 9.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "An earth spell that deals 6 damage",
  },
  {
    id: 1158,
    name: "Fire Strike",
    level: 13,
    maxHit: 8,
    runes: [
      { runeId: RUNES.fire.id, amount: 3 },
      { runeId: RUNES.air.id, amount: 2 },
      { runeId: RUNES.mind.id, amount: 1 },
    ],
    experience: 11.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A fire spell that deals 8 damage",
  },
  {
    id: 1160,
    name: "Wind Bolt",
    level: 17,
    maxHit: 9,
    runes: [
      { runeId: RUNES.air.id, amount: 2 },
      { runeId: RUNES.chaos.id, amount: 1 },
    ],
    experience: 13.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A wind bolt that deals 9 damage",
  },
  {
    id: 1163,
    name: "Water Bolt",
    level: 23,
    maxHit: 10,
    runes: [
      { runeId: RUNES.water.id, amount: 2 },
      { runeId: RUNES.air.id, amount: 2 },
      { runeId: RUNES.chaos.id, amount: 1 },
    ],
    experience: 16.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A water bolt that deals 10 damage",
  },
  {
    id: 1166,
    name: "Earth Bolt",
    level: 29,
    maxHit: 11,
    runes: [
      { runeId: RUNES.earth.id, amount: 3 },
      { runeId: RUNES.air.id, amount: 2 },
      { runeId: RUNES.chaos.id, amount: 1 },
    ],
    experience: 19.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "An earth bolt that deals 11 damage",
  },
  {
    id: 1169,
    name: "Fire Bolt",
    level: 35,
    maxHit: 12,
    runes: [
      { runeId: RUNES.fire.id, amount: 4 },
      { runeId: RUNES.air.id, amount: 3 },
      { runeId: RUNES.chaos.id, amount: 1 },
    ],
    experience: 22.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A fire bolt that deals 12 damage",
  },
  {
    id: 1172,
    name: "Wind Blast",
    level: 41,
    maxHit: 13,
    runes: [
      { runeId: RUNES.air.id, amount: 3 },
      { runeId: RUNES.death.id, amount: 1 },
    ],
    experience: 25.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A wind blast that deals 13 damage",
  },
  {
    id: 1175,
    name: "Water Blast",
    level: 47,
    maxHit: 14,
    runes: [
      { runeId: RUNES.water.id, amount: 3 },
      { runeId: RUNES.air.id, amount: 3 },
      { runeId: RUNES.death.id, amount: 1 },
    ],
    experience: 28.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A water blast that deals 14 damage",
  },
  {
    id: 1177,
    name: "Earth Blast",
    level: 53,
    maxHit: 15,
    runes: [
      { runeId: RUNES.earth.id, amount: 4 },
      { runeId: RUNES.air.id, amount: 3 },
      { runeId: RUNES.death.id, amount: 1 },
    ],
    experience: 31.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "An earth blast that deals 15 damage",
  },
  {
    id: 1181,
    name: "Fire Blast",
    level: 59,
    maxHit: 16,
    runes: [
      { runeId: RUNES.fire.id, amount: 5 },
      { runeId: RUNES.air.id, amount: 4 },
      { runeId: RUNES.death.id, amount: 1 },
    ],
    experience: 34.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A fire blast that deals 16 damage",
  },
  {
    id: 1183,
    name: "Wind Wave",
    level: 62,
    maxHit: 17,
    runes: [
      { runeId: RUNES.air.id, amount: 5 },
      { runeId: RUNES.blood.id, amount: 1 },
    ],
    experience: 36,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A wind wave that deals 17 damage",
  },
  {
    id: 1185,
    name: "Water Wave",
    level: 65,
    maxHit: 18,
    runes: [
      { runeId: RUNES.water.id, amount: 7 },
      { runeId: RUNES.air.id, amount: 5 },
      { runeId: RUNES.blood.id, amount: 1 },
    ],
    experience: 37.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A water wave that deals 18 damage",
  },
  {
    id: 1188,
    name: "Earth Wave",
    level: 70,
    maxHit: 19,
    runes: [
      { runeId: RUNES.earth.id, amount: 7 },
      { runeId: RUNES.air.id, amount: 5 },
      { runeId: RUNES.blood.id, amount: 1 },
    ],
    experience: 40,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "An earth wave that deals 19 damage",
  },
  {
    id: 1189,
    name: "Fire Wave",
    level: 75,
    maxHit: 20,
    runes: [
      { runeId: RUNES.fire.id, amount: 7 },
      { runeId: RUNES.air.id, amount: 5 },
      { runeId: RUNES.blood.id, amount: 1 },
    ],
    experience: 42.5,
    spellbook: "standard",
    combatSpell: true,
    autocast: true,
    description: "A fire wave that deals 20 damage",
  },
];

// Magic weapons that can autocast spells
export const MAGIC_WEAPONS: MagicWeapon[] = [
  {
    id: 1379,
    name: "Staff of air",
    level: 1,
    magicBonus: 10,
    autocastSpells: [1152, 1160, 1172, 1183], // Wind spells
  },
  {
    id: 1383,
    name: "Staff of water",
    level: 1,
    magicBonus: 10,
    autocastSpells: [1154, 1163, 1175, 1185], // Water spells
  },
  {
    id: 1385,
    name: "Staff of earth",
    level: 1,
    magicBonus: 10,
    autocastSpells: [1156, 1166, 1177, 1188], // Earth spells
  },
  {
    id: 1387,
    name: "Staff of fire",
    level: 1,
    magicBonus: 10,
    autocastSpells: [1158, 1169, 1181, 1189], // Fire spells
  },
  {
    id: 1401,
    name: "Mystic air staff",
    level: 40,
    magicBonus: 15,
    autocastSpells: [1152, 1160, 1172, 1183], // Wind spells
  },
  {
    id: 1405,
    name: "Mystic water staff",
    level: 40,
    magicBonus: 15,
    autocastSpells: [1154, 1163, 1175, 1185], // Water spells
  },
  {
    id: 1407,
    name: "Mystic earth staff",
    level: 40,
    magicBonus: 15,
    autocastSpells: [1156, 1166, 1177, 1188], // Earth spells
  },
  {
    id: 1409,
    name: "Mystic fire staff",
    level: 40,
    magicBonus: 15,
    autocastSpells: [1158, 1169, 1181, 1189], // Fire spells
  },
];

/**
 * Calculate magic max hit using OSRS formula
 */
export function calculateMagicMaxHit(
  magicLevel: number,
  spell: Spell,
  magicBonus = 0,
  prayerMultiplier = 1.0,
): number {
  // OSRS magic damage calculation
  // Base max hit is the spell's max hit
  let maxHit = spell.maxHit;

  // Apply magic bonus (roughly 0.3% increase per magic bonus point)
  const bonusMultiplier = 1 + magicBonus * 0.003;
  maxHit = Math.floor(maxHit * bonusMultiplier);

  // Apply prayer bonuses
  maxHit = Math.floor(maxHit * prayerMultiplier);

  return Math.max(1, maxHit);
}

/**
 * Calculate magic accuracy using OSRS formula
 */
export function calculateMagicAccuracy(
  magicLevel: number,
  spell: Spell,
  attackBonus: number,
  targetDefenceLevel: number,
  targetMagicDefence: number,
  prayerMultiplier = 1.0,
): number {
  // Effective magic level
  const effectiveMagicLevel = Math.floor(magicLevel * prayerMultiplier) + 8;

  // Max attack roll
  const maxAttackRoll = effectiveMagicLevel * (attackBonus + 64);

  // Target's effective magic defence
  const effectiveDefenceLevel =
    Math.floor(targetDefenceLevel * 0.3 + targetMagicDefence * 0.7) + 8;
  const maxDefenceRoll = effectiveDefenceLevel * (targetMagicDefence + 64);

  // Accuracy calculation
  if (maxAttackRoll > maxDefenceRoll) {
    return 1 - (maxDefenceRoll + 2) / (2 * (maxAttackRoll + 1));
  } else {
    return maxAttackRoll / (2 * (maxDefenceRoll + 1));
  }
}

/**
 * Get spell by ID
 */
export function getSpellById(spellId: number): Spell | undefined {
  return STANDARD_COMBAT_SPELLS.find((spell) => spell.id === spellId);
}

/**
 * Get spells available at magic level
 */
export function getAvailableSpells(magicLevel: number): Spell[] {
  return STANDARD_COMBAT_SPELLS.filter((spell) => spell.level <= magicLevel);
}

/**
 * Check if player has required runes for spell
 */
export function hasRequiredRunes(
  inventory: { itemId: number; quantity: number }[],
  spell: Spell,
): boolean {
  return spell.runes.every((requirement) => {
    const runeItem = inventory.find(
      (item) => item.itemId === requirement.runeId,
    );
    return runeItem && runeItem.quantity >= requirement.amount;
  });
}

/**
 * Consume runes for spell casting
 */
export function consumeRunes(
  inventory: { itemId: number; quantity: number }[],
  spell: Spell,
): void {
  spell.runes.forEach((requirement) => {
    const runeItem = inventory.find(
      (item) => item.itemId === requirement.runeId,
    );
    if (runeItem) {
      runeItem.quantity -= requirement.amount;
    }
  });
}
