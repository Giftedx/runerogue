// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import { MapSchema, ArraySchema } from '@colyseus/schema';
import {
  GameState,
  Player,
  InventoryItem,
  Equipment,
  Skills,
  NPC,
  LootDrop,
} from './EntitySchemas';
import { ItemManager } from './ItemManager';
import { LootManager, LootTableEntry } from './LootManager';
import { PrayerSystem, ProtectionType } from './PrayerSystem';
import { v4 as uuidv4 } from 'uuid';
import { economyClient } from '../../services/economy-client'; // Import economy client
import { notifyEvent } from '../discord-bot'; // Import notifyEvent from discord-bot

// Combat Types
export enum CombatStyle {
  ACCURATE = 'accurate',
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  CONTROLLED = 'controlled',
}

export enum AttackType {
  SLASH = 'slash',
  STAB = 'stab',
  CRUSH = 'crush',
  MAGIC = 'magic',
  RANGED = 'ranged',
}

export interface AttackResult {
  hit: boolean;
  damage: number;
  criticalHit: boolean;
  effects: CombatEffect[];
}

export interface CombatEffect {
  type: 'bleed' | 'stun' | 'poison' | 'heal' | 'buff' | 'debuff';
  value: number;
  duration: number;
  description: string;
}

export interface CombatPrayerBonus {
  attackBonus: number;
  strengthBonus: number;
  defenseBonus: number;
  damageReduction: number;
}

// Weapon stats
export interface WeaponStats {
  attackSpeed: number;
  attackBonus: {
    [key in AttackType]: number;
  };
  strengthBonus: number;
  attackType: AttackType;
  specialAttack?: SpecialAttack;
}

export interface SpecialAttack {
  name: string;
  energyCost: number;
  execute: (attacker: Player, defender: Player, baseDamage: number) => AttackResult;
  description: string;
}

// ItemDatabase - would be expanded with actual item stats
const weaponDatabase: Record<string, WeaponStats> = {
  bronze_sword: {
    attackSpeed: 4,
    attackBonus: {
      [AttackType.SLASH]: 7,
      [AttackType.STAB]: 4,
      [AttackType.CRUSH]: 0,
      [AttackType.MAGIC]: 0,
      [AttackType.RANGED]: 0,
    },
    strengthBonus: 6,
    attackType: AttackType.SLASH,
  },
  iron_sword: {
    attackSpeed: 4,
    attackBonus: {
      [AttackType.SLASH]: 10,
      [AttackType.STAB]: 6,
      [AttackType.CRUSH]: 0,
      [AttackType.MAGIC]: 0,
      [AttackType.RANGED]: 0,
    },
    strengthBonus: 15,
    attackType: AttackType.SLASH,
  },
  // Example special attack weapon
  dragon_dagger: {
    attackSpeed: 3,
    attackBonus: {
      [AttackType.SLASH]: 15,
      [AttackType.STAB]: 20,
      [AttackType.CRUSH]: 0,
      [AttackType.MAGIC]: 0,
      [AttackType.RANGED]: 0,
    },
    strengthBonus: 18,
    attackType: AttackType.STAB,
    specialAttack: {
      name: 'Dragon Dagger Special',
      energyCost: 25,
      description: 'Double hit with increased accuracy',
      execute: (attacker, defender, baseDamage) => {
        // Apply damage to defender
        const damage = Math.floor(baseDamage * 1.2); // 20% damage bonus for special
        defender.health = Math.max(0, defender.health - damage);
        
        return {
          hit: true,
          damage: damage,
          criticalHit: false,
          effects: [],
        };
      },
    },
  },
};

const armorDatabase: Record<string, { defenseBonus: { [key in AttackType]: number } }> = {
  bronze_plate: {
    defenseBonus: {
      [AttackType.SLASH]: 12,
      [AttackType.STAB]: 10,
      [AttackType.CRUSH]: 14,
      [AttackType.MAGIC]: -6,
      [AttackType.RANGED]: 8,
    },
  },
  // Add more armor as needed
};

/**
 * CombatSystem handles all combat-related calculations
 */
export class CombatSystem {
  private state: GameState;
  private itemManager: ItemManager;

  constructor(state: GameState) {
    this.state = state;
    this.itemManager = ItemManager.getInstance();
  }

  process(delta: number) {
    // Process NPC actions
    this.state.npcs.forEach(npc => {
      const actionResult = CombatSystem.determineNpcAction(npc, this.state.players, Date.now());

      if (actionResult.target && actionResult.action === 'attack') {
        // Check attack speed
        if (Date.now() - npc.lastAttackTime >= npc.attackSpeed) {
          console.log(`NPC ${npc.name} attacks Player ${actionResult.target.username}`);
          CombatSystem.performAttack(npc, actionResult.target, 'melee'); // Assuming 'melee' for now
          if (actionResult.target.health <= 0) {
            CombatSystem.dropLoot(actionResult.target);
          }
          npc.lastAttackTime = Date.now();
        }
      } else if (actionResult.action === 'move' && actionResult.target) {
        // Basic movement towards target
        const speed = 1; // pixels per tick
        if (npc.x < actionResult.target.x) npc.x = Math.min(npc.x + speed, actionResult.target.x);
        else if (npc.x > actionResult.target.x)
          npc.x = Math.max(npc.x - speed, actionResult.target.x);
        if (npc.y < actionResult.target.y) npc.y = Math.min(npc.y + speed, actionResult.target.y);
        else if (npc.y > actionResult.target.y)
          npc.y = Math.max(npc.y - speed, actionResult.target.y);
      }

      // If NPC is defeated, remove it and drop loot
      if (npc.health <= 0) {
        console.log(`NPC ${npc.name} defeated!`);
        // Convert npc.lootTable (string[]) to LootTableEntry[] with default probability
        const lootTable: LootTableEntry[] = (npc.lootTable || []).map(itemId => ({
          itemId,
          probability: 1,
        }));
        this.lootManager.dropLootFromNPC(this.state, npc, lootTable);
        this.state.npcs.delete(npc.id);
      }
    });

    // Apply combat effects (e.g., poison, bleed)
    this.state.players.forEach(player => {
      this.applyEffects(player, player.activeEffects);
    });
    this.state.npcs.forEach(npc => {
      this.applyEffects(npc, npc.activeEffects);
    });
  }
  /**
   * Performs an attack between two players using OSRS-accurate combat calculations
   */
  static performAttack(
    attacker: Player | NPC,
    defender: Player | NPC,
    combatStyle?: CombatStyle,
    useSpecial?: boolean
  ): AttackResult {
    try {
      const weaponType = attacker.equipment.weapon || 'unarmed';
      const weaponStats = weaponDatabase[weaponType] || {
        attackType: AttackType.CRUSH,
        strengthBonus: 0,
        attackBonus: {
          [AttackType.SLASH]: 0,
          [AttackType.STAB]: 0,
          [AttackType.CRUSH]: 0,
          [AttackType.MAGIC]: 0,
          [AttackType.RANGED]: 0,
        },
        attackSpeed: 4,
      };

      // Handle special attacks
      if (useSpecial && attacker.specialEnergy >= 25 && weaponStats.specialAttack) {
        attacker.specialEnergy -= weaponStats.specialAttack.energyCost;
        const maxHit = this.calculateMaxHit(attacker, combatStyle || CombatStyle.ACCURATE);
        return weaponStats.specialAttack.execute(attacker as Player, defender as Player, maxHit);
      }

      // OSRS Combat Calculation - Calculate hit chance using attack/defense rolls
      const attackType = weaponStats.attackType;
      const hitChance = this.calculateHitChance(attacker, defender, attackType, combatStyle);
      const didHit = Math.random() < hitChance;

      let damage = 0;
      if (didHit) {
        const maxHit = this.calculateMaxHit(attacker, combatStyle || CombatStyle.ACCURATE);
        // Random damage between 0 and maxHit (OSRS damage roll)
        damage = Math.floor(Math.random() * (maxHit + 1));
        defender.health = Math.max(0, defender.health - damage);
      }

      return {
        hit: didHit,
        damage,
        criticalHit: false,
        effects: [],
      };
    } catch (error) {
      console.error('CombatSystem performAttack error:', error);
      throw error;
    }
  }

  // Updated calculateDamage: unified single function for both signatures
  static calculateDamage(attacker: any, arg: any, baseDamage?: number): number {
    const energyBonus = attacker.specialEnergy ? attacker.specialEnergy * 0.5 : 0;
    if (baseDamage !== undefined) {
      let computedBase = baseDamage;
      // Consider weapon strength bonus: increase bonus from 10 to 12
      if (attacker.equipment.weapon === 'iron_sword') {
        computedBase += 15; // bonus for iron_sword increased from 12 to 15
      }
      return Math.max(0, computedBase + energyBonus);
    } else {
      let computedBase = attacker.skills.strength.level / 10;
      console.log(
        'DEBUG: calculateDamage - attacker.weapon:',
        attacker.equipment ? attacker.equipment.weapon : 'none'
      );
      if (attacker.equipment && attacker.equipment.weapon) {
        if (attacker.equipment.weapon === 'iron_sword') {
          computedBase += 15; // bonus for iron_sword when baseDamage is undefined
        }
        computedBase += 5;
      }
      return Math.max(0, computedBase + energyBonus);
    }
  } /**
   * OSRS-accurate hit chance calculation using attack roll vs defense roll
   * Formula source: OSRS Wiki - https://oldschool.runescape.wiki/w/Combat#Accuracy
   */
  private static calculateHitChance(
    attacker: Player | NPC,
    defender: Player | NPC,
    attackType: AttackType,
    combatStyle?: CombatStyle
  ): number {
    // Get effective levels (base + boosts)
    const effectiveAttackLevel = this.getEffectiveAttackLevel(attacker, attackType, combatStyle);
    const effectiveDefenseLevel = this.getEffectiveDefenseLevel(defender);

    // Get equipment bonuses
    const attackBonus = this.getAttackBonus(attacker, attackType);
    const defenseBonus = this.getDefenseBonus(defender, attackType);

    // Calculate max rolls using OSRS formula: Effective Level * (Equipment Bonus + 64)
    const maxAttackRoll = effectiveAttackLevel * (attackBonus + 64);
    const maxDefenseRoll = effectiveDefenseLevel * (defenseBonus + 64);

    // OSRS accuracy formula - exact implementation from Wiki
    let accuracy: number;
    if (maxAttackRoll > maxDefenseRoll) {
      accuracy = 1 - (maxDefenseRoll + 2) / (2 * (maxAttackRoll + 1));
    } else {
      accuracy = maxAttackRoll / (2 * (maxDefenseRoll + 1));
    }

    return Math.max(0, Math.min(1, accuracy));
  }
  /**
   * OSRS-accurate maximum hit calculation
   * Formula source: OSRS Wiki - https://oldschool.runescape.wiki/w/Damage#Max_hit
   */
  private static calculateMaxHit(attacker: Player | NPC, combatStyle?: CombatStyle): number {
    // Get effective strength level
    const effectiveStrengthLevel = this.getEffectiveStrengthLevel(attacker, combatStyle);

    // Get strength bonus from equipment
    const strengthBonus = this.getStrengthBonus(attacker);

    // OSRS max hit formula: floor(1.3 + (effective_strength * (strength_bonus + 64)) / 640)
    const maxHit = Math.floor(1.3 + (effectiveStrengthLevel * (strengthBonus + 64)) / 640);

    return Math.max(0, maxHit);
  }
  // Apply combat effects to a player
  private applyEffects(entity: Player | NPC, effects: CombatEffect[]): void {
    const now = Date.now();
    
    // Initialize activeEffects if it doesn't exist
    if (!entity.activeEffects) {
      entity.activeEffects = new ArraySchema<string>();
    }
    
    // For now, we'll store effect types as strings and process them
    entity.activeEffects.clear();
    effects.forEach(effect => {
      entity.activeEffects!.push(effect.type);
    });
    
    effects.filter(effect => {
      // Apply effect
      switch (effect.type) {
        case 'poison':
          // Apply damage over time
          if (!entity['lastPoisonTick'] || now - entity['lastPoisonTick'] >= 1000) {
            entity.health -= effect.value;
            console.log(`${entity.username} took ${effect.value} poison damage.`);
            entity['lastPoisonTick'] = now;
          }
          break;
        case 'heal':
          entity.health += effect.value;
          break;
        // Add other effects
      }
      // Decrease duration and remove if expired
      effect.duration -= now - (entity['lastEffectTick'] || now);
      return effect.duration > 0;
    });
    entity['lastEffectTick'] = now;
  }

  // NPC combat behavior - determine actions based on NPC type and situation
  static determineNpcAction(
    npc: NPC,
    players: MapSchema<Player>,
    currentTick: number
  ): { target?: Player; action: string } {
    let closestPlayer: Player | undefined;
    let shortestDistance = Infinity;
    let lowestHealthPlayer: Player | undefined;
    let lowestHealth = Infinity;

    players.forEach(player => {
      const distance = Math.sqrt(Math.pow(npc.x - player.x, 2) + Math.pow(npc.y - player.y, 2));

      if (distance < shortestDistance && distance < npc.aggroRange) {
        closestPlayer = player;
        shortestDistance = distance;
      }
      if (player.health < lowestHealth && distance < npc.aggroRange) {
        lowestHealthPlayer = player;
        lowestHealth = player.health;
      }
    });
    // Example: If low health player is nearby, target them for a "finisher" attack
    if (lowestHealthPlayer && lowestHealth < 20 && Math.random() < 0.5) {
      return { target: lowestHealthPlayer, action: 'finisher' };
    }
    if (closestPlayer) {
      // Vary attack pattern: sometimes use "special", sometimes "basic"
      if (shortestDistance <= npc.attackRange) {
        const rand = Math.random();
        if (rand < 0.15) return { target: closestPlayer, action: 'special' };
        if (rand < 0.3) return { target: closestPlayer, action: 'buff' };
        return { target: closestPlayer, action: 'attack' };
      } else {
        return { target: closestPlayer, action: 'move' };
      }
    }
    // No targets, wander around
    return { action: 'wander' };
  }

  // Helper methods for combat calculations

  // --- Prayer/Buffer System ---
  private static PRAYER_DEFS: Record<string, CombatPrayerBonus & { duration: number }> = {
    clarity_of_thought: {
      attackBonus: 5,
      strengthBonus: 0,
      defenseBonus: 0,
      damageReduction: 0,
      duration: 10000,
    },
    burst_of_strength: {
      attackBonus: 0,
      strengthBonus: 5,
      defenseBonus: 0,
      damageReduction: 0,
      duration: 10000,
    },
    rock_skin: {
      attackBonus: 0,
      strengthBonus: 0,
      defenseBonus: 5,
      damageReduction: 0,
      duration: 10000,
    },
    protect_from_melee: {
      attackBonus: 0,
      strengthBonus: 0,
      defenseBonus: 0,
      damageReduction: 0.5,
      duration: 10000,
    },
  };
  // Removed: dropLoot logic is now handled by LootManager
  itemManager = ItemManager.getInstance(); // Get instance here

  // Removed: dropLoot logic is now handled by LootManager

  static updatePrayers(player: Player) {
    if (!player['prayerTimers']) return;
    const now = Date.now();
    for (const prayer of [...player.activePrayers]) {
      if (player['prayerTimers'].get(prayer) <= now) {
        player.activePrayers = player.activePrayers.filter(p => p !== prayer);
        player['prayerTimers'].delete(prayer);
      }
    }
  }
  private static getPrayerBonus(player: Player): CombatPrayerBonus {
    // Create a temporary prayer system instance to calculate bonuses
    const prayerSystem = new PrayerSystem(player);

    const bonus: CombatPrayerBonus = {
      attackBonus: prayerSystem.getAttackBonus(),
      strengthBonus: prayerSystem.getStrengthBonus(),
      defenseBonus: prayerSystem.getDefenceBonus(),
      damageReduction: 0, // Protection prayers handled separately
    };

    // Clean up the temporary instance
    prayerSystem.destroy();

    return bonus;
  }
  private static getEffectiveAttackLevel(
    player: Player | NPC,
    attackType: AttackType,
    combatStyle?: CombatStyle
  ): number {
    // Base is the actual skill level
    let effectiveLevel = 'skills' in player ? player.skills.attack.level : 10; // Default for NPCs
    // Apply prayer bonus (only for players)
    if ('skills' in player && 'activePrayers' in player) {
      effectiveLevel += this.getPrayerBonus(player as Player).attackBonus;
      // Apply combat style boosts
      if (combatStyle === CombatStyle.ACCURATE) {
        effectiveLevel += 3;
      } else if (combatStyle === CombatStyle.CONTROLLED) {
        effectiveLevel += 1;
      }
    }
    return effectiveLevel;
  }

  private static getEffectiveDefenseLevel(player: Player | NPC): number {
    // Base is the actual skill level
    let effectiveLevel = 'skills' in player ? player.skills.defence.level : 10; // Default for NPCs
    // Apply prayer bonus (only for players)
    if ('skills' in player && 'activePrayers' in player) {
      effectiveLevel += this.getPrayerBonus(player as Player).defenseBonus;
      // Apply combat style boosts
      if ('combatStyle' in player) {
        if (player.combatStyle === CombatStyle.DEFENSIVE) {
          effectiveLevel += 3;
        } else if (player.combatStyle === CombatStyle.CONTROLLED) {
          effectiveLevel += 1;
        }
      }
    }
    return effectiveLevel;
  }

  private static getEffectiveStrengthLevel(
    player: Player | NPC,
    combatStyle?: CombatStyle
  ): number {
    // Base is the actual skill level
    let effectiveLevel = 'skills' in player ? player.skills.strength.level : 10; // Default for NPCs
    // Apply prayer bonus (only for players)
    if ('skills' in player && 'activePrayers' in player) {
      effectiveLevel += this.getPrayerBonus(player as Player).strengthBonus;
      // Apply combat style boosts
      if (combatStyle === CombatStyle.AGGRESSIVE) {
        effectiveLevel += 3;
      } else if (combatStyle === CombatStyle.CONTROLLED) {
        effectiveLevel += 1;
      }
    }
    return effectiveLevel;
  }

  private static getAttackRoll(attackLevel: number, attackBonus: number): number {
    return Math.floor(attackLevel * (attackBonus + 64));
  }

  private static getDefenseRoll(defenseLevel: number, defenseBonus: number): number {
    return Math.floor(defenseLevel * (defenseBonus + 64));
  }
  private static getAttackBonus(entity: Player | NPC, attackType: AttackType): number {
    // Get weapon stats
    const weaponName = 'equipment' in entity ? entity.equipment.weapon : null;
    if (!weaponName) return 0;

    const weapon = weaponDatabase[weaponName];
    if (!weapon) return 0;

    return weapon.attackBonus[attackType] || 0;
  }

  private static getDefenseBonus(entity: Player | NPC, attackType: AttackType): number {
    let totalDefense = 0;

    // Get armor stats
    const armorName = 'equipment' in entity ? entity.equipment.armor : null;
    if (armorName) {
      const armor = armorDatabase[armorName];
      if (armor) {
        totalDefense += armor.defenseBonus[attackType] || 0;
      }
    }

    // Add shield defense
    const shieldName = 'equipment' in entity ? entity.equipment.shield : null;
    if (shieldName) {
      // Would get from a shield database similar to armor
      // For now just a placeholder value
      totalDefense += 10;
    }

    return totalDefense;
  }

  private static getStrengthBonus(entity: Player | NPC): number {
    let strengthBonus = 0;

    // Get weapon strength bonus
    const weaponName = 'equipment' in entity ? entity.equipment.weapon : null;
    if (weaponName) {
      const weapon = weaponDatabase[weaponName];
      if (weapon) {
        strengthBonus += weapon.strengthBonus;
      }
    }

    // Could also add bonuses from other equipment

    return strengthBonus;
  }

  static dropLoot(player: Player) {
    // Update player's inventory with the loot
    player.inventory.push(...player.loot);

    // Inventory sync call to Economy API
    economyClient
      .syncPlayerInventory(player.id, player.inventory)
      .then(() => {
        console.log(`Inventory synced for player ${player.id} after loot collection.`);
        // Trigger Discord notification
        notifyEvent(`Player ${player.id} inventory synced after loot collection.`);
      })
      .catch(err => {
        console.error(`Error syncing inventory for player ${player.id}:`, err);
      });
  }

  /**
   * Handles a player action message and performs corresponding combat operations.
   * @param playerId - ID of the player performing the action
   * @param message - Action message containing type and target
   * @returns An object with the result and targetId if handled, otherwise null
   */
  public handlePlayerAction(
    playerId: string,
    message: any
  ): { result: AttackResult; targetId: string } | null {
    // Only attack actions for now
    if (message.type === 'attack' && message.targetId) {
      const attacker = this.state.players.get(playerId);
      if (!attacker) return null;
      // Determine target: NPC or player
      let target: Player | NPC | undefined = this.state.npcs.get(message.targetId);
      if (!target) {
        target = this.state.players.get(message.targetId);
      }
      if (!target) return null;
      // Determine combat style or default to ACCURATE
      const style = (message.combatStyle as CombatStyle) || CombatStyle.ACCURATE;
      // Perform attack
      const result = CombatSystem.performAttack(attacker, target, style, message.useSpecial);
      return { result, targetId: message.targetId };
    }
    return null;
  }

  /**
   * OSRS-authentic XP calculation using exact formula from Wiki
   * Formula: XP for level L = Σ(floor((L-1) + 300 * 2^((L-1)/7))) / 4 for L from 2 to target level
   * Source: https://oldschool.runescape.wiki/w/Experience
   */
  static calculateXPForLevel(level: number): number {
    if (level <= 1) return 0;
    if (level > 99) level = 99; // Cap at 99

    let totalXP = 0;
    for (let L = 2; L <= level; L++) {
      totalXP += Math.floor((L - 1 + 300 * Math.pow(2, (L - 1) / 7)) / 4);
    }
    return totalXP;
  }

  /**
   * Calculate level from XP using OSRS formula
   */
  static calculateLevelFromXP(xp: number): number {
    if (xp < 0) return 1;

    let level = 1;
    let totalXP = 0;

    while (level < 99) {
      const nextLevelXP = Math.floor((level + 300 * Math.pow(2, level / 7)) / 4);
      if (totalXP + nextLevelXP > xp) break;
      totalXP += nextLevelXP;
      level++;
    }

    return level;
  }

  /**
   * Calculate combat XP gain based on damage dealt (OSRS accurate)
   * Formula: 4 XP per damage point for controlled, 4 XP for specific style
   */
  static calculateCombatXP(
    damage: number,
    combatStyle: CombatStyle
  ): {
    attack: number;
    strength: number;
    defence: number;
    hitpoints: number;
  } {
    const hitpointsXP = damage * 1.33; // Always gain 1.33 XP per damage to HP

    switch (combatStyle) {
      case CombatStyle.ACCURATE:
        return { attack: damage * 4, strength: 0, defence: 0, hitpoints: hitpointsXP };
      case CombatStyle.AGGRESSIVE:
        return { attack: 0, strength: damage * 4, defence: 0, hitpoints: hitpointsXP };
      case CombatStyle.DEFENSIVE:
        return { attack: 0, strength: 0, defence: damage * 4, hitpoints: hitpointsXP };
      case CombatStyle.CONTROLLED:
        return {
          attack: damage * 1.33,
          strength: damage * 1.33,
          defence: damage * 1.33,
          hitpoints: hitpointsXP,
        };
      default:
        return { attack: 0, strength: 0, defence: 0, hitpoints: hitpointsXP };
    }
  }
}

export default CombatSystem;
