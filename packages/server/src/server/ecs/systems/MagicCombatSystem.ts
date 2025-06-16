/**
 * MagicCombatSystem - OSRS-authentic ECS system for magic combat
 * Handles spell casting, rune consumption, magic damage, and XP rewards
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
  Target,
  AttackTimer,
  Player,
} from '../components';
import {
  calculateMagicMaxHit,
  calculateMagicAccuracy,
  getSpellById,
  STANDARD_COMBAT_SPELLS,
  type Spell,
} from '@runerogue/osrs-data';
import { MagicCombat } from '../components';

// Query for entities that can cast magic
const magicQuery = defineQuery([
  Transform,
  Health,
  SkillLevels,
  SkillXP,
  EquipmentBonuses,
  MagicCombat,
  Target,
  AttackTimer,
  Player,
]);

// Query for valid targets
const targetQuery = defineQuery([Transform, Health]);

// Magic combat timing
const MAGIC_ATTACK_SPEED = 5; // 5 ticks = 3.0 seconds base
const OSRS_TICK_TIME = 600; // 600ms per tick

/**
 * Magic projectile data for visual effects
 */
interface MagicProjectile {
  spellId: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startTime: number;
  duration: number;
  damage: number;
  targetId: number;
}

// Active magic projectiles for visual system
const activeProjectiles = new Map<string, MagicProjectile>();

/**
 * Extended world interface for magic combat events
 */
interface WorldWithMagicEvents extends IWorld {
  magicProjectileBroadcaster?: (projectile: MagicProjectile) => void;
  xpGranter?: (entityId: number, skill: string, amount: number) => void;
  inventoryManager?: {
    hasItems: (entityId: number, items: Array<{ itemId: number; quantity: number }>) => boolean;
    removeItems: (entityId: number, items: Array<{ itemId: number; quantity: number }>) => boolean;
  };
}

/**
 * Cast a magic spell at target
 */
function castSpell(
  world: WorldWithMagicEvents,
  casterId: number,
  targetId: number,
  spellId: number
): boolean {
  const spell = getSpellById(spellId);
  if (!spell) return false;

  // Check magic level requirement
  const magicLevel = SkillLevels.magic[casterId] || 1;
  if (magicLevel < spell.level) {
    return false;
  }

  // Check rune requirements
  if (world.inventoryManager) {
    const runeRequirements = spell.runes.map(rune => ({
      itemId: rune.runeId,
      quantity: rune.amount,
    }));

    if (!world.inventoryManager.hasItems(casterId, runeRequirements)) {
      return false;
    }

    // Consume runes
    world.inventoryManager.removeItems(casterId, runeRequirements);
  }

  // Calculate damage
  const magicBonus = EquipmentBonuses.attackMagic[casterId] || 0;
  const maxHit = calculateMagicMaxHit(magicLevel, spell, magicBonus);

  // Calculate accuracy
  const targetDefence = SkillLevels.defence[targetId] || 1;
  const targetMagicDefence = EquipmentBonuses.defenceMagic[targetId] || 0;
  const accuracy = calculateMagicAccuracy(
    magicLevel,
    spell,
    magicBonus,
    targetDefence,
    targetMagicDefence
  );

  // Roll for hit/miss
  const hitRoll = Math.random();
  const isHit = hitRoll < accuracy;

  let damage = 0;
  if (isHit) {
    // Roll damage from 0 to maxHit
    damage = Math.floor(Math.random() * (maxHit + 1));
  }

  // Create projectile for visual effects
  const casterPos = Transform[casterId];
  const targetPos = Transform[targetId];

  if (casterPos && targetPos && world.magicProjectileBroadcaster) {
    const projectile: MagicProjectile = {
      spellId: spell.id,
      fromX: casterPos.x,
      fromY: casterPos.y,
      toX: targetPos.x,
      toY: targetPos.y,
      startTime: Date.now(),
      duration: 1200, // 1.2 second travel time
      damage,
      targetId,
    };

    const projectileId = `${casterId}-${targetId}-${Date.now()}`;
    activeProjectiles.set(projectileId, projectile);
    world.magicProjectileBroadcaster(projectile);

    // Schedule damage application after projectile travel time
    setTimeout(() => {
      applyMagicDamage(world, targetId, damage, casterId, spell);
      activeProjectiles.delete(projectileId);
    }, projectile.duration);
  } else {
    // Immediate damage if no visual system
    applyMagicDamage(world, targetId, damage, casterId, spell);
  }

  // Grant magic XP
  if (world.xpGranter) {
    world.xpGranter(casterId, 'magic', spell.experience);
  }

  // Update attack timer
  AttackTimer.lastAttack[casterId] = Date.now();
  AttackTimer.cooldown[casterId] = MAGIC_ATTACK_SPEED * OSRS_TICK_TIME;

  return true;
}

/**
 * Apply magic damage to target
 */
function applyMagicDamage(
  world: WorldWithMagicEvents,
  targetId: number,
  damage: number,
  casterId: number,
  spell: Spell
): void {
  if (damage > 0) {
    const currentHealth = Health.current[targetId];
    const newHealth = Math.max(0, currentHealth - damage);
    Health.current[targetId] = newHealth;

    // Grant hitpoints XP to caster if target dies
    if (newHealth === 0 && world.xpGranter) {
      world.xpGranter(casterId, 'hitpoints', Math.floor(damage / 4));
    }
  }
}

/**
 * Check if entity can cast magic spell
 */
function canCastSpell(world: WorldWithMagicEvents, entityId: number, spellId: number): boolean {
  // Check if attack timer allows casting
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

  // Check distance (magic has longer range than melee)
  const casterPos = Transform[entityId];
  const targetPos = Transform[targetId];

  if (casterPos && targetPos) {
    const distance = Math.sqrt(
      Math.pow(targetPos.x - casterPos.x, 2) + Math.pow(targetPos.y - casterPos.y, 2)
    );

    // Magic combat range is 10 tiles
    if (distance > 10) {
      return false;
    }
  }

  return true;
}

/**
 * Auto-select appropriate spell based on magic level
 */
function selectBestSpell(magicLevel: number): number {
  const availableSpells = STANDARD_COMBAT_SPELLS.filter(
    spell => spell.level <= magicLevel && spell.combatSpell
  );

  if (availableSpells.length === 0) {
    return STANDARD_COMBAT_SPELLS[0].id; // Default to Wind Strike
  }

  // Return highest level spell available
  return availableSpells[availableSpells.length - 1].id;
}

/**
 * MagicCombatSystem - Main system for processing magic combat
 */
export const MagicCombatSystem = defineSystem((world: IWorld) => {
  const worldWithMagic = world as WorldWithMagicEvents;
  const entities = magicQuery(world);

  for (const entity of entities) {
    const magicData = MagicCombat[entity];
    const targetId = Target.id[entity];

    // Skip if no target
    if (!targetId) continue;

    // Auto-select spell if none selected
    if (!magicData.selectedSpell) {
      const magicLevel = SkillLevels.magic[entity] || 1;
      magicData.selectedSpell = selectBestSpell(magicLevel);
    }

    // Check if entity can cast spell
    if (!canCastSpell(worldWithMagic, entity, magicData.selectedSpell)) {
      continue;
    }

    // Attempt to cast spell
    const success = castSpell(worldWithMagic, entity, targetId, magicData.selectedSpell);

    if (success) {
      magicData.lastCastTime = Date.now();
    }
  }

  return world;
});

/**
 * Initialize magic combat for player entity
 */
export function initializeMagicCombat(world: IWorld, entityId: number): void {
  // Add magic combat component
  addComponent(world, MagicCombat, entityId);

  // Set default spell based on magic level
  const magicLevel = SkillLevels.magic[entityId] || 1;
  MagicCombat.selectedSpell[entityId] = selectBestSpell(magicLevel);
  MagicCombat.autocast[entityId] = 1; // Enable autocast by default
  MagicCombat.lastCastTime[entityId] = 0;
  MagicCombat.runePouch[entityId] = 0;
}

/**
 * Set selected spell for entity
 */
export function setSelectedSpell(world: IWorld, entityId: number, spellId: number): boolean {
  if (!hasComponent(world, MagicCombat, entityId)) {
    return false;
  }

  const spell = getSpellById(spellId);
  if (!spell) return false;

  // Check level requirement
  const magicLevel = SkillLevels.magic[entityId] || 1;
  if (magicLevel < spell.level) {
    return false;
  }

  MagicCombat.selectedSpell[entityId] = spellId;
  return true;
}

/**
 * Toggle autocast for entity
 */
export function toggleAutocast(world: IWorld, entityId: number): boolean {
  if (!hasComponent(world, MagicCombat, entityId)) {
    return false;
  }

  const current = MagicCombat.autocast[entityId];
  MagicCombat.autocast[entityId] = current ? 0 : 1;
  return MagicCombat.autocast[entityId] === 1;
}

/**
 * Get active projectiles for visual system
 */
export function getActiveProjectiles(): Map<string, MagicProjectile> {
  return activeProjectiles;
}
