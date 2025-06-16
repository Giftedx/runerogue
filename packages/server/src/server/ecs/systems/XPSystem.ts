/**
 * XPSystem - Unified OSRS experience and leveling system
 * Handles XP grants, level calculations, and level-up events
 *
 * @author RuneRogue Development Team
 * @package @runerogue/server
 */

import { defineSystem, defineQuery, hasComponent, IWorld, addComponent } from 'bitecs';
import { SkillLevels, SkillXP, Player, LevelUpEvents } from '../components';

// OSRS XP table (levels 1-99)
export const OSRS_XP_TABLE = [
  0, 83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107, 2411, 2746, 3115, 3523,
  3973, 4470, 5018, 5624, 6291, 7028, 7842, 8740, 9730, 10824, 12031, 13363, 14833, 16456, 18247,
  20224, 22406, 24815, 27473, 30408, 33648, 37224, 41171, 45529, 50339, 55649, 61512, 67983, 75127,
  83014, 91721, 101333, 111945, 123660, 136594, 150872, 166636, 184040, 203254, 224466, 247886,
  273742, 302288, 333804, 368599, 407015, 449428, 496254, 547953, 605032, 668051, 737627, 814445,
  899257, 992895, 1096278, 1210421, 1336443, 1475581, 1629200, 1798808, 1986068, 2192818, 2421087,
  2673114, 2951373, 3258594, 3597792, 3972294, 4385776, 4842295, 5346332, 5902831, 6517253, 7195629,
  7944614, 8771558, 9684577, 10692629, 11805606, 13034431, 14391160,
];

// Skill names in the same order as components
export const SKILL_NAMES = [
  'attack',
  'defence',
  'strength',
  'hitpoints',
  'ranged',
  'prayer',
  'magic',
  'cooking',
  'woodcutting',
  'fletching',
  'fishing',
  'firemaking',
  'crafting',
  'smithing',
  'mining',
  'herblore',
  'agility',
  'thieving',
  'slayer',
  'farming',
  'runecraft',
  'hunter',
  'construction',
] as const;

// Skill indices for bitmask operations
export const SKILL_INDICES: Record<string, number> = {
  attack: 0,
  defence: 1,
  strength: 2,
  hitpoints: 3,
  ranged: 4,
  prayer: 5,
  magic: 6,
  cooking: 7,
  woodcutting: 8,
  fletching: 9,
  fishing: 10,
  firemaking: 11,
  crafting: 12,
  smithing: 13,
  mining: 14,
  herblore: 15,
  agility: 16,
  thieving: 17,
  slayer: 18,
  farming: 19,
  runecraft: 20,
  hunter: 21,
  construction: 22,
};

// Combat skills for combat level calculation
export const COMBAT_SKILLS = [
  'attack',
  'defence',
  'strength',
  'hitpoints',
  'ranged',
  'prayer',
  'magic',
];

// Queries
const xpQuery = defineQuery([SkillLevels, SkillXP, LevelUpEvents, Player]);

/**
 * Extended world interface for XP events
 */
interface WorldWithXPEvents extends IWorld {
  messageSystem?: {
    sendMessage: (entityId: number, message: string) => void;
    broadcastMessage: (message: string) => void;
  };
  levelUpBroadcaster?: (entityId: number, skill: string, newLevel: number) => void;
  xpBroadcaster?: (entityId: number, skill: string, xpGained: number) => void;
}

/**
 * Calculate level from XP using OSRS XP table
 */
export function calculateLevelFromXP(xp: number): number {
  for (let level = 1; level < OSRS_XP_TABLE.length; level++) {
    if (xp < OSRS_XP_TABLE[level]) {
      return level;
    }
  }
  return 99; // Max level
}

/**
 * Calculate XP required for next level
 */
export function getXPForLevel(level: number): number {
  if (level < 1) return 0;
  if (level > 99) return OSRS_XP_TABLE[99];
  return OSRS_XP_TABLE[level];
}

/**
 * Calculate XP needed for next level
 */
export function getXPToNextLevel(currentXP: number): number {
  const currentLevel = calculateLevelFromXP(currentXP);
  if (currentLevel >= 99) return 0;

  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return nextLevelXP - currentXP;
}

/**
 * Calculate OSRS combat level
 */
export function calculateCombatLevel(entityId: number): number {
  const attack = SkillLevels.attack[entityId] || 1;
  const strength = SkillLevels.strength[entityId] || 1;
  const defence = SkillLevels.defence[entityId] || 1;
  const hitpoints = SkillLevels.hitpoints[entityId] || 10;
  const prayer = SkillLevels.prayer[entityId] || 1;
  const ranged = SkillLevels.ranged[entityId] || 1;
  const magic = SkillLevels.magic[entityId] || 1;

  // OSRS combat level formula
  const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
  const melee = 0.325 * (attack + strength);
  const range = 0.325 * Math.floor(ranged * 1.5);
  const mage = 0.325 * Math.floor(magic * 1.5);

  return Math.floor(base + Math.max(melee, range, mage));
}

/**
 * Grant XP to a skill
 */
export function grantXP(
  world: WorldWithXPEvents,
  entityId: number,
  skill: string,
  amount: number
): boolean {
  if (!SKILL_INDICES.hasOwnProperty(skill)) {
    return false;
  }

  if (!hasComponent(world, SkillXP, entityId) || !hasComponent(world, SkillLevels, entityId)) {
    return false;
  }

  const skillXP = SkillXP[entityId];
  const skillLevels = SkillLevels[entityId];

  // Get current XP and level
  const currentXP = skillXP[skill] || 0;
  const currentLevel = skillLevels[skill] || 1;

  // Add XP (maximum 200M)
  const newXP = Math.min(200000000, currentXP + amount);
  skillXP[skill] = newXP;

  // Calculate new level
  const newLevel = calculateLevelFromXP(newXP);

  // Check for level up
  if (newLevel > currentLevel) {
    skillLevels[skill] = newLevel;

    // Add to pending level-ups
    if (hasComponent(world, LevelUpEvents, entityId)) {
      const events = LevelUpEvents[entityId];
      const skillIndex = SKILL_INDICES[skill];
      events.pendingLevelUps |= 1 << skillIndex;
    }

    // Broadcast level up
    if (world.levelUpBroadcaster) {
      world.levelUpBroadcaster(entityId, skill, newLevel);
    }

    // Send congratulatory message
    if (world.messageSystem) {
      world.messageSystem.sendMessage(
        entityId,
        `Congratulations! You have reached level ${newLevel} ${skill.charAt(0).toUpperCase() + skill.slice(1)}!`
      );

      // Broadcast milestone levels
      if ([10, 20, 30, 40, 50, 60, 70, 80, 90, 99].includes(newLevel)) {
        world.messageSystem.broadcastMessage(
          `${getPlayerName(entityId)} has reached level ${newLevel} ${skill.charAt(0).toUpperCase() + skill.slice(1)}!`
        );
      }
    }
  }

  // Broadcast XP gain
  if (world.xpBroadcaster) {
    world.xpBroadcaster(entityId, skill, amount);
  }

  return true;
}

/**
 * Get player name (placeholder - would be enhanced with actual name system)
 */
function getPlayerName(entityId: number): string {
  return `Player ${entityId}`;
}

/**
 * Process pending level-ups
 */
function processPendingLevelUps(world: WorldWithXPEvents, entityId: number): void {
  if (!hasComponent(world, LevelUpEvents, entityId)) {
    return;
  }

  const events = LevelUpEvents[entityId];

  if (events.pendingLevelUps === 0) {
    return;
  }

  // Check each skill for pending level-ups
  for (const skill of SKILL_NAMES) {
    const skillIndex = SKILL_INDICES[skill];
    const mask = 1 << skillIndex;

    if (events.pendingLevelUps & mask) {
      // Process level-up effects here
      processLevelUpEffects(world, entityId, skill);

      // Clear the pending flag
      events.pendingLevelUps &= ~mask;
    }
  }
}

/**
 * Process level-up effects (restore stats, special rewards)
 */
function processLevelUpEffects(world: WorldWithXPEvents, entityId: number, skill: string): void {
  // For hitpoints, increase max HP
  if (skill === 'hitpoints') {
    // This would integrate with Health component
    // Health.max[entityId] = SkillLevels.hitpoints[entityId] * 10;
  }

  // Other level-up effects can be added here
  // - Stat restoration
  // - Unlock new abilities
  // - Special rewards
}

/**
 * Get total level for entity
 */
export function getTotalLevel(world: IWorld, entityId: number): number {
  if (!hasComponent(world, SkillLevels, entityId)) {
    return 0;
  }

  let total = 0;
  for (const skill of SKILL_NAMES) {
    total += SkillLevels[skill][entityId] || 1;
  }

  return total;
}

/**
 * Get total XP for entity
 */
export function getTotalXP(world: IWorld, entityId: number): number {
  if (!hasComponent(world, SkillXP, entityId)) {
    return 0;
  }

  let total = 0;
  for (const skill of SKILL_NAMES) {
    total += SkillXP[skill][entityId] || 0;
  }

  return total;
}

/**
 * Check if entity has required level in skill
 */
export function hasRequiredLevel(
  world: IWorld,
  entityId: number,
  skill: string,
  requiredLevel: number
): boolean {
  if (!hasComponent(world, SkillLevels, entityId)) {
    return false;
  }

  const currentLevel = SkillLevels[skill][entityId] || 1;
  return currentLevel >= requiredLevel;
}

/**
 * XPSystem - Main system for processing XP and level-ups
 */
export const XPSystem = defineSystem((world: IWorld) => {
  const worldWithXP = world as WorldWithXPEvents;
  const entities = xpQuery(world);

  for (const entity of entities) {
    processPendingLevelUps(worldWithXP, entity);
  }

  return world;
});

/**
 * Initialize XP system for player entity
 */
export function initializeXPSystem(world: IWorld, entityId: number): void {
  // Add components if not present
  if (!hasComponent(world, SkillLevels, entityId)) {
    addComponent(world, SkillLevels, entityId);
  }
  if (!hasComponent(world, SkillXP, entityId)) {
    addComponent(world, SkillXP, entityId);
  }
  if (!hasComponent(world, LevelUpEvents, entityId)) {
    addComponent(world, LevelUpEvents, entityId);
  }

  const skillLevels = SkillLevels[entityId];
  const skillXP = SkillXP[entityId];
  const events = LevelUpEvents[entityId];

  // Initialize default levels and XP
  for (const skill of SKILL_NAMES) {
    if (skill === 'hitpoints') {
      skillLevels[skill] = skillLevels[skill] || 10; // Hitpoints starts at 10
      skillXP[skill] = skillXP[skill] || 1154; // XP for level 10
    } else {
      skillLevels[skill] = skillLevels[skill] || 1;
      skillXP[skill] = skillXP[skill] || 0;
    }
  }

  // Initialize events
  events.pendingLevelUps = 0;
  events.lastCheck = Date.now();
}

/**
 * Set skill level (for admin/debug purposes)
 */
export function setSkillLevel(
  world: IWorld,
  entityId: number,
  skill: string,
  level: number
): boolean {
  if (!SKILL_INDICES.hasOwnProperty(skill) || level < 1 || level > 99) {
    return false;
  }

  if (!hasComponent(world, SkillLevels, entityId) || !hasComponent(world, SkillXP, entityId)) {
    return false;
  }

  const skillLevels = SkillLevels[entityId];
  const skillXP = SkillXP[entityId];

  skillLevels[skill] = level;
  skillXP[skill] = getXPForLevel(level);
  return true;
}
