import { Room, Client } from 'colyseus';
import { GameState } from './schema/GameState';
import { PlayerState } from './schema/PlayerState'; // Import PlayerState

export class GameRoom extends Room<GameState> {
  // Use GameState
  maxClients = 3;

  onCreate(options: any) {
    console.log('GameRoom created!', options);
    this.setState(new GameState()); // Set the initial state

    // Example message handler (can be expanded later)
    this.onMessage('ping', (client, message) => {
      console.log(`Received 'ping' from ${client.sessionId}:`, message);
      client.send('pong', 'Hello from server! State is set.');
    });

    // Example: Log player count changes
    this.state.players.onAdd((player, key) => {
      console.log(player.id, 'has been added at', key);
    });
    this.state.players.onRemove((player, key) => {
      console.log(player.id, 'has been removed at', key);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, 'joined!');
    const player = new PlayerState();
    player.id = client.sessionId; // Use sessionId as player ID
    // Initialize other player properties if needed (e.g., starting position)
    player.x = Math.random() * 10; // Temporary random position
    player.y = Math.random() * 10; // Temporary random position
    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, 'left!');
    if (this.state.players.has(client.sessionId)) {
      this.state.players.delete(client.sessionId);
    }
  }

  onDispose() {
    console.log('Room', this.roomId, 'disposing...');
  }
}
