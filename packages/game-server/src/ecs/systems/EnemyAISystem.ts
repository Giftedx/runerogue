import { defineQuery, defineSystem } from "bitecs";
import type { CombatWorld } from "./CombatSystem";
import { Enemy, Position, Health, CombatStats } from "../components";
import { AIState, EnemyAIState } from "../components/AIState";

/**
 * ECS Enemy AI System
 * Handles enemy artificial intelligence including target acquisition,
 * pathfinding, and combat behavior.
 *
 * OSRS-inspired AI behaviors:
 * - Idle: Random movement, scanning for players
 * - Aggressive: Chase and attack players within aggro radius
 * - Combat: Actively fighting a target
 * - Fleeing: Retreating when low health (rare)
 * - Stunned: Temporarily disabled
 */

export interface EnemyAISystemOptions {
  getPlayerEntities: () => number[]; // Returns array of player entity IDs
  getPlayerPosition: (playerEid: number) => { x: number; y: number } | null;
  isPlayerAlive: (playerEid: number) => boolean;
  onEnemyTargetAcquired?: (enemyEid: number, targetEid: number) => void;
  onEnemyTargetLost?: (enemyEid: number, previousTargetEid: number) => void;
}

// Query for all enemies with AI
const enemyAIQuery = defineQuery([Enemy, Position, Health, AIState]);

// Query for player entities (would need to be defined based on player components)
// For now, we'll use the callback to get player entities

export const createEnemyAISystem = (options: EnemyAISystemOptions) => {
  return defineSystem((world: CombatWorld) => {
    const currentTime = Date.now();
    const enemies = enemyAIQuery(world);
    const playerEntities = options.getPlayerEntities();

    for (const enemyEid of enemies) {
      updateEnemyAI(world, enemyEid, currentTime, playerEntities, options);
    }

    return world;
  });
};

/**
 * Updates AI for a single enemy entity.
 */
function updateEnemyAI(
  world: CombatWorld,
  enemyEid: number,
  currentTime: number,
  playerEntities: number[],
  options: EnemyAISystemOptions
): void {
  const currentState = AIState.currentState[enemyEid] as EnemyAIState;
  const enemyX = Position.x[enemyEid];
  const enemyY = Position.y[enemyEid];
  const enemyHealth = Health.current[enemyEid];
  const enemyMaxHealth = Health.max[enemyEid];
  const isAggressive = AIState.isAggressive[enemyEid] === 1;
  const canFlee = AIState.canFlee[enemyEid] === 1;
  const fleeThreshold = AIState.fleeHealthThreshold[enemyEid];

  // Check if enemy should flee
  if (canFlee && (enemyHealth / enemyMaxHealth) * 100 <= fleeThreshold) {
    if (currentState !== EnemyAIState.Fleeing) {
      transitionToState(enemyEid, EnemyAIState.Fleeing, currentTime);
    }
    updateFleeingBehavior(
      world,
      enemyEid,
      currentTime,
      playerEntities,
      options
    );
    return;
  }

  // Check if enemy is stunned
  if (currentState === EnemyAIState.Stunned) {
    const stateExitTime = AIState.stateExitTime[enemyEid];
    if (currentTime >= stateExitTime) {
      transitionToState(enemyEid, EnemyAIState.Idle, currentTime);
    }
    return;
  }

  // Check if enemy is dead
  if (enemyHealth <= 0) {
    if (currentState !== EnemyAIState.Dead) {
      transitionToState(enemyEid, EnemyAIState.Dead, currentTime);
      Enemy.targetEid[enemyEid] = 0; // Clear target
    }
    return;
  }

  // Scan for targets if enough time has passed
  const lastScanTime = AIState.lastTargetScanTime[enemyEid];
  const scanCooldown = AIState.targetScanCooldown[enemyEid];

  if (currentTime - lastScanTime >= scanCooldown) {
    scanForTargets(world, enemyEid, currentTime, playerEntities, options);
    AIState.lastTargetScanTime[enemyEid] = currentTime;
  }

  // Update behavior based on current state
  switch (currentState) {
    case EnemyAIState.Idle:
      updateIdleBehavior(world, enemyEid, currentTime, options);
      break;

    case EnemyAIState.Aggressive:
      updateAggressiveBehavior(world, enemyEid, currentTime, options);
      break;

    case EnemyAIState.Combat:
      updateCombatBehavior(world, enemyEid, currentTime, options);
      break;

    case EnemyAIState.Fleeing:
      updateFleeingBehavior(
        world,
        enemyEid,
        currentTime,
        playerEntities,
        options
      );
      break;
  }
}

/**
 * Scans for valid targets within aggro radius.
 */
function scanForTargets(
  world: CombatWorld,
  enemyEid: number,
  currentTime: number,
  playerEntities: number[],
  options: EnemyAISystemOptions
): void {
  const enemyX = Position.x[enemyEid];
  const enemyY = Position.y[enemyEid];
  const aggroRadius = Enemy.aggroRadius[enemyEid];
  const isAggressive = AIState.isAggressive[enemyEid] === 1;
  const currentTargetEid = Enemy.targetEid[enemyEid];

  if (!isAggressive) return;

  let closestTarget = 0;
  let closestDistance = Infinity;

  for (const playerEid of playerEntities) {
    if (!options.isPlayerAlive(playerEid)) continue;

    const playerPos = options.getPlayerPosition(playerEid);
    if (!playerPos) continue;

    const distance = Math.sqrt(
      Math.pow(playerPos.x - enemyX, 2) + Math.pow(playerPos.y - enemyY, 2)
    );

    if (distance <= aggroRadius && distance < closestDistance) {
      closestTarget = playerEid;
      closestDistance = distance;
    }
  }

  // Update target if changed
  if (closestTarget !== currentTargetEid) {
    const previousTarget = currentTargetEid;
    Enemy.targetEid[enemyEid] = closestTarget;

    if (previousTarget !== 0 && options.onEnemyTargetLost) {
      options.onEnemyTargetLost(enemyEid, previousTarget);
    }

    if (closestTarget !== 0) {
      transitionToState(enemyEid, EnemyAIState.Aggressive, currentTime);
      if (options.onEnemyTargetAcquired) {
        options.onEnemyTargetAcquired(enemyEid, closestTarget);
      }
    } else if (previousTarget !== 0) {
      transitionToState(enemyEid, EnemyAIState.Idle, currentTime);
    }
  }
}

/**
 * Updates idle behavior - random wandering.
 */
function updateIdleBehavior(
  world: CombatWorld,
  enemyEid: number,
  currentTime: number,
  options: EnemyAISystemOptions
): void {
  const wanderTimer = AIState.idleWanderTimer[enemyEid];

  if (currentTime >= wanderTimer) {
    // Set new random wander target
    const currentX = Position.x[enemyEid];
    const currentY = Position.y[enemyEid];
    const wanderRadius = 100; // pixels

    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * wanderRadius;

    Enemy.pathTargetX[enemyEid] = currentX + Math.cos(angle) * distance;
    Enemy.pathTargetY[enemyEid] = currentY + Math.sin(angle) * distance;
    Enemy.isPathfinding[enemyEid] = 1;

    // Next wander in 3-6 seconds
    AIState.idleWanderTimer[enemyEid] =
      currentTime + 3000 + Math.random() * 3000;
  }

  // Move towards wander target
  if (Enemy.isPathfinding[enemyEid] === 1) {
    moveTowardsTarget(world, enemyEid, currentTime);
  }
}

/**
 * Updates aggressive behavior - chase target.
 */
function updateAggressiveBehavior(
  world: CombatWorld,
  enemyEid: number,
  currentTime: number,
  options: EnemyAISystemOptions
): void {
  const targetEid = Enemy.targetEid[enemyEid];

  if (targetEid === 0 || !options.isPlayerAlive(targetEid)) {
    transitionToState(enemyEid, EnemyAIState.Idle, currentTime);
    return;
  }

  const targetPos = options.getPlayerPosition(targetEid);
  if (!targetPos) {
    transitionToState(enemyEid, EnemyAIState.Idle, currentTime);
    return;
  }

  // Set target position for pathfinding
  Enemy.pathTargetX[enemyEid] = targetPos.x;
  Enemy.pathTargetY[enemyEid] = targetPos.y;
  Enemy.isPathfinding[enemyEid] = 1;

  // Check if in combat range
  const enemyX = Position.x[enemyEid];
  const enemyY = Position.y[enemyEid];
  const attackRange = Enemy.maxAttackRange[enemyEid];
  const dx = targetPos.x - enemyX;
  const dy = targetPos.y - enemyY;
  const distance = Math.hypot(dx, dy);

  if (distance <= attackRange) {
    transitionToState(enemyEid, EnemyAIState.Combat, currentTime);
  } else {
    moveTowardsTarget(world, enemyEid, currentTime);
  }
}

/**
 * Updates combat behavior - attack target.
 */
function updateCombatBehavior(
  world: CombatWorld,
  enemyEid: number,
  currentTime: number,
  options: EnemyAISystemOptions
): void {
  const targetEid = Enemy.targetEid[enemyEid];

  if (targetEid === 0 || !options.isPlayerAlive(targetEid)) {
    transitionToState(enemyEid, EnemyAIState.Idle, currentTime);
    return;
  }

  const targetPos = options.getPlayerPosition(targetEid);
  if (!targetPos) {
    transitionToState(enemyEid, EnemyAIState.Idle, currentTime);
    return;
  }

  const enemyX = Position.x[enemyEid];
  const enemyY = Position.y[enemyEid];
  const attackRange = Enemy.maxAttackRange[enemyEid];
  const dx = targetPos.x - enemyX;
  const dy = targetPos.y - enemyY;
  const distance = Math.hypot(dx, dy);

  if (distance > attackRange) {
    // Target moved out of range, chase again
    transitionToState(enemyEid, EnemyAIState.Aggressive, currentTime);
    return;
  }

  // Check if ready to attack
  const lastAttackTime = Enemy.lastAttackTime[enemyEid];
  const attackSpeed = Enemy.attackSpeed[enemyEid] * 600; // Convert ticks to ms

  if (currentTime - lastAttackTime >= attackSpeed) {
    // Perform attack (this would trigger combat system)
    Enemy.lastAttackTime[enemyEid] = currentTime;
    // The actual damage calculation would be handled by the CombatSystem
  }
}

/**
 * Updates fleeing behavior - run away from players.
 */
function updateFleeingBehavior(
  world: CombatWorld,
  enemyEid: number,
  currentTime: number,
  playerEntities: number[],
  options: EnemyAISystemOptions
): void {
  const enemyX = Position.x[enemyEid];
  const enemyY = Position.y[enemyEid];

  // Find direction away from closest player
  let closestPlayerX = enemyX;
  let closestPlayerY = enemyY;
  let closestDistance = Infinity;

  for (const playerEid of playerEntities) {
    if (!options.isPlayerAlive(playerEid)) continue;

    const playerPos = options.getPlayerPosition(playerEid);
    if (!playerPos) continue;

    const distance = Math.sqrt(
      Math.pow(playerPos.x - enemyX, 2) + Math.pow(playerPos.y - enemyY, 2)
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestPlayerX = playerPos.x;
      closestPlayerY = playerPos.y;
    }
  }

  // Move away from closest player
  if (closestDistance < Infinity) {
    const fleeDistance = 200; // pixels
    const deltaX = enemyX - closestPlayerX;
    const deltaY = enemyY - closestPlayerY;
    const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (length > 0) {
      const normalizedX = deltaX / length;
      const normalizedY = deltaY / length;

      Enemy.pathTargetX[enemyEid] = enemyX + normalizedX * fleeDistance;
      Enemy.pathTargetY[enemyEid] = enemyY + normalizedY * fleeDistance;
      Enemy.isPathfinding[enemyEid] = 1;
    }
  }

  moveTowardsTarget(world, enemyEid, currentTime);
}

/**
 * Moves enemy towards its current path target.
 */
function moveTowardsTarget(
  world: CombatWorld,
  enemyEid: number,
  currentTime: number
): void {
  const currentX = Position.x[enemyEid];
  const currentY = Position.y[enemyEid];
  const targetX = Enemy.pathTargetX[enemyEid];
  const targetY = Enemy.pathTargetY[enemyEid];
  const moveSpeed = Enemy.moveSpeed[enemyEid];
  const lastMoveTime = Enemy.lastMoveTime[enemyEid];

  const deltaTime = Math.min(currentTime - lastMoveTime, 100); // Cap at 100ms for stability
  if (deltaTime <= 0) return;

  const deltaX = targetX - currentX;
  const deltaY = targetY - currentY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  if (distance < 5) {
    // Reached target
    Enemy.isPathfinding[enemyEid] = 0;
    Position.x[enemyEid] = targetX;
    Position.y[enemyEid] = targetY;
  } else {
    // Move towards target
    const normalizedX = deltaX / distance;
    const normalizedY = deltaY / distance;
    const moveDistance = (moveSpeed * deltaTime) / 1000; // pixels per second

    Position.x[enemyEid] = currentX + normalizedX * moveDistance;
    Position.y[enemyEid] = currentY + normalizedY * moveDistance;
  }

  Enemy.lastMoveTime[enemyEid] = currentTime;
}

/**
 * Transitions enemy to a new AI state.
 */
function transitionToState(
  enemyEid: number,
  newState: EnemyAIState,
  currentTime: number
): void {
  const oldState = AIState.currentState[enemyEid];

  if (oldState === newState) return;

  AIState.currentState[enemyEid] = newState;
  AIState.stateEnterTime[enemyEid] = currentTime;
  AIState.stateExitTime[enemyEid] = 0; // Clear exit time unless set by specific states

  // State-specific initialization
  switch (newState) {
    case EnemyAIState.Idle:
      Enemy.targetEid[enemyEid] = 0;
      Enemy.isPathfinding[enemyEid] = 0;
      break;

    case EnemyAIState.Stunned:
      Enemy.isPathfinding[enemyEid] = 0;
      // Exit time would be set by whatever caused the stun
      break;

    case EnemyAIState.Dead:
      Enemy.targetEid[enemyEid] = 0;
      Enemy.isPathfinding[enemyEid] = 0;
      break;
  }
}
