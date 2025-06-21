---
applyTo: "**"
---

# RuneRogue Core Development Instructions

## OSRS Authenticity Requirements

**CRITICAL**: All game mechanics must exactly match Old School RuneScape. No approximations or shortcuts.

### Combat Calculations

- Use exact OSRS damage formulas from `packages/osrs-data/`
- Attack speed must be precise: 4-tick (2.4s), 5-tick (3.0s), 6-tick (3.6s)
- Combat level calculation must match OSRS Wiki exactly
- Prayer effects and drain rates must be authentic

#### Example OSRS Combat Formula Implementation

```typescript
// Type definitions
interface Player {
  // Melee stats
  attackLevel: number;
  strengthLevel: number;
  defenceLevel: number;
  // Ranged stats
  rangedLevel: number;
  // Magic stats
  magicLevel: number;
  // Equipment bonuses
  attackBonus: number;
  strengthBonus: number;
  rangedBonus: number;
  rangedStrengthBonus: number;
  magicBonus: number;
  magicDamageBonus: number;
  defenceBonus: number;
  // Combat settings
  attackStyle: AttackStyle;
  combatType: CombatType;
  prayers: PrayerId[];
}

enum CombatType {
  Melee = "melee",
  Ranged = "ranged",
  Magic = "magic",
}

enum AttackStyle {
  // Melee styles
  Accurate = "accurate",
  Aggressive = "aggressive",
  Defensive = "defensive",
  Controlled = "controlled",
  // Ranged styles
  RangedAccurate = "ranged_accurate",
  RangedRapid = "ranged_rapid",
  RangedLongrange = "ranged_longrange",
  // Magic styles
  MagicAccurate = "magic_accurate",
  MagicLongrange = "magic_longrange",
}

enum PrayerId {
  // Attack prayers
  ClarityOfThought = "clarity_of_thought",
  ImprovedReflexes = "improved_reflexes",
  IncredibleReflexes = "incredible_reflexes",
  // Strength prayers
  BurstOfStrength = "burst_of_strength",
  SuperhumanStrength = "superhuman_strength",
  UltimateStrength = "ultimate_strength",
  // Defence prayers
  ThickSkin = "thick_skin",
  RockSkin = "rock_skin",
  SteelSkin = "steel_skin",
  // Ranged prayers
  SharpEye = "sharp_eye",
  HawkEye = "hawk_eye",
  EagleEye = "eagle_eye",
  // Magic prayers
  MysticWill = "mystic_will",
  MysticLore = "mystic_lore",
  MysticMight = "mystic_might",
  // Combined prayers
  Chivalry = "chivalry",
  Piety = "piety",
  Rigour = "rigour",
  Augury = "augury",
}

// Prayer bonus multipliers (complete set)
const PRAYER_BONUSES: Record<
  PrayerId,
  {
    attack?: number;
    strength?: number;
    defence?: number;
    ranged?: number;
    rangedStrength?: number;
    magic?: number;
    magicDamage?: number;
  }
> = {
  // Attack prayers
  [PrayerId.ClarityOfThought]: { attack: 1.05 },
  [PrayerId.ImprovedReflexes]: { attack: 1.1 },
  [PrayerId.IncredibleReflexes]: { attack: 1.15 },
  // Strength prayers
  [PrayerId.BurstOfStrength]: { strength: 1.05 },
  [PrayerId.SuperhumanStrength]: { strength: 1.1 },
  [PrayerId.UltimateStrength]: { strength: 1.15 },
  // Defence prayers
  [PrayerId.ThickSkin]: { defence: 1.05 },
  [PrayerId.RockSkin]: { defence: 1.1 },
  [PrayerId.SteelSkin]: { defence: 1.15 },
  // Ranged prayers
  [PrayerId.SharpEye]: { ranged: 1.05, rangedStrength: 1.05 },
  [PrayerId.HawkEye]: { ranged: 1.1, rangedStrength: 1.1 },
  [PrayerId.EagleEye]: { ranged: 1.15, rangedStrength: 1.15 },
  // Magic prayers
  [PrayerId.MysticWill]: { magic: 1.05 },
  [PrayerId.MysticLore]: { magic: 1.1 },
  [PrayerId.MysticMight]: { magic: 1.15 },
  // Combined prayers
  [PrayerId.Chivalry]: { attack: 1.15, strength: 1.18, defence: 1.2 },
  [PrayerId.Piety]: { attack: 1.2, strength: 1.23, defence: 1.25 },
  [PrayerId.Rigour]: { ranged: 1.2, rangedStrength: 1.23, defence: 1.25 },
  [PrayerId.Augury]: { magic: 1.25, defence: 1.25 },
};

// Prayer incompatibilities
const PRAYER_INCOMPATIBILITIES: Record<PrayerId, PrayerId[]> = {
  // Attack prayers are incompatible with each other
  [PrayerId.ClarityOfThought]: [
    PrayerId.ImprovedReflexes,
    PrayerId.IncredibleReflexes,
  ],
  [PrayerId.ImprovedReflexes]: [
    PrayerId.ClarityOfThought,
    PrayerId.IncredibleReflexes,
  ],
  [PrayerId.IncredibleReflexes]: [
    PrayerId.ClarityOfThought,
    PrayerId.ImprovedReflexes,
  ],
  // Strength prayers are incompatible with each other
  [PrayerId.BurstOfStrength]: [
    PrayerId.SuperhumanStrength,
    PrayerId.UltimateStrength,
  ],
  [PrayerId.SuperhumanStrength]: [
    PrayerId.BurstOfStrength,
    PrayerId.UltimateStrength,
  ],
  [PrayerId.UltimateStrength]: [
    PrayerId.BurstOfStrength,
    PrayerId.SuperhumanStrength,
  ],
  // Combined prayers override individual prayers
  [PrayerId.Chivalry]: [
    PrayerId.ClarityOfThought,
    PrayerId.ImprovedReflexes,
    PrayerId.IncredibleReflexes,
    PrayerId.BurstOfStrength,
    PrayerId.SuperhumanStrength,
    PrayerId.UltimateStrength,
    PrayerId.ThickSkin,
    PrayerId.RockSkin,
    PrayerId.SteelSkin,
    PrayerId.Piety,
    PrayerId.Rigour,
    PrayerId.Augury,
  ],
  [PrayerId.Piety]: [
    PrayerId.ClarityOfThought,
    PrayerId.ImprovedReflexes,
    PrayerId.IncredibleReflexes,
    PrayerId.BurstOfStrength,
    PrayerId.SuperhumanStrength,
    PrayerId.UltimateStrength,
    PrayerId.ThickSkin,
    PrayerId.RockSkin,
    PrayerId.SteelSkin,
    PrayerId.Chivalry,
    PrayerId.Rigour,
    PrayerId.Augury,
  ],
  [PrayerId.Rigour]: [
    PrayerId.SharpEye,
    PrayerId.HawkEye,
    PrayerId.EagleEye,
    PrayerId.ThickSkin,
    PrayerId.RockSkin,
    PrayerId.SteelSkin,
    PrayerId.Chivalry,
    PrayerId.Piety,
    PrayerId.Augury,
  ],
  [PrayerId.Augury]: [
    PrayerId.MysticWill,
    PrayerId.MysticLore,
    PrayerId.MysticMight,
    PrayerId.ThickSkin,
    PrayerId.RockSkin,
    PrayerId.SteelSkin,
    PrayerId.Chivalry,
    PrayerId.Piety,
    PrayerId.Rigour,
  ],
};

/**
 * Validate prayer combination
 * @param prayers - Array of prayer IDs to validate
 * @returns Array of valid prayers after removing incompatible ones
 */
export function validatePrayerCombination(prayers: PrayerId[]): PrayerId[] {
  const validPrayers: PrayerId[] = [];

  for (const prayer of prayers) {
    const incompatible = PRAYER_INCOMPATIBILITIES[prayer] || [];
    const hasIncompatible = validPrayers.some((p) => incompatible.includes(p));

    if (!hasIncompatible) {
      // Remove any prayers that are incompatible with this one
      const filtered = validPrayers.filter((p) => {
        const pIncompat = PRAYER_INCOMPATIBILITIES[p] || [];
        return !pIncompat.includes(prayer);
      });
      filtered.push(prayer);
      validPrayers.length = 0;
      validPrayers.push(...filtered);
    }
  }

  return validPrayers;
}

/**
 * Calculate max hit following OSRS formula for any combat style
 * @param player - Player stats and equipment
 * @returns Maximum hit damage
 * @throws Error if invalid combat type
 * @see https://oldschool.runescape.wiki/w/Maximum_hit
 */
export function calculateMaxHit(player: Player): number {
  switch (player.combatType) {
    case CombatType.Melee:
      return calculateMeleeMaxHit(player);
    case CombatType.Ranged:
      return calculateRangedMaxHit(player);
    case CombatType.Magic:
      return calculateMagicMaxHit(player);
    default:
      throw new Error(`Invalid combat type: ${player.combatType}`);
  }
}

/**
 * Calculate melee max hit
 * @see https://oldschool.runescape.wiki/w/Maximum_hit#Melee
 */
function calculateMeleeMaxHit(player: Player): number {
  let effectiveStrength = player.strengthLevel + 8;

  // Apply prayer bonuses
  const validPrayers = validatePrayerCombination(player.prayers);
  let prayerMultiplier = 1.0;

  for (const prayer of validPrayers) {
    const bonus = PRAYER_BONUSES[prayer];
    if (bonus?.strength && bonus.strength > prayerMultiplier) {
      prayerMultiplier = bonus.strength;
    }
  }
  effectiveStrength = Math.floor(effectiveStrength * prayerMultiplier);

  // Apply stance bonus
  const stanceBonus = getStanceBonus(player.attackStyle);
  effectiveStrength += stanceBonus.strength;

  // Calculate base damage
  const baseDamage =
    0.5 + (effectiveStrength * (player.strengthBonus + 64)) / 640;

  return Math.floor(baseDamage);
}

/**
 * Calculate ranged max hit
 * @see https://oldschool.runescape.wiki/w/Maximum_hit#Ranged
 */
function calculateRangedMaxHit(player: Player): number {
  let effectiveRangedStrength = player.rangedLevel + 8;

  // Apply prayer bonuses
  const validPrayers = validatePrayerCombination(player.prayers);
  let prayerMultiplier = 1.0;

  for (const prayer of validPrayers) {
    const bonus = PRAYER_BONUSES[prayer];
    if (bonus?.rangedStrength && bonus.rangedStrength > prayerMultiplier) {
      prayerMultiplier = bonus.rangedStrength;
    }
  }
  effectiveRangedStrength = Math.floor(
    effectiveRangedStrength * prayerMultiplier
  );

  // Apply stance bonus
  const stanceBonus = getStanceBonus(player.attackStyle);
  effectiveRangedStrength += stanceBonus.rangedStrength || 0;

  // Calculate base damage
  const baseDamage =
    0.5 + (effectiveRangedStrength * (player.rangedStrengthBonus + 64)) / 640;

  return Math.floor(baseDamage);
}

/**
 * Calculate magic max hit (for spells with base max hits)
 * @see https://oldschool.runescape.wiki/w/Maximum_hit#Magic
 */
function calculateMagicMaxHit(player: Player): number {
  // For this example, we'll use a base spell damage
  // In real implementation, this would come from spell data
  const baseSpellDamage = 20; // Example: Fire Blast base max hit

  // Magic damage bonus from equipment (percentage)
  const magicDamageMultiplier = 1 + player.magicDamageBonus / 100;

  return Math.floor(baseSpellDamage * magicDamageMultiplier);
}

/**
 * Get stance bonuses for different attack styles
 */
function getStanceBonus(style: AttackStyle): {
  attack: number;
  strength: number;
  defence: number;
  rangedAttack?: number;
  rangedStrength?: number;
  magic?: number;
} {
  switch (style) {
    // Melee stances
    case AttackStyle.Accurate:
      return { attack: 3, strength: 0, defence: 0 };
    case AttackStyle.Aggressive:
      return { attack: 0, strength: 3, defence: 0 };
    case AttackStyle.Defensive:
      return { attack: 0, strength: 0, defence: 3 };
    case AttackStyle.Controlled:
      return { attack: 1, strength: 1, defence: 1 };
    // Ranged stances
    case AttackStyle.RangedAccurate:
      return { attack: 0, strength: 0, defence: 0, rangedAttack: 3 };
    case AttackStyle.RangedRapid:
      return { attack: 0, strength: 0, defence: 0 }; // Rapid gives attack speed bonus instead
    case AttackStyle.RangedLongrange:
      return { attack: 0, strength: 0, defence: 3, rangedAttack: 0 };
    // Magic stances
    case AttackStyle.MagicAccurate:
      return { attack: 0, strength: 0, defence: 0, magic: 3 };
    case AttackStyle.MagicLongrange:
      return { attack: 0, strength: 0, defence: 3, magic: 0 };
    default:
      return { attack: 0, strength: 0, defence: 0 };
  }
}
```

### Data Validation

- Cross-reference all stats with OSRS Wiki
- Use existing OSRS data pipeline for validation
- Test calculations against known OSRS values

#### Validation Example

```typescript
import { describe, it, expect } from "@jest/globals";

// Mock weapon data structure
interface Weapon {
  name: string;
  attackSpeed: number;
  slashAttack: number;
  strengthBonus: number;
}

// Mock weapon getter function
function getWeapon(name: string): Weapon {
  // This would fetch from your actual OSRS data
  const weapons: Record<string, Weapon> = {
    bronze_scimitar: {
      name: "Bronze Scimitar",
      attackSpeed: 4,
      slashAttack: 7,
      strengthBonus: 8,
    },
  };
  const weapon = weapons[name];
  if (!weapon) {
    throw new Error(`Weapon ${name} not found`);
  }
  return weapon;
}

describe("OSRS Combat Accuracy", () => {
  it("should match OSRS Wiki values for Bronze Scimitar", () => {
    const bronzeScimitar = getWeapon("bronze_scimitar");
    expect(bronzeScimitar.attackSpeed).toBe(4); // 4-tick weapon
    expect(bronzeScimitar.slashAttack).toBe(7);
    expect(bronzeScimitar.strengthBonus).toBe(8);
  });

  it("should validate prayer combinations correctly", () => {
    // Test incompatible prayers
    const prayers1 = [PrayerId.Piety, PrayerId.UltimateStrength];
    const valid1 = validatePrayerCombination(prayers1);
    expect(valid1).toEqual([PrayerId.Piety]); // Piety overrides Ultimate Strength

    // Test compatible prayers
    const prayers2 = [PrayerId.UltimateStrength, PrayerId.SteelSkin];
    const valid2 = validatePrayerCombination(prayers2);
    expect(valid2).toEqual([PrayerId.UltimateStrength, PrayerId.SteelSkin]);
  });

  it("should calculate max hit correctly for all combat styles", () => {
    // Melee test
    const meleePlayer: Player = {
      attackLevel: 75,
      strengthLevel: 80,
      defenceLevel: 70,
      rangedLevel: 1,
      magicLevel: 1,
      attackBonus: 64,
      strengthBonus: 89,
      rangedBonus: 0,
      rangedStrengthBonus: 0,
      magicBonus: 0,
      magicDamageBonus: 0,
      defenceBonus: 150,
      attackStyle: AttackStyle.Aggressive,
      combatType: CombatType.Melee,
      prayers: [PrayerId.Piety],
    };
    expect(calculateMaxHit(meleePlayer)).toBe(27); // Example expected value

    // Ranged test
    const rangedPlayer: Player = {
      attackLevel: 1,
      strengthLevel: 1,
      defenceLevel: 70,
      rangedLevel: 85,
      magicLevel: 1,
      attackBonus: 0,
      strengthBonus: 0,
      rangedBonus: 94,
      rangedStrengthBonus: 80,
      magicBonus: 0,
      magicDamageBonus: 0,
      defenceBonus: 150,
      attackStyle: AttackStyle.RangedAccurate,
      combatType: CombatType.Ranged,
      prayers: [PrayerId.Rigour],
    };
    expect(calculateMaxHit(rangedPlayer)).toBe(25); // Example expected value
  });
});
```

## TypeScript Standards

### Type Safety

- Use strict TypeScript settings, no `any` types
- Define proper interfaces for all game data structures
- Add comprehensive JSDoc documentation
- Implement proper error handling with Result types

#### Result Type Pattern

```typescript
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export type GameError =
  | { type: "INVALID_INPUT"; message: string; details?: unknown }
  | { type: "CALCULATION_ERROR"; message: string; details?: unknown }
  | { type: "NETWORK_ERROR"; message: string; details?: unknown }
  | { type: "VALIDATION_ERROR"; message: string; details?: unknown };

export function safeDivide(a: number, b: number): Result<number, GameError> {
  if (b === 0) {
    return {
      success: false,
      error: {
        type: "CALCULATION_ERROR",
        message: "Division by zero",
        details: { numerator: a, denominator: b },
      },
    };
  }
  return { success: true, value: a / b };
}

/**
 * Safe max hit calculation with error handling
 */
export function safeCalculateMaxHit(player: Player): Result<number, GameError> {
  // Validate player stats
  if (!player || typeof player !== "object") {
    return {
      success: false,
      error: {
        type: "INVALID_INPUT",
        message: "Invalid player object",
      },
    };
  }

  // Validate combat type
  if (!Object.values(CombatType).includes(player.combatType)) {
    return {
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "Invalid combat type",
        details: { combatType: player.combatType },
      },
    };
  }

  // Validate levels (1-99 for OSRS)
  const levels = [
    { name: "attack", value: player.attackLevel },
    { name: "strength", value: player.strengthLevel },
    { name: "defence", value: player.defenceLevel },
    { name: "ranged", value: player.rangedLevel },
    { name: "magic", value: player.magicLevel },
  ];

  for (const { name, value } of levels) {
    if (value < 1 || value > 99) {
      return {
        success: false,
        error: {
          type: "VALIDATION_ERROR",
          message: `Invalid ${name} level: must be between 1 and 99`,
          details: { [name]: value },
        },
      };
    }
  }

  try {
    const maxHit = calculateMaxHit(player);
    return { success: true, value: maxHit };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "CALCULATION_ERROR",
        message:
          error instanceof Error ? error.message : "Unknown calculation error",
        details: { player },
      },
    };
  }
}
```

### Performance Requirements

- Target 60fps with 4+ players
- Use object pools for frequently created objects
- Optimize ECS queries and systems
- Profile hot code paths regularly

#### Object Pool Example

```typescript
interface Resettable {
  reset(): void;
}

export class ObjectPool<T extends Resettable> {
  private pool: T[] = [];
  private activeCount = 0;
  private peakActiveCount = 0;
  private totalAcquired = 0;
  private totalReleased = 0;

  constructor(
    private createFn: () => T,
    private initialSize: number = 10,
    private maxSize: number = 1000
  ) {
    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    this.totalAcquired++;

    if (this.activeCount < this.pool.length) {
      const item = this.pool[this.activeCount++];
      this.peakActiveCount = Math.max(this.peakActiveCount, this.activeCount);
      return item;
    }

    // Need to create new object
    if (this.pool.length >= this.maxSize) {
      throw new Error(`Object pool exceeded max size of ${this.maxSize}`);
    }

    const item = this.createFn();
    this.pool.push(item);
    this.activeCount++;
    this.peakActiveCount = Math.max(this.peakActiveCount, this.activeCount);
    return item;
  }

  release(item: T): void {
    item.reset();
    this.totalReleased++;

    const index = this.pool.indexOf(item);
    if (index !== -1 && index < this.activeCount) {
      // Swap with last active
      [this.pool[index], this.pool[this.activeCount - 1]] = [
        this.pool[this.activeCount - 1],
        this.pool[index],
      ];
      this.activeCount--;
    }
  }

  getActiveCount(): number {
    return this.activeCount;
  }

  getTotalCount(): number {
    return this.pool.length;
  }

  getStats(): {
    active: number;
    total: number;
    peak: number;
    acquired: number;
    released: number;
    efficiency: number;
  } {
    return {
      active: this.activeCount,
      total: this.pool.length,
      peak: this.peakActiveCount,
      acquired: this.totalAcquired,
      released: this.totalReleased,
      efficiency:
        this.totalAcquired > 0 ?
          (this.totalAcquired - (this.pool.length - this.initialSize)) /
          this.totalAcquired
        : 1,
    };
  }

  clear(): void {
    this.pool = [];
    this.activeCount = 0;
    // Re-initialize pool
    for (let i = 0; i < this.initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }
}

// Example usage with damage numbers
class DamageNumber implements Resettable {
  x: number = 0;
  y: number = 0;
  value: number = 0;
  color: string = "#ffffff";
  lifetime: number = 0;
  velocity: { x: number; y: number } = { x: 0, y: 0 };

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.value = 0;
    this.color = "#ffffff";
    this.lifetime = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }
}

const damageNumberPool = new ObjectPool(() => new DamageNumber(), 50, 200);
```

## Architecture Patterns

### ECS Design

- Use bitECS for all game entities and systems
- Keep components data-only, logic in systems
- Maintain clear system execution order
- Implement efficient entity queries

#### bitECS Implementation Example

```typescript
import {
  defineComponent,
  defineQuery,
  defineSystem,
  addEntity,
  addComponent,
  Types,
  IWorld,
} from "bitecs";

// Define components - data only
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Health = defineComponent({
  current: Types.ui16,
  max: Types.ui16,
});

// Additional combat-related components
export const CombatStats = defineComponent({
  attackLevel: Types.ui8,
  strengthLevel: Types.ui8,
  defenceLevel: Types.ui8,
  rangedLevel: Types.ui8,
  magicLevel: Types.ui8,
  hitpointsLevel: Types.ui8,
  prayerLevel: Types.ui8,
  // Equipment bonuses
  attackBonus: Types.i16,
  strengthBonus: Types.i16,
  rangedBonus: Types.i16,
  rangedStrengthBonus: Types.i16,
  magicBonus: Types.i16,
  magicDamageBonus: Types.i16,
  defenceBonus: Types.i16,
  prayerBonus: Types.i16,
  // Combat state
  lastAttackTime: Types.ui32,
  targetEntity: Types.eid,
  combatStyle: Types.ui8, // Enum as number
});

export const Prayer = defineComponent({
  activePrayers: Types.ui32, // Bitmask for active prayers
  prayerPoints: Types.ui16,
  maxPrayerPoints: Types.ui16,
  lastDrainTime: Types.ui32,
});

// Extend IWorld with custom properties
interface GameWorld extends IWorld {
  time: {
    delta: number;
    elapsed: number;
  };
}

// Define queries
const movementQuery = defineQuery([Position, Velocity]);
const damageableQuery = defineQuery([Position, Health]);

// Define systems - logic only
export const createMovementSystem = () => {
  return defineSystem((world: GameWorld) => {
    const entities = movementQuery(world);
    const deltaTime = world.time.delta / 1000;

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      Position.x[eid] += Velocity.x[eid] * deltaTime;
      Position.y[eid] += Velocity.y[eid] * deltaTime;
    }

    return world;
  });
};

// Combat system
export const createCombatSystem = () => {
  const combatQuery = defineQuery([Position, Health, CombatStats]);

  return defineSystem((world: GameWorld) => {
    const entities = combatQuery(world);
    const currentTime = world.time.elapsed;

    for (let i = 0; i < entities.length; i++) {
      const attackerEid = entities[i];
      const targetEid = CombatStats.targetEntity[attackerEid];

      // Check if has valid target
      if (targetEid === 0 || !Health.current[targetEid]) continue;

      // Check attack speed cooldown
      const lastAttack = CombatStats.lastAttackTime[attackerEid];
      const weaponSpeed = 4; // 4-tick weapon, should come from equipment
      const attackCooldown = weaponSpeed * 600; // Convert ticks to ms

      if (currentTime - lastAttack < attackCooldown) continue;

      // Calculate and apply damage
      const damage = calculateCombatDamage(world, attackerEid, targetEid);
      Health.current[targetEid] = Math.max(
        0,
        Health.current[targetEid] - damage
      );

      // Update last attack time
      CombatStats.lastAttackTime[attackerEid] = currentTime;

      // Check if target died
      if (Health.current[targetEid] === 0) {
        CombatStats.targetEntity[attackerEid] = 0;
        // Handle death (remove entity, drop items, etc.)
      }
    }

    return world;
  });
};

// Helper function to calculate damage
function calculateCombatDamage(
  world: GameWorld,
  attackerEid: number,
  defenderEid: number
): number {
  // Extract stats from ECS components
  const attacker = {
    attackLevel: CombatStats.attackLevel[attackerEid],
    strengthLevel: CombatStats.strengthLevel[attackerEid],
    defenceLevel: CombatStats.defenceLevel[attackerEid],
    rangedLevel: CombatStats.rangedLevel[attackerEid],
    magicLevel: CombatStats.magicLevel[attackerEid],
    attackBonus: CombatStats.attackBonus[attackerEid],
    strengthBonus: CombatStats.strengthBonus[attackerEid],
    rangedBonus: CombatStats.rangedBonus[attackerEid],
    rangedStrengthBonus: CombatStats.rangedStrengthBonus[attackerEid],
    magicBonus: CombatStats.magicBonus[attackerEid],
    magicDamageBonus: CombatStats.magicDamageBonus[attackerEid],
    defenceBonus: CombatStats.defenceBonus[attackerEid],
    attackStyle: AttackStyle.Aggressive, // Should come from combat style
    combatType: CombatType.Melee, // Should come from equipment
    prayers: [], // Should decode from Prayer component
  };

  // Use safe calculation
  const result = safeCalculateMaxHit(attacker);
  if (!result.success) {
    console.error("Failed to calculate max hit:", result.error);
    return 0;
  }

  const maxHit = result.value;

  // Roll for hit (simplified - should use full accuracy calculation)
  const hitChance = 0.5; // Placeholder
  if (Math.random() > hitChance) {
    return 0; // Miss
  }

  // Roll damage between 0 and max hit
  return Math.floor(Math.random() * (maxHit + 1));
}

// Prayer system
export const createPrayerSystem = () => {
  const prayerQuery = defineQuery([Prayer, CombatStats]);

  return defineSystem((world: GameWorld) => {
    const entities = prayerQuery(world);
    const currentTime = world.time.elapsed;

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const activePrayers = Prayer.activePrayers[eid];

      // Skip if no active prayers
      if (activePrayers === 0) continue;

      // Calculate total drain rate
      let totalDrainRate = 0;
      for (let bit = 0; bit < 32; bit++) {
        if (activePrayers & (1 << bit)) {
          // Map bit to prayer ID and get drain rate
          const prayerId = bitToPrayerId(bit);
          const drainRate = getPrayerDrainRate(prayerId);
          totalDrainRate += drainRate;
        }
      }

      // Apply drain (points per minute to points per ms)
      const lastDrain = Prayer.lastDrainTime[eid];
      const timeDelta = currentTime - lastDrain;
      const pointsDrained = (totalDrainRate / 60000) * timeDelta;

      Prayer.prayerPoints[eid] = Math.max(
        0,
        Prayer.prayerPoints[eid] - pointsDrained
      );
      Prayer.lastDrainTime[eid] = currentTime;

      // Deactivate prayers if out of points
      if (Prayer.prayerPoints[eid] === 0) {
        Prayer.activePrayers[eid] = 0;
      }
    }

    return world;
  });
};

// Helper functions
function bitToPrayerId(bit: number): PrayerId {
  // Map bit positions to prayer IDs
  const prayerMap: Record<number, PrayerId> = {
    0: PrayerId.ThickSkin,
    1: PrayerId.BurstOfStrength,
    2: PrayerId.ClarityOfThought,
    // ... map all prayers
  };
  return prayerMap[bit] || PrayerId.ThickSkin;
}

function getPrayerDrainRate(prayerId: PrayerId): number {
  const drainRates: Record<PrayerId, number> = {
    [PrayerId.ThickSkin]: 3,
    [PrayerId.BurstOfStrength]: 3,
    [PrayerId.ClarityOfThought]: 3,
    [PrayerId.RockSkin]: 6,
    [PrayerId.SuperhumanStrength]: 6,
    [PrayerId.ImprovedReflexes]: 6,
    [PrayerId.SteelSkin]: 12,
    [PrayerId.UltimateStrength]: 12,
    [PrayerId.IncredibleReflexes]: 12,
    [PrayerId.Piety]: 24,
    [PrayerId.Chivalry]: 24,
    [PrayerId.Rigour]: 24,
    [PrayerId.Augury]: 24,
    // ... all drain rates
  };
  return drainRates[prayerId] || 0;
}

// Entity creation helper
export function createPlayer(
  world: GameWorld,
  x: number,
  y: number,
  discordId: string
): number {
  const eid = addEntity(world);

  addComponent(world, Position, eid);
  Position.x[eid] = x;
  Position.y[eid] = y;

  addComponent(world, Velocity, eid);
  Velocity.x[eid] = 0;
  Velocity.y[eid] = 0;

  addComponent(world, Health, eid);
  Health.current[eid] = 100;
  Health.max[eid] = 100;

  // Add combat stats
  addComponent(world, CombatStats, eid);
  CombatStats.attackLevel[eid] = 1;
  CombatStats.strengthLevel[eid] = 1;
  CombatStats.defenceLevel[eid] = 1;
  CombatStats.rangedLevel[eid] = 1;
  CombatStats.magicLevel[eid] = 1;
  CombatStats.hitpointsLevel[eid] = 10;
  CombatStats.prayerLevel[eid] = 1;
  CombatStats.lastAttackTime[eid] = 0;
  CombatStats.targetEntity[eid] = 0;

  // Add prayer component
  addComponent(world, Prayer, eid);
  Prayer.activePrayers[eid] = 0;
  Prayer.prayerPoints[eid] = CombatStats.prayerLevel[eid];
  Prayer.maxPrayerPoints[eid] = CombatStats.prayerLevel[eid];
  Prayer.lastDrainTime[eid] = world.time.elapsed;

  return eid;
}

// System execution order
export const SYSTEM_ORDER = [
  "input",
  "movement",
  "combat",
  "prayer",
  "collision",
  "animation",
  "render",
] as const;
```

### Multiplayer Authority

- Server-authoritative design for all game logic
- Validate all client inputs server-side
- Use Colyseus for real-time synchronization
- Implement anti-cheat validation

#### Server Validation Example

```typescript
import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

// Define constants
const RUN_SPEED = 2; // tiles per tick
const WALK_SPEED = 1; // tiles per tick
const TICK_MS = 600; // OSRS tick duration

// Define schemas
class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("boolean") isRunning: boolean = false;
  @type("number") lastMoveTime: number = Date.now();
  // Combat stats
  @type("number") health: number = 100;
  @type("number") maxHealth: number = 100;
  @type("number") combatLevel: number = 3;
  @type("number") lastAttackTime: number = 0;
  @type("string") targetId: string = "";
  @type(["string"]) activePrayers: string[] = [];
  @type("number") prayerPoints: number = 1;
}

class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

// Anti-cheat validator class - moved outside GameRoom
class AntiCheatValidator {
  private playerStats: Map<
    string,
    {
      actions: Array<{ type: string; timestamp: number }>;
      violations: number;
    }
  > = new Map();

  validateAction(playerId: string, action: string, data: any): boolean {
    const stats = this.playerStats.get(playerId) || {
      actions: [],
      violations: 0,
    };

    // Add action to history
    stats.actions.push({ type: action, timestamp: Date.now() });

    // Keep only recent actions (last 60 seconds)
    const cutoff = Date.now() - 60000;
    stats.actions = stats.actions.filter((a) => a.timestamp > cutoff);

    // Check for suspicious patterns
    if (this.detectSuspiciousPattern(stats.actions)) {
      stats.violations++;
      this.playerStats.set(playerId, stats);

      if (stats.violations > 10) {
        return false; // Ban threshold
      }
    }

    this.playerStats.set(playerId, stats);
    return true;
  }

  private detectSuspiciousPattern(
    actions: Array<{ type: string; timestamp: number }>
  ): boolean {
    // Check for inhuman action rates
    const actionCounts = new Map<string, number>();
    for (const action of actions) {
      actionCounts.set(action.type, (actionCounts.get(action.type) || 0) + 1);
    }

    // More than 20 attacks per minute is suspicious
    if ((actionCounts.get("attack") || 0) > 20) return true;

    // More than 100 movements per minute is suspicious
    if ((actionCounts.get("move") || 0) > 100) return true;

    return false;
  }
}

export class GameRoom extends Room<GameState> {
  private antiCheat = new AntiCheatValidator();

  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("player_move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.warn(`Player ${client.sessionId} not found`);
        return;
      }

      // Validate with anti-cheat
      if (!this.antiCheat.validateAction(client.sessionId, "move", data)) {
        client.send("error", {
          code: "BANNED",
          message: "Too many violations detected",
        });
        client.leave();
        return;
      }

      // Validate movement
      const distance = Math.sqrt(
        Math.pow(data.x - player.x, 2) + Math.pow(data.y - player.y, 2)
      );

      const deltaTime = Date.now() - player.lastMoveTime;
      const ticksElapsed = Math.floor(deltaTime / TICK_MS);
      const maxSpeed = player.isRunning ? RUN_SPEED : WALK_SPEED;
      const maxDistance = maxSpeed * ticksElapsed;

      if (distance > maxDistance * 1.1) {
        // 10% tolerance for lag
        console.warn(
          `Player ${client.sessionId} moved too fast: ${distance} > ${maxDistance}`
        );
        client.send("error", {
          code: "INVALID_MOVEMENT",
          message: "Movement speed violation detected",
        });
        return;
      }

      // Apply validated movement
      player.x = data.x;
      player.y = data.y;
      player.lastMoveTime = Date.now();
    });

    // Combat action handler
    this.onMessage("attack", (client, data) => {
      const attacker = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetId);

      if (!attacker || !target) {
        client.send("error", {
          code: "INVALID_TARGET",
          message: "Invalid attack target",
        });
        return;
      }

      // Validate with anti-cheat
      if (!this.antiCheat.validateAction(client.sessionId, "attack", data)) {
        client.send("error", {
          code: "BANNED",
          message: "Too many violations detected",
        });
        client.leave();
        return;
      }

      // Validate attack timing
      const now = Date.now();
      const timeSinceLastAttack = now - attacker.lastAttackTime;
      const minAttackDelay = 2400; // 4-tick weapon minimum

      if (timeSinceLastAttack < minAttackDelay) {
        client.send("error", {
          code: "ATTACK_TOO_FAST",
          message: "Attack speed violation",
        });
        return;
      }

      // Validate distance
      const distance = Math.sqrt(
        Math.pow(target.x - attacker.x, 2) + Math.pow(target.y - attacker.y, 2)
      );

      const maxMeleeRange = 1; // 1 tile for melee
      if (distance > maxMeleeRange) {
        client.send("error", {
          code: "OUT_OF_RANGE",
          message: "Target is out of range",
        });
        return;
      }

      // Calculate damage (simplified)
      const maxHit = 10; // Should use full calculation
      const damage = Math.floor(Math.random() * (maxHit + 1));

      // Apply damage
      target.health = Math.max(0, target.health - damage);
      attacker.lastAttackTime = now;

      // Broadcast combat event
      this.broadcast("combat_hit", {
        attackerId: client.sessionId,
        targetId: data.targetId,
        damage,
        targetHealth: target.health,
      });

      // Handle death
      if (target.health === 0) {
        this.handlePlayerDeath(data.targetId);
      }
    });

    // Prayer toggle handler
    this.onMessage("toggle_prayer", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const prayerId = data.prayerId as string;

      // Validate prayer exists
      if (!Object.values(PrayerId).includes(prayerId as PrayerId)) {
        client.send("error", {
          code: "INVALID_PRAYER",
          message: "Unknown prayer",
        });
        return;
      }

      // Check prayer points
      if (
        player.prayerPoints <= 0 &&
        !player.activePrayers.includes(prayerId)
      ) {
        client.send("error", {
          code: "NO_PRAYER_POINTS",
          message: "Not enough prayer points",
        });
        return;
      }

      // Toggle prayer
      const index = player.activePrayers.indexOf(prayerId);
      if (index === -1) {
        // Validate prayer combination
        const newPrayers = [...player.activePrayers, prayerId];
        const validPrayers = validatePrayerCombination(
          newPrayers as PrayerId[]
        );
        player.activePrayers = validPrayers as string[];
      } else {
        player.activePrayers.splice(index, 1);
      }

      // Notify client
      client.send("prayers_updated", {
        activePrayers: player.activePrayers,
      });
    });
  }

  onJoin(client: Client, options: any) {
    const player = new Player();
    player.x = Math.random() * 500;
    player.y = Math.random() * 500;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
  }

  private handlePlayerDeath(playerId: string): void {
    const player = this.state.players.get(playerId);
    if (!player) return;

    // Reset player state
    player.health = player.maxHealth;
    player.x = Math.random() * 500;
    player.y = Math.random() * 500;
    player.activePrayers = [];

    // Broadcast death event
    this.broadcast("player_death", {
      playerId,
      respawnX: player.x,
      respawnY: player.y,
    });
  }
}
```

## Testing Requirements

### Coverage Standards

- Game logic: 95% coverage minimum
- OSRS calculations: 100% coverage required
- Multiplayer systems: Integration tests required
- Performance: Load tests with 4+ players

### Test Types

- Unit tests for all utility functions
- Integration tests for API endpoints
- Performance tests for ECS systems
- OSRS data validation against Wiki

#### Performance Test Example

```typescript
import { describe, it, expect, beforeEach } from "@jest/globals";
import { createWorld, addEntity, addComponent, IWorld } from "bitecs";
import {
  Position,
  Velocity,
  Health,
  CombatStats,
  Prayer,
  createMovementSystem,
  createCombatSystem,
  createPrayerSystem,
} from "../ecs/components";

// Extend IWorld for our game world
interface GameWorld extends IWorld {
  time: {
    delta: number;
    elapsed: number;
  };
}

describe("Combat System Performance", () => {
  it("should process 100 entities movement in under 16ms", () => {
    const world = createWorld() as GameWorld;
    world.time = { delta: 16, elapsed: 0 };

    const movementSystem = createMovementSystem();

    // Create 100 entities with movement components
    for (let i = 0; i < 100; i++) {
      const eid = addEntity(world);
      addComponent(world, Position, eid);
      addComponent(world, Velocity, eid);
      Position.x[eid] = Math.random() * 1000;
      Position.y[eid] = Math.random() * 1000;
      Velocity.x[eid] = (Math.random() - 0.5) * 100;
      Velocity.y[eid] = (Math.random() - 0.5) * 100;
    }

    const start = performance.now();
    movementSystem(world);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(16); // 60fps frame budget
    console.log(
      `Movement system processed 100 entities in ${duration.toFixed(2)}ms`
    );
  });

  it("should handle 100 combat calculations efficiently", () => {
    const world = createWorld() as GameWorld;
    world.time = { delta: 16, elapsed: 0 };

    // Create 100 combat entities
    const entities: number[] = [];
    for (let i = 0; i < 100; i++) {
      const eid = addEntity(world);
      addComponent(world, Position, eid);
      addComponent(world, Health, eid);
      addComponent(world, CombatStats, eid);

      Position.x[eid] = Math.random() * 1000;
      Position.y[eid] = Math.random() * 1000;
      Health.current[eid] = 100;
      Health.max[eid] = 100;
      CombatStats.attackLevel[eid] = 75;
      CombatStats.strengthLevel[eid] = 80;
      CombatStats.defenceLevel[eid] = 70;

      // Set target to next entity (circular)
      CombatStats.targetEntity[eid] = entities[(i + 1) % 100] || 0;

      entities.push(eid);
    }

    const combatSystem = createCombatSystem();

    // Measure combat system performance
    const iterations = 100;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      world.time.elapsed += 2400; // Advance to next attack cycle
      combatSystem(world);
    }

    const duration = performance.now() - start;
    const avgDuration = duration / iterations;

    expect(avgDuration).toBeLessThan(5); // Should process in under 5ms
    console.log(`Combat system avg duration: ${avgDuration.toFixed(2)}ms`);
  });

  it("should efficiently handle prayer calculations", () => {
    const world = createWorld() as GameWorld;
    world.time = { delta: 16, elapsed: 0 };

    const prayerSystem = createPrayerSystem();

    // Create players with active prayers
    for (let i = 0; i < 50; i++) {
      const eid = addEntity(world);
      addComponent(world, Prayer, eid);
      addComponent(world, CombatStats, eid);

      Prayer.prayerPoints[eid] = 50;
      Prayer.maxPrayerPoints[eid] = 50;
      Prayer.activePrayers[eid] = 0b111; // First 3 prayers active
      Prayer.lastDrainTime[eid] = world.time.elapsed;
    }

    const start = performance.now();

    // Simulate 1 minute of prayer drain
    for (let i = 0; i < 60; i++) {
      world.time.elapsed += 1000; // 1 second
      prayerSystem(world);
    }

    const duration = performance.now() - start;

    expect(duration).toBeLessThan(10); // Should complete in under 10ms
    console.log(`Prayer system (50 players, 60s): ${duration.toFixed(2)}ms`);
  });

  it("should validate OSRS combat formulas", () => {
    const player: Player = {
      attackLevel: 1,
      strengthLevel: 99,
      defenceLevel: 1,
      rangedLevel: 1,
      magicLevel: 1,
      attackBonus: 0,
      strengthBonus: 118, // Abyssal whip strength bonus
      rangedBonus: 0,
      rangedStrengthBonus: 0,
      magicBonus: 0,
      magicDamageBonus: 0,
      defenceBonus: 0,
      attackStyle: AttackStyle.Aggressive,
      combatType: CombatType.Melee,
      prayers: [],
    };

    // Without prayers
    const maxHitNoPrayer = calculateMaxHit(player);
    expect(maxHitNoPrayer).toBe(26);

    // With Piety
    player.prayers = [PrayerId.Piety];
    const maxHitWithPiety = calculateMaxHit(player);
    expect(maxHitWithPiety).toBe(31);
  });
});
```

## Code Quality

### Error Handling

- Use try-catch for all async operations
- Implement graceful error recovery
- Add structured logging with context
- Provide meaningful error messages

#### Error Handling Pattern

```typescript
// Define action types
type PlayerAction = {
  type: string;
  payload: unknown;
};

// Define Result type for error handling
type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

type GameError =
  | { type: "INVALID_INPUT"; message: string }
  | { type: "CALCULATION_ERROR"; message: string }
  | { type: "NETWORK_ERROR"; message: string };

// Logger interface
interface Logger {
  startSpan(name: string, tags: Record<string, unknown>): Span;
  error(message: string, context: Record<string, unknown>): void;
  warn(message: string, context: Record<string, unknown>): void;
  info(message: string, context: Record<string, unknown>): void;
}

interface Span {
  setTag(key: string, value: unknown): void;
  log(data: Record<string, unknown>): void;
  finish(): void;
}

// Simple logger implementation for examples
const createLogger = (): Logger => ({
  startSpan: (name, tags) => ({
    setTag: () => {},
    log: () => {},
    finish: () => {},
  }),
  error: (message, context) => console.error(message, context),
  warn: (message, context) => console.warn(message, context),
  info: (message, context) => console.log(message, context),
});

export class GameService {
  private logger: Logger;
  private perfMonitor: PerformanceMonitor;

  constructor(
    logger: Logger = createLogger(),
    perfMonitor: PerformanceMonitor = new PerformanceMonitor()
  ) {
    this.logger = logger;
    this.perfMonitor = perfMonitor;
  }

  async processPlayerAction(
    playerId: string,
    action: PlayerAction
  ): Promise<Result<void, GameError>> {
    return this.perfMonitor.measureAsync("processPlayerAction", async () => {
      const span = this.logger.startSpan("processPlayerAction", {
        playerId,
        actionType: action.type,
      });

      try {
        // Validate action
        const validationResult = await this.validateAction(playerId, action);
        if (!validationResult.success) {
          span.setTag("error", true);
          span.log({ error: validationResult.error });
          return validationResult;
        }

        // Execute action with timeout
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Action timeout")), 5000)
        );

        try {
          await Promise.race([this.executeAction(playerId, action), timeout]);
        } catch (error) {
          if (error instanceof Error && error.message === "Action timeout") {
            return {
              success: false,
              error: {
                type: "NETWORK_ERROR",
                message: "Action execution timed out",
                details: { action: action.type },
              },
            };
          }
          throw error;
        }

        span.finish();
        return { success: true, value: undefined };
      } catch (error) {
        span.setTag("error", true);
        span.log({
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });

        this.logger.error("Failed to process player action", {
          playerId,
          action,
          error: error instanceof Error ? error.message : String(error),
        });

        return {
          success: false,
          error: {
            type: "CALCULATION_ERROR",
            message: "Failed to process action",
            details: {
              originalError:
                error instanceof Error ? error.message : String(error),
              action: action.type,
            },
          },
        };
      } finally {
        span.finish();
      }
    });
  }

  private async validateAction(
    playerId: string,
    action: PlayerAction
  ): Promise<Result<void, GameError>> {
    // Example validation
    if (!action.type || typeof action.type !== "string") {
      return {
        success: false,
        error: {
          type: "INVALID_INPUT",
          message: "Action type must be a non-empty string",
        },
      };
    }
    return { success: true, value: undefined };
  }

  private async executeAction(
    playerId: string,
    action: PlayerAction
  ): Promise<void> {
    // Execute the action based on type
    this.logger.info("Executing action", { playerId, actionType: action.type });
  }
}
```

### Documentation

- JSDoc for all public APIs
- Include code examples in documentation
- Document OSRS Wiki sources for calculations
- Maintain architectural decision records

#### Documentation Example

````typescript
// Define skill interface
interface PlayerSkills {
  attack: number;
  strength: number;
  defence: number;
  hitpoints: number;
  prayer: number;
  ranged: number;
  magic: number;
}

/**
 * Calculates the combat level of a player following OSRS formula.
 *
 * @param skills - The player's skill levels
 * @returns The calculated combat level (3-126)
 *
 * @example
 * ```typescript
 * const skills = {
 *   attack: 75,
 *   strength: 80,
 *   defence: 70,
 *   hitpoints: 85,
 *   prayer: 52,
 *   ranged: 60,
 *   magic: 55
 * };
 *
 * const combatLevel = calculateCombatLevel(skills);
 * console.log(combatLevel); // 87
 * ```
 *
 * @see https://oldschool.runescape.wiki/w/Combat_level
 */
export function calculateCombatLevel(skills: PlayerSkills): number {
  const base =
    0.25 * (skills.defence + skills.hitpoints + Math.floor(skills.prayer / 2));

  const melee = 0.325 * (skills.attack + skills.strength);
  const range = 0.325 * Math.floor((3 * skills.ranged) / 2);
  const mage = 0.325 * Math.floor((3 * skills.magic) / 2);

  return Math.floor(base + Math.max(melee, range, mage));
}

/**
 * Calculates accuracy (hit chance) for combat following OSRS formula.
 *
 * @param attacker - Attacking player's stats
 * @param defender - Defending player's stats
 * @returns Hit chance as a decimal (0-1)
 *
 * @example
 * ```typescript
 * const attacker = {
 *   attackLevel: 75,
 *   attackBonus: 82,
 *   attackStyle: AttackStyle.Aggressive,
 *   prayers: [PrayerId.Piety]
 * };
 *
 * const defender = {
 *   defenceLevel: 70,
 *   defenceBonus: 150,
 *   prayers: [PrayerId.SteelSkin]
 * };
 *
 * const hitChance = calculateAccuracy(attacker, defender);
 * console.log(`Hit chance: ${(hitChance * 100).toFixed(1)}%`); // Hit chance: 45.2%
 * ```
 *
 * @see https://oldschool.runescape.wiki/w/Accuracy
 */
export function calculateAccuracy(
  attacker: Partial<Player>,
  defender: Partial<Player>
): number {
  // Implementation would go here
  return 0.5; // Placeholder
}
````

## Performance Monitoring

### Metrics Collection

```typescript
interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

interface MetricStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private readonly maxMetricsPerOperation = 1000;
  private alertCallbacks: ((alert: PerformanceAlert) => void)[] = [];

  measure<T>(operation: string, fn: () => T): T {
    const start = performance.now();
    let success = true;

    try {
      const result = fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        success,
      });
    }
  }

  async measureAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    let success = true;

    try {
      const result = await fn();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - start;
      this.recordMetric({
        operation,
        duration,
        timestamp: Date.now(),
        success,
      });
    }
  }

  /**
   * Register alert callback for performance issues
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  private recordMetric(metric: PerformanceMetrics): void {
    if (!this.metrics.has(metric.operation)) {
      this.metrics.set(metric.operation, []);
    }

    const operationMetrics = this.metrics.get(metric.operation)!;
    operationMetrics.push(metric);

    // Keep only recent metrics
    if (operationMetrics.length > this.maxMetricsPerOperation) {
      operationMetrics.shift();
    }

    // Check for performance degradation
    this.checkPerformance(metric);
  }

  private checkPerformance(metric: PerformanceMetrics): void {
    const operationMetrics = this.metrics.get(metric.operation);
    if (!operationMetrics || operationMetrics.length < 10) return;

    const recent = operationMetrics.slice(-10);
    const avgDuration =
      recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;

    // Alert if average duration exceeds thresholds
    const thresholds: Record<string, number> = {
      processPlayerAction: 50,
      calculateCombatDamage: 5,
      validateMovement: 2,
      default: 100,
    };

    const threshold = thresholds[metric.operation] || thresholds.default;

    if (avgDuration > threshold) {
      const alert: PerformanceAlert = {
        operation: metric.operation,
        avgDuration,
        threshold,
        timestamp: Date.now(),
        severity: avgDuration > threshold * 2 ? "critical" : "warning",
      };

      this.alertCallbacks.forEach((cb) => cb(alert));
    }
  }

  getReport(): Record<string, MetricStats> {
    const report: Record<string, MetricStats> = {};

    for (const [operation, metrics] of this.metrics) {
      const durations = metrics.map((m) => m.duration);
      const sorted = [...durations].sort((a, b) => a - b);

      report[operation] = {
        count: durations.length,
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: sorted[0] || 0,
        max: sorted[sorted.length - 1] || 0,
        p50: sorted[Math.floor(sorted.length * 0.5)] || 0,
        p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
        p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
      };
    }

    return report;
  }

  /**
   * Get performance summary for monitoring
   */
  getSummary(): PerformanceSummary {
    const operations: OperationSummary[] = [];

    for (const [operation, metrics] of this.metrics) {
      const stats = this.getReport()[operation];
      const recent = metrics.slice(-100);
      const errorRate = recent.filter((m) => !m.success).length / recent.length;

      operations.push({
        name: operation,
        ...stats,
        errorRate,
        throughput:
          recent.length /
            ((recent[recent.length - 1]?.timestamp - recent[0]?.timestamp) /
              1000) || 0,
      });
    }

    return {
      timestamp: Date.now(),
      operations,
      totalOperations: operations.reduce((sum, op) => sum + op.count, 0),
      overallErrorRate:
        operations.reduce((sum, op) => sum + op.errorRate * op.count, 0) /
          operations.reduce((sum, op) => sum + op.count, 0) || 0,
    };
  }

  clearMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
    } else {
      this.metrics.clear();
    }
  }
}

// Type definitions
interface PerformanceAlert {
  operation: string;
  avgDuration: number;
  threshold: number;
  timestamp: number;
  severity: "warning" | "critical";
}

interface OperationSummary extends MetricStats {
  name: string;
  errorRate: number;
  throughput: number;
}

interface PerformanceSummary {
  timestamp: number;
  operations: OperationSummary[];
  totalOperations: number;
  overallErrorRate: number;
}

// Global instance for easy access
export const perfMonitor = new PerformanceMonitor();

// Set up performance alerts
perfMonitor.onAlert((alert) => {
  console.warn(`Performance Alert [${alert.severity}]:`, {
    operation: alert.operation,
    avgDuration: `${alert.avgDuration.toFixed(2)}ms`,
    threshold: `${alert.threshold}ms`,
  });
});
```
