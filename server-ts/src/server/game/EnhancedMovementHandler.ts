/**
 * Enhanced Multiplayer Movement Handler
 *
 * This module provides improved movement handling for GameRoom.ts with:
 * - Client prediction support
 * - Server reconciliation
 * - Anti-cheat validation
 * - OSRS-authentic movement speeds
 * - Smooth interpolation
 */

import {
  setMovementTarget,
  setOSRSMovementSpeed,
  stopMovement,
} from '../ecs/systems/EnhancedMovementSystem';
import { forceSyncEntity } from '../ecs/systems/EnhancedNetworkSyncSystem';

interface MovementMessage {
  targetX: number;
  targetY: number;
  timestamp?: number;
  clientPredictedX?: number;
  clientPredictedY?: number;
  isRunning?: boolean;
}

interface MovementValidationConfig {
  maxDistance: number;
  rateLimit: number;
  rateLimitWindow: number;
  maxMovementHistory: number;
}

const DEFAULT_CONFIG: MovementValidationConfig = {
  maxDistance: 15, // Max tiles per move
  rateLimit: 20, // Max moves per window
  rateLimitWindow: 1000, // 1 second
  maxMovementHistory: 50,
};

export class EnhancedMovementHandler {
  private playerMovementLog = new Map<
    string,
    Array<{ timestamp: number; x: number; y: number; distance: number }>
  >();
  private config: MovementValidationConfig;

  constructor(config: Partial<MovementValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Enhanced movement message handler with client prediction and server reconciliation
   */
  handlePlayerMovement(
    gameRoom: any, // GameRoom instance
    client: any, // Colyseus client
    message: MovementMessage
  ): boolean {
    const player = gameRoom.state.players.get(client.sessionId);
    if (!player) {
      client.send('move_error', {
        message: 'Player not found.',
        code: 'PLAYER_NOT_FOUND',
      });
      return false;
    }

    const now = Date.now();
    const playerId = client.sessionId;
    const {
      targetX,
      targetY,
      timestamp,
      clientPredictedX,
      clientPredictedY,
      isRunning = false,
    } = message;

    // Initialize movement log for new players
    if (!this.playerMovementLog.has(playerId)) {
      this.playerMovementLog.set(playerId, []);
    }

    const movementHistory = this.playerMovementLog.get(playerId)!;

    // Validate message timestamp (basic anti-cheat)
    if (timestamp && (now - timestamp > 5000 || timestamp > now + 1000)) {
      client.send('move_error', {
        message: 'Invalid timestamp. Possible clock desync or cheat attempt.',
        code: 'INVALID_TIMESTAMP',
      });
      return false;
    }

    // Rate limiting check
    if (!this.checkRateLimit(movementHistory, now)) {
      client.send('move_error', {
        message: 'Movement rate limit exceeded. Please slow down.',
        code: 'RATE_LIMIT',
        rateLimitInfo: {
          maxMoves: this.config.rateLimit,
          windowMs: this.config.rateLimitWindow,
        },
      });
      return false;
    }

    // Map bounds validation
    const currentMap = gameRoom.state.maps.get(gameRoom.state.currentMapId);
    if (!currentMap) {
      client.send('move_error', {
        message: 'No active map found.',
        code: 'NO_MAP',
      });
      return false;
    }

    if (!this.isInBounds(targetX, targetY, currentMap)) {
      client.send('move_error', {
        message: 'Invalid move: out of bounds.',
        code: 'OUT_OF_BOUNDS',
        bounds: { width: currentMap.width, height: currentMap.height },
      });
      return false;
    }

    // Collision detection
    if (this.hasCollision(targetX, targetY, currentMap)) {
      client.send('move_error', {
        message: 'Invalid move: tile is blocked.',
        code: 'BLOCKED_TILE',
      });
      return false;
    }

    // Distance validation
    const distance = this.calculateDistance(player.x, player.y, targetX, targetY);
    if (distance > this.config.maxDistance) {
      client.send('move_error', {
        message: 'Invalid move: distance too far.',
        code: 'DISTANCE_TOO_FAR',
        maxDistance: this.config.maxDistance,
        attemptedDistance: distance,
      });
      return false;
    }

    // Log this movement
    movementHistory.push({
      timestamp: now,
      x: targetX,
      y: targetY,
      distance,
    });

    // Trim history
    if (movementHistory.length > this.config.maxMovementHistory) {
      movementHistory.shift();
    }

    // Get ECS integration
    const ecsIntegration = gameRoom.ecsAutomationManager.getECSIntegration();
    let entityId: number;

    try {
      entityId = ecsIntegration.syncPlayerToECS(player);
    } catch (ecsError) {
      console.warn('Failed to sync player to ECS for movement:', ecsError);
      client.send('move_error', {
        message: 'Server error during movement processing.',
        code: 'ECS_SYNC_ERROR',
      });
      return false;
    }

    // Set movement in ECS
    const ecsWorld = ecsIntegration.getWorld();
    setMovementTarget(ecsWorld, entityId, targetX, targetY);
    setOSRSMovementSpeed(ecsWorld, entityId, isRunning);

    // Client prediction reconciliation
    let predictionError = 0;
    if (clientPredictedX !== undefined && clientPredictedY !== undefined) {
      predictionError = this.calculateDistance(
        player.x,
        player.y,
        clientPredictedX,
        clientPredictedY
      );

      // If client prediction is significantly off, send correction
      if (predictionError > 0.5) {
        client.send('position_correction', {
          serverX: player.x,
          serverY: player.y,
          clientX: clientPredictedX,
          clientY: clientPredictedY,
          error: predictionError,
          timestamp: now,
        });
      }
    }

    // Send movement confirmation with enhanced data
    client.send('move_confirmed', {
      targetX,
      targetY,
      currentX: player.x,
      currentY: player.y,
      timestamp: now,
      entityId,
      movementId: `${playerId}_${now}`, // Unique movement ID for tracking
      estimatedDuration: this.calculateMovementDuration(distance, isRunning),
      isRunning,
      predictionError: predictionError > 0 ? predictionError : undefined,
    });

    // Force immediate sync for this entity to ensure all clients see the movement start
    forceSyncEntity(ecsWorld, entityId);

    console.log(
      `Player ${client.sessionId} movement: (${player.x},${player.y}) -> (${targetX},${targetY}), distance: ${distance.toFixed(2)}, running: ${isRunning}`
    );

    return true;
  }

  /**
   * Handle movement cancellation
   */
  handleMovementCancel(gameRoom: any, client: any): boolean {
    const player = gameRoom.state.players.get(client.sessionId);
    if (!player) return false;

    try {
      const ecsIntegration = gameRoom.ecsAutomationManager.getECSIntegration();
      const entityId = ecsIntegration.syncPlayerToECS(player);
      const ecsWorld = ecsIntegration.getWorld();

      stopMovement(ecsWorld, entityId);

      client.send('movement_cancelled', {
        x: player.x,
        y: player.y,
        timestamp: Date.now(),
      });

      return true;
    } catch (error) {
      console.warn('Failed to cancel movement:', error);
      return false;
    }
  }

  /**
   * Check if movement is within rate limits
   */
  private checkRateLimit(movementHistory: Array<{ timestamp: number }>, now: number): boolean {
    const recentMoves = movementHistory.filter(
      move => now - move.timestamp < this.config.rateLimitWindow
    );
    return recentMoves.length < this.config.rateLimit;
  }

  /**
   * Check if coordinates are within map bounds
   */
  private isInBounds(x: number, y: number, map: any): boolean {
    return x >= 0 && y >= 0 && x < map.width && y < map.height;
  }

  /**
   * Check if tile has collision
   */
  private hasCollision(x: number, y: number, map: any): boolean {
    if (!map.collisionMap) return false;
    const row = map.collisionMap[Math.floor(y)];
    return row && row[Math.floor(x)] === true;
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
  }

  /**
   * Calculate expected movement duration in milliseconds
   */
  private calculateMovementDuration(distance: number, isRunning: boolean): number {
    const tilesPerSecond = isRunning ? 1 / 0.3 : 1 / 0.6; // OSRS speeds
    return (distance / tilesPerSecond) * 1000;
  }

  /**
   * Get movement statistics for monitoring
   */
  getMovementStats(): {
    totalPlayers: number;
    totalMovements: number;
    averageMovementsPerPlayer: number;
    rateLimitViolations: number;
  } {
    let totalMovements = 0;
    let rateLimitViolations = 0;
    const now = Date.now();

    for (const [playerId, history] of this.playerMovementLog.entries()) {
      totalMovements += history.length;

      // Count recent rate limit violations
      const recentMoves = history.filter(
        move => now - move.timestamp < this.config.rateLimitWindow
      );
      if (recentMoves.length >= this.config.rateLimit) {
        rateLimitViolations++;
      }
    }

    return {
      totalPlayers: this.playerMovementLog.size,
      totalMovements,
      averageMovementsPerPlayer:
        this.playerMovementLog.size > 0 ? totalMovements / this.playerMovementLog.size : 0,
      rateLimitViolations,
    };
  }

  /**
   * Clean up movement logs for disconnected players
   */
  cleanupPlayer(playerId: string): void {
    this.playerMovementLog.delete(playerId);
  }

  /**
   * Get movement history for a player (for debugging)
   */
  getPlayerMovementHistory(
    playerId: string
  ): Array<{ timestamp: number; x: number; y: number; distance: number }> {
    return this.playerMovementLog.get(playerId) || [];
  }
}

// Export a singleton instance
export const movementHandler = new EnhancedMovementHandler();

// Export factory for custom configurations
export function createMovementHandler(
  config?: Partial<MovementValidationConfig>
): EnhancedMovementHandler {
  return new EnhancedMovementHandler(config);
}
