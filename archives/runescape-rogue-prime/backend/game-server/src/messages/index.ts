// src/messages/index.ts

/**
 * Base interface for all WebSocket messages.
 */
export interface WebSocketMessage {
  type: string; // Discriminator for message type
}

/**
 * Client-to-Server Messages
 */

export interface PlayerMoveMessage extends WebSocketMessage {
  type: 'player_move';
  x: number;
  y: number;
}

export interface PlayerActionMessage extends WebSocketMessage {
  type: 'player_action';
  action: string; // e.g., 'attack', 'gather', 'interact'
  targetId?: string; // Optional target entity ID
}

/**
 * Server-to-Client Messages
 */

export interface WorldUpdateMessage extends WebSocketMessage {
  type: 'world_update';
  players: { id: string; x: number; y: number; health: number; }[];
  entities: { id: string; type: string; x: number; y: number; }[];
  // Add more world state data as needed
}

export interface GameStateMessage extends WebSocketMessage {
  type: 'game_state';
  playerId: string;
  playerHealth: number;
  playerInventory: { itemId: string; quantity: number; }[];
  // Add more player-specific game state
}

export interface ServerInfoMessage extends WebSocketMessage {
  type: 'server_info';
  message: string;
}

// Union types for easier handling
export type ClientMessage = PlayerMoveMessage | PlayerActionMessage;
export type ServerMessage = WorldUpdateMessage | GameStateMessage | ServerInfoMessage;
