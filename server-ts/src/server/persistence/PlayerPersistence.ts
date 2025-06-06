/**
 * Player Persistence System
 * Handles saving and loading player data between sessions
 */

import { Player, InventoryItem } from '../game/EntitySchemas';
import { skillSystem, SkillType } from '../game/SkillSystem';
import * as fs from 'fs';
import * as path from 'path';

export interface PlayerSaveData {
  id: string;
  username: string;
  lastSeen: number;
  position: { x: number; y: number };
  health: number;
  maxHealth: number;
  gold: number;
  combatLevel: number;
  skills: Record<string, { level: number; experience: number; boost: number }>;
  inventory: Array<{
    itemId: string;
    quantity: number;
    name: string;
    description: string;
    attack: number;
    defense: number;
    isStackable: boolean;
  }>;
  equipment: {
    weapon: string;
    armor: string;
    shield: string;
  };
  prayerPoints: number;
  specialEnergy: number;
  totalPlayTime: number;
}

export class PlayerPersistence {
  private static instance: PlayerPersistence;
  private saveDirectory: string;
  private saveInterval: number = 60000; // Auto-save every minute
  private activePlayers: Map<string, NodeJS.Timer> = new Map();

  private constructor() {
    // Use MongoDB in production, JSON files for development
    this.saveDirectory = path.join(process.cwd(), 'player-saves');
    this.ensureSaveDirectory();
  }

  public static getInstance(): PlayerPersistence {
    if (!PlayerPersistence.instance) {
      PlayerPersistence.instance = new PlayerPersistence();
    }
    return PlayerPersistence.instance;
  }

  /**
   * Ensure save directory exists
   */
  private async ensureSaveDirectory(): Promise<void> {
    try {
      await fs.promises.mkdir(this.saveDirectory, { recursive: true });
    } catch (error) {
      console.error('Failed to create save directory:', error);
    }
  }

  /**
   * Save player data
   */
  public async savePlayer(player: Player): Promise<boolean> {
    try {
      const saveData: PlayerSaveData = {
        id: player.id,
        username: player.username,
        lastSeen: Date.now(),
        position: { x: player.x, y: player.y },
        health: player.health,
        maxHealth: player.maxHealth,
        gold: player.gold,
        combatLevel: player.combatLevel,
        skills: this.serializeSkills(player),
        inventory: this.serializeInventory(player),
        equipment: {
          weapon: player.equipment.weapon,
          armor: player.equipment.armor,
          shield: player.equipment.shield
        },
        prayerPoints: player.prayerPoints,
        specialEnergy: player.specialEnergy,
        totalPlayTime: Date.now() - player.lastActivity
      };

      // Save to file (in production, save to MongoDB)
      const savePath = path.join(this.saveDirectory, `${player.username.toLowerCase()}.json`);
      await fs.promises.writeFile(savePath, JSON.stringify(saveData, null, 2));
      
      console.log(`Saved player data for ${player.username}`);
      return true;
    } catch (error) {
      console.error(`Failed to save player ${player.username}:`, error);
      return false;
    }
  }

  /**
   * Load player data
   */
  public async loadPlayer(username: string): Promise<PlayerSaveData | null> {
    try {
      const savePath = path.join(this.saveDirectory, `${username.toLowerCase()}.json`);
      const data = await fs.promises.readFile(savePath, 'utf-8');
      const saveData = JSON.parse(data) as PlayerSaveData;
      
      console.log(`Loaded player data for ${username}`);
      return saveData;
    } catch (error) {
      // Player save doesn't exist or is corrupted
      console.log(`No save data found for ${username}`);
      return null;
    }
  }

  /**
   * Apply loaded data to player instance
   */
  public async applyLoadedData(player: Player, saveData: PlayerSaveData): Promise<void> {
    player.x = saveData.position.x;
    player.y = saveData.position.y;
    player.health = saveData.health;
    player.maxHealth = saveData.maxHealth;
    player.gold = saveData.gold || 0; // Default to 0 for old saves
    player.combatLevel = saveData.combatLevel;
    player.prayerPoints = saveData.prayerPoints;
    player.specialEnergy = saveData.specialEnergy;

    // Restore equipment
    player.equipment.weapon = saveData.equipment.weapon || '';
    player.equipment.armor = saveData.equipment.armor || '';
    player.equipment.shield = saveData.equipment.shield || '';

    // Restore inventory
    player.inventory.clear();
    for (const item of saveData.inventory) {
      const invItem = new InventoryItem();
      invItem.itemId = item.itemId;
      invItem.quantity = item.quantity;
      invItem.name = item.name;
      invItem.description = item.description;
      invItem.attack = item.attack;
      invItem.defense = item.defense;
      invItem.isStackable = item.isStackable;
      player.inventory.push(invItem);
    }

    // Restore skills using new system
    this.restoreSkills(player, saveData.skills);
  }

  /**
   * Serialize skills for saving
   */
  private serializeSkills(player: Player): Record<string, any> {
    const skills: Record<string, any> = {};

    // Save old skill system data
    if (player.skills) {
      skills.attack = { 
        level: player.skills.attack?.level || 1, 
        experience: player.skills.attack?.xp || 0,
        boost: 0 
      };
      skills.strength = { 
        level: player.skills.strength?.level || 1, 
        experience: player.skills.strength?.xp || 0,
        boost: 0 
      };
      skills.defence = { 
        level: player.skills.defence?.level || 1, 
        experience: player.skills.defence?.xp || 0,
        boost: 0 
      };
      skills.mining = { 
        level: player.skills.mining?.level || 1, 
        experience: player.skills.mining?.xp || 0,
        boost: 0 
      };
      skills.woodcutting = { 
        level: player.skills.woodcutting?.level || 1, 
        experience: player.skills.woodcutting?.xp || 0,
        boost: 0 
      };
      skills.fishing = { 
        level: player.skills.fishing?.level || 1, 
        experience: player.skills.fishing?.xp || 0,
        boost: 0 
      };
      skills.prayer = { 
        level: player.skills.prayer?.level || 1, 
        experience: player.skills.prayer?.xp || 0,
        boost: 0 
      };
    }

    return skills;
  }

  /**
   * Serialize inventory for saving
   */
  private serializeInventory(player: Player): Array<any> {
    const inventory: Array<any> = [];
    
    player.inventory.forEach(item => {
      inventory.push({
        itemId: item.itemId,
        quantity: item.quantity,
        name: item.name,
        description: item.description,
        attack: item.attack,
        defense: item.defense,
        isStackable: item.isStackable
      });
    });

    return inventory;
  }

  /**
   * Restore skills from save data
   */
  private restoreSkills(player: Player, skillData: Record<string, any>): void {
    // Map old skill data to new skill system
    Object.entries(skillData).forEach(([skillName, data]) => {
      const skillType = skillName as SkillType;
      
      // Update the old skill system for compatibility
      if (player.skills && player.skills[skillName]) {
        player.skills[skillName].level = data.level || 1;
        player.skills[skillName].xp = data.experience || 0;
      }
    });

    // Update combat level based on loaded skills
    const attack = player.skills.attack?.level || 1;
    const strength = player.skills.strength?.level || 1;
    const defence = player.skills.defence?.level || 1;
    const base = 0.25 * (defence + strength + Math.floor(attack * 1.3));
    player.combatLevel = Math.floor(base);
  }

  /**
   * Start auto-save for a player
   */
  public startAutoSave(player: Player): void {
    // Clear any existing auto-save
    this.stopAutoSave(player.id);

    // Set up periodic auto-save
    const interval = setInterval(() => {
      this.savePlayer(player);
    }, this.saveInterval);

    this.activePlayers.set(player.id, interval);
  }

  /**
   * Stop auto-save for a player
   */
  public stopAutoSave(playerId: string): void {
    const interval = this.activePlayers.get(playerId);
    if (interval) {
      clearInterval(interval);
      this.activePlayers.delete(playerId);
    }
  }

  /**
   * Get player stats for leaderboard
   */
  public async getAllPlayerStats(): Promise<Array<{
    username: string;
    combatLevel: number;
    totalLevel: number;
    totalXP: number;
  }>> {
    try {
      const files = await fs.promises.readdir(this.saveDirectory);
      const stats: Array<{
        username: string;
        combatLevel: number;
        totalLevel: number;
        totalXP: number;
      }> = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = await fs.promises.readFile(path.join(this.saveDirectory, file), 'utf-8');
            const saveData = JSON.parse(data) as PlayerSaveData;
            
            let totalLevel = 0;
            let totalXP = 0;
            
            Object.values(saveData.skills).forEach(skill => {
              totalLevel += skill.level;
              totalXP += skill.experience;
            });

            stats.push({
              username: saveData.username,
              combatLevel: saveData.combatLevel,
              totalLevel,
              totalXP
            });
          } catch (error) {
            // Skip corrupted files
            continue;
          }
        }
      }

      // Sort by total XP descending
      return stats.sort((a, b) => b.totalXP - a.totalXP);
    } catch (error) {
      console.error('Failed to get player stats:', error);
      return [];
    }
  }
}

// Export singleton instance
export const playerPersistence = PlayerPersistence.getInstance();