import { defineQuery, defineSystem, IWorld } from 'bitecs';
import { Transform, Player, Health, NetworkEntity } from '../components';

/**
 * NetworkSyncSystem - Handles real-time synchronization of ECS changes to multiplayer clients
 *
 * This system:
 * - Detects position, health, and other state changes in ECS components
 * - Triggers broadcasts to all connected clients
 * - Ensures smooth multiplayer synchronization
 * - Optimizes network traffic by only sending changed data
 */

// Query for all networked entities (players and NPCs that need sync)
const networkQuery = defineQuery([Transform, NetworkEntity]);
const playerQuery = defineQuery([Player, Transform]);

// Track previous states for change detection
const previousPositions = new Map<number, { x: number; y: number }>();
const previousHealth = new Map<number, { current: number; max: number }>();

// Network sync configuration
const POSITION_SYNC_THRESHOLD = 0.01; // Only sync if position changed by more than this
const SYNC_RATE_LIMIT = 50; // Max 20 TPS for network sync (50ms minimum interval)

let lastSyncTime = 0;

/**
 * NetworkSyncSystem - Detects ECS state changes and triggers network broadcasts
 */
export const NetworkSyncSystem = defineSystem((world: IWorld) => {
  const currentTime = Date.now();

  // Rate limit network sync to prevent overwhelming clients
  if (currentTime - lastSyncTime < SYNC_RATE_LIMIT) {
    return world;
  }

  const players = playerQuery(world);
  const networkBroadcaster = (world as any).networkBroadcaster;

  if (!networkBroadcaster || typeof networkBroadcaster !== 'function') {
    // No broadcaster available - skip sync
    return world;
  }

  // Track changes to broadcast
  const positionUpdates: Array<{
    entityId: number;
    playerId?: string;
    x: number;
    y: number;
    timestamp: number;
  }> = [];

  const healthUpdates: Array<{
    entityId: number;
    playerId?: string;
    health: number;
    maxHealth: number;
  }> = [];

  // Check for position changes in all networked entities
  for (let i = 0; i < players.length; i++) {
    const eid = players[i];

    const currentX = Transform.x[eid];
    const currentY = Transform.y[eid];

    // Get previous position
    const previousPos = previousPositions.get(eid);

    // Check if position changed significantly
    if (
      !previousPos ||
      Math.abs(currentX - previousPos.x) > POSITION_SYNC_THRESHOLD ||
      Math.abs(currentY - previousPos.y) > POSITION_SYNC_THRESHOLD
    ) {
      // Position changed - prepare for broadcast
      positionUpdates.push({
        entityId: eid,
        x: currentX,
        y: currentY,
        timestamp: currentTime,
      });

      // Update tracked position
      previousPositions.set(eid, { x: currentX, y: currentY });
    }

    // Check for health changes
    if (Health.current[eid] !== undefined) {
      const currentHealth = Health.current[eid];
      const currentMaxHealth = Health.max[eid];
      const previousHealthData = previousHealth.get(eid);

      if (
        !previousHealthData ||
        currentHealth !== previousHealthData.current ||
        currentMaxHealth !== previousHealthData.max
      ) {
        healthUpdates.push({
          entityId: eid,
          health: currentHealth,
          maxHealth: currentMaxHealth,
        });

        previousHealth.set(eid, { current: currentHealth, max: currentMaxHealth });
      }
    }
  }

  // Broadcast position updates if any
  if (positionUpdates.length > 0) {
    networkBroadcaster('position_sync', {
      updates: positionUpdates,
      timestamp: currentTime,
    });
  }

  // Broadcast health updates if any
  if (healthUpdates.length > 0) {
    networkBroadcaster('health_sync', {
      updates: healthUpdates,
    });
  }

  lastSyncTime = currentTime;
  return world;
});

/**
 * Helper function to register a network broadcaster
 */
export function setNetworkBroadcaster(
  world: IWorld,
  broadcaster: (type: string, data: any) => void
): void {
  (world as any).networkBroadcaster = broadcaster;
}

/**
 * Helper function to clear position tracking (useful for disconnected players)
 */
export function clearEntityTracking(entityId: number): void {
  previousPositions.delete(entityId);
  previousHealth.delete(entityId);
}

/**
 * Get sync statistics for debugging
 */
export function getSyncStats(): {
  trackedPositions: number;
  trackedHealth: number;
  lastSyncTime: number;
} {
  return {
    trackedPositions: previousPositions.size,
    trackedHealth: previousHealth.size,
    lastSyncTime,
  };
}
