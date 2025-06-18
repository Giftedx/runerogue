/**
 * RuneRogue Server-Side Combat System (ECS)
 * Manages melee combat logic, including attack validation,
 * damage calculation, and applying damage to entities.
 *
 * @author Your Name/Alias
 */

import { IWorld } from 'bitecs';
import { Player, Enemy, Position, Health, Stats } from '@runerogue/shared/src/components';
import { calculateAccuracy, calculateMaxHit } from '@runerogue/osrs-data';

// Define constants for OSRS combat
const MELEE_ATTACK_RANGE = 1.5; // tiles
const WEAPON_ATTACK_SPEED_TICKS = 4; // e.g., Scimitar
const OSRS_TICK_MS = 600;

export function createCombatSystem(room: any) {
  return (world: IWorld) => {
    // For now, we'll handle attacks via messages.
    // A more advanced implementation could use component-based attack triggers.
    return world;
  };
}

/**
 * Handles an attack request from a client.
 * @param world The ECS world.
 * @param attackerEid The entity ID of the attacker.
 * @param targetEid The entity ID of the target.
 * @returns A boolean indicating if the attack was successful.
 */
export function processAttack(world: IWorld, attackerEid: number, targetEid: number): boolean {
  const now = Date.now();

  // 1. Validate Attack Cooldown
  // Note: This is a simplified check. A robust implementation would use game ticks.
  if (now - Player.lastAttackTick[attackerEid] < WEAPON_ATTACK_SPEED_TICKS * OSRS_TICK_MS) {
    console.log(`Attacker ${attackerEid} is on cooldown.`);
    return false; // Attacker is on cooldown
  }

  // 2. Validate Attack Range
  const attackerX = Position.x[attackerEid];
  const attackerY = Position.y[attackerEid];
  const targetX = Position.x[targetEid];
  const targetY = Position.y[targetEid];
  const distance = Math.sqrt(Math.pow(targetX - attackerX, 2) + Math.pow(targetY - attackerY, 2));

  if (distance > MELEE_ATTACK_RANGE) {
    console.log(`Attacker ${attackerEid} is out of range of ${targetEid}.`);
    return false; // Target is out of range
  }

  // 3. Calculate Damage
  // For simplicity, we assume player is attacker and enemy is defender.
  // A real implementation would fetch stats based on entity type.
  const attackerStats = {
    attack: Stats.attack[attackerEid],
    strength: Stats.strength[attackerEid],
    defence: Stats.defence[attackerEid],
  };

  const defenderStats = {
    attack: Stats.attack[targetEid],
    strength: Stats.strength[targetEid],
    defence: Stats.defence[targetEid],
  };

  // TODO: Incorporate equipment bonuses and prayers
  const accuracy = calculateAccuracy(
    { stats: attackerStats, equipment: {} },
    { stats: defenderStats, equipment: {} }
  );
  const maxHit = calculateMaxHit(
    { stats: attackerStats, equipment: {} },
    {}, // prayer
    {} // style bonus
  );

  const hitChance = Math.random();
  if (hitChance > accuracy) {
    // Attack missed
    Health.current[targetEid] -= 0; // Show a "0" splat
    Player.lastAttackTick[attackerEid] = now;
    console.log(`Attacker ${attackerEid} missed target ${targetEid}.`);
    return true; // Attack was processed (even if it missed)
  }

  // 4. Apply Damage
  const damage = Math.floor(Math.random() * (maxHit + 1));
  Health.current[targetEid] -= damage;
  Player.lastAttackTick[attackerEid] = now;

  console.log(`Attacker ${attackerEid} hit target ${targetEid} for ${damage} damage.`);

  // 5. Check for Death
  if (Health.current[targetEid] <= 0) {
    // TODO: Handle entity death (e.g., remove entity, drop loot)
    console.log(`Target ${targetEid} has been defeated.`);
  }

  return true;
}
