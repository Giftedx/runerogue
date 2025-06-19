"use strict";
/**
 * @deprecated LEGACY SCHEMA - This is a simplified, prototype schema.
 * It is not used in the main game and is pending removal.
 * The canonical, up-to-date schemas are in the '@runerogue/shared' package.
 */
var __decorate =
  (this && this.__decorate) ||
  function (decorators, target, key, desc) {
    var c = arguments.length,
      r =
        c < 3
          ? target
          : desc === null
            ? (desc = Object.getOwnPropertyDescriptor(target, key))
            : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
      r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if ((d = decorators[i]))
          r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
var __metadata =
  (this && this.__metadata) ||
  function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
      return Reflect.metadata(k, v);
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = exports.Enemy = exports.Player = exports.Character = void 0;
/**
 * RuneRogue Game State Schema
 * Colyseus schema for synchronized game state
 *
 * @author agent/backend-infra (The Architect)
 */
const schema_1 = require("@colyseus/schema");
/**
 * @class Character
 * @classdesc A base schema for any character in the game, player or enemy.
 * It contains common properties like position, health, and combat state.
 * This class is extended by Player and Enemy schemas.
 */
class Character extends schema_1.Schema {
  id = "";
  x = 0;
  y = 0;
  health = 10;
  maxHealth = 10;
  // Combat state
  lastAttackTime = 0;
  targetId = "";
  inCombat = false;
  // OSRS Combat Stats
  attackLevel = 1;
  strengthLevel = 1;
  defenceLevel = 1;
  hitpointsLevel = 10;
}
exports.Character = Character;
__decorate(
  [(0, schema_1.type)("string"), __metadata("design:type", String)],
  Character.prototype,
  "id",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "x",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "y",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "health",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "maxHealth",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "lastAttackTime",
  void 0,
);
__decorate(
  [(0, schema_1.type)("string"), __metadata("design:type", String)],
  Character.prototype,
  "targetId",
  void 0,
);
__decorate(
  [(0, schema_1.type)("boolean"), __metadata("design:type", Boolean)],
  Character.prototype,
  "inCombat",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "attackLevel",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "strengthLevel",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "defenceLevel",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Character.prototype,
  "hitpointsLevel",
  void 0,
);
class Player extends Character {
  name = "";
  connected = true;
  lastMoveTime = 0;
  // OSRS Combat Stats (Prayer)
  prayerLevel = 1;
  prayerPoints = 1;
  // Player-specific state
  isDead = false;
}
exports.Player = Player;
__decorate(
  [(0, schema_1.type)("string"), __metadata("design:type", String)],
  Player.prototype,
  "name",
  void 0,
);
__decorate(
  [(0, schema_1.type)("boolean"), __metadata("design:type", Boolean)],
  Player.prototype,
  "connected",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Player.prototype,
  "lastMoveTime",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Player.prototype,
  "prayerLevel",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  Player.prototype,
  "prayerPoints",
  void 0,
);
__decorate(
  [(0, schema_1.type)("boolean"), __metadata("design:type", Boolean)],
  Player.prototype,
  "isDead",
  void 0,
);
class Enemy extends Character {
  type = "goblin";
  aiState = "IDLE"; // e.g., 'IDLE', 'ATTACKING'
  alive = true;
}
exports.Enemy = Enemy;
__decorate(
  [(0, schema_1.type)("string"), __metadata("design:type", String)],
  Enemy.prototype,
  "type",
  void 0,
);
__decorate(
  [(0, schema_1.type)("string"), __metadata("design:type", String)],
  Enemy.prototype,
  "aiState",
  void 0,
);
__decorate(
  [(0, schema_1.type)("boolean"), __metadata("design:type", Boolean)],
  Enemy.prototype,
  "alive",
  void 0,
);
class GameState extends schema_1.Schema {
  players = new schema_1.MapSchema();
  enemies = new schema_1.MapSchema();
  gameTime = 0;
  gameStarted = false;
  waveNumber = 1;
  enemiesKilled = 0;
  lastSpawnTime = 0;
}
exports.GameState = GameState;
__decorate(
  [(0, schema_1.type)({ map: Player }), __metadata("design:type", Object)],
  GameState.prototype,
  "players",
  void 0,
);
__decorate(
  [(0, schema_1.type)({ map: Enemy }), __metadata("design:type", Object)],
  GameState.prototype,
  "enemies",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  GameState.prototype,
  "gameTime",
  void 0,
);
__decorate(
  [(0, schema_1.type)("boolean"), __metadata("design:type", Boolean)],
  GameState.prototype,
  "gameStarted",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  GameState.prototype,
  "waveNumber",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  GameState.prototype,
  "enemiesKilled",
  void 0,
);
__decorate(
  [(0, schema_1.type)("number"), __metadata("design:type", Number)],
  GameState.prototype,
  "lastSpawnTime",
  void 0,
);
//# sourceMappingURL=GameState.js.map
