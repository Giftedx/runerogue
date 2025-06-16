/**
 * Compact Colyseus Schemas - Under 64 Field Limit
 *
 * This file contains optimized Colyseus schema classes that stay under the 64-field limit
 * while preserving essential OSRS gameplay functionality.
 *
 * Field counting strategy:
 * - Keep Player class minimal with essential sync fields only
 * - Use string serialization for complex nested data (skills, equipment)
 * - Focus on real-time multiplayer state (position, health, combat)
 */

import { ArraySchema, MapSchema, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

// === TYPE INTERFACES ===

/**
 * Interface for serialized skill data
 */
export interface ISkillData {
  level: number;
  xp: number;
}

/**
 * Interface for serialized skills collection
 */
export interface ISkillsData {
  attack: ISkillData;
  strength: ISkillData;
  defence: ISkillData;
  hitpoints: ISkillData;
  ranged: ISkillData;
  prayer: ISkillData;
  magic: ISkillData;
  cooking: ISkillData;
  woodcutting: ISkillData;
  fletching: ISkillData;
  fishing: ISkillData;
  firemaking: ISkillData;
  crafting: ISkillData;
  smithing: ISkillData;
  mining: ISkillData;
  herblore: ISkillData;
  agility: ISkillData;
  thieving: ISkillData;
  slayer: ISkillData;
  farming: ISkillData;
  runecraft: ISkillData;
  hunter: ISkillData;
  construction: ISkillData;
}

/**
 * Interface for equipment data
 */
export interface IEquipmentData {
  weapon: string;
  armor: string;
  shield: string;
  helmet: string;
  legs: string;
  boots: string;
  gloves: string;
  cape: string;
  amulet: string;
  ring: string;
}

/**
 * Interface for inventory item
 */
export interface IInventoryItemData {
  itemId: string;
  quantity: number;
  name: string;
  value: number;
  stackable: boolean;
}

// === CORE SCHEMA CLASSES ===

/**
 * Compact inventory item schema
 * Fields: 5 (itemId, quantity, name, value, stackable)
 */
export class CompactInventoryItem extends Schema {
  @type('string')
  public itemId: string = '';

  @type('number')
  public quantity: number = 1;

  @type('string')
  public name: string = '';

  @type('number')
  public value: number = 0;

  @type('boolean')
  public stackable: boolean = false;

  constructor(itemId: string = '', quantity: number = 1, name: string = '') {
    super();
    this.itemId = itemId;
    this.quantity = quantity;
    this.name = name;
  }

  /**
   * Convert to interface format
   */
  public toData(): IInventoryItemData {
    return {
      itemId: this.itemId,
      quantity: this.quantity,
      name: this.name,
      value: this.value,
      stackable: this.stackable,
    };
  }

  /**
   * Update from interface data
   */
  public fromData(data: IInventoryItemData): void {
    this.itemId = data.itemId;
    this.quantity = data.quantity;
    this.name = data.name;
    this.value = data.value;
    this.stackable = data.stackable;
  }
}

/**
 * Compact Player schema optimized for real-time multiplayer
 * Fields: 15 (under 64 limit)
 */
export class CompactPlayer extends Schema {
  @type('string')
  public playerId: string = '';

  @type('string')
  public username: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('string')
  public animation: string = 'idle';

  @type('number')
  public health: number = 100;

  @type('number')
  public maxHealth: number = 100;

  @type('number')
  public gold: number = 0;

  @type('boolean')
  public inCombat: boolean = false;

  @type('number')
  public combatTarget: number = -1;

  @type('boolean')
  public isDead: boolean = false;

  @type('string')
  public skillsData: string = '{}'; // JSON serialized skills

  @type('string')
  public equipmentData: string = '{}'; // JSON serialized equipment

  @type([CompactInventoryItem])
  public inventory: ArraySchema<CompactInventoryItem> = new ArraySchema<CompactInventoryItem>();

  @type('number')
  public lastActivity: number = 0;

  constructor(playerId: string = '', username: string = '') {
    super();
    this.playerId = playerId;
    this.username = username;
    this.lastActivity = Date.now();
    this.initializeDefaultData();
  }

  /**
   * Initialize default skills and equipment data
   */
  private initializeDefaultData(): void {
    // Default OSRS skills
    const defaultSkills: ISkillsData = {
      attack: { level: 1, xp: 0 },
      strength: { level: 1, xp: 0 },
      defence: { level: 1, xp: 0 },
      hitpoints: { level: 10, xp: 1154 },
      ranged: { level: 1, xp: 0 },
      prayer: { level: 1, xp: 0 },
      magic: { level: 1, xp: 0 },
      cooking: { level: 1, xp: 0 },
      woodcutting: { level: 1, xp: 0 },
      fletching: { level: 1, xp: 0 },
      fishing: { level: 1, xp: 0 },
      firemaking: { level: 1, xp: 0 },
      crafting: { level: 1, xp: 0 },
      smithing: { level: 1, xp: 0 },
      mining: { level: 1, xp: 0 },
      herblore: { level: 1, xp: 0 },
      agility: { level: 1, xp: 0 },
      thieving: { level: 1, xp: 0 },
      slayer: { level: 1, xp: 0 },
      farming: { level: 1, xp: 0 },
      runecraft: { level: 1, xp: 0 },
      hunter: { level: 1, xp: 0 },
      construction: { level: 1, xp: 0 },
    };

    const defaultEquipment: IEquipmentData = {
      weapon: '',
      armor: '',
      shield: '',
      helmet: '',
      legs: '',
      boots: '',
      gloves: '',
      cape: '',
      amulet: '',
      ring: '',
    };

    this.skillsData = JSON.stringify(defaultSkills);
    this.equipmentData = JSON.stringify(defaultEquipment);
    this.maxHealth = defaultSkills.hitpoints.level;
    this.health = this.maxHealth;
  }

  /**
   * Get parsed skills data
   */
  public getSkills(): ISkillsData {
    try {
      return JSON.parse(this.skillsData) as ISkillsData;
    } catch {
      return {} as ISkillsData;
    }
  }

  /**
   * Update skills data
   */
  public setSkills(skills: ISkillsData): void {
    this.skillsData = JSON.stringify(skills);
    // Update max health based on hitpoints level
    this.maxHealth = skills.hitpoints.level;
  }

  /**
   * Get parsed equipment data
   */
  public getEquipment(): IEquipmentData {
    try {
      return JSON.parse(this.equipmentData) as IEquipmentData;
    } catch {
      return {} as IEquipmentData;
    }
  }

  /**
   * Update equipment data
   */
  public setEquipment(equipment: IEquipmentData): void {
    this.equipmentData = JSON.stringify(equipment);
  }

  /**
   * Calculate combat level using OSRS formula
   */
  public getCombatLevel(): number {
    const skills = this.getSkills();
    if (!skills.attack) return 3; // Minimum combat level

    const attackLevel = skills.attack.level;
    const strengthLevel = skills.strength.level;
    const defenceLevel = skills.defence.level;
    const hitpointsLevel = skills.hitpoints.level;
    const rangedLevel = skills.ranged.level;
    const magicLevel = skills.magic.level;
    const prayerLevel = skills.prayer.level;

    const base = 0.25 * (defenceLevel + hitpointsLevel + Math.floor(prayerLevel / 2));
    const melee = 0.325 * (attackLevel + strengthLevel);
    const range = 0.325 * Math.floor(rangedLevel * 1.5);
    const mage = 0.325 * Math.floor(magicLevel * 1.5);

    return Math.floor(base + Math.max(melee, range, mage));
  }

  /**
   * Update player position
   */
  public updatePosition(x: number, y: number): void {
    this.x = Math.max(0, Math.min(1000, x));
    this.y = Math.max(0, Math.min(1000, y));
    this.lastActivity = Date.now();
  }

  /**
   * Take damage
   */
  public takeDamage(damage: number): boolean {
    if (this.isDead) return false;

    this.health = Math.max(0, this.health - Math.max(0, damage));

    if (this.health <= 0) {
      this.isDead = true;
      return true; // Player died
    }

    return false;
  }

  /**
   * Heal player
   */
  public heal(amount: number): void {
    if (!this.isDead) {
      this.health = Math.min(this.maxHealth, this.health + Math.max(0, amount));
    }
  }

  /**
   * Add item to inventory
   */
  public addToInventory(itemId: string, quantity: number = 1, name: string = ''): boolean {
    // Check for stackable items first
    for (const item of this.inventory) {
      if (item.itemId === itemId && item.stackable) {
        item.quantity += quantity;
        return true;
      }
    }

    // Add new item if space available
    if (this.inventory.length < 28) {
      // OSRS inventory limit
      const newItem = new CompactInventoryItem(itemId, quantity, name);
      this.inventory.push(newItem);
      return true;
    }

    return false; // No space
  }

  /**
   * Remove item from inventory
   */
  public removeFromInventory(itemId: string, quantity: number = 1): boolean {
    for (let i = 0; i < this.inventory.length; i++) {
      const item = this.inventory[i];
      if (item.itemId === itemId) {
        if (item.quantity <= quantity) {
          this.inventory.splice(i, 1);
        } else {
          item.quantity -= quantity;
        }
        return true;
      }
    }
    return false;
  }
}

/**
 * Compact NPC schema
 * Fields: 10
 */
export class CompactNPC extends Schema {
  @type('string')
  public npcId: string = '';

  @type('string')
  public npcName: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('number')
  public health: number = 100;

  @type('number')
  public maxHealth: number = 100;

  @type('number')
  public level: number = 1;

  @type('boolean')
  public inCombat: boolean = false;

  @type('boolean')
  public isDead: boolean = false;

  @type('number')
  public respawnTime: number = 0;

  constructor(npcId: string = '', name: string = '', level: number = 1) {
    super();
    this.npcId = npcId;
    this.npcName = name;
    this.level = level;
    this.maxHealth = level * 10; // Simple scaling
    this.health = this.maxHealth;
  }
}

/**
 * Compact loot item schema
 * Fields: 8
 */
export class CompactLootItem extends Schema {
  @type('string')
  public lootId: string = '';

  @type('string')
  public itemId: string = '';

  @type('number')
  public quantity: number = 1;

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type('string')
  public droppedBy: string = '';

  @type('number')
  public spawnTime: number = 0;

  @type('boolean')
  public isPublic: boolean = false;

  constructor(lootId: string = '', itemId: string = '', quantity: number = 1) {
    super();
    this.lootId = lootId;
    this.itemId = itemId;
    this.quantity = quantity;
    this.spawnTime = Date.now();
  }

  /**
   * Check if loot can be picked up by player
   */
  public canPickup(playerId: string): boolean {
    if (this.isPublic) return true;
    if (this.droppedBy === playerId) return true;

    // Loot becomes public after 1 minute
    const timeSinceSpawn = Date.now() - this.spawnTime;
    return timeSinceSpawn > 60000;
  }
}

/**
 * Compact game state schema
 * Fields: 5 + ArraySchema fields
 */
export class CompactGameState extends Schema {
  @type({ map: CompactPlayer })
  public players: MapSchema<CompactPlayer> = new MapSchema<CompactPlayer>();

  @type({ map: CompactNPC })
  public npcs: MapSchema<CompactNPC> = new MapSchema<CompactNPC>();

  @type({ map: CompactLootItem })
  public loot: MapSchema<CompactLootItem> = new MapSchema<CompactLootItem>();

  @type('number')
  public gameTime: number = 0;

  @type('string')
  public status: string = 'active';

  constructor() {
    super();
    this.gameTime = Date.now();
  }

  /**
   * Add player to game
   */
  public addPlayer(playerId: string, username: string): CompactPlayer {
    const player = new CompactPlayer(playerId, username);
    // Set spawn position
    player.x = 100 + Math.random() * 50;
    player.y = 100 + Math.random() * 50;
    this.players.set(playerId, player);
    return player;
  }

  /**
   * Remove player from game
   */
  public removePlayer(playerId: string): void {
    this.players.delete(playerId);
  }

  /**
   * Add NPC to game
   */
  public addNPC(npcId: string, name: string, level: number, x: number, y: number): CompactNPC {
    const npc = new CompactNPC(npcId, name, level);
    npc.x = x;
    npc.y = y;
    this.npcs.set(npcId, npc);
    return npc;
  }

  /**
   * Remove NPC from game
   */
  public removeNPC(npcId: string): void {
    this.npcs.delete(npcId);
  }

  /**
   * Add loot to game
   */
  public addLoot(
    lootId: string,
    itemId: string,
    quantity: number,
    x: number,
    y: number,
    droppedBy: string = ''
  ): CompactLootItem {
    const loot = new CompactLootItem(lootId, itemId, quantity);
    loot.x = x;
    loot.y = y;
    loot.droppedBy = droppedBy;
    this.loot.set(lootId, loot);
    return loot;
  }

  /**
   * Remove loot from game
   */
  public removeLoot(lootId: string): CompactLootItem | undefined {
    const loot = this.loot.get(lootId);
    if (loot) {
      this.loot.delete(lootId);
    }
    return loot;
  }

  /**
   * Update game time
   */
  public updateGameTime(): void {
    this.gameTime = Date.now();
  }

  /**
   * Get all players as array
   */
  public getAllPlayers(): CompactPlayer[] {
    return Array.from(this.players.values());
  }

  /**
   * Get all NPCs as array
   */
  public getAllNPCs(): CompactNPC[] {
    return Array.from(this.npcs.values());
  }

  /**
   * Get all loot as array
   */
  public getAllLoot(): CompactLootItem[] {
    return Array.from(this.loot.values());
  }
}

// === FACTORY FUNCTIONS ===

/**
 * Create a new compact player
 */
export function createCompactPlayer(playerId: string, username: string): CompactPlayer {
  return new CompactPlayer(playerId, username);
}

/**
 * Create a new compact NPC
 */
export function createCompactNPC(npcId: string, name: string, level: number): CompactNPC {
  return new CompactNPC(npcId, name, level);
}

/**
 * Create a new compact inventory item
 */
export function createCompactInventoryItem(
  itemId: string,
  quantity: number = 1,
  name: string = ''
): CompactInventoryItem {
  return new CompactInventoryItem(itemId, quantity, name);
}

/**
 * Create a new compact game state
 */
export function createCompactGameState(): CompactGameState {
  return new CompactGameState();
}
