import { GameState, NPC, Player, InventoryItem, LootDrop } from './EntitySchemas';
import { ItemManager } from './ItemManager';
import { v4 as uuidv4 } from 'uuid';

interface LootTableEntry {
  itemId: string;
  probability: number; // 0-1
  minQuantity?: number;
  maxQuantity?: number;
}

export class LootManager {
  static dropLootFromNPC(state: GameState, npc: NPC, lootTable: LootTableEntry[]): void {
    if (!lootTable || lootTable.length === 0) {
      console.log(`${npc.name} has no loot to drop.`);
      return;
    }
    const lootDrop = new LootDrop();
    lootDrop.id = uuidv4();
    lootDrop.x = npc.x;
    lootDrop.y = npc.y;

    // Roll for each entry
    const itemManager = ItemManager.getInstance();
    lootTable.forEach(entry => {
      if (Math.random() < entry.probability) {
        const itemDef = itemManager.getItemDefinition(entry.itemId);
        if (itemDef) {
          const qty = entry.minQuantity && entry.maxQuantity ?
            Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1)) + entry.minQuantity : 1;
          const item = new InventoryItem(itemDef, qty);
          lootDrop.items.push(item);
        }
      }
    });
    if (lootDrop.items.length > 0) {
      state.lootDrops.set(lootDrop.id, lootDrop);
      console.log(`Dropped loot (${lootDrop.items.length} items) at (${lootDrop.x}, ${lootDrop.y})`);
    }
  }

  static dropLootFromPlayer(state: GameState, player: Player): LootDrop | null {
    if (!player.inventory || player.inventory.length === 0) return null;
    const lootDrop = new LootDrop();
    lootDrop.id = uuidv4();
    lootDrop.x = player.x;
    lootDrop.y = player.y;
    player.inventory.forEach(item => {
      lootDrop.items.push(item);
    });
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
    lootDrop.items.forEach(item => {
      player.inventory.push(item);
    });
    state.lootDrops.delete(lootId);
    console.log(`Player ${player.id} collected loot ${lootId}`);
    return true;
  }

  static dropSpecificItem(state: GameState, player: Player, itemId: string, quantity: number): LootDrop | null {
    const itemManager = ItemManager.getInstance();
    const itemDef = itemManager.getItemDefinition(itemId);
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

    const droppedItem = new InventoryItem(itemDef, removedQuantity);
    lootDrop.items.push(droppedItem);

    state.lootDrops.set(lootDrop.id, lootDrop);
    console.log(`Player ${player.id} dropped ${removedQuantity}x ${itemDef.name} at (${lootDrop.x}, ${lootDrop.y})`);
    return lootDrop;
  }
}

export type { LootTableEntry };
