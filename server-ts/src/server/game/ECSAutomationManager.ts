/**
 * ECS Automation Manager for RuneRogue
 *
 * Provides full automation for ECS integration and system execution loop
 * with comprehensive error handling, monitoring, and self-recovery capabilities.
 */

import { ECSIntegration } from './ECSIntegration';

/**
 * Performance metrics for system monitoring
 */
interface SystemMetrics {
  executionTime: number;
  lastUpdate: number;
  errorCount: number;
  totalExecutions: number;
  averageExecutionTime: number;
}

/**
 * Configuration for the automation manager
 */
interface AutomationConfig {
  targetFrameRate: number;
  maxErrorsPerSecond: number;
  healthCheckInterval: number;
  performanceMonitoringEnabled: boolean;
  autoRecoveryEnabled: boolean;
  gracefulShutdown: boolean;
}

/**
 * ECS Automation Manager
 *
 * Handles complete automation of ECS systems with:
 * - Automatic system execution loop
 * - Performance monitoring and optimization
 * - Error handling and recovery
 * - Health checks and diagnostics
 * - Graceful startup and shutdown
 */
export class ECSAutomationManager {
  private ecsIntegration: ECSIntegration;
  private isRunning: boolean = false;
  private updateLoop: NodeJS.Timeout | null = null;
  private healthCheckLoop: NodeJS.Timeout | null = null;

  private config: AutomationConfig;
  private systemMetrics = new Map<string, SystemMetrics>();
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private startTime: number = 0;

  // Error tracking
  private errorHistory: Array<{ timestamp: number; error: Error; system?: string }> = [];
  private errorThreshold: number;

  // Performance tracking
  private frameTimes: number[] = [];
  private maxFrameTimeHistory = 1000; // Keep last 1000 frame times
  constructor(config: Partial<AutomationConfig> = {}) {
    // Detect test environment and apply optimized configuration
    const isTestEnvironment =
      process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;

    this.config = {
      targetFrameRate: 60,
      maxErrorsPerSecond: isTestEnvironment ? 10 : 5,
      healthCheckInterval: isTestEnvironment ? 30000 : 5000, // Less frequent monitoring in tests
      performanceMonitoringEnabled: isTestEnvironment ? false : true, // Disable perf monitoring in tests
      autoRecoveryEnabled: true,
      gracefulShutdown: !isTestEnvironment, // Fast shutdown for tests
      ...config,
    };

    this.errorThreshold = this.config.maxErrorsPerSecond;
    this.ecsIntegration = new ECSIntegration();

    // Initialize system metrics
    this.initializeSystemMetrics();

    // Set up graceful shutdown handlers only in production
    if (this.config.gracefulShutdown) {
      this.setupGracefulShutdown();
    }
    if (this.config.gracefulShutdown) {
      this.setupGracefulShutdown();
    }
  }

  /**
   * Initialize metrics tracking for all systems
   */
  private initializeSystemMetrics(): void {
    const systemNames = ['MovementSystem', 'CombatSystem', 'PrayerSystem', 'SkillSystem'];

    systemNames.forEach(name => {
      this.systemMetrics.set(name, {
        executionTime: 0,
        lastUpdate: 0,
        errorCount: 0,
        totalExecutions: 0,
        averageExecutionTime: 0,
      });
    });
  }

  /**
   * Start the automated ECS system execution loop
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      console.warn('ECS Automation Manager is already running');
      return;
    }

    console.log('🚀 Starting ECS Automation Manager...');

    try {
      // Initialize and validate ECS systems
      await this.validateECSIntegration();

      this.isRunning = true;
      this.startTime = Date.now();
      this.lastFrameTime = performance.now();

      // Start the main update loop
      this.startUpdateLoop();

      // Start health monitoring if enabled
      if (this.config.performanceMonitoringEnabled) {
        this.startHealthMonitoring();
      }

      console.log(`✅ ECS Automation Manager started successfully`);
      console.log(`   Target FPS: ${this.config.targetFrameRate}`);
      console.log(
        `   Performance Monitoring: ${this.config.performanceMonitoringEnabled ? 'Enabled' : 'Disabled'}`
      );
      console.log(`   Auto Recovery: ${this.config.autoRecoveryEnabled ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      console.error('❌ Failed to start ECS Automation Manager:', error);
      throw error;
    }
  }

  /**
   * Stop the automated ECS system execution
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      console.warn('ECS Automation Manager is not running');
      return;
    }

    console.log('🛑 Stopping ECS Automation Manager...');

    this.isRunning = false;

    // Clear update loop
    if (this.updateLoop) {
      clearTimeout(this.updateLoop);
      this.updateLoop = null;
    }

    // Clear health monitoring
    if (this.healthCheckLoop) {
      clearInterval(this.healthCheckLoop);
      this.healthCheckLoop = null;
    }

    // Final health report
    this.generateHealthReport();

    console.log('✅ ECS Automation Manager stopped successfully');
  }

  /**
   * Validate that ECS integration is properly set up
   */
  private async validateECSIntegration(): Promise<void> {
    try {
      const world = this.ecsIntegration.getWorld();
      if (!world) {
        throw new Error('ECS World not initialized');
      }

      const stats = this.ecsIntegration.getStats();
      if (stats.systemCount === 0) {
        throw new Error('No ECS systems registered');
      }

      console.log(`   ECS World initialized with ${stats.systemCount} systems`);
      console.log(`   Registered components: ${stats.registeredComponents.join(', ')}`);
    } catch (error) {
      throw new Error(`ECS Integration validation failed: ${error.message}`);
    }
  } /**
   * Start the main update loop with frame rate control
   */
  private startUpdateLoop(): void {
    const targetFrameTime = 1000 / this.config.targetFrameRate;
    let lastUpdateTime = performance.now();

    const updateStep = () => {
      if (!this.isRunning) return;

      const currentTime = performance.now();
      const deltaTime = currentTime - lastUpdateTime;

      // Skip update if too little time has passed (prevents unnecessary work)
      if (deltaTime < targetFrameTime * 0.5) {
        this.updateLoop = setTimeout(updateStep, 1);
        return;
      }

      try {
        // Execute ECS systems update
        this.executeECSUpdate(deltaTime);

        // Update performance metrics (only if enabled and less frequently)
        if (this.config.performanceMonitoringEnabled && this.frameCount % 10 === 0) {
          this.updatePerformanceMetrics(deltaTime);
        }

        lastUpdateTime = currentTime;
        this.frameCount++;

        // Optimized scheduling - reduce timer precision for better performance
        const frameTime = performance.now() - currentTime;
        const remainingTime = Math.max(0, targetFrameTime - frameTime);

        if (remainingTime > 1) {
          // Use setTimeout for precise timing when we have time to spare
          this.updateLoop = setTimeout(updateStep, remainingTime);
        } else {
          // Use setImmediate for immediate next tick when running behind
          this.updateLoop = setTimeout(updateStep, 0);
        }
      } catch (error) {
        this.handleSystemError(error);

        // Continue the loop even after errors (if auto-recovery is enabled)
        if (this.config.autoRecoveryEnabled) {
          this.updateLoop = setTimeout(updateStep, targetFrameTime);
        }
      }
    };

    updateStep();
  }

  /**
   * Execute ECS systems update with error handling and metrics
   */
  private executeECSUpdate(deltaTime: number): void {
    const startTime = performance.now();

    try {
      // Set delta time on world for systems to use
      (this.ecsIntegration.getWorld() as any).deltaTime = deltaTime / 1000; // Convert to seconds

      // Run all ECS systems
      this.ecsIntegration.update(deltaTime);

      const executionTime = performance.now() - startTime;

      // Update system metrics
      this.updateSystemMetrics('ECSIntegration', executionTime);
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordSystemError('ECSIntegration', error, executionTime);
      throw error;
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(deltaTime: number): void {
    if (!this.config.performanceMonitoringEnabled) return;

    // Track frame times
    this.frameTimes.push(deltaTime);
    if (this.frameTimes.length > this.maxFrameTimeHistory) {
      this.frameTimes.shift();
    }
  }

  /**
   * Update metrics for a specific system
   */
  private updateSystemMetrics(systemName: string, executionTime: number): void {
    const metrics = this.systemMetrics.get(systemName);
    if (!metrics) return;

    metrics.executionTime = executionTime;
    metrics.lastUpdate = Date.now();
    metrics.totalExecutions++;

    // Calculate running average
    const alpha = 0.1; // Smoothing factor
    metrics.averageExecutionTime =
      metrics.averageExecutionTime === 0
        ? executionTime
        : metrics.averageExecutionTime * (1 - alpha) + executionTime * alpha;
  }

  /**
   * Record system error and update metrics
   */
  private recordSystemError(systemName: string, error: Error, executionTime?: number): void {
    const metrics = this.systemMetrics.get(systemName);
    if (metrics) {
      metrics.errorCount++;
      if (executionTime !== undefined) {
        metrics.executionTime = executionTime;
      }
    }

    // Add to error history
    this.errorHistory.push({
      timestamp: Date.now(),
      error,
      system: systemName,
    });

    // Trim error history (keep last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.errorHistory = this.errorHistory.filter(e => e.timestamp > oneHourAgo);
  }

  /**
   * Handle system errors with recovery strategies
   */
  private handleSystemError(error: Error): void {
    console.error('⚠️ ECS System Error:', error.message);

    // Check error rate
    const recentErrors = this.getRecentErrorCount();

    if (recentErrors > this.errorThreshold) {
      console.error(
        `❌ Error threshold exceeded (${recentErrors}/${this.errorThreshold}). Stopping automation.`
      );

      if (this.config.autoRecoveryEnabled) {
        console.log('🔄 Attempting auto-recovery...');
        this.attemptRecovery();
      } else {
        this.stop();
      }
    }
  }

  /**
   * Get number of errors in the last second
   */
  private getRecentErrorCount(): number {
    const oneSecondAgo = Date.now() - 1000;
    return this.errorHistory.filter(e => e.timestamp > oneSecondAgo).length;
  }

  /**
   * Attempt to recover from errors
   */
  private attemptRecovery(): void {
    try {
      console.log('🔧 Reinitializing ECS integration...');

      // Recreate ECS integration
      this.ecsIntegration = new ECSIntegration();

      // Reset error tracking
      this.errorHistory = [];

      // Reset metrics
      this.initializeSystemMetrics();

      console.log('✅ Auto-recovery completed successfully');
    } catch (recoveryError) {
      console.error('❌ Auto-recovery failed:', recoveryError);
      this.stop();
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckLoop = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform comprehensive health check
   */
  private performHealthCheck(): void {
    if (!this.isRunning) return;

    const uptime = Date.now() - this.startTime;
    const avgFPS = this.frameCount / (uptime / 1000);

    console.log(`📊 ECS Health Check (${Math.round(uptime / 1000)}s uptime):`);
    console.log(`   Average FPS: ${avgFPS.toFixed(2)}/${this.config.targetFrameRate}`);
    console.log(`   Total Frames: ${this.frameCount}`);
    console.log(`   Recent Errors: ${this.getRecentErrorCount()}`);

    // Performance warnings
    if (avgFPS < this.config.targetFrameRate * 0.8) {
      console.warn(
        `⚠️ Performance below target (${avgFPS.toFixed(2)} < ${this.config.targetFrameRate * 0.8})`
      );
    }

    // System-specific metrics
    this.systemMetrics.forEach((metrics, systemName) => {
      if (metrics.totalExecutions > 0) {
        console.log(
          `   ${systemName}: ${metrics.averageExecutionTime.toFixed(2)}ms avg, ${metrics.errorCount} errors`
        );
      }
    });
  }

  /**
   * Generate comprehensive health report
   */
  private generateHealthReport(): void {
    const uptime = Date.now() - this.startTime;
    const avgFPS = this.frameCount / (uptime / 1000);

    console.log('\n📋 Final ECS Health Report:');
    console.log(`   Total Runtime: ${Math.round(uptime / 1000)}s`);
    console.log(`   Total Frames: ${this.frameCount}`);
    console.log(`   Average FPS: ${avgFPS.toFixed(2)}`);
    console.log(`   Total Errors: ${this.errorHistory.length}`);

    if (this.frameTimes.length > 0) {
      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      const maxFrameTime = Math.max(...this.frameTimes);
      const minFrameTime = Math.min(...this.frameTimes);

      console.log(
        `   Frame Time - Avg: ${avgFrameTime.toFixed(2)}ms, Min: ${minFrameTime.toFixed(2)}ms, Max: ${maxFrameTime.toFixed(2)}ms`
      );
    }

    // System performance summary
    console.log('\n📈 System Performance Summary:');
    this.systemMetrics.forEach((metrics, systemName) => {
      if (metrics.totalExecutions > 0) {
        const successRate = (
          ((metrics.totalExecutions - metrics.errorCount) / metrics.totalExecutions) *
          100
        ).toFixed(1);
        console.log(
          `   ${systemName}: ${metrics.totalExecutions} executions, ${successRate}% success rate, ${metrics.averageExecutionTime.toFixed(2)}ms avg`
        );
      }
    });
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log('\n🛑 Received shutdown signal...');
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', error => {
      console.error('❌ Uncaught Exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', reason => {
      console.error('❌ Unhandled Rejection:', reason);
      shutdown();
    });
  }

  /**
   * Get current automation status
   */
  public getStatus(): {
    isRunning: boolean;
    uptime: number;
    frameCount: number;
    averageFPS: number;
    errorCount: number;
    systemMetrics: Map<string, SystemMetrics>;
  } {
    const uptime = this.isRunning ? Date.now() - this.startTime : 0;
    const averageFPS = uptime > 0 ? this.frameCount / (uptime / 1000) : 0;

    return {
      isRunning: this.isRunning,
      uptime,
      frameCount: this.frameCount,
      averageFPS,
      errorCount: this.errorHistory.length,
      systemMetrics: new Map(this.systemMetrics),
    };
  }

  /**
   * Get ECS integration instance for external access
   */
  public getECSIntegration(): ECSIntegration {
    return this.ecsIntegration;
  }

  /**
   * Manually trigger a health check
   */
  public performManualHealthCheck(): void {
    this.performHealthCheck();
  }

  /**
   * Add a player to the ECS system
   */
  public addPlayer(player: any): number {
    try {
      return this.ecsIntegration.syncPlayerToECS(player);
    } catch (error) {
      this.recordSystemError('PlayerManagement', error);
      throw error;
    }
  }

  /**
   * Remove a player from the ECS system
   */
  public removePlayer(playerId: string): void {
    try {
      this.ecsIntegration.removePlayer(playerId);
    } catch (error) {
      this.recordSystemError('PlayerManagement', error);
      throw error;
    }
  }
  /**
   * Sync ECS state back to Colyseus player
   */
  public syncToPlayer(entityId: number, player: any): void {
    try {
      // Validate entityId
      if (entityId < 0 || !Number.isInteger(entityId)) {
        throw new Error(`Invalid entity ID: ${entityId}`);
      }

      // Validate player object
      if (!player || typeof player !== 'object') {
        throw new Error('Invalid player object provided');
      }

      this.ecsIntegration.syncECSToPlayer(entityId, player);
    } catch (error) {
      this.recordSystemError('PlayerSync', error);
      throw error;
    }
  }
}
