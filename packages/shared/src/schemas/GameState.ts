import { Schema, type, MapSchema } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";

export class EnemySchema extends Schema {
  @type("string") id = "";
  @type("number") ecsId = 0;
  @type("number") x = 0;
  @type("number") y = 0;
  @type("number") health = 0;
  @type("number") maxHealth = 0;
  @type("string") enemyType = "goblin"; // goblin, spider, orc, etc.
  @type("number") combatLevel = 2;
}

export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: EnemySchema }) enemies = new MapSchema<EnemySchema>();
  @type("number") waveNumber = 1;
  @type("number") enemiesRemaining = 0;
}
