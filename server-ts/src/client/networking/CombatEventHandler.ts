/**
 * CombatEventHandler.ts
 *
 * Handles incoming combat events from the server and coordinates visual feedback.
 * Manages health bar updates, damage numbers, and XP notifications on the client side.
 *
 * @author RuneRogue Team
 * @version 1.0.0
 */

import { DamageNumberEvent } from '../../types/ecs-events.js';
import { HealthBarEvent } from '../../types/ecs-events.js';
import { XPGainEvent as ServerXPGainEvent } from '../../types/ecs-events.js';
import { XPNotificationManager } from '../ui/XPNotificationManager.js';

/**
 * Interface for XP gain events (client-side)
 */
export interface ClientXPGainEvent {
  skill: string;
  amount: number;
  newLevel?: number;
  position?: { x: number; y: number };
  timestamp: number;
}

/**
 * Interface for visual effect managers
 */
interface VisualManagers {
  healthBarManager?: HealthBarManager;
  damageNumberManager?: DamageNumberManager;
  xpNotificationManager?: IXPNotificationManager;
}

/**
 * Health bar manager interface
 */
interface HealthBarManager {
  updateHealthBar(entityId: number, event: HealthBarEvent): void;
  removeHealthBar(entityId: number): void;
}

/**
 * Damage number manager interface
 */
interface DamageNumberManager {
  showDamageNumber(event: DamageNumberEvent): void;
  cleanupOldNumbers(): void;
}

/**
 * XP notification manager interface
 */
interface IXPNotificationManager {
  showXPGain(event: ClientXPGainEvent): void;
  handleXPGainEvents(events: any[]): void;
  cleanup(): void;
}

/**
 * CombatEventHandler - Coordinates visual feedback for combat events
 *
 * Features:
 * - Processes server-side health bar updates
 * - Displays floating damage numbers with appropriate styling
 * - Shows XP gain notifications
 * - Manages visual element lifecycle and cleanup
 * - Provides centralized event coordination for combat UI
 */
export class CombatEventHandler {
  private visualManagers: VisualManagers = {};
  private eventQueue: Array<{
    type: string;
    data: any;
    timestamp: number;
  }> = [];

  // Cleanup intervals
  private cleanupInterval: number | null = null;
  private readonly CLEANUP_INTERVAL = 5000; // Clean up every 5 seconds

  constructor() {
    this.startCleanupLoop();
  }

  /**
   * Register visual managers for different types of feedback
   */
  public registerHealthBarManager(manager: HealthBarManager): void {
    this.visualManagers.healthBarManager = manager;
  }

  public registerDamageNumberManager(manager: DamageNumberManager): void {
    this.visualManagers.damageNumberManager = manager;
  }

  public registerXPNotificationManager(manager: IXPNotificationManager): void {
    this.visualManagers.xpNotificationManager = manager;
  }

  /**
   * Handle health bar update events from server
   */
  public handleHealthBarUpdate(data: { events: HealthBarEvent[] }): void {
    if (!this.visualManagers.healthBarManager) {
      console.warn('CombatEventHandler: No health bar manager registered');
      return;
    }

    for (const event of data.events) {
      this.visualManagers.healthBarManager.updateHealthBar(event.entityId, event);

      // Queue for cleanup if entity died
      if (event.isDead) {
        this.queueEntityCleanup(event.entityId, 2000); // Clean up after 2 seconds
      }
    }
  }

  /**
   * Handle damage number events from server
   */
  public handleDamageNumbers(data: { events: DamageNumberEvent[] }): void {
    if (!this.visualManagers.damageNumberManager) {
      console.warn('CombatEventHandler: No damage number manager registered');
      return;
    }

    for (const event of data.events) {
      this.visualManagers.damageNumberManager.showDamageNumber(event);
    }
  }

  /**
   * Handle XP gain events
   */
  public handleXPGain(data: { events: ServerXPGainEvent[] } | ServerXPGainEvent): void {
    if (!this.visualManagers.xpNotificationManager) {
      console.warn('CombatEventHandler: No XP notification manager registered');
      return;
    }

    // Handle both single events and event arrays
    const events = Array.isArray((data as any).events) ? (data as any).events : [data];

    // Convert server events to client events and handle them
    this.visualManagers.xpNotificationManager.handleXPGainEvents(events);
  }

  /**
   * Queue an entity for cleanup after a delay
   */
  private queueEntityCleanup(entityId: number, delay: number): void {
    setTimeout(() => {
      if (this.visualManagers.healthBarManager) {
        this.visualManagers.healthBarManager.removeHealthBar(entityId);
      }
    }, delay);
  }

  /**
   * Start the cleanup loop for old visual elements
   */
  private startCleanupLoop(): void {
    this.cleanupInterval = window.setInterval(() => {
      if (this.visualManagers.damageNumberManager) {
        this.visualManagers.damageNumberManager.cleanupOldNumbers();
      }

      if (this.visualManagers.xpNotificationManager) {
        this.visualManagers.xpNotificationManager.cleanup();
      }
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop the cleanup loop and cleanup resources
   */
  public destroy(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.eventQueue = [];
    this.visualManagers = {};
  }

  /**
   * Get statistics about event handling
   */
  public getStats(): {
    queuedEvents: number;
    hasHealthBarManager: boolean;
    hasDamageNumberManager: boolean;
    hasXPManager: boolean;
  } {
    return {
      queuedEvents: this.eventQueue.length,
      hasHealthBarManager: !!this.visualManagers.healthBarManager,
      hasDamageNumberManager: !!this.visualManagers.damageNumberManager,
      hasXPManager: !!this.visualManagers.xpNotificationManager,
    };
  }
}
