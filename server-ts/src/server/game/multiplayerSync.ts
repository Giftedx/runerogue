import { Server, Client } from 'colyseus';

// This function broadcasts updated player state to all connected clients.
// It expects a server instance and a payload containing the player's updated state.

export function broadcastPlayerState(server: Server, playerId: string, playerState: any): void {
  // Here, 'updatePlayerState' is the message type for client side updates.
  server.broadcast('updatePlayerState', { playerId, playerState });
  console.log(`Broadcasted state update for player ${playerId}.`);
}

// Optional: function to handle periodic syncs if needed
export function syncAllPlayerStates(server: Server, allPlayerStates: Record<string, any>): void {
  server.broadcast('syncAllPlayers', allPlayerStates);
  console.log(`Broadcasted sync for all players.`);
}
