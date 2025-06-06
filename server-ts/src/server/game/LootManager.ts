import { v4 as uuidv4 } from 'uuid';
import { GameState, InventoryItem, LootDrop, NPC, Player } from './EntitySchemas';
import { ItemManager } from './ItemManager';

interface LootTableEntry {
  itemId: string;
  probability: number; // 0-1
  minQuantity?: number;
  maxQuantity?: number;
}

export class LootManager {
  static async dropLootFromNPC(
    state: GameState,
    npc: NPC,
    lootTable: LootTableEntry[]
  ): Promise<LootDrop | null> {
    if (!lootTable || lootTable.length === 0) {
      console.log(`${npc.name} has no loot to drop.`);
      return null;
    }
    const lootDrop = new LootDrop();
    lootDrop.id = uuidv4();
    lootDrop.x = npc.x;
    lootDrop.y = npc.y;

    // Roll for each entry
    const itemManager = ItemManager.getInstance();
    for (const entry of lootTable) {
      if (Math.random() < entry.probability) {
        const itemDef = await itemManager.getItemDefinition(entry.itemId);
        if (itemDef) {
          const qty =
            entry.minQuantity && entry.maxQuantity
              ? Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1)) +
                entry.minQuantity
              : 1;

          // Create a new InventoryItem with proper schema metadata
          const item = new InventoryItem();
          item.itemId = itemDef.itemId;
          item.quantity = qty;
          item.name = itemDef.name;
          item.description = itemDef.description;
          item.attack = itemDef.attack;
          item.defense = itemDef.defense;
          item.isStackable = itemDef.isStackable;

          lootDrop.items.push(item);
        }
      }
    }
    if (lootDrop.items.length > 0) {
      state.lootDrops.set(lootDrop.id, lootDrop);
      console.log(
        `Dropped loot (${lootDrop.items.length} items) at (${lootDrop.x}, ${lootDrop.y})`
      );
      return lootDrop;
    }
    return null;
  }

  static async dropLootFromPlayer(state: GameState, player: Player): Promise<LootDrop | null> {
    if (!player.inventory || player.inventory.length === 0) return null;
    const lootDrop = new LootDrop();
    lootDrop.id = uuidv4();
    lootDrop.x = player.x;
    lootDrop.y = player.y;

    // Create new InventoryItem instances with proper schema metadata
    for (const item of player.inventory) {
      const newItem = new InventoryItem();
      newItem.itemId = item.itemId;
      newItem.quantity = item.quantity;
      newItem.name = item.name;
      newItem.description = item.description;
      newItem.attack = item.attack;
      newItem.defense = item.defense;
      newItem.isStackable = item.isStackable;
      lootDrop.items.push(newItem);
    }

    if (lootDrop.items.length > 0) {
      state.lootDrops.set(lootDrop.id, lootDrop);
      player.inventory.length = 0; // Remove all items from player
      console.log(`Dropped player inventory as loot at (${lootDrop.x}, ${lootDrop.y})`);
      return lootDrop;
    }
    return null;
  }

  static collectLoot(state: GameState, player: Player, lootId: string): boolean {
    const lootDrop = state.lootDrops.get(lootId);
    if (!lootDrop) return false;

    // Create new InventoryItem instances with proper schema metadata
    lootDrop.items.forEach(item => {
      const newItem = new InventoryItem();
      newItem.itemId = item.itemId;
      newItem.quantity = item.quantity;
      newItem.name = item.name;
      newItem.description = item.description;
      newItem.attack = item.attack;
      newItem.defense = item.defense;
      newItem.isStackable = item.isStackable;
      player.inventory.push(newItem);
    });

    state.lootDrops.delete(lootId);
    console.log(`Player ${player.id} collected loot ${lootId}`);
    return true;
  }

  static async dropSpecificItem(
    state: GameState,
    player: Player,
    itemId: string,
    quantity: number
  ): Promise<LootDrop | null> {
    const itemManager = ItemManager.getInstance();
    const itemDef = await itemManager.getItemDefinition(itemId);
    if (!itemDef) {
      console.warn(`Attempted to drop unknown item: ${itemId}`);
      return null;
    }

    let removedQuantity = 0;
    for (let i = player.inventory.length - 1; i >= 0; i--) {
      const invItem = player.inventory[i];
      if (invItem.itemId === itemId) {
        if (invItem.quantity > quantity) {
          invItem.quantity -= quantity;
          removedQuantity = quantity;
          break;
        } else {
          removedQuantity += invItem.quantity;
          player.inventory.splice(i, 1); // Remove item from inventory
          if (removedQuantity >= quantity) {
            break;
          }
        }
      }
    }

    if (removedQuantity === 0) {
      console.warn(`Player ${player.id} does not have item ${itemId} or enough quantity to drop.`);
      return null;
    }

    // Create a new loot drop for the specific item
    const lootDrop = new LootDrop();
    lootDrop.id = uuidv4();
    lootDrop.x = player.x;
    lootDrop.y = player.y;

    // Create a new InventoryItem with proper schema metadata
    const droppedItem = new InventoryItem();
    droppedItem.itemId = itemDef.itemId;
    droppedItem.quantity = removedQuantity;
    droppedItem.name = itemDef.name;
    droppedItem.description = itemDef.description;
    droppedItem.attack = itemDef.attack;
    droppedItem.defense = itemDef.defense;
    droppedItem.isStackable = itemDef.isStackable;

    lootDrop.items.push(droppedItem);

    state.lootDrops.set(lootDrop.id, lootDrop);
    console.log(
      `Player ${player.id} dropped ${removedQuantity}x ${itemDef.name} at (${lootDrop.x}, ${lootDrop.y})`
    );
    return lootDrop;
  }
}

export type { LootTableEntry };
