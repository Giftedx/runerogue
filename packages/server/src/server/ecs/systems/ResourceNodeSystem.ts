/**
 * ResourceNodeSystem - Generic ECS system for OSRS-authentic resource gathering (woodcutting, mining, fishing, etc.)
 * Handles node interaction, depletion, respawn, and item/XP rewards.
 *
 * This is a template for all resource skills. Each skill (woodcutting, mining, fishing, etc.)
 * should have a specialized system using this pattern, with OSRS-accurate requirements and logic.
 */
import {
  defineSystem,
  defineQuery,
  IWorld,
  hasComponent,
  addComponent,
  removeComponent,
} from 'bitecs';
import {
  Player,
  SkillLevels,
  SkillXP,
  Inventory,
  Item,
  Position,
  ResourceNode,
  Gathering,
  Dead,
} from '../components';
import { addSkillXP } from './SkillSystem';
import { addItemToInventory } from './EquipmentSystem';
import { OSRS_RESOURCES_BY_ID } from '../../data/osrs-resource-data';
import { SkillType as GatheringSkillType } from '@runerogue/osrs-data/dist/skills/gathering-data';
import { SkillType as ECSSkillType } from './SkillSystem';

// Helper to map between the numeric gathering skill enum and the string-based ECS skill enum
function mapGatheringSkillToECSSkill(skill: GatheringSkillType): ECSSkillType | null {
  switch (skill) {
    case GatheringSkillType.WOODCUTTING:
      return ECSSkillType.WOODCUTTING;
    case GatheringSkillType.MINING:
      return ECSSkillType.MINING;
    case GatheringSkillType.FISHING:
      return ECSSkillType.FISHING;
    // Add other mappings as needed
    default:
      return null;
  }
}

/**
 * ResourceNode component - attach to all resource nodes (trees, rocks, fishing spots, etc.)
 * type: e.g. 'tree', 'oak_tree', 'fishing_spot', 'copper_rock', etc.
 * requiredLevel: minimum skill level to interact
 * requiredTool: itemId of required tool (e.g. 'bronze_axe', 'small_fishing_net')
 * depleted: whether the node is currently depleted
 * respawnTimer: ticks until respawn
 * xp: XP awarded per successful gather
 * itemId: itemId of resource (e.g. 'logs', 'raw_shrimp')
 */
// ...component definition would be in components.ts...

/**
 * Example resource node data (should be loaded from OSRS data pipeline)
 * const OSRS_RESOURCE_DATA = {
 *   tree: { requiredLevel: 1, requiredTool: 'bronze_axe', xp: 25, itemId: 'logs', depletionChance: 0.05, respawnTicks: 5 },
 *   oak_tree: { requiredLevel: 15, requiredTool: 'bronze_axe', xp: 37, itemId: 'oak_logs', depletionChance: 0.1, respawnTicks: 10 },
 *   ...
 * };
 */

export const ResourceNodeSystem = defineSystem((world: IWorld) => {
  const nodes = defineQuery([ResourceNode])(world);
  for (const nodeId of nodes) {
    const nodeType = ResourceNode.type[nodeId];
    const nodeData = OSRS_RESOURCES_BY_ID[nodeType];
    if (!nodeData) continue;
    if (ResourceNode.depleted[nodeId]) {
      // Handle respawn
      ResourceNode.respawnTimer[nodeId]--;
      if (ResourceNode.respawnTimer[nodeId] <= 0) {
        ResourceNode.depleted[nodeId] = 0;
      }
      continue;
    }
    // Find players gathering this node
    const gatherers = defineQuery([Player, Gathering])(world);
    for (const playerId of gatherers) {
      if (Gathering.target[playerId] !== nodeId) continue; // Check requirements

      const ecsSkill = mapGatheringSkillToECSSkill(nodeData.skill);
      if (!ecsSkill) continue; // Skip if no valid skill mapping

      const skillName = ecsSkill.toLowerCase();
      let skillLevel = 1;

      // NOTE: bitecs components do not support dynamic property access (e.g., SkillLevels[skillName]).
      // A switch or lookup is required for type-safe access to the underlying skill data.
      switch (skillName) {
        case 'attack':
          skillLevel = SkillLevels.attack[playerId];
          break;
        case 'defence':
          skillLevel = SkillLevels.defence[playerId];
          break;
        case 'strength':
          skillLevel = SkillLevels.strength[playerId];
          break;
        case 'hitpoints':
          skillLevel = SkillLevels.hitpoints[playerId];
          break;
        case 'ranged':
          skillLevel = SkillLevels.ranged[playerId];
          break;
        case 'prayer':
          skillLevel = SkillLevels.prayer[playerId];
          break;
        case 'magic':
          skillLevel = SkillLevels.magic[playerId];
          break;
        case 'cooking':
          skillLevel = SkillLevels.cooking[playerId];
          break;
        case 'woodcutting':
          skillLevel = SkillLevels.woodcutting[playerId];
          break;
        case 'fletching':
          skillLevel = SkillLevels.fletching[playerId];
          break;
        case 'fishing':
          skillLevel = SkillLevels.fishing[playerId];
          break;
        case 'firemaking':
          skillLevel = SkillLevels.firemaking[playerId];
          break;
        case 'crafting':
          skillLevel = SkillLevels.crafting[playerId];
          break;
        case 'smithing':
          skillLevel = SkillLevels.smithing[playerId];
          break;
        case 'mining':
          skillLevel = SkillLevels.mining[playerId];
          break;
        case 'herblore':
          skillLevel = SkillLevels.herblore[playerId];
          break;
        case 'agility':
          skillLevel = SkillLevels.agility[playerId];
          break;
        case 'thieving':
          skillLevel = SkillLevels.thieving[playerId];
          break;
        case 'slayer':
          skillLevel = SkillLevels.slayer[playerId];
          break;
        case 'farming':
          skillLevel = SkillLevels.farming[playerId];
          break;
        case 'runecraft':
          skillLevel = SkillLevels.runecraft[playerId];
          break;
        case 'hunter':
          skillLevel = SkillLevels.hunter[playerId];
          break;
        case 'construction':
          skillLevel = SkillLevels.construction[playerId];
          break;
      }

      if (skillLevel < nodeData.requiredLevel) continue;

      // Check for tool in inventory (simplified check)
      // TODO: Implement proper tool checking logic
      // if (!hasItemInInventory(world, playerId, nodeData.requiredTool)) continue;

      // OSRS-style success chance (scales with level)
      const successChance = Math.min(0.95, 0.3 + 0.7 * (skillLevel / 99));
      if (Math.random() < successChance) {
        // Award item and XP
        addItemToInventory(world, playerId, nodeData.itemId, 1);
        addSkillXP(world, playerId, ecsSkill, nodeData.xp);
        // Chance to deplete node
        if (Math.random() < nodeData.depletionChance) {
          ResourceNode.depleted[nodeId] = 1;
          ResourceNode.respawnTimer[nodeId] = nodeData.respawnTicks;
        }
      }
    }
  }
  return world;
});

/**
 * This system is a template. Specialized systems (WoodcuttingSystem, MiningSystem, FishingSystem, etc.)
 * should be created for each skill, using OSRS data for requirements, XP, depletion, and respawn.
 *
 * All item interactions (firemaking, cooking, etc.) should use a similar ECS pattern.
 */
