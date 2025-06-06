/**
 * Wave-based Survivor Mechanics System
 * Implements escalating waves of enemies, power-ups, and survivor gameplay
 */

import { GameState, NPC, Player } from './EntitySchemas';
import { ProceduralGenerator, BiomeType, MonsterSpawnConfig } from './ProceduralGenerator';
import { sendGameEventNotification } from '../discord-bot';

export interface WaveConfig {
  waveNumber: number;
  enemyCount: number;
  enemyTypes: MonsterSpawnConfig[];
  spawnDelay: number; // Milliseconds between spawns
  difficulty: number; // Multiplier for enemy stats
  bossWave: boolean;
  rewards: WaveReward[];
}

export interface WaveReward {
  type: 'xp' | 'item' | 'gold' | 'powerup';
  value: string | number;
  quantity: number;
  chance: number; // 0-1
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  duration: number; // Milliseconds
  effects: PowerUpEffect[];
}

export interface PowerUpEffect {
  type: 'damage' | 'speed' | 'defense' | 'xp_boost' | 'drop_rate';
  multiplier: number;
}

// Active power-up state
export interface ActivePowerUp {
  powerUp: PowerUp;
  expiresAt: number;
  playerId: string;
}

/**
 * Wave Manager for survivor gameplay
 */
export class WaveManager {
  private state: GameState;
  private currentWave: number = 0;
  private waveInProgress: boolean = false;
  private enemiesRemaining: number = 0;
  private waveStartTime: number = 0;
  private activePowerUps: Map<string, ActivePowerUp[]> = new Map();
  private biomeType: BiomeType;
  private proceduralGen: ProceduralGenerator;
  
  // Wave configuration constants
  private readonly BASE_ENEMY_COUNT = 5;
  private readonly ENEMY_COUNT_GROWTH = 1.5;
  private readonly DIFFICULTY_GROWTH = 1.1;
  private readonly BOSS_WAVE_INTERVAL = 5;
  private readonly WAVE_PREP_TIME = 10000; // 10 seconds between waves

  constructor(state: GameState, biomeType: BiomeType = BiomeType.VARROCK) {
    this.state = state;
    this.biomeType = biomeType;
    this.proceduralGen = new ProceduralGenerator();
  }

  /**
   * Start the next wave
   */
  public async startNextWave(): Promise<void> {
    if (this.waveInProgress) {
      console.log('Wave already in progress');
      return;
    }

    this.currentWave++;
    this.waveInProgress = true;
    this.waveStartTime = Date.now();

    const waveConfig = this.generateWaveConfig(this.currentWave);
    this.enemiesRemaining = waveConfig.enemyCount;

    // Notify players
    this.broadcastWaveStart(waveConfig);

    // Send Discord notification for milestone waves
    if (this.currentWave % 10 === 0 || waveConfig.bossWave) {
      sendGameEventNotification('boss_spawn', {
        bossName: waveConfig.bossWave ? 'Wave Boss' : `Wave ${this.currentWave}`,
        location: this.biomeType,
        combatLevel: Math.floor(50 + this.currentWave * 2)
      });
    }

    // Spawn enemies gradually
    await this.spawnWaveEnemies(waveConfig);
  }

  /**
   * Generate configuration for a specific wave
   */
  private generateWaveConfig(waveNumber: number): WaveConfig {
    const isBossWave = waveNumber % this.BOSS_WAVE_INTERVAL === 0;
    const difficulty = Math.pow(this.DIFFICULTY_GROWTH, waveNumber - 1);
    const enemyCount = Math.floor(
      this.BASE_ENEMY_COUNT * Math.pow(this.ENEMY_COUNT_GROWTH, waveNumber - 1)
    );

    // Get available enemy types for this biome
    const biomeConfig = this.proceduralGen.getBiomeConfig(this.biomeType);
    const availableEnemies = biomeConfig?.monsters || [];

    // Select enemy types based on wave difficulty
    const enemyTypes = this.selectEnemyTypes(availableEnemies, waveNumber, isBossWave);

    // Generate rewards
    const rewards: WaveReward[] = [
      {
        type: 'xp',
        value: 100 * waveNumber,
        quantity: 1,
        chance: 1.0 // Always give XP
      },
      {
        type: 'gold',
        value: 50 * waveNumber,
        quantity: Math.floor(Math.random() * 20) + 10,
        chance: 0.8
      }
    ];

    // Add rare rewards for higher waves
    if (waveNumber > 5) {
      rewards.push({
        type: 'item',
        value: this.selectRareItem(waveNumber),
        quantity: 1,
        chance: 0.1 + (waveNumber * 0.01) // Increasing chance with waves
      });
    }

    // Power-ups for survival gameplay
    if (waveNumber % 3 === 0) {
      rewards.push({
        type: 'powerup',
        value: this.selectPowerUp(waveNumber),
        quantity: 1,
        chance: 0.5
      });
    }

    return {
      waveNumber,
      enemyCount: isBossWave ? 1 : enemyCount,
      enemyTypes,
      spawnDelay: isBossWave ? 0 : 1000, // 1 second between spawns
      difficulty,
      bossWave: isBossWave,
      rewards
    };
  }

  /**
   * Select enemy types for the wave
   */
  private selectEnemyTypes(
    available: MonsterSpawnConfig[],
    waveNumber: number,
    isBossWave: boolean
  ): MonsterSpawnConfig[] {
    if (isBossWave) {
      // Create a boss version of the strongest enemy
      const strongestEnemy = available.reduce((prev, curr) => 
        curr.level > prev.level ? curr : prev
      );

      return [{
        ...strongestEnemy,
        npcId: `boss_${strongestEnemy.npcId}`,
        level: strongestEnemy.level + waveNumber * 2,
        spawnWeight: 100,
        minGroupSize: 1,
        maxGroupSize: 1
      }];
    }

    // Regular wave - mix of enemies
    const minLevel = Math.max(1, waveNumber * 5);
    const maxLevel = minLevel + 20;

    return available.filter(enemy => 
      enemy.level >= minLevel && enemy.level <= maxLevel
    );
  }

  /**
   * Select rare item reward based on wave
   */
  private selectRareItem(waveNumber: number): string {
    const rareItems = [
      'bronze_platebody',
      'iron_platebody',
      'steel_platebody',
      'mithril_platebody',
      'adamant_platebody',
      'rune_platebody',
      'dragon_platebody'
    ];

    const index = Math.min(
      Math.floor(waveNumber / 10),
      rareItems.length - 1
    );

    return rareItems[index];
  }

  /**
   * Select power-up based on wave
   */
  private selectPowerUp(waveNumber: number): string {
    const powerUps = [
      'damage_boost',
      'speed_boost',
      'defense_boost',
      'xp_multiplier',
      'drop_rate_boost'
    ];

    return powerUps[Math.floor(Math.random() * powerUps.length)];
  }

  /**
   * Spawn enemies for the wave
   */
  private async spawnWaveEnemies(config: WaveConfig): Promise<void> {
    const spawnPositions = this.generateSpawnPositions(config.enemyCount);
    
    for (let i = 0; i < config.enemyCount; i++) {
      // Select enemy type
      const enemyType = this.selectRandomEnemyType(config.enemyTypes);
      const position = spawnPositions[i];

      // Create NPC with wave-scaled stats
      const npc = new NPC(
        `wave_${this.currentWave}_enemy_${i}`,
        enemyType.npcId,
        position.x,
        position.y,
        enemyType.npcId,
        [] // Loot will be added based on wave rewards
      );

      // Scale enemy stats based on difficulty
      npc.health = Math.floor(npc.health * config.difficulty);
      npc.maxHealth = Math.floor(npc.maxHealth * config.difficulty);
      npc.attack = Math.floor(npc.attack * config.difficulty);
      npc.defense = Math.floor(npc.defense * config.difficulty);

      // Boss modifications
      if (config.bossWave) {
        npc.health *= 10;
        npc.maxHealth *= 10;
        npc.attack *= 2;
        npc.defense *= 2;
        npc.name = `${npc.name} Boss`;
      }

      // Add to game state
      this.state.npcs.set(npc.id, npc);

      // Delay between spawns
      if (i < config.enemyCount - 1) {
        await this.delay(config.spawnDelay);
      }
    }
  }

  /**
   * Generate spawn positions around the map edges
   */
  private generateSpawnPositions(count: number): Array<{x: number, y: number}> {
    const positions: Array<{x: number, y: number}> = [];
    const mapWidth = 100; // Assuming default map size
    const mapHeight = 100;

    for (let i = 0; i < count; i++) {
      // Spawn from edges
      const edge = Math.floor(Math.random() * 4);
      let x = 0, y = 0;

      switch (edge) {
        case 0: // Top
          x = Math.floor(Math.random() * mapWidth);
          y = 0;
          break;
        case 1: // Right
          x = mapWidth - 1;
          y = Math.floor(Math.random() * mapHeight);
          break;
        case 2: // Bottom
          x = Math.floor(Math.random() * mapWidth);
          y = mapHeight - 1;
          break;
        case 3: // Left
          x = 0;
          y = Math.floor(Math.random() * mapHeight);
          break;
      }

      positions.push({ x, y });
    }

    return positions;
  }

  /**
   * Select random enemy type based on spawn weights
   */
  private selectRandomEnemyType(types: MonsterSpawnConfig[]): MonsterSpawnConfig {
    const totalWeight = types.reduce((sum, type) => sum + type.spawnWeight, 0);
    let random = Math.random() * totalWeight;

    for (const type of types) {
      random -= type.spawnWeight;
      if (random <= 0) {
        return type;
      }
    }

    return types[0]; // Fallback
  }

  /**
   * Handle enemy death
   */
  public onEnemyKilled(npcId: string, killedBy: Player): void {
    if (!this.waveInProgress) return;

    const npc = this.state.npcs.get(npcId);
    if (!npc || !npc.id.startsWith(`wave_${this.currentWave}_`)) {
      return; // Not a wave enemy
    }

    this.enemiesRemaining--;

    // Award kill XP
    const xpReward = 50 * this.currentWave;
    this.awardXP(killedBy, xpReward);

    // Check if wave is complete
    if (this.enemiesRemaining <= 0) {
      this.completeWave();
    }
  }

  /**
   * Complete the current wave
   */
  private completeWave(): void {
    this.waveInProgress = false;
    const waveTime = Date.now() - this.waveStartTime;

    // Calculate wave rewards
    const config = this.generateWaveConfig(this.currentWave);
    
    // Award rewards to all players
    this.state.players.forEach(player => {
      this.awardWaveRewards(player, config.rewards);
    });

    // Broadcast wave completion
    this.broadcastWaveComplete(waveTime);

    // Start prep time for next wave
    setTimeout(() => {
      if (this.state.players.size > 0) {
        this.startNextWave();
      }
    }, this.WAVE_PREP_TIME);
  }

  /**
   * Award wave rewards to a player
   */
  private awardWaveRewards(player: Player, rewards: WaveReward[]): void {
    rewards.forEach(reward => {
      if (Math.random() <= reward.chance) {
        switch (reward.type) {
          case 'xp':
            this.awardXP(player, reward.value as number);
            break;
          case 'gold':
            // TODO: Add gold to player inventory
            console.log(`Awarding ${reward.quantity} gold to ${player.username}`);
            break;
          case 'item':
            // TODO: Add item to player inventory
            console.log(`Awarding ${reward.value} to ${player.username}`);
            break;
          case 'powerup':
            this.activatePowerUp(player.id, reward.value as string);
            break;
        }
      }
    });
  }

  /**
   * Award XP to player (distributed across combat skills)
   */
  private awardXP(player: Player, amount: number): void {
    // Split XP between attack, strength, and defense
    const xpPerSkill = Math.floor(amount / 3);
    
    // TODO: Integrate with skill system when available
    console.log(`Awarding ${amount} XP to ${player.username}`);
  }

  /**
   * Activate a power-up for a player
   */
  private activatePowerUp(playerId: string, powerUpId: string): void {
    const powerUp = this.getPowerUpDefinition(powerUpId);
    if (!powerUp) return;

    const activePowerUp: ActivePowerUp = {
      powerUp,
      expiresAt: Date.now() + powerUp.duration,
      playerId
    };

    // Add to active power-ups
    if (!this.activePowerUps.has(playerId)) {
      this.activePowerUps.set(playerId, []);
    }
    this.activePowerUps.get(playerId)!.push(activePowerUp);

    // Schedule removal
    setTimeout(() => {
      this.removePowerUp(playerId, powerUpId);
    }, powerUp.duration);

    console.log(`Activated ${powerUp.name} for player ${playerId}`);
  }

  /**
   * Get power-up definition
   */
  private getPowerUpDefinition(id: string): PowerUp | null {
    const powerUps: Record<string, PowerUp> = {
      damage_boost: {
        id: 'damage_boost',
        name: 'Damage Boost',
        description: '+50% damage for 30 seconds',
        duration: 30000,
        effects: [{ type: 'damage', multiplier: 1.5 }]
      },
      speed_boost: {
        id: 'speed_boost',
        name: 'Speed Boost',
        description: '+30% movement speed for 30 seconds',
        duration: 30000,
        effects: [{ type: 'speed', multiplier: 1.3 }]
      },
      defense_boost: {
        id: 'defense_boost',
        name: 'Defense Boost',
        description: '+50% defense for 30 seconds',
        duration: 30000,
        effects: [{ type: 'defense', multiplier: 1.5 }]
      },
      xp_multiplier: {
        id: 'xp_multiplier',
        name: 'XP Multiplier',
        description: '2x XP for 60 seconds',
        duration: 60000,
        effects: [{ type: 'xp_boost', multiplier: 2.0 }]
      },
      drop_rate_boost: {
        id: 'drop_rate_boost',
        name: 'Lucky Charm',
        description: '+100% drop rate for 45 seconds',
        duration: 45000,
        effects: [{ type: 'drop_rate', multiplier: 2.0 }]
      }
    };

    return powerUps[id] || null;
  }

  /**
   * Remove expired power-up
   */
  private removePowerUp(playerId: string, powerUpId: string): void {
    const playerPowerUps = this.activePowerUps.get(playerId);
    if (!playerPowerUps) return;

    const index = playerPowerUps.findIndex(p => p.powerUp.id === powerUpId);
    if (index !== -1) {
      playerPowerUps.splice(index, 1);
      console.log(`Removed ${powerUpId} from player ${playerId}`);
    }
  }

  /**
   * Get active power-up multiplier for a player
   */
  public getPowerUpMultiplier(playerId: string, effectType: string): number {
    const playerPowerUps = this.activePowerUps.get(playerId) || [];
    let multiplier = 1.0;

    playerPowerUps.forEach(activePowerUp => {
      if (activePowerUp.expiresAt > Date.now()) {
        activePowerUp.powerUp.effects.forEach(effect => {
          if (effect.type === effectType) {
            multiplier *= effect.multiplier;
          }
        });
      }
    });

    return multiplier;
  }

  /**
   * Broadcast wave start to all players
   */
  private broadcastWaveStart(config: WaveConfig): void {
    const message = {
      type: 'wave_start',
      wave: this.currentWave,
      enemyCount: config.enemyCount,
      isBossWave: config.bossWave,
      prepTime: 0
    };

    // TODO: Broadcast to all connected clients
    console.log('Wave started:', message);
  }

  /**
   * Broadcast wave completion
   */
  private broadcastWaveComplete(duration: number): void {
    const message = {
      type: 'wave_complete',
      wave: this.currentWave,
      duration: Math.floor(duration / 1000), // Convert to seconds
      nextWaveIn: this.WAVE_PREP_TIME / 1000
    };

    // TODO: Broadcast to all connected clients
    console.log('Wave completed:', message);
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current wave status
   */
  public getStatus(): {
    currentWave: number;
    waveInProgress: boolean;
    enemiesRemaining: number;
    nextWaveIn: number;
  } {
    const nextWaveIn = this.waveInProgress ? 0 : 
      Math.max(0, this.WAVE_PREP_TIME - (Date.now() - this.waveStartTime));

    return {
      currentWave: this.currentWave,
      waveInProgress: this.waveInProgress,
      enemiesRemaining: this.enemiesRemaining,
      nextWaveIn
    };
  }

  /**
   * Reset wave manager
   */
  public reset(): void {
    this.currentWave = 0;
    this.waveInProgress = false;
    this.enemiesRemaining = 0;
    this.activePowerUps.clear();
  }
}