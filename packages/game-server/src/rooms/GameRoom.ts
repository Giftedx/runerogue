import { Room, type Client } from "colyseus";
import {
  createWorld,
  type IWorld,
  removeEntity,
  addEntity,
  addComponent,
} from "bitecs";

import {
  GameRoomState as GameState,
  PlayerSchema,
  EnemySchema,
  WaveSchema,
  createEnemySchema,
  createPlayerSchema,
} from "@runerogue/shared";
import {
  fixSchemaHierarchy,
  fixAllSchemaTypes,
} from "@runerogue/shared/src/utils/schemaCompat";
import { Schema, MapSchema, ArraySchema } from "@colyseus/schema";
import type { CombatEvent } from "../events/types";

// Systems
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import {
  createCombatSystem,
  type CombatWorld,
} from "../ecs/systems/CombatSystem";
import { createEnemySpawnSystem } from "../ecs/systems/EnemySpawnSystem";
import { createEnemyAISystem } from "../ecs/systems/EnemyAISystem";
import { gameEventEmitter, GameEventType } from "../events/GameEventEmitter";
import { createStateUpdateSystem } from "../ecs/systems/StateUpdateSystem";
import {
  Health,
  Position,
  Player as PlayerComponent,
  Stats,
  Enemy,
  AIState,
  CombatStats,
} from "../ecs/components";
import { createPrayerSystem } from "../ecs/systems/PrayerSystem";

interface JoinOptions {
  name?: string;
}

export class GameRoom extends Room<GameState> {
  private world!: CombatWorld;
  private systems: ((world: CombatWorld) => void)[] = [];
  onCreate(_options: JoinOptions) {
    // Apply comprehensive schema metadata fixes at runtime
    console.log("🔧 Applying runtime schema metadata fixes...");
    fixSchemaHierarchy(GameState);
    fixSchemaHierarchy(PlayerSchema);
    fixSchemaHierarchy(EnemySchema);
    fixSchemaHierarchy(WaveSchema);
    fixAllSchemaTypes(Schema, ArraySchema, MapSchema);
    console.log("✅ Schema metadata fixes applied");

    this.setState(new GameState());
    this.state.wave = new WaveSchema();
    this.world = createWorld() as CombatWorld;
    this.world.room = this;
    this.world.entitiesToRemove = new Set();
    this.world.time = { delta: 0, elapsed: 0 };
    const movementSystem = createMovementSystem();
    const combatSystem = createCombatSystem(this); // Create advanced enemy spawn system with wave progression
    const enemySpawnSystem = createEnemySpawnSystem({
      getPlayerCount: () => this.clients.length,
      getMapBounds: () => ({
        width: 800,
        height: 600,
        centerX: 400,
        centerY: 300,
      }),
      onEnemySpawned: (enemyEid, enemyType) => {
        console.log(`Enemy ${enemyType} spawned with EID ${enemyEid}`);

        // Add enemy to client state for rendering
        const enemyId = `enemy_${enemyEid}`;
        try {
          // Use the factory function to create a properly initialized enemy
          const enemy = createEnemySchema({
            id: enemyId,
            ecsId: enemyEid,
            type: enemyType.toLowerCase(),
            x: (Position.x[enemyEid] as number) || 0,
            y: (Position.y[enemyEid] as number) || 0,
            health: (Health.current[enemyEid] as number) || 10,
            maxHealth: (Health.max[enemyEid] as number) || 10,
            state: "idle",
          });

          this.state.enemies.set(enemyId, enemy);
          console.log(
            `✅ Enemy ${enemyType} added to client state with ID ${enemyId}`
          );
        } catch (error) {
          console.error(
            `❌ Failed to create enemy schema:`,
            error instanceof Error ? error.message : String(error)
          );
        }
      },
      onWaveCompleted: (waveNumber) => {
        console.log(`Wave ${waveNumber} completed!`);
        this.broadcast("waveCompleted", { waveNumber });
      },
      onWaveStarted: (waveNumber) => {
        console.log(`Wave ${waveNumber} started!`);
        this.state.wave.number = waveNumber;
        this.state.wave.isActive = true;
        this.broadcast("waveStarted", { waveNumber });
      },
    });

    const enemyAISystem = createEnemyAISystem({
      getPlayerEntities: () => {
        const playerEids: number[] = [];
        this.state.players.forEach((player) => {
          playerEids.push(player.ecsId);
        });
        return playerEids;
      },
      getPlayerPosition: (playerEid: number) => {
        return {
          x: Position.x[playerEid] as number,
          y: Position.y[playerEid] as number,
        };
      },
      isPlayerAlive: (playerEid: number) => {
        return (Health.current[playerEid] as number) > 0;
      },
      onEnemyTargetAcquired: (enemyEid, targetEid) => {
        console.log(`Enemy ${enemyEid} acquired target ${targetEid}`);
      },
      onEnemyTargetLost: (enemyEid, previousTargetEid) => {
        console.log(`Enemy ${enemyEid} lost target ${previousTargetEid}`);
      },
    });
    const stateUpdateSystem = createStateUpdateSystem(this);
    // --- OSRS-authentic PrayerSystem integration ---
    // Import OSRS prayer constants and effects
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      PRAYER_EFFECTS,
      Prayer,
    } = require("@runerogue/shared/src/types/osrs");

    /**
     * Decodes the active prayer bitmask and sums the OSRS-accurate drain rates for all active prayers.
     * @param {number} activeMask - Bitmask of active prayers
     * @returns {number} Total drain rate (points per minute)
     */
    function getDrainRate(activeMask: number): number {
      let totalDrain = 0;
      let bit = 0;
      for (const prayerKey of Object.keys(Prayer)) {
        if ((activeMask & (1 << bit)) !== 0) {
          const prayer = Prayer[prayerKey as keyof typeof Prayer];
          const effect = PRAYER_EFFECTS[prayer];
          if (effect && typeof effect.drainRate === "number") {
            // OSRS drainRate is points per 3 seconds; convert to points per minute
            totalDrain += effect.drainRate * 20;
          }
        }
        bit++;
      }
      return totalDrain;
    }

    /**
     * Reads the equipment prayer bonus for an entity from the ECS Combat component.
     * @param {number} eid - Entity ID
     * @returns {number} Prayer bonus from equipment
     */
    function getPrayerBonus(eid: number): number {
      // Defensive: If Combat.prayerBonus is undefined, treat as 0
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Combat } = require("../ecs/components/Combat");
        return Combat.prayerBonus[eid] ?? 0;
      } catch (err) {
        return 0;
      }
    }

    const prayerSystem = createPrayerSystem({
      getDrainRate,
      getPrayerBonus,
    });
    this.systems = [
      movementSystem,
      prayerSystem,
      combatSystem,
      enemySpawnSystem,
      enemyAISystem,
      stateUpdateSystem,
    ]; // Set up the game loop
    /**
     * Main simulation loop. Runs all ECS systems, then processes combat events from the event bus.
     * Broadcasts each combat event to clients and clears the event buffer.
     */
    const combatEventBuffer: CombatEvent[] = [];
    gameEventEmitter.onGameEvent(GameEventType.Combat, (event: CombatEvent) => {
      combatEventBuffer.push(event);
    });
    this.setSimulationInterval((deltaTime) => {
      this.world.time.delta = deltaTime;
      this.world.time.elapsed += deltaTime;
      for (const system of this.systems) {
        system(this.world);
      }

      // Sync enemy positions and health to client state
      this.syncEnemyState();

      // Process and broadcast buffered combat events
      try {
        while (combatEventBuffer.length > 0) {
          const event: CombatEvent | undefined = combatEventBuffer.shift();
          if (!event) continue;
          this.broadcast("damage", {
            attacker: event.attacker,
            defender: event.defender,
            damage: event.damage,
            hit: event.hit,
            timestamp: event.timestamp,
          });
        }
      } catch (err) {
        console.error("Error processing combat events:", err);
      }

      this.handleEntityDeath();
    });
  }

  /**
   * Handle entity death and cleanup
   */
  private handleEntityDeath(): void {
    if (this.world.entitiesToRemove.size === 0) {
      return;
    }

    for (const eid of this.world.entitiesToRemove) {
      let isPlayer = false;
      this.state.players.forEach((player, sessionId) => {
        if (player.ecsId === eid) {
          isPlayer = true;
          // Handle player death
          this.broadcast("playerDeath", { playerId: sessionId });
          // For now, respawn the player
          player.health.current = player.health.max;
          player.x = 400 + Math.random() * 50 - 25; // Spawn position
          player.y = 300 + Math.random() * 50 - 25;

          Health.current[eid] = Health.max[eid];
          Position.x[eid] = player.x;
          Position.y[eid] = player.y;
        }
      });

      if (isPlayer) continue;

      this.state.enemies.forEach((enemy, enemyId) => {
        if (enemy.ecsId === eid) {
          // Handle enemy death
          this.broadcast("enemyDeath", { enemyId });
          this.state.enemies.delete(enemyId);
          this.state.wave.enemiesRemaining--;
          removeEntity(this.world, eid);
        }
      });
    }
    this.world.entitiesToRemove.clear();
  }

  /**
   * Sync enemy positions and health from ECS world to client state
   */
  private syncEnemyState(): void {
    this.state.enemies.forEach((enemy, enemyId) => {
      const eid = enemy.ecsId;

      // Update position
      if (Position.x[eid] !== undefined && Position.y[eid] !== undefined) {
        enemy.x = Position.x[eid] as number;
        enemy.y = Position.y[eid] as number;
      }

      // Update health
      if (Health.current[eid] !== undefined && Health.max[eid] !== undefined) {
        enemy.health = Health.current[eid] as number;
        enemy.maxHealth = Health.max[eid] as number;

        // Update state based on health
        if (enemy.health <= 0) {
          enemy.state = "dead";
        } else {
          enemy.state = "moving"; // Simple logic for now
        }
      }
    });
  }
  onJoin(client: Client, options: JoinOptions) {
    const eid = addEntity(this.world); // Use factory function to create player
    const player = createPlayerSchema({
      id: client.sessionId,
      name: options.name ?? "Player",
      x: 400 + Math.random() * 50 - 25,
      y: 300 + Math.random() * 50 - 25,
      ecsId: eid,
    });

    // Initialize health schema (should already be initialized in constructor)
    player.health.current = 10;
    player.health.max = 10;

    addComponent(this.world, PlayerComponent, eid);
    addComponent(this.world, Position, eid);
    addComponent(this.world, Health, eid);
    addComponent(this.world, Stats, eid);

    // Set component data after registration
    Position.x[eid] = player.x;
    Position.y[eid] = player.y;
    Health.current[eid] = player.health.current;
    Health.max[eid] = player.health.max;
    Stats.speed[eid] = 150;
    Stats.damage[eid] = 1;
    Stats.attackSpeed[eid] = 1.0;

    this.state.players.set(client.sessionId, player);

    console.info(`${player.name} joined!`);
  }

  onLeave(client: Client) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      removeEntity(this.world, player.ecsId);
      this.state.players.delete(client.sessionId);
      console.info(`${player.name} left.`);
    }
  }

  onDispose() {
    console.info("Disposing room...");
  }
}
