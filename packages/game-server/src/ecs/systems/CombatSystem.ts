/**
 * @file CombatSystem.ts
 * @description System for handling combat between entities.
 * @author RuneRogue Development Team
 */

import { defineQuery, defineSystem, type IWorld } from "bitecs";
import { calculateMaxHit, calculateAccuracy } from "@runerogue/osrs-data";
import { Prayer as PrayerComponent } from "../components/Prayer";
import {
  PRAYER_EFFECTS,
  Prayer as PrayerEnum,
  CombatStyle,
} from "@runerogue/shared";
import { Position, Health, Target, Combat } from "../components";
import type { GameRoom } from "../../rooms/GameRoom";
import { gameEventEmitter, GameEventType } from "../../events/GameEventEmitter";
import type { CombatEvent } from "../../events/types";

// Extend IWorld to include our custom properties
export interface CombatWorld extends IWorld {
  room: GameRoom;
  time: {
    delta: number;
    elapsed: number;
  };
  entitiesToRemove: Set<number>;
}

const combatQuery = defineQuery([Position, Health, Target, Combat]);
const targetableQuery = defineQuery([Position, Health]);

/**
 * Calculate distance between two points
 * @param x1 - X coordinate of first point
 * @param y1 - Y Coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y Coordinate of second point
 * @returns Distance in pixels
 */
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Create the combat system that handles OSRS-authentic combat calculations
 * @param room - The game room instance for broadcasting events
 * @returns The combat system function
 */
export const createCombatSystem = (room: GameRoom) => {
  return defineSystem((world: CombatWorld) => {
    const entities = combatQuery(world);
    const currentTime = world.time.elapsed;

    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      const targetEid = Target.eid[eid];

      // Verify target exists and is targetable
      if (!targetEid || !targetableQuery(world).includes(targetEid)) {
        continue;
      }

      // Check distance (1 tile = 32 pixels in our game)
      const distance = getDistance(
        Position.x[eid],
        Position.y[eid],
        Position.x[targetEid],
        Position.y[targetEid]
      );

      if (distance > 40) continue; // Slightly more than 1 tile for melee

      // Check attack timer (stored in milliseconds)
      const lastAttackTime = Combat.lastAttackTime[eid] || 0;
      const attackSpeed = Combat.attackSpeed[eid] || 2400; // 4-tick default

      if (currentTime - lastAttackTime < attackSpeed) continue;

      // Update attack timer
      Combat.lastAttackTime[eid] = currentTime;

      /**
       * Helper to decode the active prayer bitmask and sum the OSRS-accurate multipliers for a stat.
       * @param {number} activeMask - Bitmask of active prayers
       * @param {keyof PrayerEffect} bonusKey - The stat bonus to sum (e.g., 'attackBonus')
       * @returns {number} The total multiplier (e.g., 1.15 for +15%)
       */
      function getPrayerMultiplier(
        activeMask: number,
        bonusKey: keyof (typeof PRAYER_EFFECTS)[PrayerEnum.THICK_SKIN]
      ): number {
        let total = 0;
        let bit = 0;
        for (const prayerKey of Object.keys(PrayerEnum)) {
          if ((activeMask & (1 << bit)) !== 0) {
            const prayer = PrayerEnum[prayerKey as keyof typeof PrayerEnum];
            const effect = PRAYER_EFFECTS[prayer];
            if (effect && typeof effect[bonusKey] === "number") {
              total += effect[bonusKey] as number;
            }
          }
          bit++;
        }
        return 1 + total;
      }

      // ECS: Read all stats and bonuses from components
      const attackerActiveMask = PrayerComponent.activeMask?.[eid] ?? 0;
      const defenderActiveMask = PrayerComponent.activeMask?.[targetEid] ?? 0;

      // OSRS: Calculate prayer multipliers
      const attackerAttackPrayer = getPrayerMultiplier(
        attackerActiveMask,
        "attackBonus"
      );
      const attackerStrengthPrayer = getPrayerMultiplier(
        attackerActiveMask,
        "strengthBonus"
      );
      const attackerDefencePrayer = getPrayerMultiplier(
        attackerActiveMask,
        "defenceBonus"
      );
      const defenderDefencePrayer = getPrayerMultiplier(
        defenderActiveMask,
        "defenceBonus"
      );

      // TODO: Support for attack style (currently hardcoded to AGGRESSIVE)
      const style = CombatStyle.AGGRESSIVE;
      const styleBonus = 3; // AGGRESSIVE = +3 strength

      // ECS: Read equipment bonuses
      const attackerEquipment = {
        attackBonus: Combat.attackBonus[eid] || 0,
        strengthBonus: Combat.strengthBonus[eid] || 0,
        defenceBonus: Combat.defenceBonus[eid] || 0,
        prayerBonus: Combat.prayerBonus[eid] || 0,
      };
      const defenderEquipment = {
        attackBonus: Combat.attackBonus[targetEid] || 0,
        strengthBonus: Combat.strengthBonus[targetEid] || 0,
        defenceBonus: Combat.defenceBonus[targetEid] || 0,
        prayerBonus: Combat.prayerBonus[targetEid] || 0,
      };

      // ECS: Read base stats
      const attackerStats = {
        attack: Combat.attack[eid] || 1,
        strength: Combat.strength[eid] || 1,
        defence: Combat.defence[eid] || 1,
        hitpoints: Health.current[eid] || 10,
        prayer: 1, // Not used in OSRS max hit/accuracy, but required by interface
      };
      const defenderStats = {
        attack: Combat.attack[targetEid] || 1,
        strength: Combat.strength[targetEid] || 1,
        defence: Combat.defence[targetEid] || 1,
        hitpoints: Health.current[targetEid] || 10,
        prayer: 1,
      };

      // Calculate hit chance and damage using OSRS formulas
      const accuracy = calculateAccuracy(
        attackerStats,
        attackerEquipment,
        defenderStats,
        defenderEquipment,
        attackerAttackPrayer,
        defenderDefencePrayer,
        styleBonus,
        0 // defender style bonus (not used here)
      );
      const maxHit = calculateMaxHit(
        attackerStats,
        attackerEquipment,
        attackerStrengthPrayer,
        styleBonus
      );

      // Roll for hit
      if (Math.random() < accuracy) {
        const damage = Math.floor(Math.random() * (maxHit + 1));
        Health.current[targetEid] = Math.max(
          0,
          Health.current[targetEid] - damage
        );

        // Emit damage event for client feedback
        room.broadcast("damage", { target: targetEid, damage, attacker: eid });

        // Emit OSRS-authentic CombatEvent for analytics/UI
        const event: CombatEvent = {
          attacker: eid,
          defender: targetEid,
          damage,
          hit: true,
          timestamp: Date.now(),
        };
        gameEventEmitter.emitGameEvent(GameEventType.Combat, event);

        if (Health.current[targetEid] <= 0) {
          world.entitiesToRemove.add(targetEid);
        }
      } else {
        // Miss
        room.broadcast("damage", {
          target: targetEid,
          damage: 0,
          attacker: eid,
        });
        // Emit miss event
        const event: CombatEvent = {
          attacker: eid,
          defender: targetEid,
          damage: 0,
          hit: false,
          timestamp: Date.now(),
        };
        gameEventEmitter.emitGameEvent(GameEventType.Combat, event);
      }
    }

    return world;
  });
};
