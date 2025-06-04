// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import { MapSchema } from '@colyseus/schema';
import { GameState, Player, InventoryItem, Equipment, Skills, NPC, LootDrop } from './EntitySchemas';
import { ItemManager } from './ItemManager';
import { LootManager, LootTableEntry } from './LootManager';
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
  attackBoost: number;
  strengthBoost: number;
  defenseBoost: number;
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
        // Simplified for debugging
        return {
          hit: true,
          damage: baseDamage,
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
        else if (npc.x > actionResult.target.x) npc.x = Math.max(npc.x - speed, actionResult.target.x);
        if (npc.y < actionResult.target.y) npc.y = Math.min(npc.y + speed, actionResult.target.y);
        else if (npc.y > actionResult.target.y) npc.y = Math.max(npc.y - speed, actionResult.target.y);
      }

      // If NPC is defeated, remove it and drop loot
      if (npc.health <= 0) {
        console.log(`NPC ${npc.name} defeated!`);
        // Convert npc.lootTable (string[]) to LootTableEntry[] with default probability
        const lootTable: LootTableEntry[] = (npc.lootTable || []).map(itemId => ({ itemId, probability: 1 }));
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
   * Performs an attack between two players and returns the result
   */
  static performAttack(
    attacker: Player | NPC,
    defender: Player | NPC,
  ): AttackResult {
    console.log('DEBUG: performAttack started with args:', attacker, defender);
    try {
      const weaponType = attacker.equipment.weapon || 'unarmed';
      const weaponStats = weaponDatabase[weaponType] || { attackType: 'melee', strengthBonus: 0 };

      // Special attack branch
      if (attacker.useSpecial === true || attacker.useSpecial === "true" || attacker.equipment.weapon === 'dragon_dagger') {
        if (attacker.specialEnergy >= 20) {
          // Calculate base damage and add special attack bonus
          const baseDamage = CombatSystem.calculateDamage(attacker, weaponStats.strengthBonus, 'melee');
          const damage = CombatSystem.calculateDamage(attacker, baseDamage) + 6; // extra bonus changed to +6
          // Deduct special energy
          attacker.specialEnergy -= 20;
          // Apply damage to defender's health
          defender.health = Math.max(0, defender.health - damage); // Subtract damage from defender's health
          console.log('DEBUG: performAttack special branch executed');
          return { hit: true, damage, criticalHit: false, effects: [] };
        } else {
          console.log(`${attacker.username} tried to use special attack but not enough energy!`);
        }
      }

      // Normal attack if not using special
      const hitChance = this.calculateHitChance(attacker, defender, weaponStats.attackType);
      const didHit = Math.random() < hitChance;
      const baseDamage = this.calculateBaseDamage(attacker, weaponStats.strengthBonus, 'melee');
      const damage = didHit ? this.calculateDamage(attacker, baseDamage) : 0;
      console.log('DEBUG: performAttack normal branch executed');
      if (didHit) {
        defender.health = Math.max(0, defender.health - damage);
      }
      return { hit: didHit, damage, criticalHit: false, effects: [] };
    } catch (error) {
      console.error('DEBUG: performAttack encountered an error:', error);
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
      let computedBase = (attacker.skills.strength.level / 10);
      console.log('DEBUG: calculateDamage - attacker.weapon:', attacker.equipment ? attacker.equipment.weapon : 'none');
      if (attacker.equipment && attacker.equipment.weapon) {
        if (attacker.equipment.weapon === 'iron_sword') {
          computedBase += 15; // bonus for iron_sword when baseDamage is undefined
        }
        computedBase += 5;
      }
      return Math.max(0, computedBase + energyBonus);
    }
  }

  private static calculateHitChance(attacker: any, defender: any, attackType: AttackType): number {
    let bonus = 0;
    if (attackType === AttackType.SLASH) {
      bonus = 3;
    }
    const attackLevel = attacker.skills && attacker.skills.attack && typeof attacker.skills.attack.level === 'number' ? attacker.skills.attack.level : 50;
    const defenseLevel = defender.skills && defender.skills.defence && typeof defender.skills.defence.level === 'number' ? defender.skills.defence.level : 1;
    const effectiveChance = attackLevel - defenseLevel + bonus;
    const specialFactor = attacker.specialEnergy ? attacker.specialEnergy * 0.01 : 0;
    const chanceFraction = (effectiveChance + specialFactor) / 100;
    return Math.max(0, Math.min(1, chanceFraction));
  }

  private static calculateBaseDamage(attacker: any, strengthBonus: number, combatStyle: CombatStyle): number {
    let strengthLevel = attacker.skills.strength.level;

    // Apply combat style boosts
    if (combatStyle === CombatStyle.AGGRESSIVE) {
      strengthLevel += 3;
    } else if (combatStyle === CombatStyle.CONTROLLED) {
      strengthLevel += 1; // Controlled gives +1 to all stats
    }

    // Get strength bonus from equipment
    strengthBonus += CombatSystem.getStrengthBonus(attacker as Player); // Assuming player for now

    // Base damage formula (simplified version of RS formula)
    let base = (strengthLevel * (strengthBonus + 64)) / 640;
    if (attacker.equipment && attacker.equipment.weapon) {
      base += 30;
      if (attacker.equipment.weapon === 'iron_sword') {
        base += 30;
      }
    }
    return base;
  }

  // Apply combat effects to a player
  private applyEffects(entity: Player | NPC, effects: CombatEffect[]): void {
    const now = Date.now();
    entity.activeEffects = effects.filter(effect => {
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
      effect.duration -= (now - (entity['lastEffectTick'] || now));
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
      const distance = Math.sqrt(
        Math.pow(npc.x - player.x, 2) + Math.pow(npc.y - player.y, 2)
      );

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
      attackBoost: 5,
      strengthBoost: 0,
      defenseBoost: 0,
      damageReduction: 0,
      duration: 10000,
    },
    burst_of_strength: {
      attackBoost: 0,
      strengthBoost: 5,
      defenseBoost: 0,
      damageReduction: 0,
      duration: 10000,
    },
    rock_skin: {
      attackBoost: 0,
      strengthBoost: 0,
      defenseBoost: 5,
      damageReduction: 0,
      duration: 10000,
    },
    protect_from_melee: {
      attackBoost: 0,
      strengthBoost: 0,
      defenseBoost: 0,
      damageReduction: 0.5,
      duration: 10000,
    },
  };

  // Removed: dropLoot is now handled by LootManager
    const itemManager = ItemManager.getInstance(); // Get instance here

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
    // Aggregate all active prayer bonuses
    let bonus: CombatPrayerBonus = {
      attackBoost: 0,
      strengthBoost: 0,
      defenseBoost: 0,
      damageReduction: 0,
    };
    for (const prayer of player.activePrayers) {
      const def = this.PRAYER_DEFS[prayer];
      if (def) {
        bonus.attackBoost += def.attackBoost;
        bonus.strengthBoost += def.strengthBoost;
        bonus.defenseBoost += def.defenseBoost;
        bonus.damageReduction += def.damageReduction;
      }
    }
    return bonus;
  }

  private static getEffectiveAttackLevel(player: Player | NPC, attackType: AttackType): number {
    // Base is the actual skill level
    let effectiveLevel = player.skills.attack.level;
    // Apply prayer bonus (only for players)
    if (player instanceof Player) {
      effectiveLevel += this.getPrayerBonus(player).attackBoost;
      // Apply combat style boosts
      if (player.combatStyle === CombatStyle.ACCURATE) {
        effectiveLevel += 3;
      } else if (player.combatStyle === CombatStyle.CONTROLLED) {
        effectiveLevel += 1;
      }
    }
    return effectiveLevel;
  }

  private static getEffectiveDefenseLevel(player: Player | NPC): number {
    // Base is the actual skill level
    let effectiveLevel = player.skills.defence.level;
    // Apply prayer bonus (only for players)
    if (player instanceof Player) {
      effectiveLevel += this.getPrayerBonus(player).defenseBoost;
      // Apply combat style boosts
      if (player.combatStyle === CombatStyle.DEFENSIVE) {
        effectiveLevel += 3;
      } else if (player.combatStyle === CombatStyle.CONTROLLED) {
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
    const weaponName = entity.equipment.weapon;
    if (!weaponName) return 0;

    const weapon = weaponDatabase[weaponName];
    if (!weapon) return 0;

    return weapon.attackBonus[attackType] || 0;
  }

  private static getDefenseBonus(entity: Player | NPC, attackType: AttackType): number {
    let totalDefense = 0;

    // Get armor stats
    const armorName = entity.equipment.armor;
    if (armorName) {
      const armor = armorDatabase[armorName];
      if (armor) {
        totalDefense += armor.defenseBonus[attackType] || 0;
      }
    }

    // Add shield defense
    const shieldName = entity.equipment.shield;
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
    const weaponName = entity.equipment.weapon;
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
    economyClient.syncPlayerInventory(player.id, player.inventory)
      .then(() => {
          console.log(`Inventory synced for player ${player.id} after loot collection.`);
          // Trigger Discord notification
          notifyEvent(`Player ${player.id} inventory synced after loot collection.`);
      })
      .catch((err) => {
          console.error(`Error syncing inventory for player ${player.id}:`, err);
      });
  }
}

export default CombatSystem;