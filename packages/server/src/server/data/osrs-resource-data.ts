/**
 * OSRS Resource Data for ECS Systems
 * Re-exports the gathering data from packages/osrs-data for use in ECS systems
 */

import {
  TREES,
  ROCKS,
  FISHING_SPOTS,
  COOKABLE_ITEMS,
  LOGS,
  WOODCUTTING_TOOLS,
  MINING_TOOLS,
  FISHING_TOOLS,
  calculateLevelFromXp,
  calculateXpFromLevel,
  getEffectiveTool,
  calculateWoodcuttingSuccess,
  calculateMiningSuccess,
  calculateFishingSuccess,
  calculateBurnChance,
  SkillType,
} from '@runerogue/osrs-data';

// Re-export the types and constants that are needed elsewhere
export {
  ResourceType,
  SkillType,
  FISH,
  TOOL_EFFECTIVENESS,
  calculateCookingSuccess,
  calculateFiremakingSuccess,
  BIRD_NEST_DROP_RATE,
  BEAVER_PET_DROP_RATES,
  ROCK_GOLEM_PET_DROP_RATES,
  PET_DROP_RATES,
  PHOENIX_PET_DROP_RATES,
  ROCKY_PET_DROP_RATE,
  TINDERBOX_ID,
} from '@runerogue/osrs-data';

/**
 * A unified map of all resource data, indexed by the resource ID.
 * This is created at startup to allow for efficient lookups in systems.
 */
const resourcesById: Record<number, { skill: SkillType; [key: string]: any }> = {};

// Populate the map from the imported OSRS data
for (const tree of Object.values(TREES)) {
  resourcesById[tree.id] = { ...tree, skill: SkillType.WOODCUTTING };
}
for (const rock of Object.values(ROCKS)) {
  resourcesById[rock.id] = { ...rock, skill: SkillType.MINING };
}
for (const spot of Object.values(FISHING_SPOTS)) {
  resourcesById[spot.id] = { ...spot, skill: SkillType.FISHING };
}

export const OSRS_RESOURCES_BY_ID = resourcesById;

/**
 * Combined resource data for easy ECS system access
 */
export const OSRS_RESOURCE_DATA = {
  TREES,
  ROCKS,
  FISHING_SPOTS,
  COOKABLE_ITEMS,
  LOGS,
  TOOLS: {
    WOODCUTTING: WOODCUTTING_TOOLS,
    MINING: MINING_TOOLS,
    FISHING: FISHING_TOOLS,
  },
  CALCULATIONS: {
    calculateLevelFromXp,
    calculateXpFromLevel,
    getEffectiveTool,
    calculateWoodcuttingSuccess,
    calculateMiningSuccess,
    calculateFishingSuccess,
    calculateBurnChance,
  },
};
