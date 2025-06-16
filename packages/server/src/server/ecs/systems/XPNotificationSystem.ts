/**
 * XPNotificationSystem - ECS system for tracking XP gains and broadcasting to clients
 * Provides visual feedback for experience point gains in all skills
 */

import { defineQuery, defineSystem, hasComponent, IWorld } from 'bitecs';
import { SkillXP, Transform } from '../components';

/**
 * XP gain event for client visualization
 */
export interface XPGainEvent {
  entityId: number;
  skill: string;
  xpGained: number;
  newLevel?: number;
  position: { x: number; y: number };
  timestamp: number;
}

/**
 * Track previous XP values to detect gains
 */
const previousSkillXP = new Map<number, Record<string, number>>();

/**
 * Network broadcaster for XP events
 */
let xpEventBroadcaster: ((type: string, data: any) => void) | null = null;

/**
 * XP gain queue for batched processing
 */
const xpGainQueue: XPGainEvent[] = [];

/**
 * Queries for entities with skills and position
 */
const skillEntitiesQuery = defineQuery([SkillXP, Transform]);

/**
 * OSRS experience table for level calculations
 * XP required for each level (index = level - 1)
 */
const OSRS_XP_TABLE = [
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
 * Calculate OSRS level from XP
 */
function calculateLevel(xp: number): number {
  for (let level = OSRS_XP_TABLE.length; level >= 1; level--) {
    if (xp >= OSRS_XP_TABLE[level - 1]) {
      return level;
    }
  }
  return 1;
}

/**
 * XPNotificationSystem for ECS
 * Tracks XP changes and broadcasts updates for visual representation
 */
export const XPNotificationSystem = defineSystem((world: IWorld) => {
  const currentTime = Date.now();
  const entities = skillEntitiesQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    if (!hasComponent(world, Transform, eid)) continue;

    // Get current skill XP values
    const currentSkills = {
      attack: SkillXP.attack[eid] ?? 0,
      defence: SkillXP.defence[eid] ?? 0,
      strength: SkillXP.strength[eid] ?? 0,
      hitpoints: SkillXP.hitpoints[eid] ?? 0,
      ranged: SkillXP.ranged[eid] ?? 0,
      magic: SkillXP.magic[eid] ?? 0,
      prayer: SkillXP.prayer[eid] ?? 0,
      cooking: SkillXP.cooking[eid] ?? 0,
      woodcutting: SkillXP.woodcutting[eid] ?? 0,
      fletching: SkillXP.fletching[eid] ?? 0,
      fishing: SkillXP.fishing[eid] ?? 0,
      firemaking: SkillXP.firemaking[eid] ?? 0,
      crafting: SkillXP.crafting[eid] ?? 0,
      smithing: SkillXP.smithing[eid] ?? 0,
      mining: SkillXP.mining[eid] ?? 0,
      herblore: SkillXP.herblore[eid] ?? 0,
      agility: SkillXP.agility[eid] ?? 0,
      thieving: SkillXP.thieving[eid] ?? 0,
      slayer: SkillXP.slayer[eid] ?? 0,
      farming: SkillXP.farming[eid] ?? 0,
      runecraft: SkillXP.runecraft[eid] ?? 0,
      hunter: SkillXP.hunter[eid] ?? 0,
      construction: SkillXP.construction[eid] ?? 0,
    };

    // Get previous XP values
    const previousXP = previousSkillXP.get(eid) || {};

    // Check each skill for XP gains
    for (const [skillName, currentXP] of Object.entries(currentSkills)) {
      const prevXP = previousXP[skillName] || 0;

      if (currentXP > prevXP) {
        const xpGained = currentXP - prevXP;
        const prevLevel = calculateLevel(prevXP);
        const newLevel = calculateLevel(currentXP);

        // Create XP gain event
        const xpEvent: XPGainEvent = {
          entityId: eid,
          skill: skillName,
          xpGained,
          newLevel: newLevel > prevLevel ? newLevel : undefined,
          position: {
            x: Transform.x[eid],
            y: Transform.y[eid],
          },
          timestamp: currentTime,
        };

        // Queue the event for batching
        xpGainQueue.push(xpEvent);
      }
    }

    // Update previous XP values
    previousSkillXP.set(eid, { ...currentSkills });
  }

  // Broadcast XP events if any were queued
  if (xpGainQueue.length > 0 && xpEventBroadcaster) {
    const events = xpGainQueue.splice(0); // Clear queue and get all events

    xpEventBroadcaster('xpGains', {
      events,
      timestamp: currentTime,
    });
  }

  return world;
});

/**
 * Set the network broadcaster for XP events
 */
export function setXPEventBroadcaster(broadcaster: (type: string, data: any) => void): void {
  xpEventBroadcaster = broadcaster;
}

/**
 * Queue a manual XP gain event (for testing or special cases)
 */
export function queueXPGain(
  world: IWorld,
  entityId: number,
  skill: string,
  xpAmount: number
): void {
  if (!hasComponent(world, Transform, entityId)) {
    return;
  }

  const currentTime = Date.now();
  const event: XPGainEvent = {
    entityId,
    skill,
    xpGained: xpAmount,
    position: {
      x: Transform.x[entityId],
      y: Transform.y[entityId],
    },
    timestamp: currentTime,
  };

  xpGainQueue.push(event);
}

/**
 * Clear XP tracking data (useful for cleanup)
 */
export function clearXPTracking(): void {
  previousSkillXP.clear();
  xpGainQueue.length = 0;
}

/**
 * Get XP notification system status
 */
export function getXPSystemStatus() {
  return {
    trackedEntities: previousSkillXP.size,
    queuedEvents: xpGainQueue.length,
    hasBroadcaster: xpEventBroadcaster !== null,
  };
}
