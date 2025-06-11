import { defineQuery, defineSystem, IWorld } from 'bitecs';
import { Transform, Player, Health, NetworkEntity, Movement } from '../components';

/**
 * Enhanced NetworkSyncSystem - Real-time multiplayer synchronization with prediction and reconciliation
 *
 * Features:
 * - Delta compression (only send changes)
 * - Client prediction support
 * - Server reconciliation
 * - Movement interpolation data
 * - Lag compensation
 * - Priority-based updates
 */

// Queries
const networkQuery = defineQuery([Transform, NetworkEntity]);
const playerQuery = defineQuery([Player, Transform]);
const movingEntitiesQuery = defineQuery([Transform, Movement, NetworkEntity]);

// State tracking for change detection
const previousPositions = new Map<number, { x: number; y: number; timestamp: number }>();
const previousHealth = new Map<number, { current: number; max: number }>();
const previousMovementTargets = new Map<
  number,
  { targetX: number; targetY: number; timestamp: number }
>();

// Network configuration
const POSITION_SYNC_THRESHOLD = 0.01; // Only sync if position changed by more than this
const HIGH_PRIORITY_SYNC_RATE = 20; // 50ms for moving entities (20 TPS)
const NORMAL_SYNC_RATE = 100; // 100ms for stationary entities (10 TPS)
const MOVEMENT_PREDICTION_TIME = 100; // ms ahead to predict
const MAX_POSITION_HISTORY = 10; // Keep position history for reconciliation

let lastHighPrioritySync = 0;
let lastNormalSync = 0;

// Position history for lag compensation
const positionHistory = new Map<
  number,
  Array<{
    x: number;
    y: number;
    timestamp: number;
    velocityX: number;
    velocityY: number;
  }>
>();

/**
 * Enhanced NetworkSyncSystem with prediction and reconciliation support
 */
export const EnhancedNetworkSyncSystem = defineSystem((world: IWorld) => {
  const currentTime = Date.now();
  const networkBroadcaster = (world as any).networkBroadcaster;

  if (!networkBroadcaster || typeof networkBroadcaster !== 'function') {
    return world;
  }

  // Rate limiting based on entity priority
  const shouldSyncHighPriority = currentTime - lastHighPrioritySync >= HIGH_PRIORITY_SYNC_RATE;
  const shouldSyncNormal = currentTime - lastNormalSync >= NORMAL_SYNC_RATE;

  if (!shouldSyncHighPriority && !shouldSyncNormal) {
    return world;
  }

  const players = playerQuery(world);
  const movingEntities = movingEntitiesQuery(world);

  // Collect updates
  const positionUpdates: Array<{
    entityId: number;
    playerId?: string;
    x: number;
    y: number;
    targetX?: number;
    targetY?: number;
    velocityX?: number;
    velocityY?: number;
    timestamp: number;
    priority: 'high' | 'normal';
    movementData?: {
      isMoving: boolean;
      speed: number;
      progress: number;
      estimatedArrival: number;
    };
  }> = [];

  const healthUpdates: Array<{
    entityId: number;
    playerId?: string;
    health: number;
    maxHealth: number;
    timestamp: number;
  }> = [];

  // Check high-priority entities (moving players)
  if (shouldSyncHighPriority) {
    for (let i = 0; i < movingEntities.length; i++) {
      const eid = movingEntities[i];

      if (!players.includes(eid)) continue; // Only sync moving players at high priority

      const currentX = Transform.x[eid];
      const currentY = Transform.y[eid];
      const targetX = Movement.targetX[eid];
      const targetY = Movement.targetY[eid];
      const velocityX = Movement.velocityX[eid] || 0;
      const velocityY = Movement.velocityY[eid] || 0;
      const speed = Movement.speed[eid] || 0;

      // Check if position changed significantly
      const previousPos = previousPositions.get(eid);
      const positionChanged =
        !previousPos ||
        Math.abs(currentX - previousPos.x) > POSITION_SYNC_THRESHOLD ||
        Math.abs(currentY - previousPos.y) > POSITION_SYNC_THRESHOLD;

      // Check if movement target changed
      const previousTarget = previousMovementTargets.get(eid);
      const targetChanged =
        !previousTarget ||
        Math.abs(targetX - previousTarget.targetX) > POSITION_SYNC_THRESHOLD ||
        Math.abs(targetY - previousTarget.targetY) > POSITION_SYNC_THRESHOLD;

      if (positionChanged || targetChanged) {
        // Update position history for lag compensation
        updatePositionHistory(eid, currentX, currentY, currentTime, velocityX, velocityY);

        // Calculate movement progress and ETA
        const distanceToTarget = Math.sqrt((targetX - currentX) ** 2 + (targetY - currentY) ** 2);
        const progress =
          distanceToTarget > 0.01 ? Math.max(0, Math.min(1, 1 - distanceToTarget / 5)) : 1; // Assume max 5 tile moves
        const estimatedArrival =
          speed > 0 ? currentTime + (distanceToTarget / speed) * 1000 : currentTime;

        positionUpdates.push({
          entityId: eid,
          x: currentX,
          y: currentY,
          targetX,
          targetY,
          velocityX,
          velocityY,
          timestamp: currentTime,
          priority: 'high',
          movementData: {
            isMoving: velocityX !== 0 || velocityY !== 0,
            speed,
            progress,
            estimatedArrival,
          },
        });

        // Update tracking
        previousPositions.set(eid, { x: currentX, y: currentY, timestamp: currentTime });
        previousMovementTargets.set(eid, { targetX, targetY, timestamp: currentTime });
      }
    }

    lastHighPrioritySync = currentTime;
  }

  // Check normal priority entities (all players, including stationary)
  if (shouldSyncNormal) {
    for (let i = 0; i < players.length; i++) {
      const eid = players[i];

      // Skip if already processed as high priority
      if (movingEntities.includes(eid)) continue;

      const currentX = Transform.x[eid];
      const currentY = Transform.y[eid];

      // Check for position changes (for stationary entities, this is rare)
      const previousPos = previousPositions.get(eid);
      const positionChanged =
        !previousPos ||
        Math.abs(currentX - previousPos.x) > POSITION_SYNC_THRESHOLD ||
        Math.abs(currentY - previousPos.y) > POSITION_SYNC_THRESHOLD;

      if (positionChanged) {
        positionUpdates.push({
          entityId: eid,
          x: currentX,
          y: currentY,
          timestamp: currentTime,
          priority: 'normal',
        });

        previousPositions.set(eid, { x: currentX, y: currentY, timestamp: currentTime });
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
            timestamp: currentTime,
          });

          previousHealth.set(eid, { current: currentHealth, max: currentMaxHealth });
        }
      }
    }

    lastNormalSync = currentTime;
  }

  // Broadcast updates with priority separation
  if (positionUpdates.length > 0) {
    const highPriorityUpdates = positionUpdates.filter(u => u.priority === 'high');
    const normalPriorityUpdates = positionUpdates.filter(u => u.priority === 'normal');

    // Send high priority updates immediately
    if (highPriorityUpdates.length > 0) {
      networkBroadcaster('position_sync_realtime', {
        updates: highPriorityUpdates,
        timestamp: currentTime,
        type: 'movement',
      });
    }

    // Send normal updates
    if (normalPriorityUpdates.length > 0) {
      networkBroadcaster('position_sync', {
        updates: normalPriorityUpdates,
        timestamp: currentTime,
        type: 'state',
      });
    }
  }

  // Broadcast health updates
  if (healthUpdates.length > 0) {
    networkBroadcaster('health_sync', {
      updates: healthUpdates,
      timestamp: currentTime,
    });
  }

  return world;
});

/**
 * Update position history for lag compensation
 */
function updatePositionHistory(
  entityId: number,
  x: number,
  y: number,
  timestamp: number,
  velocityX: number,
  velocityY: number
): void {
  if (!positionHistory.has(entityId)) {
    positionHistory.set(entityId, []);
  }

  const history = positionHistory.get(entityId)!;
  history.push({ x, y, timestamp, velocityX, velocityY });

  // Keep only recent history
  if (history.length > MAX_POSITION_HISTORY) {
    history.shift();
  }
}

/**
 * Get historical position for lag compensation
 */
export function getHistoricalPosition(
  entityId: number,
  timestamp: number
): { x: number; y: number } | null {
  const history = positionHistory.get(entityId);
  if (!history || history.length === 0) {
    return null;
  }

  // Find the closest historical position
  let closestEntry = history[0];
  let minTimeDiff = Math.abs(timestamp - closestEntry.timestamp);

  for (const entry of history) {
    const timeDiff = Math.abs(timestamp - entry.timestamp);
    if (timeDiff < minTimeDiff) {
      minTimeDiff = timeDiff;
      closestEntry = entry;
    }
  }

  return { x: closestEntry.x, y: closestEntry.y };
}

/**
 * Predict entity position based on current state
 */
export function predictEntityPosition(
  entityId: number,
  futureTime: number
): { x: number; y: number } | null {
  const history = positionHistory.get(entityId);
  if (!history || history.length === 0) {
    return null;
  }

  const latestEntry = history[history.length - 1];
  const deltaTime = (futureTime - latestEntry.timestamp) / 1000; // Convert to seconds

  return {
    x: latestEntry.x + latestEntry.velocityX * deltaTime,
    y: latestEntry.y + latestEntry.velocityY * deltaTime,
  };
}

/**
 * Enhanced helper function to register a network broadcaster
 */
export function setNetworkBroadcaster(
  world: IWorld,
  broadcaster: (type: string, data: any) => void
): void {
  (world as any).networkBroadcaster = broadcaster;
}

/**
 * Clear tracking data for disconnected entity
 */
export function clearEntityTracking(entityId: number): void {
  previousPositions.delete(entityId);
  previousHealth.delete(entityId);
  previousMovementTargets.delete(entityId);
  positionHistory.delete(entityId);
}

/**
 * Get comprehensive sync statistics
 */
export function getSyncStats(): {
  trackedPositions: number;
  trackedHealth: number;
  trackedMovements: number;
  positionHistorySize: number;
  lastHighPrioritySync: number;
  lastNormalSync: number;
} {
  return {
    trackedPositions: previousPositions.size,
    trackedHealth: previousHealth.size,
    trackedMovements: previousMovementTargets.size,
    positionHistorySize: Array.from(positionHistory.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    ),
    lastHighPrioritySync,
    lastNormalSync,
  };
}

/**
 * Force immediate sync for specific entity (useful for important events)
 */
export function forceSyncEntity(world: IWorld, entityId: number): void {
  const networkBroadcaster = (world as any).networkBroadcaster;
  if (!networkBroadcaster) return;

  const currentTime = Date.now();
  const x = Transform.x[entityId];
  const y = Transform.y[entityId];

  if (x !== undefined && y !== undefined) {
    networkBroadcaster('position_sync_force', {
      updates: [
        {
          entityId,
          x,
          y,
          timestamp: currentTime,
          priority: 'immediate',
        },
      ],
      timestamp: currentTime,
    });

    // Update tracking
    previousPositions.set(entityId, { x, y, timestamp: currentTime });
  }
}

export default EnhancedNetworkSyncSystem;
