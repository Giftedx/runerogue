/**
 * Represents a player in the synchronized game state.
 */
export interface Player {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  // OSRS-style combat stats
  attack: number;
  strength: number;
  defence: number;
}

/**
 * Represents an enemy in the synchronized game state.
 */

/**
 * Represents an enemy in the synchronized game state, including OSRS combat stats.
 */
export interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  attack: number;
  strength: number;
  defence: number;
}

/**
 * Represents the shape of the game state synchronized by Colyseus.
 */

export interface GameState {
  players: Record<string, Player>;
  enemies: Record<string, Enemy>;
}
