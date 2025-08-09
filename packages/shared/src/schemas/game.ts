import { Schema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;
  @type("boolean") connected = true;

  // OSRS Combat Stats
  @type("number") attack = 1;
  @type("number") strength = 1;
  @type("number") defence = 1;
  @type("number") health = 10;
  @type("number") maxHealth = 10;

  // Combat state
  @type("number") lastAttackTick = 0;
}

export class Enemy extends Schema {
  @type("string") id = "";
  @type("string") type = "goblin";
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") health = 5;
  @type("number") maxHealth = 5;
  @type("number") attack = 1;
  @type("number") strength = 1;
  @type("number") defence = 1;
  @type("boolean") alive = true;
}

export class GameRoomState extends Schema {}
