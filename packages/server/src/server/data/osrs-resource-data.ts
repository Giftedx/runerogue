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
