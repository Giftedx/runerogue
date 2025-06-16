/**
 * RangedCombatSystem - OSRS-authentic ECS system for ranged combat
 * Handles bow/crossbow attacks, ammunition consumption, and ranged damage
 *
 * @author RuneRogue Development Team
 * @package @runerogue/server
 */

import { defineSystem, defineQuery, hasComponent, IWorld, addComponent } from 'bitecs';
import {
  Transform,
  Health,
  SkillLevels,
  SkillXP,
  EquipmentBonuses,
  Equipment,
  Target,
  AttackTimer,
  Player,
} from '../components';
import {
  calculateRangedMaxHit,
  calculateRangedAccuracy,
  getRangedWeaponById,
  getAmmunitionById,
  canUseAmmunition,
  calculateTotalRangedStrength,
  getAttackSpeedModifier,
  type RangedWeapon,
  type Ammunition,
} from '@runerogue/osrs-data';
import { RangedCombat } from '../components';

// Query for entities that can use ranged combat
const rangedQuery = defineQuery([
  Transform,
  Health,
  SkillLevels,
  SkillXP,
  EquipmentBonuses,
  Equipment,
  RangedCombat,
  Target,
  AttackTimer,
  Player,
]);

// Query for valid targets
const targetQuery = defineQuery([Transform, Health]);

// Ranged combat timing
const BASE_RANGED_SPEED = 5; // 5 ticks = 3.0 seconds base
const OSRS_TICK_TIME = 600; // 600ms per tick

/**
 * Ranged projectile data for visual effects
 */
interface RangedProjectile {
  weaponId: number;
  ammunitionId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  duration: number;
  damage: number;
  targetId: number;
}

// Active ranged projectiles for visual system
const activeProjectiles = new Map<string, RangedProjectile>();

/**
 * Extended world interface for ranged combat events
 */
interface WorldWithRangedEvents extends IWorld {
  rangedProjectileBroadcaster?: (projectile: RangedProjectile) => void;
  xpGranter?: (entityId: number, skill: string, amount: number) => void;
  inventoryManager?: {
    hasItems: (entityId: number, items: Array<{ itemId: number; quantity: number }>) => boolean;
    removeItems: (entityId: number, items: Array<{ itemId: number; quantity: number }>) => boolean;
  };
}

/**
 * Perform ranged attack
 */
function performRangedAttack(
  world: WorldWithRangedEvents,
  attackerId: number,
  targetId: number
): boolean {
  // Get equipped weapon
  const weaponId = Equipment.weapon[attackerId];
  const weapon = getRangedWeaponById(weaponId);

  if (!weapon) return false;

  // Check ammunition
  const rangedData = RangedCombat[attackerId];
  const ammunition = getAmmunitionById(rangedData.ammunition);

  if (weapon.ammunitionType !== 'none' && (!ammunition || rangedData.ammunitionCount <= 0)) {
    return false; // No ammunition
  }

  // Check ranged level requirement
  const rangedLevel = SkillLevels.ranged[attackerId] || 1;
  if (rangedLevel < weapon.level) {
    return false;
  }

  // Calculate damage
  const rangedStrength = calculateTotalRangedStrength(weapon, ammunition);
  const maxHit = calculateRangedMaxHit(rangedLevel, rangedStrength);

  // Calculate accuracy
  const attackBonus = EquipmentBonuses.attackRanged[attackerId] || 0;
  const targetDefence = SkillLevels.defence[targetId] || 1;
  const targetRangedDefence = EquipmentBonuses.defenceRanged[targetId] || 0;

  const accuracy = calculateRangedAccuracy(
    rangedLevel,
    attackBonus,
    targetDefence,
    targetRangedDefence
  );

  // Roll for hit/miss
  const hitRoll = Math.random();
  const isHit = hitRoll < accuracy;

  let damage = 0;
  if (isHit) {
    // Roll damage from 0 to maxHit
    damage = Math.floor(Math.random() * (maxHit + 1));
  }

  // Consume ammunition
  if (weapon.ammunitionType !== 'none' && ammunition) {
    rangedData.ammunitionCount = Math.max(0, rangedData.ammunitionCount - 1);

    // Remove from inventory if out of ammunition
    if (rangedData.ammunitionCount === 0 && world.inventoryManager) {
      world.inventoryManager.removeItems(attackerId, [{ itemId: ammunition.id, quantity: 1 }]);
    }
  }

  // Create projectile for visual effects
  const attackerPos = Transform[attackerId];
  const targetPos = Transform[targetId];

  if (attackerPos && targetPos && world.rangedProjectileBroadcaster) {
    const projectile: RangedProjectile = {
      weaponId: weapon.id,
      ammunitionId: ammunition?.id || 0,
      fromX: attackerPos.x,
      fromY: attackerPos.y,
      toX: targetPos.x,
      toY: targetPos.y,
      startTime: Date.now(),
      duration: calculateProjectileTime(attackerPos, targetPos),
      damage,
      targetId,
    };

    const projectileId = `${attackerId}-${targetId}-${Date.now()}`;
    activeProjectiles.set(projectileId, projectile);
    world.rangedProjectileBroadcaster(projectile);

    // Schedule damage application after projectile travel time
    setTimeout(() => {
      applyRangedDamage(world, targetId, damage, attackerId);
      activeProjectiles.delete(projectileId);
    }, projectile.duration);
  } else {
    // Immediate damage if no visual system
    applyRangedDamage(world, targetId, damage, attackerId);
  }

  // Grant ranged XP (4 XP per damage dealt, minimum 1)
  if (world.xpGranter) {
    const xpAmount = Math.max(1, damage * 4);

    // XP goes to ranged or defence based on attack style
    if (rangedData.attackStyle === 2) {
      // Longrange
      // 50% ranged, 50% defence
      world.xpGranter(attackerId, 'ranged', Math.floor(xpAmount / 2));
      world.xpGranter(attackerId, 'defence', Math.floor(xpAmount / 2));
    } else {
      world.xpGranter(attackerId, 'ranged', xpAmount);
    }
  }

  // Update attack timer with weapon speed
  const attackSpeed =
    weapon.attackSpeed +
    getAttackSpeedModifier({
      name: '',
      type: rangedData.attackStyle === 1 ? 'rapid' : 'accurate',
      experienceType: 'ranged',
      accuracyBonus: 0,
      strengthBonus: 0,
      defenceBonus: 0,
      rangeBonus: 0,
    });

  AttackTimer.lastAttack[attackerId] = Date.now();
  AttackTimer.cooldown[attackerId] = attackSpeed * OSRS_TICK_TIME;

  return true;
}

/**
 * Calculate projectile travel time based on distance
 */
function calculateProjectileTime(
  from: { x: number; y: number },
  to: { x: number; y: number }
): number {
  const distance = Math.sqrt(Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2));

  // Base travel time of 600ms, +60ms per tile of distance
  return Math.min(1500, 600 + distance * 60);
}

/**
 * Apply ranged damage to target
 */
function applyRangedDamage(
  world: WorldWithRangedEvents,
  targetId: number,
  damage: number,
  attackerId: number
): void {
  if (damage > 0) {
    const currentHealth = Health.current[targetId];
    const newHealth = Math.max(0, currentHealth - damage);
    Health.current[targetId] = newHealth;

    // Grant hitpoints XP to attacker if target dies
    if (newHealth === 0 && world.xpGranter) {
      world.xpGranter(attackerId, 'hitpoints', Math.floor(damage / 4));
    }
  }
}

/**
 * Check if entity can perform ranged attack
 */
function canPerformRangedAttack(world: WorldWithRangedEvents, entityId: number): boolean {
  // Check if attack timer allows attacking
  const lastAttack = AttackTimer.lastAttack[entityId] || 0;
  const cooldown = AttackTimer.cooldown[entityId] || 0;
  const timeSinceLastAttack = Date.now() - lastAttack;

  if (timeSinceLastAttack < cooldown) {
    return false;
  }

  // Check if target is valid and in range
  const targetId = Target.id[entityId];
  if (!targetId || !hasComponent(world, targetQuery, targetId)) {
    return false;
  }

  // Check if target is alive
  const targetHealth = Health.current[targetId];
  if (targetHealth <= 0) {
    return false;
  }

  // Check distance (ranged has longer range than melee)
  const attackerPos = Transform[entityId];
  const targetPos = Transform[targetId];

  if (attackerPos && targetPos) {
    const distance = Math.sqrt(
      Math.pow(targetPos.x - attackerPos.x, 2) + Math.pow(targetPos.y - attackerPos.y, 2)
    );

    // Ranged combat range is 7 tiles (10 for longrange)
    const rangedData = RangedCombat[entityId];
    const maxRange = rangedData.attackStyle === 2 ? 10 : 7;

    if (distance > maxRange) {
      return false;
    }
  }

  return true;
}

/**
 * Check if entity has ranged weapon equipped
 */
function hasRangedWeapon(entityId: number): boolean {
  const weaponId = Equipment.weapon[entityId];
  const weapon = getRangedWeaponById(weaponId);
  return weapon !== undefined;
}

/**
 * Shoot a projectile from attacker to target
 */
export function shootProjectile(
  world: WorldWithRangedEvents,
  attackerId: number,
  targetId: number,
  weaponId: number,
  ammunitionId?: number
): boolean {
  const weapon = getRangedWeaponById(weaponId);
  if (!weapon) return false;

  const attackerPos = Transform[attackerId];
  const targetPos = Transform[targetId];

  if (!attackerPos || !targetPos) return false;

  // Calculate projectile travel time
  const distance = Math.sqrt(
    Math.pow(targetPos.x - attackerPos.x, 2) + Math.pow(targetPos.y - attackerPos.y, 2)
  );
  const duration = Math.max(300, distance * 10); // Minimum 300ms travel time

  // Create projectile
  const projectile: RangedProjectile = {
    weaponId: weapon.id,
    ammunitionId: ammunitionId || 0,
    fromX: attackerPos.x,
    fromY: attackerPos.y,
    toX: targetPos.x,
    toY: targetPos.y,
    startTime: Date.now(),
    duration,
    damage: 0, // Will be calculated on impact
    targetId,
  };

  if (world.rangedProjectileBroadcaster) {
    world.rangedProjectileBroadcaster(projectile);
  }

  return true;
}

/**
 * RangedCombatSystem - Main system for processing ranged combat
 */
export const RangedCombatSystem = defineSystem((world: IWorld) => {
  const worldWithRanged = world as WorldWithRangedEvents;
  const entities = rangedQuery(world);

  for (const entity of entities) {
    const targetId = Target.id[entity];

    // Skip if no target or no ranged weapon
    if (!targetId || !hasRangedWeapon(entity)) continue;

    // Check if entity can perform ranged attack
    if (!canPerformRangedAttack(worldWithRanged, entity)) {
      continue;
    }

    // Attempt ranged attack
    const success = performRangedAttack(worldWithRanged, entity, targetId);

    if (success) {
      RangedCombat.lastShotTime[entity] = Date.now();
    }
  }

  return world;
});

/**
 * Initialize ranged combat for player entity
 */
export function initializeRangedCombat(world: IWorld, entityId: number): void {
  // Add ranged combat component
  addComponent(world, RangedCombat, entityId);

  // Set default attack style to accurate
  RangedCombat.attackStyle[entityId] = 0; // Accurate
  RangedCombat.lastShotTime[entityId] = 0;
  RangedCombat.ammunition[entityId] = 0;
  RangedCombat.ammunitionCount[entityId] = 0;
}

/**
 * Set attack style for entity
 */
export function setRangedAttackStyle(world: IWorld, entityId: number, style: number): boolean {
  if (!hasComponent(world, RangedCombat, entityId)) {
    return false;
  }

  // 0=accurate, 1=rapid, 2=longrange
  if (style < 0 || style > 2) {
    return false;
  }

  RangedCombat.attackStyle[entityId] = style;
  return true;
}

/**
 * Equip ammunition for entity
 */
export function equipAmmunition(
  world: IWorld,
  entityId: number,
  ammunitionId: number,
  count: number
): boolean {
  if (!hasComponent(world, RangedCombat, entityId)) {
    return false;
  }

  const ammunition = getAmmunitionById(ammunitionId);
  if (!ammunition) return false;

  // Check if ammunition is compatible with equipped weapon
  const weaponId = Equipment.weapon[entityId];
  const weapon = getRangedWeaponById(weaponId);

  if (weapon && !canUseAmmunition(weapon, ammunition)) {
    return false;
  }

  RangedCombat.ammunition[entityId] = ammunitionId;
  RangedCombat.ammunitionCount[entityId] = count;
  return true;
}

/**
 * Get active projectiles for visual system
 */
export function getActiveRangedProjectiles(): Map<string, RangedProjectile> {
  return activeProjectiles;
}
