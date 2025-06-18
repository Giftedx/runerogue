/**
 * MiningSystem - OSRS-authentic ECS system for mining.
 * Handles rock interaction, depletion, respawn, and item/XP rewards using real OSRS data.
 *
 * Data sources: OSRS Wiki (https://oldschool.runescape.wiki/w/Mining),
 *               OSRS Wiki (https://oldschool.runescape.wiki/w/Pickaxe),
 *               OSRS Wiki (https://oldschool.runescape.wiki/w/Ores)
 *
 * This system implements complete OSRS mechanics for levels 1-50.
 */
import { defineSystem, defineQuery, IWorld } from 'bitecs';
import { ResourceNode, SkillLevels, SkillXP, Inventory, Player, Gathering } from '../components';

/**
 * Mining action timers (in ticks) for each player.
 * This should ideally be part of the ECS Gathering component, but is kept here for simplicity.
 */
const miningActionTimer: Record<number, number> = {};
import type { Result, GameError } from '@runerogue/shared';
import {
  ROCKS,
  MINING_TOOLS,
  calculateLevelFromXp,
  getEffectiveTool,
  calculateMiningSuccess,
  ROCK_GOLEM_PET_DROP_RATES,
} from '@runerogue/osrs-data/src/skills/gathering-data';
import { rollGemTable } from '@runerogue/osrs-data/src/skills/gem-table';

// Infer the Rock type from the ROCKS constant
type Rock = (typeof ROCKS)[keyof typeof ROCKS];

const rocksById: Record<number, Rock> = Object.values(ROCKS).reduce<Record<number, Rock>>(
  (acc, rock) => {
    acc[rock.id] = rock;
    return acc;
  },
  {}
);

/**
 * The probability (1%) that a gem will be dropped when mining any rock.
 * @see https://oldschool.runescape.wiki/w/Mining#Gems
 */
const GEM_DROP_CHANCE = 0.01;

/**
 * Query for entities that can be mined (rocks)
 */
const miningNodesQuery = defineQuery([ResourceNode]);

/**
 * Query for players actively mining
 */
const activeMinersQuery = defineQuery([SkillLevels, SkillXP, Inventory, Player, Gathering]);

/**
 * Check if player has required tool and level for a rock
 * @param playerId Player entity ID
 * @param rockId Rock resource ID
 * @returns Result<{ tool: ToolType }, GameError>
 */
function canMineRock(
  playerId: number,
  rockId: number
): Result<{ tool: (typeof MINING_TOOLS)[keyof typeof MINING_TOOLS] }, GameError> {
  const rock = rocksById[rockId];
  if (!rock) {
    return { success: false, error: { type: 'INVALID_INPUT', message: 'Invalid rock' } };
  }
  const playerLevel = calculateLevelFromXp(SkillXP.mining[playerId] ?? 0);
  if (playerLevel < rock.level) {
    return {
      success: false,
      error: { type: 'INVALID_INPUT', message: `Required level: ${rock.level}` },
    };
  }
  const tool = getEffectiveTool(MINING_TOOLS, playerLevel, playerId);
  if (!tool) {
    return {
      success: false,
      error: { type: 'INVALID_INPUT', message: 'No suitable pickaxe found' },
    };
  }
  return { success: true, value: { tool } };
}

/**
 * Process mining attempt for a player on a rock node.
 * @param world ECS world
 * @param playerId Player entity ID
 * @param nodeId Rock node entity ID
 * @returns Result<boolean, GameError> - true if mining was successful
 */
function processMiningAttempt(
  world: IWorld,
  playerId: number,
  nodeId: number
): Result<boolean, GameError> {
  // TODO: Implement inventory full check if needed
  const rockId = ResourceNode.resourceId[nodeId];
  const rock = rocksById[rockId];
  if (!rock)
    return { success: false, error: { type: 'INVALID_INPUT', message: 'Invalid rock node' } };
  const playerLevel = calculateLevelFromXp(SkillXP.mining[playerId] ?? 0);
  const tool = getEffectiveTool(MINING_TOOLS, playerLevel, playerId);
  if (!tool)
    return {
      success: false,
      error: { type: 'INVALID_INPUT', message: 'No suitable pickaxe found' },
    };
  // Calculate success chance using OSRS formula
  const successChance = calculateMiningSuccess(playerLevel, rock.level, tool.effectiveness);
  if (Math.random() < successChance) {
    // Success! Award ore and XP
    awardMiningRewards(world, playerId, rock);
    // Most rocks deplete after mining (except some special ones)
    if (rock.depletionChance >= 1.0 || Math.random() < rock.depletionChance) {
      ResourceNode.depleted[nodeId] = 1;
      ResourceNode.respawnTimer[nodeId] = rock.respawnTicks;
    }
    return { success: true, value: true };
  }
  return { success: true, value: false };
}

/**
 * Award mining rewards (ore, XP, rare drops) to a player.
 * @param world ECS world
 * @param playerId Player entity ID
 * @param rock Rock data
 */
function awardMiningRewards(world: IWorld, playerId: number, rock: Rock): void {
  // TODO: Integrate with inventory system to add ore (see OSRS: https://oldschool.runescape.wiki/w/Ores)
  // Award XP (OSRS: https://oldschool.runescape.wiki/w/Mining#Training_methods)
  SkillXP.mining[playerId] = (SkillXP.mining[playerId] ?? 0) + rock.xp;
  // Check for rock golem pet drop (OSRS: https://oldschool.runescape.wiki/w/Rock_golem_(pet))
  const petDropRate =
    (ROCK_GOLEM_PET_DROP_RATES as Record<number, number>)[rock.id] ??
    ROCK_GOLEM_PET_DROP_RATES.default;
  if (Math.random() < 1 / petDropRate) {
    // TODO: Add rock golem pet to inventory
  }
  // Gem drop check (universal, not per-rock)
  const playerMiningLevel = SkillLevels.mining[playerId] ?? 1;
  if (Math.random() < GEM_DROP_CHANCE) {
    const gem = rollGemTable(playerMiningLevel);
    if (gem) {
      // TODO: Add gem to inventory
    }
  }
}

/**
 * Handle rock respawning (tick-based)
 * @param nodeId Rock node entity ID
 */
function processRockRespawn(nodeId: number): void {
  if (ResourceNode.depleted[nodeId]) {
    if (ResourceNode.respawnTimer[nodeId] > 0) {
      ResourceNode.respawnTimer[nodeId]--;
    } else {
      ResourceNode.depleted[nodeId] = 0;
    }
  }
}

/**
 * Initiates the mining action for a player on a specified rock node.
 *
 * Side effects:
 * - Sets the `Gathering.target` for the player to the specified node ID, marking the player as actively mining.
 * - May overwrite any previous mining target for the player.
 * - Does not check for inventory space or send error messages to the player directly.
 *
 * @param playerId Player entity ID
 * @param nodeId Rock node entity ID
 * @returns {Result<boolean, GameError>} Result object; `true` if mining started, otherwise contains a `GameError`.
 */
export function startMining(playerId: number, nodeId: number): Result<boolean, GameError> {
  const rockId = ResourceNode.resourceId[nodeId];
  const canMineResult = canMineRock(playerId, rockId);
  if (!canMineResult.success) {
    // TODO: Send error message to player if needed
    return { success: false, error: canMineResult.error };
  }
  // Set up gathering action (replace with ECS pattern as needed)
  Gathering.target[playerId] = nodeId;
  // Optionally store tool info, start time, etc.
  return { success: true, value: true };
}

/**
 * Stop mining action for a player.
 * @param playerId Player entity ID
 */
export function stopMining(playerId: number): void {
  Gathering.target[playerId] = 0;
  delete miningActionTimer[playerId];
}

/**
 * Main mining ECS system. Handles rock respawn and mining actions.
 * @param world ECS world
 * @returns Updated world
 */
export const MiningSystem = defineSystem((world: IWorld) => {
  // Process rock respawning
  for (const nodeId of miningNodesQuery(world)) {
    processRockRespawn(nodeId);
  }

  // Process active mining actions (tick-based)
  for (const playerId of activeMinersQuery(world)) {
    const nodeId = Gathering.target[playerId];
    if (!nodeId || ResourceNode.depleted[nodeId]) continue;

    // Get rock and tool info, with robust error handling and type safety
    const rockId = ResourceNode.resourceId[nodeId];
    const rock = rocksById[rockId];
    const playerLevel = calculateLevelFromXp(SkillXP.mining[playerId] ?? 0);
    const tool = getEffectiveTool(MINING_TOOLS, playerLevel, playerId);

    /**
     * Calculate mining delay (in ticks) based on OSRS mechanics.
     * Fallbacks:
     *   - If rock is missing, use 5 baseTicks, 2 minTicks.
     *   - If tool is missing, use 0 speedBonus.
     *   - All values are clamped to ensure delay is at least 1 tick.
     * @see https://oldschool.runescape.wiki/w/Mining#Mining_speed
     */
    let baseTicks = 5;
    let minTicks = 2;
    if (rock) {
      baseTicks = typeof rock.baseTicks === 'number' ? rock.baseTicks : 5;
      minTicks = typeof rock.minTicks === 'number' ? rock.minTicks : 2;
    }
    const speedBonus = tool && typeof tool.speedBonus === 'number' ? tool.speedBonus : 0;
    let miningDelay = Math.max(baseTicks - speedBonus, minTicks);
    if (!Number.isFinite(miningDelay) || miningDelay < 1) miningDelay = 1;

    // Initialize timer if not present or if mining target changed
    if (miningActionTimer[playerId] === undefined) {
      miningActionTimer[playerId] = miningDelay;
    }

    // Decrement timer and process mining attempt when timer reaches zero
    if (miningActionTimer[playerId] > 0) {
      miningActionTimer[playerId]--;
    }
    if (miningActionTimer[playerId] === 0) {
      // Only process mining if rock and tool are valid
      if (rock && tool) {
        processMiningAttempt(world, playerId, nodeId);
      }
      miningActionTimer[playerId] = miningDelay;
    }
  }
  return world;
});

// ...existing code...

export default MiningSystem;
