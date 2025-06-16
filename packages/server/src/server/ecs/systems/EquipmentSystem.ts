/**
 * EquipmentSystem - OSRS-authentic equipment and inventory management
 * Handles item swapping, equipment bonuses, and inventory operations
 *
 * @author RuneRogue Development Team
 * @package @runerogue/server
 */

import { defineSystem, defineQuery, hasComponent, IWorld, addComponent } from 'bitecs';
import {
  Transform,
  SkillLevels,
  SkillXP,
  Equipment,
  EquipmentBonuses,
  Player,
  Inventory,
  Item,
} from '../components';

// Item data interface
export interface ItemData {
  id: number;
  name: string;
  equipSlot?:
    | 'weapon'
    | 'helmet'
    | 'chest'
    | 'legs'
    | 'shield'
    | 'gloves'
    | 'boots'
    | 'ring'
    | 'amulet';
  attackRequirement?: number;
  defenceRequirement?: number;
  strengthRequirement?: number;
  rangedRequirement?: number;
  magicRequirement?: number;
  attackStab?: number;
  attackSlash?: number;
  attackCrush?: number;
  attackMagic?: number;
  attackRanged?: number;
  defenceStab?: number;
  defenceSlash?: number;
  defenceCrush?: number;
  defenceMagic?: number;
  defenceRanged?: number;
  meleeStrength?: number;
  rangedStrength?: number;
  magicDamage?: number;
  prayer?: number;
  stackable?: boolean;
  tradeable?: boolean;
  attackSpeed?: number; // OSRS ticks between attacks
}

// Equipment slot type
export type EquipmentSlot =
  | 'weapon'
  | 'helmet'
  | 'chest'
  | 'legs'
  | 'shield'
  | 'gloves'
  | 'boots'
  | 'ring'
  | 'amulet';

// Basic item database (expandable)
export const ITEM_DATABASE: Record<number, ItemData> = {
  // Bronze weapons
  1205: {
    id: 1205,
    name: 'Bronze dagger',
    equipSlot: 'weapon',
    attackRequirement: 1,
    attackStab: 6,
    attackSlash: -2,
    attackCrush: -2,
    meleeStrength: 1,
    attackSpeed: 4,
  },
  1277: {
    id: 1277,
    name: 'Bronze sword',
    equipSlot: 'weapon',
    attackRequirement: 1,
    attackStab: 3,
    attackSlash: 4,
    attackCrush: -2,
    meleeStrength: 2,
    attackSpeed: 4,
  },

  // Iron weapons
  1203: {
    id: 1203,
    name: 'Iron dagger',
    equipSlot: 'weapon',
    attackRequirement: 1,
    attackStab: 11,
    attackSlash: -2,
    attackCrush: -2,
    meleeStrength: 3,
    attackSpeed: 4,
  },
  1279: {
    id: 1279,
    name: 'Iron sword',
    equipSlot: 'weapon',
    attackRequirement: 1,
    attackStab: 5,
    attackSlash: 7,
    attackCrush: -2,
    meleeStrength: 6,
    attackSpeed: 4,
  },

  // Steel weapons
  1207: {
    id: 1207,
    name: 'Steel dagger',
    equipSlot: 'weapon',
    attackRequirement: 5,
    attackStab: 16,
    attackSlash: -2,
    attackCrush: -2,
    meleeStrength: 5,
    attackSpeed: 4,
  },
  1281: {
    id: 1281,
    name: 'Steel sword',
    equipSlot: 'weapon',
    attackRequirement: 5,
    attackStab: 8,
    attackSlash: 12,
    attackCrush: -2,
    meleeStrength: 9,
    attackSpeed: 4,
  },

  // Food items
  315: {
    id: 315,
    name: 'Shrimp',
    stackable: false,
    tradeable: true,
  },
  333: {
    id: 333,
    name: 'Trout',
    stackable: false,
    tradeable: true,
  },
  379: {
    id: 379,
    name: 'Lobster',
    stackable: false,
    tradeable: true,
  },

  // Tools
  2347: {
    id: 2347,
    name: 'Hammer',
    stackable: false,
    tradeable: true,
  },

  // Bars
  2349: {
    id: 2349,
    name: 'Bronze bar',
    stackable: true,
    tradeable: true,
  },
  2351: {
    id: 2351,
    name: 'Iron bar',
    stackable: true,
    tradeable: true,
  },
  2353: {
    id: 2353,
    name: 'Steel bar',
    stackable: true,
    tradeable: true,
  },
};

// Queries
const equipmentQuery = defineQuery([Equipment, EquipmentBonuses, SkillLevels, Player]);
const inventoryQuery = defineQuery([Inventory, Player]);

/**
 * Extended world interface for equipment events
 */
interface WorldWithEquipmentEvents extends IWorld {
  messageSystem?: {
    sendMessage: (entityId: number, message: string) => void;
  };
  itemCreator?: {
    createItem: (itemId: number, quantity: number) => number; // Returns entity ID
  };
}

/**
 * Get item data by ID
 */
function getItemData(itemId: number): ItemData | undefined {
  return ITEM_DATABASE[itemId];
}

/**
 * Check if player meets equipment requirements
 */
function meetsRequirements(entityId: number, item: ItemData): boolean {
  const skills = SkillLevels[entityId];

  if (item.attackRequirement && (skills.attack || 1) < item.attackRequirement) return false;
  if (item.defenceRequirement && (skills.defence || 1) < item.defenceRequirement) return false;
  if (item.strengthRequirement && (skills.strength || 1) < item.strengthRequirement) return false;
  if (item.rangedRequirement && (skills.ranged || 1) < item.rangedRequirement) return false;
  if (item.magicRequirement && (skills.magic || 1) < item.magicRequirement) return false;

  return true;
}

/**
 * Calculate and update equipment bonuses
 */
function updateEquipmentBonuses(world: IWorld, entityId: number): void {
  const equipment = Equipment[entityId];
  const bonuses = EquipmentBonuses[entityId];

  // Reset all bonuses
  bonuses.attackStab = 0;
  bonuses.attackSlash = 0;
  bonuses.attackCrush = 0;
  bonuses.attackMagic = 0;
  bonuses.attackRanged = 0;
  bonuses.defenceStab = 0;
  bonuses.defenceSlash = 0;
  bonuses.defenceCrush = 0;
  bonuses.defenceMagic = 0;
  bonuses.defenceRanged = 0;
  bonuses.meleeStrength = 0;
  bonuses.rangedStrength = 0;
  bonuses.magicDamage = 0;
  bonuses.prayer = 0;

  // Sum bonuses from all equipped items
  const slots = [
    'weapon',
    'helmet',
    'chest',
    'legs',
    'shield',
    'gloves',
    'boots',
    'ring',
    'amulet',
  ] as const;

  for (const slot of slots) {
    const itemEntityId = equipment[slot];
    if (itemEntityId && hasComponent(world, Item, itemEntityId)) {
      const item = Item[itemEntityId];
      const itemData = getItemData(item.itemId);

      if (itemData) {
        bonuses.attackStab += itemData.attackStab || 0;
        bonuses.attackSlash += itemData.attackSlash || 0;
        bonuses.attackCrush += itemData.attackCrush || 0;
        bonuses.attackMagic += itemData.attackMagic || 0;
        bonuses.attackRanged += itemData.attackRanged || 0;
        bonuses.defenceStab += itemData.defenceStab || 0;
        bonuses.defenceSlash += itemData.defenceSlash || 0;
        bonuses.defenceCrush += itemData.defenceCrush || 0;
        bonuses.defenceMagic += itemData.defenceMagic || 0;
        bonuses.defenceRanged += itemData.defenceRanged || 0;
        bonuses.meleeStrength += itemData.meleeStrength || 0;
        bonuses.rangedStrength += itemData.rangedStrength || 0;
        bonuses.magicDamage += itemData.magicDamage || 0;
        bonuses.prayer += itemData.prayer || 0;
      }
    }
  }
}

/**
 * Find empty inventory slot
 */
function findEmptySlot(entityId: number): number {
  const slots = [
    'slot0',
    'slot1',
    'slot2',
    'slot3',
    'slot4',
    'slot5',
    'slot6',
    'slot7',
    'slot8',
    'slot9',
    'slot10',
    'slot11',
    'slot12',
    'slot13',
    'slot14',
    'slot15',
    'slot16',
    'slot17',
    'slot18',
    'slot19',
    'slot20',
    'slot21',
    'slot22',
    'slot23',
    'slot24',
    'slot25',
    'slot26',
    'slot27',
  ] as const;
  for (let i = 0; i < slots.length; i++) {
    const slotName = slots[i];
    if (Inventory[slotName][entityId] === 0) {
      return i;
    }
  }

  return -1; // Inventory full
}

/**
 * Get inventory slot name by index
 */
function getSlotName(index: number): keyof typeof Inventory {
  const slots = [
    'slot0',
    'slot1',
    'slot2',
    'slot3',
    'slot4',
    'slot5',
    'slot6',
    'slot7',
    'slot8',
    'slot9',
    'slot10',
    'slot11',
    'slot12',
    'slot13',
    'slot14',
    'slot15',
    'slot16',
    'slot17',
    'slot18',
    'slot19',
    'slot20',
    'slot21',
    'slot22',
    'slot23',
    'slot24',
    'slot25',
    'slot26',
    'slot27',
  ] as const;

  return slots[index];
}

/**
 * Add item to inventory
 */
export function addItemToInventory(
  world: WorldWithEquipmentEvents,
  entityId: number,
  itemId: number,
  quantity: number = 1
): boolean {
  if (!hasComponent(world, Inventory, entityId)) {
    return false;
  }

  const inventory = Inventory[entityId];
  const itemData = getItemData(itemId);

  if (!itemData) return false;

  // Check for stackable items
  if (itemData.stackable) {
    // Find existing stack
    const slots = [
      'slot0',
      'slot1',
      'slot2',
      'slot3',
      'slot4',
      'slot5',
      'slot6',
      'slot7',
      'slot8',
      'slot9',
      'slot10',
      'slot11',
      'slot12',
      'slot13',
      'slot14',
      'slot15',
      'slot16',
      'slot17',
      'slot18',
      'slot19',
      'slot20',
      'slot21',
      'slot22',
      'slot23',
      'slot24',
      'slot25',
      'slot26',
      'slot27',
    ] as const;

    for (const slotName of slots) {
      const itemEntityId = inventory[slotName];
      if (itemEntityId && hasComponent(world, Item, itemEntityId)) {
        const item = Item[itemEntityId];
        if (item.itemId === itemId) {
          // Add to existing stack
          item.quantity += quantity;
          return true;
        }
      }
    }
  }
  // Find empty slot for new item
  const emptySlot = findEmptySlot(entityId);
  if (emptySlot === -1) {
    return false; // Inventory full
  }

  // Create new item entity
  if (world.itemCreator) {
    const itemEntityId = world.itemCreator.createItem(itemId, quantity);
    const slotName = getSlotName(emptySlot);
    inventory[slotName] = itemEntityId;
    return true;
  }

  return false;
}

/**
 * Remove item from inventory
 */
function removeItemFromInventory(
  world: IWorld,
  entityId: number,
  itemId: number,
  quantity: number = 1
): boolean {
  if (!hasComponent(world, Inventory, entityId)) {
    return false;
  }

  const inventory = Inventory[entityId];
  const slots = [
    'slot0',
    'slot1',
    'slot2',
    'slot3',
    'slot4',
    'slot5',
    'slot6',
    'slot7',
    'slot8',
    'slot9',
    'slot10',
    'slot11',
    'slot12',
    'slot13',
    'slot14',
    'slot15',
    'slot16',
    'slot17',
    'slot18',
    'slot19',
    'slot20',
    'slot21',
    'slot22',
    'slot23',
    'slot24',
    'slot25',
    'slot26',
    'slot27',
  ] as const;

  for (const slotName of slots) {
    const itemEntityId = inventory[slotName];
    if (itemEntityId && hasComponent(world, Item, itemEntityId)) {
      const item = Item[itemEntityId];
      if (item.itemId === itemId) {
        if (item.quantity >= quantity) {
          item.quantity -= quantity;
          if (item.quantity === 0) {
            inventory[slotName] = 0; // Clear slot
          }
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Equip item from inventory
 */
function equipItemFromInventory(
  world: WorldWithEquipmentEvents,
  entityId: number,
  inventorySlot: number
): boolean {
  if (!hasComponent(world, Inventory, entityId) || !hasComponent(world, Equipment, entityId)) {
    return false;
  }

  const inventory = Inventory[entityId];
  const equipment = Equipment[entityId];
  const slotName = getSlotName(inventorySlot);
  const itemEntityId = inventory[slotName];

  if (!itemEntityId || !hasComponent(world, Item, itemEntityId)) {
    return false;
  }

  const item = Item[itemEntityId];
  const itemData = getItemData(item.itemId);

  if (!itemData || !itemData.equipSlot) {
    if (world.messageSystem) {
      world.messageSystem.sendMessage(entityId, "You can't equip that item.");
    }
    return false;
  }

  // Check requirements
  if (!meetsRequirements(entityId, itemData)) {
    if (world.messageSystem) {
      world.messageSystem.sendMessage(
        entityId,
        "You don't meet the requirements to equip this item."
      );
    }
    return false;
  }

  // Unequip current item in that slot
  const currentItemId = equipment[itemData.equipSlot];
  if (currentItemId) {
    const emptySlot = findEmptySlot(entityId);
    if (emptySlot === -1) {
      if (world.messageSystem) {
        world.messageSystem.sendMessage(entityId, 'Your inventory is full.');
      }
      return false;
    }

    // Move current item to inventory
    const emptySlotName = getSlotName(emptySlot);
    inventory[emptySlotName] = currentItemId;
  }

  // Equip new item
  equipment[itemData.equipSlot] = itemEntityId;
  inventory[slotName] = 0;

  // Update equipment bonuses
  updateEquipmentBonuses(world, entityId);

  if (world.messageSystem) {
    world.messageSystem.sendMessage(entityId, `You equip the ${itemData.name}.`);
  }

  return true;
}

/**
 * Equip an item to the appropriate equipment slot
 */
export function equipItem(world: IWorld, playerId: number, itemEntityId: number): boolean {
  if (!hasComponent(world, Item, itemEntityId)) {
    return false;
  }

  const itemData = Item[itemEntityId];
  const item = ITEM_DATABASE[itemData.itemId];

  if (!item || !item.equipSlot) {
    return false; // Item cannot be equipped
  }

  // Check level requirements
  if (item.attackRequirement && hasComponent(world, SkillLevels, playerId)) {
    if (SkillLevels.attack[playerId] < item.attackRequirement) {
      return false; // Insufficient attack level
    }
  }

  // Add equipment components if not present
  if (!hasComponent(world, Equipment, playerId)) {
    addComponent(world, Equipment, playerId);
  }
  if (!hasComponent(world, EquipmentBonuses, playerId)) {
    addComponent(world, EquipmentBonuses, playerId);
  }

  // Unequip current item in slot if any
  const currentItemId = Equipment[item.equipSlot as keyof typeof Equipment][playerId];
  if (currentItemId !== 0) {
    unequipItem(world, playerId, item.equipSlot as EquipmentSlot);
  }

  // Equip the new item
  Equipment[item.equipSlot as keyof typeof Equipment][playerId] = itemEntityId;

  // Recalculate equipment bonuses
  calculateBonuses(world, playerId);

  return true;
}

/**
 * Unequip an item from equipment slot
 */
export function unequipItem(world: IWorld, playerId: number, slot: EquipmentSlot): boolean {
  if (!hasComponent(world, Equipment, playerId)) {
    return false;
  }

  const currentItemId = Equipment[slot][playerId];
  if (currentItemId === 0) {
    return false; // No item equipped
  }

  // Move item to inventory
  if (hasComponent(world, Inventory, playerId)) {
    const success = addItemToInventory(world, playerId, currentItemId);
    if (!success) {
      return false; // Inventory full
    }
  }

  // Clear equipment slot
  Equipment[slot][playerId] = 0;

  // Recalculate bonuses
  calculateBonuses(world, playerId);

  return true;
}

/**
 * Calculate total equipment bonuses for player
 */
export function calculateBonuses(world: IWorld, playerId: number): void {
  if (
    !hasComponent(world, Equipment, playerId) ||
    !hasComponent(world, EquipmentBonuses, playerId)
  ) {
    return;
  }

  // Reset all bonuses
  EquipmentBonuses.attackStab[playerId] = 0;
  EquipmentBonuses.attackSlash[playerId] = 0;
  EquipmentBonuses.attackCrush[playerId] = 0;
  EquipmentBonuses.attackMagic[playerId] = 0;
  EquipmentBonuses.attackRanged[playerId] = 0;
  EquipmentBonuses.defenceStab[playerId] = 0;
  EquipmentBonuses.defenceSlash[playerId] = 0;
  EquipmentBonuses.defenceCrush[playerId] = 0;
  EquipmentBonuses.defenceMagic[playerId] = 0;
  EquipmentBonuses.defenceRanged[playerId] = 0;
  EquipmentBonuses.meleeStrength[playerId] = 0;
  EquipmentBonuses.rangedStrength[playerId] = 0;
  EquipmentBonuses.magicDamage[playerId] = 0;
  EquipmentBonuses.prayer[playerId] = 0;

  // Sum bonuses from all equipped items
  const slots: EquipmentSlot[] = [
    'weapon',
    'helmet',
    'chest',
    'legs',
    'shield',
    'gloves',
    'boots',
    'ring',
    'amulet',
  ];

  for (const slot of slots) {
    const itemEntityId = Equipment[slot][playerId];
    if (itemEntityId !== 0 && hasComponent(world, Item, itemEntityId)) {
      const itemData = Item[itemEntityId];
      const item = ITEM_DATABASE[itemData.itemId];

      if (item) {
        EquipmentBonuses.attackStab[playerId] += item.attackStab || 0;
        EquipmentBonuses.attackSlash[playerId] += item.attackSlash || 0;
        EquipmentBonuses.attackCrush[playerId] += item.attackCrush || 0;
        EquipmentBonuses.attackMagic[playerId] += item.attackMagic || 0;
        EquipmentBonuses.attackRanged[playerId] += item.attackRanged || 0;
        EquipmentBonuses.defenceStab[playerId] += item.defenceStab || 0;
        EquipmentBonuses.defenceSlash[playerId] += item.defenceSlash || 0;
        EquipmentBonuses.defenceCrush[playerId] += item.defenceCrush || 0;
        EquipmentBonuses.defenceMagic[playerId] += item.defenceMagic || 0;
        EquipmentBonuses.defenceRanged[playerId] += item.defenceRanged || 0;
        EquipmentBonuses.meleeStrength[playerId] += item.meleeStrength || 0;
        EquipmentBonuses.rangedStrength[playerId] += item.rangedStrength || 0;
        EquipmentBonuses.magicDamage[playerId] += item.magicDamage || 0;
        EquipmentBonuses.prayer[playerId] += item.prayer || 0;
      }
    }
  }
}

/**
 * EquipmentSystem - Main system for processing equipment
 */
export const EquipmentSystem = defineSystem((world: IWorld) => {
  const entities = equipmentQuery(world);

  for (const entity of entities) {
    // Periodic equipment bonus updates could go here
    // For now, bonuses are updated when items are equipped/unequipped
  }

  return world;
});

/**
 * Initialize equipment and inventory for player entity
 */
export function initializeEquipmentAndInventory(world: IWorld, entityId: number): void {
  // Add components
  addComponent(world, Equipment, entityId);
  addComponent(world, EquipmentBonuses, entityId);
  addComponent(world, Inventory, entityId);

  // Initialize empty equipment
  Equipment.weapon[entityId] = 0;
  Equipment.helmet[entityId] = 0;
  Equipment.chest[entityId] = 0;
  Equipment.legs[entityId] = 0;
  Equipment.shield[entityId] = 0;
  Equipment.gloves[entityId] = 0;
  Equipment.boots[entityId] = 0;
  Equipment.ring[entityId] = 0;
  Equipment.amulet[entityId] = 0;

  // Initialize empty inventory
  const slots = [
    'slot0',
    'slot1',
    'slot2',
    'slot3',
    'slot4',
    'slot5',
    'slot6',
    'slot7',
    'slot8',
    'slot9',
    'slot10',
    'slot11',
    'slot12',
    'slot13',
    'slot14',
    'slot15',
    'slot16',
    'slot17',
    'slot18',
    'slot19',
    'slot20',
    'slot21',
    'slot22',
    'slot23',
    'slot24',
    'slot25',
    'slot26',
    'slot27',
  ] as const;

  const inventory = Inventory[entityId];
  for (const slot of slots) {
    inventory[slot] = 0;
  }

  // Initialize empty bonuses
  updateEquipmentBonuses(world, entityId);
}

/**
 * Public API functions
 */
export function addItem(
  world: IWorld,
  entityId: number,
  itemId: number,
  quantity: number = 1
): boolean {
  return addItemToInventory(world as WorldWithEquipmentEvents, entityId, itemId, quantity);
}

export function removeItem(
  world: IWorld,
  entityId: number,
  itemId: number,
  quantity: number = 1
): boolean {
  return removeItemFromInventory(world, entityId, itemId, quantity);
}

export function equipItemFromSlot(world: IWorld, entityId: number, slot: number): boolean {
  return equipItem(world as WorldWithEquipmentEvents, entityId, slot);
}
