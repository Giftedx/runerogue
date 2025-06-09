/**
 * Unit Tests for ECS Automation Manager
 *
 * Comprehensive tests for the automated ECS system execution,
 * error handling, performance monitoring, and recovery mechanisms.
 */

import { ECSAutomationManager } from '../src/server/game/ECSAutomationManager';

// Mock performance.now for testing
global.performance = {
  now: jest.fn(() => Date.now()),
} as Performance;

// Mock setTimeout/clearTimeout for controlling test timing
jest.useFakeTimers();

describe('ECSAutomationManager', () => {
  let automationManager: ECSAutomationManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Create fresh automation manager instance
    automationManager = new ECSAutomationManager({
      targetFrameRate: 60,
      performanceMonitoringEnabled: true,
      autoRecoveryEnabled: true,
      maxErrorsPerSecond: 3,
      healthCheckInterval: 1000,
      gracefulShutdown: false, // Disable for tests
    });
  });

  afterEach(async () => {
    if (automationManager.getStatus().isRunning) {
      await automationManager.stop();
    }
    jest.clearAllTimers();
  });

  describe('Initialization', () => {
    it('should initialize with correct default configuration', () => {
      const manager = new ECSAutomationManager();
      const status = manager.getStatus();

      expect(status.isRunning).toBe(false);
      expect(status.frameCount).toBe(0);
      expect(status.errorCount).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customConfig = {
        targetFrameRate: 30,
        maxErrorsPerSecond: 10,
        performanceMonitoringEnabled: false,
      };

      const manager = new ECSAutomationManager(customConfig);
      // Configuration is private, but we can test behavior
      expect(manager).toBeDefined();
    });

    it('should initialize ECS integration on construction', () => {
      const ecsIntegration = automationManager.getECSIntegration();
      expect(ecsIntegration).toBeDefined();
      expect(ecsIntegration.getStats().systemCount).toBeGreaterThan(0);
    });
  });

  describe('Automation Lifecycle', () => {
    it('should start automation successfully', async () => {
      await automationManager.start();

      const status = automationManager.getStatus();
      expect(status.isRunning).toBe(true);
      expect(status.uptime).toBeGreaterThan(0);
    });

    it('should prevent multiple starts', async () => {
      await automationManager.start();

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await automationManager.start(); // Second start should warn

      expect(consoleSpy).toHaveBeenCalledWith('ECS Automation Manager is already running');
      consoleSpy.mockRestore();
    });

    it('should stop automation successfully', async () => {
      await automationManager.start();
      await automationManager.stop();

      const status = automationManager.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should handle stop when not running', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await automationManager.stop();

      expect(consoleSpy).toHaveBeenCalledWith('ECS Automation Manager is not running');
      consoleSpy.mockRestore();
    });
  });

  describe('Player Management', () => {
    beforeEach(async () => {
      await automationManager.start();
    });

    it('should add player to ECS system', () => {
      const mockPlayer = {
        id: 'test-player-1',
        x: 100,
        y: 200,
        health: 85,
        maxHealth: 100,
        skills: {
          attack: { level: 50 },
          defence: { level: 45 },
          strength: { level: 48 },
          hitpoints: { level: 60 },
          ranged: { level: 30 },
          magic: { level: 25 },
          prayer: { level: 15 },
        },
      };

      const entityId = automationManager.addPlayer(mockPlayer);
      expect(entityId).toBeGreaterThanOrEqual(0);
    });

    it('should handle player with missing skills', () => {
      const mockPlayer = {
        id: 'test-player-2',
        x: 50,
        y: 75,
      };

      const entityId = automationManager.addPlayer(mockPlayer);
      expect(entityId).toBeGreaterThanOrEqual(0);
    });

    it('should remove player from ECS system', () => {
      const mockPlayer = {
        id: 'test-player-3',
        x: 150,
        y: 250,
      };

      const entityId = automationManager.addPlayer(mockPlayer);
      expect(entityId).toBeGreaterThanOrEqual(0);

      // Remove should not throw
      expect(() => {
        automationManager.removePlayer('test-player-3');
      }).not.toThrow();
    });

    it('should sync ECS state back to player', () => {
      const mockPlayer = {
        id: 'test-player-4',
        x: 300,
        y: 400,
        health: 75,
        maxHealth: 100,
      };

      const entityId = automationManager.addPlayer(mockPlayer);

      // Sync back should not throw
      expect(() => {
        automationManager.syncToPlayer(entityId, mockPlayer);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle ECS integration validation failure', async () => {
      // Mock a broken ECS integration
      const brokenManager = new ECSAutomationManager();
      jest.spyOn(brokenManager.getECSIntegration(), 'getWorld').mockReturnValue(null);

      await expect(brokenManager.start()).rejects.toThrow('ECS Integration validation failed');
    });

    it('should track player management errors', async () => {
      await automationManager.start();

      const invalidPlayer = null;

      expect(() => {
        automationManager.addPlayer(invalidPlayer);
      }).toThrow();

      const status = automationManager.getStatus();
      expect(status.errorCount).toBeGreaterThan(0);
    });

    it('should track sync errors', async () => {
      await automationManager.start();

      const invalidEntityId = -1;
      const mockPlayer = { id: 'test' };

      expect(() => {
        automationManager.syncToPlayer(invalidEntityId, mockPlayer);
      }).toThrow();

      const status = automationManager.getStatus();
      expect(status.errorCount).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await automationManager.start();
    });

    it('should track execution metrics', () => {
      // Fast-forward timers to trigger some updates
      jest.advanceTimersByTime(100);

      const status = automationManager.getStatus();
      expect(status.systemMetrics).toBeDefined();
      expect(status.systemMetrics.size).toBeGreaterThan(0);
    });

    it('should provide status information', () => {
      const status = automationManager.getStatus();

      expect(status.isRunning).toBe(true);
      expect(status.uptime).toBeGreaterThanOrEqual(0);
      expect(status.frameCount).toBeGreaterThanOrEqual(0);
      expect(status.averageFPS).toBeGreaterThanOrEqual(0);
      expect(status.errorCount).toBeGreaterThanOrEqual(0);
      expect(status.systemMetrics).toBeInstanceOf(Map);
    });

    it('should perform manual health checks', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      automationManager.performManualHealthCheck();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/📊 ECS Health Check/));

      consoleSpy.mockRestore();
    });
  });

  describe('System Execution Loop', () => {
    it('should execute update loop at target frame rate', async () => {
      await automationManager.start();

      // Fast-forward multiple frames
      jest.advanceTimersByTime(1000); // 1 second = ~60 frames at 60 FPS

      const status = automationManager.getStatus();
      expect(status.frameCount).toBeGreaterThan(50); // Should be close to 60
    });

    it('should handle update loop errors gracefully', async () => {
      await automationManager.start();

      // Mock ECS integration to throw errors
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(automationManager.getECSIntegration(), 'update').mockImplementation(() => {
        throw new Error('Test ECS error');
      });

      // Fast-forward to trigger updates
      jest.advanceTimersByTime(100);

      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/⚠️ ECS System Error/));

      errorSpy.mockRestore();
    });
  });

  describe('Auto-Recovery', () => {
    it('should attempt recovery after error threshold', async () => {
      await automationManager.start();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock ECS integration to throw multiple errors quickly
      jest.spyOn(automationManager.getECSIntegration(), 'update').mockImplementation(() => {
        throw new Error('Repeated test error');
      });

      // Fast-forward to trigger multiple errors
      jest.advanceTimersByTime(100);

      expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/❌ Error threshold exceeded/));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/🔄 Attempting auto-recovery/));

      consoleSpy.mockRestore();
      errorSpy.mockRestore();
    });
  });

  describe('Health Monitoring', () => {
    it('should perform periodic health checks when enabled', async () => {
      const manager = new ECSAutomationManager({
        performanceMonitoringEnabled: true,
        healthCheckInterval: 100,
        gracefulShutdown: false,
      });

      await manager.start();

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Fast-forward past health check interval
      jest.advanceTimersByTime(150);

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/📊 ECS Health Check/));

      consoleSpy.mockRestore();
      await manager.stop();
    });

    it('should generate comprehensive health report on stop', async () => {
      await automationManager.start();

      // Run for a bit to generate metrics
      jest.advanceTimersByTime(500);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await automationManager.stop();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/📋 Final ECS Health Report/));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/📈 System Performance Summary/)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Integration with ECS Components', () => {
    beforeEach(async () => {
      await automationManager.start();
    });

    it('should provide access to ECS integration', () => {
      const ecsIntegration = automationManager.getECSIntegration();
      expect(ecsIntegration).toBeDefined();
      expect(typeof ecsIntegration.getWorld).toBe('function');
      expect(typeof ecsIntegration.update).toBe('function');
    });

    it('should maintain entity-player mapping', () => {
      const mockPlayer = {
        id: 'mapping-test-player',
        x: 500,
        y: 600,
      };

      const entityId = automationManager.addPlayer(mockPlayer);
      const ecsIntegration = automationManager.getECSIntegration();

      expect(ecsIntegration.getEntityId(mockPlayer.id)).toBe(entityId);
      expect(ecsIntegration.getPlayerId(entityId)).toBe(mockPlayer.id);
    });
  });

  describe('Configuration Validation', () => {
    it('should handle zero frame rate gracefully', () => {
      expect(() => {
        new ECSAutomationManager({ targetFrameRate: 0 });
      }).not.toThrow();
    });

    it('should handle negative values gracefully', () => {
      expect(() => {
        new ECSAutomationManager({
          maxErrorsPerSecond: -1,
          healthCheckInterval: -1000,
        });
      }).not.toThrow();
    });
  });
});
