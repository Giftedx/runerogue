/**
 * RuneRogue Game State Schema
 * Colyseus schema for synchronized game state
 * 
 * @author agent/backend-infra (The Architect)
 */

import { Schema, MapSchema, type } from '@colyseus/schema';

export class Player extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') health: number = 10;
  @type('boolean') connected: boolean = true;

  // TODO: Add OSRS-specific player data
  // @type('number') attack: number = 1;
  // @type('number') strength: number = 1;
  // @type('number') defence: number = 1;
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type('number') gameTime: number = 0;
  @type('boolean') gameStarted: boolean = false;
  @type('number') waveNumber: number = 0;

  // TODO: Add game-specific state
  // @type({ map: Enemy }) enemies = new MapSchema<Enemy>();
  // @type('number') score: number = 0;
  // @type('boolean') paused: boolean = false;
} 