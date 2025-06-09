/**
 * Completely fresh minimal schema file to test for conflicts
 */
import { MapSchema, Schema, type } from '@colyseus/schema';
import 'reflect-metadata';

/**
 * Basic skill schema
 */
export class SkillBasic extends Schema {
  @type('number')
  public level: number = 1;

  @type('number')
  public xp: number = 0;
}

/**
 * Basic skills collection
 */
export class SkillsBasic extends Schema {
  @type(SkillBasic)
  public attack: SkillBasic = new SkillBasic();

  @type(SkillBasic)
  public strength: SkillBasic = new SkillBasic();
}

/**
 * Basic player schema
 */
export class PlayerBasic extends Schema {
  @type('string')
  public name: string = '';

  @type('number')
  public x: number = 0;

  @type('number')
  public y: number = 0;

  @type(SkillsBasic)
  public skills: SkillsBasic = new SkillsBasic();
}

/**
 * Basic game state
 */
export class GameStateBasic extends Schema {
  @type({ map: PlayerBasic })
  public players: MapSchema<PlayerBasic> = new MapSchema<PlayerBasic>();
}
