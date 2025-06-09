/**
 * Gathering System
 * Handles resource gathering mechanics for mining, woodcutting, and fishing
 */

import { GameState, Player, Resource, InventoryItem } from './EntitySchemas';
import { ItemManager } from './ItemManager';
import { sendGameEventNotification } from '../discord-bot';

export interface GatheringResult {
  success: boolean;
  message: string;
  item?: string;
  quantity?: number;
  xpGained?: number;
}

export interface ResourceDefinition {
  type: string;
  name: string;
  requiredSkill: number;
  skillType: 'mining' | 'woodcutting' | 'fishing';
  respawnTime: number;
  successChance: number; // Base success chance
  xpReward: number;
  loot: Array<{
    itemId: string;
    minQuantity: number;
    maxQuantity: number;
    weight: number; // Weight for random selection
  }>;
}

export class GatheringSystem {
  private static instance: GatheringSystem;
  private itemManager: ItemManager;

  // Resource definitions
  private resourceDefinitions: Map<string, ResourceDefinition> = new Map([
    [
      'tree',
      {
        type: 'tree',
        name: 'Tree',
        requiredSkill: 1,
        skillType: 'woodcutting',
        respawnTime: 60000, // 1 minute
        successChance: 0.8,
        xpReward: 25,
        loot: [{ itemId: 'logs', minQuantity: 1, maxQuantity: 1, weight: 100 }],
      },
    ],
    [
      'oak_tree',
      {
        type: 'oak_tree',
        name: 'Oak Tree',
        requiredSkill: 15,
        skillType: 'woodcutting',
        respawnTime: 90000, // 1.5 minutes
        successChance: 0.6,
        xpReward: 37.5,
        loot: [{ itemId: 'oak_logs', minQuantity: 1, maxQuantity: 1, weight: 100 }],
      },
    ],
    [
      'copper_rock',
      {
        type: 'copper_rock',
        name: 'Copper Rock',
        requiredSkill: 1,
        skillType: 'mining',
        respawnTime: 45000, // 45 seconds
        successChance: 0.85,
        xpReward: 17.5,
        loot: [{ itemId: 'copper_ore', minQuantity: 1, maxQuantity: 1, weight: 100 }],
      },
    ],
    [
      'iron_rock',
      {
        type: 'iron_rock',
        name: 'Iron Rock',
        requiredSkill: 15,
        skillType: 'mining',
        respawnTime: 60000, // 1 minute
        successChance: 0.65,
        xpReward: 35,
        loot: [{ itemId: 'iron_ore', minQuantity: 1, maxQuantity: 1, weight: 100 }],
      },
    ],
    [
      'fishing_spot',
      {
        type: 'fishing_spot',
        name: 'Fishing Spot',
        requiredSkill: 1,
        skillType: 'fishing',
        respawnTime: 0, // Fishing spots don't deplete
        successChance: 0.7,
        xpReward: 40,
        loot: [
          { itemId: 'raw_shrimps', minQuantity: 1, maxQuantity: 1, weight: 70 },
          { itemId: 'raw_anchovies', minQuantity: 1, maxQuantity: 1, weight: 30 },
        ],
      },
    ],
  ]);

  private constructor() {
    this.itemManager = ItemManager.getInstance();
  }

  public static getInstance(): GatheringSystem {
    if (!GatheringSystem.instance) {
      GatheringSystem.instance = new GatheringSystem();
    }
    return GatheringSystem.instance;
  }

  /**
   * Attempt to gather from a resource
   */
  public async gatherResource(
    state: GameState,
    player: Player,
    resourceId: string
  ): Promise<GatheringResult> {
    const resource = state.resources.get(resourceId);
    if (!resource) {
      return {
        success: false,
        message: 'Resource not found',
      };
    }

    // Check if resource is depleted
    if (resource.depleted) {
      return {
        success: false,
        message: 'This resource is depleted',
      };
    }

    // Check distance
    const distance = Math.abs(player.x - resource.x) + Math.abs(player.y - resource.y);
    if (distance > 2) {
      return {
        success: false,
        message: 'You are too far from the resource',
      };
    }

    // Check if player is busy
    if (player.isBusy) {
      return {
        success: false,
        message: 'You are already busy',
      };
    }

    // Get resource definition
    const definition = this.resourceDefinitions.get(resource.type);
    if (!definition) {
      return {
        success: false,
        message: 'Unknown resource type',
      };
    }

    // Check skill requirement
    const playerSkillLevel = this.getPlayerSkillLevel(player, definition.skillType);
    if (playerSkillLevel < definition.requiredSkill) {
      return {
        success: false,
        message: `You need level ${definition.requiredSkill} ${definition.skillType} to gather this resource`,
      };
    }

    // Check if player has required tool
    const hasRequiredTool = this.hasRequiredTool(player, definition.skillType);
    if (!hasRequiredTool) {
      const toolName = this.getRequiredToolName(definition.skillType);
      return {
        success: false,
        message: `You need a ${toolName} to gather this resource`,
      };
    }

    // Check inventory space
    if (player.inventory.length >= player.inventorySize) {
      return {
        success: false,
        message: 'Your inventory is full',
      };
    }

    // Set player busy for gathering duration
    const gatheringTime = this.calculateGatheringTime(playerSkillLevel, definition.requiredSkill);
    player.setBusy(gatheringTime);

    // Calculate success chance based on skill level
    const successChance = this.calculateSuccessChance(playerSkillLevel, definition);

    // Simulate gathering after delay
    setTimeout(async () => {
      if (Math.random() < successChance) {
        // Success! Select loot
        const loot = this.selectLoot(definition.loot);
        if (loot) {
          // Add item to inventory
          const itemDef = await this.itemManager.getItemDefinition(loot.itemId);
          if (itemDef) {
            const quantity =
              loot.minQuantity +
              Math.floor(Math.random() * (loot.maxQuantity - loot.minQuantity + 1));

            const inventoryItem = new InventoryItem(itemDef, quantity);
            player.inventory.push(inventoryItem);

            // Award XP
            const xpGained = definition.xpReward;
            this.awardGatheringXP(player, definition.skillType, xpGained);

            // Deplete resource (except fishing spots)
            if (definition.respawnTime > 0) {
              resource.deplete();
            }

            // Send success notification
            if (definition.xpReward > 50) {
              // Notify for valuable resources
              sendGameEventNotification('achievement', {
                playerName: player.username,
                achievementName: `Gathered ${itemDef.name}`,
                points: Math.floor(xpGained),
              });
            }
          }
        }
      }
    }, gatheringTime);

    return {
      success: true,
      message: `You begin ${definition.skillType}...`,
    };
  }

  /**
   * Get player skill level for a gathering skill
   */
  private getPlayerSkillLevel(player: Player, skillType: string): number {
    switch (skillType) {
      case 'mining':
        return player.skills.mining?.level || 1;
      case 'woodcutting':
        return player.skills.woodcutting?.level || 1;
      case 'fishing':
        return player.skills.fishing?.level || 1;
      default:
        return 1;
    }
  }

  /**
   * Check if player has required tool
   */
  private hasRequiredTool(player: Player, skillType: string): boolean {
    // For now, check if player has any tool of the right type
    const toolPatterns: Record<string, RegExp> = {
      mining: /pickaxe|pick/i,
      woodcutting: /axe|hatchet/i,
      fishing: /rod|net|harpoon/i,
    };

    const pattern = toolPatterns[skillType];
    if (!pattern) return false;

    return player.inventory.some(item => pattern.test(item.itemId));
  }

  /**
   * Get required tool name
   */
  private getRequiredToolName(skillType: string): string {
    switch (skillType) {
      case 'mining':
        return 'pickaxe';
      case 'woodcutting':
        return 'axe';
      case 'fishing':
        return 'fishing rod';
      default:
        return 'tool';
    }
  }

  /**
   * Calculate gathering time based on skill level
   */
  private calculateGatheringTime(playerLevel: number, requiredLevel: number): number {
    const baseTime = 3000; // 3 seconds base
    const levelDifference = playerLevel - requiredLevel;
    const speedBonus = Math.min(levelDifference * 0.02, 0.5); // Max 50% faster
    return Math.floor(baseTime * (1 - speedBonus));
  }

  /**
   * Calculate success chance based on skill level
   */
  private calculateSuccessChance(playerLevel: number, definition: ResourceDefinition): number {
    const levelDifference = playerLevel - definition.requiredSkill;
    const levelBonus = Math.min(levelDifference * 0.01, 0.2); // Max 20% bonus
    return Math.min(definition.successChance + levelBonus, 0.99); // Cap at 99%
  }

  /**
   * Select loot based on weights
   */
  private selectLoot(lootTable: ResourceDefinition['loot']): ResourceDefinition['loot'][0] | null {
    const totalWeight = lootTable.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const loot of lootTable) {
      random -= loot.weight;
      if (random <= 0) {
        return loot;
      }
    }

    return lootTable[0] || null;
  }

  /**
   * Award XP to the appropriate gathering skill
   */
  private awardGatheringXP(player: Player, skillType: string, xp: number): void {
    switch (skillType) {
      case 'mining':
        if (player.skills.mining) {
          player.skills.mining.xp += xp;
          player.skills.mining.level = this.getLevelFromXP(player.skills.mining.xp);
        }
        break;
      case 'woodcutting':
        if (player.skills.woodcutting) {
          player.skills.woodcutting.xp += xp;
          player.skills.woodcutting.level = this.getLevelFromXP(player.skills.woodcutting.xp);
        }
        break;
      case 'fishing':
        if (player.skills.fishing) {
          player.skills.fishing.xp += xp;
          player.skills.fishing.level = this.getLevelFromXP(player.skills.fishing.xp);
        }
        break;
    }
  }

  /**
   * Calculate level from XP (same as WaveManager)
   */
  private getLevelFromXP(xp: number): number {
    const xpTable = [
      0, 83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107, 2411, 2746, 3115,
      3523, 3973, 4470, 5018, 5624, 6291, 7028, 7842, 8740, 9730, 10824, 12031, 13363, 14833, 16456,
      18247, 20224, 22406, 24815, 27473, 30408, 33648, 37224, 41171, 45529, 50339, 55649, 61512,
      67983, 75127, 83014, 91721, 101333, 111945, 123660, 136594, 150872, 166636, 184040, 203254,
      224466, 247886, 273742, 302288, 333804, 368599, 407015, 449428, 496254, 547953, 605032,
      668051, 737627, 814445, 899257, 992895, 1096278, 1210421, 1336443, 1475581, 1629200, 1798808,
      1986068, 2192818, 2421087, 2673114, 2951373, 3258594, 3597792, 3972294, 4385776, 4842295,
      5346332, 5902831, 6517253, 7195629, 7944614, 8771558, 9684577, 10692629, 11805606, 13034431,
    ];

    for (let level = 1; level < xpTable.length; level++) {
      if (xp < xpTable[level]) {
        return level;
      }
    }
    return 99;
  }

  /**
   * Spawn resources in the game world
   */
  public spawnResources(state: GameState, mapWidth: number, mapHeight: number): void {
    // Define resource spawn configurations
    const spawnConfigs = [
      { type: 'tree', count: 15, minLevel: 1 },
      { type: 'oak_tree', count: 8, minLevel: 15 },
      { type: 'copper_rock', count: 10, minLevel: 1 },
      { type: 'iron_rock', count: 6, minLevel: 15 },
      { type: 'fishing_spot', count: 5, minLevel: 1 },
    ];

    for (const config of spawnConfigs) {
      for (let i = 0; i < config.count; i++) {
        // Random position with some margin from edges
        const x = 5 + Math.floor(Math.random() * (mapWidth - 10));
        const y = 5 + Math.floor(Math.random() * (mapHeight - 10));

        const resource = new Resource(config.type, x, y);
        state.resources.set(resource.id, resource);
      }
    }

    console.log(`Spawned ${state.resources.size} resource nodes`);
  }

  /**
   * Update all resources (check for respawns)
   */
  public updateResources(state: GameState): void {
    state.resources.forEach(resource => {
      if (resource.depleted) {
        resource.checkRespawn();
      }
    });
  }
}
