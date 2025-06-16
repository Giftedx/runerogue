// LEGACY: Not used in current production. Retained for reference, migration, or testing only.
import { Room, Client } from 'colyseus';
import { IWorld, addEntity, removeEntity, addComponent, createWorld } from 'bitecs';
import { GameRoomState, PlayerSchema } from '@runerogue/shared';
import * as Components from '../ecs/components';
import * as Systems from '../ecs/systems';
import { StateSyncSystem } from '../systems/StateSyncSystem';
import {
  ServerMessage,
  EnemyType,
  Vector2,
  // Removed unused shared type imports
} from '@runerogue/shared';

const OSRS_GAME_TICK_MS = 600;

export class GameRoom extends Room<GameRoomState> {
  private world: IWorld;
  private stateSyncSystem: StateSyncSystem;
  private ecsSystems: ((world: IWorld) => void)[] = [];

  private playerEntityMap = new Map<string, number>();
  private entityPlayerMap = new Map<number, string>();
  private enemyEntityMap = new Map<string, number>();
  private entityEnemyMap = new Map<number, string>();
  private gameLoopInterval!: NodeJS.Timeout;
  public readonly TICK_RATE = 50;
  public tickCounter = 0;

  // Performance monitoring
  private performanceMetrics = {
    avgTickTime: 0,
    peakTickTime: 0,
    playerCount: 0,
    entityCount: 0,
    lastReportTime: Date.now(),
  };

  public currentWave = 0;
  private waveInProgress = false;
  private enemiesToSpawnThisWave = 0;
  private enemiesSpawnedThisWave = 0;
  private waveStartTime = 0;
  private nextWaveTimeout?: NodeJS.Timeout;

  private entityIdCounter = 0;
  async onCreate(options: any) {
    this.state = new GameRoomState();
    this.state.gameStarted = false;
    this.state.gameEnded = false;

    this.world = createWorld();
    this.stateSyncSystem = new StateSyncSystem(this, this.world, {
      playerEntityMap: this.playerEntityMap,
      entityPlayerMap: this.entityPlayerMap,
      enemyEntityMap: this.enemyEntityMap,
      entityEnemyMap: this.entityEnemyMap,
    });
    this.initializeECSSystems();
    this.setupMessageHandlers();
    this.setMetadata({ name: 'RuneRogue Alpha', mode: 'Survival' });
  }
  private initializeECSSystems() {
    // Add available systems
    if (Systems.MovementSystem) this.ecsSystems.push(Systems.MovementSystem);
    if (Systems.CombatSystem) this.ecsSystems.push(Systems.CombatSystem);
    if (Systems.PrayerSystem) this.ecsSystems.push(Systems.PrayerSystem);
    if (Systems.SkillSystem) this.ecsSystems.push(Systems.SkillSystem);
    // Re-enabled gathering systems:
    if (Systems.ResourceNodeSystem) this.ecsSystems.push(Systems.ResourceNodeSystem);
    if (Systems.WoodcuttingSystem) this.ecsSystems.push(Systems.WoodcuttingSystem);
    if (Systems.MiningSystem) this.ecsSystems.push(Systems.MiningSystem);
    if (Systems.FishingSystem) this.ecsSystems.push(Systems.FishingSystem);
    if (Systems.CookingSystem) this.ecsSystems.push(Systems.CookingSystem);
    if (Systems.FiremakingSystem) this.ecsSystems.push(Systems.FiremakingSystem);
  }
  private setupMessageHandlers() {
    this.onMessage<{ target: Vector2 }>('move', (client, message) =>
      this.handleMove(client, message.target)
    );
    this.onMessage<{ targetId: string }>('attack', (client, message) =>
      this.handleAttack(client, message.targetId)
    );
    this.onMessage('stopAttack', client => this.handleStopAttack(client));
    this.onMessage<{ action: 'activate' | 'deactivate'; prayer: string }>(
      'prayer',
      (client, message) => this.handlePrayer(client, message.action, message.prayer)
    );
    this.onMessage<{ targetId?: string }>('specialAttack', (client, message) =>
      this.handleSpecialAttack(client, message.targetId)
    );
    this.onMessage<{ message: string }>('chat', (client, message) =>
      this.handleChat(client, message.message)
    );
  }
  async onJoin(client: Client, options: any) {
    try {
      const playerName =
        this.validatePlayerName(options.name) || `Player${client.sessionId.slice(0, 4)}`;

      // Check room capacity
      if (this.state.players.size >= 4) {
        throw new Error('Room is full');
      }

      // Create ECS entity
      const entity = addEntity(this.world);
      this.playerEntityMap.set(client.sessionId, entity);
      this.entityPlayerMap.set(entity, client.sessionId);

      // Initialize player entity with OSRS defaults
      this.initializePlayerEntity(entity, playerName);

      // Create Colyseus state
      const playerState = new PlayerSchema();
      playerState.id = client.sessionId;
      playerState.name = playerName;

      // Sync initial state from ECS to Colyseus
      this.stateSyncSystem.execute(0);
      this.state.players.set(client.sessionId, playerState);

      // Broadcast join event
      this.broadcastPlayerJoin(playerName);

      // Auto-start game if minimum players reached
      this.checkGameStart();
    } catch (error) {
      console.error('Player join failed:', error);
      client.leave(1000, 'Join failed: ' + (error as Error).message);
    }
  }

  /**
   * Validate and sanitize player name
   */
  private validatePlayerName(name?: string): string | null {
    if (!name || typeof name !== 'string') return null;

    // OSRS name validation: 1-12 characters, alphanumeric and spaces
    const sanitized = name.trim().slice(0, 12);
    const validPattern = /^[a-zA-Z0-9 ]+$/;

    return validPattern.test(sanitized) ? sanitized : null;
  }

  /**
   * Broadcast player join event
   */
  private broadcastPlayerJoin(playerName: string) {
    this.broadcast('chatMessage', {
      playerId: 'system',
      playerName: 'System',
      message: `${playerName} has joined!`,
    } as ServerMessage);
  }

  /**
   * Check if game should start
   */
  private checkGameStart() {
    if (this.state.players.size === 1 && !this.state.gameStarted) {
      this.startGame();
    }
  }

  private initializePlayerEntity(entity: number, name: string) {
    addComponent(this.world, Components.Player, entity);
    Components.Player.id[entity] = this.entityIdCounter++;
    addComponent(this.world, Components.Name, entity);
    (Components.Name.value[entity] as any) = name;
    addComponent(this.world, Components.Position, entity);
    Components.Position.x[entity] = 400 + (Math.random() - 0.5) * 50;
    Components.Position.y[entity] = 300 + (Math.random() - 0.5) * 50;
    addComponent(this.world, Components.Health, entity);
    Components.Health.current[entity] = 10;
    Components.Health.max[entity] = 10;
    // Add and initialize SkillLevels and SkillXP components (OSRS-authentic)
    addComponent(this.world, Components.SkillLevels, entity);
    Components.SkillLevels.attack[entity] = 1;
    Components.SkillLevels.strength[entity] = 1;
    Components.SkillLevels.defence[entity] = 1;
    Components.SkillLevels.hitpoints[entity] = 10;
    Components.SkillLevels.ranged[entity] = 1;
    Components.SkillLevels.prayer[entity] = 1;
    Components.SkillLevels.magic[entity] = 1;

    addComponent(this.world, Components.SkillXP, entity);
    Components.SkillXP.attack[entity] = 0;
    Components.SkillXP.strength[entity] = 0;
    Components.SkillXP.defence[entity] = 0;
    Components.SkillXP.hitpoints[entity] = 1154;
    Components.SkillXP.ranged[entity] = 0;
    Components.SkillXP.prayer[entity] = 0;
    Components.SkillXP.magic[entity] = 0;
    addComponent(this.world, Components.Prayer, entity);
    Components.Prayer.points[entity] = 1;
    Components.Prayer.level[entity] = 1;
    Components.Prayer.activeMask[entity] = 0;
    Components.Prayer.drainRate[entity] = 0;
    Components.Prayer.drainTimer[entity] = 0;
    addComponent(this.world, Components.AttackTimer, entity);
    Components.AttackTimer.cooldown[entity] = 5 * OSRS_GAME_TICK_MS;
    Components.AttackTimer.lastAttack[entity] = 0;
    addComponent(this.world, Components.Input, entity);
    Components.Input.moveX[entity] = Components.Position.x[entity];
    Components.Input.moveY[entity] = Components.Position.y[entity];
    addComponent(this.world, Components.Velocity, entity);
    Components.Velocity.x[entity] = 0;
    Components.Velocity.y[entity] = 0;
    Components.Velocity.maxSpeed[entity] = (2.5 * 64) / (1000 / this.TICK_RATE);
    addComponent(this.world, Components.Equipment, entity);
    addComponent(this.world, Components.EquipmentBonuses, entity);
    addComponent(this.world, Components.SpecialAttack, entity);
    Components.SpecialAttack.energy[entity] = 100;
    Components.SpecialAttack.cooldownTimer[entity] = 0;
    addComponent(this.world, Components.CombatState, entity);
    Components.CombatState.inCombatTimer[entity] = 0;
  }
  async onLeave(client: Client, consented: boolean) {
    try {
      const playerName = this.state.players.get(client.sessionId)?.name || client.sessionId;
      const entity = this.playerEntityMap.get(client.sessionId);

      if (entity !== undefined) {
        // Clean up ECS entity
        removeEntity(this.world, entity);
        this.playerEntityMap.delete(client.sessionId);
        this.entityPlayerMap.delete(entity);
      }

      // Clean up Colyseus state
      this.state.players.delete(client.sessionId);

      // Broadcast leave event
      this.broadcastPlayerLeave(playerName);

      // Check if game should pause/end
      this.checkGamePause();
    } catch (error) {
      console.error('Player leave cleanup failed:', error);
    }
  }

  /**
   * Broadcast player leave event
   */
  private broadcastPlayerLeave(playerName: string) {
    this.broadcast('chatMessage', {
      playerId: 'system',
      playerName: 'System',
      message: `${playerName} has left.`,
    } as ServerMessage);
  }

  /**
   * Check if game should pause or end
   */
  private checkGamePause() {
    if (this.state.players.size === 0 && this.state.gameStarted) {
      this.endGame();
    }
  }
  private startGame() {
    if (this.state.gameStarted) return;
    this.state.gameStarted = true;
    this.currentWave = 0;
    this.waveStartTime = Date.now();
    this.startEnhancedGameLoop();
    this.startNextWave();
  }

  /**
   * Enhanced game loop with performance monitoring and optimal timing
   * Target: 20 TPS (50ms per tick) with consistent performance
   */
  private startEnhancedGameLoop() {
    const targetTickTime = 1000 / 20; // 20 TPS = 50ms per tick
    let lastTime = Date.now();

    this.gameLoopInterval = setInterval(() => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;
      const tickStartTime = performance.now();

      try {
        this.updateGame(deltaTime);

        // Performance monitoring
        const tickEndTime = performance.now();
        const tickDuration = tickEndTime - tickStartTime;
        this.updatePerformanceMetrics(tickDuration);
      } catch (error) {
        console.error('Game loop error:', error);
      }

      lastTime = currentTime;
    }, targetTickTime);
  }

  /**
   * Enhanced game update with optimized system execution order
   */
  private updateGame(deltaTime: number) {
    this.tickCounter++;

    // Execute ECS systems in dependency order
    this.runECSSystems(deltaTime);

    // Synchronize state to clients (critical for multiplayer)
    this.stateSyncSystem.execute(this.TICK_RATE);

    // Wave management (after all gameplay systems)
    this.checkWaveProgress();
  }

  /**
   * Run ECS systems in optimal order for dependencies
   */
  private runECSSystems(deltaTime: number) {
    // 1. Input processing & movement validation (highest priority)
    // 2. Combat calculations
    // 3. Skill progression
    // 4. State updates
    for (const system of this.ecsSystems) {
      try {
        system(this.world);
      } catch (systemError) {
        console.error(`ECS System error in ${system.name || 'unknown system'}:`, systemError);
      }
    }
  }

  /**
   * Check wave progress separate from tick for cleaner logic
   */
  private checkWaveProgress() {
    if (this.waveInProgress && this.state.enemies.size === 0) {
      this.completeWave();
    }
  }

  private endGame() {
    if (!this.state.gameStarted || this.state.gameEnded) return;
    this.state.gameEnded = true;
    if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
    if (this.nextWaveTimeout) clearTimeout(this.nextWaveTimeout);
    const timePlayed = Math.floor((Date.now() - this.waveStartTime) / 1000);
    this.broadcast('gameOver', {
      survivedWaves: this.currentWave,
      totalXp: 0,
      timePlayed,
    } as ServerMessage);
    setTimeout(() => this.disconnect(), 30000);
  }
  /**
   * Legacy tick method - replaced by enhanced game loop
   * Kept for compatibility if needed
   */
  private tick() {
    this.updateGame(this.TICK_RATE);
  }

  private startNextWave() {
    this.currentWave++;
    this.waveInProgress = true;
    this.enemiesSpawnedThisWave = 0;
    this.enemiesToSpawnThisWave = this.getEnemyCountForWave(this.currentWave);
    const enemyTypes = this.getEnemyTypesForWave(this.currentWave);
    this.state.wave.current = this.currentWave;
    this.state.wave.enemiesRemaining = this.enemiesToSpawnThisWave;
    this.broadcast('waveStart', {
      wave: this.currentWave,
      enemyCount: this.enemiesToSpawnThisWave,
      enemyTypes,
    } as ServerMessage);
    if (Components.WaveState) {
      const waveEntity = addEntity(this.world);
      addComponent(this.world, Components.WaveState, waveEntity);
      Components.WaveState.currentWave[waveEntity] = this.currentWave;
      Components.WaveState.enemiesToSpawn[waveEntity] = this.enemiesToSpawnThisWave;
      Components.WaveState.spawnTimer[waveEntity] = 0;
    }
  }

  private completeWave() {
    this.waveInProgress = false;
    this.broadcast('waveComplete', {
      wave: this.currentWave,
      bonusXp: 100 * this.currentWave,
    } as ServerMessage);
    const delayBetweenWaves = 10000;
    this.state.wave.nextWaveIn = delayBetweenWaves / 1000;
    this.nextWaveTimeout = setTimeout(() => {
      this.startNextWave();
    }, delayBetweenWaves);
  }

  private getEnemyCountForWave(wave: number): number {
    return 5 + Math.floor(wave * 1.5);
  }

  private getEnemyTypesForWave(wave: number): EnemyType[] {
    if (wave <= 2) return ['chicken', 'rat'];
    if (wave <= 5) return ['goblin', 'cow', 'spider'];
    if (wave <= 8) return ['imp', 'guard', 'hobgoblin'];
    if (wave <= 12) return ['wizard', 'moss_giant', 'hill_giant'];
    return ['lesser_demon', 'fire_giant'];
  }
  private handleMove(client: Client, target: { x: number; y: number }) {
    const entity = this.playerEntityMap.get(client.sessionId);
    if (entity === undefined || !Components.Input) return;

    const currentPos = {
      x: Components.Position.x[entity],
      y: Components.Position.y[entity],
    };

    // OSRS movement validation - prevent cheating
    if (this.validateMovement(currentPos, target, entity)) {
      Components.Input.moveX[entity] = target.x;
      Components.Input.moveY[entity] = target.y;
      Components.Input.isMoving[entity] = 1;
    } else {
      // Invalid movement - send correction back to client
      this.send(client, 'positionCorrection', {
        x: currentPos.x,
        y: currentPos.y,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Validate movement according to OSRS mechanics
   * Prevents speed hacking and impossible movements
   */
  private validateMovement(
    current: { x: number; y: number },
    target: { x: number; y: number },
    entity: number
  ): boolean {
    const distance = Math.sqrt(
      Math.pow(target.x - current.x, 2) + Math.pow(target.y - current.y, 2)
    );

    // OSRS: 1 tile per 0.6 seconds at base speed
    // With 20 TPS server, max distance per tick is limited
    const maxDistancePerTick = Components.Velocity?.maxSpeed?.[entity] || 64; // Default tile size in pixels

    // Allow some tolerance for network lag but prevent major cheating
    const maxAllowedDistance = maxDistancePerTick * 1.2; // 20% tolerance

    return distance <= maxAllowedDistance;
  }

  private handleAttack(client: Client, targetId: string) {
    const attackerEntity = this.playerEntityMap.get(client.sessionId);
    if (attackerEntity === undefined || !Components.Input || !Components.Target) return;
    const targetEntity = this.enemyEntityMap.get(targetId) || this.playerEntityMap.get(targetId);
    if (targetEntity === undefined) return;
    Components.Target.id[attackerEntity] = targetEntity;
    Components.Input.isAttacking[attackerEntity] = 1;
  }

  private handleStopAttack(client: Client) {
    const entity = this.playerEntityMap.get(client.sessionId);
    if (entity === undefined || !Components.Input || !Components.Target) return;
    Components.Target.id[entity] = 0;
    Components.Input.isAttacking[entity] = 0;
  }

  private handlePrayer(client: Client, action: 'activate' | 'deactivate', prayerName: string) {
    const entity = this.playerEntityMap.get(client.sessionId);
    if (entity === undefined || !Components.Prayer) return;
    // More complex: find prayer bitmask, toggle, check level, check points
    // This should likely queue an action for PrayerSystem to handle
  }

  private handleSpecialAttack(client: Client, targetId?: string) {
    const entity = this.playerEntityMap.get(client.sessionId);
    if (entity === undefined || !Components.Input || !Components.SpecialAttack) return;
    // Check energy, cooldown, set target if applicable
    // This should queue an action for SpecialAttackSystem
  }

  private handleChat(client: Client, message: string) {
    const player = this.state.players.get(client.sessionId);
    if (!player || message.length === 0 || message.length > 80) return;
    this.broadcast(
      'chatMessage',
      { playerId: client.sessionId, playerName: player.name, message } as ServerMessage,
      { except: client }
    );
    this.send(client, 'chatMessage', {
      playerId: client.sessionId,
      playerName: player.name,
      message,
    } as ServerMessage);
  }

  /**
   * Update performance metrics for monitoring
   */
  private updatePerformanceMetrics(tickTime: number) {
    this.performanceMetrics.avgTickTime =
      this.performanceMetrics.avgTickTime * 0.9 + tickTime * 0.1;
    this.performanceMetrics.peakTickTime = Math.max(this.performanceMetrics.peakTickTime, tickTime);
    this.performanceMetrics.playerCount = this.state.players.size;
    this.performanceMetrics.entityCount = this.playerEntityMap.size + this.enemyEntityMap.size;

    // Report every 30 seconds
    if (Date.now() - this.performanceMetrics.lastReportTime > 30000) {
      this.logPerformanceReport();
      this.performanceMetrics.lastReportTime = Date.now();
      this.performanceMetrics.peakTickTime = 0; // Reset peak after reporting
    }
  }

  /**
   * Log performance report for monitoring
   */
  private logPerformanceReport() {
    console.log('📊 GameRoom Performance Report:', {
      room: this.roomId,
      avgTickTime: `${this.performanceMetrics.avgTickTime.toFixed(2)}ms`,
      peakTickTime: `${this.performanceMetrics.peakTickTime.toFixed(2)}ms`,
      targetTickTime: '50ms (20 TPS)',
      players: this.performanceMetrics.playerCount,
      entities: this.performanceMetrics.entityCount,
      wave: this.currentWave,
      performance: this.performanceMetrics.avgTickTime < 50 ? '✅ Good' : '⚠️ Degraded',
    });
  }

  onDispose() {
    if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
    if (this.nextWaveTimeout) clearTimeout(this.nextWaveTimeout);
  }
}
