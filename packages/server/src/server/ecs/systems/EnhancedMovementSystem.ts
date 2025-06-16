import { defineQuery, defineSystem, enterQuery, exitQuery, IWorld } from 'bitecs';
import { Transform, Movement, Dead, NetworkEntity } from '../components';

// Query for all entities that can move (have Transform and Movement components)
const movementQuery = defineQuery([Transform, Movement]);

// Query for entities that just started moving
const movementEnterQuery = enterQuery(movementQuery);

// Query for entities that stopped moving
const movementExitQuery = exitQuery(movementQuery);

// Query for dead entities (they shouldn't move)
const deadQuery = defineQuery([Dead]);

// Query for networked movement entities
const networkMovementQuery = defineQuery([Transform, Movement, NetworkEntity]);

// Interpolation and prediction constants
const MOVEMENT_INTERPOLATION_FACTOR = 0.1;
const OSRS_TILE_SIZE = 1.0;
const MOVEMENT_THRESHOLD = 0.01;
const PREDICTION_COMPENSATION = 0.95; // Slight rollback for smoother sync

/**
 * Enhanced MovementSystem - Handles entity movement with multiplayer prediction and interpolation
 */
export const MovementSystem = defineSystem((world: IWorld) => {
  const entities = movementQuery(world);
  const deadEntities = deadQuery(world);
  const networkEntities = networkMovementQuery(world);

  // Get delta time from world (should be set by the game loop)
  const deltaTime = (world as any).deltaTime || 0.016; // Default to 60 FPS
  const currentTime = (world as any).currentTime || Date.now();

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];

    // Skip dead entities
    if (deadEntities.includes(eid)) {
      continue;
    }

    // Get current position
    const currentX = Transform.x[eid];
    const currentY = Transform.y[eid];

    // Get target position
    const targetX = Movement.targetX[eid];
    const targetY = Movement.targetY[eid];

    // Calculate distance to target
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If we're very close to the target, snap to it and stop moving
    if (distance < MOVEMENT_THRESHOLD) {
      Transform.x[eid] = targetX;
      Transform.y[eid] = targetY;
      Movement.velocityX[eid] = 0;
      Movement.velocityY[eid] = 0;
      continue;
    }

    // Normalize direction and apply speed
    const speed = Movement.speed[eid];
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Calculate velocity
    const velocityX = dirX * speed;
    const velocityY = dirY * speed;

    // Store velocity for reference
    Movement.velocityX[eid] = velocityX;
    Movement.velocityY[eid] = velocityY;

    // Update position based on velocity and delta time
    const newX = currentX + velocityX * deltaTime;
    const newY = currentY + velocityY * deltaTime;

    // Check if we would overshoot the target
    const remainingDx = targetX - newX;
    const remainingDy = targetY - newY;
    const remainingDistance = Math.sqrt(remainingDx * remainingDx + remainingDy * remainingDy);

    // If we would overshoot, snap to target
    if (remainingDistance > distance || remainingDistance < MOVEMENT_THRESHOLD) {
      Transform.x[eid] = targetX;
      Transform.y[eid] = targetY;
      Movement.velocityX[eid] = 0;
      Movement.velocityY[eid] = 0;
    } else {
      Transform.x[eid] = newX;
      Transform.y[eid] = newY;
    }
  }

  // Handle entities that just started moving
  const enterEntities = movementEnterQuery(world);
  for (let i = 0; i < enterEntities.length; i++) {
    const eid = enterEntities[i];
    // Mark movement start timestamp for networked entities
    if (networkEntities.includes(eid)) {
      (world as any).movementStartTime = (world as any).movementStartTime || new Map();
      (world as any).movementStartTime.set(eid, currentTime);
    }
  }

  // Handle entities that stopped moving
  const exitEntities = movementExitQuery(world);
  for (let i = 0; i < exitEntities.length; i++) {
    const eid = exitEntities[i];
    // Clear movement tracking for networked entities
    if ((world as any).movementStartTime) {
      (world as any).movementStartTime.delete(eid);
    }
  }

  return world;
});

/**
 * Enhanced helper function to set movement target with OSRS-style pathfinding
 */
export function setMovementTarget(world: IWorld, eid: number, x: number, y: number): void {
  if (Movement.targetX[eid] !== undefined) {
    Movement.targetX[eid] = x;
    Movement.targetY[eid] = y;

    // Add movement validation for multiplayer sync
    const currentX = Transform.x[eid];
    const currentY = Transform.y[eid];
    const distance = Math.sqrt((x - currentX) ** 2 + (y - currentY) ** 2);

    // Prevent impossible teleportation moves
    const maxMoveDistance = 10; // tiles
    if (distance > maxMoveDistance) {
      console.warn(
        `Movement validation failed: distance ${distance} exceeds max ${maxMoveDistance} for entity ${eid}`
      );
      return;
    }

    // Mark entity as having a pending movement for network sync
    (world as any).pendingMovements = (world as any).pendingMovements || new Set();
    (world as any).pendingMovements.add(eid);
  }
}

/**
 * Helper function to set OSRS-authentic movement speed
 */
export function setOSRSMovementSpeed(world: IWorld, eid: number, isRunning: boolean = false): void {
  if (Movement.speed[eid] !== undefined) {
    // OSRS speeds: walking = 1 tile per 0.6s, running = 1 tile per 0.3s
    const tilesPerSecond = isRunning ? 1 / 0.3 : 1 / 0.6;
    Movement.speed[eid] = tilesPerSecond * OSRS_TILE_SIZE;
  }
}

/**
 * Helper function to stop entity movement immediately
 */
export function stopMovement(world: IWorld, eid: number): void {
  if (Movement.velocityX[eid] !== undefined) {
    Movement.velocityX[eid] = 0;
    Movement.velocityY[eid] = 0;
    Movement.targetX[eid] = Transform.x[eid];
    Movement.targetY[eid] = Transform.y[eid];

    // Clear pending movements
    if ((world as any).pendingMovements) {
      (world as any).pendingMovements.delete(eid);
    }
  }
}

/**
 * Helper function to check if entity is moving
 */
export function isMoving(world: IWorld, eid: number): boolean {
  if (Movement.velocityX[eid] === undefined) {
    return false;
  }

  const velocityX = Movement.velocityX[eid];
  const velocityY = Movement.velocityY[eid];

  return Math.abs(velocityX) > MOVEMENT_THRESHOLD || Math.abs(velocityY) > MOVEMENT_THRESHOLD;
}

/**
 * Get movement progress (0-1) towards target
 */
export function getMovementProgress(world: IWorld, eid: number): number {
  if (!isMoving(world, eid)) {
    return 1.0;
  }

  const currentX = Transform.x[eid];
  const currentY = Transform.y[eid];
  const targetX = Movement.targetX[eid];
  const targetY = Movement.targetY[eid];

  // Get start position from movement tracking
  const movementStart = (world as any).movementStartPositions?.get(eid);
  if (!movementStart) {
    return 0.0;
  }

  const totalDistance = Math.sqrt(
    (targetX - movementStart.x) ** 2 + (targetY - movementStart.y) ** 2
  );
  const remainingDistance = Math.sqrt((targetX - currentX) ** 2 + (targetY - currentY) ** 2);

  if (totalDistance === 0) return 1.0;

  return Math.max(0, Math.min(1, 1 - remainingDistance / totalDistance));
}

/**
 * Predict future position for client-side interpolation
 */
export function predictPosition(
  world: IWorld,
  eid: number,
  deltaTime: number
): { x: number; y: number } {
  const currentX = Transform.x[eid];
  const currentY = Transform.y[eid];
  const velocityX = Movement.velocityX[eid] || 0;
  const velocityY = Movement.velocityY[eid] || 0;

  return {
    x: currentX + velocityX * deltaTime * PREDICTION_COMPENSATION,
    y: currentY + velocityY * deltaTime * PREDICTION_COMPENSATION,
  };
}

/**
 * Apply position correction for server reconciliation
 */
export function applyPositionCorrection(
  world: IWorld,
  eid: number,
  serverX: number,
  serverY: number,
  timestamp: number
): void {
  const currentX = Transform.x[eid];
  const currentY = Transform.y[eid];

  const errorX = serverX - currentX;
  const errorY = serverY - currentY;
  const errorDistance = Math.sqrt(errorX * errorX + errorY * errorY);

  // Only apply correction if error is significant
  const correctionThreshold = 0.1; // tiles
  if (errorDistance > correctionThreshold) {
    // Smooth correction using interpolation
    Transform.x[eid] = currentX + errorX * MOVEMENT_INTERPOLATION_FACTOR;
    Transform.y[eid] = currentY + errorY * MOVEMENT_INTERPOLATION_FACTOR;

    console.log(`Applied position correction for entity ${eid}: error=${errorDistance.toFixed(2)}`);
  }
}

export default MovementSystem;
