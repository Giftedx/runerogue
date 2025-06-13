import { defineQuery, defineSystem, IWorld } from 'bitecs';
import { Player, SkillLevels, SkillXP } from '../components';

// Query for players (all players have skills)
const playerQuery = defineQuery([Player, SkillLevels, SkillXP]);

// OSRS XP table (levels 1-99)
const XP_TABLE = [
  0, // Level 1
  83, // Level 2
  174, // Level 3
  276, // Level 4
  388, // Level 5
  512, // Level 6
  650, // Level 7
  801, // Level 8
  969, // Level 9
  1154, // Level 10
  1358, // Level 11
  1584, // Level 12
  1833, // Level 13
  2107, // Level 14
  2411, // Level 15
  2746, // Level 16
  3115, // Level 17
  3523, // Level 18
  3973, // Level 19
  4470, // Level 20
  5018, // Level 21
  5624, // Level 22
  6291, // Level 23
  7028, // Level 24
  7842, // Level 25
  8740, // Level 26
  9730, // Level 27
  10824, // Level 28
  12031, // Level 29
  13363, // Level 30
  14833, // Level 31
  16456, // Level 32
  18247, // Level 33
  20224, // Level 34
  22406, // Level 35
  24815, // Level 36
  27473, // Level 37
  30408, // Level 38
  33648, // Level 39
  37224, // Level 40
  41171, // Level 41
  45529, // Level 42
  50339, // Level 43
  55649, // Level 44
  61512, // Level 45
  67983, // Level 46
  75127, // Level 47
  83014, // Level 48
  91721, // Level 49
  101333, // Level 50
  111945, // Level 51
  123660, // Level 52
  136594, // Level 53
  150872, // Level 54
  166636, // Level 55
  184040, // Level 56
  203254, // Level 57
  224466, // Level 58
  247886, // Level 59
  273742, // Level 60
  302288, // Level 61
  333804, // Level 62
  368599, // Level 63
  407015, // Level 64
  449428, // Level 65
  496254, // Level 66
  547953, // Level 67
  605032, // Level 68
  668051, // Level 69
  737627, // Level 70
  814445, // Level 71
  899257, // Level 72
  992895, // Level 73
  1096278, // Level 74
  1210421, // Level 75
  1336443, // Level 76
  1475581, // Level 77
  1629200, // Level 78
  1798808, // Level 79
  1986068, // Level 80
  2192818, // Level 81
  2421087, // Level 82
  2673114, // Level 83
  2951373, // Level 84
  3258594, // Level 85
  3597792, // Level 86
  3972294, // Level 87
  4385776, // Level 88
  4842295, // Level 89
  5346332, // Level 90
  5902831, // Level 91
  6517253, // Level 92
  7195629, // Level 93
  7944614, // Level 94
  8771558, // Level 95
  9684577, // Level 96
  10692629, // Level 97
  11805606, // Level 98
  13034431, // Level 99
];

// Skill names for indexing
export enum SkillType {
  ATTACK = 'attack',
  DEFENCE = 'defence',
  STRENGTH = 'strength',
  HITPOINTS = 'hitpoints',
  RANGED = 'ranged',
  PRAYER = 'prayer',
  MAGIC = 'magic',
  COOKING = 'cooking',
  WOODCUTTING = 'woodcutting',
  FLETCHING = 'fletching',
  FISHING = 'fishing',
  FIREMAKING = 'firemaking',
  CRAFTING = 'crafting',
  SMITHING = 'smithing',
  MINING = 'mining',
  HERBLORE = 'herblore',
  AGILITY = 'agility',
  THIEVING = 'thieving',
  SLAYER = 'slayer',
  FARMING = 'farming',
  RUNECRAFT = 'runecraft',
  HUNTER = 'hunter',
  CONSTRUCTION = 'construction',
}

// Map skill names to XP property names
const SKILL_XP_MAP: Record<SkillType, keyof typeof SkillXP> = {
  [SkillType.ATTACK]: 'attack',
  [SkillType.DEFENCE]: 'defence',
  [SkillType.STRENGTH]: 'strength',
  [SkillType.HITPOINTS]: 'hitpoints',
  [SkillType.RANGED]: 'ranged',
  [SkillType.PRAYER]: 'prayer',
  [SkillType.MAGIC]: 'magic',
  [SkillType.COOKING]: 'cooking',
  [SkillType.WOODCUTTING]: 'woodcutting',
  [SkillType.FLETCHING]: 'fletching',
  [SkillType.FISHING]: 'fishing',
  [SkillType.FIREMAKING]: 'firemaking',
  [SkillType.CRAFTING]: 'crafting',
  [SkillType.SMITHING]: 'smithing',
  [SkillType.MINING]: 'mining',
  [SkillType.HERBLORE]: 'herblore',
  [SkillType.AGILITY]: 'agility',
  [SkillType.THIEVING]: 'thieving',
  [SkillType.SLAYER]: 'slayer',
  [SkillType.FARMING]: 'farming',
  [SkillType.RUNECRAFT]: 'runecraft',
  [SkillType.HUNTER]: 'hunter',
  [SkillType.CONSTRUCTION]: 'construction',
};

// Track previous levels for level-up detection
const previousLevels = new Map<number, Record<SkillType, number>>();

/**
 * SkillSystem - Handles skill level calculations and level-up events
 */
export const SkillSystem = defineSystem((world: IWorld) => {
  const players = playerQuery(world);

  for (let i = 0; i < players.length; i++) {
    const playerId = players[i];

    // Get or initialize previous levels
    let prevLevels = previousLevels.get(playerId);
    if (!prevLevels) {
      prevLevels = {} as Record<SkillType, number>;
      previousLevels.set(playerId, prevLevels);
    }

    // Check each skill for level changes
    for (const skillType of Object.values(SkillType)) {
      const xpProp = SKILL_XP_MAP[skillType];
      const currentXP = SkillXP[xpProp][playerId] || 0;
      const newLevel = getLevelForXP(currentXP);

      // Update skill level
      SkillLevels[skillType][playerId] = newLevel;

      // Check for level up
      const previousLevel = prevLevels[skillType] || 1;
      if (newLevel > previousLevel) {
        handleLevelUp(world, playerId, skillType, previousLevel, newLevel);
        prevLevels[skillType] = newLevel;
      }
    }
  }

  return world;
});

/**
 * Get level for a given XP amount
 */
export function getLevelForXP(xp: number): number {
  for (let level = 99; level >= 1; level--) {
    if (xp >= XP_TABLE[level - 1]) {
      return level;
    }
  }
  return 1;
}

/**
 * Get XP required for a specific level
 */
export function getXPForLevel(level: number): number {
  if (level < 1 || level > 99) {
    return 0;
  }
  return XP_TABLE[level - 1];
}

/**
 * Get XP required to reach next level
 */
export function getXPToNextLevel(currentXP: number): number {
  const currentLevel = getLevelForXP(currentXP);
  if (currentLevel >= 99) {
    return 0;
  }

  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return nextLevelXP - currentXP;
}

/**
 * Add XP to a skill
 */
/**
 * Add XP to a player's skill, enforcing OSRS XP cap.
 * @param world ECS world
 * @param playerId Player entity ID
 * @param skill SkillType
 * @param xp Amount of XP to add
 */
export function addSkillXP(world: IWorld, playerId: number, skill: SkillType, xp: number): void {
  const xpProp = SKILL_XP_MAP[skill];
  const currentXP = SkillXP[xpProp][playerId] ?? 0;
  const maxXP = 200_000_000; // 200M XP cap in OSRS
  SkillXP[xpProp][playerId] = Math.min(currentXP + xp, maxXP);
}

/**
 * Get total level (sum of all skill levels)
 */
/**
 * Get total level (sum of all skill levels)
 * @param world ECS world
 * @param playerId Player entity ID
 * @returns Total level
 */
export function getTotalLevel(world: IWorld, playerId: number): number {
  let total = 0;
  for (const skill of Object.values(SkillType)) {
    total += SkillLevels[skill][playerId] ?? 1;
  }
  return total;
}

/**
 * Get total XP (sum of all skill XP)
 */
export function getTotalXP(world: IWorld, playerId: number): number {
  let total = 0;

  for (const skill of Object.values(SkillType)) {
    const xpProp = SKILL_XP_MAP[skill];
    total += SkillXP[xpProp][playerId] || 0;
  }

  return total;
}

/**
 * Get combat level
 */
export function getCombatLevel(world: IWorld, playerId: number): number {
  const attack = SkillLevels.attack[playerId] || 1;
  const strength = SkillLevels.strength[playerId] || 1;
  const defence = SkillLevels.defence[playerId] || 1;
  const hitpoints = SkillLevels.hitpoints[playerId] || 10;
  const prayer = SkillLevels.prayer[playerId] || 1;
  const ranged = SkillLevels.ranged[playerId] || 1;
  const magic = SkillLevels.magic[playerId] || 1;

  // OSRS combat level formula
  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));

  // Melee combat
  const melee = 0.325 * (attack + strength);

  // Ranged combat
  const range = 0.325 * Math.floor(ranged * 1.5);

  // Magic combat
  const mage = 0.325 * Math.floor(magic * 1.5);

  // Take the highest of the three combat styles
  const combatClass = Math.max(melee, range, mage);

  return Math.floor(base + combatClass);
}

/**
 * Handle level up event
 */
function handleLevelUp(
  world: IWorld,
  playerId: number,
  skill: SkillType,
  oldLevel: number,
  newLevel: number
): void {
  // TODO: Emit level up event
  // TODO: Show fireworks animation
  // TODO: Send congratulations message
  // TODO: Unlock new content based on level

  // Special handling for certain milestones
  if (newLevel === 99) {
    // Max level achieved!
    // TODO: Special celebration
  }

  // Restore HP on HP level up
  if (skill === SkillType.HITPOINTS) {
    // Health component uses current/max structure
    // This will be handled by the health system
  }
}

/**
 * Check if player has skill requirements
 */
export function hasSkillRequirement(
  world: IWorld,
  playerId: number,
  requirements: Partial<Record<SkillType, number>>
): boolean {
  for (const [skill, requiredLevel] of Object.entries(requirements)) {
    const playerLevel = SkillLevels[skill as SkillType][playerId] || 1;
    if (playerLevel < requiredLevel) {
      return false;
    }
  }

  return true;
}
