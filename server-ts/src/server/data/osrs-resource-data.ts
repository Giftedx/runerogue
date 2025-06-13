/**
 * OSRS Resource Data for ECS Systems
 * Re-exports the gathering data from packages/osrs-data for use in ECS systems
 */

export {
  ResourceType,
  SkillType,
  TREES,
  ROCKS,
  FISHING_SPOTS,
  FISH,
  COOKABLE_ITEMS,
  LOGS,
  WOODCUTTING_TOOLS,
  MINING_TOOLS,
  FISHING_TOOLS,
  TOOL_EFFECTIVENESS,
  calculateLevelFromXp,
  calculateXpFromLevel,
  getEffectiveTool,
  calculateWoodcuttingSuccess,
  calculateMiningSuccess,
  calculateFishingSuccess,
  calculateCookingSuccess,
  calculateFiremakingSuccess,
  calculateBurnChance,
  BIRD_NEST_DROP_RATE,
  BEAVER_PET_DROP_RATES,
  ROCK_GOLEM_PET_DROP_RATES,
  PET_DROP_RATES,
  PHOENIX_PET_DROP_RATES,
  ROCKY_PET_DROP_RATE,
  TINDERBOX_ID,
} from '../../../../packages/osrs-data/src/skills/gathering-data';

/**
 * Combined resource data for easy ECS system access
 */
export const OSRS_RESOURCE_DATA = {
  TREES: require('../../../../packages/osrs-data/src/skills/gathering-data').TREES,
  ROCKS: require('../../../../packages/osrs-data/src/skills/gathering-data').ROCKS,
  FISHING_SPOTS: require('../../../../packages/osrs-data/src/skills/gathering-data').FISHING_SPOTS,
  COOKABLE_ITEMS: require('../../../../packages/osrs-data/src/skills/gathering-data')
    .COOKABLE_ITEMS,
  LOGS: require('../../../../packages/osrs-data/src/skills/gathering-data').LOGS,
  TOOLS: {
    WOODCUTTING: require('../../../../packages/osrs-data/src/skills/gathering-data')
      .WOODCUTTING_TOOLS,
    MINING: require('../../../../packages/osrs-data/src/skills/gathering-data').MINING_TOOLS,
    FISHING: require('../../../../packages/osrs-data/src/skills/gathering-data').FISHING_TOOLS,
  },
  CALCULATIONS: {
    calculateLevelFromXp: require('../../../../packages/osrs-data/src/skills/gathering-data')
      .calculateLevelFromXp,
    calculateXpFromLevel: require('../../../../packages/osrs-data/src/skills/gathering-data')
      .calculateXpFromLevel,
    getEffectiveTool: require('../../../../packages/osrs-data/src/skills/gathering-data')
      .getEffectiveTool,
    calculateWoodcuttingSuccess: require('../../../../packages/osrs-data/src/skills/gathering-data')
      .calculateWoodcuttingSuccess,
    calculateMiningSuccess: require('../../../../packages/osrs-data/src/skills/gathering-data')
      .calculateMiningSuccess,
    calculateFishingSuccess: require('../../../../packages/osrs-data/src/skills/gathering-data')
      .calculateFishingSuccess,
    calculateBurnChance: require('../../../../packages/osrs-data/src/skills/gathering-data')
      .calculateBurnChance,
  },
};
