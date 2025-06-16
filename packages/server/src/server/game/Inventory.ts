/**
 * Inventory System for RuneRogue
 * Handles player inventory, item management, and item definitions
 * Based on authentic OSRS inventory mechanics
 */

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  stackable: boolean;
  tradeable: boolean;
  category: ItemCategory;
  value: number; // Base store value in coins
  weight: number; // Weight in kg
  examine: string;
  icon?: string; // Icon file path or identifier
}

export enum ItemCategory {
  WEAPON = 'weapon',
  ARMOUR = 'armour',
  TOOL = 'tool',
  RESOURCE = 'resource',
  FOOD = 'food',
  POTION = 'potion',
  RUNE = 'rune',
  AMMUNITION = 'ammunition',
  QUEST = 'quest',
  MISC = 'misc',
}

export interface InventoryItem {
  itemId: string;
  quantity: number;
  slot: number;
}

export interface InventoryOperationResult {
  success: boolean;
  message: string;
  itemsAffected?: InventoryItem[];
  remainingQuantity?: number;
}

/**
 * OSRS Item Definitions
 * Common items found in the game
 */
export const OSRS_ITEMS: Record<string, ItemDefinition> = {
  // Logs
  logs: {
    id: 'logs',
    name: 'Logs',
    description: 'Some wood.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 1,
    weight: 2.0,
    examine: 'Some wood.',
  },
  oak_logs: {
    id: 'oak_logs',
    name: 'Oak logs',
    description: 'Logs cut from an oak tree.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 2,
    weight: 2.0,
    examine: 'Logs cut from an oak tree.',
  },
  willow_logs: {
    id: 'willow_logs',
    name: 'Willow logs',
    description: 'Logs cut from a willow tree.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 4,
    weight: 2.0,
    examine: 'Logs cut from a willow tree.',
  },
  maple_logs: {
    id: 'maple_logs',
    name: 'Maple logs',
    description: 'Logs cut from a maple tree.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 8,
    weight: 2.0,
    examine: 'Logs cut from a maple tree.',
  },
  yew_logs: {
    id: 'yew_logs',
    name: 'Yew logs',
    description: 'Logs cut from a yew tree.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 50,
    weight: 2.0,
    examine: 'Logs cut from a yew tree.',
  },
  magic_logs: {
    id: 'magic_logs',
    name: 'Magic logs',
    description: 'Logs cut from a magic tree.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 250,
    weight: 2.0,
    examine: 'Logs cut from a magic tree.',
  },

  // Ores
  copper_ore: {
    id: 'copper_ore',
    name: 'Copper ore',
    description: 'This needs refining.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 1,
    weight: 2.27,
    examine: 'This needs refining.',
  },
  tin_ore: {
    id: 'tin_ore',
    name: 'Tin ore',
    description: 'This needs refining.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 1,
    weight: 2.27,
    examine: 'This needs refining.',
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron ore',
    description: 'This needs refining.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 5,
    weight: 2.27,
    examine: 'This needs refining.',
  },
  coal: {
    id: 'coal',
    name: 'Coal',
    description: 'Hmm a non-renewable energy source!',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 10,
    weight: 2.27,
    examine: 'Hmm a non-renewable energy source!',
  },
  mithril_ore: {
    id: 'mithril_ore',
    name: 'Mithril ore',
    description: 'This needs refining.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 25,
    weight: 2.27,
    examine: 'This needs refining.',
  },
  adamantite_ore: {
    id: 'adamantite_ore',
    name: 'Adamantite ore',
    description: 'This needs refining.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 50,
    weight: 2.27,
    examine: 'This needs refining.',
  },
  runite_ore: {
    id: 'runite_ore',
    name: 'Runite ore',
    description: 'This needs refining.',
    stackable: true,
    tradeable: true,
    category: ItemCategory.RESOURCE,
    value: 500,
    weight: 2.27,
    examine: 'This needs refining.',
  },

  // Tools
  bronze_axe: {
    id: 'bronze_axe',
    name: 'Bronze axe',
    description: 'Used for cutting down trees.',
    stackable: false,
    tradeable: true,
    category: ItemCategory.TOOL,
    value: 1,
    weight: 0.8,
    examine: 'Used for cutting down trees.',
  },
  iron_axe: {
    id: 'iron_axe',
    name: 'Iron axe',
    description: 'Used for cutting down trees.',
    stackable: false,
    tradeable: true,
    category: ItemCategory.TOOL,
    value: 5,
    weight: 0.8,
    examine: 'Used for cutting down trees.',
  },
  bronze_pickaxe: {
    id: 'bronze_pickaxe',
    name: 'Bronze pickaxe',
    description: 'Used for mining.',
    stackable: false,
    tradeable: true,
    category: ItemCategory.TOOL,
    value: 1,
    weight: 0.7,
    examine: 'Used for mining.',
  },
  iron_pickaxe: {
    id: 'iron_pickaxe',
    name: 'Iron pickaxe',
    description: 'Used for mining.',
    stackable: false,
    tradeable: true,
    category: ItemCategory.TOOL,
    value: 5,
    weight: 0.7,
    examine: 'Used for mining.',
  },
};

/**
 * Inventory Manager Class
 * Handles all inventory operations for a player
 */
export class InventoryManager {
  private items: Map<number, InventoryItem> = new Map();
  private maxSlots: number = 28; // OSRS standard inventory size
  private logger: Console;

  constructor(maxSlots: number = 28, initialItems?: InventoryItem[]) {
    this.logger = console; // Can be replaced with proper logger
    this.maxSlots = maxSlots;

    if (initialItems) {
      this.loadItems(initialItems);
    }
  }

  /**
   * Load items into inventory from saved data
   */
  private loadItems(items: InventoryItem[]): void {
    for (const item of items) {
      if (item.slot >= 0 && item.slot < this.maxSlots) {
        this.items.set(item.slot, item);
      }
    }
  }

  /**
   * Get all items in inventory
   */
  getItems(): InventoryItem[] {
    return Array.from(this.items.values()).sort((a, b) => a.slot - b.slot);
  }

  /**
   * Get item in specific slot
   */
  getItem(slot: number): InventoryItem | undefined {
    return this.items.get(slot);
  }

  /**
   * Get item by ID (first found)
   */
  getItemById(itemId: string): InventoryItem | undefined {
    for (const item of this.items.values()) {
      if (item.itemId === itemId) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * Get all items of a specific type
   */
  getItemsById(itemId: string): InventoryItem[] {
    return Array.from(this.items.values()).filter(item => item.itemId === itemId);
  }

  /**
   * Check if inventory has space for an item
   */
  hasSpace(itemId: string, quantity: number = 1): boolean {
    const itemDef = OSRS_ITEMS[itemId];
    if (!itemDef) return false;

    if (itemDef.stackable) {
      // Stackable: check if we have the item or have a free slot
      const existingItem = this.getItemById(itemId);
      return existingItem !== undefined || this.getEmptySlots().length > 0;
    } else {
      // Non-stackable: need empty slots equal to quantity
      return this.getEmptySlots().length >= quantity;
    }
  }

  /**
   * Get empty slots
   */
  getEmptySlots(): number[] {
    const emptySlots: number[] = [];
    for (let i = 0; i < this.maxSlots; i++) {
      if (!this.items.has(i)) {
        emptySlots.push(i);
      }
    }
    return emptySlots;
  }

  /**
   * Get total quantity of an item
   */
  getItemQuantity(itemId: string): number {
    return this.getItemsById(itemId).reduce((total, item) => total + item.quantity, 0);
  }

  /**
   * Add item to inventory
   */
  addItem(itemId: string, quantity: number = 1): InventoryOperationResult {
    const itemDef = OSRS_ITEMS[itemId];
    if (!itemDef) {
      return {
        success: false,
        message: `Item ${itemId} not found`,
      };
    }

    if (quantity <= 0) {
      return {
        success: false,
        message: 'Quantity must be positive',
      };
    }

    if (itemDef.stackable) {
      return this.addStackableItem(itemId, quantity);
    } else {
      return this.addNonStackableItem(itemId, quantity);
    }
  }

  /**
   * Add stackable item to inventory
   */
  private addStackableItem(itemId: string, quantity: number): InventoryOperationResult {
    const existingItem = this.getItemById(itemId);

    if (existingItem) {
      // Stack with existing item
      existingItem.quantity += quantity;
      this.logger.log(
        `Added ${quantity}x ${itemId} to existing stack (total: ${existingItem.quantity})`
      );

      return {
        success: true,
        message: `Added ${quantity}x ${OSRS_ITEMS[itemId].name}`,
        itemsAffected: [existingItem],
      };
    } else {
      // Create new stack
      const emptySlots = this.getEmptySlots();
      if (emptySlots.length === 0) {
        return {
          success: false,
          message: 'Inventory is full',
        };
      }

      const newItem: InventoryItem = {
        itemId,
        quantity,
        slot: emptySlots[0],
      };

      this.items.set(newItem.slot, newItem);
      this.logger.log(`Added ${quantity}x ${itemId} to slot ${newItem.slot}`);

      return {
        success: true,
        message: `Added ${quantity}x ${OSRS_ITEMS[itemId].name}`,
        itemsAffected: [newItem],
      };
    }
  }

  /**
   * Add non-stackable item to inventory
   */
  private addNonStackableItem(itemId: string, quantity: number): InventoryOperationResult {
    const emptySlots = this.getEmptySlots();
    const slotsNeeded = quantity;

    if (emptySlots.length < slotsNeeded) {
      const canAdd = emptySlots.length;
      if (canAdd === 0) {
        return {
          success: false,
          message: 'Inventory is full',
          remainingQuantity: quantity,
        };
      }

      // Add what we can
      const itemsAdded: InventoryItem[] = [];
      for (let i = 0; i < canAdd; i++) {
        const newItem: InventoryItem = {
          itemId,
          quantity: 1,
          slot: emptySlots[i],
        };
        this.items.set(newItem.slot, newItem);
        itemsAdded.push(newItem);
      }

      this.logger.log(`Added ${canAdd}x ${itemId} (${quantity - canAdd} couldn't fit)`);

      return {
        success: true,
        message: `Added ${canAdd}x ${OSRS_ITEMS[itemId].name} (${quantity - canAdd} couldn't fit)`,
        itemsAffected: itemsAdded,
        remainingQuantity: quantity - canAdd,
      };
    }

    // Add all items
    const itemsAdded: InventoryItem[] = [];
    for (let i = 0; i < quantity; i++) {
      const newItem: InventoryItem = {
        itemId,
        quantity: 1,
        slot: emptySlots[i],
      };
      this.items.set(newItem.slot, newItem);
      itemsAdded.push(newItem);
    }

    this.logger.log(`Added ${quantity}x ${itemId}`);

    return {
      success: true,
      message: `Added ${quantity}x ${OSRS_ITEMS[itemId].name}`,
      itemsAffected: itemsAdded,
    };
  }

  /**
   * Remove item from inventory
   */
  removeItem(itemId: string, quantity: number = 1): InventoryOperationResult {
    if (quantity <= 0) {
      return {
        success: false,
        message: 'Quantity must be positive',
      };
    }

    const itemsWithId = this.getItemsById(itemId);
    if (itemsWithId.length === 0) {
      return {
        success: false,
        message: `No ${OSRS_ITEMS[itemId]?.name || itemId} found`,
      };
    }

    const totalAvailable = itemsWithId.reduce((total, item) => total + item.quantity, 0);
    if (totalAvailable < quantity) {
      return {
        success: false,
        message: `Not enough ${OSRS_ITEMS[itemId]?.name || itemId} (have ${totalAvailable}, need ${quantity})`,
      };
    }

    const itemsAffected: InventoryItem[] = [];
    let remainingToRemove = quantity;

    for (const item of itemsWithId) {
      if (remainingToRemove <= 0) break;

      if (item.quantity <= remainingToRemove) {
        // Remove entire stack
        remainingToRemove -= item.quantity;
        this.items.delete(item.slot);
        itemsAffected.push({ ...item, quantity: 0 });
      } else {
        // Reduce stack
        item.quantity -= remainingToRemove;
        itemsAffected.push(item);
        remainingToRemove = 0;
      }
    }

    this.logger.log(`Removed ${quantity}x ${itemId}`);

    return {
      success: true,
      message: `Removed ${quantity}x ${OSRS_ITEMS[itemId]?.name || itemId}`,
      itemsAffected,
    };
  }

  /**
   * Clear entire inventory
   */
  clear(): void {
    this.items.clear();
    this.logger.log('Inventory cleared');
  }

  /**
   * Get inventory weight
   */
  getWeight(): number {
    let totalWeight = 0;
    for (const item of this.items.values()) {
      const itemDef = OSRS_ITEMS[item.itemId];
      if (itemDef) {
        totalWeight += itemDef.weight * item.quantity;
      }
    }
    return Math.round(totalWeight * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get inventory value
   */
  getValue(): number {
    let totalValue = 0;
    for (const item of this.items.values()) {
      const itemDef = OSRS_ITEMS[item.itemId];
      if (itemDef) {
        totalValue += itemDef.value * item.quantity;
      }
    }
    return totalValue;
  }

  /**
   * Check if inventory is full
   */
  isFull(): boolean {
    return this.items.size >= this.maxSlots;
  }

  /**
   * Get number of used slots
   */
  getUsedSlots(): number {
    return this.items.size;
  }

  /**
   * Get number of free slots
   */
  getFreeSlots(): number {
    return this.maxSlots - this.items.size;
  }

  /**
   * Export inventory data for saving
   */
  exportInventory(): InventoryItem[] {
    return this.getItems();
  }

  /**
   * Import inventory data from save
   */
  importInventory(items: InventoryItem[]): void {
    this.clear();
    this.loadItems(items);
    this.logger.log('Inventory imported successfully');
  }
}
