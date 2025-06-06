// AI MEMORY ANCHOR: See docs/ROADMAP.md and docs/MEMORIES.md for current project goals and persistent AI context.
import {
  PrayerSystem,
  PrayerCategory,
  EffectType,
  StatType,
  ProtectionType,
} from '../../game/PrayerSystem';
import { Player, Skills, Skill } from '../../game/EntitySchemas';

// Mock implementation to avoid timer issues in tests
class MockPrayerSystem extends PrayerSystem {
  constructor(player: Player) {
    super(player);
    // Override the drain timer to avoid actual timing in tests
    this['drainInterval'] = null;
  }

  // Expose the protected method for testing
  public testProcessPrayerDrain(): void {
    this['processPrayerDrain']();
  }

  // Manually trigger prayer drain for testing
  public manualDrain(amount: number): void {
    this['player'].drainPrayerPoints(amount);
  }
}

describe('PrayerSystem', () => {
  let player: Player;
  let prayerSystem: MockPrayerSystem;

  beforeEach(() => {
    player = new Player();
    player.id = 'test-player';
    player.username = 'TestPlayer';

    // Set up skills with proper prayer level
    player.skills = new Skills();
    player.skills.attack.level = 50;
    player.skills.strength.level = 50;
    player.skills.defence.level = 50;
    player.skills.prayer.level = 43; // Enough for basic prayers

    // Set up prayer points
    player.updateMaxPrayerPoints();
    player.prayerPoints = player.maxPrayerPoints;
    player.prayerBonus = 0;

    prayerSystem = new MockPrayerSystem(player);
  });

  afterEach(() => {
    prayerSystem.destroy();
  });

  describe('Prayer Activation', () => {
    test('should activate valid prayer', () => {
      const result = prayerSystem.activatePrayer('clarity_of_thought');
      expect(result).toBe(true);
      expect(prayerSystem.isActive('clarity_of_thought')).toBe(true);
      expect(player.activePrayers).toContain('clarity_of_thought');
    });

    test('should not activate prayer with insufficient level', () => {
      player.skills.prayer.level = 5; // Too low for most prayers
      const result = prayerSystem.activatePrayer('protect_from_melee');
      expect(result).toBe(false);
      expect(prayerSystem.isActive('protect_from_melee')).toBe(false);
    });

    test('should not activate prayer with no prayer points', () => {
      player.prayerPoints = 0;
      const result = prayerSystem.activatePrayer('clarity_of_thought');
      expect(result).toBe(false);
      expect(prayerSystem.isActive('clarity_of_thought')).toBe(false);
    });

    test('should not activate already active prayer', () => {
      prayerSystem.activatePrayer('clarity_of_thought');
      const result = prayerSystem.activatePrayer('clarity_of_thought');
      expect(result).toBe(false);
      expect(player.activePrayers.filter(p => p === 'clarity_of_thought')).toHaveLength(1);
    });
  });

  describe('Prayer Conflicts', () => {
    test('should deactivate conflicting prayers when activating new one', () => {
      // Activate first prayer
      prayerSystem.activatePrayer('clarity_of_thought');
      expect(prayerSystem.isActive('clarity_of_thought')).toBe(true);

      // Activate conflicting prayer
      prayerSystem.activatePrayer('improved_reflexes');
      expect(prayerSystem.isActive('improved_reflexes')).toBe(true);
      expect(prayerSystem.isActive('clarity_of_thought')).toBe(false);
    });

    test('should deactivate multiple conflicting prayers', () => {
      // Set prayer level high enough for Piety
      player.skills.prayer.level = 70;

      // Activate individual stat prayers
      prayerSystem.activatePrayer('clarity_of_thought');
      prayerSystem.activatePrayer('burst_of_strength');
      prayerSystem.activatePrayer('thick_skin');

      expect(prayerSystem.isActive('clarity_of_thought')).toBe(true);
      expect(prayerSystem.isActive('burst_of_strength')).toBe(true);
      expect(prayerSystem.isActive('thick_skin')).toBe(true);

      // Activate Piety (conflicts with all individual stat prayers)
      prayerSystem.activatePrayer('piety');
      expect(prayerSystem.isActive('piety')).toBe(true);
      expect(prayerSystem.isActive('clarity_of_thought')).toBe(false);
      expect(prayerSystem.isActive('burst_of_strength')).toBe(false);
      expect(prayerSystem.isActive('thick_skin')).toBe(false);
    });
  });

  describe('Prayer Deactivation', () => {
    test('should deactivate specific prayer', () => {
      prayerSystem.activatePrayer('clarity_of_thought');
      expect(prayerSystem.isActive('clarity_of_thought')).toBe(true);

      prayerSystem.deactivatePrayer('clarity_of_thought');
      expect(prayerSystem.isActive('clarity_of_thought')).toBe(false);
      expect(player.activePrayers).not.toContain('clarity_of_thought');
    });

    test('should deactivate all prayers', () => {
      prayerSystem.activatePrayer('clarity_of_thought');
      prayerSystem.activatePrayer('protect_from_melee');
      expect(player.activePrayers.length).toBe(2);

      prayerSystem.deactivateAllPrayers();
      expect(player.activePrayers.length).toBe(0);
    });
  });

  describe('Prayer Bonuses', () => {
    test('should calculate attack bonus correctly', () => {
      prayerSystem.activatePrayer('clarity_of_thought'); // +5% attack
      const attackBonus = prayerSystem.getAttackBonus();
      const expectedBonus = Math.floor(player.skills.attack.level * 0.05);
      expect(attackBonus).toBe(expectedBonus);
    });

    test('should calculate strength bonus correctly', () => {
      prayerSystem.activatePrayer('burst_of_strength'); // +5% strength
      const strengthBonus = prayerSystem.getStrengthBonus();
      const expectedBonus = Math.floor(player.skills.strength.level * 0.05);
      expect(strengthBonus).toBe(expectedBonus);
    });

    test('should calculate defence bonus correctly', () => {
      prayerSystem.activatePrayer('thick_skin'); // +5% defence
      const defenceBonus = prayerSystem.getDefenceBonus();
      const expectedBonus = Math.floor(player.skills.defence.level * 0.05);
      expect(defenceBonus).toBe(expectedBonus);
    });

    test('should stack multiple prayer bonuses', () => {
      player.skills.prayer.level = 70; // High enough for Piety
      prayerSystem.activatePrayer('piety'); // +20% attack, +23% strength, +25% defence

      const attackBonus = prayerSystem.getAttackBonus();
      const strengthBonus = prayerSystem.getStrengthBonus();
      const defenceBonus = prayerSystem.getDefenceBonus();

      expect(attackBonus).toBe(Math.floor(player.skills.attack.level * 0.2));
      expect(strengthBonus).toBe(Math.floor(player.skills.strength.level * 0.23));
      expect(defenceBonus).toBe(Math.floor(player.skills.defence.level * 0.25));
    });
  });

  describe('Protection Prayers', () => {
    test('should identify protection effects', () => {
      prayerSystem.activatePrayer('protect_from_melee');
      const protections = prayerSystem.getProtectionEffects();
      expect(protections).toContain(ProtectionType.MELEE);
    });

    test('should handle multiple protection prayers', () => {
      prayerSystem.activatePrayer('protect_from_melee');
      prayerSystem.activatePrayer('protect_from_magic');
      const protections = prayerSystem.getProtectionEffects();
      expect(protections).toContain(ProtectionType.MELEE);
      expect(protections).toContain(ProtectionType.MAGIC);
      expect(protections).toHaveLength(2);
    });
  });

  describe('Prayer Point Management', () => {
    test('should drain prayer points when prayers are active', () => {
      const initialPoints = player.prayerPoints;
      prayerSystem.activatePrayer('clarity_of_thought');

      // Manually trigger drain for testing
      prayerSystem.testProcessPrayerDrain();

      expect(player.prayerPoints).toBeLessThan(initialPoints);
    });

    test('should deactivate all prayers when prayer points reach zero', () => {
      prayerSystem.activatePrayer('clarity_of_thought');
      prayerSystem.activatePrayer('burst_of_strength');
      expect(player.activePrayers.length).toBe(2);

      // Drain all prayer points
      player.prayerPoints = 0;
      prayerSystem.testProcessPrayerDrain();

      expect(player.activePrayers.length).toBe(0);
    });

    test('should respect prayer bonus for drain rate', () => {
      player.prayerBonus = 15; // +50% prayer duration
      prayerSystem.activatePrayer('clarity_of_thought');

      const initialPoints = player.prayerPoints;
      prayerSystem.testProcessPrayerDrain();

      // With +15 prayer bonus, drain should be reduced by 50%
      const drainedAmount = initialPoints - player.prayerPoints;
      expect(drainedAmount).toBeLessThan(0.1); // Very small drain due to bonus
    });
  });

  describe('Prayer System Information', () => {
    test('should return all prayers', () => {
      const allPrayers = prayerSystem.getAllPrayers();
      expect(allPrayers.length).toBeGreaterThan(0);
      expect(allPrayers.some(p => p.id === 'clarity_of_thought')).toBe(true);
      expect(allPrayers.some(p => p.id === 'piety')).toBe(true);
    });

    test('should return available prayers based on level', () => {
      player.skills.prayer.level = 10;
      const availablePrayers = prayerSystem.getAvailablePrayers();

      expect(availablePrayers.every(p => p.levelRequired <= 10)).toBe(true);
      expect(availablePrayers.some(p => p.id === 'clarity_of_thought')).toBe(true);
      expect(availablePrayers.some(p => p.id === 'piety')).toBe(false); // Requires level 70
    });

    test('should return specific prayer by ID', () => {
      const prayer = prayerSystem.getPrayer('clarity_of_thought');
      expect(prayer).toBeDefined();
      expect(prayer?.name).toBe('Clarity of Thought');
      expect(prayer?.levelRequired).toBe(7);
    });

    test('should return undefined for non-existent prayer', () => {
      const prayer = prayerSystem.getPrayer('non_existent_prayer');
      expect(prayer).toBeUndefined();
    });
  });

  describe('Max Prayer Points Update', () => {
    test('should update max prayer points when prayer level changes', () => {
      player.skills.prayer.level = 50;
      player.updateMaxPrayerPoints();
      expect(player.maxPrayerPoints).toBe(50);
    });

    test('should cap current prayer points when max decreases', () => {
      player.skills.prayer.level = 50;
      player.updateMaxPrayerPoints();
      player.prayerPoints = 50;

      player.skills.prayer.level = 30;
      player.updateMaxPrayerPoints();
      expect(player.maxPrayerPoints).toBe(30);
      expect(player.prayerPoints).toBe(30);
    });
  });

  describe('Prayer Point Restoration and Draining', () => {
    test('should restore prayer points correctly', () => {
      player.prayerPoints = 10;
      player.restorePrayerPoints(15);
      expect(player.prayerPoints).toBe(25);
    });

    test('should cap restoration at max prayer points', () => {
      player.prayerPoints = player.maxPrayerPoints - 5;
      player.restorePrayerPoints(10);
      expect(player.prayerPoints).toBe(player.maxPrayerPoints);
    });

    test('should drain prayer points correctly', () => {
      const initial = player.prayerPoints;
      player.drainPrayerPoints(10);
      expect(player.prayerPoints).toBe(initial - 10);
    });

    test('should not drain below zero', () => {
      player.prayerPoints = 5;
      player.drainPrayerPoints(10);
      expect(player.prayerPoints).toBe(0);
    });
  });
});
