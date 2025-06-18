import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("boolean") connected: boolean = true;

  // OSRS Combat Stats
  @type("number") attack: number = 1;
  @type("number") strength: number = 1;
  @type("number") defence: number = 1;
  @type("number") health: number = 10;
  @type("number") maxHealth: number = 10;

  // Combat state
  @type("number") lastAttackTick: number = 0;
}

export class Enemy extends Schema {
  @type("string") id: string = "";
  @type("string") type: string = "goblin";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") health: number = 5;
  @type("number") maxHealth: number = 5;
  @type("number") attack: number = 1;
  @type("number") strength: number = 1;
  @type("number") defence: number = 1;
  @type("boolean") alive: boolean = true;
}

export class GameRoomState extends Schema {}
