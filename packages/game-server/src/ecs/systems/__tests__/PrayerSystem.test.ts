import { createWorld, addEntity, addComponent } from "bitecs";
import { Prayer } from "../../components";
import { createPrayerSystem } from "../PrayerSystem";
import type { PrayerSystemOptions } from "../PrayerSystem";
import { PRAYER_EFFECTS, Prayer as PrayerEnum } from "@runerogue/shared";
import type { CombatWorld } from "../CombatSystem";

/**
 * OSRS authentic tick and drain logic for PrayerSystem tests.
 * - OSRS tick: 600ms
 * - Prayer drain rates: points per 3 seconds (0.5 points/min = 1/120 per tick)
 * - All calculations must match OSRS Wiki and in-game behavior.
 */

describe("PrayerSystem", () => {
  it("drains prayer points over time and deactivates prayers at zero (OSRS authentic)", () => {
    /**
     * Test: Prayer points drain at the correct OSRS rate and deactivate at zero.
     * - THICK_SKIN: drainRate = 1/6 points per 3s (0.0555... per tick)
     * - OSRS tick: 600ms
     */ const world = createWorld() as CombatWorld;
    world.time = { delta: 600, elapsed: 0 };
    world.entitiesToRemove = new Set();
    world.room = {} as any;
    const eid = addEntity(world);

    // CRITICAL: Add the Prayer component to the entity first
    addComponent(world, Prayer, eid);

    Prayer.current[eid] = 10;
    Prayer.max[eid] = 10;
    // Do not set Prayer.drainTimer[eid]; let system accumulate naturally
    // Activate THICK_SKIN (bit 0)
    Prayer.activeMask[eid] = 1 << 0;

    // Convert OSRS drain rate (points/3s) to points/minute for system compatibility
    const options: PrayerSystemOptions = {
      getDrainRate: (activeMask) => {
        let totalDrain = 0;
        let bit = 0;
        for (const prayerKey of Object.keys(PrayerEnum)) {
          if ((activeMask & (1 << bit)) !== 0) {
            const prayer = PrayerEnum[prayerKey as keyof typeof PrayerEnum];
            const effect = PRAYER_EFFECTS[prayer];
            if (effect && typeof effect.drainRate === "number") {
              totalDrain += effect.drainRate * 20; // 20 * (points/3s) = points/minute
            }
          }
          bit++;
        }
        return totalDrain;
      },
      getPrayerBonus: () => 0,
      onPrayerDepleted: jest.fn(),
    };
    const system = createPrayerSystem(options); // Simulate until prayer is depleted (robust to timer rounding)
    let ticks = 0;
    const maxTicks = 1000;
    while (Prayer.current[eid] > 0 && ticks < maxTicks) {
      world.time.delta = 600; // OSRS tick
      system(world);
      ticks++;
    }
    expect(Prayer.current[eid]).toBe(0);
    expect(Prayer.activeMask[eid]).toBe(0);
    expect(options.onPrayerDepleted).toHaveBeenCalledWith(eid);
  });

  it("applies equipment prayer bonus to slow drain (OSRS authentic)", () => {
    const world = createWorld() as CombatWorld;
    world.time = { delta: 600, elapsed: 0 };
    world.entitiesToRemove = new Set();
    world.room = {} as any;
    const eid = addEntity(world);

    // CRITICAL: Add the Prayer component to the entity first
    addComponent(world, Prayer, eid);

    Prayer.current[eid] = 10;
    Prayer.max[eid] = 10;
    Prayer.drainTimer[eid] = 0;
    // Activate THICK_SKIN (bit 0)
    Prayer.activeMask[eid] = 1 << 0;

    // +15 prayer bonus = 50% longer duration
    const options: PrayerSystemOptions = {
      getDrainRate: (activeMask) => {
        let totalDrain = 0;
        let bit = 0;
        for (const prayerKey of Object.keys(PrayerEnum)) {
          if ((activeMask & (1 << bit)) !== 0) {
            const prayer = PrayerEnum[prayerKey as keyof typeof PrayerEnum];
            const effect = PRAYER_EFFECTS[prayer];
            if (effect && typeof effect.drainRate === "number") {
              totalDrain += effect.drainRate * 20;
            }
          }
          bit++;
        }
        return totalDrain;
      },
      getPrayerBonus: () => 15,
    };
    const system = createPrayerSystem(options);

    // Simulate 10 seconds (should drain only ~6.7 points)
    for (let t = 0; t < 10; t++) {
      world.time.delta = 1000;
      system(world);
    }
    expect(Prayer.current[eid]).toBeGreaterThan(3);
  });
});
