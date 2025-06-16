/**
 * ConsumableSystem - OSRS food and potion consumption system
 * Handles healing, stat boosts, and consumable effects
 *
 * @author RuneRogue Development Team
 * @package @runerogue/server
 */

import {
  defineSystem,
  defineQuery,
  hasComponent,
  IWorld,
  addComponent,
  Types,
  defineComponent,
} from 'bitecs';
import { Health, SkillLevels, SkillXP, Player, ActiveEffects } from '../components';

// Consumable item data
export interface ConsumableData {
  id: number;
  name: string;
  type: 'food' | 'potion' | 'special';
  healAmount?: number;
  consumeTime: number; // Time in ticks to consume
  effects?: Array<{
    stat: 'attack' | 'strength' | 'defence' | 'ranged' | 'magic' | 'hitpoints';
    boost: number;
    duration: number; // in minutes
  }>;
  specialEffect?: string;
}

// Food database
export const FOOD_DATABASE: Record<number, ConsumableData> = {
  // Fish
  315: {
    id: 315,
    name: 'Shrimp',
    type: 'food',
    healAmount: 3,
    consumeTime: 1800, // 3 ticks
  },
  317: {
    id: 317,
    name: 'Sardine',
    type: 'food',
    healAmount: 4,
    consumeTime: 1800,
  },
  325: {
    id: 325,
    name: 'Sardine',
    type: 'food',
    healAmount: 4,
    consumeTime: 1800,
  },
  333: {
    id: 333,
    name: 'Trout',
    type: 'food',
    healAmount: 7,
    consumeTime: 1800,
  },
  335: {
    id: 335,
    name: 'Pike',
    type: 'food',
    healAmount: 8,
    consumeTime: 1800,
  },
  349: {
    id: 349,
    name: 'Cod',
    type: 'food',
    healAmount: 7,
    consumeTime: 1800,
  },
  351: {
    id: 351,
    name: 'Mackerel',
    type: 'food',
    healAmount: 6,
    consumeTime: 1800,
  },
  359: {
    id: 359,
    name: 'Tuna',
    type: 'food',
    healAmount: 10,
    consumeTime: 1800,
  },
  361: {
    id: 361,
    name: 'Bass',
    type: 'food',
    healAmount: 13,
    consumeTime: 1800,
  },
  373: {
    id: 373,
    name: 'Swordfish',
    type: 'food',
    healAmount: 14,
    consumeTime: 1800,
  },
  379: {
    id: 379,
    name: 'Lobster',
    type: 'food',
    healAmount: 12,
    consumeTime: 1800,
  },
  385: {
    id: 385,
    name: 'Shark',
    type: 'food',
    healAmount: 20,
    consumeTime: 1800,
  },

  // Bread and other food
  2309: {
    id: 2309,
    name: 'Bread',
    type: 'food',
    healAmount: 5,
    consumeTime: 1800,
  },
  1891: {
    id: 1891,
    name: 'Cake',
    type: 'food',
    healAmount: 12,
    consumeTime: 1800,
  },
};

// Potion database
export const POTION_DATABASE: Record<number, ConsumableData> = {
  // Attack potions
  2428: {
    id: 2428,
    name: 'Attack potion(4)',
    type: 'potion',
    effects: [
      {
        stat: 'attack',
        boost: 3,
        duration: 5, // 5 minutes
      },
    ],
    consumeTime: 1800,
  },
  121: {
    id: 121,
    name: 'Attack potion(3)',
    type: 'potion',
    effects: [
      {
        stat: 'attack',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
  123: {
    id: 123,
    name: 'Attack potion(2)',
    type: 'potion',
    effects: [
      {
        stat: 'attack',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
  125: {
    id: 125,
    name: 'Attack potion(1)',
    type: 'potion',
    effects: [
      {
        stat: 'attack',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },

  // Strength potions
  113: {
    id: 113,
    name: 'Strength potion(4)',
    type: 'potion',
    effects: [
      {
        stat: 'strength',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
  115: {
    id: 115,
    name: 'Strength potion(3)',
    type: 'potion',
    effects: [
      {
        stat: 'strength',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
  117: {
    id: 117,
    name: 'Strength potion(2)',
    type: 'potion',
    effects: [
      {
        stat: 'strength',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
  119: {
    id: 119,
    name: 'Strength potion(1)',
    type: 'potion',
    effects: [
      {
        stat: 'strength',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },

  // Defence potions
  2432: {
    id: 2432,
    name: 'Defence potion(4)',
    type: 'potion',
    effects: [
      {
        stat: 'defence',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
  133: {
    id: 133,
    name: 'Defence potion(3)',
    type: 'potion',
    effects: [
      {
        stat: 'defence',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
  135: {
    id: 135,
    name: 'Defence potion(2)',
    type: 'potion',
    effects: [
      {
        stat: 'defence',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
  137: {
    id: 137,
    name: 'Defence potion(1)',
    type: 'potion',
    effects: [
      {
        stat: 'defence',
        boost: 3,
        duration: 5,
      },
    ],
    consumeTime: 1800,
  },
};

// OSRS Food data with authentic healing amounts
export const OSRS_FOOD: Record<number, ConsumableData> = {
  315: {
    // Shrimp
    id: 315,
    name: 'Shrimp',
    type: 'food',
    healAmount: 3,
    consumeTime: 3, // 3 ticks (1.8 seconds)
  },
  317: {
    // Sardine
    id: 317,
    name: 'Sardine',
    type: 'food',
    healAmount: 4,
    consumeTime: 3,
  },
  319: {
    // Herring
    id: 319,
    name: 'Herring',
    type: 'food',
    healAmount: 5,
    consumeTime: 3,
  },
  321: {
    // Anchovies
    id: 321,
    name: 'Anchovies',
    type: 'food',
    healAmount: 2,
    consumeTime: 3,
  },
  323: {
    // Tuna
    id: 323,
    name: 'Tuna',
    type: 'food',
    healAmount: 10,
    consumeTime: 3,
  },
  325: {
    // Lobster
    id: 325,
    name: 'Lobster',
    type: 'food',
    healAmount: 12,
    consumeTime: 3,
  },
  327: {
    // Swordfish
    id: 327,
    name: 'Swordfish',
    type: 'food',
    healAmount: 14,
    consumeTime: 3,
  },
  329: {
    // Shark
    id: 329,
    name: 'Shark',
    type: 'food',
    healAmount: 20,
    consumeTime: 3,
  },
  379: {
    // Lobster (cooked)
    id: 379,
    name: 'Lobster',
    type: 'food',
    healAmount: 12,
    consumeTime: 3,
  },
};

/**
 * Consume food item for healing
 */
export function consumeFood(world: IWorld, playerId: number, itemId: number): boolean {
  const foodData = OSRS_FOOD[itemId];
  if (!foodData || foodData.type !== 'food') {
    return false;
  }

  if (!hasComponent(world, Health, playerId)) {
    return false;
  }

  const currentHealth = Health.current[playerId];
  const maxHealth = Health.max[playerId];

  // Heal player
  const healAmount = foodData.healAmount || 0;
  Health.current[playerId] = Math.min(maxHealth, currentHealth + healAmount);

  return true;
}

/**
 * Consume potion for stat boosts/effects
 */
export function consumePotion(world: IWorld, playerId: number, itemId: number): boolean {
  // Add potion logic here when potion data is implemented
  // For now, just return false
  return false;
}

// Queries
const consumableQuery = defineQuery([Health, SkillLevels, ActiveEffects, Player]);

/**
 * Extended world interface for consumable events
 */
interface WorldWithConsumableEvents extends IWorld {
  messageSystem?: {
    sendMessage: (entityId: number, message: string) => void;
  };
  inventoryManager?: {
    hasItems: (entityId: number, items: Array<{ itemId: number; quantity: number }>) => boolean;
    removeItems: (entityId: number, items: Array<{ itemId: number; quantity: number }>) => boolean;
  };
}

/**
 * Get consumable data by item ID
 */
function getConsumableData(itemId: number): ConsumableData | undefined {
  return FOOD_DATABASE[itemId] || POTION_DATABASE[itemId];
}

/**
 * Consume food item
 */
function consumeFoodInternal(
  world: WorldWithConsumableEvents,
  entityId: number,
  itemId: number
): boolean {
  const foodData = FOOD_DATABASE[itemId];
  if (!foodData || !foodData.healAmount) return false;

  // Check if player has the food item
  if (world.inventoryManager) {
    if (!world.inventoryManager.hasItems(entityId, [{ itemId, quantity: 1 }])) {
      return false;
    }
  }

  const health = Health[entityId];
  const maxHealth = health.max;
  const currentHealth = health.current;

  // Calculate healing (can't overheal)
  const healAmount = Math.min(foodData.healAmount, maxHealth - currentHealth);

  if (healAmount <= 0) {
    if (world.messageSystem) {
      world.messageSystem.sendMessage(entityId, "You're already at full health.");
    }
    return false;
  }

  // Consume the food
  if (world.inventoryManager) {
    world.inventoryManager.removeItems(entityId, [{ itemId, quantity: 1 }]);
  }

  // Apply healing
  health.current = Math.min(maxHealth, currentHealth + healAmount);

  if (world.messageSystem) {
    world.messageSystem.sendMessage(
      entityId,
      `You eat the ${foodData.name} and restore ${healAmount} hitpoints.`
    );
  }

  return true;
}

/**
 * Consume potion
 */
function consumePotionInternal(
  world: WorldWithConsumableEvents,
  entityId: number,
  itemId: number
): boolean {
  const potionData = POTION_DATABASE[itemId];
  if (!potionData || !potionData.effects) return false;

  // Check if player has the potion
  if (world.inventoryManager) {
    if (!world.inventoryManager.hasItems(entityId, [{ itemId, quantity: 1 }])) {
      return false;
    }
  }

  // Consume the potion
  if (world.inventoryManager) {
    world.inventoryManager.removeItems(entityId, [{ itemId, quantity: 1 }]);
  }

  // Apply effects
  const effects = ActiveEffects[entityId];

  for (const effect of potionData.effects) {
    const durationMs = effect.duration * 60 * 1000; // Convert minutes to milliseconds

    switch (effect.stat) {
      case 'attack':
        effects.attackBoost = durationMs;
        effects.attackBoostAmount = effect.boost;
        break;
      case 'strength':
        effects.strengthBoost = durationMs;
        effects.strengthBoostAmount = effect.boost;
        break;
      case 'defence':
        effects.defenceBoost = durationMs;
        effects.defenceBoostAmount = effect.boost;
        break;
      case 'ranged':
        effects.rangedBoost = durationMs;
        effects.rangedBoostAmount = effect.boost;
        break;
      case 'magic':
        effects.magicBoost = durationMs;
        effects.magicBoostAmount = effect.boost;
        break;
    }
  }

  if (world.messageSystem) {
    world.messageSystem.sendMessage(entityId, `You drink the ${potionData.name}.`);
  }

  return true;
}

/**
 * Update active effects (reduce durations)
 */
function updateActiveEffects(world: IWorld, entityId: number): void {
  const effects = ActiveEffects[entityId];
  const currentTime = Date.now();
  const lastUpdate = effects.lastUpdate || currentTime;
  const deltaTime = currentTime - lastUpdate;

  // Update effect durations
  if (effects.attackBoost > 0) {
    effects.attackBoost = Math.max(0, effects.attackBoost - deltaTime);
    if (effects.attackBoost === 0) {
      effects.attackBoostAmount = 0;
    }
  }

  if (effects.strengthBoost > 0) {
    effects.strengthBoost = Math.max(0, effects.strengthBoost - deltaTime);
    if (effects.strengthBoost === 0) {
      effects.strengthBoostAmount = 0;
    }
  }

  if (effects.defenceBoost > 0) {
    effects.defenceBoost = Math.max(0, effects.defenceBoost - deltaTime);
    if (effects.defenceBoost === 0) {
      effects.defenceBoostAmount = 0;
    }
  }

  if (effects.rangedBoost > 0) {
    effects.rangedBoost = Math.max(0, effects.rangedBoost - deltaTime);
    if (effects.rangedBoost === 0) {
      effects.rangedBoostAmount = 0;
    }
  }

  if (effects.magicBoost > 0) {
    effects.magicBoost = Math.max(0, effects.magicBoost - deltaTime);
    if (effects.magicBoost === 0) {
      effects.magicBoostAmount = 0;
    }
  }

  effects.lastUpdate = currentTime;
}

/**
 * Get effective skill level (base + boost)
 */
export function getEffectiveSkillLevel(
  world: IWorld,
  entityId: number,
  skill: 'attack' | 'strength' | 'defence' | 'ranged' | 'magic'
): number {
  const baseLevel = SkillLevels[skill][entityId] || 1;

  if (!hasComponent(world, ActiveEffects, entityId)) {
    return baseLevel;
  }

  const effects = ActiveEffects[entityId];
  let boost = 0;

  switch (skill) {
    case 'attack':
      boost = effects.attackBoost > 0 ? effects.attackBoostAmount : 0;
      break;
    case 'strength':
      boost = effects.strengthBoost > 0 ? effects.strengthBoostAmount : 0;
      break;
    case 'defence':
      boost = effects.defenceBoost > 0 ? effects.defenceBoostAmount : 0;
      break;
    case 'ranged':
      boost = effects.rangedBoost > 0 ? effects.rangedBoostAmount : 0;
      break;
    case 'magic':
      boost = effects.magicBoost > 0 ? effects.magicBoostAmount : 0;
      break;
  }

  return baseLevel + boost;
}

/**
 * ConsumableSystem - Main system for processing consumables and effects
 */
export const ConsumableSystem = defineSystem((world: IWorld) => {
  const entities = consumableQuery(world);

  for (const entity of entities) {
    updateActiveEffects(world, entity);
  }

  return world;
});

/**
 * Initialize consumable system for player entity
 */
export function initializeConsumableSystem(world: IWorld, entityId: number): void {
  addComponent(world, ActiveEffects, entityId);

  const effects = ActiveEffects[entityId];
  effects.attackBoost = 0;
  effects.attackBoostAmount = 0;
  effects.strengthBoost = 0;
  effects.strengthBoostAmount = 0;
  effects.defenceBoost = 0;
  effects.defenceBoostAmount = 0;
  effects.rangedBoost = 0;
  effects.rangedBoostAmount = 0;
  effects.magicBoost = 0;
  effects.magicBoostAmount = 0;
  effects.poisoned = 0;
  effects.poisonDamage = 0;
  effects.antifire = 0;
  effects.energyRestore = 0;
  effects.lastUpdate = Date.now();
}

/**
 * Public API functions
 */
export function consumeItem(world: IWorld, entityId: number, itemId: number): boolean {
  const worldWithConsumables = world as WorldWithConsumableEvents;

  // Try food first
  if (FOOD_DATABASE[itemId]) {
    return consumeFood(worldWithConsumables, entityId, itemId);
  }

  // Try potion
  if (POTION_DATABASE[itemId]) {
    return consumePotion(worldWithConsumables, entityId, itemId);
  }

  return false;
}

export function isConsumable(itemId: number): boolean {
  return !!(FOOD_DATABASE[itemId] || POTION_DATABASE[itemId]);
}

export { ActiveEffects };
