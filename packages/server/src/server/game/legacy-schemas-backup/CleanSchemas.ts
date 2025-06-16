/**
 * CleanSchemas.ts - A completely clean Colyseus schema implementation
 * with unique property names and proper registration to avoid all duplicate errors
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';

// === CORE SCHEMA INTERFACES ===

export interface PlayerActionMessage {
  type: string;
  targetId?: string;
  data?: Record<string, unknown>;
}

export interface LootDropEvent {
  itemId: string;
  position: { x: number; y: number };
  quantity: number;
}

// === CLEAN SCHEMA CLASSES ===

/**
 * Basic item schema with unique property names
 */
export class CleanItem extends Schema {
  @type('string') itemId: string = '';
  @type('string') itemName: string = '';
  @type('number') itemQuantity: number = 1;
  @type('number') itemValue: number = 0;
  @type('boolean') itemStackable: boolean = false;
}

/**
 * Player inventory schema
 */
export class CleanInventory extends Schema {
  @type([CleanItem]) inventoryItems = new ArraySchema<CleanItem>();
  @type('number') inventoryMaxSlots: number = 28;
  @type('number') inventoryUsedSlots: number = 0;

  /**
   * Add an item to the inventory
   */
  addItem(item: CleanItem): boolean {
    if (this.inventoryUsedSlots >= this.inventoryMaxSlots) {
      return false;
    }

    // Check if item already exists and is stackable
    const existingItem = this.inventoryItems.find(
      invItem => invItem.itemId === item.itemId && invItem.itemStackable
    );

    if (existingItem) {
      existingItem.itemQuantity += item.itemQuantity;
    } else {
      this.inventoryItems.push(item);
      this.inventoryUsedSlots++;
    }

    return true;
  }

  /**
   * Remove an item from the inventory
   */
  removeItem(itemId: string, quantity: number = 1): boolean {
    const itemIndex = this.inventoryItems.findIndex(item => item.itemId === itemId);
    if (itemIndex === -1) return false;

    const item = this.inventoryItems[itemIndex];
    if (item.itemQuantity <= quantity) {
      this.inventoryItems.splice(itemIndex, 1);
      this.inventoryUsedSlots--;
    } else {
      item.itemQuantity -= quantity;
    }

    return true;
  }
}

/**
 * Player skill schema
 */
export class CleanSkill extends Schema {
  @type('number') skillLevel: number = 1;
  @type('number') skillExperience: number = 0;
  @type('number') skillMaxLevel: number = 99;

  /**
   * Add experience to the skill
   */
  addExperience(xp: number): boolean {
    if (this.skillLevel >= this.skillMaxLevel) {
      return false;
    }

    this.skillExperience += xp;

    // Check for level up (simplified OSRS formula)
    const requiredXp = Math.floor(this.skillLevel * 100 * Math.pow(1.1, this.skillLevel - 1));
    if (this.skillExperience >= requiredXp && this.skillLevel < this.skillMaxLevel) {
      this.skillLevel++;
      return true; // Level up occurred
    }

    return false; // No level up
  }
}

/**
 * Player skills collection
 */
export class CleanSkills extends Schema {
  @type(CleanSkill) skillAttack = new CleanSkill();
  @type(CleanSkill) skillStrength = new CleanSkill();
  @type(CleanSkill) skillDefence = new CleanSkill();
  @type(CleanSkill) skillHitpoints = new CleanSkill();
  @type(CleanSkill) skillRanged = new CleanSkill();
  @type(CleanSkill) skillPrayer = new CleanSkill();
  @type(CleanSkill) skillMagic = new CleanSkill();

  constructor() {
    super();
    // Initialize hitpoints to level 10 (OSRS default)
    this.skillHitpoints.skillLevel = 10;
    this.skillHitpoints.skillExperience = 1184;
  }

  /**
   * Calculate combat level using OSRS formula
   */
  getCombatLevel(): number {
    const attack = this.skillAttack.skillLevel;
    const strength = this.skillStrength.skillLevel;
    const defence = this.skillDefence.skillLevel;
    const hitpoints = this.skillHitpoints.skillLevel;
    const ranged = this.skillRanged.skillLevel;
    const prayer = this.skillPrayer.skillLevel;
    const magic = this.skillMagic.skillLevel;

    const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
    const melee = 0.325 * (attack + strength);
    const rangedLevel = 0.325 * Math.floor(ranged * 1.5);
    const mageLevel = 0.325 * Math.floor(magic * 1.5);

    return Math.floor(base + Math.max(melee, rangedLevel, mageLevel));
  }
}

/**
 * Equipment slot schema
 */
export class CleanEquipment extends Schema {
  @type(CleanItem) equipmentHead: CleanItem | undefined;
  @type(CleanItem) equipmentNeck: CleanItem | undefined;
  @type(CleanItem) equipmentBody: CleanItem | undefined;
  @type(CleanItem) equipmentLegs: CleanItem | undefined;
  @type(CleanItem) equipmentFeet: CleanItem | undefined;
  @type(CleanItem) equipmentHands: CleanItem | undefined;
  @type(CleanItem) equipmentWeapon: CleanItem | undefined;
  @type(CleanItem) equipmentShield: CleanItem | undefined;
  @type(CleanItem) equipmentRing: CleanItem | undefined;
  @type(CleanItem) equipmentAmmo: CleanItem | undefined;

  /**
   * Equip an item to the appropriate slot
   */
  equipItem(item: CleanItem, slot: string): CleanItem | undefined {
    const previousItem = this.getEquippedItem(slot);
    this.setEquippedItem(slot, item);
    return previousItem;
  }

  /**
   * Unequip an item from a slot
   */
  unequipItem(slot: string): CleanItem | undefined {
    const item = this.getEquippedItem(slot);
    this.setEquippedItem(slot, undefined);
    return item;
  }

  private getEquippedItem(slot: string): CleanItem | undefined {
    switch (slot) {
      case 'head':
        return this.equipmentHead;
      case 'neck':
        return this.equipmentNeck;
      case 'body':
        return this.equipmentBody;
      case 'legs':
        return this.equipmentLegs;
      case 'feet':
        return this.equipmentFeet;
      case 'hands':
        return this.equipmentHands;
      case 'weapon':
        return this.equipmentWeapon;
      case 'shield':
        return this.equipmentShield;
      case 'ring':
        return this.equipmentRing;
      case 'ammo':
        return this.equipmentAmmo;
      default:
        return undefined;
    }
  }

  private setEquippedItem(slot: string, item: CleanItem | undefined): void {
    switch (slot) {
      case 'head':
        this.equipmentHead = item;
        break;
      case 'neck':
        this.equipmentNeck = item;
        break;
      case 'body':
        this.equipmentBody = item;
        break;
      case 'legs':
        this.equipmentLegs = item;
        break;
      case 'feet':
        this.equipmentFeet = item;
        break;
      case 'hands':
        this.equipmentHands = item;
        break;
      case 'weapon':
        this.equipmentWeapon = item;
        break;
      case 'shield':
        this.equipmentShield = item;
        break;
      case 'ring':
        this.equipmentRing = item;
        break;
      case 'ammo':
        this.equipmentAmmo = item;
        break;
    }
  }
}

/**
 * Player schema with unique property names
 */
export class CleanPlayer extends Schema {
  @type('string') playerId: string = '';
  @type('string') playerUsername: string = '';
  @type('number') playerX: number = 0;
  @type('number') playerY: number = 0;
  @type('number') playerHealth: number = 100;
  @type('number') playerMaxHealth: number = 100;
  @type('boolean') playerOnline: boolean = false;
  @type('string') playerStatus: string = 'idle';
  @type('number') playerLastAction: number = 0;

  @type(CleanInventory) playerInventory = new CleanInventory();
  @type(CleanSkills) playerSkills = new CleanSkills();
  @type(CleanEquipment) playerEquipment = new CleanEquipment();

  /**
   * Move the player to a new position
   */
  moveTo(x: number, y: number): void {
    this.playerX = x;
    this.playerY = y;
    this.playerLastAction = Date.now();
  }

  /**
   * Take damage
   */
  takeDamage(damage: number): boolean {
    this.playerHealth = Math.max(0, this.playerHealth - damage);
    this.playerLastAction = Date.now();
    return this.playerHealth <= 0; // Returns true if player died
  }

  /**
   * Heal the player
   */
  heal(amount: number): void {
    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + amount);
    this.playerLastAction = Date.now();
  }

  /**
   * Get combat level
   */
  getCombatLevel(): number {
    return this.playerSkills.getCombatLevel();
  }
}

/**
 * NPC schema with unique property names
 */
export class CleanNPC extends Schema {
  @type('string') npcId: string = '';
  @type('string') npcName: string = '';
  @type('number') npcX: number = 0;
  @type('number') npcY: number = 0;
  @type('number') npcHealth: number = 100;
  @type('number') npcMaxHealth: number = 100;
  @type('number') npcLevel: number = 1;
  @type('string') npcType: string = 'monster';
  @type('boolean') npcAggressive: boolean = false;
  @type('string') npcStatus: string = 'idle';

  /**
   * Move the NPC
   */
  moveTo(x: number, y: number): void {
    this.npcX = x;
    this.npcY = y;
  }

  /**
   * Take damage
   */
  takeDamage(damage: number): boolean {
    this.npcHealth = Math.max(0, this.npcHealth - damage);
    return this.npcHealth <= 0; // Returns true if NPC died
  }
}

/**
 * Loot item schema
 */
export class CleanLoot extends Schema {
  @type('string') lootId: string = '';
  @type('string') lootItemId: string = '';
  @type('number') lootX: number = 0;
  @type('number') lootY: number = 0;
  @type('number') lootQuantity: number = 1;
  @type('number') lootSpawnTime: number = 0;
  @type('number') lootDespawnTime: number = 0;
  @type('string') lootOwner: string = ''; // Player who can pick it up first

  constructor() {
    super();
    this.lootSpawnTime = Date.now();
    this.lootDespawnTime = Date.now() + 60000; // 1 minute despawn time
  }

  /**
   * Check if loot has expired
   */
  isExpired(): boolean {
    return Date.now() > this.lootDespawnTime;
  }

  /**
   * Check if player can pick up this loot
   */
  canPickup(playerId: string): boolean {
    // Owner has exclusive access for first 30 seconds
    const exclusiveTime = this.lootSpawnTime + 30000;
    return this.lootOwner === playerId || Date.now() > exclusiveTime;
  }
}

/**
 * Game state schema with unique property names
 */
export class CleanGameState extends Schema {
  @type({ map: CleanPlayer }) gamePlayers = new MapSchema<CleanPlayer>();
  @type({ map: CleanNPC }) gameNPCs = new MapSchema<CleanNPC>();
  @type({ map: CleanLoot }) gameLoot = new MapSchema<CleanLoot>();
  @type('number') gameTickRate: number = 60;
  @type('number') gameTimestamp: number = 0;
  @type('string') gameStatus: string = 'running';

  constructor() {
    super();
    this.gameTimestamp = Date.now();
  }

  /**
   * Add a player to the game
   */
  addPlayer(player: CleanPlayer): void {
    this.gamePlayers.set(player.playerId, player);
    player.playerOnline = true;
  }

  /**
   * Remove a player from the game
   */
  removePlayer(playerId: string): CleanPlayer | undefined {
    const player = this.gamePlayers.get(playerId);
    if (player) {
      player.playerOnline = false;
      this.gamePlayers.delete(playerId);
    }
    return player;
  }

  /**
   * Get a player by ID
   */
  getPlayer(playerId: string): CleanPlayer | undefined {
    return this.gamePlayers.get(playerId);
  }

  /**
   * Add an NPC to the game
   */
  addNPC(npc: CleanNPC): void {
    this.gameNPCs.set(npc.npcId, npc);
  }

  /**
   * Remove an NPC from the game
   */
  removeNPC(npcId: string): CleanNPC | undefined {
    const npc = this.gameNPCs.get(npcId);
    if (npc) {
      this.gameNPCs.delete(npcId);
    }
    return npc;
  }

  /**
   * Add loot to the game
   */
  addLoot(loot: CleanLoot): void {
    this.gameLoot.set(loot.lootId, loot);
  }

  /**
   * Remove loot from the game
   */
  removeLoot(lootId: string): CleanLoot | undefined {
    const loot = this.gameLoot.get(lootId);
    if (loot) {
      this.gameLoot.delete(lootId);
    }
    return loot;
  }

  /**
   * Clean up expired loot
   */
  cleanupExpiredLoot(): number {
    let cleaned = 0;
    this.gameLoot.forEach((loot, lootId) => {
      if (loot.isExpired()) {
        this.removeLoot(lootId);
        cleaned++;
      }
    });
    return cleaned;
  }

  /**
   * Update game timestamp
   */
  tick(): void {
    this.gameTimestamp = Date.now();
    this.cleanupExpiredLoot();
  }
}

// === FACTORY FUNCTIONS ===

/**
 * Create a new clean item
 */
export function createCleanItem(
  itemId: string,
  itemName: string,
  quantity: number = 1,
  value: number = 0,
  stackable: boolean = false
): CleanItem {
  const item = new CleanItem();
  item.itemId = itemId;
  item.itemName = itemName;
  item.itemQuantity = quantity;
  item.itemValue = value;
  item.itemStackable = stackable;
  return item;
}

/**
 * Create a new clean player
 */
export function createCleanPlayer(
  playerId: string,
  username: string,
  x: number = 0,
  y: number = 0
): CleanPlayer {
  const player = new CleanPlayer();
  player.playerId = playerId;
  player.playerUsername = username;
  player.playerX = x;
  player.playerY = y;
  player.playerHealth = player.playerSkills.skillHitpoints.skillLevel * 10; // OSRS formula
  player.playerMaxHealth = player.playerHealth;
  return player;
}

/**
 * Create a new clean NPC
 */
export function createCleanNPC(
  npcId: string,
  npcName: string,
  x: number,
  y: number,
  level: number = 1,
  npcType: string = 'monster'
): CleanNPC {
  const npc = new CleanNPC();
  npc.npcId = npcId;
  npc.npcName = npcName;
  npc.npcX = x;
  npc.npcY = y;
  npc.npcLevel = level;
  npc.npcType = npcType;
  npc.npcHealth = level * 10; // Simple formula
  npc.npcMaxHealth = npc.npcHealth;
  return npc;
}

/**
 * Create a new clean loot
 */
export function createCleanLoot(
  lootId: string,
  itemId: string,
  x: number,
  y: number,
  quantity: number = 1,
  owner: string = ''
): CleanLoot {
  const loot = new CleanLoot();
  loot.lootId = lootId;
  loot.lootItemId = itemId;
  loot.lootX = x;
  loot.lootY = y;
  loot.lootQuantity = quantity;
  loot.lootOwner = owner;
  return loot;
}

/**
 * Create a new clean game state
 */
export function createCleanGameState(): CleanGameState {
  return new CleanGameState();
}

// === EXPORTS ===

export const CleanSchemas = {
  // Core classes
  CleanItem,
  CleanInventory,
  CleanSkill,
  CleanSkills,
  CleanEquipment,
  CleanPlayer,
  CleanNPC,
  CleanLoot,
  CleanGameState,

  // Factory functions
  createCleanItem,
  createCleanPlayer,
  createCleanNPC,
  createCleanLoot,
  createCleanGameState,
};

export default CleanSchemas;
