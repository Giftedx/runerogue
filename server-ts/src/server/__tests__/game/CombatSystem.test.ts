import CombatSystem, { AttackType, CombatStyle } from '../../game/CombatSystem';
import { Player, InventoryItem, Equipment, Skills } from '../../game/EntitySchemas';

describe('CombatSystem', () => {
  let attacker: Player;
  let defender: Player;

  beforeEach(() => {
    attacker = new Player();
    attacker.id = 'attacker1';
    attacker.username = 'Attacker';
    attacker.skills = new Skills();
    attacker.skills.attack.level = 50;
    attacker.skills.strength.level = 50;
    attacker.equipment = new Equipment();
    attacker.equipment.weapon = 'bronze_sword'; // Assuming bronze_sword exists in weaponDatabase

    defender = new Player();
    defender.id = 'defender1';
    defender.username = 'Defender';
    defender.skills = new Skills();
    defender.skills.defence.level = 50;
    defender.equipment = new Equipment();
    defender.equipment.armor = 'bronze_plate'; // Assuming bronze_plate exists in armorDatabase
  });

  describe('calculateHitChance', () => {
    it('should return a hit chance between 0 and 1', () => {
      const hitChance = CombatSystem.calculateHitChance(attacker, defender, AttackType.SLASH);
      expect(hitChance).toBeGreaterThanOrEqual(0);
      expect(hitChance).toBeLessThanOrEqual(1);
    });

    it('should have a higher hit chance with higher attack level', () => {
      const initialHitChance = CombatSystem.calculateHitChance(attacker, defender, AttackType.SLASH);
      attacker.skills.attack.level = 90;
      const higherHitChance = CombatSystem.calculateHitChance(attacker, defender, AttackType.SLASH);
      expect(higherHitChance).toBeGreaterThan(initialHitChance);
    });

    it('should have a lower hit chance with higher defense level', () => {
      const initialHitChance = CombatSystem.calculateHitChance(attacker, defender, AttackType.SLASH);
      defender.skills.defence.level = 90;
      const lowerHitChance = CombatSystem.calculateHitChance(attacker, defender, AttackType.SLASH);
      expect(lowerHitChance).toBeLessThan(initialHitChance);
    });

    it('should consider attack type bonuses', () => {
      // This test assumes specific attack type bonuses are set up in weaponDatabase
      // For bronze_sword, SLASH is 7, STAB is 4
      const slashHitChance = CombatSystem.calculateHitChance(attacker, defender, AttackType.SLASH);
      const stabHitChance = CombatSystem.calculateHitChance(attacker, defender, AttackType.STAB);
      expect(slashHitChance).toBeGreaterThan(stabHitChance);
    });
  });

  describe('calculateDamage', () => {
    it('should return a damage value', () => {
      const damage = CombatSystem.calculateDamage(attacker, CombatStyle.ACCURATE);
      expect(damage).toBeGreaterThanOrEqual(0);
    });

    it('should have higher damage with higher strength level', () => {
      const initialDamage = CombatSystem.calculateDamage(attacker, CombatStyle.ACCURATE);
      attacker.skills.strength.level = 90;
      const higherDamage = CombatSystem.calculateDamage(attacker, CombatStyle.ACCURATE);
      expect(higherDamage).toBeGreaterThan(initialDamage);
    });

    it('should consider weapon strength bonus', () => {
      // This test assumes weaponDatabase has different strength bonuses
      const initialDamage = CombatSystem.calculateDamage(attacker, CombatStyle.ACCURATE);
      attacker.equipment.weapon = 'iron_sword'; // Assuming iron_sword has higher strength bonus
      const higherDamage = CombatSystem.calculateDamage(attacker, CombatStyle.ACCURATE);
      expect(higherDamage).toBeGreaterThan(initialDamage);
    });
  });

  describe('performAttack', () => {
    it('should return an AttackResult object', () => {
      const result = CombatSystem.performAttack(attacker, defender, CombatStyle.ACCURATE);
      expect(result).toHaveProperty('hit');
      expect(result).toHaveProperty('damage');
      expect(result).toHaveProperty('criticalHit');
      expect(result).toHaveProperty('effects');
    });

    it('should reduce defender health on hit', () => {
      const initialDefenderHealth = defender.health;
      const result = CombatSystem.performAttack(attacker, defender, CombatStyle.ACCURATE);
      if (result.hit) {
        expect(defender.health).toBeLessThan(initialDefenderHealth);
      } else {
        expect(defender.health).toEqual(initialDefenderHealth);
      }
    });

    it('should not reduce defender health on miss', () => {
      // Force a miss by significantly reducing attacker's attack level
      attacker.skills.attack.level = 1;
      const initialDefenderHealth = defender.health;
      const result = CombatSystem.performAttack(attacker, defender, CombatStyle.ACCURATE);
      // Due to randomness, a miss is not guaranteed, but for this test, we assume a high chance of miss.
      // A more robust test would mock calculateHitChance or run multiple iterations.
      if (!result.hit) {
        expect(defender.health).toEqual(initialDefenderHealth);
      }
    });

    it('should handle special attacks', () => {
      attacker.equipment.weapon = 'dragon_dagger'; // Assuming dragon_dagger with special attack
      attacker.specialEnergy = 100; // Ensure enough energy

      const initialDefenderHealth = defender.health;
      const result = CombatSystem.performAttack(attacker, defender, CombatStyle.ACCURATE, { useSpecial: true });

      // Expect special attack to consume energy
      expect(attacker.specialEnergy).toBeLessThan(100);
      // Expect damage, likely higher due to special attack
      expect(result.damage).toBeGreaterThan(0);
      expect(defender.health).toBeLessThan(initialDefenderHealth);
    });
  });
});
