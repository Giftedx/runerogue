// Event bus for combat events
import { gameEventEmitter, GameEventType } from "../events/GameEventEmitter";
import type { CombatEvent } from "../events/types";
import { type IWorld, defineQuery } from "bitecs";
import type { OSRSCombatStats, OSRSEquipmentBonuses } from "@runerogue/shared";
import {
  calculateMaxHit,
  calculateAccuracy,
} from "@runerogue/osrs-data/src/calculators/combat";
import {
  Position,
  Health,
  Enemy,
  Combat,
  Player as PlayerComponent,
} from "../ecs/components";
import { OSRS_TICK_MS } from "@runerogue/shared";

/**
 * Extracts OSRSCombatStats and OSRSEquipmentBonuses from ECS components for a given entity.
 *
 * @param {number} eid - Entity ID
 * @returns {{ stats: OSRSCombatStats, equipment: OSRSEquipmentBonuses }}
 */
function extractOsrsStats(eid: number): {
  stats: OSRSCombatStats;
  equipment: OSRSEquipmentBonuses;
} {
  const stats: OSRSCombatStats = {
    attack: (Combat.attack[eid] as number) || 1,
    strength: (Combat.strength[eid] as number) || 1,
    defence: (Combat.defence[eid] as number) || 1,
    hitpoints: (Health.max[eid] as number) || 10,
    ranged: (Combat.ranged[eid] as number) || 1,
    prayer: 1, // Enemies don't use prayer typically
    magic: (Combat.magic[eid] as number) || 1,
  };
  const equipment: OSRSEquipmentBonuses = {
    attackBonus: (Combat.attackBonus[eid] as number) || 0,
    strengthBonus: (Combat.strengthBonus[eid] as number) || 0,
    defenceBonus: (Combat.defenceBonus[eid] as number) || 0,
    rangedStrengthBonus: (Combat.rangedStrengthBonus[eid] as number) || 0,
    magicDamageBonus: (Combat.magicDamageBonus[eid] as number) || 0,
  };
  return { stats, equipment };
}

// OSRS authentic attack range (1 tile = 32px)
const ATTACK_RANGE = 32;
// OSRS walk speed: 1 tile/tick = 32px/600ms
const OSRS_WALK_SPEED_PX_PER_FRAME = 32 / (OSRS_TICK_MS / 16); // px per frame (assuming 60fps)

/**
 * Enemy AI system for RuneRogue.
 *
 * Moves enemies toward the nearest player and attacks if in range, using authentic OSRS combat formulas and tick timing.
 * Emits a CombatEvent for every attack, which is processed by the main game loop for UI/analytics.
 *
 * - Movement: Enemies move at OSRS walk speed (1 tile/tick, 32px per tile, 600ms per tick).
 * - Attack: Uses OSRS max hit and accuracy formulas from @runerogue/osrs-data.
 * - Event: Emits a CombatEvent for every attack (hit or miss).
 *
 * @returns {function(IWorld): IWorld} ECS system function for bitECS
 */
export const createEnemyAISystem = () => {
  // Define queries once (cached by bitECS)
  const enemyQuery = defineQuery([Enemy, Position, Health]);
  const playerQuery = defineQuery([PlayerComponent, Position, Health]);

  /**
   * ECS system function for enemy AI.
   * @param world The ECS world
   * @returns The updated ECS world
   */
  return (world: IWorld) => {
    try {
      const enemyEntities = enemyQuery(world).filter(
        (eid) => Health.current[eid] > 0
      );
      const playerEntities = playerQuery(world).filter(
        (eid) => Health.current[eid] > 0
      );
      if (playerEntities.length === 0) return world;

      for (const enemyEid of enemyEntities) {
        // Find nearest player
        let nearestPlayer: number | null = null;
        let minDist = Infinity;
        const ex = Position.x[enemyEid],
          ey = Position.y[enemyEid];
        for (const playerEid of playerEntities) {
          const px = Position.x[playerEid],
            py = Position.y[playerEid];
          const dx = px - ex,
            dy = py - ey;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) {
            minDist = dist;
            nearestPlayer = playerEid;
          }
        }
        if (nearestPlayer === null) continue;

        if (minDist > ATTACK_RANGE) {
          // Move toward player
          const px = Position.x[nearestPlayer],
            py = Position.y[nearestPlayer];
          const dx = px - ex,
            dy = py - ey;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          // OSRS walk speed: 1 tile/tick = 32px/600ms
          const speed = OSRS_WALK_SPEED_PX_PER_FRAME; // px per frame (assuming 60fps)
          Position.x[enemyEid] += (dx / len) * speed;
          Position.y[enemyEid] += (dy / len) * speed;
        } else {
          // Attack if cooldown allows
          const now = Date.now();
          const lastAttack = Combat.lastAttackTime[enemyEid] || 0;
          const attackSpeed = Combat.attackSpeed[enemyEid] || OSRS_TICK_MS * 4;
          if (now - lastAttack >= attackSpeed) {
            try {
              /**
               * Calculate OSRS-authentic hit and damage using real formulas.
               */
              const enemy = extractOsrsStats(enemyEid);
              const player = extractOsrsStats(nearestPlayer);
              // Use default values for multipliers and style bonuses for now
              const prayerMultiplier = 1.0;
              const styleBonus = 0;
              // Calculate max hit and accuracy
              const maxHit: number = calculateMaxHit(
                enemy.stats,
                enemy.equipment,
                prayerMultiplier,
                styleBonus
              );
              const accuracy: number = calculateAccuracy(
                enemy.stats,
                enemy.equipment,
                player.stats,
                player.equipment,
                prayerMultiplier,
                prayerMultiplier,
                styleBonus,
                styleBonus
              );
              // Simulate hit chance
              let dmg = 0;
              let hit = false;
              if (Math.random() < accuracy) {
                dmg = Math.floor(Math.random() * (maxHit + 1));
                hit = true;
              }
              Health.current[nearestPlayer] = Math.max(
                0,
                Health.current[nearestPlayer] - dmg
              );
              Combat.lastAttackTime[enemyEid] = now;
              // Emit combat event for UI/analytics
              gameEventEmitter.emitGameEvent(GameEventType.Combat, {
                attacker: enemyEid,
                defender: nearestPlayer,
                damage: dmg,
                hit,
                timestamp: now,
              });
            } catch (combatErr) {
              console.error("EnemyAISystem combat error:", combatErr);
            }
          }
        }
      }
    } catch (err) {
      console.error("EnemyAISystem error:", err);
    }
    return world;
  };
};

// Export CombatEvent for tests
export type { CombatEvent } from "../events/types";
