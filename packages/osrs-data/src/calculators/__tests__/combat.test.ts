/**
 * OSRS Combat Formula Validation Tests
 * These tests validate that our combat calculations match OSRS Wiki formulas exactly
 * 
 * Sources:
 * - https://oldschool.runescape.wiki/w/Combat_level
 * - https://oldschool.runescape.wiki/w/Maximum_hit
 * - https://oldschool.runescape.wiki/w/Accuracy
 * - https://oldschool.runescape.wiki/w/Attack_speed
 * 
 * @author agent/osrs-data (The Lorekeeper)
 */

import { OSRSCombatStats, OSRSEquipmentBonuses } from '../../../../shared/src/types/osrs';
import {
    calculateAccuracy,
    calculateCombatLevel,
    calculateMaxHit,
    getAttackSpeed
} from '../combat';

describe('OSRS Combat Formula Implementation', () => {
  describe('calculateMaxHit', () => {
    it('should calculate max hit using OSRS formula - Dragon Dagger example', () => {
      // Known test case: Level 70 Strength + Dragon Dagger (+18 str) + Aggressive style
      const stats: OSRSCombatStats = {
        attack: 70,
        strength: 70,
        defence: 60,
        hitpoints: 70,
        prayer: 43
      };

      const equipment: OSRSEquipmentBonuses = {
        attackBonus: 20, // Dragon dagger stab attack
        strengthBonus: 18, // Dragon dagger strength bonus
        defenceBonus: 0
      };

      // Aggressive style gives +3 strength bonus
      const styleBonus = 3;
      const prayerMultiplier = 1.0; // No prayer

      // Expected calculation:
      // Effective strength: floor(70 * 1.0) + 3 + 8 = 81
      // Max hit: floor(0.5 + (81 * (18 + 64)) / 640) = floor(0.5 + (81 * 82) / 640) = floor(0.5 + 10.390625) = 10
      const maxHit = calculateMaxHit(stats, equipment, prayerMultiplier, styleBonus);
      expect(maxHit).toBe(10);
    });

    it('should calculate max hit with prayer bonus', () => {
      const stats: OSRSCombatStats = {
        attack: 60,
        strength: 60,
        defence: 50,
        hitpoints: 60,
        prayer: 43
      };

      const equipment: OSRSEquipmentBonuses = {
        attackBonus: 15,
        strengthBonus: 15,
        defenceBonus: 0
      };

      // Ultimate Strength prayer gives 15% strength bonus (1.15 multiplier)
      const styleBonus = 3; // Aggressive
      const prayerMultiplier = 1.15; // Ultimate Strength prayer

      // Expected calculation:
      // Effective strength: floor(60 * 1.15) + 3 + 8 = floor(69) + 3 + 8 = 80
      // Max hit: floor(0.5 + (80 * (15 + 64)) / 640) = floor(0.5 + (80 * 79) / 640) = floor(0.5 + 9.875) = 10
      const maxHit = calculateMaxHit(stats, equipment, prayerMultiplier, styleBonus);
      expect(maxHit).toBe(10);
    });

    it('should handle base case with no equipment', () => {
      const stats: OSRSCombatStats = {
        attack: 1,
        strength: 1,
        defence: 1,
        hitpoints: 10,
        prayer: 1
      };

      const equipment: OSRSEquipmentBonuses = {
        attackBonus: 0,
        strengthBonus: 0,
        defenceBonus: 0
      };

      // No style bonus, no prayer
      const maxHit = calculateMaxHit(stats, equipment, 1.0, 0);
      
      // Expected calculation:
      // Effective strength: floor(1 * 1.0) + 0 + 8 = 9
      // Max hit: floor(0.5 + (9 * (0 + 64)) / 640) = floor(0.5 + (9 * 64) / 640) = floor(0.5 + 0.9) = 1
      expect(maxHit).toBe(1);
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate accuracy using OSRS formula - basic case', () => {
      const attackerStats: OSRSCombatStats = {
        attack: 70,
        strength: 70,
        defence: 60,
        hitpoints: 70,
        prayer: 43
      };

      const attackerEquipment: OSRSEquipmentBonuses = {
        attackBonus: 67, // Dragon scimitar slash attack
        strengthBonus: 66, // Dragon scimitar strength
        defenceBonus: 0
      };

      const defenderStats: OSRSCombatStats = {
        attack: 1,
        strength: 1,
        defence: 1, // Low defense target
        hitpoints: 10,
        prayer: 1
      };

      const defenderEquipment: OSRSEquipmentBonuses = {
        attackBonus: 0,
        strengthBonus: 0,
        defenceBonus: 0
      };

      // Accurate style for attacker (+3 attack), no style for defender
      const accuracy = calculateAccuracy(
        attackerStats,
        attackerEquipment,
        defenderStats,
        defenderEquipment,
        1.0, // No attacker prayer
        1.0, // No defender prayer
        3,   // Accurate style (+3 attack)
        0    // No defender style bonus
      );

      // Expected calculation:
      // Attacker effective attack: floor(70 * 1.0) + 3 + 8 = 81
      // Attacker max attack roll: 81 * (67 + 64) = 81 * 131 = 10611
      // Defender effective defence: floor(1 * 1.0) + 0 + 8 = 9
      // Defender max defence roll: 9 * (0 + 64) = 9 * 64 = 576
      // Since attack roll > defence roll: accuracy = 1 - (576 + 2) / (2 * (10611 + 1)) = 1 - 578 / 21224 = 1 - 0.0272 = 0.9728
      expect(accuracy).toBeCloseTo(0.9728, 3);
    });

    it('should handle case where attack roll equals defence roll', () => {
      const attackerStats: OSRSCombatStats = {
        attack: 40,
        strength: 40,
        defence: 30,
        hitpoints: 40,
        prayer: 20
      };

      const attackerEquipment: OSRSEquipmentBonuses = {
        attackBonus: 20,
        strengthBonus: 18,
        defenceBonus: 0
      };

      const defenderStats: OSRSCombatStats = {
        attack: 1,
        strength: 1,
        defence: 40,
        hitpoints: 30,
        prayer: 1
      };

      const defenderEquipment: OSRSEquipmentBonuses = {
        attackBonus: 0,
        strengthBonus: 0,
        defenceBonus: 20
      };

      const accuracy = calculateAccuracy(
        attackerStats,
        attackerEquipment,
        defenderStats,
        defenderEquipment,
        1.0,
        1.0,
        0,
        0
      );

      // Should be around 0.5 when attack and defence are roughly equal
      expect(accuracy).toBeGreaterThan(0.1);
      expect(accuracy).toBeLessThan(0.9);
    });

    it('should return minimum accuracy of 0', () => {
      const weakAttacker: OSRSCombatStats = {
        attack: 1,
        strength: 1,
        defence: 1,
        hitpoints: 10,
        prayer: 1
      };

      const noEquipment: OSRSEquipmentBonuses = {
        attackBonus: 0,
        strengthBonus: 0,
        defenceBonus: 0
      };

      const strongDefender: OSRSCombatStats = {
        attack: 99,
        strength: 99,
        defence: 99,
        hitpoints: 99,
        prayer: 99
      };

      const strongDefenseEquipment: OSRSEquipmentBonuses = {
        attackBonus: 0,
        strengthBonus: 0,
        defenceBonus: 200 // Very high defense bonus
      };

      const accuracy = calculateAccuracy(
        weakAttacker,
        noEquipment,
        strongDefender,
        strongDefenseEquipment
      );

      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateCombatLevel', () => {
    it('should calculate combat level using OSRS formula - basic case', () => {
      const stats: OSRSCombatStats = {
        attack: 70,
        strength: 70,
        defence: 60,
        hitpoints: 70,
        prayer: 43
      };

      // Expected calculation:
      // Base: 0.25 * (60 + 70 + floor(43/2)) = 0.25 * (60 + 70 + 21) = 0.25 * 151 = 37.75
      // Melee: 0.325 * (70 + 70) = 0.325 * 140 = 45.5
      // Combat level: floor(37.75 + 45.5) = floor(83.25) = 83
      const combatLevel = calculateCombatLevel(stats);
      expect(combatLevel).toBe(83);
    });

    it('should calculate minimum combat level', () => {
      const stats: OSRSCombatStats = {
        attack: 1,
        strength: 1,
        defence: 1,
        hitpoints: 10,
        prayer: 1
      };

      // Should never be below 3 in OSRS
      const combatLevel = calculateCombatLevel(stats);
      expect(combatLevel).toBeGreaterThanOrEqual(3);
    });

    it('should calculate high level combat accurately', () => {
      const stats: OSRSCombatStats = {
        attack: 99,
        strength: 99,
        defence: 99,
        hitpoints: 99,
        prayer: 99
      };

      // Expected calculation:
      // Base: 0.25 * (99 + 99 + floor(99/2)) = 0.25 * (99 + 99 + 49) = 0.25 * 247 = 61.75
      // Melee: 0.325 * (99 + 99) = 0.325 * 198 = 64.35
      // Combat level: floor(61.75 + 64.35) = floor(126.1) = 126
      const combatLevel = calculateCombatLevel(stats);
      expect(combatLevel).toBe(126);
    });
  });

  describe('getAttackSpeed', () => {
    it('should return correct attack speeds for various weapons', () => {
      // Fast weapons (4 ticks)
      expect(getAttackSpeed('dragon_dagger')).toBe(4);
      expect(getAttackSpeed('dragon_scimitar')).toBe(4);
      expect(getAttackSpeed('bronze_sword')).toBe(4);

      // Medium weapons (5 ticks)
      expect(getAttackSpeed('dragon_longsword')).toBe(5);
      expect(getAttackSpeed('rune_mace')).toBe(5);

      // Slow weapons (6+ ticks)
      expect(getAttackSpeed('dragon_battleaxe')).toBe(6);
      expect(getAttackSpeed('dragon_warhammer')).toBe(6);
      expect(getAttackSpeed('rune_2h_sword')).toBe(7);
    });

    it('should return default speed for unknown weapons', () => {
      expect(getAttackSpeed('unknown_weapon')).toBe(4);
      expect(getAttackSpeed('')).toBe(4);
    });

    it('should handle unarmed combat', () => {
      expect(getAttackSpeed('unarmed')).toBe(4);
    });
  });

  describe('Integration Tests - Real OSRS Examples', () => {
    it('should match known Dragon Scimitar DPS calculations', () => {
      // Level 70 Attack/Strength player with Dragon Scimitar
      const playerStats: OSRSCombatStats = {
        attack: 70,
        strength: 70,
        defence: 60,
        hitpoints: 70,
        prayer: 43
      };

      const dragonScimitar: OSRSEquipmentBonuses = {
        attackBonus: 67, // Dragon scimitar slash attack bonus
        strengthBonus: 66, // Dragon scimitar strength bonus
        defenceBonus: 0
      };

      // Test against a typical enemy (like a Hill Giant)
      const hillGiantStats: OSRSCombatStats = {
        attack: 18,
        strength: 22,
        defence: 26,
        hitpoints: 35,
        prayer: 1
      };

      const hillGiantEquipment: OSRSEquipmentBonuses = {
        attackBonus: 0,
        strengthBonus: 0,
        defenceBonus: 15 // Moderate defense
      };

      // Aggressive style for max damage
      const maxHit = calculateMaxHit(playerStats, dragonScimitar, 1.0, 3);
      const accuracy = calculateAccuracy(
        playerStats,
        dragonScimitar,
        hillGiantStats,
        hillGiantEquipment,
        1.0,
        1.0,
        3, // Aggressive style
        0
      );
      const attackSpeed = getAttackSpeed('dragon_scimitar');

      // Validate reasonable results
      expect(maxHit).toBeGreaterThan(10); // Should hit fairly hard
      expect(maxHit).toBeLessThan(20);    // But not unreasonably high
      expect(accuracy).toBeGreaterThan(0.8); // Should hit most of the time
      expect(attackSpeed).toBe(4); // Dragon scimitar is fast (4 ticks)

      // Calculate approximate DPS (simplified)
      const averageDamage = maxHit * 0.5 * accuracy; // Assume average hit is max/2
      const dps = averageDamage / (attackSpeed * 0.6); // 0.6 seconds per tick

      expect(dps).toBeGreaterThan(1); // Should have reasonable DPS
      expect(dps).toBeLessThan(10);   // But not overpowered
    });
  });
});
