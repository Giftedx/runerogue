import { Room, type Client } from "colyseus";
import { World } from "@colyseus/ecs";

import { GameRoomState, PlayerSchema } from "@runerogue/shared";

// Systems
import { MovementSystem } from "../ecs/systems/MovementSystem";
import { EnemySpawnSystem } from "../ecs/systems/EnemySpawnSystem";
import { EnemyAISystem } from "../ecs/systems/EnemyAISystem";
import { CombatSystem } from "../ecs/systems/CombatSystem";

// Components
import {
  Position,
  Velocity,
  Health,
  EntityType,
  Target,
  Combat,
} from "../ecs/components";
import { addEntity, addComponent, removeEntity } from "bitecs";

interface JoinOptions {
  name?: string;
}

export class GameRoom extends Room<GameRoomState> {
  world = new World();

  onCreate() {
    this.state = new GameRoomState();

    // Register systems
    this.world.registerSystem(MovementSystem);
    this.world.registerSystem(EnemyAISystem);
    this.world.registerSystem(CombatSystem);
    this.world.registerSystem(EnemySpawnSystem);

    // Set up the game loop
    this.setSimulationInterval((deltaTime) => {
      this.world.execute(deltaTime);
    });

    // Handle player messages
    this.onMessage("move", (_client, _data: { x: number; y: number }) => {
      // This needs to be implemented correctly.
      // It should probably update a component that a system then reads.
    });

    this.onMessage("attack", (_client, _data: { targetId: string }) => {
      // This needs to be implemented correctly.
    });
  }

  onJoin(client: Client, options: JoinOptions) {
    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = options.name ?? `Player ${this.clients.length}`;

    const eid = addEntity(this.world);

    addComponent(this.world, Position, eid);
    Position.x[eid] = 400;
    Position.y[eid] = 300;

    addComponent(this.world, Velocity, eid);
    addComponent(this.world, Health, eid);
    Health.current[eid] = 10;
    Health.max[eid] = 10;

    addComponent(this.world, EntityType, eid);
    EntityType.isPlayer[eid] = 1;

    addComponent(this.world, Target, eid);
    addComponent(this.world, Combat, eid);
    Combat.attack[eid] = 1;
    Combat.strength[eid] = 1;
    Combat.defence[eid] = 1;

    player.ecsId = eid;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, _consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player?.ecsId) {
      removeEntity(this.world, player.ecsId);
    }
    this.state.players.delete(client.sessionId);
  }
}
