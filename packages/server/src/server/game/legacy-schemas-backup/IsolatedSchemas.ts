/**
 * IsolatedSchemas.ts - Completely isolated Colyseus schema implementation
 * Using fresh import to avoid global pollution from other schema definitions
 */

// Import with fresh namespace to avoid global pollution
import { ArraySchema, Schema as BaseSchema, MapSchema, type } from '@colyseus/schema';

// === COMPLETELY ISOLATED SCHEMA CLASSES ===

/**
 * Isolated item schema
 */
export class IsolatedItem extends BaseSchema {
  @type('string') public iItemId: string = '';
  @type('string') public iItemName: string = '';
  @type('number') public iItemQuantity: number = 1;
  @type('number') public iItemValue: number = 0;
  @type('boolean') public iItemStackable: boolean = false;
}

/**
 * Isolated inventory schema
 */
export class IsolatedInventory extends BaseSchema {
  @type([IsolatedItem]) public iInventoryItems = new ArraySchema<IsolatedItem>();
  @type('number') public iInventoryMaxSlots: number = 28;
  @type('number') public iInventoryUsedSlots: number = 0;

  addItem(item: IsolatedItem): boolean {
    if (this.iInventoryUsedSlots >= this.iInventoryMaxSlots) {
      return false;
    }

    // Check if item already exists and is stackable
    const existingItem = this.iInventoryItems.find(
      invItem => invItem.iItemId === item.iItemId && invItem.iItemStackable
    );

    if (existingItem) {
      existingItem.iItemQuantity += item.iItemQuantity;
    } else {
      this.iInventoryItems.push(item);
      this.iInventoryUsedSlots++;
    }

    return true;
  }

  removeItem(itemId: string, quantity: number = 1): boolean {
    const itemIndex = this.iInventoryItems.findIndex(item => item.iItemId === itemId);
    if (itemIndex === -1) return false;

    const item = this.iInventoryItems[itemIndex];
    if (item.iItemQuantity <= quantity) {
      this.iInventoryItems.splice(itemIndex, 1);
      this.iInventoryUsedSlots--;
    } else {
      item.iItemQuantity -= quantity;
    }

    return true;
  }
}

/**
 * Isolated skill schema
 */
export class IsolatedSkill extends BaseSchema {
  @type('number') public iSkillLevel: number = 1;
  @type('number') public iSkillExperience: number = 0;
  @type('number') public iSkillMaxLevel: number = 99;

  addExperience(xp: number): boolean {
    if (this.iSkillLevel >= this.iSkillMaxLevel) {
      return false;
    }

    this.iSkillExperience += xp;

    // Check for level up (simplified OSRS formula)
    const requiredXp = Math.floor(this.iSkillLevel * 100 * Math.pow(1.1, this.iSkillLevel - 1));
    if (this.iSkillExperience >= requiredXp && this.iSkillLevel < this.iSkillMaxLevel) {
      this.iSkillLevel++;
      return true; // Level up occurred
    }

    return false; // No level up
  }
}

/**
 * Isolated skills collection
 */
export class IsolatedSkills extends BaseSchema {
  @type(IsolatedSkill) public iSkillAttack = new IsolatedSkill();
  @type(IsolatedSkill) public iSkillStrength = new IsolatedSkill();
  @type(IsolatedSkill) public iSkillDefence = new IsolatedSkill();
  @type(IsolatedSkill) public iSkillHitpoints = new IsolatedSkill();
  @type(IsolatedSkill) public iSkillRanged = new IsolatedSkill();
  @type(IsolatedSkill) public iSkillPrayer = new IsolatedSkill();
  @type(IsolatedSkill) public iSkillMagic = new IsolatedSkill();

  constructor() {
    super();
    // Initialize hitpoints to level 10 (OSRS default)
    this.iSkillHitpoints.iSkillLevel = 10;
    this.iSkillHitpoints.iSkillExperience = 1184;
  }

  getCombatLevel(): number {
    const attack = this.iSkillAttack.iSkillLevel;
    const strength = this.iSkillStrength.iSkillLevel;
    const defence = this.iSkillDefence.iSkillLevel;
    const hitpoints = this.iSkillHitpoints.iSkillLevel;
    const ranged = this.iSkillRanged.iSkillLevel;
    const prayer = this.iSkillPrayer.iSkillLevel;
    const magic = this.iSkillMagic.iSkillLevel;

    const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
    const melee = 0.325 * (attack + strength);
    const rangedLevel = 0.325 * Math.floor(ranged * 1.5);
    const mageLevel = 0.325 * Math.floor(magic * 1.5);

    return Math.floor(base + Math.max(melee, rangedLevel, mageLevel));
  }
}

/**
 * Isolated equipment schema
 */
export class IsolatedEquipment extends BaseSchema {
  @type(IsolatedItem) public iEquipmentHead: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentNeck: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentBody: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentLegs: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentFeet: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentHands: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentWeapon: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentShield: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentRing: IsolatedItem | undefined;
  @type(IsolatedItem) public iEquipmentAmmo: IsolatedItem | undefined;

  equipItem(item: IsolatedItem, slot: string): IsolatedItem | undefined {
    const previousItem = this.getEquippedItem(slot);
    this.setEquippedItem(slot, item);
    return previousItem;
  }

  unequipItem(slot: string): IsolatedItem | undefined {
    const item = this.getEquippedItem(slot);
    this.setEquippedItem(slot, undefined);
    return item;
  }

  private getEquippedItem(slot: string): IsolatedItem | undefined {
    switch (slot) {
      case 'head':
        return this.iEquipmentHead;
      case 'neck':
        return this.iEquipmentNeck;
      case 'body':
        return this.iEquipmentBody;
      case 'legs':
        return this.iEquipmentLegs;
      case 'feet':
        return this.iEquipmentFeet;
      case 'hands':
        return this.iEquipmentHands;
      case 'weapon':
        return this.iEquipmentWeapon;
      case 'shield':
        return this.iEquipmentShield;
      case 'ring':
        return this.iEquipmentRing;
      case 'ammo':
        return this.iEquipmentAmmo;
      default:
        return undefined;
    }
  }

  private setEquippedItem(slot: string, item: IsolatedItem | undefined): void {
    switch (slot) {
      case 'head':
        this.iEquipmentHead = item;
        break;
      case 'neck':
        this.iEquipmentNeck = item;
        break;
      case 'body':
        this.iEquipmentBody = item;
        break;
      case 'legs':
        this.iEquipmentLegs = item;
        break;
      case 'feet':
        this.iEquipmentFeet = item;
        break;
      case 'hands':
        this.iEquipmentHands = item;
        break;
      case 'weapon':
        this.iEquipmentWeapon = item;
        break;
      case 'shield':
        this.iEquipmentShield = item;
        break;
      case 'ring':
        this.iEquipmentRing = item;
        break;
      case 'ammo':
        this.iEquipmentAmmo = item;
        break;
    }
  }
}

/**
 * Isolated player schema
 */
export class IsolatedPlayer extends BaseSchema {
  @type('string') public iPlayerId: string = '';
  @type('string') public iPlayerUsername: string = '';
  @type('number') public iPlayerX: number = 0;
  @type('number') public iPlayerY: number = 0;
  @type('number') public iPlayerHealth: number = 100;
  @type('number') public iPlayerMaxHealth: number = 100;
  @type('boolean') public iPlayerOnline: boolean = false;
  @type('string') public iPlayerStatus: string = 'idle';
  @type('number') public iPlayerLastAction: number = 0;

  @type(IsolatedInventory) public iPlayerInventory = new IsolatedInventory();
  @type(IsolatedSkills) public iPlayerSkills = new IsolatedSkills();
  @type(IsolatedEquipment) public iPlayerEquipment = new IsolatedEquipment();

  moveTo(x: number, y: number): void {
    this.iPlayerX = x;
    this.iPlayerY = y;
    this.iPlayerLastAction = Date.now();
  }

  takeDamage(damage: number): boolean {
    this.iPlayerHealth = Math.max(0, this.iPlayerHealth - damage);
    this.iPlayerLastAction = Date.now();
    return this.iPlayerHealth <= 0; // Returns true if player died
  }

  heal(amount: number): void {
    this.iPlayerHealth = Math.min(this.iPlayerMaxHealth, this.iPlayerHealth + amount);
    this.iPlayerLastAction = Date.now();
  }

  getCombatLevel(): number {
    return this.iPlayerSkills.getCombatLevel();
  }
}

/**
 * Isolated NPC schema
 */
export class IsolatedNPC extends BaseSchema {
  @type('string') public iNpcId: string = '';
  @type('string') public iNpcName: string = '';
  @type('number') public iNpcX: number = 0;
  @type('number') public iNpcY: number = 0;
  @type('number') public iNpcHealth: number = 100;
  @type('number') public iNpcMaxHealth: number = 100;
  @type('number') public iNpcLevel: number = 1;
  @type('string') public iNpcType: string = 'monster';
  @type('boolean') public iNpcAggressive: boolean = false;
  @type('string') public iNpcStatus: string = 'idle';

  moveTo(x: number, y: number): void {
    this.iNpcX = x;
    this.iNpcY = y;
  }

  takeDamage(damage: number): boolean {
    this.iNpcHealth = Math.max(0, this.iNpcHealth - damage);
    return this.iNpcHealth <= 0; // Returns true if NPC died
  }
}

/**
 * Isolated loot schema
 */
export class IsolatedLoot extends BaseSchema {
  @type('string') public iLootId: string = '';
  @type('string') public iLootItemId: string = '';
  @type('number') public iLootX: number = 0;
  @type('number') public iLootY: number = 0;
  @type('number') public iLootQuantity: number = 1;
  @type('number') public iLootSpawnTime: number = 0;
  @type('number') public iLootDespawnTime: number = 0;
  @type('string') public iLootOwner: string = ''; // Player who can pick it up first

  constructor() {
    super();
    this.iLootSpawnTime = Date.now();
    this.iLootDespawnTime = Date.now() + 60000; // 1 minute despawn time
  }

  isExpired(): boolean {
    return Date.now() > this.iLootDespawnTime;
  }

  canPickup(playerId: string): boolean {
    // Owner has exclusive access for first 30 seconds
    const exclusiveTime = this.iLootSpawnTime + 30000;
    return this.iLootOwner === playerId || Date.now() > exclusiveTime;
  }
}

/**
 * Isolated game state schema
 */
export class IsolatedGameState extends BaseSchema {
  @type({ map: IsolatedPlayer }) public iGamePlayers = new MapSchema<IsolatedPlayer>();
  @type({ map: IsolatedNPC }) public iGameNPCs = new MapSchema<IsolatedNPC>();
  @type({ map: IsolatedLoot }) public iGameLoot = new MapSchema<IsolatedLoot>();
  @type('number') public iGameTickRate: number = 60;
  @type('number') public iGameTimestamp: number = 0;
  @type('string') public iGameStatus: string = 'running';

  constructor() {
    super();
    this.iGameTimestamp = Date.now();
  }

  addPlayer(player: IsolatedPlayer): void {
    this.iGamePlayers.set(player.iPlayerId, player);
    player.iPlayerOnline = true;
  }

  removePlayer(playerId: string): IsolatedPlayer | undefined {
    const player = this.iGamePlayers.get(playerId);
    if (player) {
      player.iPlayerOnline = false;
      this.iGamePlayers.delete(playerId);
    }
    return player;
  }

  getPlayer(playerId: string): IsolatedPlayer | undefined {
    return this.iGamePlayers.get(playerId);
  }

  addNPC(npc: IsolatedNPC): void {
    this.iGameNPCs.set(npc.iNpcId, npc);
  }

  removeNPC(npcId: string): IsolatedNPC | undefined {
    const npc = this.iGameNPCs.get(npcId);
    if (npc) {
      this.iGameNPCs.delete(npcId);
    }
    return npc;
  }

  addLoot(loot: IsolatedLoot): void {
    this.iGameLoot.set(loot.iLootId, loot);
  }

  removeLoot(lootId: string): IsolatedLoot | undefined {
    const loot = this.iGameLoot.get(lootId);
    if (loot) {
      this.iGameLoot.delete(lootId);
    }
    return loot;
  }

  cleanupExpiredLoot(): number {
    let cleaned = 0;
    this.iGameLoot.forEach((loot, lootId) => {
      if (loot.isExpired()) {
        this.removeLoot(lootId);
        cleaned++;
      }
    });
    return cleaned;
  }

  tick(): void {
    this.iGameTimestamp = Date.now();
    this.cleanupExpiredLoot();
  }
}

// === FACTORY FUNCTIONS ===

/**
 * Create a new isolated item
 */
export function createIsolatedItem(
  itemId: string,
  itemName: string,
  quantity: number = 1,
  value: number = 0,
  stackable: boolean = false
): IsolatedItem {
  const item = new IsolatedItem();
  item.iItemId = itemId;
  item.iItemName = itemName;
  item.iItemQuantity = quantity;
  item.iItemValue = value;
  item.iItemStackable = stackable;
  return item;
}

/**
 * Create a new isolated player
 */
export function createIsolatedPlayer(
  playerId: string,
  username: string,
  x: number = 0,
  y: number = 0
): IsolatedPlayer {
  const player = new IsolatedPlayer();
  player.iPlayerId = playerId;
  player.iPlayerUsername = username;
  player.iPlayerX = x;
  player.iPlayerY = y;
  player.iPlayerHealth = player.iPlayerSkills.iSkillHitpoints.iSkillLevel * 10; // OSRS formula
  player.iPlayerMaxHealth = player.iPlayerHealth;
  return player;
}

/**
 * Create a new isolated NPC
 */
export function createIsolatedNPC(
  npcId: string,
  npcName: string,
  x: number,
  y: number,
  level: number = 1,
  npcType: string = 'monster'
): IsolatedNPC {
  const npc = new IsolatedNPC();
  npc.iNpcId = npcId;
  npc.iNpcName = npcName;
  npc.iNpcX = x;
  npc.iNpcY = y;
  npc.iNpcLevel = level;
  npc.iNpcType = npcType;
  npc.iNpcHealth = level * 10; // Simple formula
  npc.iNpcMaxHealth = npc.iNpcHealth;
  return npc;
}

/**
 * Create a new isolated loot
 */
export function createIsolatedLoot(
  lootId: string,
  itemId: string,
  x: number,
  y: number,
  quantity: number = 1,
  owner: string = ''
): IsolatedLoot {
  const loot = new IsolatedLoot();
  loot.iLootId = lootId;
  loot.iLootItemId = itemId;
  loot.iLootX = x;
  loot.iLootY = y;
  loot.iLootQuantity = quantity;
  loot.iLootOwner = owner;
  return loot;
}

/**
 * Create a new isolated game state
 */
export function createIsolatedGameState(): IsolatedGameState {
  return new IsolatedGameState();
}

// === EXPORTS ===

export const IsolatedSchemas = {
  // Core classes
  IsolatedItem,
  IsolatedInventory,
  IsolatedSkill,
  IsolatedSkills,
  IsolatedEquipment,
  IsolatedPlayer,
  IsolatedNPC,
  IsolatedLoot,
  IsolatedGameState,

  // Factory functions
  createIsolatedItem,
  createIsolatedPlayer,
  createIsolatedNPC,
  createIsolatedLoot,
  createIsolatedGameState,
};

export default IsolatedSchemas;
