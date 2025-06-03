import { Player } from './EntitySchemas';

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
  'bronze_sword': {
    attackSpeed: 4,
    attackBonus: {
      [AttackType.SLASH]: 7,
      [AttackType.STAB]: 4,
      [AttackType.CRUSH]: 0,
      [AttackType.MAGIC]: 0,
      [AttackType.RANGED]: 0
    },
    strengthBonus: 6,
    attackType: AttackType.SLASH
  },
  'iron_sword': {
    attackSpeed: 4,
    attackBonus: {
      [AttackType.SLASH]: 10,
      [AttackType.STAB]: 6,
      [AttackType.CRUSH]: 0,
      [AttackType.MAGIC]: 0,
      [AttackType.RANGED]: 0
    },
    strengthBonus: 9,
    attackType: AttackType.SLASH
  },
  // Example special attack weapon
  'dragon_dagger': {
    attackSpeed: 3,
    attackBonus: {
      [AttackType.SLASH]: 15,
      [AttackType.STAB]: 20,
      [AttackType.CRUSH]: 0,
      [AttackType.MAGIC]: 0,
      [AttackType.RANGED]: 0
    },
    strengthBonus: 18,
    attackType: AttackType.STAB,
    specialAttack: {
      name: 'Dragon Dagger Special',
      energyCost: 25,
      description: 'Double hit with increased accuracy',
      execute: (attacker, defender, baseDamage) => {
        // Double hit, each with +20% accuracy
        const results: AttackResult[] = [];
        for (let i = 0; i < 2; i++) {
          const hitChance = Math.min(1, CombatSystem.calculateHitChance(attacker, defender, AttackType.STAB) + 0.2);
          const hit = Math.random() < hitChance;
          const damage = hit ? Math.floor(baseDamage * (0.8 + Math.random() * 0.4)) : 0;
          results.push({
            hit,
            damage,
            criticalHit: false,
            effects: []
          });
        }
        // Aggregate result (sum damage, at least one hit if either hit)
        return {
          hit: results[0].hit || results[1].hit,
          damage: results[0].damage + results[1].damage,
          criticalHit: false,
          effects: []
        };
      }
    }
  }
};

const armorDatabase: Record<string, { defenseBonus: { [key in AttackType]: number } }> = {
  'bronze_plate': {
    defenseBonus: {
      [AttackType.SLASH]: 12,
      [AttackType.STAB]: 10,
      [AttackType.CRUSH]: 14,
      [AttackType.MAGIC]: -6,
      [AttackType.RANGED]: 8
    }
  },
  // Add more armor as needed
};

/**
 * CombatSystem handles all combat-related calculations
 */
export class CombatSystem {
  /**
   * Centralized combat processing for all players and NPCs
   */
  static processCombat(state: GameState) {
    // Update prayers for all players
    state.players.forEach((player) => {
      CombatSystem.updatePrayers(player);
    });
    // Example: iterate players, process attacks, deaths, etc.
    state.players.forEach((player) => {
      // Combat resolution logic placeholder
      // e.g., check if player is in combat, resolve attacks, apply damage, handle deaths
    });
    // TODO: Process NPC combat as well
  }

  /**
   * Handle combat-related player actions (delegated from GameRoom)
   */
  static handlePlayerAction(player: Player, message: any, state: GameState, dropPlayerInventory: (player: Player) => void) {
    // Update player state based on action
    if (message.x !== undefined) player.x = message.x;
    if (message.y !== undefined) player.y = message.y;
    if (message.animation) player.animation = message.animation;
    if (message.direction) player.direction = message.direction;
    player.lastActivity = Date.now();

    // Handle combat if the action is attack
    if (message.type === 'attack') {
      const isDead = player.health <= 0;
      if (isDead) {
        // Handle player death
        dropPlayerInventory(player);
      }
      // Additional combat logic (attack resolution, etc.) will be added in Step 2
    }
    // Other action handling logic
    player.isBusy = message.type !== 'idle';
  }
  /**
   * Calculate hit chance based on attacker's attack level and defender's defense
   */
  static calculateHitChance(
    attacker: Player,
    defender: Player,
    attackType: AttackType = AttackType.SLASH
  ): number {
    // Get attacker's effective attack level
    const attackLevel = this.getEffectiveAttackLevel(attacker, attackType);
    const attackRoll = this.getAttackRoll(attackLevel, this.getAttackBonus(attacker, attackType));

    // Get defender's defense level
    const defenseLevel = this.getEffectiveDefenseLevel(defender);
    const defenseRoll = this.getDefenseRoll(defenseLevel, this.getDefenseBonus(defender, attackType));
    
    // Calculate hit chance - higher attack roll means higher chance to hit
    if (attackRoll > defenseRoll) {
      return 0.5 + ((attackRoll - defenseRoll) / (2 * defenseRoll));
    } else {
      return attackRoll / (2 * defenseRoll);
    }
  }
  
  /**
   * Calculate damage based on attacker's strength and equipment
   */
  static calculateDamage(attacker: Player, combatStyle: CombatStyle): number {
    // Get effective strength level based on style
    let strengthLevel = attacker.skills.strength.level;
    
    if (combatStyle === CombatStyle.AGGRESSIVE) {
      strengthLevel += 3; // Aggressive gives +3 to effective strength
    } else if (combatStyle === CombatStyle.CONTROLLED) {
      strengthLevel += 1; // Controlled gives +1 to all stats
    }
    
    // Get strength bonus from equipment
    const strengthBonus = this.getStrengthBonus(attacker);
    
    // Base damage formula (simplified version of RS formula)
    const baseDamage = Math.floor(0.5 + strengthLevel * (strengthBonus + 64) / 640);
    
    // Random variance - 0.8 to 1.0 of max hit
    const randomFactor = 0.8 + (Math.random() * 0.2);
    
    return Math.floor(baseDamage * randomFactor);
  }
  
  /**
   * Performs an attack between two players and returns the result
   */
  static performAttack(
    attacker: Player,
    defender: Player,
    combatStyle: CombatStyle,
    opts?: { useSpecial?: boolean }
  ): AttackResult {
    const weaponType = attacker.equipment.weapon || 'unarmed';
    const weaponStats = weaponDatabase[weaponType] || {
      attackSpeed: 4,
      attackBonus: { [AttackType.CRUSH]: 0, [AttackType.SLASH]: 0, [AttackType.STAB]: 0, [AttackType.MAGIC]: 0, [AttackType.RANGED]: 0 },
      strengthBonus: 0,
      attackType: AttackType.CRUSH,
    };

    // --- Special Attack Logic ---
    if (opts?.useSpecial && weaponStats.specialAttack) {
      // Check special energy and cooldown
      if (
        attacker.specialEnergy >= weaponStats.specialAttack.energyCost &&
        (!attacker['specialCooldowns'] || !attacker['specialCooldowns'].get(weaponStats.specialAttack.name) || attacker['specialCooldowns'].get(weaponStats.specialAttack.name) <= Date.now())
      ) {
        // Deduct energy
        attacker.specialEnergy -= weaponStats.specialAttack.energyCost;
        // Set cooldown (example: 5s)
        if (!attacker['specialCooldowns']) attacker['specialCooldowns'] = new Map();
        attacker['specialCooldowns'].set(weaponStats.specialAttack.name, Date.now() + 5000);
        // Execute special
        return weaponStats.specialAttack.execute(attacker, defender, this.calculateDamage(attacker, combatStyle));
      }
    }

    // Calculate if the attack hits
    const hitChance = this.calculateHitChance(attacker, defender, weaponStats.attackType);
    const hit = Math.random() < hitChance;

    if (!hit) {
      return {
        hit: false,
        damage: 0,
        criticalHit: false,
        effects: []
      };
    }

    // Calculate damage if hit
    const damage = this.calculateDamage(attacker, combatStyle);

    // Small chance of critical hit (10% chance for 1.5x damage)
    const criticalHit = Math.random() < 0.1;
    const finalDamage = criticalHit ? Math.floor(damage * 1.5) : damage;

    // Calculate special effects based on weapon
    const effects: CombatEffect[] = [];

    // Example of a weapon effect
    if (weaponType === 'poisoned_dagger' && Math.random() < 0.2) {
      effects.push({
        type: 'poison',
        value: 2, // 2 damage per tick
        duration: 5, // 5 ticks
        description: 'Poisoned'
      });
    }

    return {
      hit,
      damage: finalDamage,
      criticalHit,
      effects
    };
  }
  
  /**
   * Apply combat effects to a player
   */
  static applyEffects(player: Player, effects: CombatEffect[]): void {
    effects.forEach(effect => {
      // Apply effect logic based on type
      switch (effect.type) {
        case 'bleed':
          // Implement bleeding damage over time
          // This would be stored on the player and processed each tick
          // player.activeEffects.push({ type: 'bleed', value: effect.value, remainingDuration: effect.duration });
          break;
        case 'poison':
          // Implement poison damage
          break;
        case 'stun':
          // Implement stun effect
          player.isBusy = true;
          player.busyUntil = Date.now() + effect.duration * 1000;
          break;
        // Add more effect handling
      }
    });
  }
  
  /**
   * NPC combat behavior - determine actions based on NPC type and situation
   */
  static determineNpcAction(npc: any, players: Map<string, Player>, currentTick: number): { target?: Player, action: string } {
    // Enhanced NPC AI: different attack patterns, smarter targeting, reactions
    let closestPlayer: Player | undefined;
    let shortestDistance = Number.MAX_SAFE_INTEGER;
    let lowestHealthPlayer: Player | undefined;
    let lowestHealth = Number.MAX_SAFE_INTEGER;
    // Find closest and lowest health player in aggro range
    players.forEach(player => {
      const distance = Math.sqrt(
        Math.pow(npc.x - player.x, 2) + 
        Math.pow(npc.y - player.y, 2)
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
    'clarity_of_thought': { attackBoost: 5, strengthBoost: 0, defenseBoost: 0, damageReduction: 0, duration: 10000 },
    'burst_of_strength': { attackBoost: 0, strengthBoost: 5, defenseBoost: 0, damageReduction: 0, duration: 10000 },
    'thick_skin': { attackBoost: 0, strengthBoost: 0, defenseBoost: 5, damageReduction: 0, duration: 10000 },
    'protect_from_melee': { attackBoost: 0, strengthBoost: 0, defenseBoost: 0, damageReduction: 40, duration: 5000 }
  };

  // Activate a prayer for a player
  static activatePrayer(player: Player, prayerName: string) {
    const def = this.PRAYER_DEFS[prayerName];
    if (!def) return;
    if (!player.activePrayers.includes(prayerName)) {
      player.activePrayers.push(prayerName);
      if (!player['prayerTimers']) player['prayerTimers'] = new Map();
      player['prayerTimers'].set(prayerName, Date.now() + def.duration);
    }
  }

  // Update prayers (should be called each tick)
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
    let bonus: CombatPrayerBonus = { attackBoost: 0, strengthBoost: 0, defenseBoost: 0, damageReduction: 0 };
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

  private static getEffectiveAttackLevel(player: Player, attackType: AttackType): number {
    // Base is the actual skill level
    let effectiveLevel = player.skills.attack.level;
    // Apply prayer bonus
    effectiveLevel += this.getPrayerBonus(player).attackBoost;
    // Apply combat style boosts
    if (player.combatStyle === CombatStyle.ACCURATE) {
      effectiveLevel += 3;
    } else if (player.combatStyle === CombatStyle.CONTROLLED) {
      effectiveLevel += 1;
    }
    return effectiveLevel;
  }
  
  private static getEffectiveDefenseLevel(player: Player): number {
    // Base is the actual skill level
    let effectiveLevel = player.skills.defence.level;
    // Apply prayer bonus
    effectiveLevel += this.getPrayerBonus(player).defenseBoost;
    // Apply combat style boosts
    if (player.combatStyle === CombatStyle.DEFENSIVE) {
      effectiveLevel += 3;
    } else if (player.combatStyle === CombatStyle.CONTROLLED) {
      effectiveLevel += 1;
    }
    return effectiveLevel;
  }
  
  private static getAttackRoll(attackLevel: number, attackBonus: number): number {
    return Math.floor(attackLevel * (attackBonus + 64));
  }
  
  private static getDefenseRoll(defenseLevel: number, defenseBonus: number): number {
    return Math.floor(defenseLevel * (defenseBonus + 64));
  }
  
  private static getAttackBonus(player: Player, attackType: AttackType): number {
    // Get weapon stats
    const weaponName = player.equipment.weapon;
    if (!weaponName) return 0;
    
    const weapon = weaponDatabase[weaponName];
    if (!weapon) return 0;
    
    return weapon.attackBonus[attackType] || 0;
  }
  
  private static getDefenseBonus(player: Player, attackType: AttackType): number {
    let totalDefense = 0;
    
    // Get armor stats
    const armorName = player.equipment.armor;
    if (armorName) {
      const armor = armorDatabase[armorName];
      if (armor) {
        totalDefense += armor.defenseBonus[attackType] || 0;
      }
    }
    
    // Add shield defense
    const shieldName = player.equipment.shield;
    if (shieldName) {
      // Would get from a shield database similar to armor
      // For now just a placeholder value
      totalDefense += 10;
    }
    
    return totalDefense;
  }
  
  private static getStrengthBonus(player: Player): number {
    let strengthBonus = 0;
    
    // Get weapon strength bonus
    const weaponName = player.equipment.weapon;
    if (weaponName) {
      const weapon = weaponDatabase[weaponName];
      if (weapon) {
        strengthBonus += weapon.strengthBonus;
      }
    }
    
    // Could also add bonuses from other equipment
    
    return strengthBonus;
  }
}

export default CombatSystem;
