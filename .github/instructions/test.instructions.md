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
  strengthLevel: number;
  strengthBonus: number;
  equipmentStrengthBonus: number;
  attackStyle: AttackStyle;
  prayers: PrayerId[];
}

enum AttackStyle {
  Accurate = "accurate",
  Aggressive = "aggressive",
  Defensive = "defensive",
  Controlled = "controlled",
}

enum PrayerId {
  UltimateStrength = "ultimate_strength",
  IncredibleReflexes = "incredible_reflexes",
  Clarity = "clarity_of_thought",
}

/**
 * Calculate max hit following OSRS formula
 * @see https://oldschool.runescape.wiki/w/Maximum_hit
 */
export function calculateMaxHit(player: Player): number {
  let effectiveStrength = player.strengthLevel + player.strengthBonus + 8;

  // Apply prayer bonus (e.g., 15% for Ultimate Strength)
  if (player.prayers.includes(PrayerId.UltimateStrength)) {
    effectiveStrength = Math.floor(effectiveStrength * 1.15);
  }

  // Apply stance bonus
  effectiveStrength += player.attackStyle === AttackStyle.Aggressive ? 3 : 0;

  // Calculate base damage
  const baseDamage =
    0.5 + (effectiveStrength * (player.equipmentStrengthBonus + 64)) / 640;

  return Math.floor(baseDamage);
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
  | { type: "INVALID_INPUT"; message: string }
  | { type: "CALCULATION_ERROR"; message: string }
  | { type: "NETWORK_ERROR"; message: string };

export function safeDivide(a: number, b: number): Result<number, GameError> {
  if (b === 0) {
    return {
      success: false,
      error: { type: "CALCULATION_ERROR", message: "Division by zero" },
    };
  }
  return { success: true, value: a / b };
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

  constructor(
    private createFn: () => T,
    private initialSize: number = 10,
  ) {
    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  acquire(): T {
    if (this.activeCount < this.pool.length) {
      return this.pool[this.activeCount++];
    }
    const item = this.createFn();
    this.pool.push(item);
    this.activeCount++;
    return item;
  }

  release(item: T): void {
    item.reset();
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
}

// Example usage
class Projectile implements Resettable {
  x: number = 0;
  y: number = 0;
  velocity: { x: number; y: number } = { x: 0, y: 0 };

  reset(): void {
    this.x = 0;
    this.y = 0;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }
}

const projectilePool = new ObjectPool(() => new Projectile(), 50);
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

// Entity creation helper
export function createPlayer(world: IWorld, x: number, y: number): number {
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

  return eid;
}

// System execution order
export const SYSTEM_ORDER = [
  "input",
  "movement",
  "combat",
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
}

class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

export class GameRoom extends Room<GameState> {
  onCreate(options: any) {
    this.setState(new GameState());

    this.onMessage("player_move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) {
        console.warn(`Player ${client.sessionId} not found`);
        return;
      }

      // Validate movement
      const distance = Math.sqrt(
        Math.pow(data.x - player.x, 2) + Math.pow(data.y - player.y, 2),
      );

      const deltaTime = Date.now() - player.lastMoveTime;
      const ticksElapsed = Math.floor(deltaTime / TICK_MS);
      const maxSpeed = player.isRunning ? RUN_SPEED : WALK_SPEED;
      const maxDistance = maxSpeed * ticksElapsed;

      if (distance > maxDistance * 1.1) {
        // 10% tolerance for lag
        console.warn(
          `Player ${client.sessionId} moved too fast: ${distance} > ${maxDistance}`,
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
  }

  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined`);
    const player = new Player();
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`${client.sessionId} left`);
    this.state.players.delete(client.sessionId);
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
import { describe, it, expect } from "@jest/globals";
import { createWorld, addEntity, addComponent, IWorld } from "bitecs";
import {
  Position,
  Velocity,
  Health,
  createMovementSystem,
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
      `Movement system processed 100 entities in ${duration.toFixed(2)}ms`,
    );
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

  constructor(logger: Logger = createLogger()) {
    this.logger = logger;
  }

  async processPlayerAction(
    playerId: string,
    action: PlayerAction,
  ): Promise<Result<void, GameError>> {
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

      // Execute action
      await this.executeAction(playerId, action);

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
        },
      };
    }
  }

  private async validateAction(
    playerId: string,
    action: PlayerAction,
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
    action: PlayerAction,
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

  clearMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
    } else {
      this.metrics.clear();
    }
  }
}

// Global instance for easy access
export const perfMonitor = new PerformanceMonitor();
```
