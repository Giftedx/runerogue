/**
 * Survivor Wave System for RuneRogue
 *
 * Implements wave-based surviva    this.room = room;
    this.proceduralGenerator = new ProceduralGenerator();
    // Create placeholder ItemManager and PrayerSystem for now
    const dummyItemManager = {} as ItemManager;
    // Create a minimal dummy player with proper type conversion
    const dummyPlayer = new Player();
    dummyPlayer.skills.prayer.level = 1;
    dummyPlayer.prayerPoints = 1;
    dummyPlayer.maxPrayerPoints = 1;
    const dummyPrayerSystem = new PrayerSystem(dummyPlayer);
    this.combatSystem = new CombatSystem(room.state, dummyItemManager, dummyPrayerSystem);ith increasing difficulty,
 * procedurally generated enemy spawns, and OSRS-inspired survival gameplay.
 */

import { Room } from '@colyseus/core';

import testSafeLogger from '../utils/test-safe-logger';
import { CombatSystem } from './CombatSystem';
import { NPC, Player, WorldState } from './EntitySchemas';
import { ItemManager } from './ItemManager';
import { PrayerSystem } from './PrayerSystem';
import { ProceduralGenerator } from './ProceduralGenerator';

export interface WaveConfiguration {
  waveNumber: number;
  enemyCount: number;
  enemyTypes: WaveEnemyType[];
  spawnDelay: number; // milliseconds between spawns
  difficultyMultiplier: number;
  specialEvents?: WaveSpecialEvent[];
  rewards: WaveReward[];
}

export interface WaveEnemyType {
  npcId: string;
  name: string;
  level: number;
  hitpoints: number;
  attack: number;
  strength: number;
  defense: number;
  spawnWeight: number; // Probability weight for spawning
  spawnCount: number; // How many to spawn this wave
}

export interface WaveSpecialEvent {
  type: 'boss_spawn' | 'double_enemies' | 'prayer_drain' | 'health_boost' | 'weapon_enchant';
  trigger: 'wave_start' | 'wave_middle' | 'wave_end' | 'enemy_count';
  parameters: Record<string, any>;
}

export interface WaveReward {
  type: 'experience' | 'item' | 'prayer_points' | 'health_restore';
  value: number;
  itemId?: string;
  skillType?: string;
}

export enum WaveState {
  PREPARING = 'preparing',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
}

export class SurvivorWaveSystem {
  private room: Room<WorldState>;
  private currentWave: number = 0;
  private waveState: WaveState = WaveState.PREPARING;
  private activeEnemies: Set<string> = new Set();
  private spawnTimer: NodeJS.Timeout | null = null;
  private waveStartTime: number = 0;
  private lastSpawnTime: number = 0;
  private proceduralGenerator: ProceduralGenerator;
  private combatSystem: CombatSystem;

  // Wave progression configuration
  private readonly BASE_ENEMY_COUNT = 5;
  private readonly WAVE_SCALING_FACTOR = 1.2;
  private readonly MAX_ENEMIES_PER_WAVE = 50;
  private readonly PREPARATION_TIME = 10000; // 10 seconds between waves

  constructor(room: Room<WorldState>) {
    this.room = room;
    this.proceduralGenerator = new ProceduralGenerator();
    // Create placeholder ItemManager and PrayerSystem for now
    const dummyItemManager = {} as ItemManager;
    // Create a minimal dummy player with proper type conversion
    const dummyPlayer = new Player();
    dummyPlayer.skills.prayer.level = 1;
    dummyPlayer.prayerPoints = 1;
    dummyPlayer.maxPrayerPoints = 1;
    const dummyPrayerSystem = new PrayerSystem(dummyPlayer);
    this.combatSystem = new CombatSystem(room.state, dummyItemManager, dummyPrayerSystem);
  }
  /**
   * Start a new wave-based survival session
   */ public startSurvivalMode(): void {
    testSafeLogger.info('🌊 Starting Survivor Wave System');
    this.currentWave = 1;
    this.waveState = WaveState.PREPARING; // Clear Set using Set.prototype.clear()
    this.activeEnemies.clear();

    // Announce to players
    this.room.broadcast('wave_system_start', {
      message: 'Survival mode activated! Prepare for the first wave...',
      preparationTime: this.PREPARATION_TIME,
    });

    // Start first wave after preparation time
    setTimeout(() => {
      this.startWave(this.currentWave);
    }, this.PREPARATION_TIME);
  }

  /**
   * Start a specific wave
   */
  public startWave(waveNumber: number): void {
    if (this.waveState === WaveState.ACTIVE) {
      testSafeLogger.warn(`⚠️ Cannot start wave ${waveNumber}, wave already active`);
      return;
    }

    this.currentWave = waveNumber;
    this.waveState = WaveState.ACTIVE;
    this.waveStartTime = Date.now();
    this.lastSpawnTime = 0;

    const waveConfig = this.generateWaveConfiguration(waveNumber);

    testSafeLogger.info(`🌊 Starting Wave ${waveNumber}:`, {
      enemyCount: waveConfig.enemyCount,
      difficulty: waveConfig.difficultyMultiplier,
      enemyTypes: waveConfig.enemyTypes.length,
    });

    // Broadcast wave start to all players
    this.room.broadcast('wave_start', {
      waveNumber,
      enemyCount: waveConfig.enemyCount,
      difficultyMultiplier: waveConfig.difficultyMultiplier,
      specialEvents: waveConfig.specialEvents || [],
    });

    // Trigger special events that occur at wave start
    this.triggerSpecialEvents(waveConfig, 'wave_start');

    // Begin spawning enemies
    this.beginEnemySpawning(waveConfig);
  }

  /**
   * Generate procedural wave configuration based on wave number
   */
  private generateWaveConfiguration(waveNumber: number): WaveConfiguration {
    const difficultyMultiplier = 1 + (waveNumber - 1) * 0.15; // 15% increase per wave
    const baseEnemyCount = Math.floor(
      this.BASE_ENEMY_COUNT * Math.pow(this.WAVE_SCALING_FACTOR, waveNumber - 1)
    );
    const enemyCount = Math.min(baseEnemyCount, this.MAX_ENEMIES_PER_WAVE);

    // Generate enemy types with increasing variety and difficulty
    const enemyTypes = this.generateEnemyTypes(waveNumber, difficultyMultiplier, enemyCount);

    // Generate special events for higher waves
    const specialEvents = this.generateSpecialEvents(waveNumber);

    // Calculate rewards based on wave difficulty
    const rewards = this.generateWaveRewards(waveNumber, difficultyMultiplier);

    return {
      waveNumber,
      enemyCount,
      enemyTypes,
      spawnDelay: Math.max(500, 2000 - waveNumber * 100), // Faster spawning on higher waves
      difficultyMultiplier,
      specialEvents,
      rewards,
    };
  }

  /**
   * Generate enemy types for the wave
   */
  private generateEnemyTypes(
    waveNumber: number,
    difficultyMultiplier: number,
    totalEnemies: number
  ): WaveEnemyType[] {
    const baseEnemies = [
      {
        npcId: 'goblin',
        name: 'Goblin',
        level: Math.floor(1 * difficultyMultiplier),
        hitpoints: Math.floor(5 * difficultyMultiplier),
        attack: Math.floor(1 * difficultyMultiplier),
        strength: Math.floor(1 * difficultyMultiplier),
        defense: Math.floor(1 * difficultyMultiplier),
        spawnWeight: 40,
        spawnCount: Math.floor(totalEnemies * 0.4),
      },
      {
        npcId: 'skeleton',
        name: 'Skeleton',
        level: Math.floor(3 * difficultyMultiplier),
        hitpoints: Math.floor(10 * difficultyMultiplier),
        attack: Math.floor(3 * difficultyMultiplier),
        strength: Math.floor(3 * difficultyMultiplier),
        defense: Math.floor(2 * difficultyMultiplier),
        spawnWeight: 30,
        spawnCount: Math.floor(totalEnemies * 0.3),
      },
    ];

    // Add stronger enemies for higher waves
    if (waveNumber >= 3) {
      baseEnemies.push({
        npcId: 'orc',
        name: 'Orc Warrior',
        level: Math.floor(8 * difficultyMultiplier),
        hitpoints: Math.floor(20 * difficultyMultiplier),
        attack: Math.floor(8 * difficultyMultiplier),
        strength: Math.floor(8 * difficultyMultiplier),
        defense: Math.floor(5 * difficultyMultiplier),
        spawnWeight: 20,
        spawnCount: Math.floor(totalEnemies * 0.2),
      });
    }

    if (waveNumber >= 5) {
      baseEnemies.push({
        npcId: 'troll',
        name: 'Hill Troll',
        level: Math.floor(15 * difficultyMultiplier),
        hitpoints: Math.floor(50 * difficultyMultiplier),
        attack: Math.floor(15 * difficultyMultiplier),
        strength: Math.floor(15 * difficultyMultiplier),
        defense: Math.floor(10 * difficultyMultiplier),
        spawnWeight: 10,
        spawnCount: Math.floor(totalEnemies * 0.1),
      });
    }

    // Boss enemies for every 5th wave
    if (waveNumber % 5 === 0) {
      baseEnemies.push({
        npcId: 'wave_boss',
        name: `Wave ${waveNumber} Boss`,
        level: Math.floor(20 * difficultyMultiplier),
        hitpoints: Math.floor(100 * difficultyMultiplier),
        attack: Math.floor(20 * difficultyMultiplier),
        strength: Math.floor(20 * difficultyMultiplier),
        defense: Math.floor(15 * difficultyMultiplier),
        spawnWeight: 5,
        spawnCount: 1,
      });
    }

    return baseEnemies;
  }

  /**
   * Generate special events for the wave
   */
  private generateSpecialEvents(waveNumber: number): WaveSpecialEvent[] {
    const events: WaveSpecialEvent[] = [];

    // Every 3rd wave has prayer drain event
    if (waveNumber % 3 === 0) {
      events.push({
        type: 'prayer_drain',
        trigger: 'wave_start',
        parameters: { drainRate: 2.0, duration: 30000 },
      });
    }

    // Every 4th wave has double enemies event
    if (waveNumber % 4 === 0) {
      events.push({
        type: 'double_enemies',
        trigger: 'wave_middle',
        parameters: { multiplier: 2 },
      });
    }

    // Every 5th wave has boss spawn
    if (waveNumber % 5 === 0) {
      events.push({
        type: 'boss_spawn',
        trigger: 'enemy_count',
        parameters: { triggerCount: 3, bossType: 'wave_boss' },
      });
    }

    return events;
  }

  /**
   * Generate rewards for completing the wave
   */
  private generateWaveRewards(waveNumber: number, difficultyMultiplier: number): WaveReward[] {
    const rewards: WaveReward[] = [];

    // Experience reward scales with wave
    rewards.push({
      type: 'experience',
      value: Math.floor(50 * waveNumber * difficultyMultiplier),
      skillType: 'combat',
    });

    // Prayer points restoration
    rewards.push({
      type: 'prayer_points',
      value: Math.floor(10 * difficultyMultiplier),
    });

    // Health restoration for surviving
    rewards.push({
      type: 'health_restore',
      value: Math.floor(20 * difficultyMultiplier),
    });

    // Special item rewards every 5 waves
    if (waveNumber % 5 === 0) {
      rewards.push({
        type: 'item',
        value: 1,
        itemId: this.selectRandomRewardItem(waveNumber),
      });
    }

    return rewards;
  }

  /**
   * Select a random reward item based on wave number
   */
  private selectRandomRewardItem(waveNumber: number): string {
    const tier1Items = ['bronze_sword', 'bronze_shield', 'leather_boots'];
    const tier2Items = ['iron_sword', 'iron_shield', 'iron_boots', 'strength_potion'];
    const tier3Items = ['steel_sword', 'steel_shield', 'combat_boots', 'prayer_potion'];
    const tier4Items = ['mithril_sword', 'mithril_shield', 'dragon_boots', 'super_strength'];

    if (waveNumber >= 20) return tier4Items[Math.floor(Math.random() * tier4Items.length)];
    if (waveNumber >= 15) return tier3Items[Math.floor(Math.random() * tier3Items.length)];
    if (waveNumber >= 10) return tier2Items[Math.floor(Math.random() * tier2Items.length)];
    return tier1Items[Math.floor(Math.random() * tier1Items.length)];
  }
  /**
   * Begin spawning enemies according to wave configuration
   */
  private beginEnemySpawning(waveConfig: WaveConfiguration): void {
    let enemiesSpawned = 0;
    const totalEnemies = waveConfig.enemyCount;

    const spawnNextEnemy = () => {
      if (enemiesSpawned >= totalEnemies || this.waveState !== WaveState.ACTIVE) {
        return;
      }

      // Select enemy type based on spawn weights and counts
      const enemyType = this.selectEnemyTypeToSpawn(waveConfig.enemyTypes);
      if (enemyType) {
        this.spawnEnemy(enemyType, waveConfig.difficultyMultiplier);
        enemiesSpawned++;

        // Check for special events that trigger on enemy count
        this.checkEnemyCountTriggers(waveConfig, enemiesSpawned, totalEnemies);
      }

      // Schedule next spawn
      if (enemiesSpawned < totalEnemies) {
        this.spawnTimer = setTimeout(spawnNextEnemy, waveConfig.spawnDelay);
      }
    };

    // Start spawning immediately for the first enemy
    spawnNextEnemy();
  }

  /**
   * Select which enemy type to spawn based on weights and remaining counts
   */
  private selectEnemyTypeToSpawn(enemyTypes: WaveEnemyType[]): WaveEnemyType | null {
    const availableTypes = enemyTypes.filter(type => type.spawnCount > 0);
    if (availableTypes.length === 0) return null;

    // Weighted random selection
    const totalWeight = availableTypes.reduce((sum, type) => sum + type.spawnWeight, 0);
    let random = Math.random() * totalWeight;

    for (const type of availableTypes) {
      random -= type.spawnWeight;
      if (random <= 0) {
        type.spawnCount--; // Decrease remaining spawn count
        return type;
      }
    }

    return availableTypes[0]; // Fallback
  }

  /**
   * Spawn an enemy at a random valid location
   */ private spawnEnemy(enemyType: WaveEnemyType, difficultyMultiplier: number): void {
    const spawnLocation = this.findValidSpawnLocation();
    const enemyId = `wave_enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const enemy = new NPC(
      enemyId,
      enemyType.name,
      spawnLocation.x,
      spawnLocation.y,
      'wave_enemy',
      [] // Empty loot table for now
    );
    // Set stats
    enemy.health = enemyType.hitpoints;
    enemy.maxHealth = enemyType.hitpoints;
    enemy.attack = enemyType.attack;
    // enemy.strength = enemyType.strength; // Not available in NPC schema
    enemy.defense = enemyType.defense;
    // enemy.combatLevel = Math.floor(enemyType.level * difficultyMultiplier); // Not available in NPC schema
    // enemy.isAggressive = true; // Not available in NPC schema
    enemy.aggroRange = 10; // Aggressive enemies in survival mode

    // Add to game state
    this.room.state.npcs.set(enemy.id, enemy);

    this.activeEnemies.add(enemy.id); // Debug logging (automatically handled by test-safe logger)
    testSafeLogger.debug(
      `👹 Spawned ${enemy.name} (Level ${enemy.attack}) at (${enemy.x}, ${enemy.y})`
    );

    // Broadcast enemy spawn
    this.room.broadcast('enemy_spawned', {
      enemyId: enemy.id,
      enemyType: enemyType.npcId,
      name: enemy.name,
      level: enemy.attack,
      x: enemy.x,
      y: enemy.y,
    });
  }

  /**
   * Find a valid spawn location that doesn't overlap with players
   */
  private findValidSpawnLocation(): { x: number; y: number } {
    const mapSize = 100; // Assume 100x100 map
    const minDistanceFromPlayers = 15;
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const x = Math.floor(Math.random() * mapSize);
      const y = Math.floor(Math.random() * mapSize);

      // Check distance from all players
      let validLocation = true;
      this.room.state.players.forEach(player => {
        const distance = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
        if (distance < minDistanceFromPlayers) {
          validLocation = false;
        }
      });

      if (validLocation) {
        return { x, y };
      }

      attempts++;
    }

    // Fallback to a corner if no valid location found
    return { x: 10, y: 10 };
  }

  /**
   * Handle enemy death
   */ public onEnemyDeath(enemyId: string): void {
    if (this.activeEnemies.has(enemyId)) {
      this.activeEnemies.delete(enemyId);

      testSafeLogger.debug(`💀 Enemy ${enemyId} defeated. Remaining: ${this.activeEnemies.size}`);

      // Check if wave is complete
      if (this.activeEnemies.size === 0 && this.waveState === WaveState.ACTIVE) {
        this.completeWave();
      }

      // Broadcast enemy death
      this.room.broadcast('enemy_defeated', {
        enemyId,
        remainingEnemies: this.activeEnemies.size,
      });
    }
  }

  /**
   * Complete the current wave
   */
  private completeWave(): void {
    this.waveState = WaveState.COMPLETED;
    const completionTime = Date.now() - this.waveStartTime;
    const waveConfig = this.generateWaveConfiguration(this.currentWave);

    testSafeLogger.info(`✅ Wave ${this.currentWave} completed in ${completionTime}ms`);

    // Award rewards to all surviving players
    this.awardWaveRewards(waveConfig.rewards);

    // Broadcast wave completion
    this.room.broadcast('wave_completed', {
      waveNumber: this.currentWave,
      completionTime,
      rewards: waveConfig.rewards,
      nextWaveIn: this.PREPARATION_TIME,
    });

    // Start next wave after preparation time
    setTimeout(() => {
      this.startWave(this.currentWave + 1);
    }, this.PREPARATION_TIME);
  }

  /**
   * Award rewards to all surviving players
   */ private awardWaveRewards(rewards: WaveReward[]): void {
    this.room.state.players.forEach(player => {
      if (player.health > 0) {
        // Only reward living players
        rewards.forEach(reward => {
          this.applyRewardToPlayer(player, reward);
        });
      }
    });
  }

  /**
   * Apply a specific reward to a player
   */
  private applyRewardToPlayer(player: Player, reward: WaveReward): void {
    switch (reward.type) {
      case 'experience':
        // Add experience (would integrate with skills system)
        testSafeLogger.debug(
          `📈 ${player.username} gained ${reward.value} ${reward.skillType} experience`
        );
        break;
      case 'prayer_points':
        const maxPrayer = player.skills.prayer?.level || 1;
        player.prayerPoints = Math.min(maxPrayer, player.prayerPoints + reward.value);
        testSafeLogger.debug(`🙏 ${player.username} restored ${reward.value} prayer points`);
        break;
      case 'health_restore':
        player.health = Math.min(player.maxHealth, player.health + reward.value);
        testSafeLogger.debug(`❤️ ${player.username} restored ${reward.value} health`);
        break;
      case 'item':
        if (reward.itemId) {
          // Add item to player inventory (simplified)
          testSafeLogger.debug(`🎁 ${player.username} received ${reward.itemId}`);
        }
        break;
    }
  }

  /**
   * Trigger special events
   */
  private triggerSpecialEvents(waveConfig: WaveConfiguration, trigger: string): void {
    const events = waveConfig.specialEvents?.filter(event => event.trigger === trigger) || [];
    events.forEach(event => {
      testSafeLogger.debug(`⚡ Triggering special event: ${event.type}`);

      switch (event.type) {
        case 'prayer_drain':
          this.applyPrayerDrainEvent(event.parameters);
          break;
        case 'double_enemies':
          this.applyDoubleEnemiesEvent(event.parameters);
          break;
        case 'health_boost':
          this.applyHealthBoostEvent(event.parameters);
          break;
        case 'weapon_enchant':
          this.applyWeaponEnchantEvent(event.parameters);
          break;
      }
    });
  }

  /**
   * Apply prayer drain special event
   */
  private applyPrayerDrainEvent(parameters: any): void {
    this.room.broadcast('special_event', {
      type: 'prayer_drain',
      message: 'The air grows heavy with dark magic, draining your prayer!',
      parameters,
    });

    // Apply prayer drain to all players
    this.room.state.players.forEach(player => {
      const drainAmount = Math.floor(player.prayerPoints * 0.5);
      player.prayerPoints = Math.max(0, player.prayerPoints - drainAmount);
    });
  }

  /**
   * Apply double enemies special event
   */
  private applyDoubleEnemiesEvent(parameters: any): void {
    this.room.broadcast('special_event', {
      type: 'double_enemies',
      message: 'The enemy forces multiply before your eyes!',
      parameters,
    });
    // Implementation would spawn additional enemies
  }

  /**
   * Apply health boost special event
   */
  private applyHealthBoostEvent(parameters: any): void {
    this.room.broadcast('special_event', {
      type: 'health_boost',
      message: 'Ancient magic heals your wounds!',
      parameters,
    });

    this.room.state.players.forEach(player => {
      const healAmount = parameters.amount || 20;
      player.health = Math.min(player.maxHealth, player.health + healAmount);
    });
  }

  /**
   * Apply weapon enchant special event
   */
  private applyWeaponEnchantEvent(parameters: any): void {
    this.room.broadcast('special_event', {
      type: 'weapon_enchant',
      message: 'Your weapons glow with magical power!',
      parameters,
    });
    // Implementation would apply temporary damage bonus
  }

  /**
   * Check for enemy count triggered events
   */
  private checkEnemyCountTriggers(
    waveConfig: WaveConfiguration,
    enemiesSpawned: number,
    totalEnemies: number
  ): void {
    const middlePoint = Math.floor(totalEnemies / 2);

    if (enemiesSpawned === middlePoint) {
      this.triggerSpecialEvents(waveConfig, 'wave_middle');
    }

    waveConfig.specialEvents?.forEach(event => {
      if (event.trigger === 'enemy_count' && enemiesSpawned === event.parameters.triggerCount) {
        this.triggerSpecialEvents(waveConfig, 'enemy_count');
      }
    });
  }

  /**
   * Pause the current wave
   */
  public pauseWave(): void {
    if (this.waveState === WaveState.ACTIVE) {
      this.waveState = WaveState.PAUSED;
      if (this.spawnTimer) {
        clearTimeout(this.spawnTimer);
        this.spawnTimer = null;
      }

      this.room.broadcast('wave_paused', {
        waveNumber: this.currentWave,
        remainingEnemies: this.activeEnemies.size,
      });
    }
  }

  /**
   * Resume a paused wave
   */
  public resumeWave(): void {
    if (this.waveState === WaveState.PAUSED) {
      this.waveState = WaveState.ACTIVE;

      this.room.broadcast('wave_resumed', {
        waveNumber: this.currentWave,
        remainingEnemies: this.activeEnemies.size,
      });
    }
  }

  /**
   * End the survival session
   */
  public endSurvivalMode(reason: 'all_players_dead' | 'admin_stop' | 'error' = 'admin_stop'): void {
    this.waveState = WaveState.FAILED;

    if (this.spawnTimer) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    } // Clear all wave enemies
    this.activeEnemies.forEach(enemyId => {
      if (enemyId && this.room.state.npcs[enemyId]) {
        delete this.room.state.npcs[enemyId];
      }
    });
    this.activeEnemies.clear();

    testSafeLogger.info(`🏁 Survival mode ended: ${reason}. Final wave: ${this.currentWave}`);

    this.room.broadcast('survival_mode_ended', {
      reason,
      finalWave: this.currentWave,
      message: this.getSurvivalEndMessage(reason, this.currentWave),
    });
  }

  /**
   * Get appropriate end message based on reason and performance
   */
  private getSurvivalEndMessage(reason: string, finalWave: number): string {
    switch (reason) {
      case 'all_players_dead':
        if (finalWave >= 20)
          return `Incredible! You survived ${finalWave} waves before falling. You are a true warrior!`;
        if (finalWave >= 10)
          return `Well fought! ${finalWave} waves survived. Your combat skills are impressive.`;
        if (finalWave >= 5)
          return `Good effort! You survived ${finalWave} waves. Keep training to go further.`;
        return `${finalWave} waves survived. Practice your combat and try again!`;

      case 'admin_stop':
        return `Survival session ended by administrator. You survived ${finalWave} waves!`;

      default:
        return `Survival session ended. Final wave: ${finalWave}`;
    }
  }

  /**
   * Get current wave status
   */
  public getWaveStatus(): {
    currentWave: number;
    waveState: WaveState;
    activeEnemies: number;
    timeInWave: number;
  } {
    return {
      currentWave: this.currentWave,
      waveState: this.waveState,
      activeEnemies: this.activeEnemies.size,
      timeInWave: this.waveState === WaveState.ACTIVE ? Date.now() - this.waveStartTime : 0,
    };
  }

  /**
   * Check if all players are dead
   */
  public checkPlayerSurvival(): boolean {
    const livingPlayers = Array.from(this.room.state.players.values()).filter(
      player => player.health > 0
    );

    if (livingPlayers.length === 0 && this.waveState === WaveState.ACTIVE) {
      this.endSurvivalMode('all_players_dead');
      return false;
    }

    return true;
  }

  /**
   * Cleanup when room is disposed
   */
  public dispose(): void {
    if (this.spawnTimer) {
      clearTimeout(this.spawnTimer);
      this.spawnTimer = null;
    }
    this.activeEnemies.clear();
  }
}
