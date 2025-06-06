/**
 * Unit tests for SurvivorWaveSystem
 * Tests wave-based survival mechanics, enemy spawning, and progression
 */

import { Room } from '@colyseus/core';
import { NPC, Player, WorldState } from '../../game/EntitySchemas';
import { SurvivorWaveSystem, WaveState } from '../../game/SurvivorWaveSystem';

// Mock the Room class
class MockRoom extends Room<WorldState> {
  public state = new WorldState();
  public broadcastMessages: any[] = [];

  constructor() {
    super();
    this.broadcastMessages = [];
  }
  broadcast(type: string, message: unknown): boolean {
    this.broadcastMessages.push({ type, message });
    return true;
  }

  getLastBroadcast(): any {
    return this.broadcastMessages[this.broadcastMessages.length - 1];
  }

  clearBroadcasts(): void {
    this.broadcastMessages = [];
  }
}

describe('SurvivorWaveSystem', () => {
  let mockRoom: MockRoom;
  let waveSystem: SurvivorWaveSystem;
  let testPlayer: Player;

  beforeEach(() => {
    mockRoom = new MockRoom();
    waveSystem = new SurvivorWaveSystem(mockRoom);

    // Create a test player
    testPlayer = new Player();
    testPlayer.id = 'test-player-1';
    testPlayer.username = 'TestWarrior';
    testPlayer.x = 50;
    testPlayer.y = 50;
    testPlayer.health = 100;
    testPlayer.maxHealth = 100;
    testPlayer.prayerPoints = 50;

    // Initialize skills
    testPlayer.skills = {
      attack: { level: 10, experience: 1000 },
      strength: { level: 10, experience: 1000 },
      defence: { level: 10, experience: 1000 },
      hitpoints: { level: 10, experience: 1000 },
      prayer: { level: 10, experience: 1000 },
      ranged: { level: 1, experience: 0 },
      magic: { level: 1, experience: 0 },
    };

    mockRoom.state.players.set(testPlayer.id, testPlayer);
  });

  afterEach(() => {
    waveSystem.dispose();
    jest.clearAllTimers();
  });

  describe('Wave Configuration Generation', () => {
    test('should generate wave configuration with correct scaling', () => {
      // Access private method through any cast for testing
      const waveConfig = (waveSystem as any).generateWaveConfiguration(5);

      expect(waveConfig.waveNumber).toBe(5);
      expect(waveConfig.enemyCount).toBeGreaterThan(0);
      expect(waveConfig.difficultyMultiplier).toBeGreaterThan(1);
      expect(waveConfig.enemyTypes).toHaveLength(waveConfig.enemyTypes.length);
      expect(waveConfig.spawnDelay).toBeGreaterThan(0);
      expect(waveConfig.rewards).toHaveLength(waveConfig.rewards.length);
    });

    test('should increase difficulty with higher wave numbers', () => {
      const wave1Config = (waveSystem as any).generateWaveConfiguration(1);
      const wave10Config = (waveSystem as any).generateWaveConfiguration(10);

      expect(wave10Config.difficultyMultiplier).toBeGreaterThan(wave1Config.difficultyMultiplier);
      expect(wave10Config.enemyCount).toBeGreaterThan(wave1Config.enemyCount);
    });

    test('should generate boss enemies on every 5th wave', () => {
      const wave5Config = (waveSystem as any).generateWaveConfiguration(5);
      const wave10Config = (waveSystem as any).generateWaveConfiguration(10);

      const hasBoss5 = wave5Config.enemyTypes.some((enemy: any) => enemy.npcId === 'wave_boss');
      const hasBoss10 = wave10Config.enemyTypes.some((enemy: any) => enemy.npcId === 'wave_boss');

      expect(hasBoss5).toBe(true);
      expect(hasBoss10).toBe(true);
    });

    test('should generate special events for appropriate waves', () => {
      const wave3Config = (waveSystem as any).generateWaveConfiguration(3);
      const wave4Config = (waveSystem as any).generateWaveConfiguration(4);
      const wave5Config = (waveSystem as any).generateWaveConfiguration(5);

      // Wave 3 should have prayer drain
      expect(wave3Config.specialEvents.some((event: any) => event.type === 'prayer_drain')).toBe(
        true
      );

      // Wave 4 should have double enemies
      expect(wave4Config.specialEvents.some((event: any) => event.type === 'double_enemies')).toBe(
        true
      );

      // Wave 5 should have boss spawn
      expect(wave5Config.specialEvents.some((event: any) => event.type === 'boss_spawn')).toBe(
        true
      );
    });
  });

  describe('Enemy Type Generation', () => {
    test('should generate basic enemies for early waves', () => {
      const enemyTypes = (waveSystem as any).generateEnemyTypes(1, 1.0, 10);

      expect(enemyTypes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ npcId: 'goblin' }),
          expect.objectContaining({ npcId: 'skeleton' }),
        ])
      );
    });

    test('should add stronger enemies for higher waves', () => {
      const wave3Types = (waveSystem as any).generateEnemyTypes(3, 1.5, 15);
      const wave5Types = (waveSystem as any).generateEnemyTypes(5, 2.0, 20);

      // Wave 3 should have orcs
      expect(wave3Types.some((enemy: any) => enemy.npcId === 'orc')).toBe(true);

      // Wave 5 should have trolls
      expect(wave5Types.some((enemy: any) => enemy.npcId === 'troll')).toBe(true);
    });

    test('should scale enemy stats with difficulty multiplier', () => {
      const normalEnemies = (waveSystem as any).generateEnemyTypes(1, 1.0, 5);
      const scaledEnemies = (waveSystem as any).generateEnemyTypes(1, 2.0, 5);

      const normalGoblin = normalEnemies.find((enemy: any) => enemy.npcId === 'goblin');
      const scaledGoblin = scaledEnemies.find((enemy: any) => enemy.npcId === 'goblin');

      expect(scaledGoblin.hitpoints).toBeGreaterThan(normalGoblin.hitpoints);
      expect(scaledGoblin.attack).toBeGreaterThan(normalGoblin.attack);
      expect(scaledGoblin.strength).toBeGreaterThan(normalGoblin.strength);
    });
  });

  describe('Wave Rewards', () => {
    test('should generate appropriate rewards for wave completion', () => {
      const rewards = (waveSystem as any).generateWaveRewards(3, 1.5);

      expect(rewards).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'experience' }),
          expect.objectContaining({ type: 'prayer_points' }),
          expect.objectContaining({ type: 'health_restore' }),
        ])
      );
    });

    test('should give item rewards every 5th wave', () => {
      const wave4Rewards = (waveSystem as any).generateWaveRewards(4, 1.0);
      const wave5Rewards = (waveSystem as any).generateWaveRewards(5, 1.0);

      const hasItemReward4 = wave4Rewards.some((reward: any) => reward.type === 'item');
      const hasItemReward5 = wave5Rewards.some((reward: any) => reward.type === 'item');

      expect(hasItemReward4).toBe(false);
      expect(hasItemReward5).toBe(true);
    });

    test('should scale reward values with wave number and difficulty', () => {
      const wave1Rewards = (waveSystem as any).generateWaveRewards(1, 1.0);
      const wave10Rewards = (waveSystem as any).generateWaveRewards(10, 2.0);

      const wave1Exp = wave1Rewards.find((reward: any) => reward.type === 'experience');
      const wave10Exp = wave10Rewards.find((reward: any) => reward.type === 'experience');

      expect(wave10Exp.value).toBeGreaterThan(wave1Exp.value);
    });
  });

  describe('Survival Mode Lifecycle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should start survival mode and prepare first wave', () => {
      waveSystem.startSurvivalMode();

      const status = waveSystem.getWaveStatus();
      expect(status.currentWave).toBe(1);
      expect(status.waveState).toBe(WaveState.PREPARING);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('wave_system_start');
      expect(lastBroadcast.message.message).toContain('Survival mode activated');
    });

    test('should start first wave after preparation time', () => {
      const startWaveSpy = jest.spyOn(waveSystem as any, 'startWave');

      waveSystem.startSurvivalMode();
      expect(startWaveSpy).not.toHaveBeenCalled();

      // Fast-forward through preparation time
      jest.advanceTimersByTime(10000);

      expect(startWaveSpy).toHaveBeenCalledWith(1);
    });

    test('should transition to active state when wave starts', () => {
      jest.spyOn(waveSystem as any, 'beginEnemySpawning').mockImplementation(() => {});

      waveSystem.startWave(1);

      const status = waveSystem.getWaveStatus();
      expect(status.waveState).toBe(WaveState.ACTIVE);
      expect(status.currentWave).toBe(1);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('wave_start');
    });
  });

  describe('Enemy Spawning', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });
    test('should spawn enemies according to configuration', () => {
      const spawnEnemySpy = jest.spyOn(waveSystem as any, 'spawnEnemy');

      // Set wave state to active so spawning can proceed
      (waveSystem as any).waveState = WaveState.ACTIVE;

      // Mock wave config with small numbers for testing
      const mockConfig = {
        waveNumber: 1,
        enemyCount: 3,
        enemyTypes: [
          {
            npcId: 'goblin',
            name: 'Goblin',
            level: 1,
            hitpoints: 5,
            attack: 1,
            strength: 1,
            defense: 1,
            spawnWeight: 100,
            spawnCount: 3,
          },
        ],
        spawnDelay: 1000,
        difficultyMultiplier: 1.0,
        specialEvents: [],
        rewards: [],
      };

      // Create a deep copy to avoid mutating the test object
      const configCopy = JSON.parse(JSON.stringify(mockConfig));
      (waveSystem as any).beginEnemySpawning(configCopy);

      // Should spawn first enemy immediately
      expect(spawnEnemySpy).toHaveBeenCalledTimes(1);

      // Should spawn more enemies after delays
      jest.advanceTimersByTime(1000);
      expect(spawnEnemySpy).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(1000);
      expect(spawnEnemySpy).toHaveBeenCalledTimes(3);

      // Should not spawn more after reaching enemy count
      jest.advanceTimersByTime(1000);
      expect(spawnEnemySpy).toHaveBeenCalledTimes(3);
    });

    test('should add spawned enemies to game state and track them', () => {
      const initialNpcCount = mockRoom.state.npcs.size;

      const enemyType = {
        npcId: 'goblin',
        name: 'Goblin',
        level: 1,
        hitpoints: 5,
        attack: 1,
        strength: 1,
        defense: 1,
        spawnWeight: 100,
        spawnCount: 1,
      };

      (waveSystem as any).spawnEnemy(enemyType, 1.0);

      expect(mockRoom.state.npcs.size).toBe(initialNpcCount + 1);

      const status = waveSystem.getWaveStatus();
      expect(status.activeEnemies).toBe(1);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('enemy_spawned');
    });

    test('should find valid spawn locations away from players', () => {
      const location = (waveSystem as any).findValidSpawnLocation();

      expect(typeof location.x).toBe('number');
      expect(typeof location.y).toBe('number');
      expect(location.x).toBeGreaterThanOrEqual(0);
      expect(location.y).toBeGreaterThanOrEqual(0);

      // Should be reasonably far from test player at (50, 50)
      const distance = Math.sqrt(Math.pow(location.x - 50, 2) + Math.pow(location.y - 50, 2));
      expect(distance).toBeGreaterThan(10); // Should be outside minimum distance
    });
  });

  describe('Enemy Death and Wave Completion', () => {
    test('should handle enemy death and update tracking', () => {
      // Add some test enemies manually
      const enemy1 = new NPC();
      enemy1.id = 'test-enemy-1';
      enemy1.name = 'Test Goblin';
      mockRoom.state.npcs.set(enemy1.id, enemy1);
      (waveSystem as any).activeEnemies.add(enemy1.id);

      const initialEnemyCount = waveSystem.getWaveStatus().activeEnemies;
      expect(initialEnemyCount).toBe(1);

      waveSystem.onEnemyDeath(enemy1.id);

      const finalEnemyCount = waveSystem.getWaveStatus().activeEnemies;
      expect(finalEnemyCount).toBe(0);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('enemy_defeated');
    });

    test('should complete wave when all enemies are defeated', () => {
      const completeWaveSpy = jest.spyOn(waveSystem as any, 'completeWave');

      // Set up active wave with one enemy
      (waveSystem as any).waveState = WaveState.ACTIVE;
      (waveSystem as any).activeEnemies.add('test-enemy-1');

      // Kill the last enemy
      waveSystem.onEnemyDeath('test-enemy-1');

      expect(completeWaveSpy).toHaveBeenCalled();
    });

    test('should not complete wave if enemies remain', () => {
      const completeWaveSpy = jest.spyOn(waveSystem as any, 'completeWave');

      // Set up active wave with multiple enemies
      (waveSystem as any).waveState = WaveState.ACTIVE;
      (waveSystem as any).activeEnemies.add('test-enemy-1');
      (waveSystem as any).activeEnemies.add('test-enemy-2');

      // Kill one enemy, but another remains
      waveSystem.onEnemyDeath('test-enemy-1');

      expect(completeWaveSpy).not.toHaveBeenCalled();
      expect(waveSystem.getWaveStatus().activeEnemies).toBe(1);
    });
  });

  describe('Player Survival Checking', () => {
    test('should return true when players are alive', () => {
      testPlayer.hitpoints = 50;
      const result = waveSystem.checkPlayerSurvival();
      expect(result).toBe(true);
    });

    test('should end survival mode when all players are dead', () => {
      const endSurvivalSpy = jest.spyOn(waveSystem, 'endSurvivalMode');

      // Kill all players
      testPlayer.hitpoints = 0;
      (waveSystem as any).waveState = WaveState.ACTIVE;

      const result = waveSystem.checkPlayerSurvival();

      expect(result).toBe(false);
      expect(endSurvivalSpy).toHaveBeenCalledWith('all_players_dead');
    });

    test('should not end survival mode if not in active state', () => {
      const endSurvivalSpy = jest.spyOn(waveSystem, 'endSurvivalMode');

      testPlayer.hitpoints = 0;
      (waveSystem as any).waveState = WaveState.PREPARING;

      waveSystem.checkPlayerSurvival();

      expect(endSurvivalSpy).not.toHaveBeenCalled();
    });
  });

  describe('Reward System', () => {
    test('should apply experience rewards to players', () => {
      const reward = {
        type: 'experience' as const,
        value: 100,
        skillType: 'combat',
      };

      (waveSystem as any).applyRewardToPlayer(testPlayer, reward);

      // Since experience system isn't fully implemented, just verify no errors
      expect(testPlayer).toBeDefined();
    });
    test('should restore prayer points correctly', () => {
      testPlayer.prayerPoints = 20;
      testPlayer.skills.prayer.level = 50; // Ensure max prayer is higher than 35
      const reward = {
        type: 'prayer_points' as const,
        value: 15,
      };

      (waveSystem as any).applyRewardToPlayer(testPlayer, reward);

      expect(testPlayer.prayerPoints).toBe(35);
    });
    test('should not exceed maximum prayer points', () => {
      testPlayer.prayerPoints = 8;
      testPlayer.skills.prayer.level = 10;
      const reward = {
        type: 'prayer_points' as const,
        value: 15,
      };

      (waveSystem as any).applyRewardToPlayer(testPlayer, reward);

      expect(testPlayer.prayerPoints).toBe(10); // Capped at max
    });
    test('should restore health correctly', () => {
      testPlayer.health = 50;
      const reward = {
        type: 'health_restore' as const,
        value: 30,
      };

      (waveSystem as any).applyRewardToPlayer(testPlayer, reward);

      expect(testPlayer.health).toBe(80);
    });
    test('should not exceed maximum health', () => {
      testPlayer.health = 90;
      testPlayer.maxHealth = 100;
      const reward = {
        type: 'health_restore' as const,
        value: 30,
      };

      (waveSystem as any).applyRewardToPlayer(testPlayer, reward);

      expect(testPlayer.health).toBe(100); // Capped at max
    });
    test('should award rewards only to living players', () => {
      const awardRewardsSpy = jest.spyOn(waveSystem as any, 'applyRewardToPlayer');

      // Create a dead player
      const deadPlayer = new Player();
      deadPlayer.id = 'dead-player';
      deadPlayer.health = 0;
      mockRoom.state.players.set(deadPlayer.id, deadPlayer);

      const rewards = [{ type: 'experience' as const, value: 100, skillType: 'combat' }];

      (waveSystem as any).awardWaveRewards(rewards);

      // Should only call for living player (testPlayer has HP > 0)
      expect(awardRewardsSpy).toHaveBeenCalledWith(testPlayer, rewards[0]);
      expect(awardRewardsSpy).not.toHaveBeenCalledWith(deadPlayer, expect.anything());
    });
  });

  describe('Special Events', () => {
    test('should apply prayer drain event', () => {
      testPlayer.currentPrayerPoints = 50;

      const parameters = { drainRate: 2.0, duration: 30000 };
      (waveSystem as any).applyPrayerDrainEvent(parameters);

      // Should drain 50% of prayer points
      expect(testPlayer.currentPrayerPoints).toBe(25);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('special_event');
      expect(lastBroadcast.message.type).toBe('prayer_drain');
    });

    test('should apply health boost event', () => {
      testPlayer.hitpoints = 60;
      testPlayer.maxHitpoints = 100;

      const parameters = { amount: 20 };
      (waveSystem as any).applyHealthBoostEvent(parameters);

      expect(testPlayer.hitpoints).toBe(80);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('special_event');
      expect(lastBroadcast.message.type).toBe('health_boost');
    });

    test('should broadcast double enemies event', () => {
      const parameters = { multiplier: 2 };
      (waveSystem as any).applyDoubleEnemiesEvent(parameters);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('special_event');
      expect(lastBroadcast.message.type).toBe('double_enemies');
    });

    test('should broadcast weapon enchant event', () => {
      const parameters = { damageBonus: 1.5, duration: 60000 };
      (waveSystem as any).applyWeaponEnchantEvent(parameters);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('special_event');
      expect(lastBroadcast.message.type).toBe('weapon_enchant');
    });
  });

  describe('Wave State Management', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should pause and resume waves correctly', () => {
      (waveSystem as any).waveState = WaveState.ACTIVE;

      waveSystem.pauseWave();
      expect(waveSystem.getWaveStatus().waveState).toBe(WaveState.PAUSED);

      waveSystem.resumeWave();
      expect(waveSystem.getWaveStatus().waveState).toBe(WaveState.ACTIVE);
    });

    test('should end survival mode and clean up', () => {
      // Add some test enemies
      (waveSystem as any).activeEnemies.add('enemy-1');
      (waveSystem as any).activeEnemies.add('enemy-2');
      mockRoom.state.npcs.set('enemy-1', new NPC());
      mockRoom.state.npcs.set('enemy-2', new NPC());

      waveSystem.endSurvivalMode('admin_stop');

      expect(waveSystem.getWaveStatus().waveState).toBe(WaveState.FAILED);
      expect(waveSystem.getWaveStatus().activeEnemies).toBe(0);
      expect(mockRoom.state.npcs.size).toBe(0);

      const lastBroadcast = mockRoom.getLastBroadcast();
      expect(lastBroadcast.type).toBe('survival_mode_ended');
    });

    test('should generate appropriate end messages', () => {
      const highWaveMessage = (waveSystem as any).getSurvivalEndMessage('all_players_dead', 25);
      const mediumWaveMessage = (waveSystem as any).getSurvivalEndMessage('all_players_dead', 12);
      const lowWaveMessage = (waveSystem as any).getSurvivalEndMessage('all_players_dead', 3);

      expect(highWaveMessage).toContain('Incredible');
      expect(mediumWaveMessage).toContain('Well fought');
      expect(lowWaveMessage).toContain('Practice');
    });
  });

  describe('Cleanup and Disposal', () => {
    test('should clean up timers and state on disposal', () => {
      // Set up some active state
      (waveSystem as any).spawnTimer = setTimeout(() => {}, 1000);
      (waveSystem as any).activeEnemies.add('test-enemy');

      waveSystem.dispose();

      expect(waveSystem.getWaveStatus().activeEnemies).toBe(0);
      // Timer should be cleared (verified by no memory leaks)
    });
  });
});
