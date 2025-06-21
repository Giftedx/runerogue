import { Room, type Client } from "colyseus";
import {
  createWorld,
  type IWorld,
  removeEntity,
  addEntity,
  addComponent,
} from "bitecs";

import { GameRoomState, PlayerSchema, WaveSchema } from "@runerogue/shared";

// Systems
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import {
  createCombatSystem,
  type CombatWorld,
} from "../ecs/systems/CombatSystem";
import { createEnemySpawnSystem } from "../ecs/systems/EnemySpawnSystem";
import { gameEventEmitter, GameEventType } from "../events/GameEventEmitter";
import { createStateUpdateSystem } from "../ecs/systems/StateUpdateSystem";
import {
  Health,
  Position,
  Player as PlayerComponent,
  Stats,
} from "../ecs/components";

interface JoinOptions {
  name?: string;
}

export class GameRoom extends Room<GameRoomState> {
  private world!: CombatWorld;
  private systems: ((world: IWorld) => void)[] = [];

  onCreate(_options: JoinOptions) {
    this.state = new GameRoomState();
    this.state.wave = new WaveSchema();

    this.world = createWorld();
    this.world.room = this;
    this.world.entitiesToRemove = new Set();
    this.world.time = { delta: 0, elapsed: 0, then: 0 };

    const movementSystem = createMovementSystem();
    const combatSystem = createCombatSystem(this);
    const enemySpawnSystem = createEnemySpawnSystem(this);
    const stateUpdateSystem = createStateUpdateSystem(this);

    this.systems = [
      movementSystem,
      combatSystem,
      enemySpawnSystem,
      stateUpdateSystem,
    ];

    // Set up the game loop
    /**
     * Main simulation loop. Runs all ECS systems, then processes combat events from the event bus.
     * Broadcasts each combat event to clients and clears the event buffer.
     */
    import type { CombatEvent } from "../events/types";
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

  onJoin(client: Client, options: JoinOptions) {
    const eid = addEntity(this.world);
    const player = new PlayerSchema().assign({
      id: client.sessionId,
      name: options.name ?? "Player",
      x: 400 + Math.random() * 50 - 25,
      y: 300 + Math.random() * 50 - 25,
      ecsId: eid,
    });

    addComponent(this.world, PlayerComponent, eid);
    addComponent(this.world, Position, { x: player.x, y: player.y }, eid);
    addComponent(this.world, Health, { current: 10, max: 10 }, eid);
    addComponent(
      this.world,
      Stats,
      { speed: 150, damage: 1, attackSpeed: 1.0 },
      eid
    );

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
