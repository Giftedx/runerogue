"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoomState = exports.GameTimeSchema = exports.WaveSchema = exports.EnemySchema = exports.EnemyStatsSchema = exports.PlayerSchema = exports.SpecialAttackSchema = exports.PrayerSchema = exports.EquipmentSchema = exports.ItemSchema = exports.EquipmentBonusesSchema = exports.CombatStatsSchema = exports.SkillSchema = exports.HealthSchema = exports.Vector2Schema = void 0;
const schema_1 = require("@colyseus/schema");
/**
 * COLYSEUS SCHEMAS FOR NETWORK SYNCHRONIZATION
 * These MUST stay perfectly in sync with shared types
 * DO NOT modify without updating shared types too
 */
class Vector2Schema extends schema_1.Schema {
    x = 0;
    y = 0;
}
exports.Vector2Schema = Vector2Schema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Vector2Schema.prototype, "x", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], Vector2Schema.prototype, "y", void 0);
class HealthSchema extends schema_1.Schema {
    current = 10;
    max = 10;
}
exports.HealthSchema = HealthSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], HealthSchema.prototype, "current", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], HealthSchema.prototype, "max", void 0);
class SkillSchema extends schema_1.Schema {
    level = 1;
    xp = 0;
    boosted = 0;
}
exports.SkillSchema = SkillSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], SkillSchema.prototype, "level", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], SkillSchema.prototype, "xp", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], SkillSchema.prototype, "boosted", void 0);
class CombatStatsSchema extends schema_1.Schema {
    attack = new SkillSchema();
    strength = new SkillSchema();
    defence = new SkillSchema();
    hitpoints = new SkillSchema();
    ranged = new SkillSchema();
    prayer = new SkillSchema();
    magic = new SkillSchema();
}
exports.CombatStatsSchema = CombatStatsSchema;
__decorate([
    (0, schema_1.type)(SkillSchema),
    __metadata("design:type", Object)
], CombatStatsSchema.prototype, "attack", void 0);
__decorate([
    (0, schema_1.type)(SkillSchema),
    __metadata("design:type", Object)
], CombatStatsSchema.prototype, "strength", void 0);
__decorate([
    (0, schema_1.type)(SkillSchema),
    __metadata("design:type", Object)
], CombatStatsSchema.prototype, "defence", void 0);
__decorate([
    (0, schema_1.type)(SkillSchema),
    __metadata("design:type", Object)
], CombatStatsSchema.prototype, "hitpoints", void 0);
__decorate([
    (0, schema_1.type)(SkillSchema),
    __metadata("design:type", Object)
], CombatStatsSchema.prototype, "ranged", void 0);
__decorate([
    (0, schema_1.type)(SkillSchema),
    __metadata("design:type", Object)
], CombatStatsSchema.prototype, "prayer", void 0);
__decorate([
    (0, schema_1.type)(SkillSchema),
    __metadata("design:type", Object)
], CombatStatsSchema.prototype, "magic", void 0);
class EquipmentBonusesSchema extends schema_1.Schema {
    attackStab = 0;
    attackSlash = 0;
    attackCrush = 0;
    attackMagic = 0;
    attackRanged = 0;
    defenceStab = 0;
    defenceSlash = 0;
    defenceCrush = 0;
    defenceMagic = 0;
    defenceRanged = 0;
    meleeStrength = 0;
    rangedStrength = 0;
    magicDamage = 0;
    prayer = 0;
}
exports.EquipmentBonusesSchema = EquipmentBonusesSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "attackStab", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "attackSlash", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "attackCrush", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "attackMagic", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "attackRanged", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "defenceStab", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "defenceSlash", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "defenceCrush", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "defenceMagic", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "defenceRanged", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "meleeStrength", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "rangedStrength", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "magicDamage", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EquipmentBonusesSchema.prototype, "prayer", void 0);
class ItemSchema extends schema_1.Schema {
    id = 0;
    name = "";
    examine = "";
    equipmentSlot = undefined;
    bonuses = new EquipmentBonusesSchema();
    attackSpeed = 5;
    attackRange = 1;
}
exports.ItemSchema = ItemSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ItemSchema.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], ItemSchema.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], ItemSchema.prototype, "examine", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], ItemSchema.prototype, "equipmentSlot", void 0);
__decorate([
    (0, schema_1.type)(EquipmentBonusesSchema),
    __metadata("design:type", Object)
], ItemSchema.prototype, "bonuses", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ItemSchema.prototype, "attackSpeed", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], ItemSchema.prototype, "attackRange", void 0);
class EquipmentSchema extends schema_1.Schema {
    weapon = new ItemSchema();
    helmet = new ItemSchema();
    chest = new ItemSchema();
    legs = new ItemSchema();
}
exports.EquipmentSchema = EquipmentSchema;
__decorate([
    (0, schema_1.type)(ItemSchema),
    __metadata("design:type", ItemSchema)
], EquipmentSchema.prototype, "weapon", void 0);
__decorate([
    (0, schema_1.type)(ItemSchema),
    __metadata("design:type", ItemSchema)
], EquipmentSchema.prototype, "helmet", void 0);
__decorate([
    (0, schema_1.type)(ItemSchema),
    __metadata("design:type", ItemSchema)
], EquipmentSchema.prototype, "chest", void 0);
__decorate([
    (0, schema_1.type)(ItemSchema),
    __metadata("design:type", ItemSchema)
], EquipmentSchema.prototype, "legs", void 0);
class PrayerSchema extends schema_1.Schema {
    points = 1;
    activePrayers = new schema_1.ArraySchema();
    drainRate = 0;
}
exports.PrayerSchema = PrayerSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PrayerSchema.prototype, "points", void 0);
__decorate([
    (0, schema_1.type)(["string"]),
    __metadata("design:type", Object)
], PrayerSchema.prototype, "activePrayers", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PrayerSchema.prototype, "drainRate", void 0);
class SpecialAttackSchema extends schema_1.Schema {
    energy = 100;
    available = true;
}
exports.SpecialAttackSchema = SpecialAttackSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], SpecialAttackSchema.prototype, "energy", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], SpecialAttackSchema.prototype, "available", void 0);
class PlayerSchema extends schema_1.Schema {
    id = "";
    name = "";
    position = new Vector2Schema();
    health = new HealthSchema();
    stats = new CombatStatsSchema();
    equipment = new EquipmentSchema();
    prayer = new PrayerSchema();
    specialAttack = new SpecialAttackSchema();
    target = "";
    lastAttackTick = 0;
    inCombat = false;
}
exports.PlayerSchema = PlayerSchema;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], PlayerSchema.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], PlayerSchema.prototype, "name", void 0);
__decorate([
    (0, schema_1.type)(Vector2Schema),
    __metadata("design:type", Object)
], PlayerSchema.prototype, "position", void 0);
__decorate([
    (0, schema_1.type)(HealthSchema),
    __metadata("design:type", Object)
], PlayerSchema.prototype, "health", void 0);
__decorate([
    (0, schema_1.type)(CombatStatsSchema),
    __metadata("design:type", Object)
], PlayerSchema.prototype, "stats", void 0);
__decorate([
    (0, schema_1.type)(EquipmentSchema),
    __metadata("design:type", Object)
], PlayerSchema.prototype, "equipment", void 0);
__decorate([
    (0, schema_1.type)(PrayerSchema),
    __metadata("design:type", Object)
], PlayerSchema.prototype, "prayer", void 0);
__decorate([
    (0, schema_1.type)(SpecialAttackSchema),
    __metadata("design:type", Object)
], PlayerSchema.prototype, "specialAttack", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], PlayerSchema.prototype, "target", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], PlayerSchema.prototype, "lastAttackTick", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], PlayerSchema.prototype, "inCombat", void 0);
class EnemyStatsSchema extends schema_1.Schema {
    attack = 1;
    strength = 1;
    defence = 1;
    hitpoints = 1;
}
exports.EnemyStatsSchema = EnemyStatsSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EnemyStatsSchema.prototype, "attack", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EnemyStatsSchema.prototype, "strength", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EnemyStatsSchema.prototype, "defence", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EnemyStatsSchema.prototype, "hitpoints", void 0);
class EnemySchema extends schema_1.Schema {
    id = "";
    type = ""; // Corresponds to EnemyType from shared
    position = new Vector2Schema();
    health = new HealthSchema();
    combatLevel = 1;
    stats = new EnemyStatsSchema();
    bonuses = new EquipmentBonusesSchema();
    target = "";
    lastAttackTick = 0;
    aggroRange = 5;
}
exports.EnemySchema = EnemySchema;
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], EnemySchema.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], EnemySchema.prototype, "type", void 0);
__decorate([
    (0, schema_1.type)(Vector2Schema),
    __metadata("design:type", Object)
], EnemySchema.prototype, "position", void 0);
__decorate([
    (0, schema_1.type)(HealthSchema),
    __metadata("design:type", Object)
], EnemySchema.prototype, "health", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EnemySchema.prototype, "combatLevel", void 0);
__decorate([
    (0, schema_1.type)(EnemyStatsSchema),
    __metadata("design:type", Object)
], EnemySchema.prototype, "stats", void 0);
__decorate([
    (0, schema_1.type)(EquipmentBonusesSchema),
    __metadata("design:type", Object)
], EnemySchema.prototype, "bonuses", void 0);
__decorate([
    (0, schema_1.type)("string"),
    __metadata("design:type", String)
], EnemySchema.prototype, "target", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EnemySchema.prototype, "lastAttackTick", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], EnemySchema.prototype, "aggroRange", void 0);
class WaveSchema extends schema_1.Schema {
    current = 1;
    enemiesRemaining = 0;
    nextWaveIn = 0;
}
exports.WaveSchema = WaveSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], WaveSchema.prototype, "current", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], WaveSchema.prototype, "enemiesRemaining", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], WaveSchema.prototype, "nextWaveIn", void 0);
class GameTimeSchema extends schema_1.Schema {
    tick = 0;
    elapsed = 0;
}
exports.GameTimeSchema = GameTimeSchema;
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameTimeSchema.prototype, "tick", void 0);
__decorate([
    (0, schema_1.type)("number"),
    __metadata("design:type", Number)
], GameTimeSchema.prototype, "elapsed", void 0);
class GameRoomState extends schema_1.Schema {
    players = new schema_1.MapSchema();
    enemies = new schema_1.MapSchema();
    wave = new WaveSchema();
    gameTime = new GameTimeSchema();
    gameStarted = false;
    gameEnded = false;
}
exports.GameRoomState = GameRoomState;
__decorate([
    (0, schema_1.type)({ map: PlayerSchema }),
    __metadata("design:type", Object)
], GameRoomState.prototype, "players", void 0);
__decorate([
    (0, schema_1.type)({ map: EnemySchema }),
    __metadata("design:type", Object)
], GameRoomState.prototype, "enemies", void 0);
__decorate([
    (0, schema_1.type)(WaveSchema),
    __metadata("design:type", Object)
], GameRoomState.prototype, "wave", void 0);
__decorate([
    (0, schema_1.type)(GameTimeSchema),
    __metadata("design:type", Object)
], GameRoomState.prototype, "gameTime", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], GameRoomState.prototype, "gameStarted", void 0);
__decorate([
    (0, schema_1.type)("boolean"),
    __metadata("design:type", Boolean)
], GameRoomState.prototype, "gameEnded", void 0);
//# sourceMappingURL=GameRoomState.js.map