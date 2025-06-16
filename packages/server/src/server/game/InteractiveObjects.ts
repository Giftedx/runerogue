/**
 * Interactive Objects System for RuneRogue
 * Handles trees, rocks, NPCs, and other interactive game world elements
 * Based on authentic OSRS mechanics and object types
 */

export interface InteractiveObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  name: string;
  level: number; // Required level to interact
  health: number; // Current health/durability
  maxHealth: number; // Maximum health/durability
  respawnTime: number; // Time to respawn when depleted (in seconds)
  lastInteraction: number; // Timestamp of last interaction
  isRespawning: boolean;
  resourceId?: string; // What resource this gives when harvested
  resourceAmount?: number; // Base amount per harvest
}

export enum ObjectType {
  TREE = 'tree',
  ROCK = 'rock',
  FISHING_SPOT = 'fishing_spot',
  NPC = 'npc',
  TREASURE_CHEST = 'treasure_chest',
  ALTAR = 'altar',
  ANVIL = 'anvil',
  FURNACE = 'furnace',
}

export enum SkillType {
  WOODCUTTING = 'woodcutting',
  MINING = 'mining',
  FISHING = 'fishing',
  COOKING = 'cooking',
  SMITHING = 'smithing',
  CRAFTING = 'crafting',
  PRAYER = 'prayer',
}

export interface InteractionResult {
  success: boolean;
  message: string;
  xpGained: number;
  resourcesGained: ResourceDrop[];
  objectDepleted: boolean;
  newObjectHealth: number;
}

export interface ResourceDrop {
  itemId: string;
  itemName: string;
  quantity: number;
  rarity: string; // 'common', 'uncommon', 'rare', 'very_rare'
}

export interface ObjectTemplate {
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  respawnTime: number;
  resourceId?: string;
  resourceAmount?: number;
  xpPerHarvest?: number;
}

// OSRS Tree Definitions
export const OSRS_TREES = {
  NORMAL_TREE: {
    name: 'Tree',
    level: 1,
    health: 3,
    maxHealth: 3,
    respawnTime: 5, // 5 seconds
    resourceId: 'logs',
    resourceAmount: 1,
    xpPerHarvest: 25,
  },
  OAK_TREE: {
    name: 'Oak tree',
    level: 15,
    health: 5,
    maxHealth: 5,
    respawnTime: 8,
    resourceId: 'oak_logs',
    resourceAmount: 1,
    xpPerHarvest: 37.5,
  },
  WILLOW_TREE: {
    name: 'Willow tree',
    level: 30,
    health: 7,
    maxHealth: 7,
    respawnTime: 15,
    resourceId: 'willow_logs',
    resourceAmount: 1,
    xpPerHarvest: 67.5,
  },
  MAPLE_TREE: {
    name: 'Maple tree',
    level: 45,
    health: 10,
    maxHealth: 10,
    respawnTime: 35,
    resourceId: 'maple_logs',
    resourceAmount: 1,
    xpPerHarvest: 100,
  },
  YEW_TREE: {
    name: 'Yew tree',
    level: 60,
    health: 15,
    maxHealth: 15,
    respawnTime: 120, // 2 minutes
    resourceId: 'yew_logs',
    resourceAmount: 1,
    xpPerHarvest: 175,
  },
  MAGIC_TREE: {
    name: 'Magic tree',
    level: 75,
    health: 20,
    maxHealth: 20,
    respawnTime: 300, // 5 minutes
    resourceId: 'magic_logs',
    resourceAmount: 1,
    xpPerHarvest: 250,
  },
};

// OSRS Rock Definitions
export const OSRS_ROCKS = {
  COPPER_ROCK: {
    name: 'Copper rock',
    level: 1,
    health: 2,
    maxHealth: 2,
    respawnTime: 3,
    resourceId: 'copper_ore',
    resourceAmount: 1,
    xpPerHarvest: 17.5,
  },
  TIN_ROCK: {
    name: 'Tin rock',
    level: 1,
    health: 2,
    maxHealth: 2,
    respawnTime: 3,
    resourceId: 'tin_ore',
    resourceAmount: 1,
    xpPerHarvest: 17.5,
  },
  IRON_ROCK: {
    name: 'Iron rock',
    level: 15,
    health: 4,
    maxHealth: 4,
    respawnTime: 5,
    resourceId: 'iron_ore',
    resourceAmount: 1,
    xpPerHarvest: 35,
  },
  COAL_ROCK: {
    name: 'Coal rock',
    level: 30,
    health: 6,
    maxHealth: 6,
    respawnTime: 8,
    resourceId: 'coal',
    resourceAmount: 1,
    xpPerHarvest: 50,
  },
  MITHRIL_ROCK: {
    name: 'Mithril rock',
    level: 55,
    health: 10,
    maxHealth: 10,
    respawnTime: 120,
    resourceId: 'mithril_ore',
    resourceAmount: 1,
    xpPerHarvest: 80,
  },
  ADAMANTITE_ROCK: {
    name: 'Adamantite rock',
    level: 70,
    health: 15,
    maxHealth: 15,
    respawnTime: 240,
    resourceId: 'adamantite_ore',
    resourceAmount: 1,
    xpPerHarvest: 95,
  },
  RUNITE_ROCK: {
    name: 'Runite rock',
    level: 85,
    health: 20,
    maxHealth: 20,
    respawnTime: 720, // 12 minutes
    resourceId: 'runite_ore',
    resourceAmount: 1,
    xpPerHarvest: 125,
  },
};

/**
 * Interactive Objects Manager
 * Handles spawning, interaction, and management of world objects
 */
export class InteractiveObjectsManager {
  private objects = new Map<string, InteractiveObject>();
  private respawnTimers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.logger = console; // Use console for now, can be replaced with proper logger
  }

  private logger: Console;

  /**
   * Spawn an interactive object in the world
   */
  spawnObject(
    type: ObjectType,
    x: number,
    y: number,
    objectData: ObjectTemplate
  ): InteractiveObject {
    const id = `${type}_${x}_${y}_${Date.now()}`;

    const object: InteractiveObject = {
      id,
      type,
      x,
      y,
      name: objectData.name,
      level: objectData.level,
      health: objectData.maxHealth,
      maxHealth: objectData.maxHealth,
      respawnTime: objectData.respawnTime,
      lastInteraction: 0,
      isRespawning: false,
      resourceId: objectData.resourceId,
      resourceAmount: objectData.resourceAmount,
    };

    this.objects.set(id, object);
    this.logger.log(`Spawned ${object.name} at (${x}, ${y}) with ID: ${id}`);

    return object;
  }

  /**
   * Get all objects in the world
   */
  getAllObjects(): InteractiveObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Get object by ID
   */
  getObject(id: string): InteractiveObject | undefined {
    return this.objects.get(id);
  }

  /**
   * Get objects within a radius of a position
   */
  getObjectsNear(x: number, y: number, radius: number): InteractiveObject[] {
    return this.getAllObjects().filter(obj => {
      const distance = Math.sqrt((obj.x - x) ** 2 + (obj.y - y) ** 2);
      return distance <= radius;
    });
  }

  /**
   * Interact with an object (woodcutting, mining, etc.)
   */
  interactWithObject(
    objectId: string,
    playerId: string,
    playerSkillLevel: number,
    skillType: SkillType
  ): InteractionResult {
    const object = this.objects.get(objectId);

    if (!object) {
      return {
        success: false,
        message: 'Object not found',
        xpGained: 0,
        resourcesGained: [],
        objectDepleted: false,
        newObjectHealth: 0,
      };
    }

    if (object.isRespawning) {
      return {
        success: false,
        message: `${object.name} is depleted and respawning`,
        xpGained: 0,
        resourcesGained: [],
        objectDepleted: true,
        newObjectHealth: 0,
      };
    }

    // Check level requirement
    if (playerSkillLevel < object.level) {
      return {
        success: false,
        message: `You need level ${object.level} ${skillType} to interact with this ${object.name}`,
        xpGained: 0,
        resourcesGained: [],
        objectDepleted: false,
        newObjectHealth: object.health,
      };
    }

    // Check interaction cooldown (anti-spam)
    const currentTime = Date.now();
    const cooldownTime = 1000; // 1 second cooldown
    if (currentTime - object.lastInteraction < cooldownTime) {
      return {
        success: false,
        message: 'Too fast! Wait a moment before interacting again',
        xpGained: 0,
        resourcesGained: [],
        objectDepleted: false,
        newObjectHealth: object.health,
      };
    }

    // Calculate success rate based on level difference
    const levelAdvantage = playerSkillLevel - object.level;
    const baseSuccessRate = 0.3; // 30% base success rate
    const levelBonus = Math.min(0.6, levelAdvantage * 0.05); // Up to 60% bonus
    const successRate = Math.min(0.9, baseSuccessRate + levelBonus); // Max 90%

    const success = Math.random() < successRate;

    object.lastInteraction = currentTime;

    if (!success) {
      return {
        success: false,
        message: `You attempt to harvest the ${object.name} but fail`,
        xpGained: 0,
        resourcesGained: [],
        objectDepleted: false,
        newObjectHealth: object.health,
      };
    }

    // Successful interaction - damage object and give resources
    object.health -= 1;

    const resourcesGained: ResourceDrop[] = [];
    if (object.resourceId && object.resourceAmount) {
      resourcesGained.push({
        itemId: object.resourceId,
        itemName: object.resourceId.replace('_', ' '),
        quantity: object.resourceAmount,
        rarity: 'common',
      });
    }

    // Calculate XP based on object type
    const xpGained = this.calculateXpGain(object, skillType);

    // Check if object is depleted
    const objectDepleted = object.health <= 0;
    if (objectDepleted) {
      this.startRespawnTimer(object);
    }

    this.logger.log(
      `Player ${playerId} successfully harvested ${object.name} - Health: ${object.health}/${object.maxHealth}, XP: ${xpGained}`
    );

    return {
      success: true,
      message: `You successfully harvest the ${object.name}`,
      xpGained,
      resourcesGained,
      objectDepleted,
      newObjectHealth: object.health,
    };
  }

  /**
   * Calculate XP gain for successful interaction
   */
  private calculateXpGain(object: InteractiveObject, skillType: SkillType): number {
    // Base XP values by object type - OSRS authentic
    const baseXp = {
      [ObjectType.TREE]: {
        [SkillType.WOODCUTTING]: {
          Tree: 25,
          'Oak tree': 37.5,
          'Willow tree': 67.5,
          'Maple tree': 100,
          'Yew tree': 175,
          'Magic tree': 250,
        },
      },
      [ObjectType.ROCK]: {
        [SkillType.MINING]: {
          'Copper rock': 17.5,
          'Tin rock': 17.5,
          'Iron rock': 35,
          'Coal rock': 50,
          'Mithril rock': 80,
          'Adamantite rock': 95,
          'Runite rock': 125,
        },
      },
    };

    return baseXp[object.type]?.[skillType]?.[object.name] || 10;
  }

  /**
   * Start respawn timer for depleted object
   */
  private startRespawnTimer(object: InteractiveObject): void {
    object.isRespawning = true;

    const timer = setTimeout(() => {
      object.health = object.maxHealth;
      object.isRespawning = false;
      this.respawnTimers.delete(object.id);

      this.logger.log(`${object.name} at (${object.x}, ${object.y}) has respawned`);
    }, object.respawnTime * 1000);

    this.respawnTimers.set(object.id, timer);
  }

  /**
   * Remove an object from the world
   */
  removeObject(objectId: string): boolean {
    const timer = this.respawnTimers.get(objectId);
    if (timer) {
      clearTimeout(timer);
      this.respawnTimers.delete(objectId);
    }

    return this.objects.delete(objectId);
  }

  /**
   * Get objects by type
   */
  getObjectsByType(type: ObjectType): InteractiveObject[] {
    return this.getAllObjects().filter(obj => obj.type === type);
  }

  /**
   * Cleanup all timers (call when shutting down)
   */
  cleanup(): void {
    this.respawnTimers.forEach(timer => clearTimeout(timer));
    this.respawnTimers.clear();
  }
}
