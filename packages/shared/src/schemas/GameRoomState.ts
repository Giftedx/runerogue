import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { Vector2, EquipmentBonuses, ItemData, CombatStats, Equipment } from '@runerogue/shared';

/**
 * COLYSEUS SCHEMAS FOR NETWORK SYNCHRONIZATION
 * These MUST stay perfectly in sync with shared types
 * DO NOT modify without updating shared types too
 */

export class Vector2Schema extends Schema implements Vector2 {
  @type('number') x: number = 0;
  @type('number') y: number = 0;
}

export class HealthSchema extends Schema {
  @type('number') current: number = 10;
  @type('number') max: number = 10;
}

export class SkillSchema extends Schema {
  @type('number') level: number = 1;
  @type('number') xp: number = 0;
  @type('number') boosted: number = 0;
}

export class CombatStatsSchema extends Schema implements CombatStats {
  @type(SkillSchema) attack = new SkillSchema();
  @type(SkillSchema) strength = new SkillSchema();
  @type(SkillSchema) defence = new SkillSchema();
  @type(SkillSchema) hitpoints = new SkillSchema();
  @type(SkillSchema) ranged = new SkillSchema();
  @type(SkillSchema) prayer = new SkillSchema();
  @type(SkillSchema) magic = new SkillSchema();
}

export class EquipmentBonusesSchema extends Schema implements EquipmentBonuses {
  @type('number') attackStab: number = 0;
  @type('number') attackSlash: number = 0;
  @type('number') attackCrush: number = 0;
  @type('number') attackMagic: number = 0;
  @type('number') attackRanged: number = 0;
  @type('number') defenceStab: number = 0;
  @type('number') defenceSlash: number = 0;
  @type('number') defenceCrush: number = 0;
  @type('number') defenceMagic: number = 0;
  @type('number') defenceRanged: number = 0;
  @type('number') meleeStrength: number = 0;
  @type('number') rangedStrength: number = 0;
  @type('number') magicDamage: number = 0;
  @type('number') prayer: number = 0;
}

export class ItemSchema extends Schema implements ItemData {
  @type('number') id: number = 0;
  @type('string') name: string = '';
  @type('string') examine: string = '';
  @type('string') equipmentSlot?:
    | 'weapon'
    | 'helmet'
    | 'chest'
    | 'legs'
    | 'shield'
    | 'gloves'
    | 'boots'
    | 'ring'
    | 'amulet' = undefined;
  @type(EquipmentBonusesSchema) bonuses = new EquipmentBonusesSchema();
  @type('number') attackSpeed?: number = 5;
  @type('number') attackRange?: number = 1;
}

export class EquipmentSchema extends Schema implements Equipment {
  @type(ItemSchema) weapon?: ItemSchema = new ItemSchema();
  @type(ItemSchema) helmet?: ItemSchema = new ItemSchema();
  @type(ItemSchema) chest?: ItemSchema = new ItemSchema();
  @type(ItemSchema) legs?: ItemSchema = new ItemSchema();
  // Add other slots as needed
}

export class PrayerSchema extends Schema {
  @type('number') points: number = 1;
  @type(['string']) activePrayers = new ArraySchema<string>();
  @type('number') drainRate: number = 0;
}

export class SpecialAttackSchema extends Schema {
  @type('number') energy: number = 100;
  @type('boolean') available: boolean = true;
}

export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type(Vector2Schema) position = new Vector2Schema();
  @type(HealthSchema) health = new HealthSchema();
  @type(CombatStatsSchema) stats = new CombatStatsSchema();
  @type(EquipmentSchema) equipment = new EquipmentSchema();
  @type(PrayerSchema) prayer = new PrayerSchema();
  @type(SpecialAttackSchema) specialAttack = new SpecialAttackSchema();

  @type('string') target?: string = '';
  @type('number') lastAttackTick: number = 0;
  @type('boolean') inCombat: boolean = false;
}

export class EnemyStatsSchema extends Schema {
  @type('number') attack: number = 1;
  @type('number') strength: number = 1;
  @type('number') defence: number = 1;
  @type('number') hitpoints: number = 1;
}

export class EnemySchema extends Schema {
  @type('string') id: string = '';
  @type('string') type: string = ''; // Corresponds to EnemyType from shared
  @type(Vector2Schema) position = new Vector2Schema();
  @type(HealthSchema) health = new HealthSchema();
  @type('number') combatLevel: number = 1;
  @type(EnemyStatsSchema) stats = new EnemyStatsSchema();
  @type(EquipmentBonusesSchema) bonuses = new EquipmentBonusesSchema();

  @type('string') target?: string = '';
  @type('number') lastAttackTick: number = 0;
  @type('number') aggroRange: number = 5;
}

export class WaveSchema extends Schema {
  @type('number') current: number = 1;
  @type('number') enemiesRemaining: number = 0;
  @type('number') nextWaveIn: number = 0;
}

export class GameTimeSchema extends Schema {
  @type('number') tick: number = 0;
  @type('number') elapsed: number = 0;
}

export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type({ map: EnemySchema }) enemies = new MapSchema<EnemySchema>();
  @type(WaveSchema) wave = new WaveSchema();
  @type(GameTimeSchema) gameTime = new GameTimeSchema();
  @type('boolean') gameStarted: boolean = false;
  @type('boolean') gameEnded: boolean = false;
} 