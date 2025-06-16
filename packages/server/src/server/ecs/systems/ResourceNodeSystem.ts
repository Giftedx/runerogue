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
import { OSRS_RESOURCE_DATA } from '../../data/osrs-resource-data';

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
    const nodeData = OSRS_RESOURCE_DATA[nodeType];
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
      const skillLevel = SkillLevels[nodeData.skill][playerId] ?? 1;
      if (skillLevel < nodeData.requiredLevel) continue;

      // Check for tool in inventory (simplified check)
      // TODO: Implement proper tool checking logic
      // if (!hasItemInInventory(world, playerId, nodeData.requiredTool)) continue;

      // OSRS-style success chance (scales with level)
      const successChance = Math.min(0.95, 0.3 + 0.7 * (skillLevel / 99));
      if (Math.random() < successChance) {
        // Award item and XP
        addItemToInventory(world, playerId, nodeData.itemId, 1);
        addSkillXP(world, playerId, nodeData.skill, nodeData.xp);
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
