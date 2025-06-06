import { createWorld, addEntity, addComponent, IWorld } from 'bitecs';
import {
  Transform,
  Health,
  CombatStats,
  Equipment,
  Skills,
  SkillExperience,
  Inventory,
  Item,
  NPCData,
  Movement,
  ActivePrayers,
  NetworkEntity,
  LootDrop,
  Resource,
  Player,
  NPC,
  Monster,
} from './components';
import {
  MovementSystem,
  CombatSystem,
  PrayerSystem,
  SkillSystem,
} from './systems';

// Create the ECS world with a high entity capacity
export const createECSWorld = (): IWorld => {
  const world = createWorld();
  
  // Set world configuration
  (world as any).entityCapacity = 10000; // Support up to 10k entities
  (world as any).deltaTime = 0.016; // Default 60 FPS
  
  return world;
};

// Systems array for the game loop
export const GAME_SYSTEMS = [
  MovementSystem,
  CombatSystem,
  PrayerSystem,
  SkillSystem,
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
  addComponent(world, CombatStats, eid);
  addComponent(world, Equipment, eid);
  addComponent(world, Skills, eid);
  addComponent(world, SkillExperience, eid);
  addComponent(world, Inventory, eid);
  addComponent(world, Movement, eid);
  addComponent(world, ActivePrayers, eid);
  addComponent(world, NetworkEntity, eid);
  
  // Initialize position
  Transform.x[eid] = x;
  Transform.y[eid] = y;
  Transform.z[eid] = 0;
  Transform.rotation[eid] = 0;
  
  // Initialize health
  Health.current[eid] = 10;
  Health.max[eid] = 10;
  Health.regenRate[eid] = 0;
  
  // Initialize combat stats
  CombatStats.attack[eid] = 1;
  CombatStats.strength[eid] = 1;
  CombatStats.defence[eid] = 1;
  CombatStats.attackBonus[eid] = 0;
  CombatStats.strengthBonus[eid] = 0;
  CombatStats.defenceBonus[eid] = 0;
  
  // Initialize skills (all start at level 1 except HP)
  Skills.attack[eid] = 1;
  Skills.strength[eid] = 1;
  Skills.defence[eid] = 1;
  Skills.ranged[eid] = 1;
  Skills.prayer[eid] = 1;
  Skills.magic[eid] = 1;
  Skills.runecrafting[eid] = 1;
  Skills.hitpoints[eid] = 10; // HP starts at 10
  Skills.crafting[eid] = 1;
  Skills.mining[eid] = 1;
  Skills.smithing[eid] = 1;
  Skills.fishing[eid] = 1;
  Skills.cooking[eid] = 1;
  Skills.firemaking[eid] = 1;
  Skills.woodcutting[eid] = 1;
  Skills.agility[eid] = 1;
  Skills.herblore[eid] = 1;
  Skills.thieving[eid] = 1;
  Skills.fletching[eid] = 1;
  Skills.slayer[eid] = 1;
  Skills.farming[eid] = 1;
  Skills.construction[eid] = 1;
  Skills.hunter[eid] = 1;
  
  // Initialize XP (HP starts with XP for level 10)
  SkillExperience.hitpointsXP[eid] = 1154; // XP for level 10
  
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
  addComponent(world, CombatStats, eid);
  addComponent(world, Skills, eid);
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
  const maxHealth = 10 + (combatLevel * 5);
  Health.current[eid] = maxHealth;
  Health.max[eid] = maxHealth;
  Health.regenRate[eid] = 0;
  
  // Initialize combat stats based on combat level
  const statLevel = Math.max(1, Math.floor(combatLevel * 0.8));
  CombatStats.attack[eid] = statLevel;
  CombatStats.strength[eid] = statLevel;
  CombatStats.defence[eid] = statLevel;
  CombatStats.attackBonus[eid] = combatLevel;
  CombatStats.strengthBonus[eid] = combatLevel;
  CombatStats.defenceBonus[eid] = combatLevel;
  
  // Initialize skills
  Skills.attack[eid] = statLevel;
  Skills.strength[eid] = statLevel;
  Skills.defence[eid] = statLevel;
  Skills.hitpoints[eid] = Math.max(10, combatLevel);
  
  // Initialize movement
  Movement.speed[eid] = 3.0; // NPCs move slower than players
  Movement.velocityX[eid] = 0;
  Movement.velocityY[eid] = 0;
  Movement.targetX[eid] = x;
  Movement.targetY[eid] = y;
  
  return eid;
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
  yield: number = 5
): number {
  const eid = addEntity(world);
  
  addComponent(world, Resource, eid);
  addComponent(world, Transform, eid);
  
  Transform.x[eid] = x;
  Transform.y[eid] = y;
  Transform.z[eid] = 0;
  
  Resource.resourceType[eid] = resourceType;
  Resource.resourceId[eid] = resourceId;
  Resource.remainingYield[eid] = yield;
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
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Run all game systems
 */
export function runGameSystems(world: IWorld, deltaTime: number): void {
  // Update delta time
  (world as any).deltaTime = deltaTime;
  
  // Run each system in order
  for (const system of GAME_SYSTEMS) {
    system(world);
  }
}