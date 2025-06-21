import { defineQuery, defineSystem } from "bitecs";
import type { CombatWorld } from "./CombatSystem";
import { Prayer } from "../components";
import { gameEventEmitter, GameEventType } from "../../events/GameEventEmitter";

/**
 * ECS Prayer System
 * Handles prayer drain, activation, and integration with combat.
 *
 * - Drains prayer points based on active prayers and equipment bonus.
 * - Deactivates prayers when points reach zero.
 * - Updates drain timer per tick.
 *
 * **IMPORTANT**: Entities must have the Prayer component properly added using
 * `addComponent(world, Prayer, eid)` before setting Prayer properties. Simply
 * setting Prayer.field[eid] = value without calling addComponent first will
 * result in data not persisting correctly between system calls.
 *
 * Assumes prayer drain rates and bonuses are provided externally.
 */
export interface PrayerSystemOptions {
  getDrainRate: (activeMask: number) => number; // Returns drain rate (points/minute) for active prayers
  getPrayerBonus: (eid: number) => number; // Returns equipment prayer bonus for entity
  onPrayerDepleted?: (eid: number) => void; // Optional callback when prayer is depleted
}

// Optionally extend GameEventType and GameEventPayload for prayer events
export enum ExtendedGameEventType {
  PrayerDepleted = "prayerDepleted",
}

export interface PrayerDepletedEvent {
  eid: number;
  timestamp: number;
}

const prayerQuery = defineQuery([Prayer]);

export const createPrayerSystem = (options: PrayerSystemOptions) => {
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
          // Emit PrayerDepleted event for analytics/UI
          const event: PrayerDepletedEvent = {
            eid,
            timestamp: Date.now(),
          };
          gameEventEmitter.emit(ExtendedGameEventType.PrayerDepleted, event);
        }
      }
    }
    return world;
  });
};
