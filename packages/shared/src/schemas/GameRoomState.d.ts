import { Schema, MapSchema, ArraySchema } from "@colyseus/schema";
import { Vector2, EquipmentBonuses, ItemData, CombatStats, Equipment } from "../types/game";
/**
 * COLYSEUS SCHEMAS FOR NETWORK SYNCHRONIZATION
 * These MUST stay perfectly in sync with shared types
 * DO NOT modify without updating shared types too
 */
export declare class Vector2Schema extends Schema implements Vector2 {
    x: number;
    y: number;
}
export declare class HealthSchema extends Schema {
    current: number;
    max: number;
}
export declare class SkillSchema extends Schema {
    level: number;
    xp: number;
    boosted: number;
}
export declare class CombatStatsSchema extends Schema implements CombatStats {
    attack: SkillSchema;
    strength: SkillSchema;
    defence: SkillSchema;
    hitpoints: SkillSchema;
    ranged: SkillSchema;
    prayer: SkillSchema;
    magic: SkillSchema;
}
export declare class EquipmentBonusesSchema extends Schema implements EquipmentBonuses {
    attackStab: number;
    attackSlash: number;
    attackCrush: number;
    attackMagic: number;
    attackRanged: number;
    defenceStab: number;
    defenceSlash: number;
    defenceCrush: number;
    defenceMagic: number;
    defenceRanged: number;
    meleeStrength: number;
    rangedStrength: number;
    magicDamage: number;
    prayer: number;
}
export declare class ItemSchema extends Schema implements ItemData {
    id: number;
    name: string;
    examine: string;
    equipmentSlot?: "weapon" | "helmet" | "chest" | "legs" | "shield" | "gloves" | "boots" | "ring" | "amulet";
    bonuses: EquipmentBonusesSchema;
    attackSpeed?: number;
    attackRange?: number;
}
export declare class EquipmentSchema extends Schema implements Equipment {
    weapon?: ItemSchema;
    helmet?: ItemSchema;
    chest?: ItemSchema;
    legs?: ItemSchema;
}
export declare class PrayerSchema extends Schema {
    points: number;
    activePrayers: ArraySchema<string>;
    drainRate: number;
}
export declare class SpecialAttackSchema extends Schema {
    energy: number;
    available: boolean;
}
export declare class PlayerSchema extends Schema {
    id: string;
    name: string;
    position: Vector2Schema;
    health: HealthSchema;
    stats: CombatStatsSchema;
    equipment: EquipmentSchema;
    prayer: PrayerSchema;
    specialAttack: SpecialAttackSchema;
    target?: string;
    lastAttackTick: number;
    inCombat: boolean;
}
export declare class EnemyStatsSchema extends Schema {
    attack: number;
    strength: number;
    defence: number;
    hitpoints: number;
}
export declare class EnemySchema extends Schema {
    id: string;
    type: string;
    position: Vector2Schema;
    health: HealthSchema;
    combatLevel: number;
    stats: EnemyStatsSchema;
    bonuses: EquipmentBonusesSchema;
    target?: string;
    lastAttackTick: number;
    aggroRange: number;
}
export declare class WaveSchema extends Schema {
    current: number;
    enemiesRemaining: number;
    nextWaveIn: number;
}
export declare class GameTimeSchema extends Schema {
    tick: number;
    elapsed: number;
}
export declare class GameRoomState extends Schema {
    players: MapSchema<PlayerSchema, string>;
    enemies: MapSchema<EnemySchema, string>;
    wave: WaveSchema;
    gameTime: GameTimeSchema;
    gameStarted: boolean;
    gameEnded: boolean;
}
//# sourceMappingURL=GameRoomState.d.ts.map