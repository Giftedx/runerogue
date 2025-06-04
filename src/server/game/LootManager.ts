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
}

export type { LootTableEntry };
