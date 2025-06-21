import { Room, type Client } from "colyseus";
import { createWorld, type IWorld } from "bitecs";

import { GameRoomState, PlayerSchema } from "@runerogue/shared";

// Systems
import { createMovementSystem } from "../ecs/systems/MovementSystem";
import { createEnemySpawnSystem } from "../ecs/systems/EnemySpawnSystem";
import { createEnemyAISystem } from "../ecs/systems/EnemyAISystem";
import { createCombatSystem } from "../ecs/systems/CombatSystem";

// Components
import {
  Position,
  Velocity,
  Health,
  Target,
  Combat,
  Player,
} from "../ecs/components";
import { addEntity, addComponent, removeEntity } from "bitecs";

interface JoinOptions {
  name?: string;
}

export class GameRoom extends Room<GameRoomState> {
  private world: IWorld = createWorld();
  private systems: ((world: IWorld) => IWorld)[] = [];

  onCreate() {
    this.state = new GameRoomState();

    // Register systems
    this.systems.push(createMovementSystem());
    this.systems.push(createEnemyAISystem());
    this.systems.push(createCombatSystem(this));
    this.systems.push(createEnemySpawnSystem(this));

    // Set up the game loop
    this.setSimulationInterval((_deltaTime) => {
      for (const system of this.systems) {
        system(this.world);
      }
    });

    // Handle player messages
    this.onMessage("move", (client, data: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player?.ecsId) {
        // This is a simple direct manipulation for now.
        // A better approach would be to have an Input component
        // that the MovementSystem reads.
        Velocity.x[player.ecsId] = data.x;
        Velocity.y[player.ecsId] = data.y;
      }
    });

    this.onMessage("attack", (client, data: { targetId: string }) => {
      const player = this.state.players.get(client.sessionId);
      const target = this.state.enemies.get(data.targetId);

      if (player?.ecsId && target?.ecsId) {
        // Set the player's target
        Target.eid[player.ecsId] = target.ecsId;
      }
    });
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
