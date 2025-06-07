import { defineQuery, defineSystem, hasComponent } from 'bitecs';
import { Attack, Enemy, Health, Level, Player, Position } from '../components';
import { ECSWorld } from '../world';

const playerQuery = defineQuery([Position, Health, Attack, Level, Player]);
const enemyQuery = defineQuery([Position, Health, Attack, Level, Enemy]);

/**
 * AutoCombatSystem handles automatic combat between players and enemies
 * Players will automatically attack the nearest enemy within range
 */
export const AutoCombatSystem = defineSystem((world: ECSWorld) => {
  const players = playerQuery(world);
  const enemies = enemyQuery(world);

  // Process each player for auto-combat
  for (const playerId of players) {
    // Skip dead players
    if (Health.current[playerId] <= 0) continue;

    const playerPos = {
      x: Position.x[playerId],
      y: Position.y[playerId],
    };

    let nearestEnemy = null;
    let nearestDistance = Infinity;
    const attackRange = 100; // Base attack range

    // Find nearest enemy within range
    for (const enemyId of enemies) {
      // Skip dead enemies
      if (Health.current[enemyId] <= 0) continue;

      const enemyPos = {
        x: Position.x[enemyId],
        y: Position.y[enemyId],
      };

      const distance = Math.sqrt(
        Math.pow(playerPos.x - enemyPos.x, 2) + Math.pow(playerPos.y - enemyPos.y, 2)
      );

      if (distance <= attackRange && distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemyId;
      }
    }

    // Attack nearest enemy if found
    if (nearestEnemy !== null) {
      const currentTime = Date.now();
      const lastAttackTime = world.lastAttackTime?.get(playerId) || 0;
      const attackSpeed = 4000; // 4 seconds between attacks (OSRS style)

      if (currentTime - lastAttackTime >= attackSpeed) {
        performAttack(world, playerId, nearestEnemy);

        // Update last attack time
        if (!world.lastAttackTime) {
          world.lastAttackTime = new Map();
        }
        world.lastAttackTime.set(playerId, currentTime);
      }
    }
  }

  // Enemy AI - enemies attack nearest player
  for (const enemyId of enemies) {
    // Skip dead enemies
    if (Health.current[enemyId] <= 0) continue;

    const enemyPos = {
      x: Position.x[enemyId],
      y: Position.y[enemyId],
    };

    let nearestPlayer = null;
    let nearestDistance = Infinity;
    const attackRange = 80; // Enemy attack range

    // Find nearest player within range
    for (const playerId of players) {
      // Skip dead players
      if (Health.current[playerId] <= 0) continue;

      const playerPos = {
        x: Position.x[playerId],
        y: Position.y[playerId],
      };

      const distance = Math.sqrt(
        Math.pow(enemyPos.x - playerPos.x, 2) + Math.pow(enemyPos.y - playerPos.y, 2)
      );

      if (distance <= attackRange && distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlayer = playerId;
      }
    }

    // Attack nearest player if found
    if (nearestPlayer !== null) {
      const currentTime = Date.now();
      const lastAttackTime = world.lastEnemyAttackTime?.get(enemyId) || 0;
      const attackSpeed = 3000; // 3 seconds between enemy attacks

      if (currentTime - lastAttackTime >= attackSpeed) {
        performAttack(world, enemyId, nearestPlayer);

        // Update last attack time
        if (!world.lastEnemyAttackTime) {
          world.lastEnemyAttackTime = new Map();
        }
        world.lastEnemyAttackTime.set(enemyId, currentTime);
      }
    }
  }

  return world;
});

/**
 * Performs an attack between attacker and target
 */
function performAttack(world: ECSWorld, attackerId: number, targetId: number) {
  const attackerLevel = Level.combat[attackerId] || 1;
  const attackerAttack = Attack.melee[attackerId] || 1;

  const targetLevel = Level.combat[targetId] || 1;
  const targetDefence = Level.defence?.[targetId] || 1;

  // OSRS-inspired damage calculation
  const maxHit = calculateMaxHit(attackerLevel, attackerAttack);
  const accuracy = calculateAccuracy(attackerLevel, attackerAttack, targetLevel, targetDefence);

  // Roll for hit
  const hitRoll = Math.random();

  if (hitRoll < accuracy) {
    // Hit - calculate damage
    const damage = Math.floor(Math.random() * (maxHit + 1));

    // Apply damage
    Health.current[targetId] = Math.max(0, Health.current[targetId] - damage);

    // Add combat event for UI feedback
    if (!world.combatEvents) {
      world.combatEvents = [];
    }

    world.combatEvents.push({
      type: 'damage',
      attackerId,
      targetId,
      damage,
      timestamp: Date.now(),
    });

    // Check if target died
    if (Health.current[targetId] <= 0) {
      handleDeath(world, targetId, attackerId);
    }
  } else {
    // Miss
    if (!world.combatEvents) {
      world.combatEvents = [];
    }

    world.combatEvents.push({
      type: 'miss',
      attackerId,
      targetId,
      damage: 0,
      timestamp: Date.now(),
    });
  }
}

/**
 * Calculate maximum hit based on OSRS formulas
 */
function calculateMaxHit(level: number, attack: number): number {
  // Simplified OSRS max hit formula
  const baseDamage = Math.floor(level * 0.5) + Math.floor(attack * 0.3);
  return Math.max(1, baseDamage);
}

/**
 * Calculate hit accuracy based on OSRS formulas
 */
function calculateAccuracy(
  attackLevel: number,
  attack: number,
  defenceLevel: number,
  defence: number
): number {
  // Simplified OSRS accuracy calculation
  const attackRoll = attackLevel + attack;
  const defenceRoll = defenceLevel + defence;

  const accuracy = attackRoll / (attackRoll + defenceRoll);
  return Math.min(0.95, Math.max(0.05, accuracy)); // Cap between 5% and 95%
}

/**
 * Handle entity death
 */
function handleDeath(world: ECSWorld, deadEntityId: number, killerId: number) {
  // Add death event
  if (!world.deathEvents) {
    world.deathEvents = [];
  }

  world.deathEvents.push({
    deadEntityId,
    killerId,
    timestamp: Date.now(),
  });

  // If enemy died, award XP to player
  if (hasComponent(world, Enemy, deadEntityId) && hasComponent(world, Player, killerId)) {
    const xpGain = Level.combat[deadEntityId] * 4; // 4 XP per enemy combat level

    if (!world.xpEvents) {
      world.xpEvents = [];
    }

    world.xpEvents.push({
      playerId: killerId,
      skill: 'combat',
      xp: xpGain,
      timestamp: Date.now(),
    });
  }
}
