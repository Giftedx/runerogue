/**
 * EquipmentSystem - OSRS-authentic equipment and inventory management
 * Handles item swapping, equipment bonuses, and inventory operations
 *
 * @author RuneRogue Development Team
 * @package @runerogue/server
 */

import { defineSystem, defineQuery, hasComponent, IWorld, addComponent } from 'bitecs';
import { SkillLevels, Equipment, EquipmentBonuses, Player, Inventory, Item } from '../components';

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
  if (item.attackRequirement && (SkillLevels.attack[entityId] || 0) < item.attackRequirement) {
    return false;
  }
  if (item.defenceRequirement && (SkillLevels.defence[entityId] || 0) < item.defenceRequirement) {
    return false;
  }
  if (
    item.strengthRequirement &&
    (SkillLevels.strength[entityId] || 0) < item.strengthRequirement
  ) {
    return false;
  }
  if (item.rangedRequirement && (SkillLevels.ranged[entityId] || 0) < item.rangedRequirement) {
    return false;
  }
  if (item.magicRequirement && (SkillLevels.magic[entityId] || 0) < item.magicRequirement) {
    return false;
  }

  return true;
}

/**
 * Calculate and update equipment bonuses
 */
function updateEquipmentBonuses(world: IWorld, entityId: number): void {
  // Reset all bonuses
  EquipmentBonuses.attackStab[entityId] = 0;
  EquipmentBonuses.attackSlash[entityId] = 0;
  EquipmentBonuses.attackCrush[entityId] = 0;
  EquipmentBonuses.attackMagic[entityId] = 0;
  EquipmentBonuses.attackRanged[entityId] = 0;
  EquipmentBonuses.defenceStab[entityId] = 0;
  EquipmentBonuses.defenceSlash[entityId] = 0;
  EquipmentBonuses.defenceCrush[entityId] = 0;
  EquipmentBonuses.defenceMagic[entityId] = 0;
  EquipmentBonuses.defenceRanged[entityId] = 0;
  EquipmentBonuses.meleeStrength[entityId] = 0;
  EquipmentBonuses.rangedStrength[entityId] = 0;
  EquipmentBonuses.magicDamage[entityId] = 0;
  EquipmentBonuses.prayer[entityId] = 0;

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
    const itemEntityId = (Equipment as any)[slot][entityId];
    if (itemEntityId && hasComponent(world, Item, itemEntityId)) {
      const itemData = getItemData(Item.itemId[itemEntityId]);

      if (itemData) {
        EquipmentBonuses.attackStab[entityId] += itemData.attackStab || 0;
        EquipmentBonuses.attackSlash[entityId] += itemData.attackSlash || 0;
        EquipmentBonuses.attackCrush[entityId] += itemData.attackCrush || 0;
        EquipmentBonuses.attackMagic[entityId] += itemData.attackMagic || 0;
        EquipmentBonuses.attackRanged[entityId] += itemData.attackRanged || 0;
        EquipmentBonuses.defenceStab[entityId] += itemData.defenceStab || 0;
        EquipmentBonuses.defenceSlash[entityId] += itemData.defenceSlash || 0;
        EquipmentBonuses.defenceCrush[entityId] += itemData.defenceCrush || 0;
        EquipmentBonuses.defenceMagic[entityId] += itemData.defenceMagic || 0;
        EquipmentBonuses.defenceRanged[entityId] += itemData.defenceRanged || 0;
        EquipmentBonuses.meleeStrength[entityId] += itemData.meleeStrength || 0;
        EquipmentBonuses.rangedStrength[entityId] += itemData.rangedStrength || 0;
        EquipmentBonuses.magicDamage[entityId] += itemData.magicDamage || 0;
        EquipmentBonuses.prayer[entityId] += itemData.prayer || 0;
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
    if ((Inventory as any)[slotName][entityId] === 0) {
      // Assuming 0 is an empty item ID
      return i;
    }
  }

  return -1; // No empty slot
}

/**
 * Find item in inventory by item ID
 */
function findItemInInventory(entityId: number, itemId: number): number {
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
    const itemEntityId = (Inventory as any)[slotName][entityId];
    if (itemEntityId && Item.itemId[itemEntityId] === itemId) {
      return i;
    }
  }

  return -1;
}

/**
 * Add item to inventory
 */
export function addItemToInventory(
  world: WorldWithEquipmentEvents,
  entityId: number,
  itemId: number,
  quantity: number
): boolean {
  if (!world.itemCreator) {
    console.error('addItemToInventory: itemCreator system not available on world');
    return false;
  }

  const itemData = getItemData(itemId);
  if (!itemData) return false;

  // If stackable, try to add to an existing stack
  if (itemData.stackable) {
    const slotIndex = findItemInInventory(entityId, itemId);
    if (slotIndex !== -1) {
      const slotName = `slot${slotIndex}` as const;
      const itemEntityId = (Inventory as any)[slotName][entityId];
      Item.quantity[itemEntityId] += quantity;
      return true;
    }
  }

  // Otherwise, find an empty slot
  const emptySlot = findEmptySlot(entityId);
  if (emptySlot !== -1) {
    const slotName = `slot${emptySlot}` as const;
    const newItemEid = world.itemCreator.createItem(itemId, quantity);
    (Inventory as any)[slotName][entityId] = newItemEid;
    return true;
  }

  if (world.messageSystem) {
    world.messageSystem.sendMessage(entityId, 'Your inventory is full.');
  }
  return false;
}

/**
 * Remove item from inventory
 */
export function removeItemFromInventory(
  world: IWorld,
  entityId: number,
  slotIndex: number,
  quantity: number
): boolean {
  if (slotIndex < 0 || slotIndex > 27) return false;

  const slotName = `slot${slotIndex}` as const;
  const itemEntityId = (Inventory as any)[slotName][entityId];

  if (itemEntityId && hasComponent(world, Item, itemEntityId)) {
    if (Item.quantity[itemEntityId] > quantity) {
      Item.quantity[itemEntityId] -= quantity;
    } else {
      // TODO: This should remove the entity from the world
      (Inventory as any)[slotName][entityId] = 0; // Remove item
    }
    return true;
  }

  return false;
}

/**
 * Equip an item from inventory
 */
export function equipItem(
  world: WorldWithEquipmentEvents,
  entityId: number,
  inventorySlot: number
): void {
  if (inventorySlot < 0 || inventorySlot > 27) return;

  const fromSlotName = `slot${inventorySlot}` as const;
  const itemToEquipEid = (Inventory as any)[fromSlotName][entityId];

  if (!itemToEquipEid || !hasComponent(world, Item, itemToEquipEid)) return;

  const itemData = getItemData(Item.itemId[itemToEquipEid]);
  if (!itemData || !itemData.equipSlot) {
    if (world.messageSystem) {
      world.messageSystem.sendMessage(entityId, "You can't equip that.");
    }
    return;
  }

  if (!meetsRequirements(entityId, itemData)) {
    if (world.messageSystem) {
      world.messageSystem.sendMessage(entityId, "You don't have the required level to equip that.");
    }
    return;
  }

  const equipSlot = itemData.equipSlot;
  const currentEquippedEid = (Equipment as any)[equipSlot][entityId];

  // Swap with equipped item
  (Equipment as any)[equipSlot][entityId] = itemToEquipEid;

  if (currentEquippedEid) {
    (Inventory as any)[fromSlotName][entityId] = currentEquippedEid;
  } else {
    (Inventory as any)[fromSlotName][entityId] = 0; // Clear inventory slot
  }

  updateEquipmentBonuses(world, entityId);
}

/**
 * Unequip an item to inventory
 */
export function unequipItem(
  world: WorldWithEquipmentEvents,
  entityId: number,
  equipmentSlot: EquipmentSlot
): void {
  const itemToUnequipEid = (Equipment as any)[equipmentSlot][entityId];

  if (!itemToUnequipEid) return; // Nothing in slot

  const emptySlot = findEmptySlot(entityId);
  if (emptySlot === -1) {
    if (world.messageSystem) {
      world.messageSystem.sendMessage(entityId, 'Your inventory is full.');
    }
    return;
  }

  const toSlotName = `slot${emptySlot}` as const;
  (Inventory as any)[toSlotName][entityId] = itemToUnequipEid;
  (Equipment as any)[equipmentSlot][entityId] = 0; // Clear equipment slot

  updateEquipmentBonuses(world, entityId);
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
    const itemEntityId = (Equipment as any)[slot][playerId];
    if (itemEntityId !== 0 && hasComponent(world, Item, itemEntityId)) {
      const itemId = Item.itemId[itemEntityId];
      const item = ITEM_DATABASE[itemId];

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

  for (const slot of slots) {
    (Inventory as any)[slot][entityId] = 0;
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
  const slotIndex = findItemInInventory(entityId, itemId);
  if (slotIndex === -1) {
    return false;
  }
  return removeItemFromInventory(world, entityId, slotIndex, quantity);
}

export function equipItemFromSlot(world: IWorld, entityId: number, slot: number): void {
  equipItem(world as WorldWithEquipmentEvents, entityId, slot);
}
