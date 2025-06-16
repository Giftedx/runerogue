/**
 * SmithingSystem - OSRS-authentic smithing with bars, anvils, and equipment creation
 *
 * @author RuneRogue Development Team
 * @package @runerogue/server
 */

import { defineSystem, defineQuery, hasComponent, IWorld, addComponent } from 'bitecs';
import { Transform, SkillLevels, SkillXP, Player, SmithingAction } from '../components';

// Smithing recipes database
export interface SmithingRecipe {
  id: number;
  name: string;
  level: number;
  barType: 'bronze' | 'iron' | 'steel' | 'mithril' | 'adamant' | 'rune';
  barsRequired: number;
  productId: number;
  experience: number;
  hammerRequired: boolean;
}

export const SMITHING_RECIPES: SmithingRecipe[] = [
  // Bronze items (Level 1)
  {
    id: 1,
    name: 'Bronze dagger',
    level: 1,
    barType: 'bronze',
    barsRequired: 1,
    productId: 1205,
    experience: 12.5,
    hammerRequired: true,
  },
  {
    id: 2,
    name: 'Bronze sword',
    level: 4,
    barType: 'bronze',
    barsRequired: 1,
    productId: 1277,
    experience: 12.5,
    hammerRequired: true,
  },
  {
    id: 3,
    name: 'Bronze scimitar',
    level: 5,
    barType: 'bronze',
    barsRequired: 2,
    productId: 1321,
    experience: 25,
    hammerRequired: true,
  },
  {
    id: 4,
    name: 'Bronze longsword',
    level: 6,
    barType: 'bronze',
    barsRequired: 2,
    productId: 1291,
    experience: 25,
    hammerRequired: true,
  },
  {
    id: 5,
    name: 'Bronze full helm',
    level: 7,
    barType: 'bronze',
    barsRequired: 2,
    productId: 1155,
    experience: 25,
    hammerRequired: true,
  },
  {
    id: 6,
    name: 'Bronze square shield',
    level: 8,
    barType: 'bronze',
    barsRequired: 2,
    productId: 1173,
    experience: 25,
    hammerRequired: true,
  },
  {
    id: 7,
    name: 'Bronze chainbody',
    level: 11,
    barType: 'bronze',
    barsRequired: 3,
    productId: 1103,
    experience: 37.5,
    hammerRequired: true,
  },
  {
    id: 8,
    name: 'Bronze platelegs',
    level: 16,
    barType: 'bronze',
    barsRequired: 3,
    productId: 1075,
    experience: 37.5,
    hammerRequired: true,
  },
  {
    id: 9,
    name: 'Bronze platebody',
    level: 18,
    barType: 'bronze',
    barsRequired: 5,
    productId: 1117,
    experience: 62.5,
    hammerRequired: true,
  },

  // Iron items (Level 15+)
  {
    id: 10,
    name: 'Iron dagger',
    level: 15,
    barType: 'iron',
    barsRequired: 1,
    productId: 1203,
    experience: 25,
    hammerRequired: true,
  },
  {
    id: 11,
    name: 'Iron sword',
    level: 19,
    barType: 'iron',
    barsRequired: 1,
    productId: 1279,
    experience: 25,
    hammerRequired: true,
  },
  {
    id: 12,
    name: 'Iron scimitar',
    level: 20,
    barType: 'iron',
    barsRequired: 2,
    productId: 1323,
    experience: 50,
    hammerRequired: true,
  },
  {
    id: 13,
    name: 'Iron longsword',
    level: 21,
    barType: 'iron',
    barsRequired: 2,
    productId: 1293,
    experience: 50,
    hammerRequired: true,
  },
  {
    id: 14,
    name: 'Iron full helm',
    level: 22,
    barType: 'iron',
    barsRequired: 2,
    productId: 1153,
    experience: 50,
    hammerRequired: true,
  },
  {
    id: 15,
    name: 'Iron square shield',
    level: 23,
    barType: 'iron',
    barsRequired: 2,
    productId: 1175,
    experience: 50,
    hammerRequired: true,
  },
  {
    id: 16,
    name: 'Iron chainbody',
    level: 26,
    barType: 'iron',
    barsRequired: 3,
    productId: 1101,
    experience: 75,
    hammerRequired: true,
  },
  {
    id: 17,
    name: 'Iron platelegs',
    level: 31,
    barType: 'iron',
    barsRequired: 3,
    productId: 1067,
    experience: 75,
    hammerRequired: true,
  },
  {
    id: 18,
    name: 'Iron platebody',
    level: 33,
    barType: 'iron',
    barsRequired: 5,
    productId: 1115,
    experience: 125,
    hammerRequired: true,
  },

  // Steel items (Level 30+)
  {
    id: 19,
    name: 'Steel dagger',
    level: 30,
    barType: 'steel',
    barsRequired: 1,
    productId: 1207,
    experience: 37.5,
    hammerRequired: true,
  },
  {
    id: 20,
    name: 'Steel sword',
    level: 34,
    barType: 'steel',
    barsRequired: 1,
    productId: 1281,
    experience: 37.5,
    hammerRequired: true,
  },
  {
    id: 21,
    name: 'Steel scimitar',
    level: 35,
    barType: 'steel',
    barsRequired: 2,
    productId: 1325,
    experience: 75,
    hammerRequired: true,
  },
  {
    id: 22,
    name: 'Steel longsword',
    level: 36,
    barType: 'steel',
    barsRequired: 2,
    productId: 1295,
    experience: 75,
    hammerRequired: true,
  },
  {
    id: 23,
    name: 'Steel full helm',
    level: 37,
    barType: 'steel',
    barsRequired: 2,
    productId: 1157,
    experience: 75,
    hammerRequired: true,
  },
  {
    id: 24,
    name: 'Steel square shield',
    level: 38,
    barType: 'steel',
    barsRequired: 2,
    productId: 1177,
    experience: 75,
    hammerRequired: true,
  },
  {
    id: 25,
    name: 'Steel chainbody',
    level: 41,
    barType: 'steel',
    barsRequired: 3,
    productId: 1105,
    experience: 112.5,
    hammerRequired: true,
  },
  {
    id: 26,
    name: 'Steel platelegs',
    level: 46,
    barType: 'steel',
    barsRequired: 3,
    productId: 1069,
    experience: 112.5,
    hammerRequired: true,
  },
  {
    id: 27,
    name: 'Steel platebody',
    level: 48,
    barType: 'steel',
    barsRequired: 5,
    productId: 1119,
    experience: 187.5,
    hammerRequired: true,
  },
];

// Bar item IDs
export const BAR_IDS = {
  bronze: 2349,
  iron: 2351,
  steel: 2353,
  mithril: 2359,
  adamant: 2361,
  rune: 2363,
};

// Hammer item ID
export const HAMMER_ID = 2347;

// Query for smithing entities
const smithingQuery = defineQuery([Transform, SkillLevels, SkillXP, SmithingAction, Player]);

/**
 * Extended world interface for smithing events
 */
interface WorldWithSmithingEvents extends IWorld {
  xpGranter?: (entityId: number, skill: string, amount: number) => void;
  inventoryManager?: {
    hasItems: (entityId: number, items: Array<{ itemId: number; quantity: number }>) => boolean;
    removeItems: (entityId: number, items: Array<{ itemId: number; quantity: number }>) => boolean;
    addItem: (entityId: number, itemId: number, quantity: number) => boolean;
  };
  messageSystem?: {
    sendMessage: (entityId: number, message: string) => void;
  };
}

/**
 * Check if entity is near an anvil
 */
function isNearAnvil(world: IWorld, entityId: number): boolean {
  // In a roguelike, we can assume anvils are available in certain areas
  // This would be enhanced with actual anvil entity detection
  return true; // Simplified for now
}

/**
 * Get recipe by ID
 */
function getRecipeById(recipeId: number): SmithingRecipe | undefined {
  return SMITHING_RECIPES.find(recipe => recipe.id === recipeId);
}

/**
 * Check if player can smith recipe
 */
function canSmithRecipe(
  world: WorldWithSmithingEvents,
  entityId: number,
  recipe: SmithingRecipe
): boolean {
  // Check smithing level
  const smithingLevel = SkillLevels.smithing[entityId] || 1;
  if (smithingLevel < recipe.level) {
    return false;
  }

  // Check if near anvil
  if (!isNearAnvil(world, entityId)) {
    return false;
  }

  // Check for hammer
  if (recipe.hammerRequired && world.inventoryManager) {
    if (!world.inventoryManager.hasItems(entityId, [{ itemId: HAMMER_ID, quantity: 1 }])) {
      return false;
    }
  }

  // Check for required bars
  if (world.inventoryManager) {
    const barId = BAR_IDS[recipe.barType];
    if (
      !world.inventoryManager.hasItems(entityId, [{ itemId: barId, quantity: recipe.barsRequired }])
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Start smithing action
 */
function startSmithing(
  world: WorldWithSmithingEvents,
  entityId: number,
  recipeId: number,
  quantity: number = 1
): boolean {
  const recipe = getRecipeById(recipeId);
  if (!recipe) return false;

  if (!canSmithRecipe(world, entityId, recipe)) {
    if (world.messageSystem) {
      const smithingLevel = SkillLevels.smithing[entityId] || 1;
      if (smithingLevel < recipe.level) {
        world.messageSystem.sendMessage(
          entityId,
          `You need level ${recipe.level} Smithing to make ${recipe.name}.`
        );
      } else if (!isNearAnvil(world, entityId)) {
        world.messageSystem.sendMessage(entityId, 'You need to be near an anvil to smith.');
      } else {
        world.messageSystem.sendMessage(entityId, "You don't have the required materials.");
      }
    }
    return false;
  }

  // Add smithing action component if not present
  if (!hasComponent(world, SmithingAction, entityId)) {
    addComponent(world, SmithingAction, entityId);
  }

  // Set smithing action data
  SmithingAction.recipeId[entityId] = recipeId;
  SmithingAction.startTime[entityId] = Date.now();
  SmithingAction.duration[entityId] = 3000; // 3 seconds per item
  SmithingAction.quantity[entityId] = quantity;
  SmithingAction.nearAnvil[entityId] = 1;

  return true;
}

/**
 * Process smithing action
 */
function processSmithing(world: WorldWithSmithingEvents, entityId: number): void {
  const action = SmithingAction[entityId];
  const currentTime = Date.now();
  const elapsed = currentTime - action.startTime;

  if (elapsed >= action.duration) {
    const recipe = getRecipeById(action.recipeId);
    if (!recipe) return;

    // Check if still near anvil and has materials
    if (!canSmithRecipe(world, entityId, recipe)) {
      // Cancel smithing if requirements no longer met
      SmithingAction.recipeId[entityId] = 0;
      return;
    }

    // Consume materials
    if (world.inventoryManager) {
      const barId = BAR_IDS[recipe.barType];
      world.inventoryManager.removeItems(entityId, [
        { itemId: barId, quantity: recipe.barsRequired },
      ]);

      // Add created item
      world.inventoryManager.addItem(entityId, recipe.productId, 1);
    }

    // Grant XP
    if (world.xpGranter) {
      world.xpGranter(entityId, 'smithing', recipe.experience);
    }

    // Send success message
    if (world.messageSystem) {
      world.messageSystem.sendMessage(entityId, `You successfully smith a ${recipe.name}.`);
    }

    // Decrease quantity or finish
    action.quantity--;
    if (action.quantity > 0) {
      // Continue smithing more items
      action.startTime = currentTime;
    } else {
      // Finished smithing
      SmithingAction.recipeId[entityId] = 0;
    }
  }
}

/**
 * SmithingSystem - Main system for processing smithing actions
 */
export const SmithingSystem = defineSystem((world: IWorld) => {
  const worldWithSmithing = world as WorldWithSmithingEvents;
  const entities = smithingQuery(world);

  for (const entity of entities) {
    const action = SmithingAction[entity];

    // Skip if no active smithing action
    if (!action.recipeId) continue;

    processSmithing(worldWithSmithing, entity);
  }

  return world;
});

/**
 * Initialize smithing for player entity
 */
export function initializeSmithing(world: IWorld, entityId: number): void {
  addComponent(world, SmithingAction, entityId);
  SmithingAction.recipeId[entityId] = 0;
  SmithingAction.startTime[entityId] = 0;
  SmithingAction.duration[entityId] = 0;
  SmithingAction.quantity[entityId] = 0;
  SmithingAction.nearAnvil[entityId] = 0;
}

/**
 * Start smithing for player
 */
export function smithItem(
  world: IWorld,
  entityId: number,
  recipeId: number,
  quantity: number = 1
): boolean {
  return startSmithing(world as WorldWithSmithingEvents, entityId, recipeId, quantity);
}

/**
 * Get all available recipes for smithing level
 */
export function getAvailableRecipes(smithingLevel: number): SmithingRecipe[] {
  return SMITHING_RECIPES.filter(recipe => recipe.level <= smithingLevel);
}
