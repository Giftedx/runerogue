import { Room, Client } from 'colyseus';
import { IWorld, createWorld } from 'bitecs';
import { GameRoomState, PlayerSchema } from '@runerogue/shared';
import { MovementSystem, createPlayer } from '../ecs';

export class RuneRogueRoom extends Room<GameRoomState> {
  private world: IWorld;
  private systems: ((world: IWorld) => void)[] = [];
  onCreate(options: any) {
    this.state = new GameRoomState();
    this.world = createWorld();

    // Register systems - using proper ECS systems
    this.systems.push(MovementSystem);

    this.setSimulationInterval(deltaTime => this.update(deltaTime));

    this.onMessage('input', (client, message) => {
      // Handle player input and update component data
    });
  }
  onJoin(client: Client, options: any) {
    const player = new PlayerSchema().assign({
      id: client.sessionId,
      name: options.username || 'Player',
    });

    this.state.players.set(client.sessionId, player);
    const entityId = createPlayer(this.world, client.sessionId, 10, 10);

    console.log(
      `Player ${player.name} (${client.sessionId}) joined and created entity ${entityId}.`
    );
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`Player ${player.name} (${client.sessionId}) left.`);
      // Need a way to find and remove the entity from the world
      this.state.players.delete(client.sessionId);
    }
  }

  update(deltaTime: number) {
    for (const system of this.systems) {
      system(this.world);
    }
  }

  onDispose() {
    console.log('Room', this.roomId, 'disposing...');
  }
}
