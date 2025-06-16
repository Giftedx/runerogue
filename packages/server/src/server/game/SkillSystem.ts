/**
 * OSRS-Authentic Skills System
 * Implements all 23 OSRS skills with proper XP curves and level calculations
 * Based on official OSRS Wiki formulas
 */

import { Player } from './EntitySchemas';

// All OSRS Skills
export enum SkillType {
  // Combat Skills
  ATTACK = 'attack',
  STRENGTH = 'strength',
  DEFENCE = 'defence',
  RANGED = 'ranged',
  PRAYER = 'prayer',
  MAGIC = 'magic',
  HITPOINTS = 'hitpoints',

  // Gathering Skills
  MINING = 'mining',
  WOODCUTTING = 'woodcutting',
  FISHING = 'fishing',
  HUNTER = 'hunter',
  FARMING = 'farming',

  // Artisan Skills
  COOKING = 'cooking',
  FIREMAKING = 'firemaking',
  CRAFTING = 'crafting',
  SMITHING = 'smithing',
  FLETCHING = 'fletching',
  CONSTRUCTION = 'construction',
  HERBLORE = 'herblore',

  // Support Skills
  AGILITY = 'agility',
  THIEVING = 'thieving',
  SLAYER = 'slayer',
  RUNECRAFTING = 'runecrafting',
}

/**
 * Helper function to get skill from player's skills schema
 * Works with the Skills schema which has specific properties instead of Map
 */
function getSkillFromPlayer(player: Player, skillType: SkillType) {
  if (!player.skills) return null;

  // Map skill types to schema property names
  switch (skillType) {
    case SkillType.ATTACK:
      return player.skills.attack;
    case SkillType.STRENGTH:
      return player.skills.strength;
    case SkillType.DEFENCE:
      return player.skills.defence;
    case SkillType.MINING:
      return player.skills.mining;
    case SkillType.WOODCUTTING:
      return player.skills.woodcutting;
    case SkillType.FISHING:
      return player.skills.fishing;
    case SkillType.PRAYER:
      return player.skills.prayer;
    // TODO: Add other skills when they are added to the Skills schema
    default:
      return null; // Skill not yet implemented in schema
  }
}

/**
 * Helper function to iterate over all available skills in the player's skills schema
 */
function forEachSkillInPlayer(
  player: Player,
  callback: (skill: any, skillType: SkillType) => void
) {
  if (!player.skills) return;

  // Only iterate over skills that exist in the schema
  const availableSkills = [
    { skill: player.skills.attack, type: SkillType.ATTACK },
    { skill: player.skills.strength, type: SkillType.STRENGTH },
    { skill: player.skills.defence, type: SkillType.DEFENCE },
    { skill: player.skills.mining, type: SkillType.MINING },
    { skill: player.skills.woodcutting, type: SkillType.WOODCUTTING },
    { skill: player.skills.fishing, type: SkillType.FISHING },
    { skill: player.skills.prayer, type: SkillType.PRAYER },
  ];

  availableSkills.forEach(({ skill, type }) => {
    if (skill) {
      callback(skill, type);
    }
  });
}

// Skill data structure
export interface Skill {
  type: SkillType;
  level: number;
  experience: number;
  boost: number; // Temporary boost/drain
}

// XP requirements for each level (1-99)
// Pre-calculated for performance
const XP_TABLE: number[] = [
  0, // Level 1
  83, // Level 2
  174,
  276,
  388,
  512,
  650,
  801,
  969,
  1154,
  1358, // Level 11
  1584,
  1833,
  2107,
  2411,
  2746,
  3115,
  3523,
  3973,
  4470,
  5018, // Level 21
  5624,
  6291,
  7028,
  7842,
  8740,
  9730,
  10824,
  12031,
  13363,
  14833, // Level 31
  16456,
  18247,
  20224,
  22406,
  24815,
  27473,
  30408,
  33648,
  37224,
  41171, // Level 41
  45529,
  50339,
  55649,
  61512,
  67983,
  75127,
  83014,
  91721,
  101333,
  111945, // Level 51
  123660,
  136594,
  150872,
  166636,
  184040,
  203254,
  224466,
  247886,
  273742,
  302288, // Level 61
  333804,
  368599,
  407015,
  449428,
  496254,
  547953,
  605032,
  668051,
  737627,
  814445, // Level 71
  899257,
  992895,
  1096278,
  1210421,
  1336443,
  1475581,
  1629200,
  1798808,
  1986068,
  2192818, // Level 81
  2421087,
  2673114,
  2951373,
  3258594,
  3597792,
  3972294,
  4385776,
  4842295,
  5346332,
  5902831, // Level 91
  6517253,
  7195629,
  7944614,
  8771558,
  9684577,
  10692629,
  11805606,
  13034431,
  14391160, // Level 99
];

// Max XP (200M)
const MAX_XP = 200000000;

/**
 * OSRS Skills System Manager
 */
export class SkillSystem {
  private static instance: SkillSystem;

  private constructor() {}

  public static getInstance(): SkillSystem {
    if (!SkillSystem.instance) {
      SkillSystem.instance = new SkillSystem();
    }
    return SkillSystem.instance;
  }

  /**
   * Initialize all skills for a new player
   */
  public initializePlayerSkills(): Map<SkillType, Skill> {
    const skills = new Map<SkillType, Skill>();

    // Initialize all skills at level 1
    Object.values(SkillType).forEach(skillType => {
      const skill: Skill = {
        type: skillType,
        level: 1,
        experience: 0,
        boost: 0,
      };

      // Hitpoints starts at level 10 in OSRS
      if (skillType === SkillType.HITPOINTS) {
        skill.level = 10;
        skill.experience = 1154; // XP for level 10
      }

      skills.set(skillType, skill);
    });

    return skills;
  }

  /**
   * Calculate level from experience using OSRS formula
   * Binary search for efficiency
   */
  public getLevelFromXP(experience: number): number {
    if (experience >= XP_TABLE[98]) return 99;
    if (experience < 0) return 1;

    let low = 0;
    let high = 98;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);

      if (experience >= XP_TABLE[mid] && experience < XP_TABLE[mid + 1]) {
        return mid + 1;
      }

      if (experience < XP_TABLE[mid]) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return 1;
  }

  /**
   * Get XP required for a specific level
   */
  public getXPForLevel(level: number): number {
    if (level < 1) return 0;
    if (level > 99) return XP_TABLE[98];
    return XP_TABLE[level - 1];
  }

  /**
   * Calculate XP using OSRS formula (for verification)
   * Formula: Σ(L + 300 * 2^(L/7)) / 4 for L from 1 to level-1
   */
  public calculateXPForLevel(level: number): number {
    if (level <= 1) return 0;

    let xp = 0;
    for (let l = 1; l < level; l++) {
      xp += Math.floor(l + 300 * Math.pow(2, l / 7));
    }

    return Math.floor(xp / 4);
  }

  /**
   * Add experience to a skill
   */
  public addExperience(
    player: Player,
    skillType: SkillType,
    amount: number
  ): {
    newLevel: number;
    totalXP: number;
    leveledUp: boolean;
  } {
    const skill = getSkillFromPlayer(player, skillType);
    if (!skill) {
      throw new Error(`Player doesn't have skill: ${skillType}`);
    }
    const oldLevel = skill.level;
    const oldXP = skill.xp;

    // Add XP (cap at 200M)
    skill.xp = Math.min(oldXP + amount, MAX_XP);

    // Update level
    const newLevel = this.getLevelFromXP(skill.xp);
    skill.level = newLevel;

    const leveledUp = newLevel > oldLevel;

    // Update combat level if combat skill leveled up
    if (this.isCombatSkill(skillType) && leveledUp) {
      this.updateCombatLevel(player);
    }

    return {
      newLevel,
      totalXP: skill.xp,
      leveledUp,
    };
  }
  /**
   * Apply a temporary boost/drain to a skill
   * Note: Boost system not yet implemented in Skills schema
   */
  public applyBoost(player: Player, skillType: SkillType, _amount: number): void {
    const skill = getSkillFromPlayer(player, skillType);
    if (!skill) return;

    // TODO: Implement boost system when Skills schema is extended
    // Calculate max boost (level + boost can't exceed level + 5 + level * 0.15)
    // const maxBoost = Math.floor(5 + skill.level * 0.15);
    // Apply boost within limits
    // Note: boost property not yet implemented in Skill schema
    // const newBoost = skill.boost + amount;
    // skill.boost = Math.max(-skill.level, Math.min(maxBoost, newBoost));
  }

  /**
   * Get effective level (base + boost)
   */ public getEffectiveLevel(player: Player, skillType: SkillType): number {
    const skill = getSkillFromPlayer(player, skillType);
    if (!skill) return 1;

    // Note: boost property not yet implemented in Skill schema
    // return Math.max(0, skill.level + skill.boost);
    return skill.level;
  }
  /**
   * Decay boosts/drains by 1 toward base level
   * Note: Boost system not yet implemented in Skills schema
   */
  public decayBoosts(_player: Player): void {
    // Note: boost property not yet implemented in Skill schema
    // When boost is implemented, use this:
    // forEachSkillInPlayer(player, (skill) => {
    //   if (skill.boost > 0) {
    //     skill.boost = Math.max(0, skill.boost - 1);
    //   } else if (skill.boost < 0) {
    //     skill.boost = Math.min(0, skill.boost + 1);
    //   }
    // });
  }

  /**
   * Calculate combat level using OSRS formula
   */ public calculateCombatLevel(player: Player): number {
    if (!player.skills) return 3; // Minimum combat level

    const attack = getSkillFromPlayer(player, SkillType.ATTACK)?.level || 1;
    const strength = getSkillFromPlayer(player, SkillType.STRENGTH)?.level || 1;
    const defence = getSkillFromPlayer(player, SkillType.DEFENCE)?.level || 1;
    const hitpoints = 10; // Default hitpoints, not yet in schema
    const prayer = getSkillFromPlayer(player, SkillType.PRAYER)?.level || 1;
    const ranged = 1; // Default ranged, not yet in schema
    const magic = 1; // Default magic, not yet in schema

    // Base combat level calculation
    const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));

    // Melee combat
    const melee = 0.325 * (attack + strength);

    // Ranged combat
    const range = 0.325 * Math.floor(ranged * 1.5);

    // Magic combat
    const mage = 0.325 * Math.floor(magic * 1.5);

    // Combat level is base + highest of melee/range/mage
    const combatLevel = base + Math.max(melee, range, mage);

    return Math.floor(combatLevel);
  }

  /**
   * Update player's combat level
   */
  private updateCombatLevel(player: Player): void {
    const newCombatLevel = this.calculateCombatLevel(player);
    player.combatLevel = newCombatLevel;
  }

  /**
   * Check if a skill is a combat skill
   */
  private isCombatSkill(skillType: SkillType): boolean {
    return [
      SkillType.ATTACK,
      SkillType.STRENGTH,
      SkillType.DEFENCE,
      SkillType.RANGED,
      SkillType.PRAYER,
      SkillType.MAGIC,
      SkillType.HITPOINTS,
    ].includes(skillType);
  }

  /**
   * Get total level (sum of all skill levels)
   */
  public getTotalLevel(player: Player): number {
    if (!player.skills) return 0;
    let total = 0;
    forEachSkillInPlayer(player, skill => {
      total += skill.level;
    });

    return total;
  }

  /**
   * Get total XP (sum of all skill experience)
   */ public getTotalXP(player: Player): number {
    if (!player.skills) return 0;

    let total = 0;
    forEachSkillInPlayer(player, skill => {
      total += skill.xp; // Use 'xp' not 'experience'
    });

    return total;
  }

  /**
   * Serialize skills for storage
   */
  public serializeSkills(skills: Map<SkillType, Skill>): any {
    const serialized: any = {};

    skills.forEach((skill, type) => {
      serialized[type] = {
        level: skill.level,
        experience: skill.experience,
        boost: skill.boost,
      };
    });

    return serialized;
  }

  /**
   * Deserialize skills from storage
   */
  public deserializeSkills(data: any): Map<SkillType, Skill> {
    const skills = new Map<SkillType, Skill>();

    Object.entries(data).forEach(([type, skillData]: [string, any]) => {
      const skill: Skill = {
        type: type as SkillType,
        level: skillData.level || 1,
        experience: skillData.experience || 0,
        boost: skillData.boost || 0,
      };
      skills.set(type as SkillType, skill);
    });

    return skills;
  }
}

// Export singleton instance
export const skillSystem = SkillSystem.getInstance();
