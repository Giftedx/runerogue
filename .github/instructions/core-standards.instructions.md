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

#### Example Validation

```typescript
// Import from actual packages when available
// For now, use type imports to avoid runtime errors
import type { CombatStats, PlayerStats } from "@runerogue/shared";

// Example validation against known OSRS values
function validateCombatCalculation(playerStats: PlayerStats): boolean {
  const expectedMaxHit = 15; // From OSRS Wiki for specific gear
  const calculatedMaxHit = calculateMaxHit(playerStats);
  return calculatedMaxHit === expectedMaxHit;
}

// Placeholder for actual implementation
function calculateMaxHit(stats: PlayerStats): number {
  // Implementation should use OSRS formulas from packages/osrs-data
  return 0;
}
```

### Data Validation

- Cross-reference all stats with OSRS Wiki
- Use existing OSRS data pipeline for validation
- Test calculations against known OSRS values
- Document Wiki sources in code comments

### OSRS Game Constants

```typescript
// OSRS movement speeds (tiles per game tick)
export const OSRS_WALK_SPEED = 1; // 1 tile per tick when walking
export const OSRS_RUN_SPEED = 2; // 2 tiles per tick when running

// OSRS tick rate
export const OSRS_TICK_MS = 600; // 0.6 seconds per game tick

// Combat ticks
export const WEAPON_SPEEDS = {
  FAST: 4, // 2.4 seconds
  AVERAGE: 5, // 3.0 seconds
  SLOW: 6, // 3.6 seconds
} as const;

// Attack styles and their bonuses
export const ATTACK_STYLE_BONUSES = {
  ACCURATE: { attack: 3, strength: 0, defence: 0 },
  AGGRESSIVE: { attack: 0, strength: 3, defence: 0 },
  DEFENSIVE: { attack: 0, strength: 0, defence: 3 },
  CONTROLLED: { attack: 1, strength: 1, defence: 1 },
} as const;

// Prayer bonus multipliers
export const PRAYER_BONUSES = {
  // Attack prayers
  CLARITY_OF_THOUGHT: {
    attack: 1.05,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },
  IMPROVED_REFLEXES: {
    attack: 1.1,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },
  INCREDIBLE_REFLEXES: {
    attack: 1.15,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },

  // Strength prayers
  BURST_OF_STRENGTH: {
    attack: 1.0,
    strength: 1.05,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },
  SUPERHUMAN_STRENGTH: {
    attack: 1.0,
    strength: 1.1,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },
  ULTIMATE_STRENGTH: {
    attack: 1.0,
    strength: 1.15,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },

  // Defence prayers
  THICK_SKIN: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.05,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },
  ROCK_SKIN: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.1,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },
  STEEL_SKIN: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.15,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },

  // Ranged prayers
  SHARP_EYE: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.05,
    rangedStrength: 1.05,
    magic: 1.0,
  },
  HAWK_EYE: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.1,
    rangedStrength: 1.1,
    magic: 1.0,
  },
  EAGLE_EYE: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.15,
    rangedStrength: 1.15,
    magic: 1.0,
  },

  // Magic prayers
  MYSTIC_WILL: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.05,
  },
  MYSTIC_LORE: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.1,
  },
  MYSTIC_MIGHT: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.0,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.15,
  },

  // Combined prayers
  CHIVALRY: {
    attack: 1.15,
    strength: 1.18,
    defence: 1.2,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },
  PIETY: {
    attack: 1.2,
    strength: 1.23,
    defence: 1.25,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.0,
  },
  RIGOUR: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.25,
    ranged: 1.2,
    rangedStrength: 1.23,
    magic: 1.0,
  },
  AUGURY: {
    attack: 1.0,
    strength: 1.0,
    defence: 1.25,
    ranged: 1.0,
    rangedStrength: 1.0,
    magic: 1.25,
  },
} as const;

// Prayer drain rates (points per minute)
export const PRAYER_DRAIN_RATES = {
  THICK_SKIN: 1,
  BURST_OF_STRENGTH: 1,
  CLARITY_OF_THOUGHT: 1,
  ROCK_SKIN: 2,
  SUPERHUMAN_STRENGTH: 2,
  IMPROVED_REFLEXES: 2,
  RAPID_RESTORE: 0.5,
  RAPID_HEAL: 0.5,
  PROTECT_ITEM: 0.5,
  STEEL_SKIN: 4,
  ULTIMATE_STRENGTH: 4,
  INCREDIBLE_REFLEXES: 4,
  PROTECT_FROM_MAGIC: 4,
  PROTECT_FROM_MISSILES: 4,
  PROTECT_FROM_MELEE: 4,
  CHIVALRY: 24,
  PIETY: 24,
  RIGOUR: 24,
  AUGURY: 24,
} as const;
```

## TypeScript Standards

### Type Safety

- Use strict TypeScript settings, no `any` types
- Define proper interfaces for all game data structures
- Add comprehensive JSDoc documentation
- Implement proper error handling with Result types

#### Enhanced Result Type Pattern

```typescript
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export type GameError =
  | { type: "INVALID_INPUT"; message: string }
  | { type: "CALCULATION_ERROR"; message: string }
  | { type: "NETWORK_ERROR"; message: string }
  | { type: "VALIDATION_ERROR"; message: string; details?: unknown };

// Define attack style type
export type AttackStyle =
  | "accurate"
  | "aggressive"
  | "defensive"
  | "controlled";

// Define combat type
export type CombatType = "melee" | "ranged" | "magic";

// Define combat stats interface
export interface CombatStats {
  attackLevel: number;
  strengthLevel: number;
  defenceLevel: number;
  attackBonus: number;
  strengthBonus: number;
  defenceBonus: number;
  attackStyle: AttackStyle;
  combatType: CombatType;
  prayers: string[];
}

// Complete combat calculation implementation
export class CombatCalculator {
  /**
   * Calculate damage dealt by attacker to defender
   * @see https://oldschool.runescape.wiki/w/Damage_per_second/Melee
   */
  static calculateDamage(attacker: CombatStats, defender: CombatStats): number {
    const hitChance = this.calculateHitChance(attacker, defender);
    const maxHit = this.calculateMaxHit(attacker);

    // Roll for hit
    if (Math.random() > hitChance) {
      return 0; // Miss
    }

    // Roll damage between 0 and max hit
    return Math.floor(Math.random() * (maxHit + 1));
  }

  /**
   * Calculate maximum hit for attacker
   * @see https://oldschool.runescape.wiki/w/Maximum_hit
   */
  static calculateMaxHit(attacker: CombatStats): number {
    let effectiveStrength = attacker.strengthLevel + 8;

    // Apply prayer bonuses
    for (const prayer of attacker.prayers) {
      const bonus = PRAYER_BONUSES[prayer as keyof typeof PRAYER_BONUSES];
      if (bonus && "strength" in bonus && bonus.strength > 1.0) {
        effectiveStrength = Math.floor(effectiveStrength * bonus.strength);
        break; // Only one strength prayer can be active
      }
    }

    // Apply stance bonus
    const stanceBonus =
      ATTACK_STYLE_BONUSES[
        attacker.attackStyle.toUpperCase() as keyof typeof ATTACK_STYLE_BONUSES
      ];
    if (stanceBonus) {
      effectiveStrength += stanceBonus.strength;
    }

    // Calculate base damage
    const baseDamage =
      0.5 + (effectiveStrength * (attacker.strengthBonus + 64)) / 640;

    return Math.floor(baseDamage);
  }

  /**
   * Calculate hit chance of attacker against defender
   * @see https://oldschool.runescape.wiki/w/Accuracy
   */
  static calculateHitChance(
    attacker: CombatStats,
    defender: CombatStats
  ): number {
    const attackRoll = this.calculateAttackRoll(attacker);
    const defenceRoll = this.calculateDefenceRoll(defender);

    if (attackRoll > defenceRoll) {
      return 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
    } else {
      return attackRoll / (2 * (defenceRoll + 1));
    }
  }

  private static calculateAttackRoll(attacker: CombatStats): number {
    let effectiveAttack = attacker.attackLevel + 8;

    // Apply prayer bonuses
    for (const prayer of attacker.prayers) {
      const bonus = PRAYER_BONUSES[prayer as keyof typeof PRAYER_BONUSES];
      if (bonus && "attack" in bonus && bonus.attack > 1.0) {
        effectiveAttack = Math.floor(effectiveAttack * bonus.attack);
        break; // Only one attack prayer can be active
      }
    }

    // Apply stance bonus
    const stanceBonus =
      ATTACK_STYLE_BONUSES[
        attacker.attackStyle.toUpperCase() as keyof typeof ATTACK_STYLE_BONUSES
      ];
    if (stanceBonus) {
      effectiveAttack += stanceBonus.attack;
    }

    return effectiveAttack * (attacker.attackBonus + 64);
  }

  private static calculateDefenceRoll(defender: CombatStats): number {
    let effectiveDefence = defender.defenceLevel + 8;

    // Apply prayer bonuses
    for (const prayer of defender.prayers) {
      const bonus = PRAYER_BONUSES[prayer as keyof typeof PRAYER_BONUSES];
      if (bonus && "defence" in bonus && bonus.defence > 1.0) {
        effectiveDefence = Math.floor(effectiveDefence * bonus.defence);
        break; // Only one defence prayer can be active
      }
    }

    // Apply stance bonus if defensive
    const stanceBonus =
      ATTACK_STYLE_BONUSES[
        defender.attackStyle.toUpperCase() as keyof typeof ATTACK_STYLE_BONUSES
      ];
    if (stanceBonus) {
      effectiveDefence += stanceBonus.defence;
    }

    return effectiveDefence * (defender.defenceBonus + 64);
  }
}

// Safe calculation with error handling
export function calculateDamage(
  attacker: CombatStats,
  defender: CombatStats
): Result<number, GameError> {
  // Validate inputs
  if (!attacker || !defender) {
    return {
      success: false,
      error: { type: "INVALID_INPUT", message: "Missing combat stats" },
    };
  }

  // Validate attacker levels
  const attackerLevels = [
    { name: "attackLevel", value: attacker.attackLevel },
    { name: "strengthLevel", value: attacker.strengthLevel },
    { name: "defenceLevel", value: attacker.defenceLevel },
  ];

  for (const { name, value } of attackerLevels) {
    if (value < 1 || value > 99) {
      return {
        success: false,
        error: {
          type: "VALIDATION_ERROR",
          message: `${name} must be between 1 and 99`,
          details: { [name]: value },
        },
      };
    }
  }

  // Validate defender levels
  const defenderLevels = [
    { name: "defenceLevel", value: defender.defenceLevel },
  ];

  for (const { name, value } of defenderLevels) {
    if (value < 1 || value > 99) {
      return {
        success: false,
        error: {
          type: "VALIDATION_ERROR",
          message: `Defender ${name} must be between 1 and 99`,
          details: { [name]: value },
        },
      };
    }
  }

  // Validate combat types
  const validCombatTypes = ["melee", "ranged", "magic"];
  if (!validCombatTypes.includes(attacker.combatType)) {
    return {
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "Invalid combat type",
        details: { combatType: attacker.combatType },
      },
    };
  }

  // Validate attack styles
  const validAttackStyles = [
    "accurate",
    "aggressive",
    "defensive",
    "controlled",
  ];
  if (
    !validAttackStyles.includes(attacker.attackStyle) ||
    !validAttackStyles.includes(defender.attackStyle)
  ) {
    return {
      success: false,
      error: {
        type: "VALIDATION_ERROR",
        message: "Invalid attack style",
        details: {
          attackerStyle: attacker.attackStyle,
          defenderStyle: defender.attackStyle,
        },
      },
    };
  }

  try {
    const damage = CombatCalculator.calculateDamage(attacker, defender);
    return { success: true, value: damage };
  } catch (error) {
    return {
      success: false,
      error: {
        type: "CALCULATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
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
- Maximum 16ms per frame budget

## Architecture Patterns

### ECS (Entity Component System) Design with bitECS

- **Components**: Data-only structures, no logic
- **Systems**: Pure functions that operate on components
- **Queries**: Cached and optimized for performance
- **Entity Lifecycle**: Proper creation and destruction

#### bitECS Implementation Pattern

```typescript
import {
  defineComponent,
  defineQuery,
  defineSystem,
  addEntity,
  addComponent,
  removeEntity,
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

export const Combat = defineComponent({
  attackLevel: Types.ui8,
  strengthLevel: Types.ui8,
  defenceLevel: Types.ui8,
  attackBonus: Types.i16,
  strengthBonus: Types.i16,
  defenceBonus: Types.i16,
});

// Define queries
const movementQuery = defineQuery([Position, Velocity]);
const combatQuery = defineQuery([Position, Health, Combat]);

// Extend IWorld with custom properties
export interface GameWorld extends IWorld {
  time: {
    delta: number;
    elapsed: number;
  };
  entityToPlayer: Map<number, string>; // entity ID to player session ID
}

// Define systems - logic only
export const createMovementSystem = () => {
  return defineSystem((world: GameWorld) => {
    const entities = movementQuery(world);
    const deltaTime = world.time.delta / 1000;

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];

      // Store previous position for collision rollback
      const prevX = Position.x[eid];
      const prevY = Position.y[eid];

      Position.x[eid] += Velocity.x[eid] * deltaTime;
      Position.y[eid] += Velocity.y[eid] * deltaTime;

      // Clamp to world bounds
      Position.x[eid] = Math.max(0, Math.min(1000, Position.x[eid]));
      Position.y[eid] = Math.max(0, Math.min(1000, Position.y[eid]));

      // If position was clamped, stop velocity in that direction
      if (Position.x[eid] === 0 || Position.x[eid] === 1000) {
        Velocity.x[eid] = 0;
      }
      if (Position.y[eid] === 0 || Position.y[eid] === 1000) {
        Velocity.y[eid] = 0;
      }
    }

    return world;
  });
};

// Entity creation helper
export function createPlayer(
  world: GameWorld,
  x: number,
  y: number,
  sessionId: string
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

  addComponent(world, Combat, eid);
  Combat.attackLevel[eid] = 1;
  Combat.strengthLevel[eid] = 1;
  Combat.defenceLevel[eid] = 1;
  Combat.attackBonus[eid] = 0;
  Combat.strengthBonus[eid] = 0;
  Combat.defenceBonus[eid] = 0;

  // Map entity to player session
  world.entityToPlayer.set(eid, sessionId);

  return eid;
}

// Entity removal helper
export function removePlayer(world: GameWorld, eid: number): void {
  world.entityToPlayer.delete(eid);
  removeEntity(world, eid);
}
```

### Server Design

- **Colyseus Rooms**: Handle 2-4 player game sessions
- **Express APIs**: Serve OSRS data and static content
- **Schema-based State**: Use @colyseus/schema for synchronization
- **Modular Packages**: Separate concerns (osrs-data, game-server, shared)

### Client Architecture

- **Single Web Client**: Phaser + React hybrid for Discord Activities
- **Real-time Sync**: WebSocket connection to Colyseus rooms
- **Responsive Design**: Target 60fps rendering
- **State Management**: Client-side prediction with server authority

### Multiplayer Authority

- **Server-authoritative**: All game logic and validation on server
- **Client Prediction**: Smooth movement and interaction feedback
- **State Synchronization**: Efficient delta updates via Colyseus
- **Anti-cheat**: Server validates all player actions and state changes

#### Enhanced Validation Example

```typescript
import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";

// Import constants
const OSRS_RUN_SPEED = 2;
const OSRS_WALK_SPEED = 1;
const OSRS_TICK_MS = 600;

// Define state schemas
class Position extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
}

class Player extends Schema {
  @type(Position) position = new Position();
  @type("number") lastMoveTime: number = Date.now();
  @type("boolean") isRunning: boolean = false;
  @type("string") sessionId: string = "";
}

class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

interface MoveData {
  x: number;
  y: number;
}

// Server-side validation in a Colyseus room
export class GameRoom extends Room<GameState> {
  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("move", (client: Client, data: MoveData) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        client.send("error", { code: "PLAYER_NOT_FOUND" });
        return;
      }

      const distance = Math.sqrt(
        Math.pow(data.x - player.position.x, 2) +
          Math.pow(data.y - player.position.y, 2)
      );

      // Calculate max allowed distance based on time elapsed
      const deltaTime = Date.now() - player.lastMoveTime;
      const ticksElapsed = deltaTime / OSRS_TICK_MS;
      const maxSpeed = player.isRunning ? OSRS_RUN_SPEED : OSRS_WALK_SPEED;
      const maxDistance = maxSpeed * ticksElapsed;

      if (distance > maxDistance * 1.1) {
        // 10% tolerance for lag
        // Reject invalid movement
        client.send("error", {
          code: "INVALID_MOVEMENT",
          message: "Movement speed violation detected",
          details: { distance, maxDistance, deltaTime },
        });

        // Snap player back to valid position
        client.send("position_correction", {
          x: player.position.x,
          y: player.position.y,
        });
        return;
      }

      // Apply validated movement
      player.position.x = data.x;
      player.position.y = data.y;
      player.lastMoveTime = Date.now();
    });
  }

  onJoin(client: Client, options: any) {
    const player = new Player();
    player.sessionId = client.sessionId;
    player.position.x = Math.random() * 500;
    player.position.y = Math.random() * 500;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
  }
}
```

## Testing Requirements

### Current Test Status

- **Passing Tests**: 27 tests across core packages
- **Failing Tests**: 79 tests (mostly archived legacy tests with missing dependencies)
- **Priority**: Stabilize core functionality tests before adding new features
- **Test Organization**: Active tests in packages/, archived tests need cleanup

### Coverage Standards

- **OSRS Calculations**: 100% coverage required for combat formulas
- **Core Game Logic**: 95% coverage minimum for game server functionality
- **API Endpoints**: Integration tests for all OSRS data access
- **Client Integration**: Connection and synchronization tests needed

### Test Types

- **Unit Tests**: Individual function validation (Jest)
- **Integration Tests**: API endpoint and data pipeline tests
- **OSRS Validation**: Calculations against known Wiki values
- **Multiplayer Tests**: Colyseus room and state synchronization
- **Performance Tests**: Frame rate and tick rate validation

#### Complete Test Structure Example

```typescript
import { describe, it, expect, beforeEach } from "@jest/globals";

// Import constants from the actual implementation
import {
  WEAPON_SPEEDS,
  OSRS_TICK_MS,
  PRAYER_BONUSES,
  ATTACK_STYLE_BONUSES,
  type CombatStats,
  type AttackStyle,
  CombatCalculator,
} from "./combat-implementation"; // This would be the actual implementation file

describe("CombatCalculator", () => {
  describe("OSRS Authenticity", () => {
    it("should match OSRS Wiki damage formula for bronze scimitar", () => {
      const attacker: CombatStats = {
        attackLevel: 10,
        strengthLevel: 10,
        defenceLevel: 10,
        attackBonus: 7, // Bronze scimitar slash bonus
        strengthBonus: 8, // Bronze scimitar strength bonus
        defenceBonus: 0,
        attackStyle: "aggressive",
        combatType: "melee",
        prayers: [],
      };

      const defender: CombatStats = {
        attackLevel: 1,
        strengthLevel: 1,
        defenceLevel: 1,
        attackBonus: 0,
        strengthBonus: 0,
        defenceBonus: 0,
        attackStyle: "accurate",
        combatType: "melee",
        prayers: [],
      };

      // Expected max hit from OSRS Wiki for these stats
      // effectiveStrength = 10 + 8 + 3 (aggressive) = 21
      // maxHit = floor(0.5 + 21 * (8 + 64) / 640) = floor(0.5 + 1512 / 640) = floor(2.8625) = 2
      const expectedMaxHit = 2;
      const calculatedMaxHit = CombatCalculator.calculateMaxHit(attacker);

      expect(calculatedMaxHit).toBe(expectedMaxHit);
    });

    it("should apply prayer bonuses correctly", () => {
      const baseStats: CombatStats = {
        attackLevel: 50,
        strengthLevel: 50,
        defenceLevel: 50,
        attackBonus: 50,
        strengthBonus: 50,
        defenceBonus: 50,
        attackStyle: "aggressive",
        combatType: "melee",
        prayers: ["ULTIMATE_STRENGTH"], // 15% strength bonus
      };

      const withoutPrayer: CombatStats = { ...baseStats, prayers: [] };
      const withPrayer = baseStats;

      const maxHitWithoutPrayer =
        CombatCalculator.calculateMaxHit(withoutPrayer);
      const maxHitWithPrayer = CombatCalculator.calculateMaxHit(withPrayer);

      // Prayer should increase max hit
      expect(maxHitWithPrayer).toBeGreaterThan(maxHitWithoutPrayer);

      // Calculate expected values
      // Without prayer: effectiveStrength = 50 + 8 + 3 = 61
      // With prayer: effectiveStrength = floor((50 + 8) * 1.15) + 3 = floor(66.7) + 3 = 69
      const expectedWithoutPrayer = Math.floor(0.5 + (61 * (50 + 64)) / 640); // floor(0.5 + 6954/640) = floor(11.37) = 11
      const expectedWithPrayer = Math.floor(0.5 + (69 * (50 + 64)) / 640); // floor(0.5 + 7866/640) = floor(12.79) = 12

      expect(maxHitWithoutPrayer).toBe(11);
      expect(maxHitWithPrayer).toBe(12);
    });

    it("should handle Piety prayer correctly", () => {
      const attacker: CombatStats = {
        attackLevel: 75,
        strengthLevel: 80,
        defenceLevel: 70,
        attackBonus: 100,
        strengthBonus: 100,
        defenceBonus: 100,
        attackStyle: "aggressive",
        combatType: "melee",
        prayers: ["PIETY"], // 20% attack, 23% strength, 25% defence
      };

      // effectiveStrength = floor((80 + 8) * 1.23) + 3 = floor(108.24) + 3 = 111
      // maxHit = floor(0.5 + 111 * (100 + 64) / 640) = floor(0.5 + 18204/640) = floor(28.94) = 28
      const expectedMaxHit = 28;
      const calculatedMaxHit = CombatCalculator.calculateMaxHit(attacker);

      expect(calculatedMaxHit).toBe(expectedMaxHit);
    });
  });

  describe("Performance", () => {
    it("should calculate 1000 combat rounds in <16ms", () => {
      const attacker: CombatStats = {
        attackLevel: 75,
        strengthLevel: 80,
        defenceLevel: 70,
        attackBonus: 100,
        strengthBonus: 100,
        defenceBonus: 100,
        attackStyle: "aggressive",
        combatType: "melee",
        prayers: ["PIETY"],
      };

      const defender: CombatStats = {
        attackLevel: 70,
        strengthLevel: 70,
        defenceLevel: 70,
        attackBonus: 150,
        strengthBonus: 150,
        defenceBonus: 150,
        attackStyle: "defensive",
        combatType: "melee",
        prayers: ["STEEL_SKIN"],
      };

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        CombatCalculator.calculateHitChance(attacker, defender);
        CombatCalculator.calculateDamage(attacker, defender);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(16); // Must fit in one frame
    });
  });

  describe("Attack Speed", () => {
    it("should respect OSRS weapon speeds", () => {
      const weapons = [
        { name: "scimitar", speed: WEAPON_SPEEDS.FAST },
        { name: "longsword", speed: WEAPON_SPEEDS.AVERAGE },
        { name: "2h_sword", speed: WEAPON_SPEEDS.SLOW },
      ];

      weapons.forEach((weapon) => {
        const attackCooldown = weapon.speed * OSRS_TICK_MS;
        expect(attackCooldown).toBe(weapon.speed * 600);
      });
    });
  });
});
```

## Code Quality

### Error Handling

- Use try-catch for all async operations
- Implement graceful error recovery
- Add structured logging with context
- Provide meaningful error messages
- Never expose internal errors to clients

#### Enhanced Error Handling Pattern

```typescript
// Define base error classes
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GameError";
  }
}

export class ValidationError extends GameError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", context);
  }
}

export class CombatError extends GameError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "COMBAT_ERROR", context);
  }
}

// Define types for client and action
export interface GameClient {
  sessionId: string;
  send(event: string, data: any): void;
}

export interface PlayerAction {
  type: string;
  payload: unknown;
}

// Define logger interface
export interface Logger {
  startSpan(name: string, tags: Record<string, unknown>): Span;
  warn(message: string, context: Record<string, unknown>): void;
  error(message: string, context: Record<string, unknown>): void;
  info(message: string, context: Record<string, unknown>): void;
}

export interface Span {
  setTag(key: string, value: unknown): void;
  log(event: Record<string, unknown>): void;
  finish(): void;
}

// Create a basic logger implementation
export const createLogger = (): Logger => ({
  startSpan: (name, tags) => ({
    setTag: () => {},
    log: () => {},
    finish: () => {},
  }),
  warn: (message, context) => console.warn(message, context),
  error: (message, context) => console.error(message, context),
  info: (message, context) => console.log(message, context),
});

// Validation and execution functions
export async function validateAction(action: PlayerAction): Promise<void> {
  if (!action.type) {
    throw new ValidationError("Action type is required");
  }

  if (typeof action.type !== "string") {
    throw new ValidationError("Action type must be a string", {
      receivedType: typeof action.type,
    });
  }
}

export async function executeAction(
  client: GameClient,
  action: PlayerAction
): Promise<void> {
  // Execute the action based on type
  switch (action.type) {
    case "move":
      // Handle movement
      break;
    case "attack":
      // Handle attack
      break;
    default:
      throw new ValidationError(`Unknown action type: ${action.type}`);
  }
}

// Main error handling example
export async function handlePlayerAction(
  client: GameClient,
  action: PlayerAction,
  logger: Logger = createLogger()
): Promise<void> {
  const span = logger.startSpan("handlePlayerAction", {
    playerId: client.sessionId,
    actionType: action.type,
  });

  try {
    await validateAction(action);
    await executeAction(client, action);
    span.setTag("success", true);
  } catch (error) {
    span.setTag("error", true);
    span.log({
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (error instanceof ValidationError) {
      logger.warn("Validation failed", {
        error: error.message,
        code: error.code,
        context: error.context,
        playerId: client.sessionId,
      });
      client.send("error", {
        code: error.code,
        message: "Invalid action",
      });
    } else if (error instanceof GameError) {
      logger.warn("Game error", {
        error: error.message,
        code: error.code,
        context: error.context,
        playerId: client.sessionId,
      });
      client.send("error", { code: error.code });
    } else {
      logger.error("Unexpected error", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        playerId: client.sessionId,
      });
      client.send("error", { code: "INTERNAL_ERROR" });
    }
  } finally {
    span.finish();
  }
}
```

## Performance Benchmarking

### Required Benchmarks

- **Frame Time**: <16ms (60fps) with 4 players + 20 enemies
- **Network Latency**: <100ms round trip
- **State Updates**: <5ms per tick
- **Memory Usage**: <100MB per game room

### Enhanced Profiling Tools

```typescript
// Performance monitoring utility with percentiles
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxSamples = 1000;

  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    this.recordMetric(name, duration);
    return result;
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    this.recordMetric(name, duration);
    return result;
  }

  private recordMetric(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const samples = this.metrics.get(name)!;
    samples.push(duration);

    // Keep only recent samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }

  getStats(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const times = this.metrics.get(name) || [];
    if (times.length === 0) {
      return null;
    }

    const sorted = [...times].sort((a, b) => a - b);

    return {
      count: times.length,
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  logReport(): void {
    console.log("=== Performance Report ===");
    for (const [name, _] of this.metrics) {
      const stats = this.getStats(name);
      if (stats) {
        console.log(`${name}:`, {
          avg: `${stats.avg.toFixed(2)}ms`,
          p95: `${stats.p95.toFixed(2)}ms`,
          p99: `${stats.p99.toFixed(2)}ms`,
        });
      }
    }

    this.reset();
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Global instance
export const perfMonitor = new PerformanceMonitor();
```

## Deployment Standards

### Build Requirements

- **Zero TypeScript Errors**: Strict mode enabled
- **Test Coverage**: Meet minimum coverage requirements
- **Bundle Size**: Monitor and optimize bundle sizes
- **Performance Tests**: Pass all benchmarks

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type Check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test --coverage --testPathIgnorePatterns="archived"

      - name: Performance Test
        run: pnpm test:performance

      - name: Build
        run: pnpm build

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Check bundle size
        run: pnpm size-limit
```

### Monitoring

- **Application Metrics**: Response times, error rates
- **Game Metrics**: Player count, room stability
- **Performance Metrics**: FPS, tick rate, memory usage
- **Business Metrics**: Player retention, session duration

## Security Guidelines

### Input Validation

- Validate all client inputs on server
- Use schema validation for complex data
- Implement rate limiting for actions
- Sanitize user-generated content

### Data Protection

- Never trust client-side data
- Implement proper session management
- Use secure WebSocket connections
- Log security events for monitoring

Remember: Every line of code should maintain OSRS authenticity while delivering smooth, secure multiplayer gameplay.
