/**
 * @file CombatSystem.ts
 * @description System for handling combat between entities.
 * @author RuneRogue Development Team
 */

import { defineQuery, defineSystem, type IWorld } from "bitecs";
import { calculateMaxHit, calculateAccuracy } from "@runerogue/osrs-data";
import { Position, Health, Target, Combat } from "../components";
import type { GameRoom } from "../../rooms/GameRoom";

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
 * @param y1 - Y coordinate of first point
 * @param x2 - X coordinate of second point
 * @param y2 - Y coordinate of second point
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

      // Calculate combat using OSRS formulas
      const attackerStats = {
        attackLevel: Combat.attack[eid] || 1,
        strengthLevel: Combat.strength[eid] || 1,
        defenceLevel: Combat.defence[eid] || 1,
        attackBonus: 0, // TODO: Equipment bonuses
        strengthBonus: 0,
        defenceBonus: 0,
        attackStyle: "aggressive" as const,
        combatType: "melee" as const,
        prayers: [] as string[],
      };

      const defenderStats = {
        defenceLevel: Combat.defence[targetEid] || 1,
        defenceBonus: 0, // TODO: Equipment bonuses
        prayers: [] as string[],
      };

      // Calculate hit chance and damage
      const accuracy = calculateAccuracy(attackerStats, defenderStats);
      const maxHit = calculateMaxHit(attackerStats);

      // Roll for hit
      if (Math.random() < accuracy) {
        const damage = Math.floor(Math.random() * (maxHit + 1));
        Health.current[targetEid] = Math.max(
          0,
          Health.current[targetEid] - damage
        );

        // Emit damage event for client feedback
        room.broadcast("damage", { target: targetEid, damage, attacker: eid });

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
      }
    }

    return world;
  });
};
