import { Room, type Client } from "colyseus";
import { createWorld, type IWorld, removeEntity } from "bitecs";

import { GameRoomState, PlayerSchema } from "@runerogue/shared";

// Systems
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import {
  createCombatSystem,
  type CombatWorld,
} from "../ecs/systems/CombatSystem";
import { createTargetingSystem } from "../ecs/systems/TargetingSystem";
import { createEnemySpawnSystem } from "../ecs/systems/EnemySpawnSystem";
import { createStateUpdateSystem } from "../ecs/systems/StateUpdateSystem";
import { Health, Position } from "../ecs/components";

interface JoinOptions {
  name?: string;
}

export class GameRoom extends Room<GameRoomState> {
  private world!: CombatWorld;
  private systems: ((world: IWorld) => IWorld)[] = [];

  onCreate(options: any) {
    this.setState(new GameRoomState());

    // Initialize world with room reference
    this.world = createWorld();
    this.world.room = this;
    this.world.entitiesToRemove = new Set();

    // Initialize systems (including new ones)
    this.systems = [
      createMovementSystem(),
      createCombatSystem(this),
      createTargetingSystem(),
      createEnemySpawnSystem(this),
      createStateUpdateSystem(this),
    ];

    // Set up the game loop
    this.setSimulationInterval((deltaTime) => {
      this.world.time = {
        ...this.world.time,
        delta: deltaTime,
        elapsed: this.clock.elapsedTime,
      };
      for (const system of this.systems) {
        system(this.world);
      }
      this.handleEntityDeath();
    });
  }

  /**
   * Handle entity death and cleanup
   */
  private handleEntityDeath(): void {
    if (
      !this.world.entitiesToRemove ||
      this.world.entitiesToRemove.size === 0
    ) {
      return;
    }

    for (const eid of this.world.entitiesToRemove) {
      // Find if it's a player or enemy
      let isPlayer = false;
      this.state.players.forEach((player, sessionId) => {
        if (player.ecsId === eid) {
          isPlayer = true;
          // Handle player death
          this.broadcast("playerDeath", { playerId: sessionId });
          // For now, respawn the player
          player.health = player.maxHealth;
          player.x = 400 + Math.random() * 50 - 25; // Spawn position
          player.y = 300 + Math.random() * 50 - 25;

          if (Health.current[eid]) {
            Health.current[eid] = Health.max[eid];
            Position.x[eid] = player.x;
            Position.y[eid] = player.y;
          }
        }
      });

      if (isPlayer) continue;

      this.state.enemies.forEach((enemy, enemyId) => {
        if (enemy.ecsId === eid) {
          // Handle enemy death
          this.broadcast("enemyDeath", { enemyId });
          this.state.enemies.delete(enemyId);
          this.state.enemiesRemaining--;
          removeEntity(this.world, eid);
        }
      });
    }

    this.world.entitiesToRemove.clear();
  }

  onJoin(client: Client, options: JoinOptions) {
    const playerSchema = new PlayerSchema();
    playerSchema.id = client.sessionId;
    playerSchema.name = options.name ?? `Player ${this.clients.length}`;

    const eid = addEntity(this.world);

    addComponent(this.world, Position, eid);
    Position.x[eid] = 400;
    Position.y[eid] = 300;

    addComponent(this.world, Velocity, eid);
    addComponent(this.world, Health, eid);
    Health.current[eid] = 10;
    Health.max[eid] = 10;

    addComponent(this.world, Player, eid);

    addComponent(this.world, Target, eid);
    addComponent(this.world, Combat, eid);
    Combat.attack[eid] = 1;
    Combat.strength[eid] = 1;
    Combat.defence[eid] = 1;
    Combat.attackSpeed[eid] = 2400; // 4 ticks

    playerSchema.ecsId = eid;

    this.state.players.set(client.sessionId, playerSchema);
  }

  onLeave(client: Client, _consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player?.ecsId) {
      removeEntity(this.world, player.ecsId);
    }
    this.state.players.delete(client.sessionId);
  }
}
