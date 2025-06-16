/**
 * Mock implementations of Colyseus schemas for testing
 * This bypasses the Symbol.metadata issues by using plain objects
 */

// Plain object implementation that mimics the schema structure
export class MockInventoryItem {
  itemId: string = '';
  name: string = '';
  description: string = '';
  quantity: number = 0;

  constructor(itemDef?: any, quantity: number = 1) {
    if (itemDef) {
      this.itemId = itemDef.id || '';
      this.name = itemDef.name || '';
      this.description = itemDef.description || '';
      this.quantity = quantity;
    }
  }
}

export class MockSkills {
  attack: { level: number; experience: number } = { level: 1, experience: 0 };
  strength: { level: number; experience: number } = { level: 1, experience: 0 };
  defence: { level: number; experience: number } = { level: 1, experience: 0 };
  mining: { level: number; experience: number } = { level: 1, experience: 0 };
  woodcutting: { level: number; experience: number } = { level: 1, experience: 0 };
  fishing: { level: number; experience: number } = { level: 1, experience: 0 };
  prayer: { level: number; experience: number } = { level: 1, experience: 0 };
}

export class MockPlayer {
  id: string = '';
  username: string = '';
  x: number = 0;
  y: number = 0;
  health: number = 100;
  maxHealth: number = 100;
  inventory: MockInventoryItem[] = [];
  skills: MockSkills = new MockSkills();
  combatLevel: number = 3;
  activePrayers: string[] = [];
  tradeId?: string;

  constructor() {
    this.skills = new MockSkills();
  }
}

export class MockLootDrop {
  id: string = '';
  x: number = 0;
  y: number = 0;
  items: MockInventoryItem[] = [];
}

export class MockNPC {
  id: string = '';
  name: string = '';
  x: number = 0;
  y: number = 0;
  health: number = 100;
  maxHealth: number = 100;
  level: number = 1;
  type: string = '';
}

export class MockTradeOffer {
  playerId: string = '';
  items: MockInventoryItem[] = [];
  accepted: boolean = false;
}

export class MockTrade {
  id: string = '';
  proposer: string = '';
  accepter: string = '';
  proposerItems: MockInventoryItem[] = [];
  accepterItems: MockInventoryItem[] = [];
  proposerAccepted: boolean = false;
  accepterAccepted: boolean = false;
  status: string = 'pending';
}

export class MockGameState {
  players: Map<string, MockPlayer> = new Map();
  lootDrops: Map<string, MockLootDrop> = new Map();
  npcs: Map<string, MockNPC> = new Map();
  trades: Map<string, MockTrade> = new Map();

  constructor() {
    this.players = new Map();
    this.lootDrops = new Map();
    this.npcs = new Map();
    this.trades = new Map();
  }
}

// Mock the schema decorators to do nothing
export function type(target: any): any {
  return target;
}

export function schema(target: any): any {
  return target;
}
