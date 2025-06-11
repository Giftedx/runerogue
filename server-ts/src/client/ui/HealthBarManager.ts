/**
 * HealthBarManager.ts
 *
 * Manages all health bars for entities in the game world.
 * Handles creation, updates, positioning, and cleanup of health bars.
 *
 * @author RuneRogue Team
 * @version 1.0.0
 */

import { HealthBar, HealthBarConfig, DEFAULT_HEALTH_BAR_CONFIG } from './HealthBar';
import { HealthBarEvent } from '../../../server/ecs/systems/HealthBarSystem';

/**
 * Configuration for the health bar manager
 */
export interface HealthBarManagerConfig {
  maxHealthBars: number; // Maximum concurrent health bars
  showPlayerHealthBars: boolean; // Show health bars for players
  showNPCHealthBars: boolean; // Show health bars for NPCs
  showMonsterHealthBars: boolean; // Show health bars for monsters
  autoHideDelay: number; // Delay before hiding full health bars (ms)
  defaultConfig: HealthBarConfig; // Default config for new health bars
}

/**
 * Default health bar manager configuration
 */
export const DEFAULT_MANAGER_CONFIG: HealthBarManagerConfig = {
  maxHealthBars: 100,
  showPlayerHealthBars: true,
  showNPCHealthBars: true,
  showMonsterHealthBars: true,
  autoHideDelay: 3000,
  defaultConfig: DEFAULT_HEALTH_BAR_CONFIG,
};

/**
 * Entity position provider interface
 */
export interface EntityPositionProvider {
  getEntityPosition(entityId: number): { x: number; y: number } | null;
  getEntityType(entityId: number): 'player' | 'npc' | 'monster' | 'unknown';
}

/**
 * HealthBarManager - Centralized management of all health bars
 *
 * Features:
 * - Automatic health bar creation and destruction
 * - Position tracking for moving entities
 * - Performance optimization with pooling
 * - Configurable visibility rules
 * - Auto-hide for full health entities
 * - Efficient updates with minimal overhead
 */
export class HealthBarManager {
  private scene: Phaser.Scene;
  private config: HealthBarManagerConfig;
  private positionProvider: EntityPositionProvider;

  // Health bar tracking
  private healthBars = new Map<number, HealthBar>();
  private lastUpdateTime: number = 0;
  private updateInterval: number = 16; // ~60 FPS updates

  // Auto-hide tracking
  private hideTimers = new Map<number, number>();

  constructor(
    scene: Phaser.Scene,
    positionProvider: EntityPositionProvider,
    config: Partial<HealthBarManagerConfig> = {}
  ) {
    this.scene = scene;
    this.positionProvider = positionProvider;
    this.config = { ...DEFAULT_MANAGER_CONFIG, ...config };
  }

  /**
   * Update health bar for an entity
   */
  public updateHealthBar(entityId: number, event: HealthBarEvent): void {
    // Check if we should show health bars for this entity type
    if (!this.shouldShowHealthBar(entityId, event)) {
      return;
    }

    let healthBar = this.healthBars.get(entityId);

    // Create health bar if it doesn't exist
    if (!healthBar) {
      const position = this.positionProvider.getEntityPosition(entityId);
      if (!position) {
        console.warn(
          `HealthBarManager: Cannot create health bar for entity ${entityId} - no position available`
        );
        return;
      }

      // Check if we've reached the maximum number of health bars
      if (this.healthBars.size >= this.config.maxHealthBars) {
        this.cleanupOldHealthBars();
      }

      healthBar = new HealthBar(
        this.scene,
        entityId,
        position.x,
        position.y,
        this.config.defaultConfig
      );
      this.healthBars.set(entityId, healthBar);
    }

    // Update health values
    healthBar.updateHealth(event.currentHealth, event.maxHealth, true);

    // Handle death
    if (event.isDead) {
      this.scheduleRemoval(entityId, 2000); // Remove after 2 seconds
      return;
    }

    // Handle auto-hide for full health
    if (event.healthPercent >= 1.0 && this.config.autoHideDelay > 0) {
      this.scheduleAutoHide(entityId);
    } else {
      this.cancelAutoHide(entityId);
      healthBar.show();
    }
  }

  /**
   * Update all health bar positions
   */
  public update(): void {
    const currentTime = Date.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return;
    }

    for (const [entityId, healthBar] of this.healthBars) {
      const position = this.positionProvider.getEntityPosition(entityId);
      if (position) {
        healthBar.updatePosition(position.x, position.y);
      } else {
        // Entity no longer exists, remove health bar
        this.removeHealthBar(entityId);
      }
    }

    this.lastUpdateTime = currentTime;
  }

  /**
   * Remove health bar for an entity
   */
  public removeHealthBar(entityId: number): void {
    const healthBar = this.healthBars.get(entityId);
    if (healthBar) {
      healthBar.destroy();
      this.healthBars.delete(entityId);
    }

    // Clean up timers
    this.cancelAutoHide(entityId);
  }

  /**
   * Check if we should show a health bar for this entity
   */
  private shouldShowHealthBar(entityId: number, event: HealthBarEvent): boolean {
    const entityType = this.positionProvider.getEntityType(entityId);

    switch (entityType) {
      case 'player':
        return this.config.showPlayerHealthBars;
      case 'npc':
        return this.config.showNPCHealthBars;
      case 'monster':
        return this.config.showMonsterHealthBars;
      default:
        return false;
    }
  }

  /**
   * Schedule auto-hide for full health entity
   */
  private scheduleAutoHide(entityId: number): void {
    this.cancelAutoHide(entityId); // Cancel existing timer

    const timer = window.setTimeout(() => {
      const healthBar = this.healthBars.get(entityId);
      if (healthBar && healthBar.getHealthPercent() >= 1.0) {
        healthBar.hide();
      }
      this.hideTimers.delete(entityId);
    }, this.config.autoHideDelay);

    this.hideTimers.set(entityId, timer);
  }

  /**
   * Cancel auto-hide timer for entity
   */
  private cancelAutoHide(entityId: number): void {
    const timer = this.hideTimers.get(entityId);
    if (timer) {
      clearTimeout(timer);
      this.hideTimers.delete(entityId);
    }
  }

  /**
   * Schedule removal of health bar after delay
   */
  private scheduleRemoval(entityId: number, delay: number): void {
    setTimeout(() => {
      this.removeHealthBar(entityId);
    }, delay);
  }

  /**
   * Clean up old or unnecessary health bars
   */
  private cleanupOldHealthBars(): void {
    // Remove health bars for entities that no longer exist
    const toRemove: number[] = [];

    for (const [entityId] of this.healthBars) {
      const position = this.positionProvider.getEntityPosition(entityId);
      if (!position) {
        toRemove.push(entityId);
      }
    }

    for (const entityId of toRemove) {
      this.removeHealthBar(entityId);
    }

    // If still too many, remove hidden health bars
    if (this.healthBars.size >= this.config.maxHealthBars) {
      for (const [entityId, healthBar] of this.healthBars) {
        if (!healthBar.isVisible()) {
          this.removeHealthBar(entityId);
          if (this.healthBars.size < this.config.maxHealthBars) break;
        }
      }
    }
  }

  /**
   * Get statistics about health bar management
   */
  public getStats(): {
    activeHealthBars: number;
    maxHealthBars: number;
    hiddenHealthBars: number;
    scheduledHides: number;
  } {
    let hiddenCount = 0;
    for (const healthBar of this.healthBars.values()) {
      if (!healthBar.isVisible()) {
        hiddenCount++;
      }
    }

    return {
      activeHealthBars: this.healthBars.size,
      maxHealthBars: this.config.maxHealthBars,
      hiddenHealthBars: hiddenCount,
      scheduledHides: this.hideTimers.size,
    };
  }

  /**
   * Show all health bars (useful for debugging)
   */
  public showAll(): void {
    for (const healthBar of this.healthBars.values()) {
      healthBar.show();
    }
  }

  /**
   * Hide all health bars
   */
  public hideAll(): void {
    for (const healthBar of this.healthBars.values()) {
      healthBar.hide();
    }
  }

  /**
   * Destroy all health bars and clean up resources
   */
  public destroy(): void {
    // Clear all timers
    for (const timer of this.hideTimers.values()) {
      clearTimeout(timer);
    }
    this.hideTimers.clear();

    // Destroy all health bars
    for (const healthBar of this.healthBars.values()) {
      healthBar.destroy();
    }
    this.healthBars.clear();
  }
}
