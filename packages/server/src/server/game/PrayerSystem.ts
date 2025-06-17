// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import { Player } from './EntitySchemas';

// Prayer system enums and interfaces
export enum PrayerCategory {
  ATTACK = 'attack',
  STRENGTH = 'strength',
  DEFENCE = 'defence',
  PROTECTION = 'protection',
  RESTORATION = 'restoration',
  OVERHEAD = 'overhead',
}

export enum EffectType {
  PERCENTAGE_BOOST = 'percentage_boost',
  FLAT_BOOST = 'flat_boost',
  PROTECTION = 'protection',
}

export enum StatType {
  ATTACK = 'attack',
  STRENGTH = 'strength',
  DEFENCE = 'defence',
  MAGIC = 'magic',
  RANGED = 'ranged',
}

export enum ProtectionType {
  MELEE = 'melee',
  RANGED = 'ranged',
  MAGIC = 'magic',
}

export interface PrayerEffect {
  type: EffectType;
  value: number; // percentage or flat value
  target: StatType;
}

export interface Prayer {
  id: string;
  name: string;
  levelRequired: number;
  baseDrainRate: number; // points per minute
  category: PrayerCategory;
  effects: PrayerEffect[];
  conflictsWith: string[]; // prayers that cannot be active simultaneously
  protectionType?: ProtectionType; // for protection prayers
}

/**
 * Core Prayer System - manages prayer activation, deactivation, and effects
 * Based on OSRS prayer mechanics with accurate drain rates and bonuses
 */
export class PrayerSystem {
  private player: Player;
  private prayers: Map<string, Prayer> = new Map();
  private drainInterval: NodeJS.Timeout | null = null;
  private readonly DRAIN_TICK_MS = 600; // 0.6 seconds like OSRS

  constructor(player: Player) {
    this.player = player;
    this.initializePrayers();
    this.startDrainTimer();
  }

  /**
   * Initialize all available prayers
   */
  private initializePrayers(): void {
    const prayerDefinitions: Prayer[] = [
      // Attack Prayers
      {
        id: 'clarity_of_thought',
        name: 'Clarity of Thought',
        levelRequired: 7,
        baseDrainRate: 6, // points per minute
        category: PrayerCategory.ATTACK,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 5, target: StatType.ATTACK }],
        conflictsWith: ['improved_reflexes', 'incredible_reflexes', 'piety', 'chivalry'],
      },
      {
        id: 'improved_reflexes',
        name: 'Improved Reflexes',
        levelRequired: 16,
        baseDrainRate: 12,
        category: PrayerCategory.ATTACK,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 10, target: StatType.ATTACK }],
        conflictsWith: ['clarity_of_thought', 'incredible_reflexes', 'piety', 'chivalry'],
      },
      {
        id: 'incredible_reflexes',
        name: 'Incredible Reflexes',
        levelRequired: 34,
        baseDrainRate: 20,
        category: PrayerCategory.ATTACK,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 15, target: StatType.ATTACK }],
        conflictsWith: ['clarity_of_thought', 'improved_reflexes', 'piety', 'chivalry'],
      },

      // Strength Prayers
      {
        id: 'burst_of_strength',
        name: 'Burst of Strength',
        levelRequired: 4,
        baseDrainRate: 6,
        category: PrayerCategory.STRENGTH,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 5, target: StatType.STRENGTH }],
        conflictsWith: ['superhuman_strength', 'ultimate_strength', 'piety', 'chivalry'],
      },
      {
        id: 'superhuman_strength',
        name: 'Superhuman Strength',
        levelRequired: 13,
        baseDrainRate: 12,
        category: PrayerCategory.STRENGTH,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 10, target: StatType.STRENGTH }],
        conflictsWith: ['burst_of_strength', 'ultimate_strength', 'piety', 'chivalry'],
      },
      {
        id: 'ultimate_strength',
        name: 'Ultimate Strength',
        levelRequired: 31,
        baseDrainRate: 20,
        category: PrayerCategory.STRENGTH,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 15, target: StatType.STRENGTH }],
        conflictsWith: ['burst_of_strength', 'superhuman_strength', 'piety', 'chivalry'],
      },

      // Defence Prayers
      {
        id: 'thick_skin',
        name: 'Thick Skin',
        levelRequired: 1,
        baseDrainRate: 6,
        category: PrayerCategory.DEFENCE,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 5, target: StatType.DEFENCE }],
        conflictsWith: ['rock_skin', 'steel_skin', 'piety', 'chivalry'],
      },
      {
        id: 'rock_skin',
        name: 'Rock Skin',
        levelRequired: 10,
        baseDrainRate: 12,
        category: PrayerCategory.DEFENCE,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 10, target: StatType.DEFENCE }],
        conflictsWith: ['thick_skin', 'steel_skin', 'piety', 'chivalry'],
      },
      {
        id: 'steel_skin',
        name: 'Steel Skin',
        levelRequired: 28,
        baseDrainRate: 20,
        category: PrayerCategory.DEFENCE,
        effects: [{ type: EffectType.PERCENTAGE_BOOST, value: 15, target: StatType.DEFENCE }],
        conflictsWith: ['thick_skin', 'rock_skin', 'piety', 'chivalry'],
      },

      // Advanced Combat Prayers
      {
        id: 'piety',
        name: 'Piety',
        levelRequired: 70,
        baseDrainRate: 40,
        category: PrayerCategory.OVERHEAD,
        effects: [
          { type: EffectType.PERCENTAGE_BOOST, value: 20, target: StatType.ATTACK },
          { type: EffectType.PERCENTAGE_BOOST, value: 23, target: StatType.STRENGTH },
          { type: EffectType.PERCENTAGE_BOOST, value: 25, target: StatType.DEFENCE },
        ],
        conflictsWith: [
          'chivalry',
          'clarity_of_thought',
          'improved_reflexes',
          'incredible_reflexes',
          'burst_of_strength',
          'superhuman_strength',
          'ultimate_strength',
          'thick_skin',
          'rock_skin',
          'steel_skin',
        ],
      },

      {
        id: 'chivalry',
        name: 'Chivalry',
        levelRequired: 60,
        baseDrainRate: 30,
        category: PrayerCategory.OVERHEAD,
        effects: [
          { type: EffectType.PERCENTAGE_BOOST, value: 15, target: StatType.ATTACK },
          { type: EffectType.PERCENTAGE_BOOST, value: 18, target: StatType.STRENGTH },
          { type: EffectType.PERCENTAGE_BOOST, value: 20, target: StatType.DEFENCE },
        ],
        conflictsWith: [
          'piety',
          'clarity_of_thought',
          'improved_reflexes',
          'incredible_reflexes',
          'burst_of_strength',
          'superhuman_strength',
          'ultimate_strength',
          'thick_skin',
          'rock_skin',
          'steel_skin',
        ],
      },

      // Protection Prayers
      {
        id: 'protect_from_melee',
        name: 'Protect from Melee',
        levelRequired: 43,
        baseDrainRate: 20,
        category: PrayerCategory.PROTECTION,
        effects: [{ type: EffectType.PROTECTION, value: 100, target: StatType.DEFENCE }],
        conflictsWith: [],
        protectionType: ProtectionType.MELEE,
      },
      {
        id: 'protect_from_missiles',
        name: 'Protect from Missiles',
        levelRequired: 40,
        baseDrainRate: 20,
        category: PrayerCategory.PROTECTION,
        effects: [{ type: EffectType.PROTECTION, value: 100, target: StatType.DEFENCE }],
        conflictsWith: [],
        protectionType: ProtectionType.RANGED,
      },
      {
        id: 'protect_from_magic',
        name: 'Protect from Magic',
        levelRequired: 37,
        baseDrainRate: 20,
        category: PrayerCategory.PROTECTION,
        effects: [{ type: EffectType.PROTECTION, value: 100, target: StatType.DEFENCE }],
        conflictsWith: [],
        protectionType: ProtectionType.MAGIC,
      },
    ];

    // Add prayers to the map
    for (const prayer of prayerDefinitions) {
      this.prayers.set(prayer.id, prayer);
    }
  }

  /**
   * Start the prayer drain timer
   */
  private startDrainTimer(): void {
    if (this.drainInterval) {
      clearInterval(this.drainInterval);
    }

    this.drainInterval = setInterval(() => {
      this.processPrayerDrain();
    }, this.DRAIN_TICK_MS);
  }
  /**
   * Process prayer point drain for active prayers
   */
  private processPrayerDrain(): void {
    if (!this.player || !this.player.activePrayers || this.player.activePrayers.length === 0) {
      return;
    }

    let totalDrainRate = 0;

    // Calculate total drain rate from all active prayers
    for (const prayerId of this.player.activePrayers) {
      const prayer = this.prayers.get(prayerId);
      if (prayer) {
        totalDrainRate += prayer.baseDrainRate;
      }
    }

    if (totalDrainRate > 0) {
      // Apply prayer bonus effect (each +1 prayer bonus = +3.333% prayer duration)
      const prayerDurationMultiplier = 1 + this.player.prayerBonus * 0.03333;
      const actualDrainRate = totalDrainRate / prayerDurationMultiplier;

      // Convert drain rate from points per minute to points per tick
      const drainPerTick = (actualDrainRate / 60) * (this.DRAIN_TICK_MS / 1000);

      // Drain prayer points
      this.player.drainPrayerPoints(drainPerTick);

      // Deactivate all prayers if no prayer points left
      if (this.player.prayerPoints <= 0) {
        this.deactivateAllPrayers();
      }
    }
  }

  /**
   * Activate a prayer
   */
  public activatePrayer(prayerId: string): boolean {
    const prayer = this.prayers.get(prayerId);
    if (!prayer) {
      return false;
    }

    // Check if player has required prayer level
    if (this.player.skills.prayer.level < prayer.levelRequired) {
      return false;
    }

    // Check if player has prayer points
    if (this.player.prayerPoints <= 0) {
      return false;
    }

    // Check if prayer is already active
    if (this.player.activePrayers.includes(prayerId)) {
      return false;
    }

    // Deactivate conflicting prayers
    for (const conflictingPrayerId of prayer.conflictsWith) {
      this.deactivatePrayer(conflictingPrayerId);
    }

    // Activate the prayer
    this.player.activePrayers.push(prayerId);
    return true;
  }

  /**
   * Deactivate a prayer
   */
  public deactivatePrayer(prayerId: string): void {
    const index = this.player.activePrayers.findIndex(id => id === prayerId);
    if (index !== -1) {
      this.player.activePrayers.splice(index, 1);
    }
  }

  /**
   * Deactivate all prayers
   */ public deactivateAllPrayers(): void {
    // Clear the array using splice(0) since .clear() doesn't exist in Colyseus v0.14.x
    this.player.activePrayers.splice(0);
  }

  /**
   * Check if a prayer is active
   */
  public isActive(prayerId: string): boolean {
    return this.player.activePrayers.includes(prayerId);
  }

  /**
   * Get attack bonus from active prayers
   */
  public getAttackBonus(): number {
    let bonus = 0;
    for (const prayerId of this.player.activePrayers) {
      const prayer = this.prayers.get(prayerId);
      if (prayer) {
        for (const effect of prayer.effects) {
          if (effect.target === StatType.ATTACK && effect.type === EffectType.PERCENTAGE_BOOST) {
            bonus += Math.floor(this.player.skills.attack.level * (effect.value / 100));
          }
        }
      }
    }
    return bonus;
  }

  /**
   * Get strength bonus from active prayers
   */
  public getStrengthBonus(): number {
    let bonus = 0;
    for (const prayerId of this.player.activePrayers) {
      const prayer = this.prayers.get(prayerId);
      if (prayer) {
        for (const effect of prayer.effects) {
          if (effect.target === StatType.STRENGTH && effect.type === EffectType.PERCENTAGE_BOOST) {
            bonus += Math.floor(this.player.skills.strength.level * (effect.value / 100));
          }
        }
      }
    }
    return bonus;
  }

  /**
   * Get defence bonus from active prayers
   */
  public getDefenceBonus(): number {
    let bonus = 0;
    for (const prayerId of this.player.activePrayers) {
      const prayer = this.prayers.get(prayerId);
      if (prayer) {
        for (const effect of prayer.effects) {
          if (effect.target === StatType.DEFENCE && effect.type === EffectType.PERCENTAGE_BOOST) {
            bonus += Math.floor(this.player.skills.defence.level * (effect.value / 100));
          }
        }
      }
    }
    return bonus;
  }

  /**
   * Get protection effects from active prayers
   */
  public getProtectionEffects(): ProtectionType[] {
    const protections: ProtectionType[] = [];
    for (const prayerId of this.player.activePrayers) {
      const prayer = this.prayers.get(prayerId);
      if (prayer && prayer.protectionType) {
        protections.push(prayer.protectionType);
      }
    }
    return protections;
  }

  /**
   * Get damage reduction percentage from protection prayers for a specific attack type
   * @param attackType The type of attack (melee, ranged, magic)
   * @returns Damage reduction percentage (0-100)
   */
  public getDamageReduction(attackType: ProtectionType): number {
    for (const prayerId of this.player.activePrayers) {
      const prayer = this.prayers.get(prayerId);
      if (
        prayer &&
        prayer.protectionType === attackType &&
        prayer.category === PrayerCategory.PROTECTION
      ) {
        // In OSRS, protection prayers typically reduce damage by 40% for NPCs, 50% for players
        // For simplicity, we'll use 40% reduction
        return 40;
      }
    }
    return 0;
  }

  /**
   * Get all available prayers
   */
  public getAllPrayers(): Prayer[] {
    return Array.from(this.prayers.values());
  }

  /**
   * Get prayers available to the player (based on prayer level)
   */
  public getAvailablePrayers(): Prayer[] {
    return Array.from(this.prayers.values()).filter(
      prayer => prayer.levelRequired <= this.player.skills.prayer.level
    );
  }

  /**
   * Get a specific prayer by ID
   */
  public getPrayer(prayerId: string): Prayer | undefined {
    return this.prayers.get(prayerId);
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.drainInterval) {
      clearInterval(this.drainInterval);
      this.drainInterval = null;
    }
  }
}
