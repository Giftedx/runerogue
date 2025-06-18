/**
 * Represents a player in the synchronized game state.
 */
export interface Player {
  id: string;
  x: number;
  y: number;
}

/**
 * Represents the shape of the game state synchronized by Colyseus.
 */
export interface GameState {
  players: Record<string, Player>;
}
