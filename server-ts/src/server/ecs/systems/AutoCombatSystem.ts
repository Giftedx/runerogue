import { defineQuery, defineSystem, hasComponent, IWorld } from 'bitecs';
import { Transform, Health, CombatStats, Player, NPC, Monster, Skills } from '../components';
import {
  calculateMaxHit,
  calculateAccuracy,
} from '../../../../../packages/osrs-data/src/calculators/combat';
import { queueDamageEvent, queueHealEvent } from './DamageNumberSystem';

// Queries for auto-combat system
const playerQuery = defineQuery([Player, Transform, Health, CombatStats, Skills]);
const enemyQuery = defineQuery([Monster, Transform, Health, CombatStats]);
const npcQuery = defineQuery([NPC, Transform, Health, CombatStats]);

// Combat state tracking
const lastAttackTime = new Map<number, number>();
const combatTargets = new Map<number, number>();

// OSRS combat timing (600ms per tick)
const OSRS_TICK_TIME = 600;
const PLAYER_ATTACK_SPEED = 4; // 4 ticks = 2.4 seconds
const ENEMY_ATTACK_SPEED = 5; // 5 ticks = 3.0 seconds

/**
 * Combat event interface for network broadcasting
 */
interface CombatEvent {
  type: 'damage' | 'miss' | 'death' | 'xp_gain';
  attackerId: number;
  targetId: number;
  damage: number;
  timestamp: number;
}

/**
 * Extended world interface with network broadcaster
 */
interface WorldWithBroadcaster extends IWorld {
  networkBroadcaster?: (type: string, data: CombatEvent) => void;
}

/**
 * AutoCombatSystem - Handles automatic combat targeting and AI
 *
 * Features:
 * - Players automatically target nearest enemies within range
 * - Enemies intelligently target closest players
 * - OSRS-authentic combat timing and damage calculations
 * - Proper aggression ranges and combat engagement
 */
export const AutoCombatSystem = defineSystem((world: IWorld) => {
  const currentTime = Date.now();
  const players = playerQuery(world);
  const enemies = enemyQuery(world);
  const npcs = npcQuery(world);

  // Combine all hostile entities (both monsters and aggressive NPCs)
  const allEnemies = [...enemies, ...npcs.filter(npcId => isAggressive(world, npcId))];

  // Process player auto-targeting
  for (let i = 0; i < players.length; i++) {
    const playerId = players[i];

    // Skip dead players
    if (Health.current[playerId] <= 0) continue;

    // Check if player is already in combat
    const existingTarget = combatTargets.get(playerId);
    if (existingTarget && Health.current[existingTarget] > 0) {
      // Continue attacking current target if still alive and in range
      if (isInRange(world, playerId, existingTarget, getAttackRange(world, playerId))) {
        attemptAttack(world, playerId, existingTarget, currentTime);
        continue;
      } else {
        // Target out of range, find new target
        combatTargets.delete(playerId);
      }
    }

    // Find nearest enemy to attack
    const nearestEnemy = findNearestEnemy(world, playerId, allEnemies);
    if (nearestEnemy !== null) {
      combatTargets.set(playerId, nearestEnemy);
      attemptAttack(world, playerId, nearestEnemy, currentTime);
    }
  }

  // Process enemy AI targeting
  for (let i = 0; i < allEnemies.length; i++) {
    const enemyId = allEnemies[i];

    // Skip dead enemies
    if (Health.current[enemyId] <= 0) continue;

    // Check if enemy is already targeting someone
    const existingTarget = combatTargets.get(enemyId);
    if (existingTarget && Health.current[existingTarget] > 0) {
      // Continue attacking current target if in range
      if (isInRange(world, enemyId, existingTarget, getAggroRange(world, enemyId))) {
        attemptAttack(world, enemyId, existingTarget, currentTime);
        continue;
      } else {
        // Target out of range, find new target
        combatTargets.delete(enemyId);
      }
    }

    // Find nearest player to attack
    const nearestPlayer = findNearestPlayer(world, enemyId, players);
    if (nearestPlayer !== null) {
      combatTargets.set(enemyId, nearestPlayer);
      attemptAttack(world, enemyId, nearestPlayer, currentTime);
    }
  }

  return world;
});

/**
 * Find the nearest enemy within attack range for a player
 */
function findNearestEnemy(world: IWorld, playerId: number, enemies: number[]): number | null {
  const playerX = Transform.x[playerId];
  const playerY = Transform.y[playerId];
  const attackRange = getAttackRange(world, playerId);

  let nearestEnemy = null;
  let nearestDistance = Infinity;

  for (let i = 0; i < enemies.length; i++) {
    const enemyId = enemies[i];

    // Skip dead enemies
    if (Health.current[enemyId] <= 0) continue;

    const distance = calculateDistance(
      playerX,
      playerY,
      Transform.x[enemyId],
      Transform.y[enemyId]
    );

    if (distance <= attackRange && distance < nearestDistance) {
      nearestDistance = distance;
      nearestEnemy = enemyId;
    }
  }

  return nearestEnemy;
}

/**
 * Find the nearest player within aggro range for an enemy
 */
function findNearestPlayer(world: IWorld, enemyId: number, players: number[]): number | null {
  const enemyX = Transform.x[enemyId];
  const enemyY = Transform.y[enemyId];
  const aggroRange = getAggroRange(world, enemyId);

  let nearestPlayer = null;
  let nearestDistance = Infinity;

  for (let i = 0; i < players.length; i++) {
    const playerId = players[i];

    // Skip dead players
    if (Health.current[playerId] <= 0) continue;

    const distance = calculateDistance(
      enemyX,
      enemyY,
      Transform.x[playerId],
      Transform.y[playerId]
    );

    if (distance <= aggroRange && distance < nearestDistance) {
      nearestDistance = distance;
      nearestPlayer = playerId;
    }
  }

  return nearestPlayer;
}

/**
 * Attempt to perform an attack if enough time has passed
 */
function attemptAttack(
  world: IWorld,
  attackerId: number,
  targetId: number,
  currentTime: number
): void {
  const lastAttack = lastAttackTime.get(attackerId) || 0;
  const attackSpeed = hasComponent(world, Player, attackerId)
    ? PLAYER_ATTACK_SPEED * OSRS_TICK_TIME
    : ENEMY_ATTACK_SPEED * OSRS_TICK_TIME;

  if (currentTime - lastAttack >= attackSpeed) {
    performAttack(world, attackerId, targetId);
    lastAttackTime.set(attackerId, currentTime);
  }
}

/**
 * Perform an attack using OSRS combat formulas
 */
function performAttack(world: IWorld, attackerId: number, targetId: number): void {
  // Convert ECS component data to OSRS format for calculations
  const attackerStats = {
    attack: CombatStats.attack[attackerId],
    strength: CombatStats.strength[attackerId],
    defence: CombatStats.defence[attackerId],
    hitpoints: Health.max[attackerId],
    prayer: 1, // Will be enhanced when prayer is implemented
  };

  const defenderStats = {
    attack: CombatStats.attack[targetId],
    strength: CombatStats.strength[targetId],
    defence: CombatStats.defence[targetId],
    hitpoints: Health.max[targetId],
    prayer: 1,
  };

  const attackerEquipment = {
    attackBonus: CombatStats.attackBonus[attackerId] || 0,
    strengthBonus: CombatStats.strengthBonus[attackerId] || 0,
    defenceBonus: CombatStats.defenceBonus[attackerId] || 0,
  };

  const defenderEquipment = {
    attackBonus: CombatStats.attackBonus[targetId] || 0,
    strengthBonus: CombatStats.strengthBonus[targetId] || 0,
    defenceBonus: CombatStats.defenceBonus[targetId] || 0,
  };

  // Calculate max hit and accuracy using OSRS formulas
  const maxHit = calculateMaxHit(attackerStats, attackerEquipment);
  const hitChance = calculateAccuracy(
    attackerStats,
    attackerEquipment,
    defenderStats,
    defenderEquipment
  );

  // Roll for hit
  const hitRoll = Math.random();
  const isCritical = Math.random() < 0.1; // 10% critical hit chance

  if (hitRoll < hitChance) {
    // Hit - calculate damage
    let damage = Math.floor(Math.random() * (maxHit + 1));

    // Apply critical hit multiplier
    if (isCritical) {
      damage = Math.floor(damage * 1.5);
    }

    // Apply damage
    Health.current[targetId] = Math.max(0, Health.current[targetId] - damage);

    // Queue damage number for visual feedback
    queueDamageEvent(targetId.toString(), damage, {
      x: Transform.x[targetId],
      y: Transform.y[targetId],
    });

    // Broadcast combat event
    broadcastCombatEvent(world, {
      type: 'damage',
      attackerId,
      targetId,
      damage,
      timestamp: Date.now(),
    });

    // Check for death
    if (Health.current[targetId] <= 0) {
      handleEntityDeath(world, targetId, attackerId);
    }
  } else {
    // Miss - queue miss indicator for visual feedback
    queueDamageEvent(targetId.toString(), 0, {
      x: Transform.x[targetId],
      y: Transform.y[targetId],
    });

    // Broadcast combat event
    broadcastCombatEvent(world, {
      type: 'miss',
      attackerId,
      targetId,
      damage: 0,
      timestamp: Date.now(),
    });
  }
}

/**
 * Handle entity death and XP rewards
 */
function handleEntityDeath(world: IWorld, deadEntityId: number, killerId: number): void {
  // Award XP if player killed an enemy
  if (
    hasComponent(world, Player, killerId) &&
    (hasComponent(world, Monster, deadEntityId) || hasComponent(world, NPC, deadEntityId))
  ) {
    const baseXP =
      CombatStats.attack[deadEntityId] +
      CombatStats.strength[deadEntityId] +
      CombatStats.defence[deadEntityId];
    const xpGain = Math.max(1, Math.floor(baseXP * 0.33)); // 1/3 of total combat stats as XP

    // Award attack, strength, defence, and hitpoints XP
    awardCombatXP(world, killerId, xpGain);
  }

  // Broadcast death event
  broadcastCombatEvent(world, {
    type: 'death',
    attackerId: killerId,
    targetId: deadEntityId,
    damage: 0,
    timestamp: Date.now(),
  });

  // Clean up combat state
  combatTargets.delete(deadEntityId);
  lastAttackTime.delete(deadEntityId);
}

/**
 * Award combat XP to a player
 */
function awardCombatXP(world: IWorld, playerId: number, baseXP: number): void {
  if (!hasComponent(world, Skills, playerId)) return;

  // Award XP to attack, strength, defence, and hitpoints
  const skillXP = Math.floor(baseXP / 4);

  // This would integrate with the SkillSystem for actual XP calculations
  broadcastCombatEvent(world, {
    type: 'xp_gain',
    attackerId: playerId,
    targetId: 0,
    damage: skillXP,
    timestamp: Date.now(),
  });
}

/**
 * Broadcast combat events through the network system
 */
function broadcastCombatEvent(world: IWorld, event: CombatEvent): void {
  const worldWithBroadcaster = world as WorldWithBroadcaster;
  const broadcaster = worldWithBroadcaster.networkBroadcaster;
  if (broadcaster && typeof broadcaster === 'function') {
    broadcaster('combat_event', event);
  }
}

/**
 * Check if two entities are within range
 */
function isInRange(world: IWorld, entity1: number, entity2: number, range: number): boolean {
  const distance = calculateDistance(
    Transform.x[entity1],
    Transform.y[entity1],
    Transform.x[entity2],
    Transform.y[entity2]
  );
  return distance <= range;
}

/**
 * Calculate distance between two points
 */
function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Get attack range for an entity
 */
function getAttackRange(world: IWorld, entityId: number): number {
  // Base attack range - could be enhanced with weapon bonuses
  return hasComponent(world, Player, entityId) ? 1.5 : 1.0; // tiles
}

/**
 * Get aggro range for an enemy
 */
function getAggroRange(_world: IWorld, _entityId: number): number {
  // Enemies have larger aggro range than attack range
  return 3.0; // tiles
}

/**
 * Check if an NPC is aggressive
 */
function isAggressive(_world: IWorld, _npcId: number): boolean {
  // For now, assume all NPCs are aggressive - could be enhanced with NPC data
  return true;
}
