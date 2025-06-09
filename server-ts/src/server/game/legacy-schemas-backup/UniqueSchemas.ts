/**
 * Unique Property Compact Schemas - Under 64 Field Limit
 *
 * This file contains optimized Colyseus schema classes that stay under the 64-field limit
 * with globally unique property names to avoid Colyseus registration conflicts.
 *
 * Property naming strategy:
 * - All @type property names must be globally unique across all schema classes
 * - Prefix properties with abbreviated class names (p_ for player, n_ for npc, l_ for loot, i_ for item)
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
  construction: ISkillData;
  hunter: ISkillData;
}

/**
 * Interface for serialized equipment data
 */
export interface IEquipmentData {
  helmet: string;
  cape: string;
  amulet: string;
  weapon: string;
  body: string;
  shield: string;
  legs: string;
  gloves: string;
  boots: string;
  ring: string;
  ammo: string;
}

/**
 * Interface for inventory item data
 */
export interface IInventoryItemData {
  itemId: string;
  quantity: number;
  name: string;
  value: number;
  stackable: boolean;
  attackBonus?: number;
  strengthBonus?: number;
  defenceBonus?: number;
  rangedBonus?: number;
  prayerBonus?: number;
  magicBonus?: number;
}

// === CORE SCHEMA CLASSES ===

/**
 * Unique property inventory item schema
 * Fields: 5 (i_itemId, i_quantity, i_name, i_value, i_stackable)
 */
export class UniqueInventoryItem extends Schema {
  @type('string')
  public i_itemId: string = '';

  @type('number')
  public i_quantity: number = 1;

  @type('string')
  public i_name: string = '';

  @type('number')
  public i_value: number = 0;

  @type('boolean')
  public i_stackable: boolean = false;

  constructor(itemId: string = '', quantity: number = 1, name: string = '') {
    super();
    this.i_itemId = itemId;
    this.i_quantity = quantity;
    this.i_name = name;
  }

  /**
   * Convert to interface format
   */
  public toData(): IInventoryItemData {
    return {
      itemId: this.i_itemId,
      quantity: this.i_quantity,
      name: this.i_name,
      value: this.i_value,
      stackable: this.i_stackable,
    };
  }

  /**
   * Update from interface data
   */
  public fromData(data: IInventoryItemData): void {
    this.i_itemId = data.itemId;
    this.i_quantity = data.quantity;
    this.i_name = data.name;
    this.i_value = data.value;
    this.i_stackable = data.stackable;
  }
}

/**
 * Unique property Player schema optimized for real-time multiplayer
 * Fields: 15 (under 64 limit)
 */
export class UniquePlayer extends Schema {
  @type('string')
  public p_playerId: string = '';

  @type('string')
  public p_username: string = '';

  @type('number')
  public p_x: number = 0;

  @type('number')
  public p_y: number = 0;

  @type('string')
  public p_animation: string = 'idle';

  @type('number')
  public p_health: number = 100;

  @type('number')
  public p_maxHealth: number = 100;

  @type('number')
  public p_gold: number = 0;

  @type('boolean')
  public p_inCombat: boolean = false;

  @type('number')
  public p_combatTarget: number = -1;

  @type('boolean')
  public p_isDead: boolean = false;

  @type('string')
  public p_skillsData: string = '{}'; // JSON serialized skills

  @type('string')
  public p_equipmentData: string = '{}'; // JSON serialized equipment

  @type([UniqueInventoryItem])
  public p_inventory: ArraySchema<UniqueInventoryItem> = new ArraySchema<UniqueInventoryItem>();

  @type('number')
  public p_lastActivity: number = 0;

  constructor(playerId: string = '', username: string = '') {
    super();
    this.p_playerId = playerId;
    this.p_username = username;
    this.p_lastActivity = Date.now();
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
      construction: { level: 1, xp: 0 },
      hunter: { level: 1, xp: 0 },
    };

    // Default empty equipment
    const defaultEquipment: IEquipmentData = {
      helmet: '',
      cape: '',
      amulet: '',
      weapon: '',
      body: '',
      shield: '',
      legs: '',
      gloves: '',
      boots: '',
      ring: '',
      ammo: '',
    };

    this.p_skillsData = JSON.stringify(defaultSkills);
    this.p_equipmentData = JSON.stringify(defaultEquipment);
    this.p_maxHealth = this.getHitpoints().level * 10;
    this.p_health = this.p_maxHealth;
  }

  /**
   * Get parsed skills data
   */
  public getSkills(): ISkillsData {
    try {
      return JSON.parse(this.p_skillsData);
    } catch {
      // Return default skills if parsing fails
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
        construction: { level: 1, xp: 0 },
        hunter: { level: 1, xp: 0 },
      };
      this.p_skillsData = JSON.stringify(defaultSkills);
      return defaultSkills;
    }
  }

  /**
   * Update skills data
   */
  public setSkills(skills: ISkillsData): void {
    this.p_skillsData = JSON.stringify(skills);
    this.p_maxHealth = skills.hitpoints.level * 10;
    if (this.p_health > this.p_maxHealth) {
      this.p_health = this.p_maxHealth;
    }
  }

  /**
   * Get specific skill data
   */
  public getSkill(skillName: keyof ISkillsData): ISkillData {
    const skills = this.getSkills();
    return skills[skillName] || { level: 1, xp: 0 };
  }

  /**
   * Get hitpoints skill specifically
   */
  public getHitpoints(): ISkillData {
    return this.getSkill('hitpoints');
  }

  /**
   * Get parsed equipment data
   */
  public getEquipment(): IEquipmentData {
    try {
      return JSON.parse(this.p_equipmentData);
    } catch {
      // Return default equipment if parsing fails
      const defaultEquipment: IEquipmentData = {
        helmet: '',
        cape: '',
        amulet: '',
        weapon: '',
        body: '',
        shield: '',
        legs: '',
        gloves: '',
        boots: '',
        ring: '',
        ammo: '',
      };
      this.p_equipmentData = JSON.stringify(defaultEquipment);
      return defaultEquipment;
    }
  }

  /**
   * Update equipment data
   */
  public setEquipment(equipment: IEquipmentData): void {
    this.p_equipmentData = JSON.stringify(equipment);
  }

  /**
   * Calculate combat level using OSRS formula
   */
  public getCombatLevel(): number {
    const skills = this.getSkills();
    const defence = skills.defence?.level || 1;
    const hitpoints = skills.hitpoints?.level || 10;
    const prayer = skills.prayer?.level || 1;

    const attack = skills.attack?.level || 1;
    const strength = skills.strength?.level || 1;
    const magic = skills.magic?.level || 1;
    const ranged = skills.ranged?.level || 1;

    // OSRS combat level formula
    const base = 0.25 * (defence + hitpoints + Math.floor(prayer / 2));
    const melee = 0.325 * (attack + strength);
    const range = 0.325 * Math.floor(ranged * 1.5);
    const mage = 0.325 * Math.floor(magic * 1.5);

    return Math.floor(base + Math.max(melee, range, mage));
  }

  /**
   * Add item to inventory
   */
  public addToInventory(item: UniqueInventoryItem): boolean {
    if (this.p_inventory.length >= 28) {
      return false; // OSRS inventory limit
    }

    // Check if item can stack with existing item
    if (item.i_stackable) {
      for (let i = 0; i < this.p_inventory.length; i++) {
        const existing = this.p_inventory[i];
        if (existing.i_itemId === item.i_itemId) {
          existing.i_quantity += item.i_quantity;
          return true;
        }
      }
    }

    this.p_inventory.push(item);
    return true;
  }

  /**
   * Remove item from inventory
   */
  public removeFromInventory(itemId: string, quantity: number = 1): boolean {
    for (let i = 0; i < this.p_inventory.length; i++) {
      const item = this.p_inventory[i];
      if (item.i_itemId === itemId) {
        if (item.i_quantity > quantity) {
          item.i_quantity -= quantity;
          return true;
        } else if (item.i_quantity === quantity) {
          // Use splice instead of deleteAt for ArraySchema
          this.p_inventory.splice(i, 1);
          return true;
        }
        break;
      }
    }
    return false;
  }

  /**
   * Update player position
   */
  public setPosition(x: number, y: number): void {
    this.p_x = x;
    this.p_y = y;
    this.p_lastActivity = Date.now();
  }

  /**
   * Take damage
   */
  public takeDamage(damage: number): void {
    this.p_health = Math.max(0, this.p_health - damage);
    if (this.p_health <= 0) {
      this.p_isDead = true;
      this.p_inCombat = false;
      this.p_combatTarget = -1;
    }
  }

  /**
   * Heal player
   */
  public heal(amount: number): void {
    this.p_health = Math.min(this.p_maxHealth, this.p_health + amount);
    if (this.p_health > 0) {
      this.p_isDead = false;
    }
  }
}

/**
 * Unique property NPC schema
 * Fields: 10
 */
export class UniqueNPC extends Schema {
  @type('string')
  public n_npcId: string = '';

  @type('string')
  public n_npcName: string = '';

  @type('number')
  public n_x: number = 0;

  @type('number')
  public n_y: number = 0;

  @type('number')
  public n_health: number = 100;

  @type('number')
  public n_maxHealth: number = 100;

  @type('number')
  public n_level: number = 1;

  @type('boolean')
  public n_inCombat: boolean = false;

  @type('boolean')
  public n_isDead: boolean = false;

  @type('number')
  public n_respawnTime: number = 0;

  constructor(npcId: string = '', name: string = '', level: number = 1) {
    super();
    this.n_npcId = npcId;
    this.n_npcName = name;
    this.n_level = level;
    this.n_maxHealth = level * 10; // Simple scaling
    this.n_health = this.n_maxHealth;
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): void {
    this.n_x = x;
    this.n_y = y;
  }

  /**
   * Take damage
   */
  public takeDamage(damage: number): void {
    this.n_health = Math.max(0, this.n_health - damage);
    if (this.n_health <= 0) {
      this.n_isDead = true;
      this.n_inCombat = false;
      this.n_respawnTime = Date.now() + 30000; // 30 second respawn
    }
  }

  /**
   * Check if should respawn
   */
  public shouldRespawn(): boolean {
    return this.n_isDead && Date.now() >= this.n_respawnTime;
  }

  /**
   * Respawn NPC
   */
  public respawn(): void {
    this.n_health = this.n_maxHealth;
    this.n_isDead = false;
    this.n_inCombat = false;
    this.n_respawnTime = 0;
  }
}

/**
 * Unique property loot item schema
 * Fields: 8
 */
export class UniqueLootItem extends Schema {
  @type('string')
  public l_lootId: string = '';

  @type('string')
  public l_itemId: string = '';

  @type('number')
  public l_quantity: number = 1;

  @type('number')
  public l_x: number = 0;

  @type('number')
  public l_y: number = 0;

  @type('string')
  public l_droppedBy: string = '';

  @type('number')
  public l_spawnTime: number = 0;

  @type('boolean')
  public l_isPublic: boolean = false;

  constructor(lootId: string = '', itemId: string = '', quantity: number = 1) {
    super();
    this.l_lootId = lootId;
    this.l_itemId = itemId;
    this.l_quantity = quantity;
    this.l_spawnTime = Date.now();
  }

  /**
   * Set position
   */
  public setPosition(x: number, y: number): void {
    this.l_x = x;
    this.l_y = y;
  }

  /**
   * Check if loot can be picked up by player
   */
  public canPickup(playerId: string): boolean {
    // If no specific owner or public, anyone can pick up
    if (!this.l_droppedBy || this.l_isPublic) {
      return true;
    }

    // Owner can always pick up
    if (this.l_droppedBy === playerId) {
      return true;
    }

    // After 1 minute, becomes public
    const publicTime = this.l_spawnTime + 60000; // 1 minute
    return Date.now() >= publicTime;
  }

  /**
   * Make loot public
   */
  public makePublic(): void {
    this.l_isPublic = true;
  }
}

/**
 * Unique property Game State schema (main multiplayer state)
 * Fields: 5 (players, npcs, loot, lastUpdate, status)
 */
export class UniqueGameState extends Schema {
  @type({ map: UniquePlayer })
  public gs_players: MapSchema<UniquePlayer> = new MapSchema<UniquePlayer>();

  @type({ map: UniqueNPC })
  public gs_npcs: MapSchema<UniqueNPC> = new MapSchema<UniqueNPC>();

  @type({ map: UniqueLootItem })
  public gs_loot: MapSchema<UniqueLootItem> = new MapSchema<UniqueLootItem>();

  @type('number')
  public gs_lastUpdate: number = 0;

  @type('string')
  public gs_status: string = 'active';

  constructor() {
    super();
    this.gs_lastUpdate = Date.now();
  }

  /**
   * Add player to game state
   */
  public addPlayer(player: UniquePlayer): void {
    this.gs_players.set(player.p_playerId, player);
    this.gs_lastUpdate = Date.now();
  }

  /**
   * Remove player from game state
   */
  public removePlayer(playerId: string): boolean {
    const removed = this.gs_players.delete(playerId);
    if (removed) {
      this.gs_lastUpdate = Date.now();
    }
    return removed;
  }

  /**
   * Get player by ID
   */
  public getPlayer(playerId: string): UniquePlayer | undefined {
    return this.gs_players.get(playerId);
  }

  /**
   * Add NPC to game state
   */
  public addNPC(npc: UniqueNPC): void {
    this.gs_npcs.set(npc.n_npcId, npc);
    this.gs_lastUpdate = Date.now();
  }

  /**
   * Remove NPC from game state
   */
  public removeNPC(npcId: string): boolean {
    const removed = this.gs_npcs.delete(npcId);
    if (removed) {
      this.gs_lastUpdate = Date.now();
    }
    return removed;
  }

  /**
   * Get NPC by ID
   */
  public getNPC(npcId: string): UniqueNPC | undefined {
    return this.gs_npcs.get(npcId);
  }

  /**
   * Add loot to game state
   */
  public addLoot(loot: UniqueLootItem): void {
    this.gs_loot.set(loot.l_lootId, loot);
    this.gs_lastUpdate = Date.now();
  }

  /**
   * Remove loot from game state
   */
  public removeLoot(lootId: string): UniqueLootItem | undefined {
    const loot = this.gs_loot.get(lootId);
    if (loot) {
      this.gs_loot.delete(lootId);
      this.gs_lastUpdate = Date.now();
    }
    return loot;
  }

  /**
   * Get loot by ID
   */
  public getLoot(lootId: string): UniqueLootItem | undefined {
    return this.gs_loot.get(lootId);
  }

  /**
   * Update game state timestamp
   */
  public touch(): void {
    this.gs_lastUpdate = Date.now();
  }

  /**
   * Get current player count
   */
  public getPlayerCount(): number {
    return this.gs_players.size;
  }

  /**
   * Get current NPC count
   */
  public getNPCCount(): number {
    return this.gs_npcs.size;
  }

  /**
   * Get current loot count
   */
  public getLootCount(): number {
    return this.gs_loot.size;
  }

  /**
   * Clean up expired loot (older than 2 minutes)
   */
  public cleanupExpiredLoot(): void {
    const expireTime = Date.now() - 120000; // 2 minutes
    const toRemove: string[] = [];

    this.gs_loot.forEach((loot, lootId) => {
      if (loot.l_spawnTime < expireTime) {
        toRemove.push(lootId);
      }
    });

    for (const lootId of toRemove) {
      this.gs_loot.delete(lootId);
    }

    if (toRemove.length > 0) {
      this.gs_lastUpdate = Date.now();
    }
  }

  /**
   * Respawn dead NPCs
   */
  public respawnDeadNPCs(): void {
    let respawned = false;
    this.gs_npcs.forEach(npc => {
      if (npc.shouldRespawn()) {
        npc.respawn();
        respawned = true;
      }
    });

    if (respawned) {
      this.gs_lastUpdate = Date.now();
    }
  }
}

// === EXPORT COLLECTION ===

/**
 * Export all schema classes and types
 */
export const UniqueSchemas = {
  // Core schemas
  UniquePlayer,
  UniqueNPC,
  UniqueLootItem,
  UniqueInventoryItem,
  UniqueGameState,

  // Factory functions
  createPlayer: (playerId: string, username: string): UniquePlayer => {
    return new UniquePlayer(playerId, username);
  },

  createNPC: (npcId: string, name: string, level: number): UniqueNPC => {
    return new UniqueNPC(npcId, name, level);
  },

  createLoot: (lootId: string, itemId: string, quantity: number): UniqueLootItem => {
    return new UniqueLootItem(lootId, itemId, quantity);
  },

  createInventoryItem: (itemId: string, quantity: number, name: string): UniqueInventoryItem => {
    return new UniqueInventoryItem(itemId, quantity, name);
  },

  createGameState: (): UniqueGameState => {
    return new UniqueGameState();
  },
} as const;

export default UniqueSchemas;
