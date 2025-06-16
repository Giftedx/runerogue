/**
 * XPNotificationManager - Manages all XP notifications on the client
 * Handles creation, positioning, and cleanup of XP gain notifications
 */

import { XPNotification, XPNotificationConfig } from './XPNotification';

export interface XPGainEvent {
  entityId: number;
  skill: string;
  xpGained: number;
  newLevel?: number;
  position: { x: number; y: number };
  timestamp: number;
}

export class XPNotificationManager {
  private scene: Phaser.Scene;
  private notifications: Map<string, XPNotification[]> = new Map();
  private maxNotificationsPerEntity = 5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create XP notification for an entity
   */
  public createXPNotification(event: XPGainEvent): void {
    const entityKey = event.entityId.toString();

    // Get existing notifications for this entity
    const existingNotifications = this.notifications.get(entityKey) || [];

    // Clean up completed notifications
    const activeNotifications = existingNotifications.filter(notification =>
      notification.isActive()
    );

    // Limit number of notifications per entity
    while (activeNotifications.length >= this.maxNotificationsPerEntity) {
      const oldest = activeNotifications.shift();
      if (oldest) {
        oldest.destroy();
      }
    }

    // Calculate vertical offset for stacking
    const yOffset = activeNotifications.length * -30;

    // Create notification config
    const config: XPNotificationConfig = {
      x: event.position.x,
      y: event.position.y + yOffset,
      skill: event.skill,
      xpGained: event.xpGained,
      newLevel: event.newLevel,
      duration: event.newLevel ? 3000 : 2000, // Longer for level ups
    };

    // Create the notification
    const notification = new XPNotification(this.scene, config);
    activeNotifications.push(notification);

    // Update notifications map
    this.notifications.set(entityKey, activeNotifications);
  }

  /**
   * Handle XP gain events (required by CombatEventHandler)
   */
  public handleXPGainEvents(events: any[]): void {
    for (const event of events) {
      if (event.entity && event.skill && event.xpGained) {
        this.createXPNotification({
          entityId: event.entity,
          skill: event.skill,
          xpGained: event.xpGained,
          newLevel: event.newLevel,
          position: { x: event.x || 0, y: event.y || 0 },
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Update notifications for moving entities
   */
  public updateNotificationPositions(entityPositions: Map<number, { x: number; y: number }>): void {
    this.notifications.forEach((notifications, entityKey) => {
      const entityId = parseInt(entityKey);
      const position = entityPositions.get(entityId);

      if (position) {
        notifications.forEach((notification, index) => {
          if (notification.isActive()) {
            const yOffset = index * -30;
            notification.updatePosition(position.x, position.y + yOffset);
          }
        });
      }
    });
  }

  /**
   * Clean up notifications for a specific entity
   */
  public clearNotificationsForEntity(entityId: number): void {
    const entityKey = entityId.toString();
    const notifications = this.notifications.get(entityKey);

    if (notifications) {
      notifications.forEach(notification => {
        notification.destroy();
      });
      this.notifications.delete(entityKey);
    }
  }

  /**
   * Clean up all notifications
   */
  public clearAllNotifications(): void {
    this.notifications.forEach(notifications => {
      notifications.forEach(notification => {
        notification.destroy();
      });
    });
    this.notifications.clear();
  }

  /**
   * Clean up expired notifications
   */
  public cleanupExpiredNotifications(): void {
    this.notifications.forEach((notifications, entityKey) => {
      const activeNotifications = notifications.filter(notification => notification.isActive());

      if (activeNotifications.length === 0) {
        this.notifications.delete(entityKey);
      } else if (activeNotifications.length < notifications.length) {
        this.notifications.set(entityKey, activeNotifications);
      }
    });
  }

  /**
   * Get notification statistics
   */
  public getStats() {
    let totalNotifications = 0;
    this.notifications.forEach(notifications => {
      totalNotifications += notifications.length;
    });

    return {
      totalEntities: this.notifications.size,
      totalNotifications,
      maxPerEntity: this.maxNotificationsPerEntity,
    };
  }

  /**
   * Set maximum notifications per entity
   */
  public setMaxNotificationsPerEntity(max: number): void {
    this.maxNotificationsPerEntity = Math.max(1, max);
  }
}
