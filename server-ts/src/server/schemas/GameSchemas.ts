/**
 * RuneRogue Game Schemas - Clean Colyseus Schema Definitions
 */

import { MapSchema, Schema, type } from '@colyseus/schema';

/**
 * Player Schema - represents a player in the game
 */
export class Player extends Schema {
  @type('string') id: string = '';
  @type('string') username: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') health: number = 100;
  @type('number') maxHealth: number = 100;
  @type('number') combatLevel: number = 3;
  @type('boolean') isAttacking: boolean = false;
  @type('string') targetId: string = '';
  @type('string') lastAction: string = '';
  @type({ map: 'number' }) skills = new MapSchema<number>();
  @type({ map: 'string' }) equipment = new MapSchema<string>();

  constructor() {
    super();
    this.skills.set('attack', 1);
    this.skills.set('strength', 1);
    this.skills.set('defence', 1);
    this.skills.set('hitpoints', 10);
    this.skills.set('prayer', 1);
  }
}

/**
 * Enemy Schema - represents an enemy NPC
 */
export class Enemy extends Schema {
  @type('string') id: string = '';
  @type('string') type: string = '';
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') health: number = 100;
  @type('number') maxHealth: number = 100;
  @type('number') combatLevel: number = 1;
  @type('boolean') isAggressive: boolean = false;
  @type('string') targetId: string = '';
  @type('string') lastAction: string = '';
}

/**
 * Game Room State - main game state container
 */
export class GameRoomState extends Schema {
  @type('number') tick: number = 0;
  @type('number') timestamp: number = 0;
  @type('number') waveNumber: number = 1;
  @type('number') enemiesRemaining: number = 0;
  @type('string') gamePhase: string = 'waiting';
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Enemy }) enemies = new MapSchema<Enemy>();

  constructor() {
    super();
    this.timestamp = Date.now();
  }
}
