import { createWorld, addEntity, addComponent } from "bitecs";
import { Prayer } from "../../components";
import { createPrayerSystem } from "../PrayerSystem";
import { gameEventEmitter } from "../../../events/GameEventEmitter";
import {
  ExtendedGameEventType,
  type PrayerDepletedEvent,
} from "../PrayerSystem";
import { PRAYER_EFFECTS, Prayer as PrayerEnum } from "@runerogue/shared";
import type { CombatWorld } from "../CombatSystem";

/**
 * OSRS authentic tick and drain logic for PrayerSystem event tests.
 * - OSRS tick: 600ms
 * - Prayer drain rates: points per 3 seconds (see PRAYER_EFFECTS)
 */

describe("PrayerSystem event integration", () => {
  it("emits PrayerDepleted event when prayer points reach zero (OSRS authentic)", () => {
    /**
     * Test: PrayerDepleted event is emitted at the correct OSRS drain rate.
     * - THICK_SKIN: drainRate = 1/6 points per 3s
     * - OSRS tick: 600ms
     */ const world = createWorld() as CombatWorld;
    world.time = { delta: 600, elapsed: 0 };
    world.entitiesToRemove = new Set();
    world.room = {} as any;
    const eid = addEntity(world);

    // CRITICAL: Add the Prayer component to the entity first
    addComponent(world, Prayer, eid);

    Prayer.current[eid] = 2;
    Prayer.max[eid] = 2;
    Prayer.drainTimer[eid] = 0;
    Prayer.activeMask[eid] = 1; // THICK_SKIN
    const events: PrayerDepletedEvent[] = [];
    gameEventEmitter.on(ExtendedGameEventType.PrayerDepleted, (e) =>
      events.push(e)
    );
    const options = {
      // Convert OSRS drain rate (points/3s) to points/minute for system compatibility
      getDrainRate: () => PRAYER_EFFECTS[PrayerEnum.THICK_SKIN].drainRate * 20,
      getPrayerBonus: () => 0,
    };
    const system = createPrayerSystem(options);
    // Simulate until prayer is depleted (robust to timer rounding)
    let ticks = 0;
    const maxTicks = 1000;
    while (Prayer.current[eid] > 0 && ticks < maxTicks) {
      world.time.delta = 600;
      system(world);
      ticks++;
    }
    expect(Prayer.current[eid]).toBe(0);
    expect(events.length).toBe(1);
    expect(events[0]).toHaveProperty("eid", eid);
    expect(typeof events[0].timestamp).toBe("number");
  });
});
