/**
 * OSRS-SPECIFIC CONSTANTS AND ENUMS
 * These MUST match OSRS exactly for authenticity
 */
export declare enum Prayer {
    THICK_SKIN = "thick_skin",
    BURST_OF_STRENGTH = "burst_of_strength",
    CLARITY_OF_THOUGHT = "clarity_of_thought",
    SHARP_EYE = "sharp_eye",
    MYSTIC_WILL = "mystic_will",
    ROCK_SKIN = "rock_skin",
    SUPERHUMAN_STRENGTH = "superhuman_strength",
    IMPROVED_REFLEXES = "improved_reflexes",
    RAPID_RESTORE = "rapid_restore",
    RAPID_HEAL = "rapid_heal",
    PROTECT_ITEM = "protect_item",
    HAWK_EYE = "hawk_eye",
    MYSTIC_LORE = "mystic_lore",
    STEEL_SKIN = "steel_skin",
    ULTIMATE_STRENGTH = "ultimate_strength",
    INCREDIBLE_REFLEXES = "incredible_reflexes",
    PROTECT_FROM_MAGIC = "protect_from_magic",
    PROTECT_FROM_MISSILES = "protect_from_missiles",
    PROTECT_FROM_MELEE = "protect_from_melee",
    EAGLE_EYE = "eagle_eye",
    MYSTIC_MIGHT = "mystic_might",
    RETRIBUTION = "retribution",
    REDEMPTION = "redemption",
    SMITE = "smite",
    CHIVALRY = "chivalry",
    PIETY = "piety"
}
export interface PrayerEffect {
    drainRate: number;
    attackBonus?: number;
    strengthBonus?: number;
    defenceBonus?: number;
    rangedBonus?: number;
    magicBonus?: number;
    protectionType?: "melee" | "ranged" | "magic";
    protectionAmount?: number;
}
export declare const PRAYER_EFFECTS: Record<Prayer, PrayerEffect>;
export declare const WEAPON_SPEEDS: Record<string, number>;
export declare enum CombatStyle {
    ACCURATE = "accurate",// +3 attack levels
    AGGRESSIVE = "aggressive",// +3 strength levels
    DEFENSIVE = "defensive",// +3 defence levels
    CONTROLLED = "controlled"
}
export declare const COMBAT_XP_RATES: {
    accurate: {
        attack: number;
        strength: number;
        defence: number;
        hitpoints: number;
    };
    aggressive: {
        attack: number;
        strength: number;
        defence: number;
        hitpoints: number;
    };
    defensive: {
        attack: number;
        strength: number;
        defence: number;
        hitpoints: number;
    };
    controlled: {
        attack: number;
        strength: number;
        defence: number;
        hitpoints: number;
    };
};
/**
 * OSRS Combat Stats Interface
 * Player combat levels for damage and accuracy calculations
 */
export interface OSRSCombatStats {
    attack: number;
    strength: number;
    defence: number;
    hitpoints: number;
    prayer: number;
    ranged?: number;
    magic?: number;
}
/**
 * OSRS Equipment Bonuses Interface
 * Equipment attack, strength, and defence bonuses
 */
export interface OSRSEquipmentBonuses {
    attackBonus: number;
    strengthBonus: number;
    defenceBonus: number;
    attackStab?: number;
    attackSlash?: number;
    attackCrush?: number;
    attackMagic?: number;
    attackRanged?: number;
    defenceStab?: number;
    defenceSlash?: number;
    defenceCrush?: number;
    defenceMagic?: number;
    defenceRanged?: number;
    rangedStrengthBonus?: number;
    magicDamageBonus?: number;
    prayerBonus?: number;
}
