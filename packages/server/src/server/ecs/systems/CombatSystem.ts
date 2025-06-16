import {
  defineQuery,
  defineSystem,
  IWorld,
  hasComponent,
  addComponent,
  removeComponent,
} from 'bitecs';
import {
  Transform,
  Health,
  EquipmentBonuses,
  SkillLevels,
  SkillXP,
  Prayer,
  Player,
  NPC,
  Monster,
  InCombat,
  Dead,
  PrayerFlag,
  isPrayerActive,
} from '../components';
import { queueDamageEvent } from './DamageNumberSystem';

// Combat queries
const combatQuery = defineQuery([
  InCombat,
  Transform,
  Health,
  SkillLevels,
  EquipmentBonuses,
  Prayer,
]);
// Unused queries removed for lint cleanliness

// Combat state tracking (entity -> target mapping)
const combatTargets = new Map<number, number>();
const lastAttackTime = new Map<number, number>();

// OSRS tick rate (600ms)
const TICK_RATE = 600;

/**
 * CombatSystem - Handles all combat mechanics using OSRS formulas
 */
export const CombatSystem = defineSystem((world: IWorld) => {
  const currentTime = Date.now();
  const combatEntities = combatQuery(world);

  for (let i = 0; i < combatEntities.length; i++) {
    const attackerId = combatEntities[i];
    const targetId = combatTargets.get(attackerId);

    if (!targetId || hasComponent(world, Dead, targetId) || hasComponent(world, Dead, attackerId)) {
      // Target or attacker is dead, end combat
      endCombat(world, attackerId);
      continue;
    }

    // Check if in range
    if (!isInCombatRange(world, attackerId, targetId)) {
      continue;
    }

    // Check attack timing
    const lastAttack = lastAttackTime.get(attackerId) || 0;
    const attackSpeed = getAttackSpeed(world, attackerId);
    const nextAttackTime = lastAttack + attackSpeed * TICK_RATE;

    if (currentTime >= nextAttackTime) {
      performAttack(world, attackerId, targetId);
      lastAttackTime.set(attackerId, currentTime);
    }
  }

  return world;
});

/**
 * Calculate max hit using OSRS formula
 */
/**
 * Calculate max hit using OSRS formula (melee only, for now)
 * @param world ECS world
 * @param attackerId Attacker entity ID
 * @returns Max hit value
 */
function calculateMaxHit(world: IWorld, attackerId: number): number {
  const strengthLevel = SkillLevels.strength[attackerId] || 1;
  const strengthBonus = EquipmentBonuses.meleeStrength[attackerId] || 0;

  // Get prayer bonus
  let prayerMultiplier = 1;
  let styleBonus = 0;

  if (hasComponent(world, Player, attackerId)) {
    const prayers = Prayer.activeMask[attackerId] || 0;

    // Prayer multipliers (multiplicative)
    if (isPrayerActive(prayers, PrayerFlag.BURST_OF_STRENGTH)) {
      prayerMultiplier = 1.05;
    } else if (isPrayerActive(prayers, PrayerFlag.SUPERHUMAN_STRENGTH)) {
      prayerMultiplier = 1.1;
    } else if (isPrayerActive(prayers, PrayerFlag.ULTIMATE_STRENGTH)) {
      prayerMultiplier = 1.15;
    } else if (isPrayerActive(prayers, PrayerFlag.CHIVALRY)) {
      prayerMultiplier = 1.18;
    } else if (isPrayerActive(prayers, PrayerFlag.PIETY)) {
      prayerMultiplier = 1.23;
    }

    // Combat style bonus (additive)
    // TODO: Get from combat style component when implemented
    styleBonus = 3; // Aggressive style for now
  }

  // Calculate effective strength level
  const effectiveStrength = Math.floor(strengthLevel * prayerMultiplier + styleBonus + 8);

  // Calculate max hit
  const maxHit = Math.floor(0.5 + (effectiveStrength * (strengthBonus + 64)) / 640);

  return maxHit;
}

/**
 * Calculate hit chance using OSRS formula
 */
/**
 * Calculate hit chance using OSRS formula (melee only, for now)
 * @param world ECS world
 * @param attackerId Attacker entity ID
 * @param targetId Target entity ID
 * @returns Hit chance (0-1)
 */
function calculateHitChance(world: IWorld, attackerId: number, targetId: number): number {
  // Attacker's effective attack level
  const attackLevel = SkillLevels.attack[attackerId] || 1;
  const attackBonus = EquipmentBonuses.attackStab[attackerId] || 0;

  let attackPrayerMultiplier = 1;
  let attackStyleBonus = 0;

  if (hasComponent(world, Player, attackerId)) {
    const prayers = Prayer.activeMask[attackerId] || 0;

    // Attack prayer multipliers
    if (isPrayerActive(prayers, PrayerFlag.CLARITY_OF_THOUGHT)) {
      attackPrayerMultiplier = 1.05;
    } else if (isPrayerActive(prayers, PrayerFlag.IMPROVED_REFLEXES)) {
      attackPrayerMultiplier = 1.1;
    } else if (isPrayerActive(prayers, PrayerFlag.INCREDIBLE_REFLEXES)) {
      attackPrayerMultiplier = 1.15;
    } else if (isPrayerActive(prayers, PrayerFlag.CHIVALRY)) {
      attackPrayerMultiplier = 1.15;
    } else if (isPrayerActive(prayers, PrayerFlag.PIETY)) {
      attackPrayerMultiplier = 1.2;
    }

    // Combat style bonus
    attackStyleBonus = 3; // Accurate style for now
  }

  const effectiveAttack = Math.floor(attackLevel * attackPrayerMultiplier + attackStyleBonus + 8);
  const attackRoll = effectiveAttack * (attackBonus + 64);

  // Target's effective defence level
  const defenceLevel = SkillLevels.defence[targetId] || 1;
  const defenceBonus = EquipmentBonuses.defenceStab[targetId] || 0;

  let defencePrayerMultiplier = 1;
  let defenceStyleBonus = 0;

  if (hasComponent(world, Player, targetId)) {
    const prayers = Prayer.activeMask[targetId] || 0;

    // Defence prayer multipliers
    if (isPrayerActive(prayers, PrayerFlag.THICK_SKIN)) {
      defencePrayerMultiplier = 1.05;
    } else if (isPrayerActive(prayers, PrayerFlag.ROCK_SKIN)) {
      defencePrayerMultiplier = 1.1;
    } else if (isPrayerActive(prayers, PrayerFlag.STEEL_SKIN)) {
      defencePrayerMultiplier = 1.15;
    } else if (isPrayerActive(prayers, PrayerFlag.CHIVALRY)) {
      defencePrayerMultiplier = 1.2;
    } else if (isPrayerActive(prayers, PrayerFlag.PIETY)) {
      defencePrayerMultiplier = 1.25;
    }

    // Combat style bonus
    defenceStyleBonus = 3; // Defensive style for now
  }

  const effectiveDefence = Math.floor(
    defenceLevel * defencePrayerMultiplier + defenceStyleBonus + 8
  );
  const defenceRoll = effectiveDefence * (defenceBonus + 64);

  // Calculate hit chance
  let hitChance: number;
  if (attackRoll > defenceRoll) {
    hitChance = 1 - (defenceRoll + 2) / (2 * (attackRoll + 1));
  } else {
    hitChance = attackRoll / (2 * (defenceRoll + 1));
  }

  return hitChance;
}

/**
 * Perform an attack
 */
function performAttack(world: IWorld, attackerId: number, targetId: number): void {
  const maxHit = calculateMaxHit(world, attackerId);
  const hitChance = calculateHitChance(world, attackerId, targetId);

  // Roll for hit
  const hitRoll = Math.random();

  if (hitRoll <= hitChance) {
    // Successful hit - roll damage
    const damage = Math.floor(Math.random() * (maxHit + 1));

    // Check for critical hit (5% chance for now, can be enhanced later)
    const isCritical = Math.random() < 0.05;
    const finalDamage = isCritical ? Math.floor(damage * 1.5) : damage;

    // Apply damage
    const currentHealth = Health.current[targetId];
    const newHealth = Math.max(0, currentHealth - finalDamage);
    Health.current[targetId] = newHealth;

    // Queue damage number event for visual feedback
    queueDamageEvent(targetId.toString(), finalDamage, {
      x: Transform.x[targetId],
      y: Transform.y[targetId],
    });

    // Award XP to attacker if they're a player
    if (hasComponent(world, Player, attackerId) && finalDamage > 0) {
      awardCombatXP(world, attackerId, finalDamage);
    }

    // Check if target died
    if (newHealth === 0) {
      handleDeath(world, targetId, attackerId);
    }
  } else {
    // Miss - queue miss event for visual feedback
    queueDamageEvent(targetId.toString(), 0, {
      x: Transform.x[targetId],
      y: Transform.y[targetId],
    });
  }
}

/**
 * Award combat XP based on damage dealt
 */
/**
 * Award combat XP based on damage dealt
 * @param world ECS world
 * @param playerId Player entity ID
 * @param damage Damage dealt
 */
function awardCombatXP(world: IWorld, playerId: number, damage: number): void {
  // OSRS XP formula: 4 XP per damage in Hitpoints, distributed based on combat style
  const hitpointsXP = damage * 4;

  // For now, assume controlled style (equal XP distribution)
  const attackXP = Math.floor(hitpointsXP / 3);
  const strengthXP = Math.floor(hitpointsXP / 3);
  const defenceXP = Math.floor(hitpointsXP / 3);

  // Add XP
  SkillXP.attack[playerId] += attackXP;
  SkillXP.strength[playerId] += strengthXP;
  SkillXP.defence[playerId] += defenceXP;
  SkillXP.hitpoints[playerId] += hitpointsXP;

  // TODO: Check for level ups
}

/**
 * Handle entity death
 */
function handleDeath(world: IWorld, deadEntityId: number, killerId: number): void {
  // Mark as dead
  addComponent(world, Dead, deadEntityId);

  // End combat for both entities
  endCombat(world, deadEntityId);
  endCombat(world, killerId);

  // TODO: Drop loot, start respawn timer, etc.
}

/**
 * Check if entities are in combat range
 */
function isInCombatRange(world: IWorld, attackerId: number, targetId: number): boolean {
  const attackerX = Transform.x[attackerId];
  const attackerY = Transform.y[attackerId];
  const targetX = Transform.x[targetId];
  const targetY = Transform.y[targetId];

  const dx = targetX - attackerX;
  const dy = targetY - attackerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Melee range (1 tile)
  const range = 1.5; // Slightly larger than 1 to account for position precision

  return distance <= range;
}

/**
 * Get attack speed (in game ticks)
 */

function getAttackSpeed(_world: IWorld, _entityId: number): number {
  // TODO: Get from weapon component (future enhancement)
  // Default weapon speed is 4 ticks (2.4 seconds)
  return 4;
}

/**
 * Start combat between two entities
 */
export function startCombat(world: IWorld, attackerId: number, targetId: number): void {
  if (!hasComponent(world, InCombat, attackerId)) {
    addComponent(world, InCombat, attackerId);
  }

  combatTargets.set(attackerId, targetId);

  // Target fights back if it's an NPC/Monster
  if (
    (hasComponent(world, NPC, targetId) || hasComponent(world, Monster, targetId)) &&
    !hasComponent(world, InCombat, targetId)
  ) {
    addComponent(world, InCombat, targetId);
    combatTargets.set(targetId, attackerId);
  }
}

/**
 * End combat for an entity
 */
export function endCombat(world: IWorld, entityId: number): void {
  removeComponent(world, InCombat, entityId);
  combatTargets.delete(entityId);
  lastAttackTime.delete(entityId);
}
