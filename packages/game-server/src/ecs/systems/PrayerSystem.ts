import { defineQuery, defineSystem } from "bitecs";
import type { CombatWorld } from "./CombatSystem";
import { Prayer } from "../components";

/**
 * ECS Prayer System
 * Handles prayer drain, activation, and integration with combat.
 *
 * - Drains prayer points based on active prayers and equipment bonus.
 * - Deactivates prayers when points reach zero.
 * - Updates drain timer per tick.
 *
 * Assumes prayer drain rates and bonuses are provided externally.
 */
export interface PrayerSystemOptions {
  getDrainRate: (activeMask: number) => number; // Returns drain rate (points/minute) for active prayers
  getPrayerBonus: (eid: number) => number; // Returns equipment prayer bonus for entity
  onPrayerDepleted?: (eid: number) => void; // Optional callback when prayer is depleted
}

const prayerQuery = defineQuery([Prayer]);

  return defineSystem((world: CombatWorld) => {
    const entities = prayerQuery(world);
    const delta = world.time?.delta ?? 0;
    for (const eid of entities) {
      const current = Prayer.current[eid];
      const activeMask = Prayer.activeMask[eid];
      if (current === 0 || activeMask === 0) continue;

      // Calculate drain rate (points/minute), adjust for equipment bonus
      const baseDrain = options.getDrainRate(activeMask);
      const prayerBonus = options.getPrayerBonus(eid);
      // Each +1 prayer bonus = +3.333% duration (see OSRS spec)
      const durationMultiplier = 1 + prayerBonus * 0.03333;
      const drainPerMinute = baseDrain / durationMultiplier;
      const drainPerMs = drainPerMinute / 60_000;

      // Update drain timer
      Prayer.drainTimer[eid] = (Prayer.drainTimer[eid] || 0) + delta;
      const drainAmount = Math.floor(Prayer.drainTimer[eid] * drainPerMs);
      if (drainAmount > 0) {
        Prayer.current[eid] = Math.max(0, current - drainAmount);
        Prayer.drainTimer[eid] -= drainAmount / drainPerMs;
        if (Prayer.current[eid] === 0) {
          Prayer.activeMask[eid] = 0; // Deactivate all prayers
          if (options.onPrayerDepleted) options.onPrayerDepleted(eid);
        }
      }
    }
    return world;
  });
};
