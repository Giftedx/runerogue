import * as fs from 'fs';
import * as path from 'path';

export interface ItemDefinition {
  itemId: string;
  name: string;
  description: string;
  attack: number;
  defense: number;
  isStackable: boolean;
}

export class ItemManager {
  private static instance: ItemManager;
  private itemDefinitions: Map<string, ItemDefinition> = new Map();

  private constructor() {
    this.loadItemDefinitions();
  }

  public static getInstance(): ItemManager {
    if (!ItemManager.instance) {
      ItemManager.instance = new ItemManager();
    }
    return ItemManager.instance;
  }

  private loadItemDefinitions(): void {
    try {
      const itemsPath = path.join(__dirname, '../data/items.json');
      const data = fs.readFileSync(itemsPath, 'utf8');
      const items: ItemDefinition[] = JSON.parse(data);
      items.forEach(item => {
        this.itemDefinitions.set(item.itemId, item);
      });
      console.log(`Loaded ${this.itemDefinitions.size} item definitions.`);
    } catch (error) {
      console.error('Failed to load item definitions:', error);
    }
  }

  public getItemDefinition(itemId: string): ItemDefinition | undefined {
    return this.itemDefinitions.get(itemId);
  }
}
