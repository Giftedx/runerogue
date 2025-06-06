import { defineQuery, defineSystem, enterQuery, exitQuery, IWorld } from 'bitecs';
import { Transform, Movement, Player, NPC, Dead } from '../components';

// Query for all entities that can move (have Transform and Movement components)
const movementQuery = defineQuery([Transform, Movement]);

// Query for entities that just started moving
const movementEnterQuery = enterQuery(movementQuery);

// Query for entities that stopped moving
const movementExitQuery = exitQuery(movementQuery);

// Query for dead entities (they shouldn't move)
const deadQuery = defineQuery([Dead]);

/**
 * MovementSystem - Handles entity movement and position updates
 */
export const MovementSystem = defineSystem((world: IWorld) => {
  const entities = movementQuery(world);
  const deadEntities = deadQuery(world);
  
  // Get delta time from world (should be set by the game loop)
  const deltaTime = (world as any).deltaTime || 0.016; // Default to 60 FPS
  
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
    
    // If we're close enough to the target, stop moving
    if (distance < 0.1) {
      Movement.velocityX[eid] = 0;
      Movement.velocityY[eid] = 0;
      continue;
    }
    
    // Normalize direction and apply speed
    const speed = Movement.speed[eid];
    const dirX = dx / distance;
    const dirY = dy / distance;
    
    // Set velocity
    Movement.velocityX[eid] = dirX * speed;
    Movement.velocityY[eid] = dirY * speed;
    
    // Update position based on velocity
    const velocityX = Movement.velocityX[eid];
    const velocityY = Movement.velocityY[eid];
    
    Transform.x[eid] = currentX + velocityX * deltaTime;
    Transform.y[eid] = currentY + velocityY * deltaTime;
    
    // Clamp position to prevent moving past target
    const newDx = targetX - Transform.x[eid];
    const newDy = targetY - Transform.y[eid];
    const newDistance = Math.sqrt(newDx * newDx + newDy * newDy);
    
    if (newDistance > distance) {
      Transform.x[eid] = targetX;
      Transform.y[eid] = targetY;
      Movement.velocityX[eid] = 0;
      Movement.velocityY[eid] = 0;
    }
  }
  
  // Handle entities that just started moving
  const enterEntities = movementEnterQuery(world);
  for (let i = 0; i < enterEntities.length; i++) {
    const eid = enterEntities[i];
    // Could emit movement start events here
  }
  
  // Handle entities that stopped moving
  const exitEntities = movementExitQuery(world);
  for (let i = 0; i < exitEntities.length; i++) {
    const eid = exitEntities[i];
    // Could emit movement stop events here
  }
  
  return world;
});

/**
 * Helper function to set movement target
 */
export function setMovementTarget(world: IWorld, eid: number, x: number, y: number): void {
  if (Movement.targetX[eid] !== undefined) {
    Movement.targetX[eid] = x;
    Movement.targetY[eid] = y;
  }
}

/**
 * Helper function to stop entity movement
 */
export function stopMovement(world: IWorld, eid: number): void {
  if (Movement.velocityX[eid] !== undefined) {
    Movement.velocityX[eid] = 0;
    Movement.velocityY[eid] = 0;
    Movement.targetX[eid] = Transform.x[eid];
    Movement.targetY[eid] = Transform.y[eid];
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
  
  return velocityX !== 0 || velocityY !== 0;
}