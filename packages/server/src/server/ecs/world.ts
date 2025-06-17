import { addComponent, addEntity, createWorld, IWorld } from 'bitecs';

/**
 * Extended ECS world interface for RuneRogue, allowing custom properties.
 */
export interface RuneRogueWorld extends IWorld {
  entityCapacity?: number;
  deltaTime?: number;
}
import {
  Equipment,
  Health,
  Inventory,
  Item,
  LootDrop,
  Monster,
  Movement,
  NetworkEntity,
  NPC,
  NPCData,
  Player,
  Resource,
  SkillLevels,
  SkillXP,
  Prayer,
  Transform,
} from './components';
import {
  CombatSystem,
  MovementSystem,
  PrayerSystem,
  SkillSystem,
  ResourceNodeSystem,
  WoodcuttingSystem,
  MiningSystem,
  FishingSystem,
  CookingSystem,
  FiremakingSystem,
} from './systems';

// Create the ECS world with a high entity capacity
export const createECSWorld = (): IWorld => {
  const world: RuneRogueWorld = createWorld();
  // Set world configuration
  world.entityCapacity = 10000; // Support up to 10k entities
  world.deltaTime = 0.016; // Default 60 FPS
  return world;
};

/**
 * Systems array for the game loop, in OSRS-authentic execution order.
 * Includes all gathering systems for complete resource collection.
 */
export const GAME_SYSTEMS = [
  MovementSystem,
  CombatSystem,
  PrayerSystem,
  SkillSystem,
  ResourceNodeSystem,
  WoodcuttingSystem,
  MiningSystem,
  FishingSystem,
  CookingSystem,
  FiremakingSystem,
];

/**
 * Create a new player entity
 */
export function createPlayer(world: IWorld, sessionId: string, x: number, y: number): number {
  const eid = addEntity(world);

  // Core components
  addComponent(world, Player, eid);
  addComponent(world, Transform, eid);
  addComponent(world, Health, eid);
  addComponent(world, Equipment, eid);
  addComponent(world, SkillLevels, eid);
  addComponent(world, SkillXP, eid);
  addComponent(world, Prayer, eid);
  addComponent(world, Inventory, eid);
  addComponent(world, Movement, eid);
  addComponent(world, NetworkEntity, eid);

  // Initialize position
  Transform.x[eid] = x;
  Transform.y[eid] = y;
  Transform.z[eid] = 0;
  Transform.rotation[eid] = 0;

  // Initialize health
  Health.current[eid] = 10;
  Health.max[eid] = 10;

  // Initialize skill levels (OSRS combat skills)
  SkillLevels.attack[eid] = 1;
  SkillLevels.strength[eid] = 1;
  SkillLevels.defence[eid] = 1;
  SkillLevels.hitpoints[eid] = 10;
  SkillLevels.ranged[eid] = 1;
  SkillLevels.prayer[eid] = 1;
  SkillLevels.magic[eid] = 1;

  // Initialize non-combat skills
  SkillLevels.cooking[eid] = 1;
  SkillLevels.woodcutting[eid] = 1;
  SkillLevels.fletching[eid] = 1;
  SkillLevels.fishing[eid] = 1;
  SkillLevels.firemaking[eid] = 1;
  SkillLevels.crafting[eid] = 1;
  SkillLevels.smithing[eid] = 1;
  SkillLevels.mining[eid] = 1;
  SkillLevels.herblore[eid] = 1;
  SkillLevels.agility[eid] = 1;
  SkillLevels.thieving[eid] = 1;
  SkillLevels.slayer[eid] = 1;
  SkillLevels.farming[eid] = 1;
  SkillLevels.runecraft[eid] = 1;
  SkillLevels.hunter[eid] = 1;
  SkillLevels.construction[eid] = 1;

  // Initialize skill XP (OSRS combat skills)
  SkillXP.attack[eid] = 0;
  SkillXP.strength[eid] = 0;
  SkillXP.defence[eid] = 0;
  SkillXP.hitpoints[eid] = 1154; // XP for level 10
  SkillXP.ranged[eid] = 0;
  SkillXP.prayer[eid] = 0;
  SkillXP.magic[eid] = 0;

  // Initialize non-combat skill XP
  SkillXP.cooking[eid] = 0;
  SkillXP.woodcutting[eid] = 0;
  SkillXP.fletching[eid] = 0;
  SkillXP.fishing[eid] = 0;
  SkillXP.firemaking[eid] = 0;
  SkillXP.crafting[eid] = 0;
  SkillXP.smithing[eid] = 0;
  SkillXP.mining[eid] = 0;
  SkillXP.herblore[eid] = 0;
  SkillXP.agility[eid] = 0;
  SkillXP.thieving[eid] = 0;
  SkillXP.slayer[eid] = 0;
  SkillXP.farming[eid] = 0;
  SkillXP.runecraft[eid] = 0;
  SkillXP.hunter[eid] = 0;
  SkillXP.construction[eid] = 0;

  // Initialize prayer (bitmask, points, etc.)
  Prayer.points[eid] = 1;
  Prayer.activeMask[eid] = 0;
  Prayer.drainRate[eid] = 0;
  Prayer.drainTimer[eid] = 0;
  Prayer.level[eid] = 1;

  // Initialize movement
  Movement.speed[eid] = 5.0; // Units per second
  Movement.velocityX[eid] = 0;
  Movement.velocityY[eid] = 0;
  Movement.targetX[eid] = x;
  Movement.targetY[eid] = y;

  // Initialize network entity
  NetworkEntity.sessionHash[eid] = hashString(sessionId);
  NetworkEntity.lastUpdate[eid] = Date.now();

  return eid;
}

/**
 * Create an NPC entity
 */
export function createNPC(
  world: IWorld,
  npcId: number,
  x: number,
  y: number,
  combatLevel: number,
  isMonster: boolean = false
): number {
  const eid = addEntity(world);

  // Core components
  addComponent(world, NPC, eid);
  if (isMonster) {
    addComponent(world, Monster, eid);
  }
  addComponent(world, Transform, eid);
  addComponent(world, Health, eid);
  addComponent(world, SkillLevels, eid);
  addComponent(world, SkillXP, eid);
  addComponent(world, NPCData, eid);
  addComponent(world, Movement, eid);

  // Initialize position
  Transform.x[eid] = x;
  Transform.y[eid] = y;
  Transform.z[eid] = 0;
  Transform.rotation[eid] = 0;

  // Initialize NPC data
  NPCData.npcId[eid] = npcId;
  NPCData.combatLevel[eid] = combatLevel;
  NPCData.aggroRange[eid] = 5;
  NPCData.attackRange[eid] = 1;
  NPCData.attackSpeed[eid] = 4; // 4 ticks
  NPCData.respawnTime[eid] = 60; // 60 seconds

  // Initialize health based on combat level
  const maxHealth = 10 + combatLevel * 5;
  Health.current[eid] = maxHealth;
  Health.max[eid] = maxHealth;
  Health.regenRate[eid] = 0;

  // Initialize skill levels based on combat level
  const statLevel = Math.max(1, Math.floor(combatLevel * 0.8));
  SkillLevels.attack[eid] = statLevel;
  SkillLevels.strength[eid] = statLevel;
  SkillLevels.defence[eid] = statLevel;
  SkillLevels.hitpoints[eid] = Math.max(10, combatLevel);
  SkillLevels.ranged[eid] = 1;
  SkillLevels.prayer[eid] = 1;
  SkillLevels.magic[eid] = 1;

  // Initialize skill XP (all 0 except HP)
  SkillXP.attack[eid] = 0;
  SkillXP.strength[eid] = 0;
  SkillXP.defence[eid] = 0;
  SkillXP.hitpoints[eid] = 1154; // XP for level 10
  SkillXP.ranged[eid] = 0;
  SkillXP.prayer[eid] = 0;
  SkillXP.magic[eid] = 0;

  // Initialize prayer (bitmask, points, etc.)
  Prayer.points[eid] = 1;
  Prayer.activeMask[eid] = 0;
  Prayer.drainRate[eid] = 0;
  Prayer.drainTimer[eid] = 0;
  Prayer.level[eid] = 1;

  // Initialize movement
  Movement.speed[eid] = 3.0; // NPCs move slower than players
  Movement.velocityX[eid] = 0;
  Movement.velocityY[eid] = 0;
  Movement.targetX[eid] = x;
  Movement.targetY[eid] = y;

  return eid;
}

/**
 * Create a monster entity (convenience function)
 */
export function createMonster(
  world: IWorld,
  name: string,
  x: number,
  y: number,
  combatLevel: number = 10
): number {
  // Use a hash of the name as NPC ID for testing
  const npcId = Math.abs(name.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
  return createNPC(world, npcId, x, y, combatLevel, true);
}

/**
 * Create an item entity
 */
export function createItem(world: IWorld, itemId: number, quantity: number = 1): number {
  const eid = addEntity(world);

  addComponent(world, Item, eid);

  Item.itemId[eid] = itemId;
  Item.quantity[eid] = quantity;
  Item.noted[eid] = 0;
  Item.charges[eid] = 0;

  return eid;
}

/**
 * Create a loot drop entity
 */
export function createLootDrop(
  world: IWorld,
  itemId: number,
  quantity: number,
  x: number,
  y: number,
  ownerId: number
): number {
  const eid = createItem(world, itemId, quantity);

  addComponent(world, LootDrop, eid);
  addComponent(world, Transform, eid);

  Transform.x[eid] = x;
  Transform.y[eid] = y;
  Transform.z[eid] = 0;

  LootDrop.ownerId[eid] = ownerId;
  LootDrop.despawnTime[eid] = Date.now() + 60000; // 60 seconds
  LootDrop.x[eid] = x;
  LootDrop.y[eid] = y;

  return eid;
}

/**
 * Create a resource node entity
 */
export function createResource(
  world: IWorld,
  resourceType: number,
  resourceId: number,
  x: number,
  y: number,
  resourceYield: number = 5
): number {
  const eid = addEntity(world);

  addComponent(world, Resource, eid);
  addComponent(world, Transform, eid);

  Transform.x[eid] = x;
  Transform.y[eid] = y;
  Transform.z[eid] = 0;

  Resource.resourceType[eid] = resourceType;
  Resource.resourceId[eid] = resourceId;
  Resource.remainingYield[eid] = resourceYield;
  Resource.respawnTime[eid] = 30; // 30 seconds

  return eid;
}

/**
 * Simple string hash function for session IDs
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Run all game systems
 */
export function runGameSystems(world: IWorld, deltaTime: number): void {
  // Update delta time
  (world as RuneRogueWorld).deltaTime = deltaTime;

  // Run each system in order
  for (const system of GAME_SYSTEMS) {
    system(world);
  }
}
