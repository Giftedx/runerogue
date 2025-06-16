/**
 * Skills System for RuneRogue
 * Handles skill levels, XP tracking, and progression
 * Based on authentic OSRS skill mechanics and formulas
 */

export interface SkillData {
  level: number;
  experience: number;
  totalExperience: number;
}

export interface SkillsData {
  attack: SkillData;
  defence: SkillData;
  strength: SkillData;
  hitpoints: SkillData;
  ranged: SkillData;
  prayer: SkillData;
  magic: SkillData;
  cooking: SkillData;
  woodcutting: SkillData;
  fletching: SkillData;
  fishing: SkillData;
  firemaking: SkillData;
  crafting: SkillData;
  smithing: SkillData;
  mining: SkillData;
  herblore: SkillData;
  agility: SkillData;
  thieving: SkillData;
  slayer: SkillData;
  farming: SkillData;
  runecraft: SkillData;
  hunter: SkillData;
  construction: SkillData;
}

export enum SkillName {
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

export interface LevelUpResult {
  skillName: SkillName;
  oldLevel: number;
  newLevel: number;
  totalExperience: number;
}

/**
 * OSRS Experience Table
 * Authentic experience requirements for each level (1-99)
 */
export const OSRS_EXPERIENCE_TABLE: number[] = [
  0, 83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107, 2411, 2746, 3115, 3523,
  3973, 4470, 5018, 5624, 6291, 7028, 7842, 8740, 9730, 10824, 12031, 13363, 14833, 16456, 18247,
  20224, 22406, 24815, 27473, 30408, 33648, 37224, 41171, 45529, 50339, 55649, 61512, 67983, 75127,
  83014, 91721, 101333, 111945, 123660, 136594, 150872, 166636, 184040, 203254, 224466, 247886,
  273742, 302288, 333804, 368599, 407015, 449428, 496254, 547953, 605032, 668051, 737627, 814445,
  899257, 992895, 1096278, 1210421, 1336443, 1475581, 1629200, 1798808, 1986068, 2192818, 2421087,
  2673114, 2951373, 3258594, 3597792, 3972294, 4385776, 4842295, 5346332, 5902831, 6517253, 7195629,
  7944614, 8771558, 9684577, 10692629, 11805606, 13034431, 14391160, 15889109, 17542976, 19368992,
  21385073, 23611006, 26068632, 28782069, 31777943, 35085654, 38737661, 42769801, 47221641,
  52136869, 57563718, 63555443, 70170840, 77474828, 85539082, 94442737, 104273167,
];

/**
 * Skills Manager Class
 * Handles all skill-related operations including XP gain, leveling, and calculations
 */
export class SkillsManager {
  private skills: SkillsData;
  private logger: Console;

  constructor(initialSkills?: Partial<SkillsData>) {
    this.logger = console; // Can be replaced with proper logger
    this.skills = this.initializeSkills(initialSkills);
  }

  /**
   * Initialize skills with default values or provided values
   */
  private initializeSkills(initialSkills?: Partial<SkillsData>): SkillsData {
    const defaultSkill = (): SkillData => ({
      level: 1,
      experience: 0,
      totalExperience: 0,
    });

    // Hitpoints starts at level 10 in OSRS
    const defaultHitpoints = (): SkillData => ({
      level: 10,
      experience: 1154, // XP for level 10
      totalExperience: 1154,
    });

    const skills: SkillsData = {
      attack: initialSkills?.attack || defaultSkill(),
      defence: initialSkills?.defence || defaultSkill(),
      strength: initialSkills?.strength || defaultSkill(),
      hitpoints: initialSkills?.hitpoints || defaultHitpoints(),
      ranged: initialSkills?.ranged || defaultSkill(),
      prayer: initialSkills?.prayer || defaultSkill(),
      magic: initialSkills?.magic || defaultSkill(),
      cooking: initialSkills?.cooking || defaultSkill(),
      woodcutting: initialSkills?.woodcutting || defaultSkill(),
      fletching: initialSkills?.fletching || defaultSkill(),
      fishing: initialSkills?.fishing || defaultSkill(),
      firemaking: initialSkills?.firemaking || defaultSkill(),
      crafting: initialSkills?.crafting || defaultSkill(),
      smithing: initialSkills?.smithing || defaultSkill(),
      mining: initialSkills?.mining || defaultSkill(),
      herblore: initialSkills?.herblore || defaultSkill(),
      agility: initialSkills?.agility || defaultSkill(),
      thieving: initialSkills?.thieving || defaultSkill(),
      slayer: initialSkills?.slayer || defaultSkill(),
      farming: initialSkills?.farming || defaultSkill(),
      runecraft: initialSkills?.runecraft || defaultSkill(),
      hunter: initialSkills?.hunter || defaultSkill(),
      construction: initialSkills?.construction || defaultSkill(),
    };

    return skills;
  }

  /**
   * Get current skills data
   */
  getSkills(): SkillsData {
    return { ...this.skills };
  }

  /**
   * Get a specific skill's data
   */
  getSkill(skillName: SkillName): SkillData {
    return { ...this.skills[skillName] };
  }

  /**
   * Get skill level for a specific skill
   */
  getSkillLevel(skillName: SkillName): number {
    return this.skills[skillName].level;
  }

  /**
   * Get skill experience for a specific skill
   */
  getSkillExperience(skillName: SkillName): number {
    return this.skills[skillName].totalExperience;
  }

  /**
   * Calculate level from experience using OSRS formula
   */
  calculateLevelFromExperience(experience: number): number {
    let level = 1;
    for (let i = 1; i < OSRS_EXPERIENCE_TABLE.length; i++) {
      if (experience >= OSRS_EXPERIENCE_TABLE[i]) {
        level = i + 1;
      } else {
        break;
      }
    }
    return Math.min(level, 99); // Max level is 99
  }

  /**
   * Get experience required for next level
   */
  getExperienceToNextLevel(skillName: SkillName): number {
    const skill = this.skills[skillName];
    if (skill.level >= 99) return 0;

    const nextLevelExp = OSRS_EXPERIENCE_TABLE[skill.level];
    return nextLevelExp - skill.totalExperience;
  }

  /**
   * Add experience to a skill and handle level ups
   */
  addExperience(skillName: SkillName, experience: number): LevelUpResult | null {
    const skill = this.skills[skillName];
    const oldLevel = skill.level;
    const oldTotalExp = skill.totalExperience;

    // Add experience
    skill.experience += experience;
    skill.totalExperience += experience;

    // Calculate new level
    const newLevel = this.calculateLevelFromExperience(skill.totalExperience);

    // Check for level up
    if (newLevel > oldLevel) {
      skill.level = newLevel;

      this.logger.log(
        `Level up! ${skillName} leveled from ${oldLevel} to ${newLevel} (Total XP: ${skill.totalExperience})`
      );

      return {
        skillName,
        oldLevel,
        newLevel,
        totalExperience: skill.totalExperience,
      };
    }

    return null;
  }

  /**
   * Set skill level and adjust experience accordingly
   */
  setSkillLevel(skillName: SkillName, level: number): void {
    level = Math.max(1, Math.min(99, level)); // Clamp between 1 and 99

    const requiredExp = level > 1 ? OSRS_EXPERIENCE_TABLE[level - 1] : 0;

    this.skills[skillName].level = level;
    this.skills[skillName].totalExperience = requiredExp;
    this.skills[skillName].experience = requiredExp;

    this.logger.log(`Set ${skillName} to level ${level} (XP: ${requiredExp})`);
  }

  /**
   * Get total level (sum of all skill levels)
   */
  getTotalLevel(): number {
    return Object.values(this.skills).reduce((total, skill) => total + skill.level, 0);
  }

  /**
   * Get total experience (sum of all skill experience)
   */
  getTotalExperience(): number {
    return Object.values(this.skills).reduce((total, skill) => total + skill.totalExperience, 0);
  }

  /**
   * Check if player meets level requirement for multiple skills
   */
  meetsLevelRequirements(requirements: Partial<Record<SkillName, number>>): boolean {
    for (const [skillName, requiredLevel] of Object.entries(requirements)) {
      if (this.getSkillLevel(skillName as SkillName) < requiredLevel) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get combat level (OSRS formula)
   */
  getCombatLevel(): number {
    const attack = this.getSkillLevel(SkillName.ATTACK);
    const defence = this.getSkillLevel(SkillName.DEFENCE);
    const strength = this.getSkillLevel(SkillName.STRENGTH);
    const hitpoints = this.getSkillLevel(SkillName.HITPOINTS);
    const ranged = this.getSkillLevel(SkillName.RANGED);
    const magic = this.getSkillLevel(SkillName.MAGIC);
    const prayer = this.getSkillLevel(SkillName.PRAYER);

    const base = (defence + hitpoints + Math.floor(prayer / 2)) * 0.25;
    const melee = (attack + strength) * 0.325;
    const rangedBonus = ranged * 0.325;
    const magicBonus = magic * 0.325;

    return Math.floor(base + Math.max(melee, rangedBonus, magicBonus));
  }

  /**
   * Reset all skills to default values
   */
  resetSkills(): void {
    this.skills = this.initializeSkills();
    this.logger.log('All skills have been reset to default values');
  }

  /**
   * Import skills data from external source
   */
  importSkills(skillsData: Partial<SkillsData>): void {
    for (const [skillName, skillData] of Object.entries(skillsData)) {
      if (this.skills[skillName as SkillName] && skillData) {
        this.skills[skillName as SkillName] = { ...skillData };
      }
    }
    this.logger.log('Skills data imported successfully');
  }

  /**
   * Export skills data for saving
   */
  exportSkills(): SkillsData {
    return { ...this.skills };
  }
}

/**
 * Utility functions for skill-related calculations
 */
export class SkillUtils {
  /**
   * Format experience number with commas
   */
  static formatExperience(experience: number): string {
    return experience.toLocaleString();
  }

  /**
   * Get skill icon/color for UI purposes
   */
  static getSkillColor(skillName: SkillName): string {
    const colors: Record<SkillName, string> = {
      [SkillName.ATTACK]: '#FF0000',
      [SkillName.DEFENCE]: '#0000FF',
      [SkillName.STRENGTH]: '#00FF00',
      [SkillName.HITPOINTS]: '#FF69B4',
      [SkillName.RANGED]: '#8B4513',
      [SkillName.PRAYER]: '#FFD700',
      [SkillName.MAGIC]: '#800080',
      [SkillName.COOKING]: '#FF6347',
      [SkillName.WOODCUTTING]: '#228B22',
      [SkillName.FLETCHING]: '#32CD32',
      [SkillName.FISHING]: '#1E90FF',
      [SkillName.FIREMAKING]: '#FF4500',
      [SkillName.CRAFTING]: '#DEB887',
      [SkillName.SMITHING]: '#696969',
      [SkillName.MINING]: '#708090',
      [SkillName.HERBLORE]: '#9ACD32',
      [SkillName.AGILITY]: '#87CEEB',
      [SkillName.THIEVING]: '#8B008B',
      [SkillName.SLAYER]: '#000000',
      [SkillName.FARMING]: '#ADFF2F',
      [SkillName.RUNECRAFT]: '#4169E1',
      [SkillName.HUNTER]: '#CD853F',
      [SkillName.CONSTRUCTION]: '#DAA520',
    };

    return colors[skillName] || '#FFFFFF';
  }

  /**
   * Get skill name display format
   */
  static getSkillDisplayName(skillName: SkillName): string {
    return skillName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Calculate XP per hour based on activity
   */
  static calculateXpPerHour(xpGained: number, timeElapsed: number): number {
    const hours = timeElapsed / (1000 * 60 * 60);
    return hours > 0 ? Math.round(xpGained / hours) : 0;
  }
}
